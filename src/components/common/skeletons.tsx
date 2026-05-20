import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function TableSkeleton() {
    return (
        <div className="flex flex-col gap-5">
            <Card>
                <CardHeader className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-[200px]" />
                        <Skeleton className="h-4 w-[250px]" />
                    </div>
                    <Skeleton className="h-10 w-full sm:w-[250px]" />
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <div className="h-12 border-b bg-muted/50 px-4 flex items-center">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Skeleton key={i} className="h-4 w-[100px] mr-4" />
                            ))}
                        </div>
                        {[1, 2, 3, 4, 5, 6, 7].map((row) => (
                            <div key={row} className="h-16 px-4 flex items-center border-b last:border-0">
                                <Skeleton className="h-4 w-[100px] mr-4" />
                                <Skeleton className="h-4 w-[150px] mr-4" />
                                <Skeleton className="h-4 w-full" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export function FormSkeleton() {
    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="mb-6 space-y-2">
                <Skeleton className="h-10 w-[300px]" />
                <Skeleton className="h-5 w-[400px]" />
            </div>

            <Card className="p-6">
                <Skeleton className="h-8 w-[200px] mb-6" />
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-[100px]" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-[100px]" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-[100px]" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-[100px]" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </div>
            </Card>

            <Card className="p-6">
                <Skeleton className="h-8 w-[200px] mb-6" />
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-[200px] w-full" />
                </div>
            </Card>

            <div className="flex justify-end gap-4">
                <Skeleton className="h-10 w-[100px]" />
                <Skeleton className="h-10 w-[150px]" />
            </div>
        </div>
    );
}

export function DashboardSkeleton() {
    return (
        <div className="min-h-screen bg-background p-4 md:p-6">
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 space-y-6 md:space-y-8">
                    <Skeleton className="h-32 w-full rounded-2xl" />

                    <div className="space-y-6">
                        <div className="w-full h-[400px] border rounded-lg p-4">
                            <Skeleton className="h-full w-full" />
                        </div>
                        <div className="w-full h-[300px] border rounded-lg p-4">
                            <Skeleton className="h-full w-full" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Skeleton className="h-32 w-full rounded-lg" />
                        <Skeleton className="h-32 w-full rounded-lg" />
                        <Skeleton className="h-32 w-full rounded-lg" />
                    </div>
                </div>

                <div className="w-full lg:w-80 space-y-8">
                    <Skeleton className="h-[400px] w-full rounded-lg" />
                    <Skeleton className="h-[300px] w-full rounded-lg" />
                </div>
            </div>
        </div>
    );
}
