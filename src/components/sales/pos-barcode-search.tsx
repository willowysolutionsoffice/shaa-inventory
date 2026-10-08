// src/components/sales/pos-barcode-search.tsx
"use client";

import React, { memo, useState, useMemo, useEffect } from "react";
import { Search, CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { getSubBrandsByBrand } from "@/actions/brand-actions";
import {
  POSProduct,
  getLocalDateInputValue,
} from "./pos-types";

interface BarcodeSearchCatalogProps {
  products: POSProduct[];
  brandOptions: { id: string; name: string }[];
  branchName: string;
  invoiceDate: string;
  setInvoiceDate: (v: string) => void;
  onAddToCart: (product: POSProduct) => void;
  barcodeInputRef: React.RefObject<HTMLInputElement | null>;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  categorySelectRef: React.RefObject<HTMLButtonElement | null>;
  brandSelectRef: React.RefObject<HTMLButtonElement | null>;
  subBrandSelectRef: React.RefObject<HTMLButtonElement | null>;
  invoiceDateRef: React.RefObject<HTMLInputElement | null>;
  checkoutButtonRef?: React.RefObject<HTMLButtonElement | null>;
  handleStepNavigation: (
    e: React.KeyboardEvent,
    index: number,
    onEnterAction?: () => void,
  ) => void;
}

export const BarcodeSearchCatalog = memo(function BarcodeSearchCatalog({
  products,
  brandOptions,
  branchName,
  invoiceDate,
  setInvoiceDate,
  onAddToCart,
  barcodeInputRef,
  searchInputRef,
  categorySelectRef,
  brandSelectRef,
  subBrandSelectRef,
  invoiceDateRef,
  checkoutButtonRef,
  handleStepNavigation,
}: BarcodeSearchCatalogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [selectedSubBrand, setSelectedSubBrand] = useState("All");
  const [subBrandOptions, setSubBrandOptions] = useState<
    { id: string; name: string }[]
  >([]);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [barcodeNotFound, setBarcodeNotFound] = useState(false);
  const [selectedProductIndex, setSelectedProductIndex] = useState<number>(-1);

  useEffect(() => {
    if (selectedBrand === "All") {
      setSubBrandOptions([]);
      setSelectedSubBrand("All");
      return;
    }
    getSubBrandsByBrand(selectedBrand)
      .then((res) => setSubBrandOptions(res ?? []))
      .catch(() => setSubBrandOptions([]));
    setSelectedSubBrand("All");
  }, [selectedBrand]);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(products.map((p) => p.category)))],
    [products],
  );

  const filteredProducts = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return products.filter((p) => {
      if (p.stock <= 0) return false;
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q);
      const matchesCategory =
        selectedCategory === "All" || p.category === selectedCategory;
      const matchesBrand =
        selectedBrand === "All" || p.brandId === selectedBrand;
      const matchesSubBrand =
        selectedSubBrand === "All" || p.subBrandId === selectedSubBrand;
      return (
        matchesSearch && matchesCategory && matchesBrand && matchesSubBrand
      );
    });
  }, [products, searchTerm, selectedCategory, selectedBrand, selectedSubBrand]);

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isShift = (e.nativeEvent as KeyboardEvent)?.shiftKey;
    const q = barcodeInput.trim().toLowerCase();

    if (!q) {
      if (isShift) {
        checkoutButtonRef?.current?.focus();
      } else {
        searchInputRef?.current?.focus();
      }
      return;
    }

    const found =
      products.find((p) => p.sku.toLowerCase() === q) ??
      products.find(
        (p) =>
          p.sku.toLowerCase().includes(q) || p.name.toLowerCase().includes(q),
      );

    if (found) {
      onAddToCart(found);
      setBarcodeInput("");
      setBarcodeNotFound(false);
    } else {
      setBarcodeNotFound(true);
      toast.error(`No product found for "${barcodeInput.trim()}"`);
    }

    setTimeout(() => barcodeInputRef.current?.focus(), 0);
  };

  // Keyboard navigation for product grid
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('[role="dialog"]')) return;

      if (selectedProductIndex >= 0 && filteredProducts.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedProductIndex((prev) =>
            Math.min(filteredProducts.length - 1, prev + 2),
          );
          return;
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedProductIndex((prev) => Math.max(0, prev - 2));
          return;
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          setSelectedProductIndex((prev) =>
            Math.min(filteredProducts.length - 1, prev + 1),
          );
          return;
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          setSelectedProductIndex((prev) => Math.max(0, prev - 1));
          return;
        } else if (e.key === "Enter") {
          e.preventDefault();
          const targetProd = filteredProducts[selectedProductIndex];
          if (targetProd) onAddToCart(targetProd);
          setSelectedProductIndex(-1);
          return;
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [selectedProductIndex, filteredProducts, onAddToCart]);

  return (
    <>
      {/* Search, product filters and invoice date */}
      <div className="grid grid-cols-1 items-end gap-3 rounded-xl border border-border bg-card p-3 shadow-sm sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[minmax(240px,1.45fr)_minmax(130px,0.65fr)_minmax(170px,0.85fr)_minmax(170px,0.85fr)_minmax(170px,0.85fr)_auto]">
        <div className="relative min-w-0">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Search by SKU or name…"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setBarcodeNotFound(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown" && filteredProducts.length > 0) {
                e.preventDefault();
                setSelectedProductIndex(0);
                return;
              }
              handleStepNavigation(e, 1);
            }}
            className="h-10 w-full border-border bg-background pl-9 shadow-sm"
          />
        </div>

        <Select
          value={selectedCategory}
          onValueChange={setSelectedCategory}
        >
          <SelectTrigger
            ref={categorySelectRef}
            onKeyDown={(e) => handleStepNavigation(e, 2)}
            className="h-10 w-full border-border bg-background shadow-sm"
          >
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedBrand} onValueChange={setSelectedBrand}>
          <SelectTrigger
            ref={brandSelectRef}
            onKeyDown={(e) => handleStepNavigation(e, 3)}
            className="h-10 w-full border-border bg-background text-sm shadow-sm"
          >
            <SelectValue placeholder="All Brands" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Brands</SelectItem>
            {brandOptions.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedSubBrand}
          onValueChange={setSelectedSubBrand}
          disabled={selectedBrand === "All" || subBrandOptions.length === 0}
        >
          <SelectTrigger
            ref={subBrandSelectRef}
            onKeyDown={(e) => handleStepNavigation(e, 4)}
            className="h-10 w-full border-border bg-background text-sm shadow-sm disabled:opacity-50"
          >
            <SelectValue
              placeholder={
                selectedBrand === "All"
                  ? "Select brand first"
                  : "All Sub-brands"
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Sub-brands</SelectItem>
            {subBrandOptions.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="min-w-0 space-y-1">
          <label
            htmlFor="invoice-date"
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Invoice Date
          </label>
          <Input
            ref={invoiceDateRef}
            id="invoice-date"
            type="date"
            value={invoiceDate}
            max={getLocalDateInputValue()}
            required
            onChange={(event) => setInvoiceDate(event.target.value)}
            onKeyDown={(e) => handleStepNavigation(e, 7)}
            className="h-10 w-full bg-background font-medium shadow-sm"
            aria-label="Invoice date"
          />
        </div>

        <Badge
          variant="outline"
          className="flex h-10 w-full items-center justify-center whitespace-nowrap border-purple-200 bg-purple-50 px-3 text-purple-700 dark:bg-purple-950/20 xl:w-auto"
        >
          Terminal Active • {branchName}
        </Badge>
      </div>

      {/* Barcode Form & Catalog Grid (Left Side) */}
      <div className="order-1 flex flex-col gap-4 xl:col-span-5">
        {/* Barcode Scanner Form */}
        <form
          onSubmit={handleBarcodeSubmit}
          className={`flex gap-2 p-3 rounded-xl items-center shadow-sm border transition-colors ${
            barcodeNotFound
              ? "bg-red-50/60 border-red-200 dark:bg-red-950/20 dark:border-red-900/40"
              : "bg-purple-50/50 border-purple-100 dark:bg-purple-950/10 dark:border-purple-900/40"
          }`}
        >
          <span className="text-xs font-semibold text-purple-800 dark:text-purple-300 hidden sm:inline shrink-0">
            Barcode Scanner:
          </span>
          <Input
            ref={barcodeInputRef}
            autoFocus
            placeholder="Scan / type SKU and hit Enter…"
            value={barcodeInput}
            onChange={(e) => {
              setBarcodeInput(e.target.value);
              setBarcodeNotFound(false);
            }}
            className={`h-8 text-xs bg-card ${
              barcodeNotFound
                ? "border-red-300 focus-visible:ring-red-400"
                : "border-purple-200 dark:border-purple-800 focus-visible:ring-purple-500"
            }`}
          />
          <Button
            type="submit"
            size="sm"
            className={`h-8 text-xs text-white shrink-0 transition-colors ${
              barcodeNotFound
                ? "bg-red-500 hover:bg-red-600"
                : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            Scan
          </Button>
        </form>

        {/* Product Catalog Grid */}
        <div
          className="grid max-h-[calc(100vh-335px)] min-h-[420px] grid-cols-1 gap-4 overflow-y-auto pr-2 sm:grid-cols-2
          [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-track]:rounded-full
          [&::-webkit-scrollbar-track]:bg-muted/40
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb]:bg-purple-300
          dark:[&::-webkit-scrollbar-thumb]:bg-purple-700"
        >
          {filteredProducts.length === 0 ? (
            <div className="col-span-2 text-center text-muted-foreground py-16 text-sm">
              {searchTerm ||
              selectedCategory !== "All" ||
              selectedBrand !== "All"
                ? "No products match your filters."
                : "No products available."}
            </div>
          ) : (
            filteredProducts.map((prod, idx) => {
              const isSelected = idx === selectedProductIndex;
              return (
                <Card
                  key={prod.id}
                  onClick={() => {
                    onAddToCart(prod);
                    setSelectedProductIndex(-1);
                  }}
                  className={`cursor-pointer transition-all hover:shadow-md bg-card group border flex flex-col justify-between h-36 ${
                    isSelected
                      ? "border-purple-600 ring-2 ring-purple-600 bg-purple-50/50 dark:bg-purple-950/20"
                      : "border-border hover:border-purple-500"
                  }`}
                >
                  <CardContent className="p-3.5 flex flex-col justify-between h-full w-full">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium text-muted-foreground">
                          {prod.sku}
                        </span>
                        <Badge
                          className={`text-[10px] px-1.5 py-0 ${
                            prod.stock <= 5
                              ? "bg-red-50 text-red-700 border-red-100"
                              : "bg-purple-50 text-purple-700 border-purple-100"
                          }`}
                        >
                          Stock: {prod.stock}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-purple-600 transition-colors leading-tight">
                        {prod.name}
                      </h3>
                      {prod.brand && (
                        <p className="text-[10px] text-muted-foreground truncate">
                          {prod.brand}
                          {prod.subBrand ? ` › ${prod.subBrand}` : ""}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-dashed border-border/80">
                      <span className="font-extrabold text-base text-purple-600">
                        {formatCurrency(prod.price)}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[9px] bg-slate-50 dark:bg-slate-900 border-slate-200"
                      >
                        {prod.category}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </>
  );
});
