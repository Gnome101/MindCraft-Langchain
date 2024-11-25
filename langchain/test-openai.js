// main.js
import dotenv from "dotenv";
import { HumanMessage } from "@langchain/core/messages";
import { graph } from "./workflow.js";

// Load environment variables
dotenv.config();

// Simple test function
async function testBuild() {
  try {
    console.log("Starting construction process...");

    const streamResults = graph.stream(
      {
        messages: [
          new HumanMessage({
            content: "Build me a small wooden cabin with a simple gabled roof.",
          }),
        ],
      },
      { recursionLimit: 100 }
    );

    console.log("Processing construction steps...");

    for await (const output of await streamResults) {
      if (!output?.__end__) {
        console.log("\nStep Output:");
        console.log(output);
        console.log("--------------------");
      }
    }

    console.log("Construction process completed!");
  } catch (error) {
    console.error("Error occurred:", error.message);
    if (error.cause) {
      console.error("Cause:", error.cause);
    }
  }
}

// Run the test
console.log("Starting application...");
testBuild().catch(console.error);
