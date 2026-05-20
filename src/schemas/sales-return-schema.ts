import { z } from "zod";

export const salesReturnSchema = z.object({
  invoiceNo: z.string().min(1, "Reference number is required"),
  branchId: z.string().min(1, "Branch is required"),
  customerId: z.string().min(1, "Customer is required"),
  salesReturnDate: z.coerce.date(),
  grandTotal: z.coerce.number().min(0, "Total amount is required"),
});


