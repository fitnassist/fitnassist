import { beforeAll, afterAll } from 'vitest';
import { prisma } from '../lib/prisma';

const isDummyDb = process.env.DATABASE_URL?.includes('dummy');

// Clean the test database before running tests
async function cleanDatabase() {
  if (isDummyDb) return;
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
  if (!isDummyDb) await prisma.$disconnect();
});
