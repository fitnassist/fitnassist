import { beforeAll, afterAll } from 'vitest';
import { prisma } from '../lib/prisma';

// Clean the test database before running tests
async function cleanDatabase() {
  // Delete in order respecting foreign key constraints
  await prisma.verification.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
}

// Global test setup for API tests
beforeAll(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});
