"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Printer, QrCode } from "lucide-react";
import { toast } from "sonner";

interface ProductQrPrintProps {
  sku: string;
  productName: string;
}

export function ProductQrPrint({ sku, productName }: ProductQrPrintProps) {
  const [printQty, setPrintQty] = useState<number>(1);

  const handlePrint = () => {
    if (printQty < 1) {
      toast.warning("Please enter a valid quantity of 1 or more.");
      return;
    }
    
    // Create a new window for printing to avoid printing the whole dashboard UI
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Failed to open print window. Please allow popups.");
      return;
    }

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(sku)}`;

    // Generate HTML for printing labels
    let labelHtml = "";
    for (let i = 0; i < printQty; i++) {
      labelHtml += `
        <div class="label-item">
          <img src="${qrUrl}" alt="QR Code" />
          <div class="label-text">
            <span class="prod-name">${productName}</span>
            <span class="prod-sku">${sku}</span>
          </div>
        </div>
      `;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Codes - ${sku}</title>
          <style>
            @media print {
              body {
                margin: 0;
                padding: 10px;
              }
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
              gap: 15px;
              padding: 20px;
              background-color: #ffffff;
            }
            .label-item {
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 10px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              page-break-inside: avoid;
              background-color: #ffffff;
              width: 120px;
              height: 150px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            }
            .label-item img {
              width: 85px;
              height: 85px;
              display: block;
              margin-bottom: 8px;
            }
            .label-text {
              display: flex;
              flex-direction: column;
              gap: 2px;
              width: 100%;
            }
            .prod-name {
              font-size: 9px;
              font-weight: 600;
              color: #1e293b;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              display: block;
              padding: 0 4px;
            }
            .prod-sku {
              font-size: 8px;
              font-family: monospace;
              font-weight: 700;
              color: #64748b;
              background-color: #f1f5f9;
              padding: 1px 4px;
              border-radius: 3px;
              align-self: center;
            }
          </style>
        </head>
        <body>
          ${labelHtml}
          <script>
            // Automatically trigger print dialog when images are loaded
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 600);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold flex items-center gap-1.5">
          <QrCode className="h-4 w-4 text-purple-600" /> QR Code & Printing
        </CardTitle>
        <CardDescription className="text-xs">
          Generate individual or batch QR labels for inventory scanning
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center p-4 border border-dashed border-border/80 bg-muted/10 rounded-xl">
          <div className="bg-white p-3 rounded-2xl border border-border shadow-sm">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(sku)}`}
              alt="SKU QR Code"
              className="w-[140px] h-[140px] select-none"
            />
          </div>
          <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 dark:bg-purple-950/30 px-2 py-0.5 mt-3 rounded border border-purple-100 dark:border-purple-900/50">
            {sku}
          </span>
        </div>

        {/* Print Batch Section */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            Print Qty (Multi-print)
          </label>
          <div className="flex gap-2">
            <Input
              type="number"
              min={1}
              max={500}
              value={printQty}
              onChange={(e) => setPrintQty(parseInt(e.target.value) || 1)}
              className="w-24 h-9 text-sm"
            />
            <Button
              onClick={handlePrint}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold h-9 gap-1"
            >
              <Printer className="h-4 w-4" /> Print {printQty > 1 ? `${printQty} Labels` : "Label"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
