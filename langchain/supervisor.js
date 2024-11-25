// supervisor.js
import dotenv from "dotenv";
import { z } from "zod";
import { JsonOutputToolsParser } from "langchain/output_parsers";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { END } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";

dotenv.config();

const members = ["foundation_builder", "wall_builder", "roof_builder"];
const options = [END, ...members];

const systemPrompt = `You are an architectural supervisor. 
First, create a detailed plan for the building based on the user's request.
Then manage the construction process between the following workers: {members}.
For each step:
1. Explain your thinking and current phase of the project
2. State which builder should work next
3. Provide specific instructions for that builder

When all construction is complete, respond with FINISH.`;

const planningTool = {
  name: "create_plan",
  description: "Create an architectural plan",
  schema: z.object({
    foundation: z.object({
      depth: z.number(),
      width: z.number(),
      length: z.number(),
      material: z.string(),
    }),
    walls: z.object({
      height: z.number(),
      thickness: z.number(),
      material: z.string(),
    }),
    roof: z.object({
      style: z.string(),
      material: z.string(),
      pitch: z.number(),
    }),
  }),
};

const routingTool = {
  name: "route",
  description: "Select the next builder or finish the project",
  schema: z.object({
    next: z.enum([END, ...members]),
  }),
};

const prompt = ChatPromptTemplate.fromMessages([
  ["system", systemPrompt],
  new MessagesPlaceholder("messages"),
  [
    "system",
    "Based on the conversation above, explain your thinking and determine who should act next," +
      " or should we FINISH? Select one of: {options}",
  ],
]);

const formattedPrompt = await prompt.partial({
  options: options.join(", "),
  members: members.join(", "),
});

const llm = new ChatOpenAI({
  modelName: "gpt-4o",
  temperature: 0,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

const supervisorChain = async (state) => {
  const result = await llm.invoke([
    ...state.messages,
    {
      role: "system",
      content:
        "Based on the above, explain your thinking and determine next steps.",
    },
  ]);

  const toolResult = await llm.invoke([
    ...state.messages,
    {
      role: "system",
      content: `Now select the next builder or FINISH. Options: ${options.join(
        ", "
      )}`,
    },
  ]);

  return {
    messages: [
      new HumanMessage({
        content: result.content,
        name: "Supervisor",
      }),
    ],
    next: toolResult.content.includes("FINISH")
      ? END
      : toolResult.content.includes("foundation")
      ? "foundation_builder"
      : toolResult.content.includes("wall")
      ? "wall_builder"
      : toolResult.content.includes("roof")
      ? "roof_builder"
      : END,
  };
};

export { supervisorChain };
