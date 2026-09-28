import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: process.env.ADDUCO_BASE_URL || "http://127.0.0.1:5277",
    headless: true,
    viewport: { width: 1440, height: 900 },
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
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  reporter: "list",
});
