import { test, expect } from "@playwright/test";

test("link previews have complete Croatian metadata and a reachable image without JavaScript", async ({
  browser,
  request,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:5184/");
  const title = await page.title();
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    title,
  );
  await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute(
    "content",
    title,
  );
  const description = await page
    .locator('meta[name="description"]')
    .getAttribute("content");
  expect(description).toContain("Visokogradnja");
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
    "content",
    description!,
  );
  await expect(
    page.locator('meta[name="twitter:description"]'),
  ).toHaveAttribute("content", description!);
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute(
    "content",
    "hr_HR",
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image",
  );
  const image = await page
    .locator('meta[property="og:image"]')
    .getAttribute("content");
  expect(image).toMatch(
    /^https:\/\/adduco-crveni-monolit\.mglavinic\.chatgpt\.site\/assets\/.*\.jpg$/,
  );
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
    "content",
    image!,
  );
  await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute(
    "content",
    /konstrukcij/,
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex, nofollow",
  );
  const response = await request.get(new URL(image!).pathname);
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toContain("image/jpeg");
  const bytes = await response.body();
  expect(bytes[0]).toBe(0xff);
  expect(bytes[1]).toBe(0xd8);
  expect(bytes.length).toBeLessThan(300_000);
  await context.close();
});
