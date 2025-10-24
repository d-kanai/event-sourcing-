import { PrismaClient } from "../../backend/node_modules/@prisma/user-client";

let prisma: PrismaClient | null = null;

export function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.USER_DATABASE_URL,
        },
      },
    });
  }

  return prisma;
}

export async function disconnectPrisma() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}
