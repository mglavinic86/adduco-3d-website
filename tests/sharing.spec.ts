import { test, expect } from "@playwright/test";

test("link previews have complete Croatian metadata and a reachable image without JavaScript", async ({
  browser,
  request,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(baseURL!);
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
  const canonical = await page
    .locator('link[rel="canonical"]')
    .getAttribute("href");
  expect(canonical).toBe("https://adduco-crveni-monolit.mglavinic.chatgpt.site/");
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    canonical!,
  );
  expect(new URL(image!).origin).toBe(new URL(canonical!).origin);
  expect(image).toMatch(/\/assets\/.*\.jpg$/);
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
