"use client";

import {
    flexRender,
    getCoreRowModel,
    useReactTable,
    getSortedRowModel,
    getFilteredRowModel,
    SortingState,
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    ColumnDef,
} from "@tanstack/react-table";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, ArrowRight, Search } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

interface TransferHistoryItem {
    id: string;
    transferNo: string;
    transferDate: Date;
    fromBranchName: string;
    toBranchName: string;
    status: "Pending" | "Completed" | "Cancelled";
    note?: string;
    itemCount: number;
    items: { productId: string; product_name: string; sku: string; quantity: number }[];
}

function statusBadge(status: string) {
    const map: Record<string, string> = {
        Completed: "bg-green-100 text-green-700 border-green-200",
        Pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
        Cancelled: "bg-red-100 text-red-700 border-red-200",
    };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${map[status] ?? ""}`}>
            {status}
        </span>
    );
}

function ExpandableRow({ row }: { row: any }) {
    const [open, setOpen] = useState(false);
    const transfer = row.original as TransferHistoryItem;

    return (
        <Collapsible open={open} onOpenChange={setOpen} asChild>
            <>
                <CollapsibleTrigger asChild>
                    <TableRow className="cursor-pointer hover:bg-muted/50">
                        {row.getVisibleCells().map((cell: any) => (
                            <TableCell key={cell.id}>
                                {cell.column.id === "transferNo" ? (
                                    <div className="flex items-center gap-2">
                                        {open ? (
                                            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                        ) : (
                                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                                        )}
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </div>
                                ) : (
                                    flexRender(cell.column.columnDef.cell, cell.getContext())
                                )}
                            </TableCell>
                        ))}
                    </TableRow>
                </CollapsibleTrigger>
                <CollapsibleContent asChild>
                    <TableRow className="bg-muted/20 hover:bg-muted/20">
                        <TableCell colSpan={row.getVisibleCells().length} className="py-3 px-6">
                            <div className="flex flex-col gap-2">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    Items Transferred
                                </p>
                                <div className="flex flex-col gap-1.5">
                                    {transfer.items.map((item) => (
                                        <div
                                            key={item.productId}
                                            className="flex items-center justify-between text-sm bg-background rounded-md px-3 py-2 border"
                                        >
                                            <div>
                                                <span className="font-medium">{item.product_name}</span>
                                                <span className="text-muted-foreground ml-2 text-xs">{item.sku}</span>
                                            </div>
                                            <Badge variant="secondary">{item.quantity} pcs</Badge>
                                        </div>
                                    ))}
                                </div>
                                {transfer.note && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        <span className="font-medium">Note:</span> {transfer.note}
                                    </p>
                                )}
                            </div>
                        </TableCell>
                    </TableRow>
                </CollapsibleContent>
            </>
        </Collapsible>
    );
}

const columns: ColumnDef<TransferHistoryItem>[] = [
    {
        accessorKey: "transferNo",
        header: "Transfer #",
        cell: ({ row }) => (
            <span className="font-mono text-sm font-medium">{row.original.transferNo}</span>
        ),
    },
    {
        accessorKey: "transferDate",
        header: "Date",
        cell: ({ row }) => (
            <span className="text-sm text-muted-foreground">
                {format(new Date(row.original.transferDate), "dd MMM yyyy, hh:mm a")}
            </span>
        ),
    },
    {
        id: "route",
        header: "Route",
        cell: ({ row }) => (
            <div className="flex items-center gap-1.5 text-sm">
                <span className="font-medium">{row.original.fromBranchName}</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="font-medium">{row.original.toBranchName}</span>
            </div>
        ),
    },
    {
        accessorKey: "itemCount",
        header: "Items",
        cell: ({ row }) => (
            <Badge variant="outline">{row.original.itemCount} {row.original.itemCount === 1 ? "item" : "items"}</Badge>
        ),
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => statusBadge(row.original.status),
    },
];

interface TransferHistoryTableProps {
    data: TransferHistoryItem[];
}

export function TransferHistoryTable({ data }: TransferHistoryTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState("");

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        state: { sorting, globalFilter },
    });

    return (
        <Card>
            <CardHeader className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <CardTitle>All Transfers</CardTitle>
                    <CardDescription>Click a row to view items</CardDescription>
                </div>
                <div className="relative w-full sm:w-1/2 md:w-1/4">
                    <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <Input
                        placeholder="Search transfer..."
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((hg) => (
                            <TableRow key={hg.id}>
                                {hg.headers.map((header) => (
                                    <TableHead key={header.id} className="bg-primary text-primary-foreground">
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => (
                                <ExpandableRow key={row.id} row={row} />
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                                    No transfers found. Create your first transfer.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}