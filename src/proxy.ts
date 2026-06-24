// src/proxy.ts
import { NextRequest, NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const PUBLIC_PATHS = ["/login", "/api/", "/_next/", "/favicon"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

function jwtExpiresAt(token: string): number | null {
  try {
    const [, payload] = token.split(".");
    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    );
    return typeof decoded.exp === "number" ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}

function needsRefresh(token: string | undefined): boolean {
  if (!token) return true;
  const exp = jwtExpiresAt(token);
  if (!exp) return true;
  return Date.now() + 10 * 60 * 1000 >= exp;
}

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  const accessToken  = req.cookies.get("access_token")?.value;
  const refreshToken = req.cookies.get("refresh_token")?.value;

  if (!accessToken && !refreshToken) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (!needsRefresh(accessToken)) {
    return NextResponse.next();
  }

  if (!refreshToken) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const refreshRes = await fetch(`${API}/auth/refresh`, {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `refresh_token=${refreshToken}`,
      },
      cache: "no-store",
    });

    if (!refreshRes.ok) {
      const res = NextResponse.redirect(new URL("/login", req.url));
      res.cookies.delete("access_token");
      res.cookies.delete("refresh_token");
      return res;
    }

    const res = NextResponse.next();
    const setCookies = refreshRes.headers.getSetCookie?.() ?? [];

    for (const cookie of setCookies) {
      const [nameValue, ...directives] = cookie.split(";");
      const eqIdx = nameValue.indexOf("=");
      const name  = nameValue.slice(0, eqIdx).trim();
      const value = nameValue.slice(eqIdx + 1).trim();

      const maxAgeDir = directives.find((d) =>
        d.trim().toLowerCase().startsWith("max-age")
      );
      const maxAge = maxAgeDir
        ? parseInt(maxAgeDir.split("=")[1], 10)
        : undefined;

      res.cookies.set(name, value, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === "production",
        sameSite: "lax",
        path:     "/",
        ...(maxAge ? { maxAge } : {}),
      });
    }

    return res;
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};