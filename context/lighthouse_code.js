// Step 1: Define dimensions and materials
const lighthouseBaseX = 650;
const lighthouseBaseY = 64;
const lighthouseBaseZ = 650;
const lighthouseHeight = 30;
const lighthouseRadius = 4;

// Step 2: Build the lighthouse tower
async function buildLighthouseTower() {
  for (let y = lighthouseBaseY; y < lighthouseBaseY + lighthouseHeight; y++) {
    const material = y % 6 < 3 ? "white_concrete" : "red_concrete"; // Striped pattern
    for (let x = lighthouseBaseX - lighthouseRadius; x <= lighthouseBaseX + lighthouseRadius; x++) {
      for (let z = lighthouseBaseZ - lighthouseRadius; z <= lighthouseBaseZ + lighthouseRadius; z++) {
        const distance = Math.sqrt((x - lighthouseBaseX) ** 2 + (z - lighthouseBaseZ) ** 2);
        if (distance >= lighthouseRadius - 1 && distance <= lighthouseRadius) {
          await skills.placeBlock(bot, material, x, y, z);
        }
      }
    }
  }
}

// Step 3: Build the top platform
async function buildTopPlatform() {
  const platformY = lighthouseBaseY + lighthouseHeight;
  for (let x = lighthouseBaseX - lighthouseRadius - 1; x <= lighthouseBaseX + lighthouseRadius + 1; x++) {
    for (let z = lighthouseBaseZ - lighthouseRadius - 1; z <= lighthouseBaseZ + lighthouseRadius + 1; z++) {
      const distance = Math.sqrt((x - lighthouseBaseX) ** 2 + (z - lighthouseBaseZ) ** 2);
      if (distance <= lighthouseRadius + 1) {
        await skills.placeBlock(bot, "stone_bricks", x, platformY, z);
      }
    }
  }
}

// Step 4: Build the light source
async function buildLightSource() {
  const lightY = lighthouseBaseY + lighthouseHeight + 1;
  for (let y = lightY; y < lightY + 3; y++) {
    for (let x = lighthouseBaseX - 1; x <= lighthouseBaseX + 1; x++) {
      for (let z = lighthouseBaseZ - 1; z <= lighthouseBaseZ + 1; z++) {
        if (
          x === lighthouseBaseX - 1 ||
          x === lighthouseBaseX + 1 ||
          z === lighthouseBaseZ - 1 ||
          z === lighthouseBaseZ + 1
        ) {
          await skills.placeBlock(bot, "glass", x, y, z);
        } else {
          await skills.placeBlock(bot, "glowstone", x, y, z);
        }
      }
    }
  }
}

// Step 5: Build the roof
async function buildRoof() {
  const roofY = lighthouseBaseY + lighthouseHeight + 4;
  for (let y = 0; y < 3; y++) {
    for (let x = lighthouseBaseX - y - 1; x <= lighthouseBaseX + y + 1; x++) {
      for (let z = lighthouseBaseZ - y - 1; z <= lighthouseBaseZ + y + 1; z++) {
        await skills.placeBlock(bot, "stone_bricks", x, roofY + y, z);
      }
    }
  }
}

// Main build function
async function buildLighthouse() {
  await buildLighthouseTower();
  await buildTopPlatform();
  await buildLightSource();
  await buildRoof();
}

// Execute the build
buildLighthouse();
