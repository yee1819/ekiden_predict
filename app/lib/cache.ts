import fs from "fs/promises"
import path from "path"
import crypto from "crypto"

const dir = path.join(process.cwd(), "public", "data")

async function ensure() {
  try { await fs.mkdir(dir, { recursive: true }) } catch { }
}

export function key(prefix: string, payload: unknown) {
  const raw = typeof payload === "string" ? payload : JSON.stringify(payload)
  const hash = crypto.createHash("md5").update(raw).digest("hex")
  return `${prefix}-${hash}`
}

export async function read<T>(name: string): Promise<T | null> {
  try {
    await ensure()
    const file = path.join(dir, `${name}.json`)
    const txt = await fs.readFile(file, "utf8")
    return JSON.parse(txt) as T
  } catch {
    return null
  }
}

export async function write(name: string, data: unknown): Promise<void> {
  try {
    await ensure()
    const file = path.join(dir, `${name}.json`)
    await fs.writeFile(file, JSON.stringify(data), "utf8")
  } catch { }
}

