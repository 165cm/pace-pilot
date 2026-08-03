const test = require("node:test");
const assert = require("node:assert/strict");
const sharp = require("sharp");
const fs = require("node:fs");

async function assertCircularPng(path, expectedSize) {
  const image = sharp(path);
  const metadata = await image.metadata();
  assert.equal(metadata.width, expectedSize);
  assert.equal(metadata.height, expectedSize);
  assert.equal(metadata.hasAlpha, true);
  const { data, info } = await image.ensureAlpha().raw().toBuffer({
    resolveWithObject: true,
  });
  const alphaAt = (x, y) => data[(y * info.width + x) * info.channels + 3];
  assert.equal(alphaAt(0, 0), 0);
  assert.equal(alphaAt(expectedSize - 1, 0), 0);
  assert.equal(alphaAt(0, expectedSize - 1), 0);
  assert.equal(alphaAt(expectedSize - 1, expectedSize - 1), 0);
  assert.ok(alphaAt(Math.floor(expectedSize / 2), 4) > 0);
}

test("package icons are circular PNGs with transparent corners", async () => {
  await assertCircularPng("assets/pace.s/icon.png", 256);
  await assertCircularPng("assets/pace.r/icon.png", 256);
});

test("store icon is a 240px circular PNG", async () => {
  await assertCircularPng("store/icon-240.png", 240);
});

test("app name is at most 9 characters in every locale", () => {
  const config = JSON.parse(fs.readFileSync("app.json", "utf8"));
  assert.equal(config.app.appName, "PacePilot");
  assert.ok(config.app.appName.length <= 9);
  for (const locale of Object.values(config.i18n)) {
    assert.equal(locale.appName, config.app.appName);
  }
});
