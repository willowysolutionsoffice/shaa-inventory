'use server';

import { actionClient } from '@/lib/safeAction';
import { loginSchema } from '@/schemas/user-schema';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const API = process.env.API_URL ?? 'http://localhost:4000';

// ── Login ─────────────────────────────────────────────────────────────────────

// src/actions/auth.ts
export const loginAction = actionClient
  .inputSchema(loginSchema)
  .action(async ({ parsedInput: { email, password } }) => {
    const res = await fetch(`${API}/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
    });

    const json = await res.json();

    if (!res.ok || !json.success) {
      return { success: false, message: json.message ?? 'Login failed' };
    }

    const cookieStore = await cookies();
    // Replace the entire cookie-forwarding loop with this:
const rawSetCookie = res.headers.getSetCookie?.() ?? [];
for (const cookie of rawSetCookie) {
  const [nameValue, ...parts] = cookie.split(';');
  
  // ✅ Use indexOf instead of split('=') to handle = in JWT values
  const eqIndex = nameValue.indexOf('=');
  const name    = nameValue.slice(0, eqIndex).trim();
  const value   = nameValue.slice(eqIndex + 1).trim();

  const maxAgeMatch = parts.find(p => p.trim().toLowerCase().startsWith('max-age'));
  const maxAge = maxAgeMatch ? parseInt(maxAgeMatch.split('=')[1]) : undefined;

  cookieStore.set(name, value, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path:     '/',
    ...(maxAge && { maxAge }),
  });
}

    // ✅ Don't redirect here — return success and let the client navigate
    return {
      success: true,
      message: 'Login successful',
      user:    json.data.user,
    };
  });

// ── Logout ────────────────────────────────────────────────────────────────────

export const logoutAction = async () => {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refresh_token')?.value;

  // Tell backend to revoke the refresh token
  if (refreshToken) {
    await fetch(`${API}/auth/logout`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Cookie: `refresh_token=${refreshToken}` },
    }).catch(() => {
      // ignore — we clear cookies regardless
    });
  }

  cookieStore.delete('access_token');
  cookieStore.delete('refresh_token');

  redirect('/login');
};