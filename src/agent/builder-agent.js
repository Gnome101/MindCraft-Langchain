// src/agent/builder-agent.js
import { EnhancedAgent } from "./enhanced-agent.js";
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class BuilderAgent extends EnhancedAgent {
  constructor(specialization) {
    super();
    this.specialization = specialization;
  }

  async start(profile_fp, load_mem = false, init_message = null, count_id = 0) {
    await super.start(profile_fp, load_mem, init_message, count_id);

    // Listen for tasks from supervisor
    process.on("message", this.handleSupervisorTask.bind(this));

    console.log(`🏗️ ${this.specialization} builder ready`);
  }

  async handleSupervisorTask(message) {
    await delay(5000);
    if (message.type !== "build_task") return;

    console.log(`📥 Received task: ${message.task}`);

    try {
      // Execute the building task
      const result = await this.executeBuildTask(message.task);

      // Report back to supervisor
      process.send({
        type: "builder_update",
        status: "complete",
        result: result,
      });
    } catch (error) {
      console.error(`❌ Error executing task:`, error);
      process.send({
        type: "builder_update",
        status: "error",
        error: error.message,
      });
    }
  }

  async executeBuildTask(task) {
    await delay(5000);
    // Convert task to Mindcraft action
    const actionMessage = `!newAction('${task.replace(/'/g, "\\'")}')`;
    return await super.handleMessage("system", actionMessage, 1);
  }
}
