"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { IconFileExport, IconTrash } from "@tabler/icons-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { getBalancePayments, deleteBalancePayment } from "@/actions/balance-payment-action";
import { BalancePayment } from "@prisma/client";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";

export function SupplierPaymentHistoryModal({
  supplierId,
  supplierName,
  open,
  onOpenChange,
}: {
  supplierId: string;
  supplierName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [payments, setPayments] = useState<BalancePayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!open || !supplierId) return;

    const fetchPayments = async () => {
      setLoading(true);
      try {
        const result = await getBalancePayments({ supplierId });

        if (result?.data?.data) {
          setPayments(result.data.data);
        } else {
          toast.error("Failed to load payment history");
        }
      } catch {
        toast.error("Failed to load payment history");
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [open, supplierId, refreshKey]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this payment? This will revert the balance changes.")) return;

    try {
      const res = await deleteBalancePayment({ id });
      if (res?.data?.success) {
        toast.success("Payment deleted successfully");
        setRefreshKey((prev) => prev + 1);
      } else {
        toast.error("Failed to delete payment");
      }
    } catch {
      toast.error("Failed to delete payment");
    }
  };

  // Filtered payments based on select filter and selected date
  const filteredPayments = useMemo(() => {
    const now = new Date();
    return payments.filter((payment) => {
      const paymentDate = new Date(payment.paidOn);

      // Apply select filter
      let selectFilterPass = true;
      switch (filter) {
        case "today":
          selectFilterPass = paymentDate.toDateString() === now.toDateString();
          break;
        case "yesterday": {
          const yesterday = new Date();
          yesterday.setDate(now.getDate() - 1);
          selectFilterPass = paymentDate.toDateString() === yesterday.toDateString();
          break;
        }
        case "week": {
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          selectFilterPass = paymentDate >= startOfWeek;
          break;
        }
        case "month":
          selectFilterPass =
            paymentDate.getMonth() === now.getMonth() &&
            paymentDate.getFullYear() === now.getFullYear();
          break;
        case "year":
          selectFilterPass = paymentDate.getFullYear() === now.getFullYear();
          break;
      }

      // Apply date picker filter
      let dateFilterPass = true;
      if (selectedDate) {
        dateFilterPass = paymentDate.toDateString() === selectedDate.toDateString();
      }

      return selectFilterPass && dateFilterPass;
    });
  }, [filter, selectedDate, payments]);

  // Sort by date and calculate running balance
  const paymentsWithBalance = useMemo(() => {
    const sorted = [...filteredPayments].sort(
      (a, b) => new Date(a.paidOn).getTime() - new Date(b.paidOn).getTime()
    );
    let runningBalance = 0;
    return sorted.map((payment) => {
      runningBalance += payment.amount;
      return {
        ...payment,
        balance: runningBalance,
        type: "payment" as const
      };
    });
  }, [filteredPayments]);

  const total = paymentsWithBalance.length > 0
    ? paymentsWithBalance[paymentsWithBalance.length - 1].balance
    : 0;

  const handleExportPDF = () => {
    if (!paymentsWithBalance.length) return;

    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    doc.setFontSize(14);
    doc.text(`Supplier Payment Statement - ${supplierName || "Unknown"}`, 40, 40);

    autoTable(doc, {
      startY: 70,
      head: [["Date", "Payment Method", "Amount", "Note", "Balance"]],
      body: paymentsWithBalance.map((payment) => [
        formatDate(payment.paidOn),
        payment.method,
        formatCurrency(payment.amount),
        payment.note || "-",
        formatCurrency(payment.balance),
      ]),
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [253, 224, 71], textColor: 0 },
      margin: { left: 40, right: 40 },
      foot: [
        [
          { content: "Total Payments", colSpan: 4, styles: { halign: "right" } },
          { content: formatCurrency(total), styles: { halign: "right" } },
        ],
      ],
    });

    doc.save(`Supplier-Payment-Statement-${supplierName || "Unknown"}.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            Payment Statement {supplierName && ` - ${supplierName}`}
          </DialogTitle>
        </DialogHeader>

        {/* Filters */}
        <div className="mb-3 flex gap-3 items-center">
          {/* Select filter */}
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>

          {/* Date picker filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                {selectedDate
                  ? formatDate(selectedDate)
                  : "Select Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
              />
              {selectedDate && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => setSelectedDate(undefined)}
                >
                  Clear
                </Button>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* Payment Table */}
        <div className="overflow-x-auto max-h-[60vh]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Note</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground"
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : paymentsWithBalance.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground"
                  >
                    No payment records found.
                  </TableCell>
                </TableRow>
              ) : (
                paymentsWithBalance.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {formatDate(payment.paidOn)}
                    </TableCell>
                    <TableCell>{payment.method}</TableCell>
                    <TableCell className="text-right text-green-600 font-medium">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell>{payment.note || "-"}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(payment.balance)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(payment.id)}
                      >
                        <IconTrash size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>

            <TableFooter>
              <TableRow>
                <TableCell colSpan={4} className="text-right font-bold">
                  Total Payments
                </TableCell>
                <TableCell className="text-right font-bold">
                  {formatCurrency(total)}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </div>

        {/* Actions */}
        <div className="mt-4 flex justify-end">
          <Button
            onClick={handleExportPDF}
            disabled={paymentsWithBalance.length === 0}
            className="bg-black text-white flex items-center gap-2"
          >
            <IconFileExport size={18} /> Export PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
