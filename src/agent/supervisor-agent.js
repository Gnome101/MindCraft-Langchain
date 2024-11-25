// src/agent/supervisor-agent.js
import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class SupervisorAgent {
  constructor() {
    this.supervisor = null;
    this.builders = new Map();
  }

  async initialize() {
    console.log("🔧 Initializing Supervisor...");
    this.supervisor = new ChatOpenAI({
      modelName: "o1-mini",
      temperature: 0.1,
    });
  }

  registerBuilder(type, messageCallback) {
    console.log(`📝 Registering ${type} builder`);
    this.builders.set(type, messageCallback);
  }

  async handleBuildRequest(request) {
    console.log("🏗️ Processing build request:", request);

    try {
      // Create master plan
      const plan = await this.createBuildPlan(request);
      console.log("📋 Master plan created");

      // Break down into builder-specific tasks
      const tasks = await this.createBuilderTasks(plan);
      console.log("📑 Tasks created:", tasks);

      // Delegate to builders
      for (const task of tasks) {
        const builder = this.builders.get(task.builder);
        if (builder) {
          console.log(`🎯 Delegating to ${task.builder}:`, task.instructions);
          await builder(task.instructions);
        }
      }

      return true;
    } catch (error) {
      console.error("❌ Supervisor error:", error);
      return false;
    }
  }

  async createBuildPlan(request) {
    await delay(5000);
    return await this.supervisor.invoke([
      new SystemMessage(`As a Minecraft construction supervisor, create detailed building plans.
Break down the request into specific tasks:

Specify exact coordinates and dimensions for each component.`),
      new HumanMessage(request),
    ]);
  }

  async createBuilderTasks(plan) {
    await delay(5000);
    const taskResult = await this.supervisor.invoke([
      new SystemMessage(`Convert this building plan into specific tasks for each builder type.
Format as JSON array:
[{
    "builder": "foundation|wall|roof",
    "instructions": "detailed instructions with coordinates",
    "materials": {...},
    "dimensions": {...}
}]`),
      new HumanMessage(plan.content),
    ]);

    return JSON.parse(taskResult.content);
  }
}

// src/agent/builder-agent.js
import { Agent } from "./agent.js";

export class BuilderAgent extends Agent {
  constructor(specialization) {
    super();
    this.specialization = specialization;
  }

  async handleBuildInstructions(instructions) {
    console.log(`🏗️ ${this.specialization} executing:`, instructions);

    // Convert instructions directly to Minecraft actions
    const actions = this.parseInstructions(instructions);

    for (const action of actions) {
      await this.executeAction(action);
    }
  }

  parseInstructions(instructions) {
    // Extract actionable steps from instructions
    const steps = instructions.split("\n").filter((step) => step.trim());

    return steps
      .map((step) => {
        // Convert each instruction step into a concrete action
        if (step.includes("place")) {
          const [block, coords] = this.extractBlockAndCoords(step);
          return {
            type: "place",
            block,
            ...coords,
          };
        }
        // Add other action types as needed
        return null;
      })
      .filter((action) => action);
  }

  async executeAction(action) {
    switch (action.type) {
      case "place":
        await this.bot.placeBlock(action.block, action.x, action.y, action.z);
        break;
      // Add other action types
    }
  }
}
