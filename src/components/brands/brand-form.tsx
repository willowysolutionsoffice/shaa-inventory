'use client';
import { useEffect } from "react";
import { FormDialog, FormDialogContent, FormDialogDescription, FormDialogFooter, FormDialogHeader, FormDialogTitle, FormDialogTrigger } from "@/components/common/form-dialog";
import { brandSchema } from "@/schemas/brand-schema";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { DialogClose } from "../ui/dialog";
import { createBrand, updateBrand } from "@/actions/brand-actions";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { BrandFormProps } from "@/types/brand";


export const BrandFormDialog = ({ brand, open, openChange }: BrandFormProps) => {

  const { execute: createProject, isExecuting: isCreating } = useAction(createBrand);
  const { execute: updateProject, isExecuting: isUpdating } = useAction(updateBrand);

  const form = useForm<z.infer<typeof brandSchema>>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: brand?.name || "",
    },
  });

  useEffect(() => {
    if (brand) {
      form.reset({
        name: brand.name,
      });
    } else {
      form.reset({
        name: "",
      });
    }
  }, [brand, form]);

  const handleSubmit = async (
    data: z.infer<typeof brandSchema>,
    close: () => void,
  ) => {
    if (brand) {
      await updateProject({ id: brand.id, ...data });
      toast.success("Brand updated successfully");
    } else {
      await createProject(data);
      toast.success("Brand created successfully");
    }
    close();
  };

  return (
    <FormDialog
      open={open}
      openChange={openChange}
      form={form}
      onSubmit={handleSubmit}
    >
      <FormDialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          New Brand
        </Button>
      </FormDialogTrigger>

      <FormDialogContent className="sm:max-w-sm">
        <FormDialogHeader>
          <FormDialogTitle>
            {brand ? "Edit Brand" : "New Brand"}
          </FormDialogTitle>
          <FormDialogDescription>
            Fill out the brand details. Click save when you&apos;re done.
          </FormDialogDescription>
        </FormDialogHeader>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Brand Name</FormLabel>
              <FormControl>
                <Input placeholder="Brand Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormDialogFooter>
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              disabled={isCreating || isUpdating}
            >
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" disabled={isCreating || isUpdating}>
            {isCreating || isUpdating ? "Saving..." : "Save"}
          </Button>
        </FormDialogFooter>
      </FormDialogContent>
    </FormDialog>
  );
};
