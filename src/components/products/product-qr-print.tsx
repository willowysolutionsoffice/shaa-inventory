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
  price: number | string | null | undefined;
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
        width: 1.5,
        height: 38,
        displayValue: false,
        margin: 0,
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
        <div class="label">
          <!-- Top: SHAASHOPY + SKU name (productName/AF13) centered -->
          <div class="top-center">
            <span class="brand-top">SHAASHOPY</span>
            <span class="af-code">${productName}</span>
          </div>

          <!-- Middle: SKU vertical | Barcode | FABSTORY vertical -->
          <div class="barcode-row">
            <div class="sku-vertical">${sku}</div>
            <svg class="barcode" id="bc-${i}"></svg>
            <div class="fabstory-vertical">FABSTORY</div>
          </div>

          <!-- Bottom: Price left -->
          <div class="bottom-row">
            <span class="price">&#x20B9; : ${formattedPrice}</span>
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
            /*
             * Label size : 38mm wide × 25mm tall
             * Grid       : 2 columns × 4 rows = 8 labels per sheet
             * Sheet size : 76mm wide × 100mm tall
             */

            @page {
              size: 76mm 100mm;
              margin: 0;
            }

            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            body {
              width: 76mm;
              background: #fff;
              display: grid;
              grid-template-columns: repeat(2, 38mm);
              grid-template-rows: repeat(4, 25mm);
              gap: 0;
            }

            .label {
              width: 38mm;
              height: 25mm;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              padding: 0.8mm 0.5mm 0.8mm 0.5mm;
              overflow: hidden;
              background: #fff;
            }

            /* TOP: SHAASHOPY + AF13 centered */
            .top-center {
              display: flex;
              flex-direction: column;
              align-items: center;
              line-height: 1;
              gap: 1mm;
            }

            .brand-top {
              font-family: Arial, Helvetica, sans-serif;
              font-size: 7pt;
              font-weight: 900;
              color: #000;
              letter-spacing: 0.3px;
              text-align: center;
            }

            .af-code {
              font-family: Arial, Helvetica, sans-serif;
              font-size: 5.5pt;
              font-weight: 700;
              color: #000;
              text-align: center;
            }

            /* MIDDLE ROW: SKU vertical | barcode | FABSTORY vertical */
            .barcode-row {
              display: flex;
              flex-direction: row;
              align-items: center;
              justify-content: center;
              width: 100%;
              gap: 0;
            }

            /* Vertical SKU — rotated 90° CCW */
            .sku-vertical {
              font-family: Arial, Helvetica, sans-serif;
              font-size: 4.5pt;
              font-weight: 700;
              color: #000;
              writing-mode: vertical-rl;
              transform: rotate(180deg);
              white-space: nowrap;
              line-height: 1;
              flex-shrink: 0;
              width: 3.5mm;
            }

            /* Barcode */
            svg.barcode {
              display: block;
              width: 27mm;
              height: 11mm;
              flex-shrink: 0;
            }

            /* Vertical FABSTORY — rotated */
            .fabstory-vertical {
              font-family: Arial, Helvetica, sans-serif;
              font-size: 4.5pt;
              font-weight: 700;
              color: #000;
              writing-mode: vertical-rl;
              white-space: nowrap;
              line-height: 1;
              flex-shrink: 0;
              width: 3.5mm;
            }

            /* BOTTOM: Price left-aligned */
            .bottom-row {
              display: flex;
              align-items: center;
              width: 100%;
            }

            .price {
              font-family: Arial, Helvetica, sans-serif;
              font-size: 8.5pt;
              font-weight: 900;
              color: #000;
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
                  width: 1.5,
                  height: 38,
                  displayValue: false,
                  margin: 0,
                  background: "#ffffff",
                  lineColor: "#000000",
                });
              });
              setTimeout(function () {
                window.print();
                window.close();
              }, 800);
            };
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Preview scale: 38mm → 228px (6× scale), 25mm → 150px
  // So 1mm = 6px in preview
  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold flex items-center gap-1.5">
          <Barcode className="h-4 w-4 text-purple-600" /> Barcode & Printing
        </CardTitle>
        <CardDescription className="text-xs">
          Shaashopy label — 2×4 per sheet (38×25mm each)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Label Preview — 6× scale from 38×25mm → 228×150px */}
        <div className="flex justify-center p-4 border border-dashed border-border/80 bg-muted/10 rounded-xl">
          <div
            className="bg-white overflow-hidden flex flex-col justify-between"
            style={{
              width: 228,
              height: 150,
              padding: "5px 3px",
              fontFamily: "Arial, Helvetica, sans-serif",
            }}
          >
            {/* TOP: SHAASHOPY + productName centered */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 11, fontWeight: 900, color: "#000", letterSpacing: 0.3 }}>
                SHAASHOPY
              </span>
              <span style={{ fontSize: 9, fontWeight: 700, color: "#000" }}>
                {productName}
              </span>
            </div>

            {/* MIDDLE: SKU vertical | barcode | FABSTORY vertical */}
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", width: "100%", gap: 0 }}>
              {/* SKU rotated */}
              <div
                style={{
                  fontSize: 7,
                  fontWeight: 700,
                  color: "#000",
                  writingMode: "vertical-rl",
                  transform: "rotate(180deg)",
                  whiteSpace: "nowrap",
                  width: 10,
                  flexShrink: 0,
                }}
              >
                {sku}
              </div>

              {/* Barcode */}
              <svg
                ref={svgRef}
                style={{ width: 162, height: 50, display: "block", flexShrink: 0 }}
              />

              {/* FABSTORY rotated */}
              <div
                style={{
                  fontSize: 7,
                  fontWeight: 700,
                  color: "#000",
                  writingMode: "vertical-rl",
                  whiteSpace: "nowrap",
                  width: 10,
                  flexShrink: 0,
                }}
              >
                FABSTORY
              </div>
            </div>

            {/* BOTTOM: Price left */}
            <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: "#000" }}>
                ₹ : {formattedPrice}
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