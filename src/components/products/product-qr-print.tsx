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
        height: 44,
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
          <div class="brand-top">SHAASHOPY</div>
          <div class="product-name">${productName}</div>
          <div class="barcode-row">
            <div class="sku-vertical">${sku}</div>
            <svg class="barcode" id="bc-${i}"></svg>
            <div class="fabstory-vertical">FABSTORY</div>
          </div>
          <div class="price">&#x20B9; : ${formattedPrice}</div>
        </div>
      `;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Labels - ${sku}</title>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
          <style>
            @page { size: 76mm 100mm; margin: 0; }

            * { box-sizing: border-box; margin: 0; padding: 0;
                -webkit-print-color-adjust: exact; print-color-adjust: exact; }

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
              align-items: center;
              /* no padding — controlled by margins on children only */
              overflow: hidden;
              background: #fff;
            }

            .brand-top {
              font-family: Arial, Helvetica, sans-serif;
              font-size: 7pt;
              font-weight: 900;
              color: #000;
              letter-spacing: 0.3px;
              text-align: center;
              margin-top: 0.7mm;
            }

            .product-name {
              font-family: Arial, Helvetica, sans-serif;
              font-size: 5.5pt;
              font-weight: 700;
              color: #000;
              text-align: center;
              margin-top: 0.2mm;   /* almost touching brand */
            }

            .barcode-row {
              display: flex;
              flex-direction: row;
              align-items: center;
              justify-content: center;
              width: 100%;
              margin-top: 0.2mm;   /* almost touching product name */
            }

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

            svg.barcode {
              display: block;
              width: 27mm;
              height: 12mm;
              flex-shrink: 0;
            }

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

            .price {
              font-family: Arial, Helvetica, sans-serif;
              font-size: 8.5pt;
              font-weight: 900;
              color: #000;
              text-align: center;
              margin-top: 0.2mm;   /* almost touching barcode */
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
                  height: 44,
                  displayValue: false,
                  margin: 0,
                  background: "#ffffff",
                  lineColor: "#000000",
                });
              });
              setTimeout(function () { window.print(); window.close(); }, 800);
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
          Shaashopy label — 2×4 per sheet (38×25mm each)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Preview — gaps mirror print (0.2mm → ~1px at 6×) */}
        <div className="flex justify-center p-4 border border-dashed border-border/80 bg-muted/10 rounded-xl">
          <div
            style={{
              width: 228,
              height: 150,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              background: "#fff",
              overflow: "hidden",
              fontFamily: "Arial, Helvetica, sans-serif",
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 900, color: "#000", letterSpacing: 0.3, marginTop: 4 }}>
              SHAASHOPY
            </span>

            <span style={{ fontSize: 9, fontWeight: 700, color: "#000", marginTop: 1 }}>
              {productName}
            </span>

            <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", width: "100%", marginTop: 1 }}>
              <div style={{ fontSize: 7, fontWeight: 700, color: "#000", writingMode: "vertical-rl", transform: "rotate(180deg)", whiteSpace: "nowrap", width: 10, flexShrink: 0 }}>
                {sku}
              </div>
              <svg ref={svgRef} style={{ width: 162, height: 66, display: "block", flexShrink: 0 }} />
              <div style={{ fontSize: 7, fontWeight: 700, color: "#000", writingMode: "vertical-rl", whiteSpace: "nowrap", width: 10, flexShrink: 0 }}>
                FABSTORY
              </div>
            </div>

            <span style={{ fontSize: 13, fontWeight: 900, color: "#000", marginTop: 1 }}>
              ₹ : {formattedPrice}
            </span>
          </div>
        </div>

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