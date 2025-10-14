import { PrismaClient } from './generated/test-client';
import { execSync } from 'child_process';
import { join } from 'path';
import { unlinkSync, existsSync } from 'fs';

const TEST_DB_PATH = join(__dirname, 'test.db');
const SCHEMA_PATH = join(__dirname, 'schema.test.prisma');

export async function setupTestDatabase(): Promise<PrismaClient> {
  // Remove existing test database
  if (existsSync(TEST_DB_PATH)) {
    unlinkSync(TEST_DB_PATH);
  }

  // Run migrations
  execSync(`npx prisma migrate dev --schema=${SCHEMA_PATH} --name init --skip-generate`, {
    stdio: 'ignore',
  });

  // Generate client
  execSync(`npx prisma generate --schema=${SCHEMA_PATH}`, {
    stdio: 'ignore',
  });

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: `file:${TEST_DB_PATH}`,
      },
    },
  });

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
