import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  use: { baseURL: "http://127.0.0.1:5184", headless: true },
  projects: [
    {
      name: "chrome",
      testIgnore: "**/webkit-film.spec.ts",
      use: { channel: "chrome" },
    },
    {
      name: "webkit",
      testMatch: [
        "**/webkit-film.spec.ts",
        "**/opening.spec.ts",
        "**/viewport.spec.ts",
        "**/interface.spec.ts",
        "**/loading.spec.ts",
      ],
      use: {
        browserName: "webkit",
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
      },
    },
  ],
  reporter: "list",
});
