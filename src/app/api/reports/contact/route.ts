import { NextRequest, NextResponse } from 'next/server';
import {
  getCustomerGrandTotals,
  getCustomerReportData,
  getFilterLists,
  getSupplierGrandTotals,
  getSupplierReportData,
} from '@/actions/contact-report-action';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get('customerId') ?? undefined;
  const supplierId = searchParams.get('supplierId') ?? undefined;
  const page = Number(searchParams.get('page') ?? 1);
  const limit = Number(searchParams.get('limit') ?? 10);

  try {
    const [customerReport, supplierReport, customerGrandTotals, supplierGrandTotals, filters] =
      await Promise.all([
        getCustomerReportData(customerId, page, limit),
        getSupplierReportData(supplierId, page, limit),
        getCustomerGrandTotals(),
        getSupplierGrandTotals(),
        getFilterLists(),
      ]);

    return NextResponse.json({
      data: {
        customers: customerReport.data,
        suppliers: supplierReport.data,
        customerGrandTotals,
        supplierGrandTotals,
        filters,
        totals: {
          customers: customerReport.total,
          suppliers: supplierReport.total,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message ?? 'Something went wrong' },
      { status: 500 }
    );
  }
}
