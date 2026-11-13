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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Printer, Barcode } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

type BarcodeStickerSetting = {
  id: string;
  name: string;
  isDefault: boolean;
  labelWidthMm: number;
  labelHeightMm: number;
  columns: number;
  barcodeHeightMm: number;
  showBrand: boolean;
  showPrice: boolean;
  showSku: boolean;
  continuousFeed: boolean;
  topMarginIn: number;
  leftMarginIn: number;
  stickerWidthIn: number;
  stickerHeightIn: number;
  paperWidthIn: number;
  paperHeightIn: number;
  rowGapIn: number;
  columnGapIn: number;
  stickersPerSheet: number;
};

const FALLBACK_SETTING: BarcodeStickerSetting = {
  id: "fallback",
  name: "Fallback",
  isDefault: false,
  labelWidthMm: 38, labelHeightMm: 25, columns: 2, barcodeHeightMm: 9,
  showBrand: true, showPrice: true, showSku: true,
  continuousFeed: true,
  topMarginIn: 0.1, leftMarginIn: 0.1,
  stickerWidthIn: 1.38, stickerHeightIn: 0.98,
  paperWidthIn: 3.35, paperHeightIn: 2.2,
  rowGapIn: 0.12, columnGapIn: 0.12,
  stickersPerSheet: 1,
};

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
  const [printQty, setPrintQty] = useState<number>(1);
  const [settings, setSettings] = useState<BarcodeStickerSetting[]>([
    FALLBACK_SETTING,
  ]);
  const [selectedId, setSelectedId] = useState<string>(FALLBACK_SETTING.id);
  const [setting, setSetting] = useState<BarcodeStickerSetting>(FALLBACK_SETTING);
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
        width: 1,
        height: 26,
        displayValue: false,
        margin: 0,
        background: "#ffffff",
        lineColor: "#000000",
      });
    });
  }, [sku]);

  useEffect(() => {
    api.get<BarcodeStickerSetting[]>("/api/barcode-sticker-settings")
      .then((list) => {
        setSettings(list);
        const initial =
          list.find((s) => s.isDefault) ?? list[0] ?? FALLBACK_SETTING;
        setSetting(initial);
        setSelectedId(initial.id);
      })
      .catch(() => {
        setSettings([FALLBACK_SETTING]);
        setSetting(FALLBACK_SETTING);
        setSelectedId(FALLBACK_SETTING.id);
      });
  }, []);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    const found = settings.find((s) => s.id === id);
    if (found) setSetting(found);
  };

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
    const safeDisplaySku = escapeHtml(displaySku);
    const safeProductName = escapeHtml(productName);
    const safePrice = escapeHtml(String(formattedPrice));

    const MM = 25.4;
    // Fully setting-driven: page/label geometry comes only from the setting
    const stickerWidthMm = Number(setting.stickerWidthIn) * MM;
    const stickerHeightMm = Number(setting.stickerHeightIn) * MM;
    const paperWidthMm = Number(setting.paperWidthIn) * MM;
    const paperHeightMm = Number(setting.paperHeightIn) * MM;
    const topMarginMm = Number(setting.topMarginIn) * MM;
    const leftMarginMm = Number(setting.leftMarginIn) * MM;
    const rowGapMm = Number(setting.rowGapIn) * MM;
    const colGapMm = Number(setting.columnGapIn) * MM;
    const perSheet = Math.max(1, Number(setting.stickersPerSheet) || 1);
    const pageSize = setting.continuousFeed
      ? `${paperWidthMm}mm auto`
      : `${paperWidthMm}mm ${paperHeightMm}mm`;

    const labels: string[] = [];

    for (let i = 0; i < printQty; i++) {
      labels.push(`
        <div class="label">
          <div class="label-content">
            ${setting.showBrand ? '<div class="brand-top">SHAASHOPY</div>' : ''}
            <div class="product-name">${safeProductName}</div>

            <div class="barcode-row">
              <svg class="barcode" id="bc-${i}"></svg>
              <div class="fabstory-vertical">FABSTORY</div>
            </div>

            ${setting.showPrice ? `<div class="price">&#x20B9; : ${safePrice}</div>` : ''}
            ${setting.showSku ? `<div class="sku-bottom">${safeDisplaySku}</div>` : ''}
          </div>
        </div>
      `);
    }

    let bodyHtml: string;
    if (setting.continuousFeed) {
      bodyHtml = `<div class="sheet continuous">${labels.join("")}</div>`;
    } else {
      const pages: string[] = [];
      for (let i = 0; i < labels.length; i += perSheet) {
        pages.push(
          `<div class="sheet">${labels.slice(i, i + perSheet).join("")}</div>`,
        );
      }
      bodyHtml = pages.join("");
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Labels - ${safeSku}</title>

          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>

          <style>
            @page {
              size: ${pageSize};
              margin: ${topMarginMm}mm ${leftMarginMm}mm;
            }

            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            html,
            body {
              width: ${paperWidthMm}mm;
              background: #ffffff;
              margin: 0;
              padding: 0;
            }

            body {
              display: block;
              overflow: hidden;
            }

            .sheet {
              display: grid;
              grid-template-columns: repeat(${setting.columns}, ${stickerWidthMm}mm);
              grid-auto-rows: ${stickerHeightMm}mm;
              gap: ${rowGapMm}mm ${colGapMm}mm;
              break-after: page;
            }

            .sheet:last-child,
            .sheet.continuous {
              break-after: auto;
            }

            .label {
              width: ${stickerWidthMm}mm;
              height: ${stickerHeightMm}mm;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
              background: #ffffff;
              page-break-inside: avoid;
              break-inside: avoid;
            }

            .label-content {
              width: calc(${stickerWidthMm}mm - 3mm);
              height: calc(${stickerHeightMm}mm - 2mm);
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              overflow: hidden;

              /*
                Main alignment fix:
                Increase to 1.8mm or 2mm if still left.
                Reduce to 1mm if it becomes too right.
              */
              transform: translateX(1.5mm);
            }

            .brand-top {
              font-family: Arial, Helvetica, sans-serif;
              font-size: 6.5pt;
              font-weight: 900;
              color: #000000;
              letter-spacing: 0.35px;
              text-align: center;
              line-height: 1;
              width: 100%;
            }

            .product-name {
              font-family: Arial, Helvetica, sans-serif;
              font-size: 5.6pt;
              font-weight: 900;
              color: #000000;
              text-align: center;
              line-height: 1;
              width: 100%;
              overflow: hidden;
              white-space: nowrap;
              text-overflow: ellipsis;
              margin-top: 0.2mm;
            }

            .barcode-row {
              display: flex;
              flex-direction: row;
              align-items: center;
              justify-content: center;
              width: 100%;
              margin-top: 0.7mm;
              margin-bottom: 0.7mm;
            }

            svg.barcode {
              display: block;
              width: 28mm;
              height: ${setting.barcodeHeightMm}mm;
              flex-shrink: 0;
            }

            .fabstory-vertical {
              font-family: Arial, Helvetica, sans-serif;
              font-size: 5pt;
              font-weight: 900;
              color: #000000;
              writing-mode: vertical-rl;
              white-space: nowrap;
              line-height: 1;
              flex-shrink: 0;
              width: 3.5mm;
              letter-spacing: 0.2px;
              text-align: center;
            }

            .price {
              font-family: Arial, Helvetica, sans-serif;
              font-size: 7.3pt;
              font-weight: 900;
              color: #000000;
              text-align: center;
              line-height: 1;
              width: 100%;
            }

            .sku-bottom {
              font-family: Arial, Helvetica, sans-serif;
              font-size: 4.6pt;
              font-weight: 700;
              color: #000000;
              text-align: center;
              line-height: 1;
              width: 100%;
              letter-spacing: 0.2px;
              margin-top: 0.7mm;
            }
          </style>
        </head>

        <body>
          ${bodyHtml}

          <script>
            window.onload = function () {
              document.querySelectorAll("svg.barcode").forEach(function (el) {
                JsBarcode(el, ${JSON.stringify(sku)}, {
                  format: "CODE128",
                  width: 1,
                  height: 26,
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

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold flex items-center gap-1.5">
          <Barcode className="h-4 w-4 text-purple-600" />
          Barcode & Printing
        </CardTitle>

        <CardDescription className="text-xs">
          {setting.name} · {setting.columns} columns · {setting.labelWidthMm} ×{" "}
          {setting.labelHeightMm}mm ·{" "}
          {setting.continuousFeed ? "Continuous roll" : "Sheet"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            Sticker setting
          </label>
          <Select value={selectedId} onValueChange={handleSelect}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select setting" />
            </SelectTrigger>
            <SelectContent>
              {settings.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                  {s.isDefault ? " (Default)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-center p-4 border border-dashed border-border/80 bg-muted/10 rounded-xl">
          <div
            style={{
              width: 190,
              height: 125,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#fff",
              overflow: "hidden",
              fontFamily: "Arial, Helvetica, sans-serif",
              border: "1px solid #ddd",
            }}
          >
            <div
              style={{
                width: 175,
                height: 115,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                transform: "translateX(7px)",
              }}
            >
              {setting.showBrand && <span
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
              </span>}

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
                  marginTop: 1,
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
                  marginTop: 4,
                  marginBottom: 4,
                }}
              >
                <svg
                  ref={svgRef}
                  style={{
                    width: 140,
                    height: 43,
                    display: "block",
                    flexShrink: 0,
                  }}
                />

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

              {setting.showPrice && <span
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
              </span>}

              {setting.showSku && <span
                style={{
                  fontSize: 7,
                  fontWeight: 700,
                  color: "#000",
                  lineHeight: 1,
                  width: "100%",
                  textAlign: "center",
                  letterSpacing: 0.2,
                  marginTop: 4,
                }}
              >
                {displaySku}
              </span>}
            </div>
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
