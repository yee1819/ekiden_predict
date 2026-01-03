import { NextRequest, NextResponse } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

export async function proxy(request: NextRequest) {
  const url = new URL(request.url)
  const pathname = url.pathname
  const isAdminPage = pathname.startsWith("/admin")
  const isAdminApi = pathname.startsWith("/api/admin")
  if (!isAdminPage && !isAdminApi) return NextResponse.next()
  if (isAdminPage) {
    if (pathname === "/login" || pathname === "/register") {
      return NextResponse.next()
    }
  }
  if (isAdminApi && request.method === "GET") {
    return NextResponse.next()
  }
  const sessionCookie = getSessionCookie(request)
  if (!sessionCookie) {
    if (isAdminApi) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    return NextResponse.redirect(new URL("/login", request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
}
