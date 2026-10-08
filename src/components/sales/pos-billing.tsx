// src/components/sales/pos-billing.tsx
"use client";

import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  Trash2,
  Receipt,
  UserPlus,
  ShoppingBag,
  Loader2,
  UserCog,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { createSale } from "@/actions/sales-action";
import { getBrandListForDropdown } from "@/actions/brand-actions";
import { getUserList } from "@/actions/user-action";
import {
  getCustomerListForDropdown,
  createCustomer,
} from "@/actions/customer-action";
import { getProductDropdown } from "@/actions/product-actions";
import { CustomerFormDialog } from "@/components/customers/customer-form";

import {
  POSProduct,
  POSCustomer,
  POSSalesman,
  PrintReceiptParams,
  LastInvoiceSnapshot,
  WALK_IN_SENTINEL,
  NO_SALESMAN_SENTINEL,
  USE_KEYBOARD_GRID,
  dateInputToLocalDate,
  itemDiscountAmount,
  itemLineSubtotal,
  itemLineTotal,
} from "./pos-types";
import { printThermalReceipt } from "./pos-print";
import { usePosCart } from "./use-pos-cart";
import { usePosScanner } from "./use-pos-scanner";
import { CartGrid } from "./pos-cart-grid";
import { BillSummary } from "./pos-bill-summary";
import { PaymentPanel } from "./pos-payment-panel";
import { BarcodeSearchCatalog } from "./pos-barcode-search";
import { LastInvoiceDialog } from "./pos-last-invoice-dialog";
import { HeldBillsCard } from "./pos-held-bills";
import { PosShortcutsHelpDialog } from "./pos-shortcuts-help-dialog";
import { PosLegendBar } from "./pos-legend-bar";

export { USE_KEYBOARD_GRID };

