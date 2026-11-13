// src/app/api/backend/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_URL ??
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000";

type RouteContext = { params: Promise<{ path: string[] }> };

function forwardHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {};
  const cookie = req.headers.get("cookie");
  const authorization = req.headers.get("authorization");
  const contentType = req.headers.get("content-type");
  const accept = req.headers.get("accept");

  if (cookie) headers.cookie = cookie;
  if (authorization) headers.authorization = authorization;
  if (contentType) headers["content-type"] = contentType;
  if (accept) headers.accept = accept;

  return headers;
}

async function proxy(req: NextRequest, path: string[]) {
  const search = req.nextUrl.search;
  const url = `${BACKEND_URL}/${path.join("/")}${search}`;

  const init: RequestInit = {
    method: req.method,
    headers: forwardHeaders(req),
    cache: "no-store",
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    const body = await req.text();
    if (body) init.body = body;
  }

  try {
    const res = await fetch(url, init);
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

export async function GET(req: NextRequest, ctx: RouteContext) {
  return proxy(req, (await ctx.params).path);
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  return proxy(req, (await ctx.params).path);
}

export async function PUT(req: NextRequest, ctx: RouteContext) {
  return proxy(req, (await ctx.params).path);
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  return proxy(req, (await ctx.params).path);
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  return proxy(req, (await ctx.params).path);
}