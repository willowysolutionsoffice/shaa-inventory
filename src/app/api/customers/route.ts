// src/app/api/customers/route.ts
import { NextResponse } from "next/server";

const mockCustomers = [
  { id: "cust-walk-in", name: "Walk-in Customer", phone: "", branchId: "branch-1" },
  { id: "cust-1", name: "John Doe", phone: "9876543210", branchId: "branch-1" },
  { id: "cust-2", name: "Jane Smith", phone: "1234567890", branchId: "branch-1" },
];

export async function GET(req: Request) {
  // Return paginated list for standard GET
  return NextResponse.json({ 
    success: true, 
    data: { 
      customers: mockCustomers,
      metadata: { totalCount: mockCustomers.length, totalPages: 1, currentPage: 1, hasNextPage: false, hasPrevPage: false }
    }
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newCustomer = {
      id: `cust-${Date.now()}`,
      name: body.name || "Walk-in Customer",
      email: body.email || "",
      phone: body.phone || "",
      branchId: body.branchId || "branch-1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    mockCustomers.push(newCustomer);
    
    return NextResponse.json({ success: true, data: newCustomer });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Invalid request" }, { status: 400 });
  }
}
