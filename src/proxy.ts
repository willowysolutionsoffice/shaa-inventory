// src/proxy.ts
import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Fully offline session representation
  const mockUser = {
    role: "admin",
    name: "Admin User",
  };

  // Check if user is trying to access admin routes
  if (pathname.startsWith("/admin")) {
    // Only allow admin users to access admin routes
    if (mockUser.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Allow all protected routes in offline mode
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login|$).*)"],
};
