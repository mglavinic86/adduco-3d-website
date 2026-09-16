import { test, expect } from "@playwright/test";

test("initial enhancement never flashes overlapping chapter titles", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await page.addInitScript(() => {
    const samples: number[] = [];
    (window as unknown as { visibleCaptions: number[] }).visibleCaptions =
      samples;
    const observer = new MutationObserver(() => {
      if (!document.querySelector(".site.is-ready")) return;
      observer.disconnect();
      const sample = () => {
        samples.push(
          Array.from(document.querySelectorAll(".chapter-content")).filter(
            (el) => {
              const style = getComputedStyle(el);
              return (
                style.visibility === "visible" && Number(style.opacity) > 0.05
              );
            },
          ).length,
        );
        if (samples.length < 20) requestAnimationFrame(sample);
      };
      sample();
    });
    observer.observe(document, {
      childList: true,
      subtree: true,
      attributes: true,
    });
  });
  await page.goto("/?fallback");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { visibleCaptions: number[] }).visibleCaptions
            .length,
      ),
    )
    .toBe(20);
  const counts = await page.evaluate(
    () => (window as unknown as { visibleCaptions: number[] }).visibleCaptions,
  );
  expect(Math.max(...counts)).toBe(1);
});

test("captions settle at full contrast when scrolling stops between anchors", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await page.goto("/");
  await expect(page.locator(".world-film.ready")).toBeVisible();
  for (const progress of [0.4, 0.6, 1.4, 1.6, 0.6, 0.4, 0]) {
    await page.evaluate(
      (progress) =>
        window.scrollTo({
          top: document.getElementById("povjerenje")!.offsetTop * progress,
          behavior: "instant",
        }),
      progress,
    );
    const index = Math.round(progress);
    const caption = page.locator(".chapter-content").nth(index);
    await expect(page.locator(".journey-dock a").nth(index)).toHaveAttribute(
      "aria-current",
      "step",
    );
    await expect(caption).toHaveCSS("opacity", "1");
    await expect(caption.getByRole("link")).toBeInViewport();
    await expect(page.locator(".chapter-content:not([inert])")).toHaveCount(1);
  }
});

test("a short phone can start an inquiry and return to the same scene", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto("/?fallback");
  for (const id of ["vizija", "projekt"]) {
    await page.locator(`.journey-dock a[href="#${id}"]`).click();
    const caption = page.locator(`#${id} .chapter-content`);
    await expect(caption).toHaveCSS("opacity", "1");
    await expect(caption.getByRole("heading")).toBeInViewport({ ratio: 1 });
    await expect(caption.getByRole("link")).toBeInViewport({ ratio: 1 });
    const captionBox = (await caption.boundingBox())!;
    const headerBox = (await page.locator(".header").boundingBox())!;
    const hintBox = (await page.locator(".journey-meta").boundingBox())!;
    expect(captionBox.y).toBeGreaterThan(headerBox.y + headerBox.height);
    expect(captionBox.y + captionBox.height).toBeLessThan(hintBox.y);
    await page.screenshot({
      path: testInfo.outputPath(`short-phone-${id}.png`),
    });
  }
  await page.locator('.journey-dock a[href="#povjerenje"]').click();
  await expect
    .poll(() => page.evaluate(() => scrollY))
    .toBe(
      await page
        .locator("#povjerenje")
        .evaluate((el: HTMLElement) => el.offsetTop),
    );
  await expect(page.locator("#povjerenje .chapter-content")).toHaveCSS(
    "opacity",
    "1",
  );
  const position = await page.evaluate(() => scrollY);
  await page.locator(".header-cta").click();
  await expect(page.locator(".panel-shell")).toHaveCSS("opacity", "1");
  await page.screenshot({
    path: testInfo.outputPath("short-phone-contact.png"),
  });
  await expect(page.getByLabel("Ime i prezime *")).toBeInViewport({ ratio: 1 });
  await page.getByLabel("Ime i prezime *").fill("Testni investitor");
  await page.getByLabel("E-pošta *").fill("investitor@example.com");
  await page
    .getByLabel("O vašem projektu *")
    .fill("Želim razgovarati o izgradnji obiteljske kuće.");
  await page.getByRole("button", { name: "Pripremite upit" }).click();
  await expect(
    page.getByText("Upit još nije poslan.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Otvorite e-poštu" }),
  ).toHaveAttribute("href", /^mailto:/);
  await page.getByRole("button", { name: "Natrag u priču" }).click();
  expect(await page.evaluate(() => scrollY)).toBe(position);
  await expect(page.locator(".header-cta")).toBeFocused();
});

test("the phone menu supports keyboard entry, outside dismissal and focus return", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await page.goto("/?fallback");
  const nav = page.getByRole("navigation", { name: "Glavna navigacija" });
  await page.getByRole("button", { name: "Otvori izbornik" }).click();
  await expect(nav).toHaveCSS("opacity", "1");
  await page.screenshot({ path: testInfo.outputPath("phone-menu.png") });
  await expect(
    nav.getByRole("link", { name: "O nama", exact: true }),
  ).toBeFocused();
  // Exercise desktop Tab traversal in Chrome; the WebKit project is touch-mobile.
  if (testInfo.project.name === "chrome") {
    await page.keyboard.press("Tab");
    await expect(
      nav.getByRole("link", { name: "Usluge", exact: true }),
    ).toBeFocused();
  }
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Otvori izbornik" }),
  ).toBeFocused();
  await expect(nav).toBeHidden();
  await page.getByRole("button", { name: "Otvori izbornik" }).click();
  await page.mouse.click(5, 500);
  await expect(nav).toBeHidden();
  await page.getByRole("button", { name: "Otvori izbornik" }).click();
  await nav.getByRole("link", { name: "Usluge", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Usluge" })).toBeVisible();
  await page.getByRole("button", { name: "Natrag u priču" }).click();
  await expect(
    page.getByRole("button", { name: "Otvori izbornik" }),
  ).toBeFocused();
  expect(await page.evaluate(() => scrollY)).toBe(0);
});
