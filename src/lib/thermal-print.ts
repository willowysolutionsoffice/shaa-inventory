"use client";

import qz from "qz-tray";
import { toast } from "sonner";

export interface ThermalPrintData {
  invoiceNo: string;
  date: string;
  time: string;
  customerName: string;
  customerPhone: string;
  items: { sku: string; name: string; qty: number; unitPrice: number; total: number }[];
  couponDiscount: number;
  couponCode: string;
  manualDiscount: number;
  grandTotal: number;
  payments: { method: string; amount: number }[];
  change: number;
}

function methodLabel(method: string) {
  const m = method.toLowerCase();
  if (m === "cash") return "Cash";
  if (m === "card") return "Card";
  if (m === "upi") return "UPI";
  return method;
}

function buildPaymentHtml(payments: { method: string; amount: number }[], change: number): string {
  const safePayments = payments.length > 0 ? payments : [{ method: "cash", amount: 0 }];
  const isSplit = safePayments.length > 1;
  const changeRow = change > 0
    ? `<div class="bold" style="display:flex;justify-content:space-between;margin-top:2px;font-size:11px;"><span>Change:</span><span>${change.toLocaleString("en-IN")}</span></div>`
    : "";

  if (!isSplit) {
    return `
      <div class="bold" style="display:flex;justify-content:space-between;font-size:11px;margin-top:2px;">
        <span>Paid via:</span>
        <span>${methodLabel(safePayments[0].method)}</span>
      </div>${changeRow}`;
  }

  const rows = safePayments.map((p) => `
    <div class="bold" style="display:flex;justify-content:space-between;font-size:11px;padding-left:8px;">
      <span>&#x21b3; ${methodLabel(p.method)}:</span>
      <span>${p.amount.toLocaleString("en-IN")}</span>
    </div>`).join("");

  return `
    <div class="bold" style="display:flex;justify-content:space-between;font-size:11px;margin-top:2px;">
      <span>Paid via:</span><span>Split Payment</span>
    </div>${rows}${changeRow}`;
}

