// Step 1: Define dimensions and materials
const staircaseBaseX = 300;
const staircaseBaseY = 64;
const staircaseBaseZ = 300;
const staircaseHeight = 15;
const radius = 4;

// Step 2: Build the central pillar
async function buildCentralPillar() {
  for (let y = staircaseBaseY; y < staircaseBaseY + staircaseHeight; y++) {
    await skills.placeBlock(bot, "stone_bricks", staircaseBaseX, y, staircaseBaseZ);
  }
}

// Step 3: Build the spiral steps
async function buildSpiralSteps() {
  const stepsPerRevolution = 8;
  const totalSteps = staircaseHeight * stepsPerRevolution;
  for (let i = 0; i < totalSteps; i++) {
    const angle = (i / stepsPerRevolution) * (2 * Math.PI);
    const x = staircaseBaseX + Math.round(radius * Math.cos(angle));
    const y = staircaseBaseY + Math.floor(i / stepsPerRevolution);
    const z = staircaseBaseZ + Math.round(radius * Math.sin(angle));
    await skills.placeBlock(bot, "stone_slab", x, y, z);
  }
}

// Step 4: Add railing
async function addRailing() {
  const railingHeight = staircaseHeight;
  for (let y = staircaseBaseY; y < staircaseBaseY + railingHeight; y++) {
    for (let angle = 0; angle < 360; angle += 30) {
      const rad = (angle * Math.PI) / 180;
      const x = staircaseBaseX + Math.round((radius + 1) * Math.cos(rad));
      const z = staircaseBaseZ + Math.round((radius + 1) * Math.sin(rad));
      await skills.placeBlock(bot, "fence", x, y, z);
    }
  }
}

// Main build function
async function buildSpiralStaircase() {
  await buildCentralPillar();
  await buildSpiralSteps();
  await addRailing();
}

// Execute the build
buildSpiralStaircase();
