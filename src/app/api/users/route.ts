// src/app/api/users/route.ts
import { NextResponse } from "next/server";

const mockUsers = [
  { id: "user-1", name: "Salesman One", branchId: "branch-1", branch: { id: "branch-1" } },
  { id: "user-2", name: "Salesman Two", branchId: "branch-1", branch: { id: "branch-1" } },
  { id: "user-3", name: "Salesman Three", branchId: "branch-2", branch: { id: "branch-2" } },
];

export async function GET(req: Request) {
  // Returns a list of users for the mock environment
  return NextResponse.json({ 
    success: true, 
    data: mockUsers,
    users: mockUsers,
    totalCount: mockUsers.length
  });
}
