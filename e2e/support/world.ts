import { IWorldOptions, setWorldConstructor, World } from "@cucumber/cucumber";
import type { Browser, BrowserContext, Page } from "@playwright/test";

export interface RegistrationContext {
  name?: string;
  email?: string;
  userId?: string;
}

export interface RuntimeWorld extends World {
  browser?: Browser;
  context?: BrowserContext;
  page?: Page;
  baseUrl: string;
  registration?: RegistrationContext;
}

class CustomWorld extends World implements RuntimeWorld {
  browser?: Browser;
  context?: BrowserContext;
  page?: Page;
  baseUrl: string;
  registration?: RegistrationContext;

  constructor(options: IWorldOptions) {
    super(options);
    const parameterBaseUrl = options.parameters?.baseUrl as string | undefined;
    this.baseUrl = parameterBaseUrl || process.env.FRONTEND_BASE_URL || "http://localhost:3000";
  }
}

setWorldConstructor(CustomWorld);

export type { CustomWorld };
