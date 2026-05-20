import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { formatCurrency, cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LocalDateDisplay } from "@/components/common/local-date-display";
import { getCustomerListForDropdown } from "@/actions/customer-action";
import { getSupplierListForDropdown } from "@/actions/supplier-action";
import { PaymentReportFilter } from "@/components/reports/payment-report-filter";
import { ExportPdfButton } from "@/components/reports/export-pdf-button";
import { DateRangeFilter } from "@/components/common/date-range-filter";

interface LedgerItem {
  date: Date;
  description: string;
  debit: number;
  credit: number;
  id: string;
  balance?: number;
  customerName?: string;
  supplierName?: string;
}

interface PaymentReportPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function PaymentReportPage({
  searchParams,
}: PaymentReportPageProps) {
  const resolvedSearchParams = await searchParams;

const customerId = resolvedSearchParams?.customerId as string | undefined;
const supplierId = resolvedSearchParams?.supplierId as string | undefined;

const from = resolvedSearchParams?.from as string | undefined;
const to = resolvedSearchParams?.to as string | undefined;

const fromDate = from ? new Date(from) : undefined;
const toDate = to ? new Date(to) : undefined;
const saleDateFilter =
  fromDate || toDate
    ? {
        salesdate: {
          ...(fromDate && { gte: fromDate }),
          ...(toDate && { lte: toDate }),
        },
      }
    : {};

const purchaseDateFilter =
  fromDate || toDate
    ? {
        purchaseDate: {
          ...(fromDate && { gte: fromDate }),
          ...(toDate && { lte: toDate }),
        },
      }
    : {};

const paymentDateFilter =
  fromDate || toDate
    ? {
        paidOn: {
          ...(fromDate && { gte: fromDate }),
          ...(toDate && { lte: toDate }),
        },
      }
    : {};
  // Fetch lists for dropdowns
  const [customers, suppliers] = await Promise.all([
    getCustomerListForDropdown(),
    getSupplierListForDropdown(),
  ]);

  // Data fetching based on active filters
  const [
    salesPayments,
    purchasePayments,
    balancePayments,
    customerSales,
    customerReturns,
    supplierPurchases,
    supplierReturns,
    customerInfo,
    supplierInfo
  ] = await Promise.all([
    prisma.salesPayment.findMany({
  where: {
    ...(customerId ? { sale: { customerId } } : {}),
    ...paymentDateFilter,
  },
  include: { sale: { include: { customer: true } } },
}),
   prisma.purchasePayment.findMany({
  where: {
    ...(supplierId ? { purchase: { supplierId } } : {}),
    ...paymentDateFilter,
  },
  include: { purchase: { include: { supplier: true } } },
}),
    prisma.balancePayment.findMany({
  where: {
    ...(customerId || supplierId
      ? {
          OR: [
            customerId ? { customerId } : undefined,
            supplierId ? { supplierId } : undefined,
          ].filter(Boolean) as any,
        }
      : {}),
    ...paymentDateFilter,
  },
  include: { customer: true, supplier: true },
}),
    customerId
  ? prisma.sale.findMany({
      where: {
        customerId,
        status: { not: "Cancelled" },
        ...saleDateFilter,
      },
    })
  : Promise.resolve([]),

    customerId
  ? prisma.salesReturn.findMany({
      where: {
        customerId,
        ...(fromDate || toDate
          ? {
              salesReturnDate: {
                ...(fromDate && { gte: fromDate }),
                ...(toDate && { lte: toDate }),
              },
            }
          : {}),
      },
    })
  : Promise.resolve([]),

    supplierId
  ? prisma.purchase.findMany({
      where: {
        supplierId,
        status: { not: "Cancelled" },
        ...purchaseDateFilter,
      },
    })
  : Promise.resolve([]),

    supplierId
  ? prisma.purchaseReturn.findMany({
      where: {
        supplierId,
        ...(fromDate || toDate
          ? {
              returnDate: {
                ...(fromDate && { gte: fromDate }),
                ...(toDate && { lte: toDate }),
              },
            }
          : {}),
      },
    })
  : Promise.resolve([]),
  
    customerId ? prisma.customer.findUnique({ where: { id: customerId } }) : Promise.resolve(null),
    supplierId ? prisma.supplier.findUnique({ where: { id: supplierId } }) : Promise.resolve(null),
  ]);

  // Process Sales / Customer Ledger
  let allSalesItems: LedgerItem[] = [];
  if (customerId && customerInfo) {
    allSalesItems = [
      ...customerSales.map((s) => ({
        date: s.salesdate,
        description: `Sale (Inv: ${s.invoiceNo})`,
        debit: s.grandTotal || 0,
        credit: 0,
        id: s.id,
      })),
      ...customerReturns.map((r) => ({
        date: r.salesReturnDate,
        description: `Sales Return (Inv: ${r.invoiceNo})`,
        debit: 0,
        credit: r.grandTotal || 0,
        id: r.id,
      })),
      ...balancePayments
        .filter((p) => p.customerId === customerId && (p.amount || 0) > 0)
        .map((p) => ({
          date: p.paidOn,
          description: `Payment (Bal: ${p.method})${p.note ? ` - ${p.note}` : ""}`,
          debit: 0,
          credit: p.amount || 0,
          id: p.id,
        })),
      ...salesPayments.filter(p => (p.amount || 0) > 0).map((p) => ({
        date: p.paidOn,
        description: `Payment (Inv: ${p.sale?.invoiceNo})${p.paymentNote ? ` - ${p.paymentNote}` : ""}`,
        debit: 0,
        credit: p.amount || 0,
        id: p.id,
      })),
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calculate Running Balance for Customer
    let runningBalance = customerInfo.openingBalance || 0;
    allSalesItems = allSalesItems.map((item) => {
      runningBalance = runningBalance + (item.debit || 0) - (item.credit || 0);
      return { ...item, balance: runningBalance };
    });
  } else {
    // Default global view: only payments
    allSalesItems = [
      ...salesPayments.filter(p => (p.amount || 0) > 0).map((p) => ({
        date: p.paidOn,
        description: `Payment (Inv: ${p.sale?.invoiceNo || ""})`,
        debit: 0,
        credit: p.amount || 0,
        id: p.id,
        customerName: p.sale?.customer?.name || "—"
      })),
      ...balancePayments
        .filter((p) => p.customerId && (p.amount || 0) > 0)
        .map((p) => ({
          date: p.paidOn,
          description: `Payment (Balance)${p.note ? ` - ${p.note}` : ""}`,
          debit: 0,
          credit: p.amount || 0,
          id: p.id,
          customerName: p.customer?.name || "—"
        })),
    ].sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  // Process Purchases / Supplier Ledger
  let allPurchaseItems: LedgerItem[] = [];
  if (supplierId && supplierInfo) {
    allPurchaseItems = [
      ...supplierPurchases.map((p) => ({
        date: p.purchaseDate,
        description: `Purchase (Ref: ${p.referenceNo})`,
        debit: 0,
        credit: p.totalAmount || 0,
        id: p.id,
      })),
      ...supplierReturns.map((r) => ({
        date: r.returnDate,
        description: `Purchase Return (Ref: ${r.referenceNo})`,
        debit: r.totalAmount || 0,
        credit: 0,
        id: r.id,
      })),
      ...balancePayments
        .filter((p) => p.supplierId === supplierId && (p.amount || 0) > 0)
        .map((p) => ({
          date: p.paidOn,
          description: `Payment (Bal: ${p.method})${p.note ? ` - ${p.note}` : ""}`,
          debit: p.amount || 0,
          credit: 0,
          id: p.id,
        })),
      ...purchasePayments.filter(p => (p.amount || 0) > 0).map((p) => ({
        date: p.paidOn,
        description: `Payment (Ref: ${p.purchase?.referenceNo})${p.paymentNote ? ` - ${p.paymentNote}` : ""}`,
        debit: p.amount || 0,
        credit: 0,
        id: p.id,
      })),
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calculate Running Balance for Supplier
    let runningBalance = supplierInfo.openingBalance || 0;
    allPurchaseItems = allPurchaseItems.map((item) => {
      runningBalance = runningBalance + (item.credit || 0) - (item.debit || 0);
      return { ...item, balance: runningBalance };
    });
  } else {
    // Default global view: only payments
    allPurchaseItems = [
      ...purchasePayments.filter(p => (p.amount || 0) > 0).map((p) => ({
        date: p.paidOn,
        description: `Payment (Ref: ${p.purchase?.referenceNo || ""})`,
        debit: p.amount || 0,
        credit: 0,
        id: p.id,
        supplierName: p.purchase?.supplier?.name || "—"
      })),
      ...balancePayments
        .filter((p) => p.supplierId && (p.amount || 0) > 0)
        .map((p) => ({
          date: p.paidOn,
          description: `Payment (Balance)${p.note ? ` - ${p.note}` : ""}`,
          debit: p.amount || 0,
          credit: 0,
          id: p.id,
          supplierName: p.supplier?.name || "—"
        })),
    ].sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  return (
    <div className="space-y-6">
      <div className="my-4">
        <h1 className="text-2xl font-bold tracking-tight">Payment & Statement Reports</h1>
        <p className="text-muted-foreground">Detailed financial history for customers and suppliers.</p>
      </div>
<DateRangeFilter  className="mb-4" />

      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="bg-muted p-1 rounded-lg">
          <TabsTrigger value="sales" className="px-6">Sales & Customer Statements</TabsTrigger>
          <TabsTrigger value="purchases" className="px-6">Purchase & Supplier Statements</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="mt-6 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <PaymentReportFilter
              options={customers}
              placeholder="Filter by Customer"
              paramName="customerId"
            />
            {customerId && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full md:w-auto">
                <Card className="px-4 py-2 border-l-4 border-l-blue-600 bg-blue-50/30">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Invoiced</p>
                  <p className="text-lg font-bold">{formatCurrency(allSalesItems.reduce((acc, curr) => acc + (curr.debit || 0), 0))}</p>
                </Card>
                <Card className="px-4 py-2 border-l-4 border-l-emerald-600 bg-emerald-50/30">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Paid/Returned</p>
                  <p className="text-lg font-bold">{formatCurrency(allSalesItems.reduce((acc, curr) => acc + (curr.credit || 0), 0))}</p>
                </Card>
                <Card className="px-4 py-2 border-l-4 border-l-indigo-600 bg-indigo-50/30">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Net Due</p>
                  <p className="text-lg font-bold text-indigo-600">
                    {formatCurrency(allSalesItems.length > 0 ? (allSalesItems[allSalesItems.length - 1].balance ?? 0) : (customerInfo?.openingBalance || 0))}
                  </p>
                </Card>
              </div>
            )}
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Customer History Ledger</CardTitle>
                  {customerId && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Complete statement for <span className="font-bold text-foreground">{customerInfo?.name}</span>
                    </p>
                  )}
                </div>
                {customerId && allSalesItems.length > 0 && (
                  <ExportPdfButton
                    data={allSalesItems as any}
                    title="Customer Ledger Statement"
                    subtitle={`Customer: ${customerInfo?.name}`}
                    openingBalance={customerInfo?.openingBalance || 0}
                    type="customer"
                    filename={`Statement-${customerInfo?.name?.replace(/\s+/g, '-')}`}
                  />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader className="bg-primary hover:bg-primary">
                    <TableRow>
                      <TableHead className="text-primary-foreground min-w-[100px]">Date</TableHead>
                      {!customerId && <TableHead className="text-primary-foreground">Customer</TableHead>}
                      <TableHead className="text-primary-foreground">Description</TableHead>
                      <TableHead className="text-primary-foreground text-right min-w-[120px]">Debit (+)</TableHead>
                      <TableHead className="text-primary-foreground text-right min-w-[120px]">Credit (-)</TableHead>
                      <TableHead className="text-primary-foreground text-right font-bold min-w-[120px]">Balance (Due)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerId && (
                      <TableRow className="bg-muted/50 italic font-medium">
                        <TableCell colSpan={!customerId ? 3 : 2}>Opening Balance</TableCell>
                        <TableCell className="text-right text-muted-foreground">{formatCurrency(0)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{formatCurrency(0)}</TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(customerInfo?.openingBalance || 0)}
                        </TableCell>
                      </TableRow>
                    )}
                    {allSalesItems.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/30">
                        <TableCell className="whitespace-nowrap"><LocalDateDisplay date={item.date} /></TableCell>
                        {!customerId && <TableCell className="font-medium">{item.customerName}</TableCell>}
                        <TableCell>{item.description}</TableCell>
                        <TableCell className={cn("text-right font-medium", item.debit > 0 ? "text-blue-600" : "text-muted-foreground")}>
                          {formatCurrency(item.debit || 0)}
                        </TableCell>
                        <TableCell className={cn("text-right font-medium", item.credit > 0 ? "text-emerald-600" : "text-muted-foreground")}>
                          {formatCurrency(item.credit || 0)}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(item.balance || 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {allSalesItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                          No transactions found for the selected view.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                  {customerId && allSalesItems.length > 0 && (
                    <TableFooter className="bg-transparent">
                      <TableRow className="bg-muted/50 border-t font-bold hover:bg-muted/50">
                        <TableCell colSpan={!customerId ? 5 : 4} className="text-right py-4 font-bold">Current Outstanding Due</TableCell>
                        <TableCell className="text-right py-4 text-indigo-600 text-lg font-bold">
                          {formatCurrency(allSalesItems[allSalesItems.length - 1].balance ?? 0)}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  )}
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchases" className="mt-6 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <PaymentReportFilter
              options={suppliers}
              placeholder="Filter by Supplier"
              paramName="supplierId"
            />
            {supplierId && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full md:w-auto">
                <Card className="px-4 py-2 border-l-4 border-l-blue-600 bg-blue-50/30">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Purchases</p>
                  <p className="text-lg font-bold">{formatCurrency(allPurchaseItems.reduce((acc, curr) => acc + (curr.credit || 0), 0))}</p>
                </Card>
                <Card className="px-4 py-2 border-l-4 border-l-emerald-600 bg-emerald-50/30">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Paid/Returned</p>
                  <p className="text-lg font-bold">{formatCurrency(allPurchaseItems.reduce((acc, curr) => acc + (curr.debit || 0), 0))}</p>
                </Card>
                <Card className="px-4 py-2 border-l-4 border-l-indigo-600 bg-indigo-50/30">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Net Due</p>
                  <p className="text-lg font-bold text-indigo-600">
                    {formatCurrency(allPurchaseItems.length > 0 ? (allPurchaseItems[allPurchaseItems.length - 1].balance ?? 0) : (supplierInfo?.openingBalance || 0))}
                  </p>
                </Card>
              </div>
            )}
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Supplier History Ledger</CardTitle>
                  {supplierId && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Complete statement for <span className="font-bold text-foreground">{supplierInfo?.name}</span>
                    </p>
                  )}
                </div>
                {supplierId && allPurchaseItems.length > 0 && (
                  <ExportPdfButton
                    data={allPurchaseItems as any}
                    title="Supplier Ledger Statement"
                    subtitle={`Supplier: ${supplierInfo?.name}`}
                    openingBalance={supplierInfo?.openingBalance || 0}
                    type="supplier"
                    filename={`Statement-${supplierInfo?.name?.replace(/\s+/g, '-')}`}
                  />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader className="bg-primary hover:bg-primary">
                    <TableRow>
                      <TableHead className="text-primary-foreground min-w-[100px]">Date</TableHead>
                      {!supplierId && <TableHead className="text-primary-foreground">Supplier</TableHead>}
                      <TableHead className="text-primary-foreground">Description</TableHead>
                      <TableHead className="text-primary-foreground text-right min-w-[120px]">Debit (-)</TableHead>
                      <TableHead className="text-primary-foreground text-right min-w-[120px]">Credit (+)</TableHead>
                      <TableHead className="text-primary-foreground text-right font-bold min-w-[120px]">Balance (Due)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supplierId && (
                      <TableRow className="bg-muted/50 italic font-medium">
                        <TableCell colSpan={!supplierId ? 3 : 2}>Opening Balance</TableCell>
                        <TableCell className="text-right text-muted-foreground">{formatCurrency(0)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{formatCurrency(0)}</TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(supplierInfo?.openingBalance || 0)}
                        </TableCell>
                      </TableRow>
                    )}
                    {allPurchaseItems.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/30">
                        <TableCell className="whitespace-nowrap"><LocalDateDisplay date={item.date} /></TableCell>
                        {!supplierId && <TableCell className="font-medium">{item.supplierName}</TableCell>}
                        <TableCell>{item.description}</TableCell>
                        <TableCell className={cn("text-right font-medium", item.debit > 0 ? "text-emerald-600" : "text-muted-foreground")}>
                          {formatCurrency(item.debit || 0)}
                        </TableCell>
                        <TableCell className={cn("text-right font-medium", item.credit > 0 ? "text-blue-600" : "text-muted-foreground")}>
                          {formatCurrency(item.credit || 0)}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(item.balance || 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {allPurchaseItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                          No transactions found for the selected view.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                  {supplierId && allPurchaseItems.length > 0 && (
                    <TableFooter className="bg-transparent">
                      <TableRow className="bg-muted/50 border-t font-bold hover:bg-muted/50">
                        <TableCell colSpan={!supplierId ? 5 : 4} className="text-right py-4 font-bold">Current Outstanding Due</TableCell>
                        <TableCell className="text-right py-4 text-indigo-600 text-lg font-bold">
                          {formatCurrency(allPurchaseItems[allPurchaseItems.length - 1].balance ?? 0)}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  )}
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
