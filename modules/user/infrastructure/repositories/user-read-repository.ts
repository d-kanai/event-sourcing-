import { PrismaClient } from '@prisma/client';

export class UserReadRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }
}
