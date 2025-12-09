import { PrismaClient } from '@prisma/client';

// Create a global prisma instance to prevent multiple connections in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

console.log("🔌 Prisma connecting to:", process.env.DATABASE_URL?.split("@")[1] || "DATABASE_URL not set");

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Re-export Prisma types for convenience
export * from '@prisma/client';
