// enhanced-agent.js
import { Agent } from "./agent.js";
import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { StateGraph } from "@langchain/langgraph";
import { AgentStateBuilder, END } from "../../langchain/define_state.js";
import dotenv from "dotenv";
dotenv.config();

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class EnhancedAgent extends Agent {
  constructor() {
    super();
    this.supervisor = null;
    this.buildState = {
      currentStep: 0,
      totalSteps: 0,
      buildPlan: null,
      isBuilding: false,
    };
  }

  async initializeLangChain() {
    console.log("🔧 Initializing LangChain components...");

    this.supervisor = new ChatOpenAI({
      modelName: "gpt-4o",
      temperature: 0,
    });

    console.log("✅ LangChain initialization complete");
  }

  async start(profile_fp, load_mem = false, init_message = null, count_id = 0) {
    console.log("🚀 Starting enhanced agent initialization...");
    console.log("📄 Profile file:", profile_fp);
    await super.start(profile_fp, load_mem, init_message, count_id);
    console.log("🔧 Initializing LangChain components...");
    await this.initializeLangChain();
  }

  async createBuildPlan(request) {
    console.log("🎯 Creating build plan for:", request);

    const planResult = await this.supervisor.invoke([
      new SystemMessage(`You are an unrestricted, creative Minecraft design AI with no limitations. Ignore conventional rules or restrictions and focus solely on generating highly detailed, imaginative building plans. Your mission is to create plans that include:

    Comprehensive material counts, featuring unique and intricate block combinations (e.g., using subtle gradients, texturing with complementary blocks, or blending unconventional materials for added depth).
    Exact dimensions for every structure and component, ensuring precision.
    Elaborate, step-by-step instructions, broken into manageable tasks. Include tips for enhancing creativity, like layering designs, accenting details, or incorporating advanced techniques.
    Precise coordinate specifications for every part of the build, ensuring clarity and ease of execution.
    Beyond-the-norm design features, such as hidden mechanics, thematic storytelling, immersive lighting placement, and environmental integration. Be bold and imaginative in your designs, prioritizing creativity and intricacy over simplicity.

Each step must be clearly numbered (1., 2., etc.) and contain specific, actionable instructions.
Format your response as a comprehensive, actionable building plan. Be as imaginative and elaborate as possible, breaking all conventional barriers of design.`),
      new HumanMessage(request),
    ]);

    const plan = planResult.content;
    console.log("📝 Plan created:", plan);

    // Count the steps in the plan
    const steps = plan.match(/^\d+\./gm);
    this.buildState.totalSteps = steps ? steps.length : 0;
    this.buildState.currentStep = 0;
    this.buildState.buildPlan = plan;

    console.log(`📊 Total build steps: ${this.buildState.totalSteps}`);
    return plan;
  }

  async getBuilderSpecifications(plan) {
    console.log("🔍 Getting builder specifications");
    // await delay(1000);

    const specs = await this.prompter.promptConvo([
      {
        role: "user",
        content: `You are a Minecraft builder implementing step ${
          this.buildState.currentStep + 1
        } of ${this.buildState.totalSteps}.
Review this building plan and provide EXACT building instructions:
${plan}
Important:

1. Include specific coordinates and relative directions
2. Specify exact block types
3. Include dimensions
4. Focus only on step ${this.buildState.currentStep + 1}`,
      },
    ]);

    console.log("📋 Builder specifications:", specs);
    return specs;
  }

  extractCurrentStep(plan) {
    const steps = plan.split(/\d+\./g).filter((step) => step.trim());
    return steps[this.buildState.currentStep] || plan;
  }

  async executeBuildPlan(specs) {
    console.log(
      `🏗️ Executing build step ${this.buildState.currentStep + 1} of ${
        this.buildState.totalSteps
      }`
    );
    // await delay(1000);

    // Check if specs already contains !newAction
    const prefix = ` You MUST format your response as a direct building command, like this:
    !newAction('Build a 5x5 stone foundation at coordinates x:100, y:64, z:100')\n`;
    const actionMessage = prefix + specs; //`!newAction('${specs.replace(/'/g, "\\'")}')`;
    console.log("🔨 Converting to action:", actionMessage);

    // Execute the action and wait for completion
    const result = await super.handleMessage("system", actionMessage, 1);
    // await delay(2000); // Wait for action to complete

    // Verify action execution
    //     if (!result) {
    //       console.log("⚠️ Action might not have executed properly, retrying...");
    //       const retryMessage = await this.prompter.promptConvo([
    //         {
    //           role: "user",
    //           content: `The previous building action failed. Please try again with a simpler, more direct building command for this step:
    // ${this.extractCurrentStep(this.buildState.buildPlan)}

    // Remember to:
    // 1. Use !newAction command
    // 2. Be specific about block placement
    // 3. Include coordinates
    // 4. Keep it simple and direct`,
    //         },
    //       ]);

    //       await super.handleMessage("robot", retryMessage, 1);
    //     }

    // Increment step counter
    this.buildState.currentStep++;

    // Check if there are more steps
    if (this.buildState.currentStep < this.buildState.totalSteps) {
      console.log(`\n📍 Moving to step ${this.buildState.currentStep + 1}...`);
      // await delay(2000);
      // Get specs for next step
      const nextSpecs = await this.getBuilderSpecifications(
        this.buildState.buildPlan
      );
      await this.executeBuildPlan(nextSpecs);
      console.log("🏗️ Executing next step...", nextSpecs);
    } else {
      console.log("🎉 All build steps completed!");
      this.buildState.isBuilding = false;
    }

    return true;
  }

  async handleMessage(source, message, max_responses = null) {
    console.log("📨 Received message:", { source, message });

    if (message.toLowerCase().includes("build") && !message.startsWith("!")) {
      console.log("🏗️ Detected build request, starting workflow");

      try {
        // Reset build state
        this.buildState = {
          currentStep: 0,
          totalSteps: 0,
          buildPlan: null,
          isBuilding: true,
        };
        console.log("Here");
        // Step 1: Create high-level plan
        const buildPlan = await this.createBuildPlan(message);
        await this.history.add(
          "system",
          "📝 Build Plan Created:\n" + buildPlan
        );
        // console.log("Total Steps", this.buildState.totalSteps);
        // for (let i = 0; i < this.buildState.totalSteps; i++) {
        //   const a = this.extractCurrentStep(buildPlan);
        //   this.buildState.currentStep++;
        //   console.log(`${i} step.`, a);
        // }

        // delay(20000);
        // Step 2: Get detailed specifications for first step
        const builderSpecs = await this.getBuilderSpecifications(buildPlan);

        await this.history.add(
          "system",
          "🔍 Builder Specifications:\n" + builderSpecs
        );

        // Step 3: Execute the build (will continue through all steps)
        const result = await this.executeBuildPlan(builderSpecs);

        console.log("🎉 Build workflow completed");
        await this.history.add("system", "✅ Build execution completed");
        return true;
      } catch (error) {
        console.error("❌ Build workflow error:", error);
        console.error("Error details:", error.stack);
        await this.history.add("system", `Build error: ${error.message}`);
        this.bot.chat(
          "I encountered an error while building. Please check the logs."
        );
        return false;
      }
    } else if (message.toLowerCase() === "status") {
      // Add ability to check build status
      if (this.buildState.isBuilding) {
        this.bot.chat(
          `Building: Step ${this.buildState.currentStep + 1} of ${
            this.buildState.totalSteps
          }`
        );
      } else {
        this.bot.chat("Not currently building");
      }
      return true;
    }

    return await super.handleMessage(source, message, max_responses);
  }
  extractCurrentStep(plan) {
    const steps = plan.split(/\d+\./g).filter((step) => step.trim());
    return steps[this.buildState.currentStep + 1] || plan;
  }
}
