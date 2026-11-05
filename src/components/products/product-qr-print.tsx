"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Printer, Barcode, Info } from "lucide-react";
import { toast } from "sonner";

interface ProductQrPrintProps {
  sku: string;
  productName: string;
  price: number | string | null | undefined;
}

export function ProductQrPrint({
  sku,
  productName,
  price,
}: ProductQrPrintProps) {
  // Default to 2 labels (1 row / 1 sheet on 2-up roll)
  const [printQty, setPrintQty] = useState<number>(2);
  const svgRef = useRef<SVGSVGElement>(null);

  const formattedPrice =
    price == null ? "—" : typeof price === "number" ? price.toFixed(2) : price;

  const displaySku = sku?.toUpperCase().startsWith("SKU-") ? sku : `SKU-${sku}`;

  useEffect(() => {
    if (!sku || !svgRef.current) return;

    import("jsbarcode").then((mod) => {
      const JsBarcode = mod.default;

      JsBarcode(svgRef.current, sku, {
        format: "CODE128",
        width: 2,
        height: 28,
        displayValue: false,
        margin: 0,
        marginLeft: 8,
        marginRight: 8,
        marginTop: 2,
        marginBottom: 2,
        background: "#ffffff",
        lineColor: "#000000",
      });
    });
  }, [sku]);

  const escapeHtml = (value: string) => {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

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

    const safeSku = escapeHtml(sku);
    const safeProductName = escapeHtml(productName);
    const safePrice = escapeHtml(String(formattedPrice));

    // 2-Up Roll format: 2 labels per row / sheet (38mm x 25mm each on a 76mm x 25mm feed)
    // 1-2 Qty = 1 sheet, 3-4 Qty = 2 sheets, 5-6 Qty = 3 sheets, etc.
    const LABELS_PER_SHEET = 2;
    const totalSheets = Math.ceil(printQty / LABELS_PER_SHEET);

    let pagesHtml = "";
    let labelCount = 0;

    for (let s = 0; s < totalSheets; s++) {
      let sheetLabelsHtml = "";
      const labelsOnThisSheet = Math.min(
        LABELS_PER_SHEET,
        printQty - s * LABELS_PER_SHEET
      );

      for (let i = 0; i < labelsOnThisSheet; i++) {
        const idIndex = labelCount++;
        sheetLabelsHtml += `
          <div class="label">
            <div class="label-content">
              <div class="brand-top">SHAASHOPY</div>
              <div class="product-name">${safeProductName}</div>

              <div class="barcode-row">
                <div class="barcode-wrapper">
                  <svg class="barcode" id="bc-${idIndex}"></svg>
                </div>
                <div class="fabstory-vertical">FABSTORY</div>
              </div>

              <div class="price">&#x20B9; : ${safePrice}</div>
            </div>
          </div>
        `;
      }

      // If quantity is odd, keep right column blank to prevent shifting
      for (let empty = labelsOnThisSheet; empty < LABELS_PER_SHEET; empty++) {
        sheetLabelsHtml += `<div class="label label-empty"></div>`;
      }

      pagesHtml += `<div class="sheet">${sheetLabelsHtml}</div>`;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Print Labels - ${safeSku}</title>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>

          <style>
            /* ── Page & Margin Setup for 2-Up Roll (76mm x 25mm per row) ── */
            @page {
              size: 76mm 25mm;
              margin: 0mm;
            }

            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            html,
            body {
              width: 76mm;
              margin: 0;
              padding: 0;
              background: #ffffff;
              font-family: Arial, Helvetica, sans-serif;
            }

            /* ── Print Media Optimization ── */
            @media print {
              html,
              body {
                width: 76mm !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }

              .sheet {
                width: 76mm !important;
                height: 25mm !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }

              .sheet:not(:last-child) {
                page-break-after: always !important;
                break-after: page !important;
              }

              .label {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
            }

            /* ── 76mm x 25mm Single Row Grid (2 Columns of 38mm) ── */
            .sheet {
              width: 76mm;
              height: 25mm;
              max-width: 76mm;
              max-height: 25mm;
              display: grid;
              grid-template-columns: 38mm 38mm;
              grid-template-rows: 25mm;
              margin: 0;
              padding: 0;
              overflow: hidden;
              page-break-inside: avoid;
              break-inside: avoid;
            }

            .sheet:not(:last-child) {
              page-break-after: always;
              break-after: page;
            }

            /* ── 38mm x 25mm Individual Label ── */
            .label {
              width: 38mm;
              height: 25mm;
              max-width: 38mm;
              max-height: 25mm;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
              background: #ffffff;
              page-break-inside: avoid;
              break-inside: avoid;
              padding: 0.8mm 1.2mm;
            }

            .label-empty {
              visibility: hidden;
            }

            .label-content {
              width: 100%;
              height: 100%;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: space-between;
              overflow: hidden;
            }

            .brand-top {
              font-size: 6.5pt;
              font-weight: 900;
              color: #000000;
              letter-spacing: 0.35px;
              text-align: center;
              line-height: 1;
              width: 100%;
            }

            .product-name {
              font-size: 5.5pt;
              font-weight: 900;
              color: #000000;
              text-align: center;
              line-height: 1.1;
              width: 100%;
              overflow: hidden;
              white-space: nowrap;
              text-overflow: ellipsis;
            }

            .barcode-row {
              display: flex;
              flex-direction: row;
              align-items: center;
              justify-content: center;
              width: 100%;
              gap: 1mm;
              margin: 0.2mm 0;
            }

            .barcode-wrapper {
              display: flex;
              align-items: center;
              justify-content: center;
              background: #ffffff;
              flex: 1;
              min-width: 0;
              overflow: hidden;
            }

            svg.barcode {
              display: block;
              width: 100%;
              max-width: 32mm;
              height: 8.5mm;
            }

            .fabstory-vertical {
              font-size: 4.8pt;
              font-weight: 900;
              color: #000000;
              writing-mode: vertical-rl;
              white-space: nowrap;
              line-height: 1;
              flex-shrink: 0;
              width: 2.8mm;
              letter-spacing: 0.2px;
              text-align: center;
            }

            .price {
              font-size: 7.5pt;
              font-weight: 900;
              color: #000000;
              text-align: center;
              line-height: 1;
              width: 100%;
            }
          </style>
        </head>

        <body>
          ${pagesHtml}

          <script>
            window.onload = function () {
              document.querySelectorAll("svg.barcode").forEach(function (el) {
                JsBarcode(el, ${JSON.stringify(sku)}, {
                  format: "CODE128",
                  width: 2,
                  height: 28,
                  displayValue: false,
                  margin: 0,
                  marginLeft: 8,
                  marginRight: 8,
                  marginTop: 2,
                  marginBottom: 2,
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

  const calculatedSheets = Math.ceil(printQty / 2);

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold flex items-center gap-1.5">
          <Barcode className="h-4 w-4 text-purple-600" />
          Barcode & Printing
        </CardTitle>

        <CardDescription className="text-xs">
          Shaashopy label — 2-up thermal roll (38×25mm per label, 76×25mm per row)
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Preview — 5× scale: 38mm → 190px, 25mm → 125px */}
        <div className="flex justify-center p-4 border border-dashed border-border/80 bg-muted/10 rounded-xl">
          <div
            style={{
              width: 190,
              height: 125,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#ffffff",
              overflow: "hidden",
              fontFamily: "Arial, Helvetica, sans-serif",
              border: "1px solid #ddd",
              padding: "4px 6px",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
                overflow: "hidden",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 900,
                  color: "#000",
                  letterSpacing: 0.35,
                  lineHeight: 1,
                  width: "100%",
                  textAlign: "center",
                }}
              >
                SHAASHOPY
              </span>

              <span
                style={{
                  fontSize: 9,
                  fontWeight: 900,
                  color: "#000",
                  lineHeight: 1,
                  width: "100%",
                  textAlign: "center",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                }}
              >
                {productName}
              </span>

              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  gap: 4,
                  margin: "1px 0",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    justifyContent: "center",
                    background: "#ffffff",
                    overflow: "hidden",
                  }}
                >
                  <svg
                    ref={svgRef}
                    style={{
                      width: "100%",
                      maxWidth: 160,
                      height: 42,
                      display: "block",
                    }}
                  />
                </div>

                <div
                  style={{
                    fontSize: 7,
                    fontWeight: 900,
                    color: "#000",
                    writingMode: "vertical-rl",
                    whiteSpace: "nowrap",
                    width: 14,
                    flexShrink: 0,
                    textAlign: "center",
                  }}
                >
                  FABSTORY
                </div>
              </div>

              <span
                style={{
                  fontSize: 12,
                  fontWeight: 900,
                  color: "#000",
                  lineHeight: 1,
                  width: "100%",
                  textAlign: "center",
                }}
              >
                ₹ : {formattedPrice}
              </span>
            </div>
          </div>
        </div>

        {/* ── On-Screen Instruction Notice ── */}
        <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200 flex items-start gap-2">
          <Info className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-xs">Thermal Printer (TSC TTP-244 Pro) Configuration:</p>
            <p className="text-[11px] leading-relaxed">
              Paper size: <strong>76 x 25 mm</strong> (2 labels/row). Scale: <strong>100%</strong>. Margins: <strong>None</strong>.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            Print Quantity (2 Labels per Row / Sheet)
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
              Print {printQty} {printQty > 1 ? "Labels" : "Label"} ({calculatedSheets} {calculatedSheets > 1 ? "Sheets" : "Sheet"})
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
