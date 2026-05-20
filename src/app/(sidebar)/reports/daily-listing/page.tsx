"use client";

import { useAction } from "next-safe-action/hooks";
import { getDailyFinancialSummary } from "@/actions/daily-report-action";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn, formatDate, CURRENCY_SYMBOL } from "@/lib/utils";
import { normalizeToUtcMidnight, getTodayUtcMidnight } from "@/lib/date-utils";
import { CalendarIcon, Loader2, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";

export default function DailyListingPage() {
    const [date, setDate] = useState<Date>(getTodayUtcMidnight());
    const { execute, result, isExecuting } = useAction(getDailyFinancialSummary);

    useEffect(() => {
        execute({ date: normalizeToUtcMidnight(date).toISOString() });
    }, [date, execute]);

    const rawData = result?.data;
    const dailyData: any = rawData && "customerSummary" in rawData ? rawData : null;

    // Helper to format currency
    const fmt = (val: number | undefined) => {
        return `${CURRENCY_SYMBOL}${(val || 0).toFixed(2)}`;
    };

    return (
        <div className="space-y-8 p-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Daily Data Listing</h1>
                    <p className="text-muted-foreground mt-1">
                        Track day-wise opening balances, transactions, and closing balances.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-[240px] justify-start text-left font-normal shadow-sm",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? formatDate(date) : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={(d) => d && setDate(normalizeToUtcMidnight(d))}
                                initialFocus
                                classNames={{
                                    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                                }}
                            />
                        </PopoverContent>
                    </Popover>
                    <Button variant="outline" size="icon" onClick={() => execute({ date: normalizeToUtcMidnight(date).toISOString() })} disabled={isExecuting}>
                        <RefreshCw className={cn("h-4 w-4", isExecuting && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {isExecuting && !dailyData ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : dailyData ? (
                <div className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Customer Section */}
                        <Card className="overflow-hidden border-border/50 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-background to-blue-50/10 dark:to-blue-900/10">
                            <CardHeader className="bg-blue-500/5 border-b border-border/50 pb-4">
                                <CardTitle className="text-blue-600 dark:text-blue-400 flex justify-between items-center">
                                    Customers & Sales
                                    <span className="text-xs font-normal text-muted-foreground bg-background/50 px-2 py-1 rounded-full border">Receivables</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="p-6 space-y-6">
                                    <div className="flex justify-between items-center bg-blue-100/20 p-3 rounded-lg">
                                        <span className="text-sm font-medium text-muted-foreground">Opening Balance (Due)</span>
                                        <span className="text-lg font-bold text-foreground">{fmt(dailyData.customerSummary.openingBalance)}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <span className="text-xs text-muted-foreground uppercase tracking-wider">Total Sales</span>
                                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                + {fmt(dailyData.customerSummary.sales)}
                                            </div>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <span className="text-xs text-muted-foreground uppercase tracking-wider">Total Receipts</span>
                                            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                                - {fmt(dailyData.customerSummary.receipts)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <Separator />
                                <div className="p-6 bg-blue-500/5">
                                    <div className="flex justify-between items-end">
                                        <span className="text-sm font-semibold text-muted-foreground">Closing Balance (Due)</span>
                                        <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{fmt(dailyData.customerSummary.closingBalance)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Supplier Section */}
                        <Card className="overflow-hidden border-border/50 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-background to-orange-50/10 dark:to-orange-900/10">
                            <CardHeader className="bg-orange-500/5 border-b border-border/50 pb-4">
                                <CardTitle className="text-orange-600 dark:text-orange-400 flex justify-between items-center">
                                    Suppliers & Purchases
                                    <span className="text-xs font-normal text-muted-foreground bg-background/50 px-2 py-1 rounded-full border">Payables</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="p-6 space-y-6">
                                    <div className="flex justify-between items-center bg-orange-100/20 p-3 rounded-lg">
                                        <span className="text-sm font-medium text-muted-foreground">Opening Balance (Due)</span>
                                        <span className="text-lg font-bold text-foreground">{fmt(dailyData.supplierSummary.openingBalance)}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <span className="text-xs text-muted-foreground uppercase tracking-wider">Total Purchases</span>
                                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                + {fmt(dailyData.supplierSummary.purchases)}
                                            </div>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <span className="text-xs text-muted-foreground uppercase tracking-wider">Total Payments</span>
                                            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                                - {fmt(dailyData.supplierSummary.payments)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <Separator />
                                <div className="p-6 bg-orange-500/5">
                                    <div className="flex justify-between items-end">
                                        <span className="text-sm font-semibold text-muted-foreground">Closing Balance (Due)</span>
                                        <span className="text-3xl font-extrabold text-orange-600 dark:text-orange-400">{fmt(dailyData.supplierSummary.closingBalance)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {dailyData.financialSummary && (
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Financial Summary Section */}
                            <Card className="overflow-hidden border-border/50 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-background to-emerald-50/10 dark:to-emerald-900/10">
                                <CardHeader className="bg-emerald-500/5 border-b border-border/50 pb-4">
                                    <CardTitle className="text-emerald-600 dark:text-emerald-400 flex justify-between items-center">
                                        Financial Summary
                                        <span className="text-xs font-normal text-muted-foreground bg-background/50 px-2 py-1 rounded-full border">Overview</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="p-6 space-y-6">
                                        <div className="flex justify-between items-center bg-emerald-100/20 p-3 rounded-lg">
                                            <span className="text-sm font-medium text-muted-foreground">Opening Cash Reserve</span>
                                            <span className="text-lg font-bold text-foreground">{fmt(dailyData.financialSummary.openingCashReserve)}</span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <span className="text-xs text-muted-foreground uppercase tracking-wider">Today's Profit</span>
                                                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                                    {fmt(dailyData.financialSummary.todayProfit)}
                                                </div>
                                            </div>
                                            <div className="space-y-1 text-right">
                                                <span className="text-xs text-muted-foreground uppercase tracking-wider">Today's Expenses</span>
                                                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                                    {fmt(dailyData.expenseSummary.todayExpenses)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <Separator />
                                    <div className="p-6 bg-emerald-500/5">
                                        <div className="flex justify-between items-end">
                                            <span className="text-sm font-semibold text-muted-foreground">Closing Cash Reserve</span>
                                            <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{fmt(dailyData.financialSummary.closingCashReserve)}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Today's Transactions Summary */}
                            <Card className="overflow-hidden border-border/50 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-background to-indigo-50/10 dark:to-indigo-900/10">
                                <CardHeader className="bg-indigo-500/5 border-b border-border/50 pb-4">
                                    <CardTitle className="text-indigo-600 dark:text-indigo-400 flex justify-between items-center">
                                        Cash Flow Details
                                        <span className="text-xs font-normal text-muted-foreground bg-background/50 px-2 py-1 rounded-full border">Daily Flow</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="p-6 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">Total Cash Inflow (Receipts)</span>
                                            <span className="text-md font-semibold text-green-600">+{fmt(dailyData.customerSummary.receipts)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">Total Cash Outflow (Payments)</span>
                                            <span className="text-md font-semibold text-red-600">-{fmt(dailyData.supplierSummary.payments)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">Total Expenses</span>
                                            <span className="text-md font-semibold text-red-600">-{fmt(dailyData.expenseSummary.todayExpenses)}</span>
                                        </div>
                                        <Separator className="my-2" />
                                        <div className="flex justify-between items-center bg-indigo-100/20 p-3 rounded-lg">
                                            <span className="text-sm font-medium text-muted-foreground">Net Cash Flow</span>
                                            <span className={cn(
                                                "text-lg font-bold",
                                                (dailyData.customerSummary.receipts - dailyData.supplierSummary.payments - dailyData.expenseSummary.todayExpenses) >= 0
                                                    ? "text-green-600"
                                                    : "text-red-600"
                                            )}>
                                                {fmt(dailyData.customerSummary.receipts - dailyData.supplierSummary.payments - dailyData.expenseSummary.todayExpenses)}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );
}
