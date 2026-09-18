import { test, expect } from "@playwright/test";

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
