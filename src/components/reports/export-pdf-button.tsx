"use client";

import { Button } from "@/components/ui/button";
import { IconFileExport } from "@tabler/icons-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency, formatDate } from "@/lib/utils";

interface PdfLedgerItem {
    date: Date | string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
}

interface ExportPdfButtonProps {
    data: PdfLedgerItem[];
    title: string;
    subtitle?: string;
    openingBalance: number;
    type: "customer" | "supplier";
    filename: string;
}

export function ExportPdfButton({
    data,
    title,
    subtitle,
    openingBalance,
    type,
    filename,
}: ExportPdfButtonProps) {
    const handleExportPDF = () => {
        if (!data || data.length === 0) return;

        const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
        const pageWidth = doc.internal.pageSize.getWidth();

        const formatPdfCurrency = (amount: number) => {
            return new Intl.NumberFormat('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(amount);
        };

        // 1. TOP BRANDING CONTAINER
        doc.setDrawColor(0);
        doc.setLineWidth(1);
        // Rounded border for the header area
        doc.roundedRect(40, 20, pageWidth - 80, 80, 15, 15, 'S');

        // Left Side Branding
        doc.setFont("times", "bold");
        doc.setFontSize(20);
        doc.setTextColor(0);
        doc.text("INVENTORY", 60, 50);
        doc.setFontSize(10);
        doc.setFont("times", "normal");
        doc.text("TRACKING SYSTEM", 60, 65);

        // Right Side Branding
        doc.setFont("times", "bold");
        doc.setFontSize(20);
        doc.text("INVENTORY", pageWidth - 60, 50, { align: 'right' });
        doc.setFontSize(10);
        doc.setFont("times", "normal");
        doc.text("TRACKING SYSTEM", pageWidth - 60, 65, { align: 'right' });

        // Centered Title Box (Shadowed effect)
        const boxWidth = 200;
        const boxHeight = 35;
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(180);
        doc.rect((pageWidth / 2) - (boxWidth / 2) + 2, 57, boxWidth, boxHeight, 'S'); // Shadow base
        doc.setDrawColor(0);
        doc.rect((pageWidth / 2) - (boxWidth / 2), 55, boxWidth, boxHeight, 'S');

        doc.setFont("times", "bold");
        doc.setFontSize(16);
        const displayTitle = type === "customer" ? "Customer Statement" : "Supplier Statement";
        doc.text(displayTitle, pageWidth / 2, 77, { align: 'center' });

        // 2. META INFO (Date & Customer)
        doc.setFontSize(11);
        doc.setTextColor(0);
        doc.setFont("helvetica", "bold");

        const startDate = data.length > 0 ? formatDate(data[0].date) : "N/A";
        const endDate = data.length > 0 ? formatDate(data[data.length - 1].date) : "N/A";

        doc.text("Date", 40, 125);
        doc.setFont("helvetica", "normal");
        doc.text(`:  From  ${startDate}  Upto  ${endDate}`, 90, 125);

        doc.setFont("helvetica", "bold");
        doc.text(type === "customer" ? "Customer" : "Supplier", 40, 145);
        doc.setFont("helvetica", "bold");
        doc.text(`:  ${subtitle ? subtitle.replace(/^(Customer|Supplier):\s*/i, '').toUpperCase() : "N/A"}`, 90, 145);

        // 3. TABLE CONSTRUCTION
        const headers = [["#", "Transaction Date", "Document Reference", "Sub Reference", "Details", "Debit", "Credit", "Balance"]];

        // Prepare body with "Previous Balance" as first row
        const body = [
            [
                "1",
                "",
                "",
                "",
                "Previous Balance",
                type === "customer" ? formatPdfCurrency(openingBalance) : "0.00",
                type === "supplier" ? formatPdfCurrency(openingBalance) : "0.00",
                formatPdfCurrency(openingBalance)
            ],
            ...data.map((item, index) => {
                // Try to extract invoice/ref from description: "Sale (Inv: INV-123)" -> "INV-123"
                const refMatch = item.description.match(/\((?:Inv|Ref):\s*([^)]+)\)/i);
                const ref = refMatch ? refMatch[1] : "";
                const cleanDetails = item.description.replace(/\((?:Inv|Ref):[^)]+\)/i, "").trim();

                return [
                    (index + 2).toString(),
                    formatDate(item.date),
                    ref,
                    "", // Sub Reference (placeholder as we don't have it)
                    cleanDetails,
                    formatPdfCurrency(item.debit || 0),
                    formatPdfCurrency(item.credit || 0),
                    formatPdfCurrency(item.balance || 0),
                ];
            })
        ];

        autoTable(doc, {
            startY: 165,
            head: headers,
            body: body,
            theme: "grid",
            styles: {
                fontSize: 9,
                cellPadding: 4,
                textColor: 0,
                lineColor: [150, 150, 150],
                lineWidth: 0.5,
                font: "helvetica"
            },
            headStyles: {
                fillColor: [255, 255, 255],
                textColor: 0,
                fontStyle: "bold",
                halign: "center",
                lineWidth: 1,
                lineColor: [0, 0, 0]
            },
            columnStyles: {
                0: { cellWidth: 25, halign: "center" },
                1: { cellWidth: 70, halign: "center" },
                2: { cellWidth: 75, halign: "center" },
                3: { cellWidth: 60, halign: "center" },
                4: { cellWidth: 'auto' },
                5: { cellWidth: 65, halign: "right" },
                6: { cellWidth: 65, halign: "right" },
                7: { cellWidth: 70, halign: "right", fontStyle: "bold" },
            },
            margin: { left: 40, right: 40 },
        });

        // 4. FOOTER & TOTALS
        const finalY = (doc as any).lastAutoTable.finalY + 30;

        // Summary indicator
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        const finalBalance = data[data.length - 1].balance;
        doc.text(`Current Outstanding Due :  ${formatPdfCurrency(finalBalance)}`, 40, finalY);

        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth / 2, doc.internal.pageSize.height - 20, { align: 'center' });

        doc.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <Button
            onClick={handleExportPDF}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
        >
            <IconFileExport className="h-4 w-4" />
            Export PDF
        </Button>
    );
}
