import { getProductById } from '@/actions/product-actions';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

export interface PageParamsProps {
  params: Promise<{ productid: string }>;
}

const Page = async ({ params }: PageParamsProps) => {
  const { productid } = await params;

  const { data } = await getProductById({ id: productid });
  if (!data) {
    notFound();
  }

  const { data: product } = data;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header with Product Name and Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{product?.product_name}</h1>
        </div>
      </div>

      {/* Main Product Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Product Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">SKU</label>
                    <p className="text-sm">{product?.sku}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Brand</label>
                    <p className="text-sm">{product?.brand?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Unit</label>
                    <p className="text-sm">{product?.unit}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Barcode Type</label>
                    <p className="text-sm">C128</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Available in locations</label>
                    <p className="text-sm">{product?.branch?.name || 'N/A'}</p>
                  </div>
                </div>
                <div className="space-y-4">

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Sub category</label>
                    <p className="text-sm">-</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Manage Stock?</label>
                    <p className="text-sm">Yes</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Expires in</label>
                    <p className="text-sm">Not Applicable</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Product Type</label>
                    <p className="text-sm">Simple</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Variations Table */}
          <Card>
            <CardHeader>
              <CardTitle>Variations</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Variations</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Purchase Price</TableHead>
                    <TableHead>Variation Images</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Default</TableCell>
                    <TableCell>{product?.sku}</TableCell>
                    <TableCell>{formatCurrency(product?.purchasePrice || 0)}</TableCell>
                    <TableCell>-</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Product Stock Details */}
          <Card>
            <CardHeader>
              <CardTitle>Product Stock Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Current stock</TableHead>
                    <TableHead>Current Stock Value</TableHead>
                    <TableHead>Total unit sold</TableHead>
                    <TableHead>Total Unit Transfered</TableHead>
                    <TableHead>Total Unit Adjusted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>{product?.sku}</TableCell>
                    <TableCell>{product?.product_name}</TableCell>
                    <TableCell>{product?.branch?.name || 'N/A'}</TableCell>
                    <TableCell>{formatCurrency(product?.purchasePrice || 0)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {product?.stock || 0} {product?.unit}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency((product?.stock || 0) * (product?.purchasePrice || 0))}</TableCell>
                    <TableCell>0.00 {product?.unit}</TableCell>
                    <TableCell>0.00 {product?.unit}</TableCell>
                    <TableCell>0.00 {product?.unit}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Product Image Placeholder */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Product Image</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <div className="text-4xl mb-2">📦</div>
                  <p className="text-sm">No image available</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Page;
