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
  price: number | string | null | undefined; // ← accept undefined
}

export function ProductQrPrint({ sku, productName, price }: ProductQrPrintProps) {
  const [printQty, setPrintQty] = useState<number>(1);
  const svgRef = useRef<SVGSVGElement>(null);

  const formattedPrice =
  price == null
    ? "—"
    : typeof price === "number"
    ? price.toFixed(2)
    : price;

  useEffect(() => {
    if (!sku || !svgRef.current) return;
    import("jsbarcode").then((mod) => {
      const JsBarcode = mod.default;
      JsBarcode(svgRef.current, sku, {
        format: "CODE128",
        width: 2,
        height: 48,
        displayValue: false,
        margin: 4,
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
      labelHtml += `
        <div class="label-item">

          <!-- SKU rotated on the left -->
          <div class="side-left">
            <span class="side-text">${sku}</span>
          </div>

          <!-- Main content -->
          <div class="label-main">
            <div class="brand">SHAASHOPY</div>
            <div class="product-name">${productName}</div>
            <svg class="barcode" id="bc-${i}"></svg>
            <div class="price">&#x20B9;: ${formattedPrice}</div>
          </div>

          <!-- FABSTORY rotated on the right -->
          <div class="side-right">
            <span class="side-text">FABSTORY</span>
          </div>

        </div>
      `;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Labels - ${sku}</title>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
          <style>
            @page { size: A4 portrait; margin: 0; }
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
              flex-direction: row;
              align-items: stretch;
              overflow: hidden;
              border: 0.2mm solid #eee;
            }

            .side-left,
            .side-right {
              width: 10mm;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            }

            .side-text {
              font-family: Arial, sans-serif;
              font-size: 7.5pt;
              font-weight: bold;
              letter-spacing: 0.5px;
              white-space: nowrap;
              writing-mode: vertical-rl;
            }

            .side-left .side-text {
              transform: rotate(180deg);
            }

            .side-right .side-text {
              transform: rotate(0deg);
            }

            .label-main {
              flex: 1;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 3mm 2mm;
              gap: 1.5mm;
            }

            .brand {
              font-family: Arial, sans-serif;
              font-size: 13pt;
              font-weight: bold;
              letter-spacing: 1px;
              color: #000;
              text-align: center;
            }

            .product-name {
              font-family: Arial, sans-serif;
              font-size: 10pt;
              font-weight: 600;
              color: #111;
              text-align: center;
            }

            svg.barcode {
              display: block;
              width: 80mm;
              height: auto;
            }

            .price {
              font-family: Arial, sans-serif;
              font-size: 11pt;
              font-weight: bold;
              color: #000;
              text-align: center;
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
                  width: 2.2,
                  height: 60,
                  displayValue: false,
                  margin: 4,
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
          Shaashopy label — 2×4 per A4 sheet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Label Preview */}
        <div className="flex justify-center p-4 border border-dashed border-border/80 bg-muted/10 rounded-xl">
          <div
            className="bg-white border border-border shadow-sm flex overflow-hidden rounded"
            style={{ width: 300, height: 150 }}
          >
            {/* Left: SKU rotated */}
            <div className="flex items-center justify-center bg-gray-50 border-r border-border" style={{ width: 28 }}>
              <span
                className="font-mono text-[9px] font-bold whitespace-nowrap"
                style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
              >
                {sku}
              </span>
            </div>

            {/* Center: main content */}
            <div className="flex flex-col items-center justify-center flex-1 gap-1 px-2 py-2">
              <span className="font-bold text-sm tracking-widest">SHAASHOPY</span>
              <span className="text-xs font-semibold text-gray-700">{productName}</span>
              <svg ref={svgRef} style={{ width: "100%", height: "auto" }} />
              <span className="font-bold text-xs">₹: {formattedPrice}</span>
            </div>

            {/* Right: FABSTORY rotated */}
            <div className="flex items-center justify-center bg-gray-50 border-l border-border" style={{ width: 28 }}>
              <span
                className="font-mono text-[9px] font-bold whitespace-nowrap"
                style={{ writingMode: "vertical-rl" }}
              >
                FABSTORY
              </span>
            </div>
          </div>
        </div>

        {/* Print Controls */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            Print Qty
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
              <Printer className="h-4 w-4" />
              Print {printQty > 1 ? `${printQty} Labels` : "Label"}
            </Button>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}