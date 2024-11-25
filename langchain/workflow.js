// Then update workflow.js to import the correction node:
// workflow.js
import { START, StateGraph } from "@langchain/langgraph";
import { AgentState } from "./define_state.js";
import { foundationNode, wallNode, roofNode } from "./agents.js";
import { supervisorChain } from "./supervisor.js";
import { correctionNode } from "./correction.js";

const workflow = new StateGraph(AgentState)
  .addNode("foundation_builder", foundationNode)
  .addNode("wall_builder", wallNode)
  .addNode("roof_builder", roofNode)
  .addNode("correction", correctionNode)
  .addNode("supervisor", supervisorChain);

const members = [
  "foundation_builder",
  "wall_builder",
  "roof_builder",
  "correction",
];

members.forEach((member) => {
  workflow.addEdge(member, "supervisor");
});

workflow.addConditionalEdges("supervisor", (x) => x.next);

workflow.addEdge(START, "supervisor");

const graph = workflow.compile();

export { graph };
