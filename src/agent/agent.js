import { History } from "./history.js";
import { Coder } from "./coder.js";
import { Prompter } from "./prompter.js";
import { initModes } from "./modes.js";
import { initBot } from "../utils/mcdata.js";
import {
  containsCommand,
  commandExists,
  executeCommand,
  truncCommandMessage,
  isAction,
} from "./commands/index.js";
import { ActionManager } from "./action_manager.js";
import { NPCContoller } from "./npc/controller.js";
import { MemoryBank } from "./memory_bank.js";
import { SelfPrompter } from "./self_prompter.js";
import {
  handleTranslation,
  handleEnglishTranslation,
} from "../utils/translator.js";
import { addViewer } from "./viewer.js";
import settings from "../../settings.js";
import { cpSync } from "fs";

export class Agent {
  async start(profile_fp, load_mem = false, init_message = null, count_id = 0) {
    try {
      // Add validation for profile_fp
      if (!profile_fp) {
        throw new Error("No profile filepath provided");
      }

      console.log("Starting agent initialization with profile:", profile_fp);

      // Initialize components with more detailed error handling
      try {
        console.log("Initializing action manager...");
        this.actions = new ActionManager(this);
        console.log("Initializing prompter...");
        this.prompter = new Prompter(this, profile_fp);
        this.name = this.prompter.getName();
        console.log("Initializing history...");
        this.history = new History(this);
        console.log("Initializing coder...");
        this.coder = new Coder(this);
        console.log("Initializing npc controller...");
        this.npc = new NPCContoller(this);
        console.log("Initializing memory bank...");
        this.memory_bank = new MemoryBank();
        console.log("Initializing self prompter...");
        this.self_prompter = new SelfPrompter(this);
      } catch (error) {
        throw new Error(
          `Failed to initialize agent components: ${error.message || error}`
        );
      }

      try {
        console.log("Initializing examples...");
        await this.prompter.initExamples();
      } catch (error) {
        throw new Error(
          `Failed to initialize examples: ${error.message || error}`
        );
      }

      console.log("Logging into minecraft...");
      try {
        this.bot = initBot(this.name);
      } catch (error) {
        throw new Error(
          `Failed to initialize Minecraft bot: ${error.message || error}`
        );
      }
      console.log("Bot initialized.");
      initModes(this);
      console.log("Modes initialized.");
      let save_data = null;
      if (load_mem) {
        try {
          save_data = this.history.load();
        } catch (error) {
          console.error("Failed to load history:", error);
          // Don't throw here, continue without history
        }
      }
      console.log("Bot logging in...");
      // Return a promise that resolves when spawn is complete
      return new Promise((resolve, reject) => {
        // Add timeout to prevent hanging
        const spawnTimeout = setTimeout(() => {
          reject(new Error("Bot spawn timed out after 30 seconds"));
        }, 40000);

        this.bot.once("error", (error) => {
          clearTimeout(spawnTimeout);
          console.error("Bot encountered error:", error);
          reject(error);
        });

        this.bot.on("login", () => {
          console.log("Logged in!");
        });

        this.bot.once("spawn", async () => {
          try {
            clearTimeout(spawnTimeout);
            addViewer(this.bot, count_id);

            // wait for a bit so stats are not undefined
            await new Promise((resolve) => setTimeout(resolve, 1000));

            console.log(`${this.name} spawned.`);
            this.clearBotLogs();

            this._setupEventHandlers(save_data, init_message);
            this.startEvents();
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      });
    } catch (error) {
      // Ensure we're not losing error details
      console.error("Agent start failed with error:", {
        message: error.message || "No error message",
        stack: error.stack || "No stack trace",
        error: error,
      });
      throw error; // Re-throw with preserved details
    }
  }

  // Split out event handler setup for clarity
  _setupEventHandlers(save_data, init_message) {
    const ignore_messages = [
      "Set own game mode to",
      "Set the time to",
      "Set the difficulty to",
      "Teleported ",
      "Set the weather to",
      "Gamerule ",
    ];

    const eventname = settings.profiles.length > 1 ? "whisper" : "chat";
    this.bot.on(eventname, async (username, message) => {
      try {
        if (username === this.name) return;

        if (ignore_messages.some((m) => message.startsWith(m))) return;

        this.shut_up = false;
        await this.handleMessage(username, message);
      } catch (error) {
        console.error("Error handling message:", error);
      }
    });

    // Set up auto-eat
    this.bot.autoEat.options = {
      priority: "foodPoints",
      startAt: 14,
      bannedFood: [
        "rotten_flesh",
        "spider_eye",
        "poisonous_potato",
        "pufferfish",
        "chicken",
      ],
    };

    // Handle startup conditions
    this._handleStartupConditions(save_data, init_message);
  }

  async _handleStartupConditions(save_data, init_message) {
    try {
      if (save_data?.self_prompt) {
        let prompt = save_data.self_prompt;
        // add initial message to history
        this.history.add("system", prompt);
        await this.self_prompter.start(prompt);
      } else if (init_message) {
        await this.handleMessage("system", init_message, 2);
      } else {
        const translation = await handleTranslation(
          "Hello world! I am " + this.name
        );
        this.bot.chat(translation);
        this.bot.emit("finished_executing");
      }
    } catch (error) {
      console.error("Error handling startup conditions:", error);
      throw error;
    }
  }

  requestInterrupt() {
    this.bot.interrupt_code = true;
    this.bot.collectBlock.cancelTask();
    this.bot.pathfinder.stop();
    this.bot.pvp.stop();
  }

  clearBotLogs() {
    this.bot.output = "";
    this.bot.interrupt_code = false;
  }

  async cleanChat(message, translate_up_to = -1) {
    let to_translate = message;
    let remainging = "";
    if (translate_up_to != -1) {
      to_translate = to_translate.substring(0, translate_up_to);
      remainging = message.substring(translate_up_to);
    }
    message = (await handleTranslation(to_translate)).trim() + " " + remainging;
    // newlines are interpreted as separate chats, which triggers spam filters. replace them with spaces
    message = message.replaceAll("\n", " ");
    return this.bot.chat(message);
  }

  shutUp() {
    this.shut_up = true;
    if (this.self_prompter.on) {
      this.self_prompter.stop(false);
    }
  }

  async handleMessage(source, message, max_responses = null) {
    let used_command = false;
    if (max_responses === null) {
      max_responses =
        settings.max_commands === -1 ? Infinity : settings.max_commands;
    }
    if (max_responses === -1) {
      max_responses = Infinity;
    }

    let self_prompt = source === "system" || source === this.name;

    // First check for user commands
    if (!self_prompt) {
      const user_command_name = containsCommand(message);
      if (user_command_name) {
        if (!commandExists(user_command_name)) {
          this.bot.chat(`Command '${user_command_name}' does not exist.`);
          return false;
        }
        this.bot.chat(`*${source} used ${user_command_name.substring(1)}*`);
        if (user_command_name === "!newAction") {
          // all user initiated commands are ignored by the bot except for this one
          // add the preceding message to the history to give context for newAction
          this.history.add(source, message);
        }
        let execute_res = await executeCommand(this, message);
        if (execute_res) this.cleanChat(execute_res);
        return true;
      }
    }

    // Now translate the message
    message = await handleEnglishTranslation(message);
    console.log("received message from", source, ":", message);

    // Do self prompting
    const checkInterrupt = () =>
      this.self_prompter.shouldInterrupt(self_prompt) || this.shut_up;

    let behavior_log = this.bot.modes.flushBehaviorLog();
    if (behavior_log.trim().length > 0) {
      const MAX_LOG = 500;
      if (behavior_log.length > MAX_LOG) {
        behavior_log =
          "..." + behavior_log.substring(behavior_log.length - MAX_LOG);
      }
      behavior_log =
        "Recent behaviors log: \n" +
        behavior_log.substring(behavior_log.indexOf("\n"));
      await this.history.add("system", behavior_log);
    }

    // Handle other user messages
    await this.history.add(source, message);
    this.history.save();

    if (!self_prompt && this.self_prompter.on)
      // message is from user during self-prompting
      max_responses = 1; // force only respond to this message, then let self-prompting take over

    for (let i = 0; i < max_responses; i++) {
      if (checkInterrupt()) break;
      let history = this.history.getHistory();
      console.log("Prompting conversation with history:", history);
      let res = await this.prompter.promptConvo(history);

      let command_name = containsCommand(res);
      console.log("HIIIIII", command_name, res);
      if (command_name) {
        // contains query or command
        console.log(`Full response: ""${res}""`);
        res = truncCommandMessage(res); // everything after the command is ignored
        this.history.add(this.name, res);
        if (!commandExists(command_name)) {
          this.history.add("system", `Command ${command_name} does not exist.`);
          console.warn("Agent hallucinated command:", command_name);
          continue;
        }
        if (command_name === "!stopSelfPrompt" && self_prompt) {
          this.history.add(
            "system",
            `Cannot stopSelfPrompt unless requested by user.`
          );
          continue;
        }

        if (checkInterrupt()) break;
        this.self_prompter.handleUserPromptedCmd(
          self_prompt,
          isAction(command_name)
        );

        if (settings.verbose_commands) {
          this.cleanChat(res, res.indexOf(command_name));
        } else {
          // only output command name
          let pre_message = res.substring(0, res.indexOf(command_name)).trim();
          let chat_message = `*used ${command_name.substring(1)}*`;
          if (pre_message.length > 0)
            chat_message = `${pre_message}  ${chat_message}`;
          this.cleanChat(res);
        }
        console.log("Agent used:", command_name);
        console.log("Agent response:", res);
        let execute_res = await executeCommand(this, res);

        console.log("Agent executed:", command_name, "and got:", execute_res);
        used_command = true;

        if (execute_res) this.history.add("system", execute_res);
        else break;
      } else {
        // conversation response
        this.history.add(this.name, res);
        this.cleanChat(res);
        console.log("Purely conversational response:", res);
        break;
      }
      this.history.save();
    }

    this.bot.emit("finished_executing");
    return used_command;
  }

  startEvents() {
    // Custom events
    this.bot.on("time", () => {
      if (this.bot.time.timeOfDay == 0) this.bot.emit("sunrise");
      else if (this.bot.time.timeOfDay == 6000) this.bot.emit("noon");
      else if (this.bot.time.timeOfDay == 12000) this.bot.emit("sunset");
      else if (this.bot.time.timeOfDay == 18000) this.bot.emit("midnight");
    });

    let prev_health = this.bot.health;
    this.bot.lastDamageTime = 0;
    this.bot.lastDamageTaken = 0;
    this.bot.on("health", () => {
      if (this.bot.health < prev_health) {
        this.bot.lastDamageTime = Date.now();
        this.bot.lastDamageTaken = prev_health - this.bot.health;
      }
      prev_health = this.bot.health;
    });
    // Logging callbacks
    this.bot.on("error", (err) => {
      console.error("Error event!", err);
    });
    this.bot.on("end", (reason) => {
      console.warn("Bot disconnected! Killing agent process.", reason);
      this.cleanKill("Bot disconnected! Killing agent process.");
    });
    this.bot.on("death", () => {
      this.actions.cancelResume();
      this.actions.stop();
    });
    this.bot.on("kicked", (reason) => {
      console.warn("Bot kicked!", reason);
      this.cleanKill("Bot kicked! Killing agent process.");
    });
    this.bot.on("messagestr", async (message, _, jsonMsg) => {
      if (
        jsonMsg.translate &&
        jsonMsg.translate.startsWith("death") &&
        message.startsWith(this.name)
      ) {
        console.log("Agent died: ", message);
        let death_pos = this.bot.entity.position;
        this.memory_bank.rememberPlace(
          "last_death_position",
          death_pos.x,
          death_pos.y,
          death_pos.z
        );
        let death_pos_text = null;
        if (death_pos) {
          death_pos_text = `x: ${death_pos.x.toFixed(
            2
          )}, y: ${death_pos.y.toFixed(2)}, z: ${death_pos.x.toFixed(2)}`;
        }
        let dimention = this.bot.game.dimension;
        this.handleMessage(
          "system",
          `You died at position ${
            death_pos_text || "unknown"
          } in the ${dimention} dimension with the final message: '${message}'. Your place of death is saved as 'last_death_position' if you want to return. Previous actions were stopped and you have respawned.`
        );
      }
    });
    this.bot.on("idle", () => {
      this.bot.clearControlStates();
      this.bot.pathfinder.stop(); // clear any lingering pathfinder
      this.bot.modes.unPauseAll();
      this.actions.resumeAction();
    });

    // Init NPC controller
    this.npc.init();

    // This update loop ensures that each update() is called one at a time, even if it takes longer than the interval
    const INTERVAL = 300;
    let last = Date.now();
    setTimeout(async () => {
      while (true) {
        let start = Date.now();
        await this.update(start - last);
        let remaining = INTERVAL - (Date.now() - start);
        if (remaining > 0) {
          await new Promise((resolve) => setTimeout(resolve, remaining));
        }
        last = start;
      }
    }, INTERVAL);

    this.bot.emit("idle");
  }

  async update(delta) {
    await this.bot.modes.update();
    await this.self_prompter.update(delta);
  }

  isIdle() {
    return !this.actions.executing && !this.coder.generating;
  }

  cleanKill(msg = "Killing agent process...") {
    this.history.add("system", msg);
    this.bot.chat("Goodbye world.");
    this.history.save();
    process.exit(1);
  }
}