export interface SalesReturnItem {
  id:           string;
  productId:    string;
  quantity:     number;
  unitPrice:    number;
  subtotal:     number;
  total:        number;
  product_name: string;
  product:      { id: string; productName: string; sku: string } | null;
}

export interface SalesReturn {
  id:           string;
  returnNo:     string;
  returnDate:   string | Date | null;
  saleId:       string;
  customerId:   string;
  branchId:     string;
  refundMethod: string;
  reason:       string | null;
  grandTotal:   number;
  sale:         { id: string; invoiceNo: string } | null;
  customer:     { id: string; name: string; phone?: string } | null;
  branch:       { id: string; name: string } | null;
  items:        SalesReturnItem[];
}

export interface SalesReturnFormProps {
  salesReturn?: SalesReturn;
  open?: boolean;
  openChange?: (open: boolean) => void;
}

export type SalesReturnItemField = 'quantity' | 'unitPrice' | 'subtotal' | 'total';