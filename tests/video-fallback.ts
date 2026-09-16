import { test as base } from "@playwright/test";
export { expect } from "@playwright/test";

/** Exercise the supported media path for browsers without ImageBitmap. */
export const test = base.extend({
  page: async ({ page }, run) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, "createImageBitmap", { value: undefined });
    });
    await run(page);
  },
});
