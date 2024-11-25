// Step 1: Define pyramid dimensions
const baseX = 200;
const baseY = 64;
const baseZ = 300;
const pyramidHeight = 8;

// Step 2: Build the pyramid step-by-step
for (let level = 0; level < pyramidHeight; level++) {
  const currentLength = (pyramidHeight - level) * 2 - 1;
  const startX = baseX - level;
  const startZ = baseZ - level;
  for (let x = startX; x < startX + currentLength; x++) {
    for (let z = startZ; z < startZ + currentLength; z++) {
      await skills.placeBlock(bot, "sandstone", x, baseY + level, z);
    }
  }
}
