import { getProductById } from '@/actions/product-actions';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { ProductQrPrint } from '@/components/products/product-qr-print';
import { getProductVariants } from '@/actions/variant-actions';

export interface PageParamsProps {
  params: Promise<{ productid: string }>;
}

const Page = async ({ params }: PageParamsProps) => {
  const { productid } = await params;

  const result  = await getProductById({ id: productid });
  const product = result?.data?.data;
  if (!product) notFound();

  const variants    = await getProductVariants(productid);
  const hasVariants = variants.length > 0;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{product.product_name}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Product Info */}
          <Card>
            <CardHeader><CardTitle>Product Information</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">SKU</label>
                    <p className="text-sm font-mono">{product.sku}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Brand</label>
                    <p className="text-sm">{product.brand?.name || 'N/A'}</p>
                  </div>
                  {product.subBrand && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Sub-brand</label>
                      <p className="text-sm">{product.subBrand.name}</p>
                    </div>
                  )}
                  {product.category && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Category</label>
                      <p className="text-sm">{product.category.name}</p>
                    </div>
                  )}
                  {product.hsl && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">HSL Code</label>
                      <p className="text-sm font-mono">{product.hsl}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Unit</label>
                    <p className="text-sm">{product.unit}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Available in</label>
                    <p className="text-sm">{product.branch?.name || 'N/A'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Purchase Price</label>
                    <p className="text-sm">{formatCurrency(product.purchasePrice)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Selling Price</label>
                    <p className="text-sm">{formatCurrency(product.sellingPrice)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Product Type</label>
                    <p className="text-sm">{hasVariants ? 'Variable' : 'Simple'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Manage Stock?</label>
                    <p className="text-sm">Yes</p>
                  </div>
                  {product.description && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Description</label>
                      <p className="text-sm">{product.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Variation types assigned to this product */}
          {product.variations?.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Assigned Variations</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Variation</TableHead>
                      <TableHead>Values</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {product.variations.map(({ variation }) => (
                      <TableRow key={variation.id}>
                        <TableCell className="font-medium">{variation.name}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {variation.values.map((v) => (
                              <Badge key={v.id} variant="secondary">{v.value}</Badge>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Generated variants with stock */}
          {hasVariants && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Product Variants</span>
                  <Badge variant="secondary">{variants.length} variants</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Variant</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-center">Stock</TableHead>
                      <TableHead className="text-right">Purchase Price</TableHead>
                      <TableHead className="text-right">Selling Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {variants.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell className="font-medium">{v.variantName}</TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {v.sku}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">
                            {v.stock} {product.unit}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(v.purchasePrice)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(v.sellingPrice)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Stock summary */}
          <Card>
            <CardHeader><CardTitle>Stock Summary</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total Stock</TableHead>
                    <TableHead>Stock Value</TableHead>
                    <TableHead>Units Sold</TableHead>
                    <TableHead>Units Transferred</TableHead>
                    <TableHead>Units Adjusted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                    <TableCell>{product.product_name}</TableCell>
                    <TableCell>{product.branch?.name || 'N/A'}</TableCell>
                    <TableCell>{formatCurrency(product.purchasePrice)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {product.stock} {product.unit}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(product.stock * product.purchasePrice)}
                    </TableCell>
                    <TableCell>0 {product.unit}</TableCell>
                    <TableCell>0 {product.unit}</TableCell>
                    <TableCell>0 {product.unit}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader><CardTitle>Product Image</CardTitle></CardHeader>
            <CardContent>
              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <div className="text-4xl mb-2">📦</div>
                  <p className="text-sm">No image available</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <ProductQrPrint
            sku={product.sku}
            productName={product.product_name}
            price={product.sellingPrice} 
          />
        </div>
      </div>
    </div>
  );
};

export default Page;