async function setupQZSecurity() {
  qz.security.setCertificatePromise(async () => {
    const res = await fetch("/qz/digital-certificate.txt");

    if (!res.ok) {
      throw new Error("QZ certificate not found");
    }

    return await res.text();
  });

  qz.security.setSignatureAlgorithm("SHA512");

  qz.security.setSignaturePromise((toSign) => {
    return async (resolve, reject) => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrl) {
          throw new Error("NEXT_PUBLIC_API_URL is not configured");
        }

        const res = await fetch(`${apiUrl}/qz/sign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ request: toSign }),
        });

        if (!res.ok) {
          throw new Error("QZ signature failed");
        }

        const data = await res.json();
        resolve(data.signature);
      } catch (err) {
        reject(err);
      }
    };
  });
}

export async function printHtmlWithQZ(invoiceHtml: string) {
  try {
    await setupQZSecurity();

    if (!qz.websocket.isActive()) {
      await qz.websocket.connect({ retries: 2, delay: 1 });
    }

    const printer = localStorage.getItem("pos_printer_name") || "Microsoft Print to PDF";

    const config = qz.configs.create(printer, {
      margins: 0,
      units: "mm",
      size: { width: 80 },
      scaleContent: false,
      rasterize: false,
    });

    await qz.print(config, [
      {
        type: "pixel",
        format: "html",
        flavor: "plain",
        data: invoiceHtml,
      },
    ]);

    toast.success("Invoice sent to printer.");
  } catch (err) {
    console.error("[QZ print error]", err);
    toast.error("QZ printing failed.");
    throw err;
  }
}

export function buildThermalReceiptHtml(data: ThermalPrintData): string {
  const itemRows = data.items.map((item, i) => `
  <tr style="border-bottom:${i < data.items.length - 1 ? "1px dashed #000" : "none"};">
    <td style="padding:4px 0;font-size:9px;">${i + 1}</td>
    <td style="padding:4px 2px 4px 0;font-size:9px;word-break:break-all;line-height:1.3;">${item.sku}</td>
    <td class="heavy" style="padding:4px 2px 4px 0;font-size:9px;word-break:break-word;line-height:1.3;">${item.name}</td>
    <td style="padding:4px 0;text-align:center;font-size:9px;">${item.qty}</td>
    <td style="padding:4px 0;text-align:right;font-size:9px;">${item.unitPrice.toLocaleString("en-IN")}</td>
    <td class="heavy" style="padding:4px 0;text-align:right;font-size:9px;">${item.total.toLocaleString("en-IN")}</td>
  </tr>`).join("");

  const couponRow = data.couponDiscount > 0
    ? `<div style="display:flex;justify-content:space-between;font-size:10px;color:#000;"><span>Coupon (${data.couponCode}):</span><span>-${data.couponDiscount.toLocaleString("en-IN")}</span></div>`
    : "";

  const discountRow = data.manualDiscount > 0
    ? `<div style="display:flex;justify-content:space-between;font-size:10px;color:#000;"><span>Discount:</span><span>-${data.manualDiscount.toLocaleString("en-IN")}</span></div>`
    : "";

  const customerBlock = data.customerName && data.customerName !== "Select a Customer"
    ? `<div style="padding-left:8px;font-weight:700;color:#000;">${data.customerName}</div>`
    : "";

  const phoneBlock = data.customerPhone
    ? `<div style="padding-left:8px;font-size:10px;color:#000;">${data.customerPhone}</div>`
    : "";

  return `
    <html><head>
  <title>Receipt - ${data.invoiceNo}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@500;700;800&display=swap" rel="stylesheet">
  <style>
    @page { size: 80mm auto; margin: 0; }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: 'Roboto Mono', 'Courier New', Courier, monospace;
      font-size: 11px;
      font-weight: 800;
      line-height: 1.55;
      color: #000000;
      background: #ffffff;
      width: 80mm;
      padding: 14px 12px;
    }
    div, span, p {
      font-family: 'Roboto Mono', 'Courier New', Courier, monospace;
      font-weight: 800;
      color: #000000;
    }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th { font-weight: 900; color: #000; font-family: 'Roboto Mono', 'Courier New', Courier, monospace; }
    td { font-weight: 800; color: #000; font-family: 'Roboto Mono', 'Courier New', Courier, monospace; }
    strong { font-weight: 900; }
    .bold  { font-weight: 900 !important; }
    .heavy { font-weight: 900 !important; }
  </style>
</head><body>
      <div style="text-align:center;margin-bottom:10px;">
        <div style="font-weight:900;font-size:17px;letter-spacing:1.5px;text-transform:uppercase;">SHAASHOPY</div>
        <div style="font-size:10px;margin-top:1px;">2ND FLOOR, HILITE MALL</div>
        <div style="font-size:10px;">PH: +91 9847640052</div>
        <div style="font-size:10px;">GSTIN: 32AFJFS9358F1ZN</div>
      </div>
      <div style="border-top:1px dashed #000;border-bottom:1px dashed #000;padding:5px 0;margin-bottom:8px;">
        <div style="display:flex;justify-content:space-between;">
          <span>Bill No : <strong>${data.invoiceNo}</strong></span>
          <span>Date : ${data.date}</span>
        </div>
        <div style="text-align:right;">Time : ${data.time}</div>
      </div>
      <div style="margin-bottom:6px;">
        <div>To :</div>${customerBlock}${phoneBlock}
      </div>
      <table style="border-top:1px dashed #000;">
        <colgroup>
  <col style="width:12px"/>
  <col style="width:55px"/>
  <col/>
  <col style="width:20px"/>
  <col style="width:50px"/>
  <col style="width:50px"/>
</colgroup>
<thead>
  <tr style="border-bottom:1px dashed #000;font-size:9px;">
    <th style="text-align:left;padding:4px 0 3px;">Sn</th>
    <th style="text-align:left;padding:4px 0 3px;">Code</th>
    <th style="text-align:left;padding:4px 0 3px;">Item</th>
    <th style="text-align:center;padding:4px 0 3px;">Qty</th>
    <th style="text-align:right;padding:4px 0 3px;">Rate</th>
    <th style="text-align:right;padding:4px 0 3px;">Total</th>
  </tr>
</thead>
        <tbody>${itemRows}</tbody>
      </table>
      <div style="border-top:1px dashed #000;padding-top:6px;margin-top:2px;">
        ${couponRow}${discountRow}
        <div style="display:flex;justify-content:space-between;font-weight:900;font-size:14px;border-top:1px solid #000;margin-top:4px;padding-top:4px;">
          <span>Grand Total:</span>
          <span>${data.grandTotal.toLocaleString("en-IN")}</span>
        </div>
        ${buildPaymentHtml(data.payments, data.change)}
      </div>
      <div style="border-top:1px dashed #000;margin-top:8px;padding-top:6px;text-align:center;font-size:10px;">
        <div>SALESMAN :&nbsp;</div>
        <div style="margin-top:2px;">Insta ID :&nbsp;<span style="font-weight:700;">shaashopy.hilitemall</span></div>
      </div>
      <div style="border-top:1px solid #000;border-bottom:1px solid #000;margin-top:10px;padding:8px 0;">
        <div style="font-weight:700;font-size:11px;margin-bottom:6px;text-decoration:underline;text-align:center;">TERMS AND CONDITIONS</div>
        <div style="font-size:10px;margin-bottom:2px;">* No Cash Refund</div>
        <div style="font-size:10px;margin-bottom:2px;">* NO credit note will be issued</div>
        <div style="font-size:10px;margin-bottom:2px;">* NO Guarantee is provided for fancy items</div>
        <div style="font-size:10px;margin-bottom:2px;">* Exchange Within 3 Days (Only on Same Brand)</div>
        <div style="font-size:10px;margin-bottom:2px;">* Only dry wash recommend for this material</div>
        <div style="font-size:10px;margin-bottom:2px;">* We are under composition taxpayer, We are not collecting tax from customer</div>
      </div>
      <div style="text-align:center;margin-top:10px;font-weight:700;font-size:11px;letter-spacing:0.5px;">THANK YOU VISIT AGAIN ;</div>
    </body></html>`;
}

export async function printThermalDirect(data: ThermalPrintData) {
  const html = buildThermalReceiptHtml(data);
  await printHtmlWithQZ(html);
}
