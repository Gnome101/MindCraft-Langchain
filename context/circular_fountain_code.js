// Step 1: Define dimensions and materials
const fountainCenterX = 350;
const fountainCenterY = 64;
const fountainCenterZ = 350;
const fountainRadius = 5;
const fountainHeight = 6;

// Step 2: Build the fountain base
async function buildFountainBase() {
  for (let x = fountainCenterX - fountainRadius; x <= fountainCenterX + fountainRadius; x++) {
    for (let z = fountainCenterZ - fountainRadius; z <= fountainCenterZ + fountainRadius; z++) {
      const distance = Math.sqrt((x - fountainCenterX) ** 2 + (z - fountainCenterZ) ** 2);
      if (distance <= fountainRadius) {
        await skills.placeBlock(bot, "stone_bricks", x, fountainCenterY, z);
      }
    }
  }
}

// Step 3: Build the fountain walls
async function buildFountainWalls() {
  for (let x = fountainCenterX - fountainRadius; x <= fountainCenterX + fountainRadius; x++) {
    for (let z = fountainCenterZ - fountainRadius; z <= fountainCenterZ + fountainRadius; z++) {
      const distance = Math.sqrt((x - fountainCenterX) ** 2 + (z - fountainCenterZ) ** 2);
      if (distance >= fountainRadius - 1 && distance <= fountainRadius) {
        await skills.placeBlock(bot, "stone_bricks", x, fountainCenterY + 1, z);
      }
    }
  }
}

// Step 4: Fill with water
async function fillWithWater() {
  for (let x = fountainCenterX - fountainRadius + 1; x <= fountainCenterX + fountainRadius - 1; x++) {
    for (let z = fountainCenterZ - fountainRadius + 1; z <= fountainCenterZ + fountainRadius - 1; z++) {
      await skills.placeBlock(bot, "water", x, fountainCenterY + 1, z);
    }
  }
}

// Step 5: Build central column
async function buildCentralColumn() {
  const columnX = fountainCenterX;
  const columnZ = fountainCenterZ;
  for (let y = fountainCenterY + 1; y <= fountainCenterY + fountainHeight; y++) {
    await skills.placeBlock(bot, "stone_bricks", columnX, y, columnZ);
  }
  // Water source at top
  await skills.placeBlock(bot, "water", columnX, fountainCenterY + fountainHeight + 1, columnZ);
}

// Main build function
async function buildFountain() {
  await buildFountainBase();
  await buildFountainWalls();
  await fillWithWater();
  await buildCentralColumn();
}

// Execute the build
buildFountain();
