"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
    className?: string;
}

export default function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-2xl bg-slate-200/50",
                className
            )}
        />
    );
}

export function StatsCardSkeleton() {
    return (
        <div className="bg-white rounded-[2rem] p-8 border border-[#F5F5F5] space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
                <Skeleton className="w-12 h-12 rounded-2xl" />
                <Skeleton className="w-16 h-4" />
            </div>
            <div className="space-y-2">
                <Skeleton className="w-24 h-8" />
                <Skeleton className="w-full h-3" />
            </div>
        </div>
    );
}

export function TableRowSkeleton() {
    return (
        <div className="flex items-center space-x-6 py-4 px-6 border-b border-slate-50 last:border-0 opacity-50">
            <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <Skeleton className="w-1/3 h-4" />
                <Skeleton className="w-1/4 h-3" />
            </div>
            <Skeleton className="w-20 h-6 rounded-full" />
            <Skeleton className="w-24 h-10 rounded-xl" />
        </div>
    );
}
