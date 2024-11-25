// Step 1: Define dimensions and materials
const castleBaseX = 100;
const castleBaseY = 64;
const castleBaseZ = 200;
const wallHeight = 10;
const wallLength = 20;
const towerRadius = 4;
const towerHeight = 15;

// Step 2: Build the perimeter walls
for (let x = castleBaseX; x < castleBaseX + wallLength; x++) {
  for (let y = castleBaseY; y < castleBaseY + wallHeight; y++) {
    await skills.placeBlock(bot, "stone_bricks", x, y, castleBaseZ); // North wall
    await skills.placeBlock(
      bot,
      "stone_bricks",
      x,
      y,
      castleBaseZ + wallLength - 1
    ); // South wall
  }
}
for (let z = castleBaseZ; z < castleBaseZ + wallLength; z++) {
  for (let y = castleBaseY; y < castleBaseY + wallHeight; y++) {
    await skills.placeBlock(bot, "stone_bricks", castleBaseX, y, z); // West wall
    await skills.placeBlock(
      bot,
      "stone_bricks",
      castleBaseX + wallLength - 1,
      y,
      z
    ); // East wall
  }
}

// Step 3: Build the four corner towers
const towerPositions = [
  [castleBaseX, castleBaseZ],
  [castleBaseX + wallLength - 1, castleBaseZ],
  [castleBaseX, castleBaseZ + wallLength - 1],
  [castleBaseX + wallLength - 1, castleBaseZ + wallLength - 1],
];
for (const [towerX, towerZ] of towerPositions) {
  for (let x = towerX - towerRadius; x <= towerX + towerRadius; x++) {
    for (let z = towerZ - towerRadius; z <= towerZ + towerRadius; z++) {
      if (Math.sqrt((x - towerX) ** 2 + (z - towerZ) ** 2) <= towerRadius) {
        for (let y = castleBaseY; y < castleBaseY + towerHeight; y++) {
          await skills.placeBlock(bot, "stone_bricks", x, y, z);
        }
      }
    }
  }
}

// Step 4: Add a gate to the North wall
const gateWidth = 4;
for (
  let x = castleBaseX + wallLength / 2 - gateWidth / 2;
  x < castleBaseX + wallLength / 2 + gateWidth / 2;
  x++
) {
  for (let y = castleBaseY; y < castleBaseY + wallHeight / 2; y++) {
    await skills.breakBlock(bot, x, y, castleBaseZ); // Clear gate area
  }
  await skills.placeBlock(bot, "oak_planks", x, castleBaseY, castleBaseZ); // Add wooden flooring
}

// Step 5: Decorate the walls with torches
for (let x = castleBaseX; x < castleBaseX + wallLength; x++) {
  for (let z of [castleBaseZ, castleBaseZ + wallLength - 1]) {
    await skills.placeBlock(bot, "torch", x, castleBaseY + wallHeight - 1, z);
  }
}
for (let z = castleBaseZ; z < castleBaseZ + wallLength; z++) {
  for (let x of [castleBaseX, castleBaseX + wallLength - 1]) {
    await skills.placeBlock(bot, "torch", x, castleBaseY + wallHeight - 1, z);
  }
}

// Step 6: Build the central keep
const keepX = castleBaseX + wallLength / 4;
const keepZ = castleBaseZ + wallLength / 4;
const keepWidth = wallLength / 2;
const keepHeight = 12;

for (let x = keepX; x < keepX + keepWidth; x++) {
  for (let z = keepZ; z < keepZ + keepWidth; z++) {
    for (let y = castleBaseY; y < castleBaseY + keepHeight; y++) {
      if (
        x === keepX ||
        x === keepX + keepWidth - 1 ||
        z === keepZ ||
        z === keepZ + keepWidth - 1
      ) {
        await skills.placeBlock(bot, "stone_bricks", x, y, z); // Keep walls
      }
    }
  }
}
