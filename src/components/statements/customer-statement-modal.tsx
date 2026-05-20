"use client";

import { useEffect, useState, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableFooter,
} from "@/components/ui/table";
import { getStatementData } from "@/actions/statement-action";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";
import { IconLoader2 } from "@tabler/icons-react";
import { ExportPdfButton } from "@/components/reports/export-pdf-button";

interface Transaction {
    date: Date | string;
    description: string;
    debit: number;
    credit: number;
    id: string;
    type: string;
    balance?: number;
}

export function CustomerStatementModal({
    customerId,
    open,
    onOpenChange,
}: {
    customerId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [data, setData] = useState<{
        name: string;
        openingBalance: number;
        transactions: Transaction[];
    } | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open || !customerId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const result = await getStatementData({ id: customerId, type: "customer" });
                if (result?.data) {
                    if ('error' in result.data) {
                        toast.error(result.data.error as string);
                    } else {
                        setData(result.data as any);
                    }
                }
            } catch (error) {
                toast.error("Failed to load statement data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [open, customerId]);

    const statementItems = useMemo(() => {
        if (!data) return [];

        let runningBalance = data.openingBalance;
        return data.transactions.map((tx) => {
            runningBalance = runningBalance + tx.debit - tx.credit;
            return { ...tx, balance: runningBalance };
        });
    }, [data]);


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex justify-between items-center pr-8">
                        <span>Customer History Statement - {data?.name || "Loading..."}</span>
                        {data && (
                            <ExportPdfButton
                                data={statementItems}
                                title="Customer Ledger Statement"
                                subtitle={`Customer: ${data.name}`}
                                openingBalance={data.openingBalance}
                                type="customer"
                                filename={`Statement-${data.name?.replace(/\s+/g, '-')}`}
                            />
                        )}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-auto mt-4 px-1">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <IconLoader2 className="animate-spin h-8 w-8 text-indigo-600" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-[120px]">Date</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Debit (+)</TableHead>
                                    <TableHead className="text-right">Credit (-)</TableHead>
                                    <TableHead className="text-right font-bold text-foreground">Balance</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow className="bg-muted/30 italic font-medium">
                                    <TableCell colSpan={2}>Opening Balance</TableCell>
                                    <TableCell className="text-right">-</TableCell>
                                    <TableCell className="text-right">-</TableCell>
                                    <TableCell className="text-right font-bold">
                                        {formatCurrency(data?.openingBalance || 0)}
                                    </TableCell>
                                </TableRow>
                                {statementItems.map((item) => (
                                    <TableRow key={item.id + item.type}>
                                        <TableCell className="text-muted-foreground">{formatDate(item.date)}</TableCell>
                                        <TableCell className="font-medium">{item.description}</TableCell>
                                        <TableCell className="text-right text-blue-600">
                                            {item.debit > 0 ? formatCurrency(item.debit) : ""}
                                        </TableCell>
                                        <TableCell className="text-right text-emerald-600">
                                            {item.credit > 0 ? formatCurrency(item.credit) : ""}
                                        </TableCell>
                                        <TableCell className="text-right font-bold">
                                            {formatCurrency(item.balance)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            {statementItems.length > 0 && (
                                <TableFooter className="bg-muted/50">
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-right font-bold text-lg">Current Total Balance</TableCell>
                                        <TableCell className="text-right font-bold text-lg text-indigo-600">
                                            {formatCurrency(statementItems[statementItems.length - 1].balance)}
                                        </TableCell>
                                    </TableRow>
                                </TableFooter>
                            )}
                        </Table>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
