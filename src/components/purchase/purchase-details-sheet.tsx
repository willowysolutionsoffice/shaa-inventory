import { getPurchaseById } from '@/actions/purchase-actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Building2,
  Calendar,
  FileText,
  Package,
  Truck,
  CreditCard,
  MapPin,
  Phone,
  Hash,
} from 'lucide-react'
import { notFound } from 'next/navigation'
import { ExportInvoiceButton } from '@/components/common/export-invoice-button'

export interface PageParamsProps {
  params: Promise<{ purchaseid: string }>
}

// ── Payment status display helpers ─────────────────────────────────────────────
// Backend PaymentStatus enum: PENDING | PARTIAL | PAID

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  PAID:    'bg-green-100 text-green-800',
  PARTIAL: 'bg-yellow-100 text-yellow-800',
  PENDING: 'bg-red-100 text-red-800',
}

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PAID:    'Paid',
  PARTIAL: 'Partial',
  PENDING: 'Pending',
}

export default async function Page({ params }: PageParamsProps) {
  const { purchaseid } = await params

  const result = await getPurchaseById({ id: purchaseid })
  if (!result?.data) notFound()

  const purchase = result.data as any

  const paymentStatus = (purchase.paymentStatus ?? '').toUpperCase()
  const paymentDue    = Number(purchase.paymentDue ?? purchase.dueAmount ?? 0)

  return (
    <div className="max-h-screen overflow-y-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <h1 className="text-3xl font-bold">Purchase Details</h1>
        </div>
        <ExportInvoiceButton data={purchase} type="purchase" />
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Purchase No: {purchase.purchaseNo ?? '—'}
      </p>

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
                <span>{formatDate(purchase.purchaseDate)}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Purchase No:</span>
                <span>{purchase.purchaseNo ?? '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Location:</span>
                <span>{purchase.branch?.name ?? 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Total Amount:</span>
                <span className="font-bold">
                  {formatCurrency(Number(purchase.totalAmount) || 0)}
                </span>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {/* Payment status from Prisma enum */}
              <Badge
                className={
                  PAYMENT_STATUS_STYLES[paymentStatus] ??
                  'bg-gray-100 text-gray-800'
                }
              >
                {PAYMENT_STATUS_LABELS[paymentStatus] ?? paymentStatus}
              </Badge>

              {paymentDue > 0 && (
                <Badge className="bg-orange-100 text-orange-800">
                  Due: {formatCurrency(paymentDue)}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Supplier Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Supplier Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Name:</span>
                <span>{purchase.supplier?.name ?? '—'}</span>
              </div>
              {purchase.supplier?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Phone:</span>
                  <span>{purchase.supplier.phone}</span>
                </div>
              )}
              {purchase.supplier?.email && (
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Email:</span>
                  <span>{purchase.supplier.email}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              Products ({purchase.items?.length ?? 0} items)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {purchase.items && purchase.items.length > 0 ? (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium">#</th>
                        <th className="text-left p-2 font-medium">Product</th>
                        <th className="text-right p-2 font-medium">Quantity</th>
                        <th className="text-right p-2 font-medium">Unit Price</th>
                        <th className="text-right p-2 font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchase.items.map((item: any, index: number) => (
                        <tr key={item.id ?? index} className="border-b">
                          <td className="p-2">{index + 1}</td>
                          <td className="p-2">
                            <div className="font-medium">
                              {/* product_name is the normalized alias */}
                              {item.product_name ||
                                item.product?.productName ||
                                'Unknown Product'}
                            </div>
                            {item.product?.sku && (
                              <div className="text-sm text-muted-foreground">
                                SKU: {item.product.sku}
                              </div>
                            )}
                          </td>
                          <td className="p-2 text-right">{item.quantity}</td>
                          <td className="p-2 text-right">
                            {formatCurrency(Number(item.unitPrice))}
                          </td>
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
                      Grand Total:{' '}
                      {formatCurrency(Number(purchase.totalAmount) || 0)}
                    </div>
                    {paymentDue > 0 && (
                      <div className="text-sm text-muted-foreground">
                        Amount Due: {formatCurrency(paymentDue)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No products found for this purchase.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Payments */}
        {purchase.payments && purchase.payments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {purchase.payments.map((payment: any, index: number) => (
                  <div
                    key={payment.id ?? index}
                    className="flex justify-between items-center p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">
                        {formatCurrency(Number(payment.amount))}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {/* paymentMethod stored as enum e.g. CASH, BANK_TRANSFER */}
                        {payment.paymentMethod} •{' '}
                        {payment.paidOn ? formatDate(payment.paidOn) : '—'}
                      </div>
                      {payment.dueDate && (
                        <div className="text-sm text-muted-foreground">
                          Due: {formatDate(payment.dueDate)}
                        </div>
                      )}
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
    </div>
  )
}