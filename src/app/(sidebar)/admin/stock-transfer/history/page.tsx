// src/app/(dashboard)/admin/stock-transfer/history/page.tsx
export const dynamic = "force-dynamic";

import { getStockTransfers } from "@/actions/stock-transfer-actions";
import { TransferHistoryTable } from "@/components/stock/transfer-history-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function TransferHistoryPage() {
    const result = await getStockTransfers();
    const transfers = result?.data?.data ?? [];

    return (
        <div className="flex flex-1 flex-col p-4 md:p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Transfer History</h1>
                    <p className="text-muted-foreground">
                        All stock movements between branches
                    </p>
                </div>
                <Button asChild>
                    <Link href="/admin/stock-transfer">
                        <Plus className="h-4 w-4 mr-2" />
                        New Transfer
                    </Link>
                </Button>
            </div>
            <TransferHistoryTable data={transfers} />
        </div>
    );
}