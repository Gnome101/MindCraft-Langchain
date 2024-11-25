// correction.js
import { HumanMessage } from "@langchain/core/messages";

const correctionNode = async (state, config) => {
  const lastMessage = state.messages[state.messages.length - 1];
  const builderToCorrect = lastMessage.content.toLowerCase().includes("roof")
    ? "roof_builder"
    : lastMessage.content.toLowerCase().includes("wall")
    ? "wall_builder"
    : lastMessage.content.toLowerCase().includes("foundation")
    ? "foundation_builder"
    : null;

  return {
    messages: [
      new HumanMessage({
        content: `Correction needed: ${lastMessage.content}. Please provide detailed instructions and specifications.`,
        name: "CorrectionRequest",
      }),
    ],
    next: builderToCorrect,
  };
};

export { correctionNode };
