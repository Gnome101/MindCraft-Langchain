// Step 1: Define dimensions and materials
const towerBaseX = 250;
const towerBaseY = 64;
const towerBaseZ = 250;
const towerHeight = 20;
const towerRadius = 5;

// Step 2: Build the cylindrical tower base
async function buildTowerBase() {
  for (let y = towerBaseY; y < towerBaseY + towerHeight; y++) {
    for (let x = towerBaseX - towerRadius; x <= towerBaseX + towerRadius; x++) {
      for (let z = towerBaseZ - towerRadius; z <= towerBaseZ + towerRadius; z++) {
        const distance = Math.sqrt((x - towerBaseX) ** 2 + (z - towerBaseZ) ** 2);
        if (distance >= towerRadius - 1 && distance <= towerRadius) {
          await skills.placeBlock(bot, "cobblestone", x, y, z);
        }
      }
    }
  }
}

// Step 3: Build the floor and ceiling
async function buildFloors() {
  // Ground floor
  for (let x = towerBaseX - towerRadius + 1; x <= towerBaseX + towerRadius - 1; x++) {
    for (let z = towerBaseZ - towerRadius + 1; z <= towerBaseZ + towerRadius - 1; z++) {
      await skills.placeBlock(bot, "oak_planks", x, towerBaseY, z);
    }
  }
  // Top floor
  for (let x = towerBaseX - towerRadius + 1; x <= towerBaseX + towerRadius - 1; x++) {
    for (let z = towerBaseZ - towerRadius + 1; z <= towerBaseZ + towerRadius - 1; z++) {
      await skills.placeBlock(bot, "oak_planks", x, towerBaseY + towerHeight - 1, z);
    }
  }
}

// Step 4: Add windows
async function addWindows() {
  for (let y = towerBaseY + 2; y < towerBaseY + towerHeight - 2; y += 3) {
    await skills.placeBlock(bot, "air", towerBaseX + towerRadius - 1, y, towerBaseZ);
    await skills.placeBlock(bot, "air", towerBaseX - towerRadius + 1, y, towerBaseZ);
    await skills.placeBlock(bot, "air", towerBaseX, y, towerBaseZ + towerRadius - 1);
    await skills.placeBlock(bot, "air", towerBaseX, y, towerBaseZ - towerRadius + 1);
  }
}

// Step 5: Add a door
async function addDoor() {
  await skills.placeBlock(bot, "air", towerBaseX, towerBaseY + 1, towerBaseZ - towerRadius + 1);
  await skills.placeBlock(bot, "air", towerBaseX, towerBaseY + 2, towerBaseZ - towerRadius + 1);
}

// Step 6: Build the roof
async function buildRoof() {
  for (let y = 0; y < towerRadius; y++) {
    for (let x = towerBaseX - towerRadius + y; x <= towerBaseX + towerRadius - y; x++) {
      for (let z = towerBaseZ - towerRadius + y; z <= towerBaseZ + towerRadius - y; z++) {
        await skills.placeBlock(bot, "cobblestone", x, towerBaseY + towerHeight - 1 + y, z);
      }
    }
  }
}

// Step 7: Add torches
async function addTorches() {
  await skills.placeBlock(bot, "torch", towerBaseX, towerBaseY + towerHeight - 2, towerBaseZ);
}

// Main build function
async function buildWatchtower() {
  await buildTowerBase();
  await buildFloors();
  await addWindows();
  await addDoor();
  await buildRoof();
  await addTorches();
}

// Execute the build
buildWatchtower();
