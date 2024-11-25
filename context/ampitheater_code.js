// Step 1: Define dimensions and materials
const amphitheaterCenterX = 550;
const amphitheaterCenterY = 64;
const amphitheaterCenterZ = 550;
const radius = 20;
const seatingLevels = 5;

// Step 2: Build seating levels
async function buildSeating() {
  for (let level = 0; level < seatingLevels; level++) {
    const currentRadius = radius - level * 2;
    for (let angle = 0; angle < 180; angle += 5) {
      const rad = (angle * Math.PI) / 180;
      const x = amphitheaterCenterX + Math.round(currentRadius * Math.cos(rad));
      const z = amphitheaterCenterZ + Math.round(currentRadius * Math.sin(rad));
      await skills.placeBlock(bot, "stone_bricks", x, amphitheaterCenterY + level, z);
    }
  }
}

// Step 3: Build stage
async function buildStage() {
  for (let x = amphitheaterCenterX - 5; x <= amphitheaterCenterX + 5; x++) {
    for (let z = amphitheaterCenterZ - 1; z <= amphitheaterCenterZ + 10; z++) {
      await skills.placeBlock(bot, "oak_planks", x, amphitheaterCenterY, z);
    }
  }
}

// Step 4: Build backdrop
async function buildBackdrop() {
  for (let y = amphitheaterCenterY + 1; y <= amphitheaterCenterY + 6; y++) {
    for (let x = amphitheaterCenterX - 5; x <= amphitheaterCenterX + 5; x++) {
      await skills.placeBlock(bot, "dark_oak_planks", x, y, amphitheaterCenterZ + 10);
    }
  }
}

// Main build function
async function buildAmphitheater() {
  await buildSeating();
  await buildStage();
  await buildBackdrop();
}

// Execute the build
buildAmphitheater();
