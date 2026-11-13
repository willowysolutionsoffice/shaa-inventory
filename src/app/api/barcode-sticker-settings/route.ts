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
    let data: unknown = null;
    try {
      if (text) data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { success: false, message: "Backend returned an invalid JSON response" },
        { status: res.status },
      );
    }

    if (res.status === 204 || res.status === 304) {
      return new Response(null, {
        status: res.status,
        headers: {
          "Content-Type": res.headers.get("content-type") ?? "application/json",
        },
      });
    }

    const contentType = res.headers.get("content-type");
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: {
        "Content-Type": contentType?.includes("json")
          ? contentType
          : "application/json; charset=utf-8",
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to reach backend" },
      { status: 502 },
    );
  }
}