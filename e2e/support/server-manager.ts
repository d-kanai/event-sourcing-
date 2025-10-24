import { spawn, type ChildProcessWithoutNullStreams } from "child_process";
import { existsSync, rmSync } from "fs";
import path from "path";
import { PrismaClient as UserPrismaClient } from "../../backend/node_modules/@prisma/user-client";

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHttp(url: string, { timeoutMs = 30000, intervalMs = 1000 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url, { method: "GET" });
      if (response.status < 500) {
        return;
      }
    } catch (error) {
      // Server not ready yet
    }
    await delay(intervalMs);
  }

  throw new Error(`Timed out waiting for ${url}`);
}

interface ManagedProcess {
  name: string;
  process: ChildProcessWithoutNullStreams;
  stop(): Promise<void>;
}

export class DevServerManager {
  private processes: ManagedProcess[] = [];
  private started = false;
  private readonly userDatabaseUrl: string;

  constructor() {
    const defaultDbPath = path.resolve(this.resolvePath("../backend"), "dev.db");
    this.userDatabaseUrl = process.env.USER_DATABASE_URL ?? `file:${defaultDbPath}`;
    process.env.USER_DATABASE_URL = this.userDatabaseUrl;
  }

  async ensureStarted() {
    if (this.started) {
      return;
    }

    await this.prepareUserDatabase();
    await this.startFirestore();
    await this.startBackend();
    await this.startFrontend();

    this.started = true;
  }

  async stopAll() {
    const stopTasks = this.processes.map(async (managed) => {
      await managed.stop();
    });

    await Promise.all(stopTasks);

    this.processes = [];
    this.started = false;
  }

  private async startFirestore() {
    const command = spawn("npm", ["run", "firestore:start"], {
      cwd: this.resolvePath("../backend"),
      env: {
        ...process.env,
        FIRESTORE_EMULATOR_HOST: process.env.FIRESTORE_EMULATOR_HOST || "localhost:8085",
        FIRESTORE_PROJECT_ID: process.env.FIRESTORE_PROJECT_ID || "event-sourcing-local",
        FORCE_COLOR: "1",
      },
      stdio: "pipe",
    });

    command.stdout.on("data", (data) => {
      process.stdout.write(`[firestore] ${data}`);
    });
    command.stderr.on("data", (data) => {
      process.stderr.write(`[firestore] ${data}`);
    });

    const stop = async () => this.stopProcess(command, "firestore");
    this.processes.push({ name: "firestore", process: command, stop });

    await waitForHttp("http://localhost:8085", { timeoutMs: 45000, intervalMs: 1500 });
  }

  private async startBackend() {
    const command = spawn("npm", ["run", "dev:user"], {
      cwd: this.resolvePath("../backend"),
      env: {
        ...process.env,
        FIRESTORE_EMULATOR_HOST: process.env.FIRESTORE_EMULATOR_HOST || "localhost:8085",
        FIRESTORE_PROJECT_ID: process.env.FIRESTORE_PROJECT_ID || "event-sourcing-local",
        USER_SERVICE_PORT: process.env.USER_SERVICE_PORT || "3001",
        USER_DATABASE_URL: this.userDatabaseUrl,
        FORCE_COLOR: "1",
      },
      stdio: "pipe",
    });

    command.stdout.on("data", (data) => {
      process.stdout.write(`[backend] ${data}`);
    });
    command.stderr.on("data", (data) => {
      process.stderr.write(`[backend] ${data}`);
    });

    const stop = async () => this.stopProcess(command, "backend");
    this.processes.push({ name: "backend", process: command, stop });

    await waitForHttp("http://localhost:3001", { timeoutMs: 45000, intervalMs: 1500 });
  }

  private async startFrontend() {
    const port = process.env.FRONTEND_PORT || "3100";
    const baseUrl = process.env.FRONTEND_BASE_URL || `http://localhost:${port}`;
    process.env.FRONTEND_BASE_URL = baseUrl;
    const lockFilePath = path.resolve(this.resolvePath("../frontend_customer"), ".next/dev/lock");
    if (existsSync(lockFilePath)) {
      rmSync(lockFilePath);
    }

    const command = spawn("npm", ["run", "dev"], {
      cwd: this.resolvePath("../frontend_customer"),
      env: {
        ...process.env,
        NEXT_PUBLIC_USER_SERVICE_URL: process.env.NEXT_PUBLIC_USER_SERVICE_URL || "http://localhost:3001",
        PORT: port,
        FORCE_COLOR: "1",
      },
      stdio: "pipe",
    });

    command.stdout.on("data", (data) => {
      process.stdout.write(`[frontend] ${data}`);
    });
    command.stderr.on("data", (data) => {
      process.stderr.write(`[frontend] ${data}`);
    });

    const stop = async () => this.stopProcess(command, "frontend");
    this.processes.push({ name: "frontend", process: command, stop });

    await waitForHttp(baseUrl, { timeoutMs: 60000, intervalMs: 1500 });
  }

  private async stopProcess(child: ChildProcessWithoutNullStreams, label: string) {
    if (child.killed || child.exitCode !== null || child.signalCode !== null) {
      return;
    }

    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        if (!child.killed) {
          child.kill("SIGKILL");
        }
      }, 5000);

      child.once("exit", () => {
        clearTimeout(timeout);
        resolve();
      });

      child.kill("SIGINT");
    });

    process.stdout.write(`[${label}] stopped\n`);
  }

  private resolvePath(relative: string) {
    return path.resolve(__dirname, "..", relative);
  }

  private async prepareUserDatabase() {
    const prisma = new UserPrismaClient({
      datasources: {
        db: {
          url: this.userDatabaseUrl,
        },
      },
    });

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await prisma.$disconnect();
  }
}

export const devServerManager = new DevServerManager();
