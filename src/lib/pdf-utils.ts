import jsPDF from "jspdf";
import { format } from "date-fns";

export const formatPdfCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

export const addBranding = (doc: jsPDF, title: string) => {
    const pageWidth = doc.internal.pageSize.getWidth();

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

    // Centered Title Box
    const boxWidth = 200;
    const boxHeight = 35;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(180);
    doc.rect((pageWidth / 2) - (boxWidth / 2) + 2, 57, boxWidth, boxHeight, 'S'); // Shadow base
    doc.setDrawColor(0);
    doc.rect((pageWidth / 2) - (boxWidth / 2), 55, boxWidth, boxHeight, 'S');

    doc.setFont("times", "bold");
    doc.setFontSize(16);
    doc.text(title, pageWidth / 2, 77, { align: 'center' });
};
