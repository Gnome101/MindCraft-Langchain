// agent-coordination.js
import { EventEmitter } from "events";
import { systemConfig } from "./builder-profiles.js";

class BuildCoordinator extends EventEmitter {
  constructor() {
    super();
    this.activeBuilders = new Map();
    this.buildQueue = [];
    this.config = systemConfig.buildCoordination;
  }

  async registerBuilder(builder) {
    this.activeBuilders.set(builder.builderType, builder);

    builder.on(
      systemConfig.communication.messageTypes.BUILD_UPDATE,
      (update) => {
        this.handleBuildUpdate(builder.builderType, update);
      }
    );
  }

  async startBuild(buildRequest) {
    const buildPlan = await this.createBuildPlan(buildRequest);
    this.buildQueue.push(buildPlan);
    await this.processBuildQueue();
  }

  async createBuildPlan(request) {
    // Get the architect to create a build plan
    const architect = this.activeBuilders.get("architect");
    if (!architect) {
      throw new Error("No architect available to create build plan");
    }

    const plan = await architect.agent.prompter.promptConvo([
      {
        role: "user",
        content: `Create a detailed build plan for: ${request}`,
      },
    ]);

    return {
      request,
      plan,
      status: "pending",
      steps: [],
      startTime: Date.now(),
    };
  }

  async processBuildQueue() {
    while (this.buildQueue.length > 0) {
      const currentBuild = this.buildQueue[0];

      try {
        await this.executeBuildPlan(currentBuild);
        this.buildQueue.shift(); // Remove completed build

        this.emit(systemConfig.communication.messageTypes.BUILD_COMPLETE, {
          request: currentBuild.request,
          duration: Date.now() - currentBuild.startTime,
        });
      } catch (error) {
        console.error("Build execution failed:", error);
        currentBuild.status = "failed";

        this.emit(systemConfig.communication.messageTypes.BUILD_ERROR, {
          request: currentBuild.request,
          error: error.message,
        });

        // Remove failed build after max retries
        if (currentBuild.retries >= this.config.maxRetries) {
          this.buildQueue.shift();
        } else {
          currentBuild.retries = (currentBuild.retries || 0) + 1;
        }
      }
    }
  }

  async executeBuildPlan(buildPlan) {
    const steps = this.parseBuildSteps(buildPlan.plan);

    for (const step of steps) {
      const builder = this.activeBuilders.get(step.builderType);
      if (!builder) {
        throw new Error(`No builder available for type: ${step.builderType}`);
      }

      await builder.handleBuildRequest(step.instructions);
      buildPlan.steps.push({
        type: step.builderType,
        status: "completed",
        timestamp: Date.now(),
      });
    }
  }

  parseBuildSteps(plan) {
    // Convert architect's plan into sequential building steps
    // This is a simplified example - you'd want more robust parsing
    return plan
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => {
        const builderType = line.includes("foundation")
          ? "foundation"
          : line.includes("wall")
          ? "wall"
          : line.includes("roof")
          ? "roof"
          : null;

        return {
          builderType,
          instructions: line.trim(),
        };
      })
      .filter((step) => step.builderType);
  }

  handleBuildUpdate(builderType, update) {
    this.emit(systemConfig.communication.messageTypes.BUILD_UPDATE, {
      builderType,
      update,
      timestamp: Date.now(),
    });
  }
}

export const coordinator = new BuildCoordinator();
