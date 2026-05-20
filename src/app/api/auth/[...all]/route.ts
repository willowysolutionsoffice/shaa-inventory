// src/app/api/auth/[...all]/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ session: { user: { role: "admin", name: "Admin User", id: "admin-1" } } });
}

export async function POST() {
  return NextResponse.json({ success: true });
}