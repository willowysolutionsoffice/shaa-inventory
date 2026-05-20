import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangeFilter } from "@/components/common/date-range-filter";

export default async function ProfitAndLossReport({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {

  const { from, to } = await searchParams;


let salesFilter = {};
let purchaseFilter = {};
let expenseFilter = {};
let purchaseReturnFilter = {};
let salesReturnFilter = {};

if (from && to) {
  const start = new Date(from);
const end = new Date(to);

end.setHours(23, 59, 59, 999);

  salesFilter = {
    salesdate: { gte: start, lte: end },
  };

  purchaseFilter = {
    purchaseDate: { gte: start, lte: end },
  };

  expenseFilter = {
    date: { gte: start, lte: end },
  };

  purchaseReturnFilter = {
    returnDate: { gte: start, lte: end },
  };

  salesReturnFilter = {
    salesReturnDate: { gte: start, lte: end },
  };
}

  const expenseReports = await prisma.expense.findMany({   where: expenseFilter,
select: { amount: true } });
  const purchaseReports = await prisma.purchase.findMany({ where: purchaseFilter, select: { totalAmount: true } });
  const purchaseReturnReports = await prisma.purchaseReturn.findMany({ where: purchaseReturnFilter, select: { totalAmount: true } });
  const saleReports = await prisma.sale.findMany({ where: salesFilter, select: { grandTotal: true } });
  const salesReturnReports = await prisma.salesReturn.findMany({ where: salesReturnFilter, select: { grandTotal: true } });

  const totalRevenue = saleReports.reduce((sum, sale) => sum + sale.grandTotal, 0);
  const totalSalesReturn = salesReturnReports.reduce((sum, ret) => sum + ret.grandTotal, 0);
  const totalExpenses = expenseReports.reduce((sum, exp) => sum + exp.amount, 0);
  const totalPurchases = purchaseReports.reduce((sum, p) => sum + p.totalAmount, 0);
  const totalPurchasesReturn = purchaseReturnReports.reduce((sum, p) => sum + p.totalAmount, 0);

  const grossProfit = (totalRevenue - totalSalesReturn) - (totalPurchases - totalPurchasesReturn);
  const netProfit = grossProfit - totalExpenses;

  return (
    <div>
      <DateRangeFilter className="mb-4" />
      <Card className="p-4 mb-5">
        <CardHeader className="pt-4">
          <CardTitle>Profit and Loss Report</CardTitle>
          <p className="text-sm text-muted-foreground">Summary of financial performance</p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableCaption>Profit and loss summary</TableCaption>
            <TableHeader className="bg-primary">
              <TableRow>
                <TableHead className="text-primary-foreground">Description</TableHead>
                <TableHead className="text-right text-primary-foreground">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Total Sales</TableCell>
                <TableCell className="text-right">{formatCurrency(totalRevenue)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Total Sales Return</TableCell>
                <TableCell className="text-right">{formatCurrency(totalSalesReturn)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Total Purchases</TableCell>
                <TableCell className="text-right">{formatCurrency(totalPurchases)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Total Purchase Return</TableCell>
                <TableCell className="text-right">{formatCurrency(totalPurchasesReturn)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-bold">Gross Profit</TableCell>
                <TableCell className="text-right font-bold">{formatCurrency(grossProfit)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Total Expenses</TableCell>
                <TableCell className="text-right">{formatCurrency(totalExpenses)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-bold">Net Profit</TableCell>
                <TableCell className="text-right font-bold">{formatCurrency(netProfit)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="col-span-1 lg:col-span-2 mt-5">
        <CardContent className=" py-6 space-y-4">
          <div className="text-lg">
            <span className="font-semibold">Gross Profit: </span>
            <span className={`font-bold ${grossProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(grossProfit)}
            </span>
          </div>

          <div className="text-lg">
            <span className="font-semibold">Net Profit: </span>
            <span className="text-red-600 font-bold">{formatCurrency(netProfit)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
