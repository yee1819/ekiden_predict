import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaMariaDb } from "@prisma/adapter-mariadb"

function buildMariaAdapter() {
    const url = process.env.DATABASE_URL || ""
    try {
        const u = new URL(url)
        const host = u.hostname
        const port = u.port ? Number(u.port) : 3306
        const user = decodeURIComponent(u.username || "")
        const password = decodeURIComponent(u.password || "")
        const database = (u.pathname || "").replace(/^\//, "")
        return new PrismaMariaDb({ host, port, user, password, database, connectionLimit: 20 })
    } catch {
        return new PrismaMariaDb({ host: "localhost", port: 3306, user: "root", password: "", database: "" })
    }
}

const adapter = buildMariaAdapter()
const globalForPrisma = global as unknown as { prisma?: PrismaClient }
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })
if (!globalForPrisma.prisma) globalForPrisma.prisma = prisma
