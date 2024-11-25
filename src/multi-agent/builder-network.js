// src/multi-agent/builder-network.js
import { EventEmitter } from "events";

export class BuilderNetwork extends EventEmitter {
  constructor() {
    super();
    this.builders = new Map();
    this.supervisor = null;
  }

  registerBuilder(agentId, type, process) {
    console.log(`📝 Registering ${type} builder with ID: ${agentId}`);
    this.builders.set(agentId, {
      type,
      process,
      status: "idle",
    });
  }

  registerSupervisor(process) {
    console.log("👷 Registering supervisor");
    this.supervisor = process;
  }

  async relayMessage(fromId, message) {
    if (fromId === "supervisor") {
      // Supervisor delegating to builders
      return this.handleSupervisorMessage(message);
    } else {
      // Builders reporting back to supervisor
      return this.handleBuilderMessage(fromId, message);
    }
  }

  async handleSupervisorMessage(message) {
    console.log("👷 Supervisor delegating:", message);
    const { target, task } = message;

    const builder = Array.from(this.builders.entries()).find(
      ([_, data]) => data.type === target
    );

    if (!builder) {
      throw new Error(`No ${target} builder available`);
    }

    const [builderId, builderData] = builder;
    builderData.status = "working";

    // Send task to specific builder
    builderData.process.send({
      type: "build_task",
      task: task,
    });

    return `Task delegated to ${target} builder`;
  }

  async handleBuilderMessage(builderId, message) {
    console.log(`🏗️ Builder ${builderId} reporting:`, message);
    const builder = this.builders.get(builderId);
    if (!builder) {
      throw new Error(`Unknown builder ${builderId}`);
    }

    // Report progress to supervisor
    this.supervisor.send({
      type: "builder_update",
      builderId,
      builderType: builder.type,
      message,
    });

    return `Update sent to supervisor`;
  }

  isBuilderAvailable(type) {
    return Array.from(this.builders.values()).some(
      (builder) => builder.type === type && builder.status === "idle"
    );
  }
}

export const builderNetwork = new BuilderNetwork();
