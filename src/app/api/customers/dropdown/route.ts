// src/app/api/customers/dropdown/route.ts
import { NextResponse } from "next/server";

const mockCustomers = [
  { id: "cust-walk-in", name: "Walk-in Customer", phone: "" },
  { id: "cust-1", name: "John Doe", phone: "9876543210" },
  { id: "cust-2", name: "Jane Smith", phone: "1234567890" },
];

export async function GET(req: Request) {
  return NextResponse.json({ success: true, data: mockCustomers });
}
