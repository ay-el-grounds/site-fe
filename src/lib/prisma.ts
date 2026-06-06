/**
 * Prisma client singleton for Next.js
 *
 * In development, Next.js hot-reloads frequently, which would create many
 * Prisma client instances and exhaust the Postgres connection pool.
 * This singleton pattern stores the client on the global object so it
 * survives hot reloads in dev, while production always creates one instance.
 *
 * Reference: https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
 */

import { PrismaClient } from "@prisma/client";

// Extend the global type to hold our cached client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

// In development, cache the client on the global object
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
