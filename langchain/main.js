// main.js
import dotenv from "dotenv";
import { HumanMessage } from "@langchain/core/messages";
import { graph } from "./workflow.js";

dotenv.config();

async function testBuild() {
  try {
    console.log("\n🏗️ Starting construction process...\n");

    const streamResults = graph.stream(
      {
        messages: [
          new HumanMessage({
            content:
              "Build me a small 10x10 wooden cabin with a simple gabled roof.",
          }),
        ],
      },
      { recursionLimit: 100 }
    );

    for await (const output of await streamResults) {
      if (!output?.__end__) {
        // Check if it's a supervisor message
        if (output.supervisor) {
          console.log("\n👷 Supervisor Update:");
          console.log("------------------------");
          if (output.supervisor.messages) {
            console.log(output.supervisor.messages[0].content);
          }
          console.log(`Next step: ${output.supervisor.next}`);
          console.log("------------------------\n");
        }
        // Check if it's a builder message
        else if (
          output.foundation_builder ||
          output.wall_builder ||
          output.roof_builder
        ) {
          const builder = output.foundation_builder
            ? "Foundation Builder"
            : output.wall_builder
            ? "Wall Builder"
            : "Roof Builder";
          const messages =
            output.foundation_builder?.messages ||
            output.wall_builder?.messages ||
            output.roof_builder?.messages;

          console.log(`\n🚧 ${builder} Report:`);
          console.log("------------------------");
          if (messages) {
            console.log(messages[0].content);
          }
          console.log("------------------------\n");
        }
      }
    }

    console.log("🎉 Construction process completed!");
  } catch (error) {
    console.error("❌ Error occurred:", error.message);
    if (error.cause) {
      console.error("Cause:", error.cause);
    }
  }
}

console.log("🏠 Starting Architecture Planning System...");
testBuild().catch(console.error);
