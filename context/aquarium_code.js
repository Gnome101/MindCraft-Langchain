// Step 1: Define aquarium dimensions and materials
const aquariumBaseX = 600;
const aquariumBaseY = 64;
const aquariumBaseZ = 600;
const aquariumWidth = 10;
const aquariumLength = 15;
const aquariumHeight = 8;

// Step 2: Build aquarium walls
async function buildAquariumWalls() {
  for (let y = aquariumBaseY; y < aquariumBaseY + aquariumHeight; y++) {
    for (let x = aquariumBaseX; x < aquariumBaseX + aquariumWidth; x++) {
      for (let z = aquariumBaseZ; z < aquariumBaseZ + aquariumLength; z++) {
        if (
          x === aquariumBaseX ||
          x === aquariumBaseX + aquariumWidth - 1 ||
          z === aquariumBaseZ ||
          z === aquariumBaseZ + aquariumLength - 1
        ) {
          await skills.placeBlock(bot, "glass", x, y, z);
        }
      }
    }
  }
}

// Step 3: Build the floor
async function buildAquariumFloor() {
  for (let x = aquariumBaseX + 1; x < aquariumBaseX + aquariumWidth - 1; x++) {
    for (let z = aquariumBaseZ + 1; z < aquariumBaseZ + aquariumLength - 1; z++) {
      await skills.placeBlock(bot, "sand", x, aquariumBaseY, z);
    }
  }
}

// Step 4: Fill with water
async function fillAquariumWithWater() {
  for (let y = aquariumBaseY + 1; y < aquariumBaseY + aquariumHeight - 1; y++) {
    for (let x = aquariumBaseX + 1; x < aquariumBaseX + aquariumWidth - 1; x++) {
      for (let z = aquariumBaseZ + 1; z < aquariumBaseZ + aquariumLength - 1; z++) {
        await skills.placeBlock(bot, "water", x, y, z);
      }
    }
  }
}

// Step 5: Add decorations (e.g., sea lanterns, coral)
async function addDecorations() {
  for (let i = 0; i < 5; i++) {
    const x = aquariumBaseX + 1 + Math.floor(Math.random() * (aquariumWidth - 2));
    const y = aquariumBaseY + 1 + Math.floor(Math.random() * (aquariumHeight - 2));
    const z = aquariumBaseZ + 1 + Math.floor(Math.random() * (aquariumLength - 2));
    await skills.placeBlock(bot, "sea_lantern", x, y, z);
  }
  // Add kelp
  for (let x = aquariumBaseX + 1; x < aquariumBaseX + aquariumWidth - 1; x += 2) {
    for (let z = aquariumBaseZ + 1; z < aquariumBaseZ + aquariumLength - 1; z += 3) {
      for (let y = aquariumBaseY + 1; y < aquariumBaseY + aquariumHeight - 1; y++) {
        await skills.placeBlock(bot, "kelp", x, y, z);
      }
    }
  }
}

// Main build function
async function buildAquarium() {
  await buildAquariumWalls();
  await buildAquariumFloor();
  await fillAquariumWithWater();
  await addDecorations();
}

// Execute the build
buildAquarium();
