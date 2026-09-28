/* global document, setTimeout, clearTimeout */
import { chromium, webkit } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const dir = process.env.ADDUCO_QA_DIR || "/tmp/adduco-full-story-qa";
await mkdir(dir, { recursive: true });
const results = [];
for (const [engine, browserType, launch] of [
  ["chrome", chromium, { channel: "chrome" }],
  ["webkit", webkit, {}],
]) {
  const browser = await browserType.launch(launch);
  for (const [orientation, width, height] of [
    ["landscape", 1440, 900],
    ["portrait", 390, 844],
  ]) {
    const page = await browser.newPage({ viewport: { width, height } }),
      errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("http://127.0.0.1:5276/");
    await page
      .getByRole("heading", { name: "Od armature do simbola." })
      .waitFor();
    const video = page.locator(`#${orientation} video`);
    await video.scrollIntoViewIfNeeded();
    await page.waitForFunction(
      (id) => document.querySelector(`#${id} video`).readyState >= 1,
      orientation,
    );
    const metadata = await video.evaluate((v) => ({
      duration: v.duration,
      width: v.videoWidth,
      height: v.videoHeight,
    }));
    assert.equal(metadata.duration, 20);
    assert.equal(metadata.width, orientation === "portrait" ? 540 : 960);
    assert.equal(metadata.height, orientation === "portrait" ? 960 : 540);
    await video.evaluate(async (v) => {
      v.muted = true;
      await v.play();
      await new Promise((resolve) => v.requestVideoFrameCallback(resolve));
      v.pause();
    });
    const samples = [];
    for (const frame of [24, 0, 96, 192, 288, 384, 479, 216, 72, 336, 24]) {
      const shown = await video.evaluate(
        (v, frame) =>
          new Promise((resolve) => {
            const timer = setTimeout(() => resolve(null), 3000);
            v.requestVideoFrameCallback((_, metadata) => {
              clearTimeout(timer);
              resolve(metadata.mediaTime * 24);
            });
            v.currentTime = (frame + 0.5) / 24;
          }),
        frame,
      );
      assert.notEqual(shown, null);
      assert.ok(
        Math.abs(shown - frame) <= 1,
        `${engine} ${orientation} frame ${frame} received ${shown}`,
      );
      samples.push({ target: frame, presented: shown });
    }
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    assert.ok(overflow <= 1);
    assert.deepEqual(errors, []);
    for (const name of [
      "adduco-higgsfield-reference.zip",
      "HIGGSFIELD-REFERENCE.md",
      "brand-front.png",
      "brand-mask.png",
    ]) {
      const response = await page.request.get(`http://127.0.0.1:5276/${name}`, {
        headers: { Range: "bytes=0-127" },
      });
      assert.ok(response.ok());
      assert.ok(
        !(response.headers()["content-type"] || "").includes("text/html"),
        name,
      );
    }
    await video.evaluate((v) => {
      v.currentTime = 19.97;
    });
    await page.waitForTimeout(100);
    await page.screenshot({ path: `${dir}/${engine}-${orientation}.png` });
    results.push({
      engine,
      version: browser.version(),
      orientation,
      ...metadata,
      overflow,
      samples,
      errors,
    });
    await page.close();
  }
  await browser.close();
}
await writeFile(
  `${dir}/reference-browser.json`,
  JSON.stringify(results, null, 2),
);
console.log(JSON.stringify(results, null, 2));
