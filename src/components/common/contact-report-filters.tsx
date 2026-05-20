"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ContactReportFiltersProps {
  type: "customer" | "supplier"
  customers?: any[]
  suppliers?: any[]
  customerId?: string
  supplierId?: string
}

export default function ContactReportFilters({
  type,
  customers = [],
  suppliers = [],
  customerId,
  supplierId,
}: ContactReportFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)

    if (value === "all") {
      params.delete(key)
    } else {
      params.set(key, value)
    }

    params.set("page", "1")

    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex gap-4 mb-6">

      {/* Customer Filter */}
      {type === "customer" && (
        <Select
          value={customerId || "all"}
          onValueChange={(value) => updateFilter("customerId", value)}
        >
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="All Customers" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">All Customers</SelectItem>

            {customers.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Supplier Filter */}
      {type === "supplier" && (
        <Select
          value={supplierId || "all"}
          onValueChange={(value) => updateFilter("supplierId", value)}
        >
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="All Suppliers" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">All Suppliers</SelectItem>

            {suppliers.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

    </div>
  )
}