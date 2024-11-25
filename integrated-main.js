// integrated-main.js
import { AgentProcess } from "./src/process/agent-process.js";
import { graph } from "./langchain/workflow.js";
import settings from "./settings.js";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { HumanMessage } from "@langchain/core/messages";
import { builderProfiles, systemConfig } from "./builder-profiles.js";
import path from "path";

class BuilderAgent extends AgentProcess {
  constructor(builderType) {
    super();
    this.builderType = builderType;
    this.profile = builderProfiles[builderType];
  }

  async handleBuildRequest(request) {
    const streamResults = graph.stream(
      {
        messages: [
          new HumanMessage({
            content: request,
          }),
        ],
      },
      { recursionLimit: 100 }
    );

    for await (const output of await streamResults) {
      if (!output?.__end__) {
        if (output.supervisor) {
          await this.handleSupervisorOutput(output.supervisor);
        } else if (
          output.foundation_builder ||
          output.wall_builder ||
          output.roof_builder
        ) {
          await this.handleBuilderOutput(output);
        }
      }
    }
  }

  async handleSupervisorOutput(supervisorOutput) {
    const messages = [
      {
        role: "user",
        content: supervisorOutput.messages[0].content,
      },
    ];

    await this.agent.prompter.promptConvo(messages);
  }

  async handleBuilderOutput(builderOutput) {
    const builder =
      builderOutput.foundation_builder ||
      builderOutput.wall_builder ||
      builderOutput.roof_builder;

    const messages = [
      {
        role: "user",
        content: builder.messages[0].content,
      },
    ];

    await this.agent.prompter.promptCoding(messages);
  }
}

function parseArguments() {
  return yargs(hideBin(process.argv))
    .option("builderType", {
      type: "string",
      choices: Object.keys(builderProfiles),
      describe: "Type of builder agent",
      required: true,
    })
    .help()
    .alias("help", "h")
    .parse();
}

async function main() {
  const args = parseArguments();
  const { load_memory, init_message } = systemConfig.defaultSettings;

  // Get the correct profile based on builder type
  const profile = builderProfiles[args.builderType];
  if (!profile) {
    throw new Error(`Invalid builder type: ${args.builderType}`);
  }

  // Create builder agent with correct profile
  const builder = new BuilderAgent(args.builderType);
  await builder.start(profile.profile, load_memory, init_message, 0);

  console.log(`Started ${profile.name} with profile: ${profile.profile}`);
  return builder;
}

// Start the integrated system
try {
  const builder = await main();

  // Example build request handler
  process.on("message", async (message) => {
    if (
      message.type === systemConfig.communication.messageTypes.BUILD_REQUEST
    ) {
      await builder.handleBuildRequest(message.request);
    }
  });

  console.log(`${builder.profile.name} ready to accept build requests`);
} catch (error) {
  console.error("An error occurred:", error);
  process.exit(1);
}

// Handle process termination
process.on("SIGINT", () => {
  console.log("Shutting down integrated building system...");
  process.exit(0);
});
