import { PrismaClient } from '@prisma/user-client';

export class UserReadRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }
}
