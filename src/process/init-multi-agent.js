// src/process/init-multi-agent.js
import { SupervisorAgent } from "../agent/supervisor-agent.js";
import { BuilderAgent } from "../agent/builder-agent.js";
import yargs from "yargs";
import path from "path";
import fs from "fs";

const argv = yargs(process.argv.slice(2)).option("builder_profile", {
  type: "string",
  description: "profile filepath to use for builder agents",
  required: true,
}).argv;

function createUniqueProfile(originalProfile, builderType, index) {
  console.log(`Creating unique profile for ${builderType} builder`);
  const profile = JSON.parse(fs.readFileSync(originalProfile, "utf8"));

  // Create unique name by combining original name with builder type
  profile.name = `${profile.name}_${index}`;

  const newProfilePath = path.join(
    path.dirname(originalProfile),
    `temp_${index}_${path.basename(originalProfile)}`
  );

  fs.writeFileSync(newProfilePath, JSON.stringify(profile, null, 2));
  console.log(`Created profile at: ${newProfilePath}`);
  return newProfilePath;
}

async function startBuilder(profilePath, builderType, index) {
  const uniqueProfilePath = createUniqueProfile(
    profilePath,
    builderType,
    index
  );
  console.log(
    `Starting ${builderType} builder with profile: ${uniqueProfilePath}`
  );

  try {
    const builder = new BuilderAgent(builderType);
    await builder.start(uniqueProfilePath, false, null, index);
    console.log(`✅ ${builderType} builder started successfully`);

    // Clean up temp profile
    fs.unlinkSync(uniqueProfilePath);

    return builder;
  } catch (error) {
    console.error(`Failed to start ${builderType} builder:`, error);
    if (fs.existsSync(uniqueProfilePath)) {
      fs.unlinkSync(uniqueProfilePath);
    }
    throw error;
  }
}

(async () => {
  try {
    // Initialize supervisor (no Minecraft connection needed)
    console.log("🚀 Starting supervisor...");
    const supervisor = new SupervisorAgent();
    await supervisor.initialize();

    // Initialize builders with unique names
    const builderTypes = ["foundation", "wall", "roof"];
    const builders = new Map();

    for (let i = 0; i < builderTypes.length; i++) {
      const type = builderTypes[i];
      console.log(`Starting ${type} builder...`);

      const builder = await startBuilder(argv.builder_profile, type, i + 1);

      // Register builder with supervisor
      supervisor.registerBuilder(type, (instructions) =>
        builder.handleBuildInstructions(instructions)
      );

      builders.set(type, builder);

      // Wait between spawns to prevent connection issues
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    console.log("✅ All agents initialized");

    // Handle build requests
    process.on("message", async (message) => {
      if (message.type === "build_request") {
        await supervisor.handleBuildRequest(message.content);
      }
    });

    // Handle cleanup on exit
    process.on("SIGINT", async () => {
      console.log("Shutting down agents...");
      for (const builder of builders.values()) {
        if (builder.bot) {
          builder.bot.quit();
        }
      }
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Failed to start agents:", {
      message: error.message || "No error message",
      stack: error.stack || "No stack trace",
      error: error,
    });
    process.exit(1);
  }
})();
