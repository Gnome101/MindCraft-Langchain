// tools.js
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

const foundationTool = new DynamicStructuredTool({
  name: "build_foundation",
  description: "Builds the foundation according to specifications",
  schema: z.object({
    depth: z.number(),
    width: z.number(),
    length: z.number(),
    material: z.string(),
  }),
  func: async ({ depth, width, length, material }) => {
    return `Foundation built with ${material} at ${depth}m deep, ${width}m wide, and ${length}m long`;
  },
});

const wallsTool = new DynamicStructuredTool({
  name: "build_walls",
  description: "Constructs the walls according to specifications",
  schema: z.object({
    height: z.number(),
    thickness: z.number(),
    material: z.string(),
  }),
  func: async ({ height, thickness, material }) => {
    return `Walls constructed with ${material} at ${height}m high and ${thickness}m thick`;
  },
});

const roofTool = new DynamicStructuredTool({
  name: "build_roof",
  description: "Builds the roof according to specifications",
  schema: z.object({
    style: z.string(),
    material: z.string(),
    pitch: z.number(),
  }),
  func: async ({ style, material, pitch }) => {
    return `${style} roof built with ${material} at ${pitch} degree pitch`;
  },
});

export { foundationTool, wallsTool, roofTool };
