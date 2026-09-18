import { test, expect } from "@playwright/test";

test("opening stays still until a deliberate scene request", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.waitForLoadState("networkidle");
  await expect(
    page.getByRole("heading", { name: "Od vizije do stvarnosti." }),
  ).toBeVisible();
  expect(
    await page
      .locator("video")
      .evaluateAll((videos) =>
        videos.every(
          (v) =>
            (v as HTMLVideoElement).paused &&
            (v as HTMLVideoElement).currentTime === 0,
        ),
      ),
  ).toBe(true);
});

test("one downward request plays to the detail scene, then an upward request returns", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.waitForLoadState("networkidle");
  await page.keyboard.press("PageDown");
  await expect(
    page.getByRole("heading", { name: "Snaga je u detalju." }),
  ).toBeVisible({ timeout: 7000 });
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await expect(
    page.locator('video[data-transition="1"][data-direction="forward"]'),
  ).toHaveJSProperty("ended", true);
  await page.keyboard.press("PageUp");
  await expect(
    page.getByRole("heading", { name: "Od vizije do stvarnosti." }),
  ).toBeVisible({ timeout: 7000 });
  await expect(
    page.locator('video[data-transition="1"][data-direction="reverse"]'),
  ).toHaveJSProperty("ended", true);
});

test("rapid opposite inputs during playback do not queue another transition", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.keyboard.press("PageDown");
  const forward = page.locator(
    'video[data-transition="1"][data-direction="forward"]',
  );
  await expect
    .poll(() => forward.evaluate((v: HTMLVideoElement) => v.currentTime))
    .toBeGreaterThan(0.1);
  for (const key of ["PageUp", "PageDown", "PageUp", "PageDown"])
    await page.keyboard.press(key);
  await expect(
    page.getByRole("heading", { name: "Snaga je u detalju." }),
  ).toBeVisible({ timeout: 7000 });
  await expect(
    page.locator('video[data-transition="1"][data-direction="reverse"]'),
  ).toHaveJSProperty("currentTime", 0);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await expect(forward).toHaveJSProperty("ended", true);
  await page.keyboard.press("PageUp");
  await expect(
    page.getByRole("heading", { name: "Od vizije do stvarnosti." }),
  ).toBeVisible({ timeout: 7000 });
  await expect(
    page.locator('video[data-transition="1"][data-direction="reverse"]'),
  ).toHaveJSProperty("ended", true);
  await page.keyboard.press("PageDown");
  await expect
    .poll(() => forward.evaluate((v: HTMLVideoElement) => v.currentTime))
    .toBeLessThan(1);
  await expect(
    page.getByRole("heading", { name: "Snaga je u detalju." }),
  ).toBeVisible({ timeout: 7000 });
  await expect(forward).toHaveJSProperty("ended", true);
});

test("a continuous wheel burst is consumed through the ending, then a fresh gesture reverses", async ({
  page,
  browserName,
  isMobile,
}) => {
  test.skip(
    browserName === "webkit" && isMobile,
    "Mobile WebKit has no wheel input; touch and keyboard are covered separately.",
  );
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.waitForLoadState("networkidle");
  await page.mouse.move(300, 300);
  await page.mouse.wheel(0, 100);
  // Deliberately keep wheel momentum arriving across the actual movie ending.
  for (let i = 0; i < 36; i++) {
    await page.mouse.wheel(0, i % 2 ? -45 : 45);
    await page.waitForTimeout(100);
  }
  await expect(
    page.getByRole("heading", { name: "Snaga je u detalju." }),
  ).toBeVisible();
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await expect(
    page.locator('video[data-transition="1"][data-direction="reverse"]'),
  ).toHaveJSProperty("currentTime", 0);
  await page.waitForTimeout(300);
  await page.mouse.wheel(0, -120);
  await expect(
    page.getByRole("heading", { name: "Od vizije do stvarnosti." }),
  ).toBeVisible({ timeout: 7000 });
});

test("horizontal input and zoom pass through; business content scrolls normally", async ({
  page,
  browserName,
  isMobile,
}) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const result = await page.locator(".chapter").evaluate((stage) => {
    return [
      { deltaX: 150, deltaY: 2 },
      { deltaY: 140, ctrlKey: true },
    ].map((options) => {
      const event = new WheelEvent("wheel", {
        ...options,
        bubbles: true,
        cancelable: true,
      });
      stage.dispatchEvent(event);
      return event.defaultPrevented;
    });
  });
  expect(result).toEqual([false, false]);
  await expect(
    page.getByRole("heading", { name: "Od vizije do stvarnosti." }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Razgovarajmo o vašem projektu" })
    .first()
    .click();
  const before = await page.evaluate(() => window.scrollY);
  if (browserName === "webkit" && isMobile) await page.keyboard.press("PageUp");
  else {
    await page.mouse.move(300, 500);
    await page.mouse.wheel(0, -600);
  }
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeLessThan(before);
});

test("a portrait touch swipe triggers a complete forward film and a fresh swipe reverses", async ({
  page,
  browserName,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.waitForLoadState("networkidle");
  const cdp =
    browserName === "chromium"
      ? await page.context().newCDPSession(page)
      : null;
  if (cdp)
    await cdp.send("Emulation.setTouchEmulationEnabled", {
      enabled: true,
      maxTouchPoints: 2,
    });
  async function swipe(from: number, to: number) {
    if (cdp) {
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x: 180, y: from }],
      });
      for (let i = 1; i <= 6; i++)
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ x: 180, y: from + ((to - from) * i) / 6 }],
        });
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
    } else {
      // Playwright's mobile WebKit exposes taps, not swipes. Exercise TouchEvents on the stage.
      await page.locator(".chapter").evaluate(
        (stage, [fromY, toY]) => {
          for (const [type, y] of [
            ["touchstart", fromY],
            ["touchmove", toY],
            ["touchend", toY],
          ] as const) {
            const touch = {
              identifier: 1,
              target: stage,
              clientX: 180,
              clientY: y,
            };
            const event = new Event(type, { bubbles: true, cancelable: true });
            Object.defineProperties(event, {
              touches: { value: type === "touchend" ? [] : [touch] },
              changedTouches: { value: [touch] },
            });
            stage.dispatchEvent(event);
          }
        },
        [from, to],
      );
    }
  }
  await swipe(500, 300);
  await expect(
    page.getByRole("heading", { name: "Snaga je u detalju." }),
  ).toBeVisible({ timeout: 7000 });
  await expect(
    page.locator('video[data-transition="1"][data-direction="forward"]'),
  ).toHaveJSProperty("ended", true);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await swipe(300, 500);
  await expect(
    page.getByRole("heading", { name: "Od vizije do stvarnosti." }),
  ).toBeVisible({ timeout: 7000 });
  await expect(
    page.locator('video[data-transition="1"][data-direction="reverse"]'),
  ).toHaveJSProperty("ended", true);
});

test("scrolling over a caption link still starts the film without leaving the stage", async ({
  page,
  browserName,
  isMobile,
}) => {
  test.skip(
    browserName === "webkit" && isMobile,
    "Wheel test on desktop Chrome; touch input covered separately.",
  );
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page
    .getByRole("link", { name: "Upoznajte Adduco", exact: true })
    .hover();
  await page.mouse.wheel(0, 150);
  await expect(
    page.getByRole("heading", { name: "Snaga je u detalju." }),
  ).toBeVisible({ timeout: 7000 });
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});
