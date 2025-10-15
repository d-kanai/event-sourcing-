import { PrismaClient } from './generated/test-client';
import { join } from 'path';
import { unlinkSync, existsSync, copyFileSync } from 'fs';

const TEST_DB_PATH = join(__dirname, 'test.db');
const TEMPLATE_DB_PATH = join(__dirname, 'test-template.db');

let templateCreated = false;

export async function setupTestDatabase(): Promise<PrismaClient> {
  if (!templateCreated) {
    if (existsSync(TEMPLATE_DB_PATH)) {
      unlinkSync(TEMPLATE_DB_PATH);
    }

    const templatePrisma = new PrismaClient({
      datasources: {
        db: {
          url: `file:${TEMPLATE_DB_PATH}`
        }
      }
    });

    await templatePrisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await templatePrisma.$disconnect();
    templateCreated = true;
  }

  if (existsSync(TEST_DB_PATH)) {
    unlinkSync(TEST_DB_PATH);
  }

  copyFileSync(TEMPLATE_DB_PATH, TEST_DB_PATH);

  const prisma = new PrismaClient();
  return prisma;
}

export async function teardownTestDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.$disconnect();

  if (existsSync(TEST_DB_PATH)) {
    try {
      unlinkSync(TEST_DB_PATH);
    } catch (e) {
    }
  }

  if (existsSync(TEMPLATE_DB_PATH)) {
    try {
      unlinkSync(TEMPLATE_DB_PATH);
    } catch (e) {
    }
  }
}

export async function cleanupTestDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.user.deleteMany();
}
