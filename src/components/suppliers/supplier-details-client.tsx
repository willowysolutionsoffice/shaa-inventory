"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Edit2, Mail, MapPin, Phone,
  Building2, CreditCard, Hash, Wallet,
  TrendingDown, TrendingUp, Scale,
} from "lucide-react";
import { IconCash } from "@tabler/icons-react";
import { Clock1 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { SupplierFormDialog } from "./supplier-form";
import { SupplierPayDialog } from "./supplier-pay-dialog";
import { SupplierPaymentHistoryModal } from "./supplier-payment-history-modal";
import { SupplierRow } from "@/types/supplier";

interface SupplierDetailsClientProps {
  supplier: SupplierRow;
  branches: { name: string; id: string }[];
}

export function SupplierDetailsClient({ supplier, branches }: SupplierDetailsClientProps) {
  const router = useRouter();
  const [openEdit,    setOpenEdit]    = useState(false);
  const [openPay,     setOpenPay]     = useState(false);
  const [openPayment, setOpenPayment] = useState(false);

  const hasBanking = supplier.bankName || supplier.accountNumber || supplier.upiId;
  const netBalance =
    (supplier.openingBalance ?? 0) +
    (supplier.purchaseDue    ?? 0) -
    (supplier.purchaseReturnDue ?? 0);

  const branchName = branches.find(b => b.id === supplier.branchId)?.name ?? "—";

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1">
            <ArrowLeft className="size-4" /> Back
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <div>
            <h1 className="text-3xl font-bold">{supplier.name}</h1>
            <p className="text-muted-foreground text-sm font-mono">{supplier.SupplierId}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setOpenPayment(true)} className="gap-1">
            <Clock1 className="size-4" /> Payment History
          </Button>
          <Button variant="outline" size="sm" onClick={() => setOpenPay(true)} className="gap-1">
            <IconCash className="size-4" /> Pay
          </Button>
          <Button size="sm" onClick={() => setOpenEdit(true)} className="gap-1">
            <Edit2 className="size-4" /> Edit
          </Button>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left column ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Supplier Info */}
          <Card>
            <CardHeader><CardTitle>Supplier Information</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Supplier ID</label>
                    <p className="text-sm font-mono">{supplier.SupplierId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                    <p className="text-sm">{supplier.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                    <p className="text-sm">{supplier.phone || "—"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="text-sm">{supplier.email || "—"}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Address</label>
                    <p className="text-sm">{supplier.address || "—"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Business Location</label>
                    <p className="text-sm">{branchName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Opening Balance</label>
                    <p className="text-sm">{formatCurrency(supplier.openingBalance ?? 0)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Balance Summary Table */}
          <Card>
            <CardHeader><CardTitle>Balance Summary</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Opening Balance</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(supplier.openingBalance ?? 0)}
                    </TableCell>
                    <TableCell><Badge variant="secondary">Initial</Badge></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Purchase Due</TableCell>
                    <TableCell className="text-right font-mono text-destructive">
                      {formatCurrency(supplier.purchaseDue ?? 0)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive">Payable</Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Purchase Return Due</TableCell>
                    <TableCell className="text-right font-mono text-green-600">
                      {formatCurrency(supplier.purchaseReturnDue ?? 0)}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Receivable</Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow className="border-t-2 font-semibold">
                    <TableCell className="font-bold">Net Balance</TableCell>
                    <TableCell className={`text-right font-mono font-bold ${netBalance > 0 ? "text-destructive" : "text-green-600"}`}>
                      {formatCurrency(netBalance)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={netBalance > 0 ? "destructive" : "outline"}>
                        {netBalance > 0 ? "You Owe" : "Settled"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Banking Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Banking Information</CardTitle>
                {!hasBanking && (
                  <Badge variant="secondary">Not provided</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {hasBanking ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Account Holder</label>
                      <p className="text-sm">{supplier.accountHolderName || "—"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Bank Name</label>
                      <p className="text-sm">{supplier.bankName || "—"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Bank Branch</label>
                      <p className="text-sm">{supplier.bankBranchName || "—"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">IFSC Code</label>
                      <p className="text-sm font-mono">{supplier.ifscCode || "—"}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Account Number</label>
                      <p className="text-sm font-mono">{supplier.accountNumber || "—"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">UPI ID</label>
                      <p className="text-sm">{supplier.upiId || "—"}</p>
                    </div>
                    {supplier.bankNotes && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Notes</label>
                        <p className="text-sm">{supplier.bankNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                  <CreditCard className="size-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No banking details added yet.</p>
                  <Button variant="outline" size="sm" onClick={() => setOpenEdit(true)}>
                    Add Banking Details
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* ── Right column ── */}
        <div className="lg:col-span-1 space-y-6">

          {/* Quick stats */}
          <Card>
            <CardHeader><CardTitle>Quick Stats</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-muted">
                  <Wallet className="size-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Opening Balance</p>
                  <p className="text-sm font-semibold">{formatCurrency(supplier.openingBalance ?? 0)}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-red-50">
                  <TrendingDown className="size-4 text-destructive" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Purchase Due</p>
                  <p className="text-sm font-semibold text-destructive">{formatCurrency(supplier.purchaseDue ?? 0)}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-green-50">
                  <TrendingUp className="size-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Return Due</p>
                  <p className="text-sm font-semibold text-green-600">{formatCurrency(supplier.purchaseReturnDue ?? 0)}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-md ${netBalance > 0 ? "bg-red-50" : "bg-green-50"}`}>
                  <Scale className={`size-4 ${netBalance > 0 ? "text-destructive" : "text-green-600"}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Net Balance</p>
                  <p className={`text-sm font-semibold ${netBalance > 0 ? "text-destructive" : "text-green-600"}`}>
                    {formatCurrency(netBalance)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact card */}
          <Card>
            <CardHeader><CardTitle>Contact</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="size-4 text-muted-foreground shrink-0" />
                <p className="text-sm">{supplier.phone || "—"}</p>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="size-4 text-muted-foreground shrink-0" />
                <p className="text-sm">{supplier.email || "—"}</p>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-sm">{supplier.address || "—"}</p>
              </div>
              <div className="flex items-center gap-3">
                <Building2 className="size-4 text-muted-foreground shrink-0" />
                <p className="text-sm">{branchName}</p>
              </div>
            </CardContent>
          </Card>

          {/* Actions card */}
          <Card>
            <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button className="w-full gap-2" onClick={() => setOpenPay(true)}>
                <IconCash className="size-4" /> Record Payment
              </Button>
              <Button variant="outline" className="w-full gap-2" onClick={() => setOpenPayment(true)}>
                <Clock1 className="size-4" /> Payment History
              </Button>
              <Button variant="outline" className="w-full gap-2" onClick={() => setOpenEdit(true)}>
                <Edit2 className="size-4" /> Edit Supplier
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* ── Dialogs ── */}
      <SupplierFormDialog open={openEdit} openChange={setOpenEdit} supplier={supplier} branches={branches} />
      <SupplierPayDialog supplier={supplier} open={openPay} setOpen={setOpenPay} />
      <SupplierPaymentHistoryModal open={openPayment} onOpenChange={setOpenPayment} supplierId={supplier.id} supplierName={supplier.name} />
    </div>
  );
}