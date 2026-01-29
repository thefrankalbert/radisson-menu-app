"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
    className?: string;
    dark?: boolean;
}

export default function Skeleton({ className, dark = false }: SkeletonProps) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-md",
                dark ? "bg-zinc-800/50" : "bg-muted",
                className
            )}
        />
    );
}

export function StatsCardSkeleton() {
    return (
        <div className="bg-card rounded-md p-6 border border-border space-y-4">
            <div className="flex items-center justify-between">
                <Skeleton className="w-10 h-10 rounded-md" />
                <Skeleton className="w-16 h-3" />
            </div>
            <div className="space-y-2">
                <Skeleton className="w-24 h-6 px-1" />
                <Skeleton className="w-full h-2.5" />
            </div>
        </div>
    );
}

export function TableRowSkeleton() {
    return (
        <div className="flex items-center space-x-6 py-3 px-6 border-b border-border last:border-0">
            <Skeleton className="w-10 h-10 rounded-md flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
                <Skeleton className="w-1/3 h-3.5" />
                <Skeleton className="w-1/4 h-2.5" />
            </div>
            <Skeleton className="w-16 h-5 rounded-full" />
            <Skeleton className="w-20 h-8 rounded-md" />
        </div>
    );
}

export function ListPageSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="w-40 h-10 rounded-md" />
            </div>

            <div className="flex items-center space-x-4 p-4 bg-card rounded-md border border-border">
                <Skeleton className="w-4 h-4 rounded-full" />
                <Skeleton className="h-8 w-64 rounded-md" />
                <Skeleton className="ml-auto w-20 h-3 rounded-md" />
            </div>

            <div className="bg-card rounded-md border border-border overflow-hidden">
                <div className="p-4 border-b border-border flex space-x-8">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-16" />
                </div>
                <div className="p-0">
                    {[1, 2, 3, 4, 5].map(i => <TableRowSkeleton key={i} />)}
                </div>
            </div>
        </div>
    );
}

// Dark mode skeleton for KDS (Kitchen Display System)
export function KDSSkeleton() {
    return (
        <div className="min-h-screen bg-black flex flex-col">
            <div className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-900">
                <div className="flex items-center gap-3">
                    <Skeleton dark className="w-5 h-5 rounded-sm" />
                    <Skeleton dark className="w-32 h-4 rounded-sm" />
                </div>
                <div className="flex items-center gap-4">
                    <Skeleton dark className="w-8 h-8 rounded-sm" />
                    <Skeleton dark className="w-8 h-8 rounded-sm" />
                    <Skeleton dark className="w-8 h-8 rounded-sm" />
                </div>
            </div>
            <div className="flex-1 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-zinc-900 border border-zinc-700 rounded-md overflow-hidden">
                            <Skeleton dark className="h-1 w-full rounded-none" />
                            <div className="p-4 space-y-4">
                                <div className="flex justify-between">
                                    <div className="space-y-1">
                                        <Skeleton dark className="w-12 h-3 rounded-sm" />
                                        <Skeleton dark className="w-16 h-8 rounded-sm" />
                                    </div>
                                    <Skeleton dark className="w-16 h-6 rounded-sm" />
                                </div>
                                <div className="space-y-3">
                                    {[1, 2, 3].map(j => (
                                        <div key={j} className="flex items-center gap-3">
                                            <Skeleton dark className="w-7 h-7 rounded-sm" />
                                            <Skeleton dark className="flex-1 h-4 rounded-sm" />
                                        </div>
                                    ))}
                                </div>
                                <Skeleton dark className="w-full h-10 rounded-md" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// POS (Point of Sale) skeleton
export function POSSkeleton() {
    return (
        <div className="h-screen flex bg-muted/30">
            <div className="flex-1 p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="w-48 h-8 rounded-md" />
                    <Skeleton className="w-32 h-10 rounded-md" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} className="bg-card rounded-md p-4 border border-border space-y-3">
                            <Skeleton className="w-full h-24 rounded-md" />
                            <Skeleton className="w-3/4 h-4 rounded-sm" />
                            <Skeleton className="w-1/2 h-5 rounded-sm" />
                        </div>
                    ))}
                </div>
            </div>
            <div className="w-96 bg-card border-l border-border p-6 space-y-4">
                <Skeleton className="w-full h-8 rounded-md" />
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center gap-3">
                            <Skeleton className="w-12 h-12 rounded-md" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="w-3/4 h-4 rounded-sm" />
                                <Skeleton className="w-1/2 h-3 rounded-sm" />
                            </div>
                        </div>
                    ))}
                </div>
                <Skeleton className="w-full h-12 rounded-md mt-auto" />
            </div>
        </div>
    );
}

// Settings page skeleton
export function SettingsSkeleton() {
    return (
        <div className="space-y-8">
            <div className="flex items-center gap-3 border-b border-border pb-4">
                {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="w-24 h-9 rounded-md" />
                ))}
            </div>
            <div className="bg-card rounded-md p-8 border border-border space-y-6">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="space-y-2">
                        <Skeleton className="w-32 h-3.5 rounded-sm" />
                        <Skeleton className="w-full h-10 rounded-md" />
                    </div>
                ))}
                <Skeleton className="w-40 h-10 rounded-md" />
            </div>
        </div>
    );
}

// Order detail skeleton
export function OrderDetailSkeleton() {
    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="w-48 h-8 rounded-md" />
                    <Skeleton className="w-32 h-4 rounded-sm" />
                </div>
                <Skeleton className="w-20 h-8 rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-card rounded-md p-6 border border-border space-y-2">
                    <Skeleton className="w-16 h-3 rounded-sm" />
                    <Skeleton className="w-24 h-6 rounded-sm" />
                </div>
                <div className="bg-card rounded-md p-6 border border-border space-y-2">
                    <Skeleton className="w-16 h-3 rounded-sm" />
                    <Skeleton className="w-32 h-6 rounded-sm" />
                </div>
            </div>
            <div className="bg-card rounded-md border border-border p-6 space-y-4">
                <Skeleton className="w-32 h-4 rounded-sm" />
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                        <div className="flex items-center gap-3">
                            <Skeleton className="w-8 h-8 rounded-md" />
                            <Skeleton className="w-40 h-4 rounded-sm" />
                        </div>
                        <Skeleton className="w-16 h-4 rounded-sm" />
                    </div>
                ))}
            </div>
        </div>
    );
}

// QR Code page skeleton
export function QRCodeSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Skeleton className="w-64 h-7 rounded-md" />
                <Skeleton className="w-40 h-10 rounded-md" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="bg-card rounded-md p-6 border border-border space-y-4">
                        <Skeleton className="w-full aspect-square rounded-md" />
                        <Skeleton className="w-3/4 h-4 rounded-sm mx-auto" />
                        <div className="flex gap-2">
                            <Skeleton className="flex-1 h-9 rounded-md" />
                            <Skeleton className="flex-1 h-9 rounded-md" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
