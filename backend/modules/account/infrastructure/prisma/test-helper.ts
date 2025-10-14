import { PrismaClient } from './generated/test-client';
import { execSync } from 'child_process';
import { join } from 'path';
import { unlinkSync, existsSync } from 'fs';

const TEST_DB_PATH = join(__dirname, 'test.db');

export async function setupTestDatabase(): Promise<PrismaClient> {
  if (existsSync(TEST_DB_PATH)) {
    try {
      unlinkSync(TEST_DB_PATH);
    } catch (e) {
    }
  }

  const prisma = new PrismaClient();

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      balance REAL NOT NULL,
      status TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  return prisma;
}

export async function teardownTestDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.$disconnect();

  if (existsSync(TEST_DB_PATH)) {
    unlinkSync(TEST_DB_PATH);
  }
}

export async function cleanupTestDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.account.deleteMany();
}