export default function PosBillingPage({
  branchId = "",
  branchName = "Branch",
}: {
  branchId?: string;
  branchName?: string;
}) {
  const router = useRouter();

  // ── Remote Data State ──────────────────────────────────────────────────────
  const [products, setProducts] = useState<POSProduct[]>([]);
  const [customers, setCustomers] = useState<POSCustomer[]>([]);
  const [salesmen, setSalesmen] = useState<POSSalesman[]>([]);
  const [brandOptions, setBrandOptions] = useState<
    { id: string; name: string }[]
  >([]);
  const [loadingData, setLoadingData] = useState(true);
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [walkInCustomerId, setWalkInCustomerId] = useState<string | null>(null);

  // ── Cart & Calculation State Hook ──────────────────────────────────────────
  const {
    cart,
    setCart,
    couponCode,
    setCouponCode,
    appliedCoupon,
    couponDiscountPercent,
    manualDiscountPercent,
    setManualDiscountPercent,
    manualDiscountAmount,
    setManualDiscountAmount,
    heldBills,
    invoiceDate,
    setInvoiceDate,
    selectedCustomer,
    setSelectedCustomer,
    selectedSalesman,
    setSelectedSalesman,
    payments,
    splitMode,
    subtotal,
    itemDiscountTotal,
    couponDiscountAmount,
    manualPct,
    manualAmt,
    manualDiscountCalculated,
    totalDiscountAmount,
    grandTotal,
    totalPaid,
    cashChange,
    paymentShortfall,
    hasUnselectedSplitMethod,
    addToCart,
    setExactQuantity,
    updateQuantity,
    updateItemPrice,
    updateItemDiscount,
    updateItemDiscountAmount,
    removeFromCart,
    resetCart,
    applyCoupon,
    removeCoupon,
    clearManualDiscount,
    toggleSplitMode,
    setSinglePaymentMethod,
    updateSplitMethod,
    updateSplitAmount,
    holdBill,
    restoreBill,
  } = usePosCart();

  // ── Invoice Dialog State ───────────────────────────────────────────────────
  const [pendingPrint, setPendingPrint] = useState<Omit<
    PrintReceiptParams,
    "invoiceNo"
  > | null>(null);
  const [lastInvoice, setLastInvoice] = useState<LastInvoiceSnapshot | null>(
    null,
  );
  const [lastInvoiceOpen, setLastInvoiceOpen] = useState(false);

  // ── Barcode Scanner Auto-Focus ─────────────────────────────────────────────
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const focusBarcodeInput = useCallback(() => {
    setTimeout(() => barcodeInputRef.current?.focus(), 0);
  }, []);

  const handleAddToCart = useCallback(
    (product: POSProduct) => {
      addToCart(product, focusBarcodeInput);
    },
    [addToCart, focusBarcodeInput],
  );

  const handleResetCart = useCallback(() => {
    resetCart(focusBarcodeInput);
  }, [resetCart, focusBarcodeInput]);

  const handleRestoreBill = useCallback(
    (holdId: string) => {
      restoreBill(holdId, focusBarcodeInput);
    },
    [restoreBill, focusBarcodeInput],
  );

  // ── Global Hardware Barcode Scanner Hook ───────────────────────────────────
  usePosScanner({
    onScan: (scannedCode) => {
      const q = scannedCode.trim().toLowerCase();
      const found =
        products.find((p) => p.sku.toLowerCase() === q) ??
        products.find(
          (p) =>
            p.sku.toLowerCase().includes(q) ||
            p.name.toLowerCase().includes(q),
        );

      if (found) {
        handleAddToCart(found);
      } else {
        toast.error(`Barcode "${scannedCode}" not found in catalog.`);
      }
    },
  });

  // ── Navigation Field Sequence & Refs ───────────────────────────────────────
  const searchInputRef = useRef<HTMLInputElement>(null);
  const categorySelectRef = useRef<HTMLButtonElement>(null);
  const brandSelectRef = useRef<HTMLButtonElement>(null);
  const subBrandSelectRef = useRef<HTMLButtonElement>(null);
  const customerSelectRef = useRef<HTMLButtonElement>(null);
  const salesmanSelectRef = useRef<HTMLButtonElement>(null);
  const invoiceDateRef = useRef<HTMLInputElement>(null);
  const couponInputRef = useRef<HTMLInputElement>(null);
  const manualDiscountPercentRef = useRef<HTMLInputElement>(null);
  const manualDiscountAmountRef = useRef<HTMLInputElement>(null);
  const checkoutButtonRef = useRef<HTMLButtonElement>(null);

  const fieldSequence = useMemo(
    () => [
      barcodeInputRef, // 0
      searchInputRef, // 1
      categorySelectRef, // 2
      brandSelectRef, // 3
      subBrandSelectRef, // 4
      customerSelectRef, // 5
      salesmanSelectRef, // 6
      invoiceDateRef, // 7
      couponInputRef, // 8
      manualDiscountPercentRef, // 9
      manualDiscountAmountRef, // 10
      checkoutButtonRef, // 11
    ],
    [],
  );

  const handleStepNavigation = useCallback(
    (
      e: React.KeyboardEvent,
      currentIndex: number,
      onEnterAction?: () => void,
    ) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (onEnterAction) onEnterAction();

        if (e.shiftKey) {
          let prevIdx = currentIndex - 1;
          while (prevIdx >= 0) {
            const el = fieldSequence[prevIdx]?.current;
            if (el && !el.disabled) {
              el.focus();
              break;
            }
            prevIdx--;
          }
        } else {
          let nextIdx = currentIndex + 1;
          while (nextIdx < fieldSequence.length) {
            const el = fieldSequence[nextIdx]?.current;
            if (el && !el.disabled) {
              el.focus();
              break;
            }
            nextIdx++;
          }
        }
      }
    },
    [fieldSequence],
  );

  // ── Ensure Walk-In Customer ────────────────────────────────────────────────
  const ensureWalkInCustomer = useCallback(
    async (existing: POSCustomer[]): Promise<string | null> => {
      const found = existing.find((c) => /walk[\s-]?in/i.test(c.name));
      if (found) return found.id;
      if (!branchId) return null;

      try {
        const res: any = await createCustomer({
          name: "Walk-in Customer",
          branchId,
        });
        if (res?.data?.error) {
          console.error("[POS] Walk-in customer create failed", res.data.error);
          return null;
        }
        const newCust = res?.data?.data ?? res?.data;
        return newCust?.id ?? null;
      } catch (err) {
        console.error("[POS] Failed to auto-create walk-in customer", err);
        return null;
      }
    },
    [branchId],
  );

  const fetchCustomers = useCallback(async () => {
    const custRes = await getCustomerListForDropdown();
    const remoteCustomers: POSCustomer[] = (custRes ?? []).map((c: any) => ({
      id: c.id,
      name: c.name,
      phone: c.phone ?? "",
    }));

    const walkInId = await ensureWalkInCustomer(remoteCustomers);
    setWalkInCustomerId(walkInId);

    setCustomers([
      { id: WALK_IN_SENTINEL, name: "Walk-in Customer", phone: "" },
      ...remoteCustomers.filter((c) => c.id !== walkInId),
    ]);
    return remoteCustomers;
  }, [ensureWalkInCustomer]);

  const fetchSalesmen = useCallback(async () => {
    try {
      const res: any = await getUserList();
      const listData = res?.data ?? res;
      const list: any[] = Array.isArray(listData)
        ? listData
        : Array.isArray(listData?.users)
          ? listData.users
          : [];
      const scoped = branchId
        ? list.filter(
            (u) => u.branch?.id === branchId || u.branchId === branchId,
          )
        : list;
      setSalesmen(
        (scoped.length ? scoped : list).map((u: any) => ({
          id: u.id,
          name: u.name,
        })),
      );
    } catch (err) {
      console.error("[POS] Failed to load salesmen", err);
    }
  }, [branchId]);

  useEffect(() => {
    (async () => {
      try {
        const [, prodRes, brandRes] = await Promise.all([
          fetchCustomers(),
          getProductDropdown({ query: "" }),
          getBrandListForDropdown(),
          fetchSalesmen(),
        ]);
        setBrandOptions(brandRes ?? []);

        setProducts(
          (prodRes ?? []).map((p: any) => ({
            id: p.id,
            name: p.product_name ?? p.productName ?? "Unknown",
            sku: p.sku ?? "",
            price: Number(p.sellingPrice ?? p.purchasePrice ?? 0),
            purchasePrice: Number(p.purchasePrice ?? 0),
            stock: Number(p.stock ?? 0),
            category: p.category?.name ?? p.category ?? "General",
            brand: p.brand?.name ?? p.brandName ?? "",
            brandId: p.brand?.id ?? p.brandId ?? p.brand_id ?? "",
            subBrand: p.subBrand?.name ?? p.subBrandName ?? "",
            subBrandId: p.subBrand?.id ?? p.subBrandId ?? p.sub_brand_id ?? "",
          })),
        );
      } catch (err: any) {
        console.error("[POS load]", err);
        toast.error("Failed to load POS terminal data.");
      } finally {
        setLoadingData(false);
      }
    })();
  }, [fetchCustomers, fetchSalesmen]);

  // Auto-focus the barcode scanner once initial load completes
  useEffect(() => {
    if (!loadingData) focusBarcodeInput();
  }, [loadingData, focusBarcodeInput]);

  const handleAddCustomerClose = useCallback(
    async (open: boolean) => {
      setAddCustomerOpen(open);
      if (!open) {
        try {
          const prevIds = new Set(customers.map((c) => c.id));
          if (walkInCustomerId) prevIds.add(walkInCustomerId);

          const fresh = await fetchCustomers();
          const newEntry = fresh.find(
            (c) => !prevIds.has(c.id) && c.id !== walkInCustomerId,
          );
          if (newEntry) {
            setSelectedCustomer(newEntry.id);
            toast.success(`"${newEntry.name}" added and selected.`);
          }
        } catch {}
        focusBarcodeInput();
      }
    },
    [
      fetchCustomers,
      customers,
      walkInCustomerId,
      setSelectedCustomer,
      focusBarcodeInput,
    ],
  );

  // ── Checkout Action ────────────────────────────────────────────────────────
  const { execute: executeSale, isExecuting: isCheckingOut } = useAction(
    createSale,
    {
      onSuccess: ({ data }) => {
        if ((data as any)?.error) {
          toast.error((data as any).error);
          setPendingPrint(null);
          return;
        }

        const invoiceNo: string =
          (data as any)?.invoiceNo ??
          (data as any)?.data?.invoiceNo ??
          `INV-${Date.now().toString().slice(-6)}`;

        if (pendingPrint) {
          const snapshot: LastInvoiceSnapshot = {
            ...pendingPrint,
            invoiceNo,
            subtotal: pendingPrint.items.reduce(
              (s, item) => s + item.unitPrice * item.qty,
              0,
            ),
            totalDiscount:
              pendingPrint.itemDiscount +
              pendingPrint.couponDiscount +
              pendingPrint.manualDiscount,
          };
          setLastInvoice(snapshot);
          printThermalReceipt({ ...pendingPrint, invoiceNo });
          setPendingPrint(null);
        }

        handleResetCart();
        toast.success("Checkout complete!");
      },
      onError: (err) => {
        console.error("[POS checkout error]", err);
        toast.error("Checkout failed. Please try again.");
        setPendingPrint(null);
      },
    },
  );

  const handleCheckout = useCallback(
    (options?: { print?: boolean }) => {
      const shouldPrint = options?.print !== false;

      if (!cart.length) {
        toast.warning("Cart is empty.");
        return;
      }

      if (!invoiceDate) {
        toast.error("Select an invoice date.");
        return;
      }

      if (hasUnselectedSplitMethod) {
        toast.error("Select a payment method for the remaining amount.");
        return;
      }

      let customerIdForSale = selectedCustomer;
      if (selectedCustomer === WALK_IN_SENTINEL) {
        if (!walkInCustomerId) {
          toast.error(
            'No "Walk-in Customer" record found. Add one via the customer form, or pick a specific customer.',
          );
          return;
        }
        customerIdForSale = walkInCustomerId;
      }

      const selectedInvoiceDate = dateInputToLocalDate(invoiceDate);
      const customer = customers.find((c) => c.id === selectedCustomer);
      const salesmanName =
        selectedSalesman !== NO_SALESMAN_SENTINEL
          ? (salesmen.find((s) => s.id === selectedSalesman)?.name ?? "")
          : "";

      const confirmedPayments = (() => {
        const valid = payments.filter(
          (p): p is { method: "cash" | "card" | "upi"; amount: number } =>
            typeof p.amount === "number" && p.amount > 0 && p.method !== "",
        );
        return valid.length > 0
          ? valid
          : [
              {
                method: (payments[0].method || "cash") as
                  | "cash"
                  | "card"
                  | "upi",
                amount: grandTotal,
              },
            ];
      })();

      if (shouldPrint) {
        const printSnapshot: Omit<PrintReceiptParams, "invoiceNo"> = {
          date: selectedInvoiceDate,
          customerName: customer?.name ?? "",
          customerPhone: customer?.phone ?? "",
          salesmanName,
          items: cart.map((item) => ({
            name: item.product.name,
            sku: item.product.sku,
            qty: item.quantity,
            unitPrice: item.product.price,
            total: itemLineTotal(item),
          })),
          itemDiscount: itemDiscountTotal,
          couponDiscount: couponDiscountAmount,
          couponCode: appliedCoupon,
          manualDiscount: manualDiscountCalculated,
          grandTotal,
          payments: confirmedPayments,
          change: cashChange,
        };
        setPendingPrint(printSnapshot);
      } else {
        setPendingPrint(null);
      }

      executeSale({
        customerId: customerIdForSale,
        branchId,
        salesmanId:
          selectedSalesman !== NO_SALESMAN_SENTINEL ? selectedSalesman : null,
        salesdate: selectedInvoiceDate.toISOString(),
        status: "Dispatched",
        invoiceNo: "",
        grandTotal,
        dueAmount: 0,
        paidAmount: confirmedPayments.reduce((s, p) => s + p.amount, 0),
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.product.price,
          discount: itemDiscountAmount(item),
          subtotal: itemLineSubtotal(item),
          total: itemLineTotal(item),
          purchasePrice: item.product.purchasePrice,
        })),
        salesPayment: (() => {
          const validEntries = payments.filter(
            (p) =>
              typeof p.amount === "number" &&
              (p.amount as number) > 0 &&
              p.method !== "",
          );
          const entries =
            validEntries.length > 0
              ? validEntries
              : [
                  {
                    method: (payments[0].method || "cash") as
                      | "cash"
                      | "card"
                      | "upi",
                    amount: grandTotal,
                  },
                ];
          return entries.map((p) => ({
            amount: p.amount as number,
            paymentMethod: p.method,
            paidOn: selectedInvoiceDate.toISOString(),
            paymentNote: appliedCoupon ? `Coupon: ${appliedCoupon}` : null,
            dueDate: null,
          }));
        })(),
      });
    },
    [
      cart,
      invoiceDate,
      hasUnselectedSplitMethod,
      selectedCustomer,
      walkInCustomerId,
      customers,
      selectedSalesman,
      salesmen,
      payments,
      grandTotal,
      itemDiscountTotal,
      couponDiscountAmount,
      appliedCoupon,
      manualDiscountCalculated,
      cashChange,
      branchId,
      executeSale,
    ],
  );

  // ── Global Function Keys & Hotkeys ─────────────────────────────────────────
  const handleGlobalShortcuts = useCallback(
    (e: KeyboardEvent) => {
      // Escape closes modals
      if (e.key === "Escape") {
        if (helpOpen) {
          e.preventDefault();
          setHelpOpen(false);
          focusBarcodeInput();
          return;
        }
        if (lastInvoiceOpen) {
          e.preventDefault();
          setLastInvoiceOpen(false);
          focusBarcodeInput();
          return;
        }
        if (addCustomerOpen) {
          e.preventDefault();
          setAddCustomerOpen(false);
          focusBarcodeInput();
          return;
        }
      }

      // If in a modal dialog, let dialog handle its own keystrokes
      if ((e.target as HTMLElement)?.closest('[role="dialog"]')) return;

      // F1: Help overlay
      if (e.key === "F1") {
        e.preventDefault();
        setHelpOpen((prev) => !prev);
        return;
      }

      // F2: Focus Item / Barcode Cell
      if (e.key === "F2") {
        e.preventDefault();
        focusBarcodeInput();
        return;
      }

      // F3: Focus Customer select
      if (e.key === "F3") {
        e.preventDefault();
        customerSelectRef.current?.focus();
        return;
      }

      // F4: Focus Discount input
      if (e.key === "F4") {
        e.preventDefault();
        manualDiscountPercentRef.current?.focus();
        return;
      }

      // F5: Hold Bill
      if (e.key === "F5") {
        e.preventDefault();
        holdBill();
        return;
      }

      // F6: Recall Held Bill
      if (e.key === "F6") {
        e.preventDefault();
        if (heldBills.length > 0) {
          handleRestoreBill(heldBills[heldBills.length - 1].id);
        } else {
          toast.info("No held bills to restore.");
        }
        return;
      }

      // F7: Sales Return
      if (e.key === "F7") {
        e.preventDefault();
        router.push("/sales-return");
        return;
      }

      // F8: Toggle Split Payment
      if (e.key === "F8") {
        e.preventDefault();
        toggleSplitMode();
        return;
      }

      // F9: Checkout & Print
      if (e.key === "F9") {
        e.preventDefault();
        handleCheckout({ print: true });
        return;
      }

      // F10: Checkout without Print
      if (e.key === "F10") {
        e.preventDefault();
        handleCheckout({ print: false });
        return;
      }

      // Ctrl + Enter: Jump to Checkout / Payment
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        checkoutButtonRef.current?.focus();
        return;
      }

      // Ctrl + N: New Bill
      if (e.ctrlKey && (e.key === "n" || e.key === "N")) {
        e.preventDefault();
        handleResetCart();
        toast.info("Started new bill.");
        return;
      }
    },
    [
      helpOpen,
      lastInvoiceOpen,
      addCustomerOpen,
      focusBarcodeInput,
      holdBill,
      heldBills,
      handleRestoreBill,
      router,
      toggleSplitMode,
      handleCheckout,
      handleResetCart,
    ],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleGlobalShortcuts);
    return () => window.removeEventListener("keydown", handleGlobalShortcuts);
  }, [handleGlobalShortcuts]);

  const handleShortcutClick = useCallback(
    (key: string) => {
      switch (key) {
        case "F1":
          setHelpOpen(true);
          break;
        case "F2":
          focusBarcodeInput();
          break;
        case "F3":
          customerSelectRef.current?.focus();
          break;
        case "F4":
          manualDiscountPercentRef.current?.focus();
          break;
        case "F5":
          holdBill();
          break;
        case "F6":
          if (heldBills.length > 0) {
            handleRestoreBill(heldBills[heldBills.length - 1].id);
          } else {
            toast.info("No held bills to restore.");
          }
          break;
        case "F7":
          router.push("/sales-return");
          break;
        case "F8":
          toggleSplitMode();
          break;
        case "F9":
          handleCheckout({ print: true });
          break;
        case "F10":
          handleCheckout({ print: false });
          break;
        case "Ctrl+N":
          handleResetCart();
          break;
        case "Esc":
          setHelpOpen(false);
          setLastInvoiceOpen(false);
          focusBarcodeInput();
          break;
      }
    },
    [
      focusBarcodeInput,
      holdBill,
      heldBills,
      handleRestoreBill,
      router,
      toggleSplitMode,
      handleCheckout,
      handleResetCart,
    ],
  );

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading POS terminal…
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5 pb-8">
      <CustomerFormDialog
        open={addCustomerOpen}
        openChange={handleAddCustomerClose}
        branches={branchId ? [{ id: branchId, name: branchName }] : []}
      />

      <LastInvoiceDialog
        open={lastInvoiceOpen}
        onClose={() => {
          setLastInvoiceOpen(false);
          focusBarcodeInput();
        }}
        lastInvoice={lastInvoice}
      />

      <PosShortcutsHelpDialog
        open={helpOpen}
        onClose={() => {
          setHelpOpen(false);
          focusBarcodeInput();
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight">
            <ShoppingBag className="h-8 w-8 text-purple-600" /> POS Billing
            Terminal
          </h1>
          <p className="text-sm text-muted-foreground">
            Keyboard-first Excel & Zoho style high-speed billing
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setHelpOpen(true)}
          className="gap-1.5 border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-300"
        >
          <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-bold">
            F1
          </kbd>
          Shortcuts Help
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Search, product filters bar and Catalog */}
        <BarcodeSearchCatalog
          products={products}
          brandOptions={brandOptions}
          branchName={branchName}
          invoiceDate={invoiceDate}
          setInvoiceDate={setInvoiceDate}
          onAddToCart={handleAddToCart}
          barcodeInputRef={barcodeInputRef}
          searchInputRef={searchInputRef}
          categorySelectRef={categorySelectRef}
          brandSelectRef={brandSelectRef}
          subBrandSelectRef={subBrandSelectRef}
          invoiceDateRef={invoiceDateRef}
          checkoutButtonRef={checkoutButtonRef}
          handleStepNavigation={handleStepNavigation}
        />

        {/* ── Right – Cart & Checkout ─────────────────────────────────────── */}
        <div className="order-2 flex min-h-0 flex-col gap-3 xl:col-span-7">
          <Card className="flex h-[calc(100vh-225px)] min-h-[680px] max-h-[860px] flex-col overflow-hidden border-border bg-card shadow-md">
            {/* Cart Header */}
            <CardHeader className="px-4 py-2.5 border-b border-border shrink-0">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="text-base font-bold">
                    Active Cart ({cart.reduce((s, i) => s + i.quantity, 0)})
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Manage quantities and finalise
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {lastInvoice && (
                    <button
                      type="button"
                      onClick={() => setLastInvoiceOpen(true)}
                      className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-[11px] font-semibold text-purple-700 transition-colors hover:bg-purple-100 dark:border-purple-900/40 dark:bg-purple-950/20 dark:text-purple-300"
                      title="View last checked out invoice"
                    >
                      Last Invoice:{" "}
                      <span className="font-extrabold">
                        {lastInvoice.invoiceNo}
                      </span>
                    </button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-red-500"
                    onClick={() => setCart([])}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Customer + add customer + salesman selectors */}
              <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center">
                <Select
                  value={selectedCustomer}
                  onValueChange={setSelectedCustomer}
                >
                  <SelectTrigger
                    ref={customerSelectRef}
                    onKeyDown={(e) => handleStepNavigation(e, 5)}
                    className="h-8 w-full min-w-0 border-border bg-muted/30 text-xs"
                  >
                    <SelectValue placeholder="Select customer (F3)" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                        {c.phone ? ` • ${c.phone}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 shrink-0 justify-self-start md:justify-self-center"
                  title="Add new customer"
                  onClick={() => setAddCustomerOpen(true)}
                >
                  <UserPlus className="h-3.5 w-3.5 text-purple-600" />
                </Button>

                <Select
                  value={selectedSalesman}
                  onValueChange={setSelectedSalesman}
                >
                  <SelectTrigger
                    ref={salesmanSelectRef}
                    onKeyDown={(e) => handleStepNavigation(e, 6)}
                    className="h-8 w-full min-w-0 border-border bg-muted/30 text-xs gap-1.5"
                  >
                    <UserCog className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="Select salesman" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_SALESMAN_SENTINEL}>
                      No Salesman
                    </SelectItem>
                    {salesmen.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCustomer === WALK_IN_SENTINEL &&
                !walkInCustomerId &&
                cart.length > 0 && (
                  <p className="text-xs text-red-600 mt-1 bg-red-50 dark:bg-red-950/20 rounded px-2 py-1">
                    Couldn't set up a walk-in customer for this branch. Try
                    refreshing, or pick a specific customer.
                  </p>
                )}
            </CardHeader>

            {/* Active Cart Items Table */}
            <CartGrid
              cart={cart}
              allProducts={products}
              addToCart={handleAddToCart}
              setExactQuantity={setExactQuantity}
              updateQuantity={updateQuantity}
              updateItemPrice={updateItemPrice}
              updateItemDiscount={updateItemDiscount}
              updateItemDiscountAmount={updateItemDiscountAmount}
              removeFromCart={removeFromCart}
              onFocusNextField={() => couponInputRef.current?.focus()}
            />

            {/* Totals + Payment + Checkout */}
            <div className="shrink-0 border-t border-border bg-muted/20 p-3 space-y-1.5 rounded-b-xl">
              <BillSummary
                couponCode={couponCode}
                setCouponCode={setCouponCode}
                couponDiscountPercent={couponDiscountPercent}
                appliedCoupon={appliedCoupon}
                applyCoupon={applyCoupon}
                removeCoupon={removeCoupon}
                manualDiscountPercent={manualDiscountPercent}
                setManualDiscountPercent={setManualDiscountPercent}
                manualDiscountAmount={manualDiscountAmount}
                setManualDiscountAmount={setManualDiscountAmount}
                clearManualDiscount={clearManualDiscount}
                subtotal={subtotal}
                itemDiscountTotal={itemDiscountTotal}
                couponDiscountAmount={couponDiscountAmount}
                manualPct={manualPct}
                manualAmt={manualAmt}
                manualDiscountCalculated={manualDiscountCalculated}
                totalDiscountAmount={totalDiscountAmount}
                grandTotal={grandTotal}
                couponInputRef={couponInputRef}
                manualDiscountPercentRef={manualDiscountPercentRef}
                manualDiscountAmountRef={manualDiscountAmountRef}
                handleStepNavigation={handleStepNavigation}
              />

              <PaymentPanel
                splitMode={splitMode}
                toggleSplitMode={toggleSplitMode}
                payments={payments}
                setSinglePaymentMethod={setSinglePaymentMethod}
                updateSplitMethod={updateSplitMethod}
                updateSplitAmount={updateSplitAmount}
                totalPaid={totalPaid}
                grandTotal={grandTotal}
                paymentShortfall={paymentShortfall}
                cashChange={cashChange}
                hasUnselectedSplitMethod={hasUnselectedSplitMethod}
                isCheckingOut={isCheckingOut}
                cartLength={cart.length}
                selectedCustomer={selectedCustomer}
                walkInCustomerId={walkInCustomerId}
                onHold={holdBill}
                onCheckout={() => handleCheckout({ print: true })}
                onResetCart={handleResetCart}
                checkoutButtonRef={checkoutButtonRef}
                handleStepNavigation={handleStepNavigation}
              />
            </div>
          </Card>

          {/* Held Bills Card */}
          <HeldBillsCard heldBills={heldBills} restoreBill={handleRestoreBill} />
        </div>
      </div>

      {/* Sticky Bottom Hotkeys Legend Bar */}
      <PosLegendBar onShortcutClick={handleShortcutClick} />
    </div>
  );
}