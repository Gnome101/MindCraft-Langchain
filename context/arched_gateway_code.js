// Step 1: Define dimensions and materials
const gatewayBaseX = 700;
const gatewayBaseY = 64;
const gatewayBaseZ = 700;
const archHeight = 10;
const archWidth = 7;

// Step 2: Build the arch
async function buildArch() {
  const centerX = gatewayBaseX;
  const centerZ = gatewayBaseZ;

  for (let y = 0; y <= archHeight; y++) {
    const halfWidth = Math.round((archWidth / 2) * (1 - y / archHeight));
    for (let x = centerX - halfWidth; x <= centerX + halfWidth; x++) {
      await skills.placeBlock(bot, "stone_bricks", x, gatewayBaseY + y, centerZ);
    }
  }
}

// Step 3: Build the supporting pillars
async function buildPillars() {
  for (let y = gatewayBaseY; y < gatewayBaseY + archHeight; y++) {
    for (let x of [gatewayBaseX - archWidth / 2, gatewayBaseX + archWidth / 2]) {
      await skills.placeBlock(bot, "stone_bricks", x, y, gatewayBaseZ);
    }
  }
}

// Step 4: Add decorative elements
async function addDecorations() {
  for (let y = gatewayBaseY + 2; y < gatewayBaseY + archHeight - 2; y += 2) {
    for (let x of [gatewayBaseX - archWidth / 2 + 1, gatewayBaseX + archWidth / 2 - 1]) {
      await skills.placeBlock(bot, "torch", x, y, gatewayBaseZ);
    }
  }
}

// Main build function
async function buildArchedGateway() {
  await buildArch();
  await buildPillars();
  await addDecorations();
}

// Execute the build
buildArchedGateway();
