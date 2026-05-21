import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search, FolderTree, Edit, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function ProductCategoriesPage() {
  const mockCategories = [
    { id: 1, name: "Electronics", description: "Gadgets and tech devices", count: 45, status: "Active" },
    { id: 2, name: "Furniture", description: "Office and home furniture", count: 12, status: "Active" },
    { id: 3, name: "Office Supplies", description: "Stationery and paper goods", count: 89, status: "Active" },
    { id: 4, name: "Apparel", description: "Company branded clothing", count: 24, status: "Inactive" },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Product Categories</h1>
              <p className="text-muted-foreground">Manage your product classifications</p>
            </div>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
              <PlusCircle className="h-4 w-4" /> Add Category
            </Button>
          </div>

          <Card className="border-border shadow-sm">
            <CardHeader className="py-4 border-b border-border bg-muted/20 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">All Categories</CardTitle>
                <CardDescription>View and edit product categories hierarchy</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search categories..." className="pl-9 h-9" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="w-full overflow-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground font-medium border-b border-border text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3">Category Name</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3 text-center">Products Count</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {mockCategories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-muted/30 transition-colors group">
                        <td className="px-4 py-3 font-semibold flex items-center gap-2">
                          <div className="bg-purple-100 text-purple-700 p-1.5 rounded-md dark:bg-purple-900/30 dark:text-purple-400">
                            <FolderTree className="h-4 w-4" />
                          </div>
                          {cat.name}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{cat.description}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="secondary" className="font-mono">{cat.count}</Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="outline" className={cat.status === 'Active' ? "border-green-200 text-green-700 bg-green-50" : "border-gray-200 text-gray-500 bg-gray-50"}>
                            {cat.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
