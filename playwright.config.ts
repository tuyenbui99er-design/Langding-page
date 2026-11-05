import { randomUUID } from "node:crypto";
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://localhost:3100",
    browserName: "chromium",
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
      args: ["--no-sandbox"],
    },
  },
  webServer: {
    command: "npm run start -- --port 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    env: {
      DATABASE_PATH:
        process.env.E2E_DATABASE_PATH ||
        `/tmp/minimal-e2e-${randomUUID()}.sqlite`,
      APP_ORIGIN: "http://localhost:3100",
    },
    timeout: 60000,
  },
});
