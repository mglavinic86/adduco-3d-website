import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const width of [390, 768, 1440]) {
  test(`native scroll layout and readable sections at ${width}px`, async ({
    page,
  }, testInfo) => {
    const height = width === 768 ? 1024 : width === 1440 ? 900 : 844;
    await page.setViewportSize({ width, height });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Od vizije do stvarnosti." }),
    ).toBeVisible();
    await expect(page.locator("html")).toHaveCSS("scroll-snap-type", "none");
    expect(
      await page
        .locator(".chapter")
        .evaluate((e) => e.getBoundingClientRect().height),
    ).toBe(height);
    expect(
      await page.locator("body").evaluate((e) => e.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await expect(
      page.getByRole("link", { name: "Upoznajte Adduco", exact: true }),
    ).toBeInViewport();
    await expect(page.getByRole("button", { name: /animaciju/ })).toHaveCount(
      0,
    );
    await expect(page.locator("video").first()).toHaveJSProperty("muted", true);
    await expect(page.locator("video").first()).toHaveJSProperty(
      "playsInline",
      true,
    );
    await expect(page.locator("video").first()).toHaveJSProperty(
      "controls",
      false,
    );
    await page.screenshot({
      path: `/tmp/adduco-chapter1-${testInfo.project.name}-${width}.png`,
    });
    await page
      .getByRole("link", { name: "Upoznajte Adduco", exact: true })
      .click();
    await expect(page.locator("#o-nama")).toBeInViewport();
    await page.screenshot({
      path: `/tmp/adduco-business-${testInfo.project.name}-${width}.png`,
    });
    expect(errors).toEqual([]);
  });
}

for (const hash of ["o-nama", "usluge", "priprema", "projekti", "kontakt"]) {
  test(`direct #${hash} opens ordinary content and survives Back`, async ({
    page,
  }) => {
    await page.goto(`/#${hash}`);
    await expect(page.locator(`#${hash}`)).toBeInViewport();
    await expect(page.locator("dialog")).toHaveCount(0);
    await page.getByRole("link", { name: "Adduco — početna" }).click();
    await expect(page.locator("#vizija")).toBeInViewport();
    await page.goBack();
    await expect(page.locator(`#${hash}`)).toBeInViewport();
  });
}

test("mobile menu, keyboard access, inquiry and PDF work without playback", async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Otvori izbornik" }).click();
  await expect(
    page
      .getByRole("navigation", { name: "Glavna navigacija" })
      .getByRole("link", { name: "O nama" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Otvori izbornik" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Otvori izbornik" }).click();
  await page
    .getByRole("navigation", { name: "Glavna navigacija" })
    .getByRole("link", { name: "Kontakt", exact: true })
    .click();
  await expect(page.locator("#kontakt")).toBeInViewport();
  await page.getByRole("button", { name: "Pripremite upit" }).click();
  await expect(page.getByText("Unesite svoje ime.")).toBeVisible();
  await page.getByLabel("Ime i prezime *").fill("Ana Horvat");
  await page.getByLabel("E-pošta *").fill("ana@example.com");
  await page
    .getByLabel("O vašem projektu *")
    .fill("Planiramo izgradnju kuće u Metkoviću.");
  await page.getByRole("button", { name: "Pripremite upit" }).click();
  await expect(
    page.getByRole("link", { name: "Otvorite e-poštu" }),
  ).toHaveAttribute("href", /^mailto:/);
  await expect(page.getByText(/Upit još nije poslan/)).toBeVisible();
  const pdf = await request.get("/kontrolna-lista-adduco.pdf");
  expect(pdf.ok()).toBe(true);
  expect((await pdf.body()).subarray(0, 5).toString()).toBe("%PDF-");
  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
});

test("all text and hash navigation work without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto(process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:5184/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page
    .getByRole("navigation", { name: "Glavna navigacija" })
    .getByRole("link", { name: "Usluge" })
    .click();
  await expect(page.locator("#usluge")).toBeInViewport();
  await expect(page.locator("video").first()).toHaveAttribute(
    "preload",
    "none",
  );
  await context.close();
});

for (const [width, height] of [
  [360, 640],
  [390, 844],
  [768, 1024],
  [1440, 900],
]) {
  test(`destination caption and navigation fit ${width}x${height}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height });
    await page.goto("/#povjerenje");
    await expect(
      page.getByRole("heading", { name: "Snaga je u detalju." }),
    ).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await expect(
      page.locator('.chapter-content[aria-hidden="false"]'),
    ).toHaveCSS("opacity", "1");
    await expect(
      page.getByRole("link", { name: "Istražite usluge" }),
    ).toBeInViewport();
    const caption = await page
      .locator('.chapter-content[aria-hidden="false"]')
      .boundingBox();
    const nav = await page
      .getByRole("navigation", { name: "Prizori" })
      .boundingBox();
    const header = await page.locator("header").boundingBox();
    expect(caption!.y).toBeGreaterThan(header!.y + header!.height);
    expect(caption!.y + caption!.height).toBeLessThan(nav!.y);
    expect(
      await page.locator("body").evaluate((e) => e.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await page.screenshot({
      path: `/tmp/adduco-detail-${testInfo.project.name}-${width}.png`,
    });
  });
}

test("a direct scene change never paints both captions on top of one another", async ({
  page,
}) => {
  await page.goto("/#povjerenje");
  await expect(
    page.getByRole("heading", { name: "Snaga je u detalju." }),
  ).toBeVisible();
  const painted = await page.locator(".chapter-content").evaluateAll(
    (captions) =>
      captions.filter((caption) => {
        const style = getComputedStyle(caption);
        return style.visibility === "visible" && Number(style.opacity) > 0;
      }).length,
  );
  expect(painted).toBeLessThanOrEqual(1);
});
