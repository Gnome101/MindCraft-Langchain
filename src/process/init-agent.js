import { Agent } from "../agent/agent.js";
import yargs from "yargs";

// Add global unhandled rejection handler
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", {
    promise: promise,
    reason: reason,
    stack: reason?.stack || "No stack trace",
  });
  process.exit(1);
});

const args = process.argv.slice(2);
if (args.length < 1) {
  console.log(
    "Usage: node init_agent.js <agent_name> [profile] [load_memory] [init_message]"
  );
  process.exit(1);
}

const argv = yargs(args)
  .option("profile", {
    alias: "p",
    type: "string",
    description: "profile filepath to use for agent",
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
  }).argv;

// Wrap agent start in async IIFE with proper error handling
(async () => {
  try {
    console.log("Starting agent with profile:", argv.profile);
    const agent = new Agent();
    await agent.start(
      argv.profile,
      argv.load_memory,
      argv.init_message,
      argv.count_id
    );
  } catch (error) {
    console.error("Failed to start agent process:", {
      message: error.message || "No error message",
      stack: error.stack || "No stack trace",
      error: error,
    });
    process.exit(1);
  }
})();
// init-agent.js
// import { EnhancedAgent } from "../agent/enhanced-agent.js";
// import yargs from "yargs";

// // Add global unhandled rejection handler
// process.on("unhandledRejection", (reason, promise) => {
//   console.error("❌ Unhandled Rejection at:", {
//     promise: promise,
//     reason: reason,
//     stack: reason?.stack || "No stack trace",
//   });
//   process.exit(1);
// });

// const argv = yargs(process.argv.slice(2))
//   .option("profile", {
//     alias: "p",
//     type: "string",
//     description: "profile filepath to use for agent",
//   })
//   .option("load_memory", {
//     alias: "l",
//     type: "boolean",
//     description: "load agent memory from file on startup",
//   })
//   .option("init_message", {
//     alias: "m",
//     type: "string",
//     description: "automatically prompt the agent on startup",
//   })
//   .option("count_id", {
//     alias: "c",
//     type: "number",
//     default: 0,
//     description: "identifying count for multi-agent scenarios",
//   }).argv;

// // Wrap agent start in async IIFE with proper error handling
// (async () => {
//   try {
//     console.log("🚀 Starting enhanced agent with profile:", argv.profile);
//     const agent = new EnhancedAgent();

//     await agent.start(
//       argv.profile,
//       argv.load_memory,
//       argv.init_message,
//       argv.count_id
//     );

//     console.log("✅ Enhanced agent successfully started");
//   } catch (error) {
//     console.error("❌ Failed to start enhanced agent:", {
//       message: error.message || "No error message",
//       stack: error.stack || "No stack trace",
//       error: error,
//     });
//     process.exit(1);
//   }
// })();