/* global scrollTo, document -- Used inside Playwright's browser-side evaluate callback. */
/** Render UI-free fallback images from the same Higgsfield GLB and live camera.
 * Usage: node scripts/capture-stills.mjs http://127.0.0.1:5184 /tmp/adduco-qa/stills
 * PNGs are review intermediates; convert approved captures to WebP before shipping.
 */
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const [url = "http://127.0.0.1:5184", destination = "/tmp/adduco-qa/stills"] =
  process.argv.slice(2);
await mkdir(destination, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  for (const [name, width, height] of [
    ["desktop", 1600, 1000],
    ["tablet", 1024, 1200],
    ["mobile", 780, 1800],
  ]) {
    const page = await browser.newPage({ viewport: { width, height } });
    await page.goto(url);
    const mode = page.getByRole("button", { name: "Mirni prikaz" });
    await page.waitForTimeout(300);
    if ((await mode.getAttribute("aria-pressed")) === "true")
      await mode.click();
    await page.locator("canvas.ready").waitFor({ timeout: 30000 });
    await page.addStyleTag({
      content:
        "header,main,.journey-dock,.skip,.world-wash{visibility:hidden!important}",
    });
    for (const [index, id] of [
      "vizija",
      "povjerenje",
      "preciznost",
      "projekt",
    ].entries()) {
      await page.evaluate(
        (id) =>
          scrollTo({
            top: document.getElementById(id).offsetTop,
            behavior: "instant",
          }),
        id,
      );
      await page.waitForTimeout(1100);
      await page
        .locator("canvas")
        .screenshot({ path: `${destination}/${name}-${index}.png` });
    }
    await page.close();
  }
} finally {
  await browser.close();
}
