// src/app/api/barcode-sticker-settings/route.ts
import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_URL ??
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000";

export async function GET(req: Request) {
  const cookie = req.headers.get("cookie");
  const authorization = req.headers.get("authorization");

  const headers: Record<string, string> = { accept: "application/json" };
  if (cookie) headers.cookie = cookie;
  if (authorization) headers.authorization = authorization;

  try {
    const res = await fetch(`${BACKEND_URL}/barcode-sticker-settings`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const text = await res.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = {
        success: false,
        message: "Backend returned a non-JSON response",
      };
    }

    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to reach backend" },
      { status: 502 },
    );
  }
}