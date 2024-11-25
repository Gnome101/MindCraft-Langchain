// Step 1: Define village parameters
const villageCenterX = 500;
const villageCenterY = 64;
const villageCenterZ = 500;
const numberOfHouses = 5;
const houseSpacing = 15;

// Step 2: Function to build a house
async function buildHouse(baseX, baseY, baseZ) {
  const houseWidth = 7;
  const houseLength = 7;
  const houseHeight = 5;

  // Build walls
  for (let y = baseY; y < baseY + houseHeight; y++) {
    for (let x = baseX; x < baseX + houseWidth; x++) {
      for (let z = baseZ; z < baseZ + houseLength; z++) {
        if (
          x === baseX ||
          x === baseX + houseWidth - 1 ||
          z === baseZ ||
          z === baseZ + houseLength - 1
        ) {
          await skills.placeBlock(bot, "oak_planks", x, y, z);
        }
      }
    }
  }

  // Build roof
  const roofHeight = 3;
  for (let y = 0; y < roofHeight; y++) {
    for (let x = baseX - y; x <= baseX + houseWidth - 1 + y; x++) {
      for (let z = baseZ - y; z <= baseZ + houseLength - 1 + y; z++) {
        if (
          x === baseX - y ||
          x === baseX + houseWidth - 1 + y ||
          z === baseZ - y ||
          z === baseZ + houseLength - 1 + y
        ) {
          await skills.placeBlock(bot, "oak_stairs", x, baseY + houseHeight + y, z);
        }
      }
    }
  }

  // Add door
  await skills.placeBlock(bot, "air", baseX + Math.floor(houseWidth / 2), baseY + 1, baseZ);
  await skills.placeBlock(bot, "air", baseX + Math.floor(houseWidth / 2), baseY + 2, baseZ);

  // Add windows
  await skills.placeBlock(bot, "glass_pane", baseX, baseY + 2, baseZ + Math.floor(houseLength / 2));
  await skills.placeBlock(bot, "glass_pane", baseX + houseWidth - 1, baseY + 2, baseZ + Math.floor(houseLength / 2));
}

// Step 3: Build multiple houses
async function buildVillage() {
  for (let i = 0; i < numberOfHouses; i++) {
    const angle = (i / numberOfHouses) * (2 * Math.PI);
    const xOffset = Math.round(Math.cos(angle) * houseSpacing);
    const zOffset = Math.round(Math.sin(angle) * houseSpacing);
    const houseX = villageCenterX + xOffset;
    const houseZ = villageCenterZ + zOffset;
    await buildHouse(houseX, villageCenterY, houseZ);
  }
}

// Execute the build
buildVillage();
