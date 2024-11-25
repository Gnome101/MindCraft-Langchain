// builder-profiles.js
import path from "path";

const PROFILES_DIR = "./profiles";

export const builderProfiles = {
  foundation: {
    name: "foundation_builder",
    profile: path.join(PROFILES_DIR, "builder.json"),
    type: "foundation",
    capabilities: ["excavation", "foundation_laying", "material_preparation"],
  },
  wall: {
    name: "wall_builder",
    profile: path.join(PROFILES_DIR, "builder.json"),
    type: "wall",
    capabilities: ["wall_construction", "window_installation", "door_fitting"],
  },
  roof: {
    name: "roof_builder",
    profile: path.join(PROFILES_DIR, "builder.json"),
    type: "roof",
    capabilities: ["roof_framing", "shingle_laying", "gable_construction"],
  },
  architect: {
    name: "architect",
    profile: path.join(PROFILES_DIR, "architect.json"),
    type: "architect",
    capabilities: ["planning", "coordination", "design"],
  },
};

export const systemConfig = {
  buildCoordination: {
    maxRetries: 3,
    timeout: 300000,
    coordinationInterval: 1000,
  },
  communication: {
    messageTypes: {
      BUILD_REQUEST: "buildRequest",
      BUILD_UPDATE: "buildUpdate",
      BUILD_COMPLETE: "buildComplete",
      BUILD_ERROR: "buildError",
    },
  },
  defaultSettings: {
    load_memory: true,
    init_message: "Integrated building system initialized",
  },
  paths: {
    profiles: PROFILES_DIR,
    logs: "./logs",
    memory: "./memory",
  },
};
