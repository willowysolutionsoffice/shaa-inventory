"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Printer, Barcode } from "lucide-react";
import { toast } from "sonner";

interface ProductQrPrintProps {
  sku: string;
  productName: string;
}

export function ProductQrPrint({ sku, productName }: ProductQrPrintProps) {
  const [printQty, setPrintQty] = useState<number>(1);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!sku || !svgRef.current) return;
    import("jsbarcode").then((mod) => {
      const JsBarcode = mod.default;
      JsBarcode(svgRef.current, sku, {
        format: "CODE128",
        width: 2,
        height: 50,
        displayValue: true,
        fontSize: 11,
        margin: 6,
        background: "#ffffff",
        lineColor: "#000000",
      });
    });
  }, [sku]);

  const handlePrint = () => {
    if (printQty < 1) {
      toast.warning("Please enter a valid quantity of 1 or more.");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Failed to open print window. Please allow popups.");
      return;
    }

    let labelHtml = "";
    for (let i = 0; i < printQty; i++) {
      labelHtml += `<div class="label-item"><svg class="barcode" id="bc-${i}"></svg></div>`;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Barcodes - ${sku}</title>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
          <style>
            @page {
              size: A4 portrait;
              margin: 0;
            }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              width: 210mm;
              display: grid;
              grid-template-columns: repeat(2, 105mm);
              grid-template-rows: repeat(4, 74mm);
              background: #fff;
            }
            .label-item {
  width: 105mm;
  height: 74mm;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6mm 10mm 6mm 6mm;  /* ← reduce right padding to fix right shift */
  overflow: hidden;
}
            .label-item svg.barcode {
              display: block;
              width: 90mm;
              height: auto;
              margin: 0 auto;
            }
          </style>
        </head>
        <body>
          ${labelHtml}
          <script>
            window.onload = function () {
              document.querySelectorAll("svg.barcode").forEach(function (el) {
                JsBarcode(el, ${JSON.stringify(sku)}, {
  format: "CODE128",
  width: 2.5,
  height: 60,        // ← increased from 40
  displayValue: true,
  text: ${JSON.stringify(productName + "  |  " + sku)},
  fontSize: 18,
  textMargin: 8,
  margin: 10,
  background: "#ffffff",
  lineColor: "#000000",
});
              });
              setTimeout(function () {
                window.print();
                window.close();
              }, 700);
            };
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold flex items-center gap-1.5">
          <Barcode className="h-4 w-4 text-purple-600" /> Barcode & Printing
        </CardTitle>
        <CardDescription className="text-xs">
          Generate CODE128 barcode labels — 2×4 per A4 sheet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Barcode Preview */}
        <div className="flex flex-col items-center justify-center p-4 border border-dashed border-border/80 bg-muted/10 rounded-xl">
          <div className="bg-white p-3 rounded-2xl border border-border shadow-sm">
            <svg ref={svgRef} />
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