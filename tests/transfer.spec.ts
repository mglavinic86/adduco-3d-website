import { test, expect } from "@playwright/test";
import { writeFile } from "node:fs/promises";

for (const orientation of ["portrait", "landscape"] as const) {
  test(`${orientation} cold transfer stays within the complete journey budget`, async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName !== "chromium",
      "Chrome DevTools provides actual HTTP transfer including repeated media ranges.",
    );
    await page.setViewportSize(
      orientation === "portrait"
        ? { width: 390, height: 844 }
        : { width: 1440, height: 900 },
    );
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    const requests = new Map<string, { url: string; bytes: number }>();
    cdp.on("Network.responseReceived", (event) =>
      requests.set(event.requestId, { url: event.response.url, bytes: 0 }),
    );
    cdp.on("Network.loadingFinished", (event) => {
      const request = requests.get(event.requestId);
      if (request) request.bytes = event.encodedDataLength;
    });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const sum = () =>
      [...requests.values()].reduce((sum, r) => sum + r.bytes, 0);
    const firstViewBytes = sum();
    if (orientation === "portrait")
      expect(firstViewBytes).toBeLessThanOrEqual(2_000_000);
    if (orientation === "portrait") {
      await page.getByRole("button", { name: "Otvori izbornik" }).click();
      await page.evaluate(() => document.fonts.ready);
      await page.keyboard.press("Escape");
    }
    await page.locator("body").click({ position: { x: 300, y: 300 } });
    const captions = [
      "Od vizije do stvarnosti.",
      "Snaga je u detalju.",
      "Gradimo u visinu.",
      "Vaš projekt počinje razgovorom.",
    ];
    for (let scene = 1; scene < 4; scene++) {
      await page.keyboard.press("PageDown");
      await expect(
        page.getByRole("heading", { name: captions[scene] }),
      ).toBeVisible({ timeout: 7000 });
      await expect(
        page.locator(
          `video[data-transition="${scene}"][data-direction="forward"]`,
        ),
      ).toHaveJSProperty("ended", true);
    }
    for (let scene = 2; scene >= 0; scene--) {
      await page.keyboard.press("PageUp");
      await expect(
        page.getByRole("heading", { name: captions[scene] }),
      ).toBeVisible({ timeout: 7000 });
      await expect(
        page.locator(
          `video[data-transition="${scene + 1}"][data-direction="reverse"]`,
        ),
      ).toHaveJSProperty("ended", true);
    }
    for (const id of ["o-nama", "usluge", "priprema", "projekti", "kontakt"]) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
    }
    await page.waitForLoadState("networkidle");
    const currentPageBytes = sum();
    const movies = [...requests.values()].filter((r) => r.url.endsWith(".mp4"));
    const report = {
      orientation,
      firstViewBytes,
      currentPageBytes,
      scope:
        "All four scenes, all three forward and reverse films, mobile menu and every business section.",
      requests: [...requests.values()],
    };
    await writeFile(
      `/tmp/adduco-transfer-${orientation}.json`,
      JSON.stringify(report, null, 2),
    );
    console.log(
      JSON.stringify({ orientation, firstViewBytes, currentPageBytes }),
    );
    expect(currentPageBytes).toBeLessThanOrEqual(5_000_000);
    expect(new Set(movies.map((r) => r.url)).size).toBe(6);
    expect(movies.every((r) => r.url.includes(`/${orientation}-`))).toBe(true);
  });
}
