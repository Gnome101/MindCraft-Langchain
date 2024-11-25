// Step 1: Define dragon dimensions and position
const dragonBaseX = 150;
const dragonBaseY = 100;
const dragonBaseZ = 150;
const bodyLength = 30;
const bodyWidth = 8;
const bodyHeight = 12;
const neckLength = 15;
const wingSpan = 40;

// Step 2: Build the main body
async function buildBody() {
  for (let x = dragonBaseX; x < dragonBaseX + bodyLength; x++) {
    for (
      let z = dragonBaseZ - bodyWidth / 2;
      z < dragonBaseZ + bodyWidth / 2;
      z++
    ) {
      for (let y = dragonBaseY; y < dragonBaseY + bodyHeight; y++) {
        // Create tapered body shape
        const distanceFromCenter = Math.abs(z - dragonBaseZ);
        const taperedWidth =
          (bodyWidth / 2) * (1 - (x - dragonBaseX) / bodyLength);
        if (distanceFromCenter < taperedWidth) {
          await skills.placeBlock(bot, "obsidian", x, y, z);
        }
      }
    }
  }
}

// Step 3: Build the neck and head
async function buildNeckAndHead() {
  const neckStartX = dragonBaseX + bodyLength - 2;
  const neckCurve = [];

  // Generate curved neck points
  for (let i = 0; i < neckLength; i++) {
    const angle = ((i / neckLength) * Math.PI) / 2;
    const x = neckStartX + i;
    const y = dragonBaseY + bodyHeight + Math.sin(angle) * neckLength;
    neckCurve.push([x, y]);
  }

  // Build neck along curve
  for (const [x, y] of neckCurve) {
    for (let z = dragonBaseZ - 3; z < dragonBaseZ + 3; z++) {
      await skills.placeBlock(bot, "obsidian", x, y, z);
    }
  }

  // Build head
  const headX = neckStartX + neckLength;
  const headY = dragonBaseY + bodyHeight + neckLength;
  buildDragonHead(headX, headY, dragonBaseZ);
}

// Step 4: Build detailed head
async function buildDragonHead(x, y, z) {
  // Main skull
  for (let dx = 0; dx < 8; dx++) {
    for (let dy = 0; dy < 6; dy++) {
      for (let dz = -4; dz <= 4; dz++) {
        await skills.placeBlock(bot, "obsidian", x + dx, y + dy, z + dz);
      }
    }
  }

  // Horns
  for (let i = 0; i < 5; i++) {
    await skills.placeBlock(bot, "obsidian", x + 2, y + 6 + i, z - 3);
    await skills.placeBlock(bot, "obsidian", x + 2, y + 6 + i, z + 3);
  }

  // Eyes
  await skills.placeBlock(bot, "glowstone", x + 3, y + 3, z - 2);
  await skills.placeBlock(bot, "glowstone", x + 3, y + 3, z + 2);
}

// Step 5: Build wings
async function buildWings() {
  for (let wing = 0; wing <= 1; wing++) {
    // 0 = left wing, 1 = right wing
    const direction = wing === 0 ? -1 : 1;

    for (let x = 0; x < wingSpan; x++) {
      const wingHeight = Math.sin((x / wingSpan) * Math.PI) * 15;
      for (let y = 0; y < wingHeight; y++) {
        const z = dragonBaseZ + direction * (x / 2);
        await skills.placeBlock(
          bot,
          "obsidian",
          dragonBaseX + bodyLength / 2 + x / 2,
          dragonBaseY + bodyHeight + y,
          z
        );
      }
    }

    // Add wing membrane
    for (let x = 0; x < wingSpan; x++) {
      const maxHeight = Math.sin((x / wingSpan) * Math.PI) * 15;
      for (let y = 0; y < maxHeight; y++) {
        const z = dragonBaseZ + direction * (x / 2);
        if (x % 3 === 0 || y % 4 === 0) {
          // Create membrane pattern
          await skills.placeBlock(
            bot,
            "purple_stained_glass",
            dragonBaseX + bodyLength / 2 + x / 2,
            dragonBaseY + bodyHeight + y,
            z
          );
        }
      }
    }
  }
}

// Step 6: Add spikes along back
async function buildSpikes() {
  for (let x = dragonBaseX + 2; x < dragonBaseX + bodyLength - 2; x += 3) {
    const spikeHeight = 4;
    for (let y = 0; y < spikeHeight; y++) {
      await skills.placeBlock(
        bot,
        "obsidian",
        x,
        dragonBaseY + bodyHeight + y,
        dragonBaseZ
      );
    }
  }
}

// Step 7: Build tail
async function buildTail() {
  const tailLength = 25;
  for (let i = 0; i < tailLength; i++) {
    const tailWidth = Math.max(1, Math.floor(bodyWidth * (1 - i / tailLength)));
    const x = dragonBaseX - i;
    const y = dragonBaseY + Math.sin(i * 0.2) * 5; // Curved tail

    for (let w = -tailWidth / 2; w < tailWidth / 2; w++) {
      await skills.placeBlock(bot, "obsidian", x, y, dragonBaseZ + w);
    }
  }

  // Add tail spikes
  for (let i = 0; i < tailLength; i += 3) {
    if (i < tailLength - 5) {
      // Don't put spikes at the very end
      await skills.placeBlock(
        bot,
        "obsidian",
        dragonBaseX - i,
        dragonBaseY + Math.sin(i * 0.2) * 5 + 2,
        dragonBaseZ
      );
    }
  }
}

// Main build sequence
async function buildDragon() {
  await buildBody();
  await buildNeckAndHead();
  await buildWings();
  await buildSpikes();
  await buildTail();

  // Add finishing touches - fire breath effect
  const headX = dragonBaseX + bodyLength + neckLength;
  const headY = dragonBaseY + bodyHeight + neckLength;
  for (let i = 0; i < 5; i++) {
    await skills.placeBlock(
      bot,
      "magma_block",
      headX + 8 + i,
      headY + 2,
      dragonBaseZ
    );
  }
}

// Execute the build
buildDragon();
