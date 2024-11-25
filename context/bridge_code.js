// Step 1: Define dimensions
const startX = 50;
const startY = 64;
const startZ = 150;
const bridgeLength = 20;
const bridgeWidth = 3;
const archHeight = 5;

// Step 2: Build the bridge deck
for (let x = startX; x < startX + bridgeLength; x++) {
  for (let z = startZ; z < startZ + bridgeWidth; z++) {
    await skills.placeBlock(bot, "oak_planks", x, startY, z);
  }
}

// Step 3: Build the arches below the bridge
for (let offset = 0; offset < bridgeLength; offset += 5) {
  for (let height = 0; height <= archHeight; height++) {
    const archBaseY = startY - 1 - height;
    const archOffset = archHeight - height;
    await skills.placeBlock(
      bot,
      "stone_bricks",
      startX + offset + archOffset,
      archBaseY,
      startZ + bridgeWidth / 2
    );
    await skills.placeBlock(
      bot,
      "stone_bricks",
      startX + offset - archOffset,
      archBaseY,
      startZ + bridgeWidth / 2
    );
  }
}
