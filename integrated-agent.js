// integrated-agent.js
import { Agent } from "./src/agent/agent.js";
import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { StateGraph } from "@langchain/langgraph";
import { AgentState } from "./langchain/define_state.js";
import yargs from "yargs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

class IntegratedBuildAgent extends Agent {
  constructor(builderType) {
    super();
    this.builderType = builderType;
    this.supervisorChain = null;
  }

  async initializeSupervisor() {
    // Create LangChain supervisor with access to Mindcraft capabilities
    const supervisorPrompt = `You are an architectural supervisor with access to Mindcraft building capabilities.
When planning builds:
1. Break down the request into detailed components
2. For each component:
   - Specify exact dimensions, materials, and positioning
   - Consider Mindcraft's building mechanics and limitations
   - Include coordinates and orientation
3. Coordinate with specialized builders for detailed implementation
4. Monitor progress and adjust plans as needed

Available builders: builder
Available building skills: ${await this.getSkillDocs()}`;

    this.supervisorChain = new ChatOpenAI({
      modelName: "o1-mini",
      temperature: 0.1,
      systemMessage: supervisorPrompt,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
  }

  async getSkillDocs() {
    // Get building capabilities from Mindcraft
    const messages = [
      {
        role: "system",
        content: "List available building skills and capabilities",
      },
    ];
    const response = await this.prompter.promptConvo(messages);
    return response;
  }

  async handleBuildRequest(request) {
    // Initial planning phase with LangChain supervisor
    const planResult = await this.supervisorChain.invoke([
      new SystemMessage("Create a detailed building plan."),
      new HumanMessage(request),
    ]);

    // Create build workflow
    const workflow = new StateGraph(AgentState)
      .addNode("planning", async (state) => {
        // Get detailed specifications from builders
        const builderSpecs = await this.getBuilderSpecifications(
          planResult.content
        );
        return {
          messages: [new HumanMessage(builderSpecs)],
          next: "execution",
        };
      })
      .addNode("execution", async (state) => {
        // Execute build with Mindcraft capabilities
        return await this.executeBuild(state.messages[0].content);
      });

    workflow.addEdge("planning", "execution");
    workflow.setEntryPoint("planning");

    const graph = workflow.compile();

    // Execute the workflow
    const result = await graph.invoke({
      messages: [new HumanMessage(request)],
    });

    return result;
  }

  async getBuilderSpecifications(plan) {
    // Get detailed specifications from each relevant builder
    const builderTypes = ["foundation", "wall", "roof"];
    let detailedSpecs = "";

    for (const type of builderTypes) {
      if (plan.toLowerCase().includes(type)) {
        const messages = [
          {
            role: "user",
            content: `Provide detailed building specifications for the ${type} component of this plan: ${plan}`,
          },
        ];

        const builderResponse = await this.prompter.promptCoding(messages);
        detailedSpecs += `\n${type.toUpperCase()} SPECIFICATIONS:\n${builderResponse}`;
      }
    }

    return detailedSpecs;
  }

  async executeBuild(specifications) {
    // Execute the build using Mindcraft's building capabilities
    const messages = [
      {
        role: "user",
        content: `Execute building plan with these specifications:\n${specifications}`,
      },
    ];

    return await this.prompter.promptCoding(messages);
  }

  async start(
    profilePath,
    loadMemory = false,
    initMessage = null,
    countId = 0
  ) {
    await super.start(profilePath, loadMemory, initMessage, countId);
    await this.initializeSupervisor();
  }
}

// Parse command line arguments
const argv = yargs(process.argv.slice(2))
  .option("profile", {
    alias: "p",
    type: "string",
    description: "profile filepath to use for agent",
  })
  .option("builder_type", {
    alias: "t",
    type: "string",
    choices: ["foundation", "wall", "roof", "architect"],
    description: "type of builder agent",
  })
  .option("load_memory", {
    alias: "l",
    type: "boolean",
    description: "load agent memory from file on startup",
  })
  .option("init_message", {
    alias: "m",
    type: "string",
    description: "automatically prompt the agent on startup",
  })
  .option("count_id", {
    alias: "c",
    type: "number",
    default: 0,
    description: "identifying count for multi-agent scenarios",
  })
  .demandOption(["profile", "builder_type"]).argv;

// Start the integrated agent
(async () => {
  try {
    console.log("Starting integrated build agent with profile:", argv.profile);
    const agent = new IntegratedBuildAgent(argv.builder_type);
    await agent.start(
      argv.profile,
      argv.load_memory,
      argv.init_message,
      argv.count_id
    );

    // Set up message handling
    process.on("message", async (message) => {
      console.log("Received message:📨", message);
      if (message.type === "build_request") {
        const result = await agent.handleBuildRequest(message.content);
        process.send({ type: "build_result", content: result });
      }
    });

    console.log(`${argv.builder_type} agent ready to accept build requests`);
  } catch (error) {
    console.error("Failed to start integrated agent:", {
      message: error.message || "No error message",
      stack: error.stack || "No stack trace",
      error: error,
    });
    process.exit(1);
  }
})();
