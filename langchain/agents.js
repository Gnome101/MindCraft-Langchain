// agents.js
import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { foundationTool, wallsTool, roofTool } from "./tools.js";
import dotenv from "dotenv";
dotenv.config();
if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set in environment variables");
}
const llm = new ChatOpenAI({
  modelName: "gpt-4o",
  temperature: 0,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

const foundationBuilder = createReactAgent({
  llm,
  tools: [foundationTool],
  messageModifier: new SystemMessage(
    "You are a foundation specialist. You build foundations according to the architectural plan."
  ),
});

const wallBuilder = createReactAgent({
  llm,
  tools: [wallsTool],
  messageModifier: new SystemMessage(
    "You are a wall construction specialist. You build walls according to the architectural plan."
  ),
});

const roofBuilder = createReactAgent({
  llm,
  tools: [roofTool],
  messageModifier: new SystemMessage(
    "You are a roofing specialist. You build roofs according to the architectural plan."
  ),
});

const foundationNode = async (state, config) => {
  const result = await foundationBuilder.invoke(state, config);
  const lastMessage = result.messages[result.messages.length - 1];
  return {
    messages: [
      new HumanMessage({
        content: lastMessage.content,
        name: "FoundationBuilder",
      }),
    ],
  };
};

const wallNode = async (state, config) => {
  const result = await wallBuilder.invoke(state, config);
  const lastMessage = result.messages[result.messages.length - 1];
  return {
    messages: [
      new HumanMessage({ content: lastMessage.content, name: "WallBuilder" }),
    ],
  };
};

const roofNode = async (state, config) => {
  const result = await roofBuilder.invoke(state, config);
  const lastMessage = result.messages[result.messages.length - 1];
  return {
    messages: [
      new HumanMessage({ content: lastMessage.content, name: "RoofBuilder" }),
    ],
  };
};

export { foundationNode, wallNode, roofNode };
