import { expect, test } from "@playwright/test";

for (const hash of ["o-nama", "usluge", "projekti", "kontakt"]) {
  test(`direct ${hash} reads without movies and returns to the full journey`, async ({
    page,
  }) => {
    const movies: string[] = [];
    page.on("request", (r) => {
      if (r.url().includes(".mp4")) movies.push(r.url());
    });
    await page.goto(`/#${hash}`);
    await expect(page.locator(`#${hash}`)).toBeInViewport();
    await page.waitForTimeout(700);
    expect(movies).toEqual([]);
    await page
      .getByRole("link", { name: "Adduco — početna", exact: true })
      .click();
    await expect.poll(() => movies.length).toBeGreaterThan(0);
    await page.evaluate(() => scrollTo(0, innerHeight));
    await expect(page.locator("video").first()).toHaveCSS("opacity", "1");
    await expect(page.locator(".header-cta")).toBeInViewport();
  });
}

test("stopping between scenes leaves exactly one fully readable caption", async ({
  page,
}) => {
  await page.goto("/");
  await expect
    .poll(() =>
      page
        .locator("video")
        .first()
        .evaluate((v: HTMLVideoElement) => v.readyState),
    )
    .toBe(4);
  for (const fraction of [0.42, 0.68, 0.29]) {
    await page.evaluate((fraction) => {
      const end = document.querySelector<HTMLElement>("#povjerenje")!.offsetTop;
      scrollTo(0, end * fraction);
    }, fraction);
    await expect(page.locator("video").first()).toHaveCSS("opacity", "1");
    const caption = page.locator('.scroll-caption:not([aria-hidden="true"])');
    await expect(caption).toHaveCount(1);
    await expect(caption).toHaveCSS("opacity", "1");
    await expect(caption.locator("a")).toBeInViewport();
  }
});

test("complete cinema needs at most 8.3 viewports while retaining all four scenes", async ({
  page,
}) => {
  await page.goto("/");
  const ratio = await page
    .locator(".scroll-track")
    .evaluate(
      (el) =>
        el.clientHeight /
        el.querySelector<HTMLElement>(".chapter")!.clientHeight,
    );
  expect(ratio).toBeLessThanOrEqual(8.3);
  await expect(
    page
      .getByRole("navigation", { name: "Prizori", exact: true })
      .getByRole("link"),
  ).toHaveCount(5);
});

test("project records disclose pending photography without illustrative portfolio images", async ({
  page,
}) => {
  await page.goto("/#projekti");
  await expect(
    page
      .locator("#projekti")
      .getByText("Fotografije u pripremi.", { exact: true }),
  ).toHaveCount(2);
  await expect(page.locator("#projekti img")).toHaveCount(0);
  await expect(
    page
      .locator("#projekti")
      .getByRole("heading", { name: "Rekonstrukcija Mlinske ulice" }),
  ).toBeVisible();
  await expect(
    page
      .locator("#projekti")
      .getByText("Sudjelovanje u izvođenju iskopa", { exact: true }),
  ).toBeVisible();
});

test("denied clipboard access leaves the draft available and never claims it was copied or sent", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: () =>
          Promise.reject(new DOMException("Denied", "NotAllowedError")),
      },
    }),
  );
  await page.goto("/#kontakt");
  await page.getByLabel("Ime i prezime *").fill("Ana Horvat");
  await page.getByLabel("E-pošta *").fill("ana@example.com");
  await page
    .getByLabel("O vašem projektu *")
    .fill("Izgradnja kuće u Metkoviću.");
  await page.getByRole("button", { name: "Pripremite upit" }).click();
  await page.getByRole("button", { name: "Kopirajte upit" }).click();
  await expect(
    page.getByText(
      "Kopiranje nije dostupno. Označite i kopirajte tekst upita iznad.",
    ),
  ).toBeVisible();
  await expect(page.locator(".form-result pre")).toContainText(
    "Izgradnja kuće u Metkoviću.",
  );
  await expect(page.getByText(/Upit još nije poslan/)).toBeVisible();
  await expect(page.getByText(/Upit je kopiran/)).toHaveCount(0);
});
