"use client";

import { Button } from "@/components/ui/button";
import { IconFileExport } from "@tabler/icons-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDate } from "@/lib/utils";
import { addBranding, formatPdfCurrency } from "@/lib/pdf-utils";

interface ExportListPdfButtonProps {
    data: any[];
    type: "sales" | "purchases";
}

export function ExportListPdfButton({ data, type }: ExportListPdfButtonProps) {
    const handleExport = () => {
        if (!data || data.length === 0) return;

        const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
        const pageWidth = doc.internal.pageSize.getWidth();
        const title = type === "sales" ? "SALES LIST" : "PURCHASE LIST";

        addBranding(doc, title);

        const headers = type === "sales"
            ? [["#", "Ref No", "Date", "Customer", "Total", "Paid", "Due"]]
            : [["#", "Ref No", "Date", "Supplier", "Total", "Paid", "Due"]];

        const body = data.map((item, index) => {
            const party = type === "sales" ? item.customer?.name : item.supplier?.name;
            const refNo = type === "sales" ? item.invoiceNo : item.referenceNo;
            const date = type === "sales" ? item.salesdate : item.purchaseDate;
            const total = type === "sales" ? item.grandTotal : item.totalAmount;

            return [
                (index + 1).toString(),
                refNo || "N/A",
                date ? formatDate(new Date(date)) : "N/A",
                party || "N/A",
                formatPdfCurrency(Number(total)),
                formatPdfCurrency(Number(item.paidAmount)),
                formatPdfCurrency(Number(item.dueAmount)),
            ];
        });

        autoTable(doc, {
            startY: 120,
            head: headers,
            body: body,
            theme: "grid",
            headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
            columnStyles: {
                0: { halign: 'center', cellWidth: 30 },
                4: { halign: 'right' },
                5: { halign: 'right' },
                6: { halign: 'right' },
            }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 20;

        // Add Summary Totals at the bottom
        const totalAmount = data.reduce((sum, item) => sum + (Number(type === "sales" ? item.grandTotal : item.totalAmount) || 0), 0);
        const totalPaid = data.reduce((sum, item) => sum + (Number(item.paidAmount) || 0), 0);
        const totalDue = data.reduce((sum, item) => sum + (Number(item.dueAmount) || 0), 0);

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(`Total Count: ${data.length}`, 40, finalY);

        const summaryX = pageWidth - 200;
        const colonX = pageWidth - 100;

        doc.text("Summary Totals", summaryX, finalY);
        doc.setFont("helvetica", "normal");

        doc.text("Total Amount", summaryX, finalY + 15);
        doc.text(`:  ${formatPdfCurrency(totalAmount)}`, colonX, finalY + 15);

        doc.text("Total Paid", summaryX, finalY + 30);
        doc.text(`:  ${formatPdfCurrency(totalPaid)}`, colonX, finalY + 30);

        doc.text("Total Due", summaryX, finalY + 45);
        doc.text(`:  ${formatPdfCurrency(totalDue)}`, colonX, finalY + 45);

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth / 2, doc.internal.pageSize.height - 20, { align: 'center' });

        doc.save(`${type}-list-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <Button onClick={handleExport} variant="outline" size="sm" className="flex items-center gap-2">
            <IconFileExport className="h-4 w-4" />
            Export List PDF
        </Button>
    );
}
