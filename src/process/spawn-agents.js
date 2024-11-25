// src/process/spawn-agents.js
import { fork } from "child_process";
import path from "path";
import fs from "fs";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const argv = yargs(hideBin(process.argv))
  .option("supervisor_profile", {
    type: "string",
    description: "Profile for supervisor agent",
    required: true,
  })
  .option("builder_profile", {
    type: "string",
    description: "Profile for builder agents",
    required: true,
  })
  .help().argv;

async function createUniqueProfile(originalProfile, agentType, index) {
  const profile = JSON.parse(fs.readFileSync(originalProfile, "utf8"));
  profile.name = `${profile.name}_${agentType}${index}`;

  const newProfilePath = path.join(
    path.dirname(originalProfile),
    `temp_${agentType}_${index}_${path.basename(originalProfile)}`
  );

  fs.writeFileSync(newProfilePath, JSON.stringify(profile, null, 2));
  console.log(`Created profile for ${agentType} at ${newProfilePath}`);
  return newProfilePath;
}

async function spawnAgent(profilePath, agentType, index) {
  const uniqueProfile = await createUniqueProfile(
    profilePath,
    agentType,
    index
  );

  const agentProcess = fork("./src/process/init-agent.js", [
    "--profile",
    uniqueProfile,
    "--count_id",
    index.toString(),
    "--builder_type",
    agentType,
  ]);

  agentProcess.on("error", (err) => {
    console.error(`Error in ${agentType} process:`, err);
  });

  agentProcess.on("exit", (code) => {
    console.log(`${agentType} process exited with code ${code}`);
    // Clean up temporary profile
    fs.unlinkSync(uniqueProfile);
  });

  return new Promise((resolve, reject) => {
    agentProcess.on("message", (message) => {
      if (message === "ready") {
        resolve(agentProcess);
      }
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      reject(new Error(`Timeout waiting for ${agentType} to start`));
    }, 30000);
  });
}

async function main() {
  try {
    console.log("🚀 Starting multi-agent system...");

    // Start supervisor
    console.log("Starting supervisor...");
    const supervisor = await spawnAgent(
      argv.supervisor_profile,
      "supervisor",
      0
    );
    await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for supervisor to fully start

    // Start builders
    const builderTypes = ["foundation", "wall", "roof"];
    for (let i = 0; i < builderTypes.length; i++) {
      console.log(`Starting ${builderTypes[i]} builder...`);
      await spawnAgent(argv.builder_profile, builderTypes[i], i + 1);
      // Wait between spawns to prevent connection issues
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    console.log("✅ All agents started successfully");
  } catch (error) {
    console.error("Failed to start multi-agent system:", error);
    process.exit(1);
  }
}

main();
