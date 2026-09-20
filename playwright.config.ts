import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:5184",
    headless: true,
  },
  projects: [
    {
      name: "chrome",
      use: { channel: "chrome" },
    },
    {
      name: "webkit",
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
