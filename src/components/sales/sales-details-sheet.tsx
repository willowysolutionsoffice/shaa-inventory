"use client";

import { Sale } from "@/types/sales";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  Calendar,
  FileText,
  Package,
  User,
  CreditCard,
  MapPin,
  Phone,
  Hash
} from "lucide-react";

interface SalesDetailsSheetProps {
  sale: Sale;
  open: boolean;
  openChange: (open: boolean) => void;
}

export function SalesDetailsSheet({ sale, open, openChange }: SalesDetailsSheetProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (dueAmount: number) => {
    if (dueAmount === 0) {
      return 'bg-green-100 text-green-800';
    } else {
      return 'bg-red-100 text-red-800';
    }
  };

  return (
    <Sheet open={open} onOpenChange={openChange}>
      <SheetContent side="top" className="max-h-screen overflow-y-auto p-6">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Sales Details
          </SheetTitle>
          <SheetDescription>
            Invoice No: {sale.invoiceNo}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Transaction Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Transaction Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Date:</span>
                  <span>{formatDate(sale.salesdate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Invoice:</span>
                  <span>{sale.invoiceNo}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Location:</span>
                  <span>{sale.branch?.name || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Total Amount:</span>
                  <span className="font-bold">{formatCurrency(sale.grandTotal)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Badge className={getStatusColor('completed')}>
                  Completed
                </Badge>
                <Badge className={getPaymentStatusColor(sale.dueAmount || 0)}>
                  {sale.dueAmount === 0 ? 'Paid' : 'Due'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Name:</span>
                  <span>{sale.customer.name}</span>
                </div>
                {sale.customer && 'phone' in sale.customer && sale.customer.phone ? (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Phone:</span>
                    <span>{String(sale.customer.phone)}</span>
                  </div>
                ) : null}
                {sale.customer && 'email' in sale.customer && sale.customer.email ? (
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Email:</span>
                    <span>{String(sale.customer.email)}</span>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {/* Products List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5" />
                Products ({sale.items?.length || 0} items)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sale.items && sale.items.length > 0 ? (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2 font-medium">#</th>
                          <th className="text-left p-2 font-medium">Product</th>
                          <th className="text-right p-2 font-medium">Quantity</th>
                          <th className="text-right p-2 font-medium">Unit Price</th>
                          <th className="text-right p-2 font-medium">Discount</th>

                          <th className="text-right p-2 font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sale.items.map((item, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2">{index + 1}</td>
                            <td className="p-2">
                              <div>
                                <div className="font-medium">
                                  {item.product?.product_name || 'Unknown Product'}
                                </div>
                                {item.product && 'sku' in item.product && item.product.sku ? (
                                  <div className="text-sm text-muted-foreground">
                                    SKU: {String(item.product.sku)}
                                  </div>
                                ) : null}
                              </div>
                            </td>
                            <td className="p-2 text-right">{item.quantity}</td>
                            <td className="p-2 text-right">{formatCurrency(Number(item.unitPrice))}</td>
                            <td className="p-2 text-right">{formatCurrency(Number(item.discount))}</td>

                            <td className="p-2 text-right font-medium">
                              {formatCurrency(Number(item.total))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <Separator />

                  <div className="flex justify-end">
                    <div className="text-right space-y-1">
                      <div className="text-lg font-bold">
                        Grand Total: {formatCurrency(sale.grandTotal)}
                      </div>

                      {/* Calculate Profit */}
                      {(() => {
                        const totalCost = sale.items.reduce((sum, item) => {
                          const cost = (Number(item.purchasePrice) || 0) * item.quantity;
                          return sum + cost;
                        }, 0);
                        const profit = sale.grandTotal - totalCost;

                        return (
                          <div className="text-sm font-medium text-emerald-600">
                            Profit: {formatCurrency(profit)}
                          </div>
                        );
                      })()}

                      {sale.dueAmount && sale.dueAmount > 0 && (
                        <div className="text-sm text-muted-foreground">
                          Due Amount: {formatCurrency(sale.dueAmount)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No products found for this sale.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Payment Information */}
          {sale.payments && sale.payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sale.payments.map((payment, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{formatCurrency(payment.amount)}</div>
                        <div className="text-sm text-muted-foreground">
                          {payment.paymentMethod} • {formatDate(payment.paidOn)}
                        </div>
                        {payment.paymentNote && (
                          <div className="text-sm text-muted-foreground">
                            Note: {payment.paymentNote}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
