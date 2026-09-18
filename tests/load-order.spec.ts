import { test, expect } from "@playwright/test";

for (const [orientation, viewport] of [
  ["portrait", { width: 390, height: 844 }],
  ["landscape", { width: 1440, height: 900 }],
] as const) {
  test(`${orientation} preload matches the picture selection and requests no opposite opening`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    const openings = new Set<string>();
    page.on("request", (r) => {
      if (r.url().endsWith("-start.webp")) openings.add(r.url());
    });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const selected = await page
      .locator(".chapter-still img")
      .first()
      .evaluate((img: HTMLImageElement) => ({
        src: img.currentSrc,
        portrait: matchMedia("(max-aspect-ratio: 9/10)").matches,
        preloads: [
          ...document.querySelectorAll<HTMLLinkElement>(
            'head link[as="image"]',
          ),
        ]
          .filter((link) => matchMedia(link.media).matches)
          .map((link) => link.href),
      }));
    expect(selected.portrait).toBe(orientation === "portrait");
    expect(selected.src).toContain(`/${orientation}-start.webp`);
    expect(selected.preloads).toEqual([selected.src]);
    expect([...openings]).toEqual([selected.src]);
  });
}

test("HTML discovers the orientation still before the deferred bundle and paints without hydration", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (r) => requests.push(r.url()));
  await page.route("**/assets/index-*.js", (route) => route.abort());
  await page.goto("/");
  const preload = page.locator('head link[rel="preload"][as="image"]');
  await expect(preload).toHaveCount(2);
  for (const link of await preload.all())
    await expect(link).toHaveAttribute("fetchpriority", "high");
  const stillIndex = requests.findIndex((url) => url.endsWith("-start.webp"));
  const scriptIndex = requests.findIndex((url) =>
    /\/assets\/index-.*\.js$/.test(url),
  );
  expect(stillIndex).toBeGreaterThanOrEqual(0);
  expect(stillIndex).toBeLessThan(scriptIndex);
  await expect(page.locator(".chapter")).toHaveCSS(
    "background-image",
    /data:image\/webp;base64/,
  );
  await expect(
    page.getByRole("heading", { name: "Od vizije do stvarnosti." }),
  ).toBeVisible();
  await expect(
    page.locator('script[type="module"]').first(),
  ).not.toHaveAttribute("async");
});

test("a delayed opening still retains the inline artwork placeholder without JavaScript", async ({
  page,
}) => {
  await page.route("**/assets/index-*.js", (route) => route.abort());
  await page.route("**/*-start.webp", (route) => route.abort());
  await page.goto("/");
  const stage = page.locator(".chapter");
  await expect(stage).toBeInViewport();
  await expect(stage).toHaveCSS("background-image", /data:image\/webp;base64/);
  await expect(
    page.getByRole("heading", { name: "Od vizije do stvarnosti." }),
  ).toBeVisible();
  await page.screenshot({
    path: `/tmp/adduco-lqip-${test.info().project.name}.png`,
  });
});
