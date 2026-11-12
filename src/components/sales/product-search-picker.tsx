"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export type SearchProduct = {
  id: string;
  name?: string;
  product_name?: string;
  productName?: string;
  sku?: string;
  stock?: number;
};

type ProductSearchPickerProps<T extends SearchProduct> = {
  value: string;
  onValueChange: (value: string) => void;
  products: T[];
  onSelect: (product: T) => void;
  placeholder?: string;
  loading?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  className?: string;
  inputClassName?: string;
};

export function ProductSearchPicker<T extends SearchProduct>({
  value,
  onValueChange,
  products,
  onSelect,
  placeholder = "Search product…",
  loading = false,
  inputRef,
  className = "",
  inputClassName = "",
}: ProductSearchPickerProps<T>) {
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const sortedProducts = useMemo(
    () =>
      [...products].sort((a, b) =>
        (a.name ?? a.product_name ?? a.productName ?? "").localeCompare(
          b.name ?? b.product_name ?? b.productName ?? "",
          undefined,
          { numeric: true, sensitivity: "base" },
        ),
      ),
    [products],
  );

  useEffect(() => {
    setSelectedIndex(-1);
  }, [value]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const choose = (product: T) => {
    onSelect(product);
    setOpen(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setSelectedIndex((index) =>
        Math.min(sortedProducts.length - 1, index + 1),
      );
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((index) => Math.max(0, index - 1));
      return;
    }
    if (event.key === "Enter" && selectedIndex >= 0) {
      const product = sortedProducts[selectedIndex];
      if (product) {
        event.preventDefault();
        choose(product);
      }
    }
  };

  const showResults = open && value.trim().length > 0;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2" />
      <Input
        ref={inputRef}
        placeholder={placeholder}
        value={value}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onChange={(event) => {
          onValueChange(event.target.value);
          setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        className={`pl-9 ${inputClassName}`}
      />

      {showResults && (
        <div className="absolute left-0 z-50 mt-1 w-[380px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-md border border-slate-200 bg-white p-1 shadow-md dark:border-slate-700 dark:bg-slate-950">
          <div className="relative border-b border-slate-200 px-2 pb-1 dark:border-slate-700">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2" />
            <Input
              autoFocus
              aria-label="Search products"
              placeholder="Search product..."
              value={value}
              onChange={(event) => onValueChange(event.target.value)}
              onKeyDown={handleKeyDown}
              className="h-9 border-0 bg-transparent pr-1 pl-7 shadow-none focus-visible:ring-0"
            />
          </div>
          <div
            role="listbox"
            aria-label="Product suggestions"
            className="max-h-64 overflow-y-auto py-1"
          >
            {loading ? (
              <p className="text-muted-foreground px-2 py-4 text-center text-sm">
                Searching products…
              </p>
            ) : sortedProducts.length === 0 ? (
              <p className="text-muted-foreground px-2 py-4 text-center text-sm">
                No products found.
              </p>
            ) : (
              sortedProducts.map((product, index) => {
                const name =
                  product.name ??
                  product.product_name ??
                  product.productName ??
                  "Unnamed product";
                return (
                  <button
                    key={product.id}
                    type="button"
                    role="option"
                    aria-selected={index === selectedIndex}
                    onMouseEnter={() => setSelectedIndex(index)}
                    onClick={() => choose(product)}
                    className={`flex w-full items-center justify-between gap-4 rounded-sm px-2 py-1.5 text-left text-sm leading-5 transition-colors ${
                      index === selectedIndex
                        ? "bg-blue-100 text-slate-900 dark:bg-blue-950/50 dark:text-slate-100"
                        : "text-slate-900 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span className="truncate">{name}</span>
                    <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                      Stock: {product.stock ?? 0}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
