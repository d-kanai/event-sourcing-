import { After, AfterAll, Before, BeforeAll, setDefaultTimeout } from "@cucumber/cucumber";
import { chromium } from "@playwright/test";
import { devServerManager } from "./server-manager";
import { disconnectPrisma } from "./prisma";
import type { CustomWorld } from "./world";

setDefaultTimeout(120 * 1000);

BeforeAll(async () => {
  await devServerManager.ensureStarted();
});

Before<CustomWorld>(async function () {
  const headlessEnv = process.env.PLAYWRIGHT_HEADLESS;
  const headless = headlessEnv ? headlessEnv !== "false" : true;

  this.browser = await chromium.launch({ headless });
  this.context = await this.browser.newContext();
  this.page = await this.context.newPage();
});

After<CustomWorld>(async function () {
  await this.page?.close();
  await this.context?.close();
  await this.browser?.close();
});

AfterAll(async () => {
  await devServerManager.stopAll();
  await disconnectPrisma();
});
