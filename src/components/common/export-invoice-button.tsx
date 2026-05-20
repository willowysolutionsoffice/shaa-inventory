"use client";

import { Button } from "@/components/ui/button";
import { IconDownload } from "@tabler/icons-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDate } from "@/lib/utils";
import { addBranding, formatPdfCurrency } from "@/lib/pdf-utils";
import { Sale } from "@/types/sales";
import { Purchase } from "@/types/purchase";

interface ExportInvoiceButtonProps {
    data: Sale | Purchase;
    type: "sale" | "purchase";
}

export function ExportInvoiceButton({ data, type }: ExportInvoiceButtonProps) {
    const handleExport = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
        const pageWidth = doc.internal.pageSize.getWidth();
        const title = type === "sale" ? "TAX INVOICE" : "PURCHASE INVOICE";

        addBranding(doc, title);

        // Meta Info
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");

        const invoiceLabel = type === "sale" ? "Invoice No" : "Reference No";
        const invoiceNo = type === "sale" ? (data as Sale).invoiceNo : (data as Purchase).referenceNo;
        const date = type === "sale" ? (data as Sale).salesdate : (data as Purchase).purchaseDate;
        const partyLabel = type === "sale" ? "Customer" : "Supplier";
        const partyName = type === "sale" ? (data as Sale).customer?.name : (data as Purchase).supplier?.name;

        doc.setFont("helvetica", "bold");
        doc.text(invoiceLabel, 40, 130);
        doc.setFont("helvetica", "normal");
        doc.text(`:  ${invoiceNo || "N/A"}`, 110, 130);

        doc.setFont("helvetica", "bold");
        doc.text("Date", 40, 150);
        doc.setFont("helvetica", "normal");
        doc.text(`:  ${date ? formatDate(new Date(date)) : "N/A"}`, 110, 150);

        doc.setFont("helvetica", "bold");
        doc.text(partyLabel, 40, 170);
        doc.setFont("helvetica", "normal");
        doc.text(`:  ${partyName || "N/A"}`, 110, 170);

        // Branch/Location
        if (data.branch) {
            doc.setFont("helvetica", "bold");
            doc.text("Location", 40, 190);
            doc.setFont("helvetica", "normal");
            doc.text(`:  ${data.branch.name}`, 110, 190);
        }

        // Table
        const headers = [["#", "Product", "Quantity", "Unit Price", "Discount", "Total"]];
        const body = (data.items || []).map((item, index) => [
            (index + 1).toString(),
            item.product_name || "N/A",
            item.quantity.toString(),
            formatPdfCurrency(Number(item.unitPrice)),
            formatPdfCurrency(Number(item.discount)),
            formatPdfCurrency(Number(item.total)),
        ]);

        autoTable(doc, {
            startY: 210,
            head: headers,
            body: body,
            theme: "grid",
            headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] }, // Indigo-600 color to match UI
            columnStyles: {
                0: { halign: 'center', cellWidth: 30 },
                1: { cellWidth: 'auto' },
                2: { halign: 'center', cellWidth: 60 },
                3: { halign: 'right', cellWidth: 80 },
                4: { halign: 'right', cellWidth: 80 },
                5: { halign: 'right', cellWidth: 80 },
            }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 30;

        const summaryX = pageWidth - 200;
        const colonX = pageWidth - 100;

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Summary", summaryX, finalY);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const grandTotal = type === "sale" ? (data as Sale).grandTotal : (data as Purchase).totalAmount;

        doc.text("Grand Total", summaryX, finalY + 20);
        doc.text(`:  ${formatPdfCurrency(Number(grandTotal))}`, colonX, finalY + 20);

        doc.text("Paid Amount", summaryX, finalY + 35);
        doc.text(`:  ${formatPdfCurrency(Number(data.paidAmount))}`, colonX, finalY + 35);

        doc.setFont("helvetica", "bold");
        doc.text("Due Amount", summaryX, finalY + 50);
        doc.text(`:  ${formatPdfCurrency(Number(data.dueAmount))}`, colonX, finalY + 50);

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth / 2, doc.internal.pageSize.height - 20, { align: 'center' });

        doc.save(`${type}-invoice-${invoiceNo}.pdf`);
    };

    return (
        <Button onClick={handleExport} variant="ghost" size="sm" className="h-8 w-8 p-0" title="Download Invoice">
            <IconDownload className="h-4 w-4 text-indigo-600" />
        </Button>
    );
}
