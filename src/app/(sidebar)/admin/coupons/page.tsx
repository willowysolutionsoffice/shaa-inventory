"use client";

import React, { useState, useMemo } from "react";
import { 
  Tag, 
  Plus, 
  Trash2, 
  Search, 
  Percent, 
  Calendar, 
  Sparkles, 
  Ticket,
  Copy,
  Users
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

// Mock promotional coupon codes
const INITIAL_COUPONS = [
  { code: "WELCOME10", description: "10% store-wide discount for retail checkouts", type: "Percentage", value: 10, minCart: 50.00, start: "2026-05-01", end: "2026-06-30", redemptions: 42, status: "Active" },
  { code: "SUPERERP", description: "20% off high-volume business sales checkouts", type: "Percentage", value: 20, minCart: 200.00, start: "2026-05-10", end: "2026-07-15", redemptions: 15, status: "Active" },
  { code: "FLAT50", description: "Flat $50 off premium home and office furniture", type: "Fixed Amount", value: 50, minCart: 300.00, start: "2026-05-15", end: "2026-06-15", redemptions: 8, status: "Active" },
  { code: "FESTIVE5", description: "Seasonal festive discount on low-stock products", type: "Percentage", value: 5, minCart: 20.00, start: "2026-04-01", end: "2026-05-15", redemptions: 110, status: "Expired" },
];

export default function CouponsPage() {
  const [coupons, setCoupons] = useState(INITIAL_COUPONS);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  // New Coupon Form states
  const [newCode, setNewCode] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState("Percentage");
  const [newValue, setNewValue] = useState("");
  const [newMin, setNewMin] = useState("50");
  const [newStart, setNewStart] = useState(new Date().toISOString().split("T")[0]);
  const [newEnd, setNewEnd] = useState("");

  const filteredCoupons = useMemo(() => {
    return coupons.filter(
      (c) =>
        c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [coupons, searchTerm]);

  // Aggregate stats
  const stats = useMemo(() => {
    const active = coupons.filter((c) => c.status === "Active").length;
    const totalRedemptions = coupons.reduce((sum, item) => sum + item.redemptions, 0);
    return {
      total: coupons.length,
      active,
      redemptions: totalRedemptions,
    };
  }, [coupons]);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Coupon code ${code} copied to clipboard!`);
  };

  const deleteCoupon = (code: string) => {
    setCoupons(coupons.filter((c) => c.code !== code));
    toast.info(`Coupon ${code} permanently removed from store catalogs.`);
  };

  const createCoupon = () => {
    if (!newCode.trim()) {
      toast.warning("Please provide a unique coupon promotional code.");
      return;
    }
    if (coupons.some((c) => c.code.toUpperCase() === newCode.toUpperCase())) {
      toast.error("A coupon with this code already exists.");
      return;
    }
    if (!newValue || Number(newValue) <= 0) {
      toast.warning("Discount value must be a positive number.");
      return;
    }

    const newPromo = {
      code: newCode.toUpperCase().replace(/\s+/g, ""),
      description: newDesc || `${newValue}${newType === "Percentage" ? "%" : "$"} off items`,
      type: newType,
      value: Number(newValue),
      minCart: Number(newMin) || 0,
      start: newStart,
      end: newEnd || "2026-12-31",
      redemptions: 0,
      status: "Active" as const,
    };

    setCoupons([newPromo, ...coupons]);
    toast.success(`New promotional coupon ${newPromo.code} created!`);
    
    // Reset Form
    setNewCode("");
    setNewDesc("");
    setNewValue("");
    setNewMin("50");
    setDialogOpen(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Ticket className="text-purple-600 h-8 w-8" /> Coupons & Offers
          </h1>
          <p className="text-muted-foreground text-sm">
            Launch seasonal promotional codes, customer credits, and flat discounts to boost retail sales
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white gap-1 shadow-md shadow-purple-600/20">
              <Plus className="h-4 w-4" /> Create Coupon Promo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-card border border-border">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">New Coupon Offer Form</DialogTitle>
              <DialogDescription className="text-xs">
                Provide codes that clients can enter at the POS billing terminal
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="space-y-1">
                <span className="font-semibold text-muted-foreground">Promo Code (e.g. SUMMER50)</span>
                <Input
                  placeholder="Type alphanumeric discount code..."
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="h-9 border-border bg-background uppercase font-bold"
                />
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-muted-foreground">Public Description</span>
                <Input
                  placeholder="Flat 15% off high stock summer outfits..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="h-9 border-border bg-background"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="font-semibold text-muted-foreground">Discount Value Type</span>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 shadow-sm transition-colors text-xs focus-visible:outline-none"
                  >
                    <option value="Percentage">Percentage (%)</option>
                    <option value="Fixed Amount">Fixed Amount ($)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-muted-foreground">Value</span>
                  <Input
                    type="number"
                    placeholder="Rate or Amount"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    className="h-9 border-border bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="font-semibold text-muted-foreground">Min Cart Purchase ($)</span>
                  <Input
                    type="number"
                    value={newMin}
                    onChange={(e) => setNewMin(e.target.value)}
                    className="h-9 border-border bg-background"
                  />
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-muted-foreground">Expiry Date</span>
                  <Input
                    type="date"
                    value={newEnd}
                    onChange={(e) => setNewEnd(e.target.value)}
                    className="h-9 border-border bg-background text-xs"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" className="border-border text-xs h-9" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-9 shadow-md"
                onClick={createCoupon}
              >
                Launch Coupon
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-purple-50/50 to-white dark:from-purple-950/10 border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Active Coupons</span>
              <h3 className="text-2xl font-bold text-purple-700 dark:text-purple-400">{stats.active}</h3>
              <p className="text-[10px] text-muted-foreground">Available on Active POS Terminal</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full shrink-0">
              <Ticket className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/10 border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Redemptions Tracked</span>
              <h3 className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">{stats.redemptions}</h3>
              <p className="text-[10px] text-muted-foreground">Total Customer Utilizations</p>
            </div>
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-full shrink-0">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-950/10 border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Optimum Sales Conversion</span>
              <h3 className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">88.5%</h3>
              <p className="text-[10px] text-muted-foreground">Average retention rate clearance</p>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border border-border bg-card">
        <CardContent className="p-3">
          <div className="relative max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search promotional coupons by code, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 bg-background border-border h-9 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Coupons Table */}
      <Card className="border border-border shadow-sm overflow-hidden bg-card">
        <CardHeader className="py-4 border-b border-border bg-muted/20">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <CardTitle className="text-base font-bold">Active Store Coupons</CardTitle>
              <CardDescription className="text-xs">
                Copy coupon codes to utilize in active checkouts and invoices
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-slate-100 dark:bg-slate-900">
              Store Clearance Codes
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[150px]">Promotional Code</TableHead>
                <TableHead>Offers & Explanations</TableHead>
                <TableHead className="w-[120px]">Discount Value</TableHead>
                <TableHead className="text-right w-[150px]">Min Purchase Required</TableHead>
                <TableHead className="text-center w-[120px]">Redemptions</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[100px] text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCoupons.map((c) => (
                <TableRow key={c.code} className="hover:bg-muted/20">
                  <TableCell className="font-mono text-xs font-bold text-purple-600 flex items-center gap-1.5 py-4">
                    <Tag className="h-3 w-3" />
                    <span>{c.code}</span>
                    <button onClick={() => copyCode(c.code)} className="text-muted-foreground hover:text-purple-600 transition-colors p-1">
                      <Copy className="h-3 w-3" />
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs font-semibold">{c.description}</div>
                    <div className="text-[10px] text-muted-foreground">Active: {c.start} to {c.end}</div>
                  </TableCell>
                  <TableCell className="font-bold text-xs">
                    {c.type === "Percentage" ? `${c.value}% off` : `$${c.value} flat`}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-semibold">{formatCurrency(c.minCart)}</TableCell>
                  <TableCell className="text-center font-mono text-xs font-bold text-indigo-600">{c.redemptions}</TableCell>
                  <TableCell>
                    <Badge className={c.status === "Active" ? "bg-green-50 text-green-800 border-green-200" : "bg-red-50 text-red-800 border-red-200"}>
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={() => deleteCoupon(c.code)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
