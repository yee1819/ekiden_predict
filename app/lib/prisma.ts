import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaMariaDb } from "@prisma/adapter-mariadb"

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
  mariaAdapter?: PrismaMariaDb
}

function getMariaAdapter() {
  if (globalForPrisma.mariaAdapter) {
    return globalForPrisma.mariaAdapter
  }

  const url = process.env.DATABASE_URL!
  const u = new URL(url)

  const adapter = new PrismaMariaDb({
    host: u.hostname,
    port: u.port ? Number(u.port) : 3306,
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, ""),
    connectionLimit: 3,          // 👈 保守
    connectTimeout: 5000,
    acquireTimeout: 15000,
    idleTimeout: 300,
  })

  console.log("Prisma adapter initialized") // ✅ 只会出现一次

  globalForPrisma.mariaAdapter = adapter
  return adapter
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: getMariaAdapter(),
    log: ["error", "warn", "info", "query"],
  })

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma
}
