// builder-agent.js
import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { Prompter } from "./prompter.js";
import { getSkillDocs } from "./library/index.js";

class MindcraftBuilder {
  constructor(builderName, profilePath) {
    this.prompter = new Prompter(this, profilePath);
    this.builderName = builderName;
  }

  async buildComponent(specifications) {
    // Convert LangGraph specs to Mindcraft format
    const mindcraftAction = this.translateSpecsToAction(specifications);

    // Use Prompter's coding mode to generate and execute build code
    const messages = [
      {
        role: "user",
        content: `Build according to these specifications: ${JSON.stringify(
          mindcraftAction
        )}`,
      },
    ];

    return await this.prompter.promptCoding(messages);
  }

  translateSpecsToAction(specs) {
    // Convert LangGraph building specifications to Mindcraft action format
    return {
      type: "build",
      details: specs,
      coordinates: {
        x: specs.position?.x || 0,
        y: specs.position?.y || 0,
        z: specs.position?.z || 0,
      },
    };
  }
}

// Create enhanced building tools that use Mindcraft's capabilities
const createMindcraftFoundationBuilder = (profilePath) => {
  const builder = new MindcraftBuilder("foundation_builder", profilePath);

  return createReactAgent({
    llm: new ChatOpenAI({
      modelName: "gpt-4",
      temperature: 0,
    }),
    tools: [
      {
        name: "build_foundation",
        description: "Builds the foundation according to specifications",
        func: async (specs) => {
          return await builder.buildComponent(specs);
        },
      },
    ],
    systemMessage: new SystemMessage(
      "You are a foundation specialist using Mindcraft building capabilities. " +
        "You have access to the following building skills:\n" +
        getSkillDocs()
    ),
  });
};

// Similar enhancements for wall and roof builders
const createMindcraftWallBuilder = (profilePath) => {
  const builder = new MindcraftBuilder("wall_builder", profilePath);
  // Similar implementation as foundation builder
};

const createMindcraftRoofBuilder = (profilePath) => {
  const builder = new MindcraftBuilder("roof_builder", profilePath);
  // Similar implementation as foundation builder
};

// Enhance the supervisor with Mindcraft's architect capabilities
class MindcraftSupervisor {
  constructor(profilePath) {
    this.prompter = new Prompter(this, profilePath);
  }

  async planBuild(request) {
    const messages = [
      {
        role: "user",
        content: `Create a detailed building plan for: ${request}`,
      },
    ];

    return await this.prompter.promptConvo(messages);
  }

  async superviseBuild(buildState) {
    const messages = [
      {
        role: "user",
        content: `Review the current build state and provide next steps: ${JSON.stringify(
          buildState
        )}`,
      },
    ];

    return await this.prompter.promptConvo(messages);
  }
}

// Enhanced supervisor chain that uses Mindcraft's architect capabilities
const createMindcraftSupervisorChain = (profilePath) => {
  const supervisor = new MindcraftSupervisor(profilePath);

  return async (state) => {
    // Get building plan or next steps from Mindcraft architect
    const result = await supervisor.superviseBuild(state);

    // Parse the architect's response to determine next builder
    const nextBuilder = result.includes("foundation")
      ? "foundation_builder"
      : result.includes("wall")
      ? "wall_builder"
      : result.includes("roof")
      ? "roof_builder"
      : "END";

    return {
      messages: [
        new HumanMessage({
          content: result,
          name: "Supervisor",
        }),
      ],
      next: nextBuilder,
    };
  };
};

export {
  createMindcraftFoundationBuilder,
  createMindcraftWallBuilder,
  createMindcraftRoofBuilder,
  createMindcraftSupervisorChain,
};
