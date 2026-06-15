// src/lib/jwt.ts  ← this is the FRONTEND copy, separate from your Express backend
import { jwtVerify } from 'jose';

const ACCESS_SECRET = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!);

export interface AccessTokenPayload {
  sub:         string;
  email:       string;
  role:        string;
  branchId:    string;
    name:        string;   // ← add

  permissions: string[];
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, ACCESS_SECRET);
  return payload as unknown as AccessTokenPayload;
}