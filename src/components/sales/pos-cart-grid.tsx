// src/components/sales/pos-cart-grid.tsx
"use client";

import React, {
  memo,
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  Plus,
  Minus,
  IndianRupee,
  Trash2,
  ShoppingBag,
  Search,
  Check,
} from "lucide-react";
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
  CartItem,
  POSProduct,
  itemLineSubtotal,
  itemLineTotal,
  USE_KEYBOARD_GRID,
} from "./pos-types";

interface CartGridProps {
  cart: CartItem[];
  allProducts?: POSProduct[];
  addToCart?: (product: POSProduct, onAdded?: () => void) => void;
  setExactQuantity: (productId: string, qty: number) => void;
  updateQuantity: (productId: string, delta: number) => void;
  updateItemPrice: (productId: string, price: number) => void;
  updateItemDiscount: (productId: string, raw: string) => void;
  updateItemDiscountAmount: (productId: string, raw: string) => void;
  removeFromCart: (productId: string) => void;
  onFocusNextField?: () => void;
}

type EditableColumn = "qty" | "rate" | "discPercent";

export const CartGrid = memo(function CartGrid({
  cart,
  allProducts = [],
  addToCart,
  setExactQuantity,
  updateQuantity,
  updateItemPrice,
  updateItemDiscount,
  updateItemDiscountAmount,
  removeFromCart,
  onFocusNextField,
}: CartGridProps) {
  // ── Keyboard Grid State ───────────────────────────────────────────────────
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(() =>
    cart.length > 0 ? 0 : -1,
  );
  const [selectedCol, setSelectedCol] = useState<EditableColumn>("qty");

  // In-place editing values per row
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  // Bottom "New Item" row state
  const [newRowQuery, setNewRowQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);

  // Refs for grid cells
  const newRowInputRef = useRef<HTMLInputElement>(null);
  const cellInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Filter products for bottom row instant search
  const suggestions = useMemo(() => {
    const q = newRowQuery.trim().toLowerCase();
    if (!q) return [];
    return allProducts
      .filter(
        (p) =>
          p.sku.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [allProducts, newRowQuery]);

  // Adjust selected row index if cart changes
  useEffect(() => {
    if (cart.length === 0) {
      setSelectedRowIndex(-1);
    } else if (selectedRowIndex >= cart.length) {
      setSelectedRowIndex(cart.length - 1);
    }
  }, [cart.length, selectedRowIndex]);

  // Focus bottom new row by default if empty or requested
  const focusNewItemRow = useCallback(() => {
    setSelectedRowIndex(-1);
    setTimeout(() => {
      newRowInputRef.current?.focus();
      newRowInputRef.current?.select();
    }, 0);
  }, []);

  // Helper to focus a specific cell input
  const focusCell = useCallback(
    (rowIdx: number, col: EditableColumn) => {
      if (rowIdx < 0 || rowIdx >= cart.length) {
        focusNewItemRow();
        return;
      }
      setSelectedRowIndex(rowIdx);
      setSelectedCol(col);
      setEditingRow(rowIdx);

      const item = cart[rowIdx];
      if (item) {
        if (col === "qty") setEditValue(String(item.quantity));
        else if (col === "rate") setEditValue(String(item.product.price));
        else if (col === "discPercent")
          setEditValue(item.discountPercent ? String(item.discountPercent) : "");
      }

      setTimeout(() => {
        const key = `${rowIdx}-${col}`;
        const el = cellInputRefs.current[key];
        if (el) {
          el.focus();
          el.select();
        }
      }, 0);
    },
    [cart, focusNewItemRow],
  );

  // Commit the current in-place edit
  const commitEdit = useCallback(
    (rowIdx: number, col: EditableColumn, value: string) => {
      const item = cart[rowIdx];
      if (!item) return;

      if (col === "qty") {
        const num = Number(value);
        if (num > 0) {
          setExactQuantity(item.product.id, num);
        }
      } else if (col === "rate") {
        const num = Number(value);
        if (num >= 0) {
          updateItemPrice(item.product.id, num);
        }
      } else if (col === "discPercent") {
        updateItemDiscount(item.product.id, value);
      }
      setEditingRow(null);
    },
    [cart, setExactQuantity, updateItemPrice, updateItemDiscount],
  );

  // Handle adding an item from the bottom new-item row
  const handleAddNewItem = useCallback(
    (product: POSProduct) => {
      if (!addToCart) return;

      const existingIndex = cart.findIndex((i) => i.product.id === product.id);
      addToCart(product);
      setNewRowQuery("");
      setShowSuggestions(false);
      setSuggestionIndex(0);

      // Focus the newly added item's Qty cell
      const targetIndex =
        existingIndex >= 0 ? existingIndex : cart.length;
      setTimeout(() => {
        focusCell(targetIndex, "qty");
      }, 50);
    },
    [addToCart, cart, focusCell],
  );

  // Handle KeyDown inside the Bottom "New Item" Input
  const handleNewRowKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      if (suggestions.length > 0 && showSuggestions) {
        e.preventDefault();
        setSuggestionIndex((prev) => (prev + 1) % suggestions.length);
      }
    } else if (e.key === "ArrowUp") {
      if (suggestions.length > 0 && showSuggestions) {
        e.preventDefault();
        setSuggestionIndex((prev) =>
          prev === 0 ? suggestions.length - 1 : prev - 1,
        );
      } else if (cart.length > 0) {
        // Move focus up to last cart row
        e.preventDefault();
        focusCell(cart.length - 1, "qty");
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0 && showSuggestions) {
        const chosen = suggestions[suggestionIndex] || suggestions[0];
        if (chosen) handleAddNewItem(chosen);
      } else {
        const q = newRowQuery.trim().toLowerCase();
        if (q) {
          const exact =
            allProducts.find((p) => p.sku.toLowerCase() === q) ||
            allProducts.find(
              (p) =>
                p.sku.toLowerCase().includes(q) ||
                p.name.toLowerCase().includes(q),
            );
          if (exact) {
            handleAddNewItem(exact);
          }
        } else if (onFocusNextField) {
          // If hit Enter on empty row, proceed to bill summary / payment
          onFocusNextField();
        }
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setNewRowQuery("");
    }
  };

  // Handle KeyDown inside an Active Cell Input
  const handleCellKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIdx: number,
    col: EditableColumn,
  ) => {
    const item = cart[rowIdx];
    if (!item) return;

    // Delete / Ctrl+D row deletion
    if (e.key === "Delete" || (e.ctrlKey && e.key.toLowerCase() === "d")) {
      e.preventDefault();
      removeFromCart(item.product.id);
      if (rowIdx < cart.length - 1) {
        focusCell(rowIdx, col);
      } else if (cart.length > 1) {
        focusCell(rowIdx - 1, col);
      } else {
        focusNewItemRow();
      }
      return;
    }

    // Escape cancels edit
    if (e.key === "Escape") {
      e.preventDefault();
      setEditingRow(null);
      return;
    }

    // Enter commits and advances
    if (e.key === "Enter") {
      e.preventDefault();
      commitEdit(rowIdx, col, e.currentTarget.value);

      if (e.shiftKey) {
        // Shift+Enter goes backward
        if (col === "discPercent") focusCell(rowIdx, "rate");
        else if (col === "rate") focusCell(rowIdx, "qty");
        else if (rowIdx > 0) focusCell(rowIdx - 1, "discPercent");
        else focusNewItemRow();
      } else {
        // Enter advances: Qty -> Rate -> Disc% -> Next Row / New Item row
        if (col === "qty") focusCell(rowIdx, "rate");
        else if (col === "rate") focusCell(rowIdx, "discPercent");
        else if (rowIdx < cart.length - 1) focusCell(rowIdx + 1, "qty");
        else focusNewItemRow();
      }
      return;
    }

    // Arrow Left / Right navigation
    if (e.key === "ArrowRight") {
      const cursorAtEnd =
        e.currentTarget.selectionStart === e.currentTarget.value.length;
      if (cursorAtEnd || e.altKey) {
        e.preventDefault();
        commitEdit(rowIdx, col, e.currentTarget.value);
        if (col === "qty") focusCell(rowIdx, "rate");
        else if (col === "rate") focusCell(rowIdx, "discPercent");
      }
    } else if (e.key === "ArrowLeft") {
      const cursorAtStart = e.currentTarget.selectionStart === 0;
      if (cursorAtStart || e.altKey) {
        e.preventDefault();
        commitEdit(rowIdx, col, e.currentTarget.value);
        if (col === "discPercent") focusCell(rowIdx, "rate");
        else if (col === "rate") focusCell(rowIdx, "qty");
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      commitEdit(rowIdx, col, e.currentTarget.value);
      if (rowIdx < cart.length - 1) focusCell(rowIdx + 1, col);
      else focusNewItemRow();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      commitEdit(rowIdx, col, e.currentTarget.value);
      if (rowIdx > 0) focusCell(rowIdx - 1, col);
    } else if (e.key === "Tab") {
      e.preventDefault();
      commitEdit(rowIdx, col, e.currentTarget.value);
      if (e.shiftKey) {
        if (col === "discPercent") focusCell(rowIdx, "rate");
        else if (col === "rate") focusCell(rowIdx, "qty");
        else if (rowIdx > 0) focusCell(rowIdx - 1, "discPercent");
      } else {
        if (col === "qty") focusCell(rowIdx, "rate");
        else if (col === "rate") focusCell(rowIdx, "discPercent");
        else if (rowIdx < cart.length - 1) focusCell(rowIdx + 1, "qty");
        else focusNewItemRow();
      }
    }
  };

  // ── 1. Legacy View (Rollback fallback when USE_KEYBOARD_GRID is false) ─────
  if (!USE_KEYBOARD_GRID) {
    return (
      <CardContent className="min-h-0 flex-1 overflow-auto p-0 no-scrollbar">
        {cart.length === 0 ? (
          <div className="flex h-full min-h-[260px] flex-col items-center justify-center text-center text-muted-foreground">
            <ShoppingBag className="mb-2 h-12 w-12 stroke-[1.5] text-muted-foreground/30" />
            <p className="text-sm font-semibold">POS Cart is Empty</p>
            <p className="text-xs opacity-70">
              Scan barcode or click products to add items
            </p>
          </div>
        ) : (
          <div className="min-w-[650px]">
            {/* Table header */}
            <div className="sticky top-0 z-10 grid grid-cols-[minmax(210px,1.8fr)_112px_90px_96px_100px_32px] items-center gap-2 border-b border-border bg-muted/35 px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              <span>Product</span>
              <span className="text-center">Qty</span>
              <span className="text-right">Price</span>
              <span className="text-center">Discount</span>
              <span className="text-right">Total</span>
              <span aria-hidden="true" />
            </div>

            {/* Table rows */}
            <div className="divide-y divide-border/70">
              {cart.map((item, index) => {
                const initials = item.product.name
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((word) => word.charAt(0))
                  .join("")
                  .toUpperCase();

                return (
                  <div
                    key={item.product.id}
                    className="grid grid-cols-[minmax(210px,1.8fr)_112px_90px_96px_100px_32px] items-center gap-2 px-4 py-2.5 transition-colors hover:bg-muted/20"
                  >
                    {/* Product */}
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                          index % 4 === 0
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                            : index % 4 === 1
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                              : index % 4 === 2
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                        }`}
                      >
                        {initials || "P"}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-foreground">
                          {item.product.name}
                        </p>
                        <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                          SKU: {item.product.sku || "—"}
                        </p>
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className="flex items-center justify-center">
                      <div className="flex h-7 items-center overflow-hidden rounded-md border border-border bg-background shadow-sm">
                        <button
                          type="button"
                          className="flex h-full w-7 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          onClick={() => updateQuantity(item.product.id, -1)}
                          aria-label={`Decrease ${item.product.name} quantity`}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="flex h-full min-w-8 items-center justify-center border-x border-border px-1 text-[11px] font-bold text-foreground">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          className="flex h-full w-7 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          onClick={() => updateQuantity(item.product.id, 1)}
                          aria-label={`Increase ${item.product.name} quantity`}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Unit price */}
                    <div className="text-right text-[11px] font-semibold text-foreground">
                      {formatCurrency(item.product.price)}
                    </div>

                    {/* Discount */}
                    <div className="flex flex-col gap-1.5 items-center justify-center">
                      <div className="flex h-7 w-[76px] overflow-hidden rounded-md border border-border bg-background shadow-sm focus-within:ring-1 focus-within:ring-purple-500">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step="0.01"
                          value={item.discountPercent || ""}
                          placeholder="0"
                          onChange={(event) =>
                            updateItemDiscount(
                              item.product.id,
                              event.target.value,
                            )
                          }
                          className="h-full min-w-0 flex-1 bg-transparent px-2 text-center text-[11px] font-medium outline-none"
                          aria-label={`${item.product.name} discount percentage`}
                        />
                        <span className="flex h-full w-7 shrink-0 items-center justify-center border-l border-border bg-muted/50 text-[10px] font-semibold text-muted-foreground">
                          %
                        </span>
                      </div>
                      <div className="flex h-7 w-[76px] overflow-hidden rounded-md border border-border bg-background shadow-sm focus-within:ring-1 focus-within:ring-purple-500">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.discountAmount || ""}
                          placeholder="0"
                          onChange={(event) =>
                            updateItemDiscountAmount(
                              item.product.id,
                              event.target.value,
                            )
                          }
                          className="h-full min-w-0 flex-1 bg-transparent px-2 text-center text-[11px] font-medium outline-none"
                          aria-label={`${item.product.name} discount amount`}
                        />
                        <span className="flex h-full w-7 shrink-0 items-center justify-center border-l border-border bg-muted/50 text-[10px] font-semibold text-muted-foreground">
                          <IndianRupee className="h-3 w-3" />
                        </span>
                      </div>
                    </div>

                    {/* Line total */}
                    <div className="min-w-0 text-right">
                      {(item.discountPercent > 0 ||
                        item.discountAmount > 0) && (
                        <p className="text-[9px] leading-none text-muted-foreground line-through">
                          {formatCurrency(itemLineSubtotal(item))}
                        </p>
                      )}
                      <p className="text-[11px] font-extrabold text-foreground">
                        {formatCurrency(itemLineTotal(item))}
                      </p>
                    </div>

                    {/* Remove */}
                    <button
                      type="button"
                      className="flex h-7 w-7 items-center justify-center rounded-md text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20"
                      onClick={() => removeFromCart(item.product.id)}
                      aria-label={`Remove ${item.product.name} from cart`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    );
  }

  // ── 2. Keyboard-First Excel/Zoho Grid View ────────────────────────────────
  return (
    <CardContent className="min-h-0 flex-1 overflow-auto p-0 no-scrollbar select-none">
      <div className="min-w-[660px] flex flex-col h-full">
        {/* Excel Header */}
        <div className="sticky top-0 z-20 grid grid-cols-[36px_90px_minmax(180px,1.6fr)_68px_82px_76px_90px_32px] items-center border-b border-border bg-muted/50 px-2 py-2 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
          <span className="text-center">#</span>
          <span className="pl-1">Barcode</span>
          <span>Item Description</span>
          <span className="text-center">Qty</span>
          <span className="text-right pr-2">Rate (₹)</span>
          <span className="text-center">Disc %</span>
          <span className="text-right pr-1">Amount</span>
          <span className="text-center" aria-hidden="true" />
        </div>

        {/* Existing Cart Rows */}
        <div className="divide-y divide-border/60">
          {cart.map((item, rowIdx) => {
            const isSelectedRow = selectedRowIndex === rowIdx;
            const lineSub = itemLineSubtotal(item);
            const lineTot = itemLineTotal(item);

            return (
              <div
                key={item.product.id}
                onClick={() => focusCell(rowIdx, "qty")}
                className={`grid grid-cols-[36px_90px_minmax(180px,1.6fr)_68px_82px_76px_90px_32px] items-center px-2 py-1.5 transition-colors ${
                  isSelectedRow
                    ? "bg-purple-50/60 dark:bg-purple-950/30 border-l-4 border-l-purple-600"
                    : "hover:bg-muted/30 border-l-4 border-l-transparent"
                }`}
              >
                {/* 1. Row Number */}
                <span className="text-center text-xs font-semibold text-muted-foreground">
                  {rowIdx + 1}
                </span>

                {/* 2. Barcode / SKU */}
                <span className="truncate font-mono text-[11px] text-muted-foreground pl-1">
                  {item.product.sku || "—"}
                </span>

                {/* 3. Item Name & Stock */}
                <div className="min-w-0 pr-2">
                  <p className="truncate text-xs font-semibold text-foreground">
                    {item.product.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    Stock: {item.product.stock}
                  </p>
                </div>

                {/* 4. Qty Cell (In-Place Edit) */}
                <div className="px-0.5">
                  <input
                    ref={(el) => {
                      cellInputRefs.current[`${rowIdx}-qty`] = el;
                    }}
                    type="number"
                    min={1}
                    value={
                      editingRow === rowIdx && selectedCol === "qty"
                        ? editValue
                        : item.quantity
                    }
                    onFocus={() => {
                      setSelectedRowIndex(rowIdx);
                      setSelectedCol("qty");
                      setEditingRow(rowIdx);
                      setEditValue(String(item.quantity));
                    }}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={(e) => commitEdit(rowIdx, "qty", e.target.value)}
                    onKeyDown={(e) => handleCellKeyDown(e, rowIdx, "qty")}
                    className={`h-7 w-full rounded border text-center text-xs font-bold outline-none transition-all ${
                      isSelectedRow && selectedCol === "qty"
                        ? "border-purple-600 ring-2 ring-purple-600 bg-background text-purple-700 dark:text-purple-300"
                        : "border-border/80 bg-background/50 hover:border-border"
                    }`}
                  />
                </div>

                {/* 5. Rate Cell (In-Place Edit) */}
                <div className="px-0.5">
                  <input
                    ref={(el) => {
                      cellInputRefs.current[`${rowIdx}-rate`] = el;
                    }}
                    type="number"
                    min={0}
                    step="0.01"
                    value={
                      editingRow === rowIdx && selectedCol === "rate"
                        ? editValue
                        : item.product.price
                    }
                    onFocus={() => {
                      setSelectedRowIndex(rowIdx);
                      setSelectedCol("rate");
                      setEditingRow(rowIdx);
                      setEditValue(String(item.product.price));
                    }}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={(e) => commitEdit(rowIdx, "rate", e.target.value)}
                    onKeyDown={(e) => handleCellKeyDown(e, rowIdx, "rate")}
                    className={`h-7 w-full rounded border text-right pr-2 text-xs font-semibold outline-none transition-all ${
                      isSelectedRow && selectedCol === "rate"
                        ? "border-purple-600 ring-2 ring-purple-600 bg-background text-purple-700 dark:text-purple-300"
                        : "border-border/80 bg-background/50 hover:border-border"
                    }`}
                  />
                </div>

                {/* 6. Disc % Cell (In-Place Edit) */}
                <div className="px-0.5">
                  <input
                    ref={(el) => {
                      cellInputRefs.current[`${rowIdx}-discPercent`] = el;
                    }}
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    placeholder="0"
                    value={
                      editingRow === rowIdx && selectedCol === "discPercent"
                        ? editValue
                        : item.discountPercent || ""
                    }
                    onFocus={() => {
                      setSelectedRowIndex(rowIdx);
                      setSelectedCol("discPercent");
                      setEditingRow(rowIdx);
                      setEditValue(
                        item.discountPercent
                          ? String(item.discountPercent)
                          : "",
                      );
                    }}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={(e) =>
                      commitEdit(rowIdx, "discPercent", e.target.value)
                    }
                    onKeyDown={(e) =>
                      handleCellKeyDown(e, rowIdx, "discPercent")
                    }
                    className={`h-7 w-full rounded border text-center text-xs font-medium outline-none transition-all ${
                      isSelectedRow && selectedCol === "discPercent"
                        ? "border-purple-600 ring-2 ring-purple-600 bg-background text-purple-700 dark:text-purple-300"
                        : "border-border/80 bg-background/50 hover:border-border"
                    }`}
                  />
                </div>

                {/* 7. Line Amount (Formatted Total) */}
                <div className="text-right pr-1 font-mono text-xs font-extrabold text-foreground">
                  {formatCurrency(lineTot)}
                </div>

                {/* 8. Delete Button */}
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromCart(item.product.id);
                  }}
                  className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                  title="Delete row (or press Delete key)"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* ── Always-Ready Bottom "New Item" Row ── */}
        <div className="relative border-t-2 border-dashed border-purple-300 dark:border-purple-800 bg-purple-50/20 dark:bg-purple-950/10">
          <div className="grid grid-cols-[36px_minmax(270px,2.2fr)_68px_82px_76px_90px_32px] items-center px-2 py-2">
            <span className="text-center text-xs font-bold text-purple-600 dark:text-purple-400">
              {cart.length + 1}
            </span>

            <div className="relative flex items-center pr-2">
              <Search className="absolute left-2.5 h-3.5 w-3.5 text-purple-500 pointer-events-none" />
              <input
                ref={newRowInputRef}
                type="text"
                placeholder="Scan barcode or type item name / SKU + Enter…"
                value={newRowQuery}
                onChange={(e) => {
                  setNewRowQuery(e.target.value);
                  setShowSuggestions(true);
                  setSuggestionIndex(0);
                }}
                onFocus={() => {
                  setSelectedRowIndex(-1);
                  if (newRowQuery.trim()) setShowSuggestions(true);
                }}
                onKeyDown={handleNewRowKeyDown}
                className="h-8 w-full rounded-md border border-purple-300 dark:border-purple-700 bg-background pl-8 pr-2 text-xs font-medium placeholder:text-muted-foreground/70 outline-none ring-offset-background focus:ring-2 focus:ring-purple-600"
              />
            </div>

            {/* Empty placeholders for Qty, Rate, Disc, Amount in new row */}
            <div className="text-center text-[10px] text-muted-foreground/60">
              —
            </div>
            <div className="text-right pr-2 text-[10px] text-muted-foreground/60">
              —
            </div>
            <div className="text-center text-[10px] text-muted-foreground/60">
              —
            </div>
            <div className="text-right pr-1 text-[10px] text-muted-foreground/60">
              —
            </div>
            <div aria-hidden="true" />
          </div>

          {/* Instant Search Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-10 right-10 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-lg border border-border bg-popover shadow-xl">
              <div className="p-1">
                {suggestions.map((p, idx) => {
                  const isHighlighted = idx === suggestionIndex;
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleAddNewItem(p)}
                      onMouseEnter={() => setSuggestionIndex(idx)}
                      className={`flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-xs transition-colors ${
                        isHighlighted
                          ? "bg-purple-600 text-white font-semibold"
                          : "hover:bg-muted text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-[11px] opacity-80">
                          {p.sku}
                        </span>
                        <span className="truncate">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-bold">
                          {formatCurrency(p.price)}
                        </span>
                        <Badge
                          variant="secondary"
                          className={`text-[9px] px-1.5 py-0 ${
                            isHighlighted
                              ? "bg-purple-700 text-white border-none"
                              : ""
                          }`}
                        >
                          Stock: {p.stock}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </CardContent>
  );
});
