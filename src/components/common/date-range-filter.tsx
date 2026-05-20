"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import {
    format,
    subDays,
    startOfToday,
    startOfMonth,
    endOfMonth,
    subMonths,
} from "date-fns"
import { DateRange } from "react-day-picker"
import { useSearchParams, useRouter, usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export function DateRangeFilter({
    className,
    defaultDate
}: React.HTMLAttributes<HTMLDivElement> & { defaultDate?: DateRange }) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const from = searchParams.get("from")
    const to = searchParams.get("to")

    const parseDate = (str: string) => {
        const [y, m, d] = str.split("-").map(Number);
        return new Date(y, m - 1, d);
    }

    const [date, setDate] = React.useState<DateRange | undefined>(
        from && to
            ? {
                from: parseDate(from),
                to: parseDate(to),
            }
            : defaultDate
    )

    React.useEffect(() => {
        if (from && to) {
            setDate({
                from: parseDate(from),
                to: parseDate(to),
            })
        } else {
            setDate(defaultDate)
        }
    }, [from, to, defaultDate])

    const handleSelect = (selectedDate: DateRange | undefined) => {
        setDate(selectedDate)

        const params = new URLSearchParams(searchParams)
        if (selectedDate?.from) {
            params.set("from", format(selectedDate.from, "yyyy-MM-dd"))
        } else {
            params.delete("from")
        }

        if (selectedDate?.to) {
            params.set("to", format(selectedDate.to, "yyyy-MM-dd"))
        } else {
            params.delete("to")
        }

        // Reset page to 1 whenever filter changes
        params.set("page", "1")

        router.replace(`${pathname}?${params.toString()}`)
    }

    const presets = [
        {
            label: "Today",
            date: { from: startOfToday(), to: startOfToday() },
        },
        {
            label: "Yesterday",
            date: { from: subDays(startOfToday(), 1), to: subDays(startOfToday(), 1) },
        },
        {
            label: "Last 7 Days",
            date: { from: subDays(startOfToday(), 6), to: startOfToday() },
        },
        {
            label: "Last 30 Days",
            date: { from: subDays(startOfToday(), 29), to: startOfToday() },
        },
        {
            label: "This Month",
            date: { from: startOfMonth(startOfToday()), to: endOfMonth(startOfToday()) },
        },
        {
            label: "Last Month",
            date: {
                from: startOfMonth(subMonths(startOfToday(), 1)),
                to: endOfMonth(subMonths(startOfToday(), 1)),
            },
        },
    ]

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-[260px] justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "dd-MM-yy")} -{" "}
                                    {format(date.to, "dd-MM-yy")}
                                </>
                            ) : (
                                format(date.from, "dd-MM-yy")
                            )
                        ) : (
                            <span>Pick a date range</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <div className="flex">
                        <div className="flex flex-col gap-2 p-3 border-r">
                            {presets.map((preset) => (
                                <Button
                                    key={preset.label}
                                    variant="ghost"
                                    className="justify-start font-normal text-left w-full"
                                    onClick={() => handleSelect(preset.date)}
                                >
                                    {preset.label}
                                </Button>
                            ))}
                        </div>
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={date?.from}
                            selected={date}
                            onSelect={handleSelect}
                            numberOfMonths={2}
                        />
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
