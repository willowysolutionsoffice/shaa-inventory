// src/proxy.ts
import { NextRequest, NextResponse } from "next/server";

const API =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000";

const PUBLIC_PATHS = ["/login", "/api/", "/_next/", "/favicon"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) =>
    path.endsWith("/") ? pathname.startsWith(path) : pathname === path
  );
}

function jwtExpiresAt(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3 || !parts[1]) return null;

    const decoded = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8")
    );

    return typeof decoded.exp === "number" ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}

function needsRefresh(token: string | undefined): boolean {
  if (!token) return true;

  const expiresAt = jwtExpiresAt(token);
  if (!expiresAt) return true;

  // Refresh when the access token has 10 minutes or less remaining.
  return Date.now() + 10 * 60 * 1000 >= expiresAt;
}

function redirectToLogin(req: NextRequest): NextResponse {
  const loginUrl = new URL("/login", req.url);

  // Preserve the originally requested page for an optional post-login redirect.
  if (req.nextUrl.pathname !== "/") {
    loginUrl.searchParams.set(
      "redirect",
      `${req.nextUrl.pathname}${req.nextUrl.search}`
    );
  }

  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete("access_token");
  response.cookies.delete("refresh_token");

  return response;
}

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const accessToken = req.cookies.get("access_token")?.value;
  const refreshToken = req.cookies.get("refresh_token")?.value;

  if (!accessToken && !refreshToken) {
    return redirectToLogin(req);
  }

  if (!needsRefresh(accessToken)) {
    return NextResponse.next();
  }

  if (!refreshToken) {
    return redirectToLogin(req);
  }

  try {
    const refreshResponse = await fetch(`${API}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `refresh_token=${refreshToken}`,
      },
      cache: "no-store",
    });

    if (!refreshResponse.ok) {
      return redirectToLogin(req);
    }

    const response = NextResponse.next();
    const setCookies = refreshResponse.headers.getSetCookie?.() ?? [];

    for (const cookie of setCookies) {
      const [nameValue, ...directives] = cookie.split(";");
      const equalsIndex = nameValue.indexOf("=");

      if (equalsIndex <= 0) continue;

      const name = nameValue.slice(0, equalsIndex).trim();
      const value = nameValue.slice(equalsIndex + 1).trim();

      const maxAgeDirective = directives.find((directive) =>
        directive.trim().toLowerCase().startsWith("max-age=")
      );

      const parsedMaxAge = maxAgeDirective
        ? Number.parseInt(maxAgeDirective.split("=")[1], 10)
        : undefined;

      response.cookies.set(name, value, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        ...(Number.isFinite(parsedMaxAge) ? { maxAge: parsedMaxAge } : {}),
      });
    }

    return response;
  } catch (error) {
    console.error("Token refresh failed in proxy:", error);
    return redirectToLogin(req);
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
