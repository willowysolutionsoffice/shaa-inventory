// src/components/sales/pos-shortcuts-config.ts

export interface ShortcutItem {
  key: string;
  label: string;
  description: string;
  category: "Billing" | "Navigation" | "Cart" | "System";
}

export const POS_SHORTCUTS: ShortcutItem[] = [
  {
    key: "F1",
    label: "Help",
    description: "Open shortcuts help overlay",
    category: "System",
  },
  {
    key: "F2",
    label: "Search / Barcode",
    description: "Focus barcode scanner / item search cell",
    category: "Cart",
  },
  {
    key: "F3",
    label: "Customer",
    description: "Focus customer selector",
    category: "Billing",
  },
  {
    key: "F4",
    label: "Discount",
    description: "Focus bill discount percentage & amount fields",
    category: "Billing",
  },
  {
    key: "F5",
    label: "Hold Bill",
    description: "Hold current transaction for later recall",
    category: "Billing",
  },
  {
    key: "F6",
    label: "Recall Bills",
    description: "Open / focus held bills list to restore a ticket",
    category: "Billing",
  },
  {
    key: "F7",
    label: "Sales Return",
    description: "Navigate to Sales Return page",
    category: "Navigation",
  },
  {
    key: "F8",
    label: "Split Payment",
    description: "Toggle Split Payment mode (Cash + Card + UPI)",
    category: "Billing",
  },
  {
    key: "F9",
    label: "Checkout & Print",
    description: "Complete checkout and print thermal receipt",
    category: "Billing",
  },
  {
    key: "F10",
    label: "Checkout No Print",
    description: "Complete checkout without printing receipt",
    category: "Billing",
  },
  {
    key: "Ctrl + Enter",
    label: "Payment Panel",
    description: "Jump focus to Payment Panel / Checkout",
    category: "Billing",
  },
  {
    key: "Ctrl + N",
    label: "New Bill",
    description: "Reset cart and start a brand new bill",
    category: "Cart",
  },
  {
    key: "Delete / Ctrl + D",
    label: "Delete Row",
    description: "Remove the selected / focused row from cart",
    category: "Cart",
  },
  {
    key: "Esc",
    label: "Cancel / Close",
    description: "Cancel in-place edit or close active modal",
    category: "System",
  },
];

export const BOTTOM_LEGEND_KEYS = [
  { key: "F1", label: "Help" },
  { key: "F2", label: "Item" },
  { key: "F3", label: "Customer" },
  { key: "F4", label: "Discount" },
  { key: "F5", label: "Hold" },
  { key: "F6", label: "Recall" },
  { key: "F7", label: "Return" },
  { key: "F8", label: "Split" },
  { key: "F9", label: "Print" },
  { key: "F10", label: "Save" },
  { key: "Ctrl+N", label: "New" },
  { key: "Esc", label: "Cancel" },
];
