import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaginationControls } from "@/components/ui/pagination-controls";
import ContactReportFilters from "@/components/common/contact-report-filters";
interface ContactReportPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ContactReportPage({
  searchParams,
}: ContactReportPageProps) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams?.page) || 1;
  const limit = Number(resolvedSearchParams?.limit) || 10;

  const customerId = resolvedSearchParams?.customerId as string | undefined;
  const supplierId = resolvedSearchParams?.supplierId as string | undefined;

  const skip = (page - 1) * limit;
  const customersList = await prisma.customer.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const suppliersList = await prisma.supplier.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  // Suppliers Data
  const [supplierReports, totalSuppliers] = await Promise.all([
  prisma.supplier.findMany({
    where: supplierId ? { id: supplierId } : undefined,
    skip,
    take: limit,
    include: {
      purchase: {
        select: { totalAmount: true, dueAmount: true, paidAmount: true },
      },
      purchaseReturn: {
        select: { totalAmount: true },
      },
      BalancePayment: {
        select: { amount: true },
      },
    },
    orderBy: { id: "asc" },
  }),

  prisma.supplier.count({
    where: supplierId ? { id: supplierId } : undefined,
  }),
]);

  // Customers Data
  const [customerReports, totalCustomers] = await Promise.all([
  prisma.customer.findMany({
    where: customerId ? { id: customerId } : undefined,
    skip,
    take: limit,
    include: {
      sale: {
        select: { grandTotal: true, dueAmount: true, paidAmount: true },
      },
      salesReturn: {
        select: { grandTotal: true },
      },
      BalancePayment: {
        select: { amount: true },
      },
    },
    orderBy: { id: "asc" },
  }),

  prisma.customer.count({
    where: customerId ? { id: customerId } : undefined,
  }),
]);

  // Process Suppliers
  const suppliers = supplierReports.map((supplier) => {
    const totalPurchases = supplier.purchase.reduce(
      (acc, p) => acc + p.totalAmount,
      0
    );
    const totalPaidAmount = supplier.purchase.reduce(
      (acc, p) => acc + p.paidAmount,
      0
    );
    const totalPurchaseReturns = supplier.purchaseReturn.reduce(
      (acc, r) => acc + r.totalAmount,
      0
    );
    const preDueAmount = supplier.purchase.reduce(
      (acc, d) => acc + d.dueAmount,
      0
    );

    let effectiveOpening = supplier.openingBalance;
    let effectiveDue = preDueAmount;

    if (effectiveDue < 0) {
      effectiveOpening = Math.max(0, effectiveOpening + effectiveDue);
      effectiveDue = 0;
    }

    return {
      id: supplier.id,
      name: supplier.name,
      type: "Supplier",
      totalPurchases,
      totalPurchaseReturns,
      totalPaidAmount,
      openingBalance: effectiveOpening,
      balance: effectiveDue,
    };
  });

  // Process Customers
  const customers = customerReports.map((customer) => {
    const totalSales = customer.sale.reduce((acc, s) => acc + s.grandTotal, 0);
    const totalPaidAmount = customer.sale.reduce(
      (acc, p) => acc + p.paidAmount,
      0
    );
    const totalSalesReturns = customer.salesReturn.reduce(
      (acc, r) => acc + r.grandTotal,
      0
    );
    const preDueAmount = customer.sale.reduce((acc, d) => acc + d.dueAmount, 0);

    let effectiveOpening = customer.openingBalance;
    let effectiveDue = preDueAmount;

    if (effectiveDue < 0) {
      effectiveOpening = Math.max(0, effectiveOpening + effectiveDue);
      effectiveDue = 0;
    }

    return {
      id: customer.id,
      name: customer.name,
      type: "Customer",
      totalSales,
      totalSalesReturns,
      openingBalance: effectiveOpening,
      totalPaidAmount,
      balance: effectiveDue,
    };
  });

  // Calculate Grand Totals (Aggregates for ALL pages)
  const [
    customerTotals,
    customerReturnTotal,
    customerOpeningTotal,
    supplierTotals,
    supplierReturnTotal,
    supplierOpeningTotal,
  ] = await Promise.all([
    prisma.sale.aggregate({
      _sum: {
        grandTotal: true,
        paidAmount: true,
        dueAmount: true,
      },
    }),
    prisma.salesReturn.aggregate({
      _sum: {
        grandTotal: true,
      },
    }),
    prisma.customer.aggregate({
      _sum: {
        openingBalance: true,
      },
    }),
    prisma.purchase.aggregate({
      _sum: {
        totalAmount: true, // totalPurchases
        paidAmount: true,
        dueAmount: true,
      },
    }),
    prisma.purchaseReturn.aggregate({
      _sum: {
        totalAmount: true,
      },
    }),
    prisma.supplier.aggregate({
      _sum: {
        openingBalance: true,
      },
    }),
  ]);

  const customerGrandTotals = {
    sales: customerTotals._sum.grandTotal || 0,
    paid: customerTotals._sum.paidAmount || 0,
    returns: customerReturnTotal._sum.grandTotal || 0,
    opening: customerOpeningTotal._sum.openingBalance || 0,
    balance: customerTotals._sum.dueAmount || 0, // Assuming balance logic matches
  };

  const supplierGrandTotals = {
    purchases: supplierTotals._sum.totalAmount || 0,
    paid: supplierTotals._sum.paidAmount || 0,
    returns: supplierReturnTotal._sum.totalAmount || 0,
    opening: supplierOpeningTotal._sum.openingBalance || 0,
    balance: supplierTotals._sum.dueAmount || 0,
  };

  // Pagination Controls logic (using the larger of the two counts or specific checks? 
  // Users sees two tabs. Pagination controls usually apply to the view.
  // But here we share the URL param.
  // We'll pass independent props but we only have one set of query params.
  // So we show controls.

  // It's cleaner to show controls inside each tab content or below tabs?
  // If we show below tabs, it refers to both? using max pages?
  // Let's allow Next/Prev to work for both.

  const maxTotalCount = Math.max(totalCustomers, totalSuppliers);
  const totalPages = Math.ceil(maxTotalCount / limit);
  // This is a bit ambiguous if one has 100 pages and other has 2.
  // But common simple implementation.
  // Better: separate controls in each tab.

  const customerTotalPages = Math.ceil(totalCustomers / limit);
  const supplierTotalPages = Math.ceil(totalSuppliers / limit);

  return (
    <div>
      <div className="my-4">
        <h1 className="text-2xl font-bold tracking-tight">Contact Reports</h1>
      </div>
      
      <Tabs defaultValue="customers" className="w-full">
        <TabsList className="bg-muted text-muted-foreground inline-flex h-10 items-center justify-center rounded-md p-1">
          <TabsTrigger value="customers">Customer Report</TabsTrigger>
          <TabsTrigger value="suppliers">Supplier Report</TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="mt-6">
          <ContactReportFilters
    type="customer"
    customers={customersList}
    customerId={customerId}
  />
          <Card className="p-4">
            <CardHeader>
              <CardTitle>Customer Report</CardTitle>
              <p className="text-muted-foreground text-sm">
                Summary of all customer activity
              </p>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableCaption>A summary of customer transactions.</TableCaption>
                <TableHeader className="bg-primary">
                  <TableRow>
                    <TableHead className="text-primary-foreground">
                      Name
                    </TableHead>
                    <TableHead className="text-primary-foreground text-center">
                      Sales
                    </TableHead>
                    <TableHead className="text-primary-foreground text-center">
                      Total Payed
                    </TableHead>
                    <TableHead className="text-primary-foreground text-center">
                      Sales Returns
                    </TableHead>
                    <TableHead className="text-primary-foreground text-center">
                      Opening Bal
                    </TableHead>
                    <TableHead className="text-primary-foreground text-center">
                      Balance
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">
                        {report.name}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatCurrency(report.totalSales)}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatCurrency(report.totalPaidAmount)}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatCurrency(report.totalSalesReturns)}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatCurrency(report.openingBalance)}
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {formatCurrency(report.balance)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="text-right font-medium">
                      Grand Total
                    </TableCell>
                    <TableCell className="text-center font-bold">
                      {formatCurrency(customerGrandTotals.sales)}
                    </TableCell>
                    <TableCell className="text-center font-bold">
                      {formatCurrency(customerGrandTotals.paid)}
                    </TableCell>
                    <TableCell className="text-center font-bold">
                      {formatCurrency(customerGrandTotals.returns)}
                    </TableCell>
                    <TableCell className="text-center font-bold">
                      {formatCurrency(customerGrandTotals.opening)}
                    </TableCell>
                    <TableCell className="text-center font-bold">
                      {formatCurrency(customerGrandTotals.balance)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
              <PaginationControls
                totalPages={customerTotalPages}
                hasNextPage={page < customerTotalPages}
                hasPrevPage={page > 1}
                totalCount={totalCustomers}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="mt-6">
          <ContactReportFilters
    type="supplier"
    suppliers={suppliersList}
    supplierId={supplierId}
  />
          <Card className="p-4">
            <CardHeader>
              <CardTitle>Supplier Report</CardTitle>
              <p className="text-muted-foreground text-sm">
                Summary of all supplier activity
              </p>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableCaption>A summary of supplier transactions.</TableCaption>
                <TableHeader className="bg-primary">
                  <TableRow>
                    <TableHead className="text-primary-foreground">
                      Name
                    </TableHead>
                    <TableHead className="text-primary-foreground text-center">
                      Purchases
                    </TableHead>
                    <TableHead className="text-primary-foreground text-center">
                      Total Payed
                    </TableHead>
                    <TableHead className="text-primary-foreground text-center">
                      Purchase Returns
                    </TableHead>
                    <TableHead className="text-primary-foreground text-center">
                      Opening Bal
                    </TableHead>
                    <TableHead className="text-primary-foreground text-center">
                      Balance
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">
                        {report.name}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatCurrency(report.totalPurchases)}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatCurrency(report.totalPaidAmount)}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatCurrency(report.totalPurchaseReturns)}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatCurrency(report.openingBalance)}
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {formatCurrency(report.balance)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="text-right font-medium">
                      Grand Total
                    </TableCell>
                    <TableCell className="text-center font-bold">
                      {formatCurrency(supplierGrandTotals.purchases)}
                    </TableCell>
                    <TableCell className="text-center font-bold">
                      {formatCurrency(supplierGrandTotals.paid)}
                    </TableCell>
                    <TableCell className="text-center font-bold">
                      {formatCurrency(supplierGrandTotals.returns)}
                    </TableCell>
                    <TableCell className="text-center font-bold">
                      {formatCurrency(supplierGrandTotals.opening)}
                    </TableCell>
                    <TableCell className="text-center font-bold">
                      {formatCurrency(supplierGrandTotals.balance)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
              <PaginationControls
                totalPages={supplierTotalPages}
                hasNextPage={page < supplierTotalPages}
                hasPrevPage={page > 1}
                totalCount={totalSuppliers}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
