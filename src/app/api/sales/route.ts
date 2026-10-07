import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const branchId = url.searchParams.get("branchId");
    
    const where: any = {};
    if (branchId) where.branchId = branchId;
    
    const sales = await prisma.sale.findMany({ 
      where,
      include: {
        customer: true,
        items: true,
        payments: true
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        sales: sales || [],
        metadata: {
          totalCount: sales?.length || 0,
          totalPages: 1,
          currentPage: 1,
          hasNextPage: false,
          hasPrevPage: false
        },
        totals: {
          grandTotal: 0,
          paidAmount: 0,
          dueAmount: 0
        }
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Simulating creation since mock Prisma doesn't have .create
    const newSale = {
      id: "sale-" + Math.random().toString(36).substring(7),
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: newSale
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
