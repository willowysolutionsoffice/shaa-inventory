"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PlusCircle, Search, FolderTree, Edit, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { categorySchema } from "@/schemas/category-schema";
import {
  createCategory, updateCategory, deleteCategory,
  getCategoryList, ProductCategory,
} from "@/actions/category-actions";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { z } from "zod";

interface Props {
  categories: ProductCategory[];
  total:      number;
}

type FormValues = z.infer<typeof categorySchema>;

export default function ProductCategoriesClient({ categories: initial, total: initialTotal }: Props) {
  const [search,     setSearch]     = useState("");
  const [openForm,   setOpenForm]   = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selected,   setSelected]   = useState<ProductCategory | null>(null);

  // Keep categories in local state so we can update after mutations
  // without needing a full page refresh
  const [categories, setCategories] = useState<ProductCategory[]>(initial);
  const [total,      setTotal]      = useState(initialTotal);

  const { execute: execCreate, isExecuting: isCreating } = useAction(createCategory);
  const { execute: execUpdate, isExecuting: isUpdating } = useAction(updateCategory);
  const { execute: execDelete, isExecuting: isDeleting } = useAction(deleteCategory);

  const form = useForm<FormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", description: "" },
  });

  const isEdit = !!selected && openForm;

  // Refetch from server and update local state
  const refetch = async () => {
    const result = await getCategoryList({ skip: 0, take: 100 });
    const fresh = result?.data?.data?.categories ?? [];
    const freshTotal = result?.data?.data?.total ?? 0;
    setCategories(fresh);
    setTotal(freshTotal);
  };

  const openCreate = () => {
    setSelected(null);
    form.reset({ name: "", description: "" });
    setOpenForm(true);
  };

  const openEdit = (cat: ProductCategory) => {
    setSelected(cat);
    form.reset({ name: cat.name, description: cat.description ?? "" });
    setOpenForm(true);
  };

  const openConfirmDelete = (cat: ProductCategory) => {
    setSelected(cat);
    setOpenDelete(true);
  };

  const handleSubmit = async (data: FormValues) => {
  if (isEdit && selected) {
    const result = await execUpdate({ id: selected.id, ...data });
    if (result?.data?.error) {
      toast.error(result.data.error);
      return;
    }
    toast.success("Category updated");
  } else {
    const result = await execCreate(data);
    if (result?.data?.error) {
      toast.error(result.data.error);
      return;
    }
    toast.success("Category created");
  }
  setOpenForm(false);
  setSelected(null);
  await refetch();
};

const handleDelete = async () => {
  if (!selected) return;
  const result = await execDelete({ id: selected.id });
  if (result?.data?.error) {
    toast.error(result.data.error);
  } else {
    toast.success(`"${selected.name}" deleted`);
  }
  setOpenDelete(false);
  setSelected(null);
  await refetch();
};

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Product Categories ({total})
                </h1>
                <p className="text-muted-foreground">Manage your product classifications</p>
              </div>
              <Button
                onClick={openCreate}
                className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
              >
                <PlusCircle className="h-4 w-4" /> Add Category
              </Button>
            </div>

            <Card className="border-border shadow-sm">
              <CardHeader className="py-4 border-b border-border bg-muted/20 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">All Categories</CardTitle>
                  <CardDescription>View and manage product category list</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search categories..."
                    className="pl-9 h-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="w-full overflow-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground font-medium border-b border-border text-xs uppercase">
                      <tr>
                        <th className="px-4 py-3">Category Name</th>
                        <th className="px-4 py-3">Description</th>
                        <th className="px-4 py-3 text-center">Products</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filtered.length ? filtered.map((cat) => (
                        <tr key={cat.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-semibold">
                            <div className="flex items-center gap-2">
                              <div className="bg-purple-100 text-purple-700 p-1.5 rounded-md dark:bg-purple-900/30 dark:text-purple-400">
                                <FolderTree className="h-4 w-4" />
                              </div>
                              {cat.name}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {cat.description || "—"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant="secondary" className="font-mono">
                              {cat._count.products}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right space-x-1">
                            <Button
                              variant="ghost" size="icon"
                              className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                              onClick={() => openEdit(cat)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost" size="icon"
                              className="h-8 w-8 text-red-600 hover:bg-red-50"
                              onClick={() => openConfirmDelete(cat)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                            No categories found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Create / Edit dialog */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Category" : "New Category"}</DialogTitle>
            <DialogDescription>
              {isEdit ? "Update the category details." : "Add a new product category."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Apparel" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Description <span className="text-muted-foreground text-xs">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Short description..." {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenForm(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  disabled={isCreating || isUpdating}
                >
                  {isCreating || isUpdating ? "Saving..." : isEdit ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-bold">{selected?.name}</span>?
              Products linked to this category will have their category cleared.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}