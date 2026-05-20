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
  Hash
} from 'lucide-react'
import { notFound } from 'next/navigation'
import type { Sale as SaleType } from '@/types/sales'
import { getSaleById } from '@/actions/sales-action'
import { ExportInvoiceButton } from '@/components/common/export-invoice-button'

export interface PageParamsProps {
  params: Promise<{ saleid: string }>
}

export default async function Page({ params }: PageParamsProps) {
  const { saleid } = await params

  const { data: resultData } = await getSaleById({ id: saleid })
  if (!resultData || !resultData.data) {
    notFound()
  }

  const sale = resultData.data as unknown as SaleType

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
    <div className="max-h-screen overflow-y-auto p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <h1 className="text-3xl font-bold">Sale Details</h1>
        </div>
        <ExportInvoiceButton data={sale} type="sale" />
      </div>
      <p className="text-sm text-muted-foreground">Invoice No: {sale.invoiceNo}</p>

      <div className="mt-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Transaction Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Date:</span>
                <span>{formatDate(sale.salesdate as unknown as Date)}</span>
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
                <span className="font-bold">{formatCurrency(Number(sale.grandTotal) || 0)}</span>
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

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Name:</span>
                <span>{sale.customer?.name ?? '—'}</span>
              </div>
              {(sale.customer as { phone?: unknown })?.phone ? (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Phone:</span>
                  <span>{String((sale.customer as { phone?: unknown }).phone)}</span>
                </div>
              ) : null}
              {(sale.customer as { email?: unknown })?.email ? (
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Email:</span>
                  <span>{String((sale.customer as { email?: unknown }).email)}</span>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

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
                              {(item.product as { sku?: unknown } | undefined)?.sku ? (
                                <div className="text-sm text-muted-foreground">SKU: {String((item.product as { sku?: unknown }).sku)}</div>
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
                      Grand Total: {formatCurrency(Number(sale.grandTotal) || 0)}
                    </div>
                    {sale.dueAmount && sale.dueAmount > 0 && (
                      <div className="text-sm text-muted-foreground">
                        Due Amount: {formatCurrency(Number(sale.dueAmount) || 0)}
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
    </div>
  )
}


