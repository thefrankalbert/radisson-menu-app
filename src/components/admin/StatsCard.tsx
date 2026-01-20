"use client";

import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

type StatsCardProps = {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    color?: "blue" | "gold" | "green" | "red" | "purple" | "orange";
    subtitle?: string;
};

const colorStyles = {
    blue: {
        bg: "bg-gradient-to-br from-blue-500 to-blue-600",
        iconBg: "bg-white/20",
        light: "bg-blue-50",
        iconLight: "text-blue-600",
        border: "border-blue-100",
    },
    gold: {
        bg: "bg-gradient-to-br from-amber-400 to-amber-500",
        iconBg: "bg-white/20",
        light: "bg-amber-50",
        iconLight: "text-amber-600",
        border: "border-amber-100",
    },
    green: {
        bg: "bg-gradient-to-br from-emerald-500 to-emerald-600",
        iconBg: "bg-white/20",
        light: "bg-emerald-50",
        iconLight: "text-emerald-600",
        border: "border-emerald-100",
    },
    red: {
        bg: "bg-gradient-to-br from-red-500 to-red-600",
        iconBg: "bg-white/20",
        light: "bg-red-50",
        iconLight: "text-red-500",
        border: "border-red-100",
    },
    purple: {
        bg: "bg-gradient-to-br from-violet-500 to-violet-600",
        iconBg: "bg-white/20",
        light: "bg-violet-50",
        iconLight: "text-violet-600",
        border: "border-violet-100",
    },
    orange: {
        bg: "bg-gradient-to-br from-orange-500 to-orange-600",
        iconBg: "bg-white/20",
        light: "bg-orange-50",
        iconLight: "text-orange-600",
        border: "border-orange-100",
    },
};

export default function StatsCard({
    title,
    value,
    icon: Icon,
    trend,
    color = "blue",
    subtitle,
}: StatsCardProps) {
    const style = colorStyles[color];

    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-default",
                style.bg
            )}
        >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8">
                <div className="w-full h-full rounded-full bg-white/10" />
            </div>
            <div className="absolute bottom-0 left-0 w-24 h-24 transform -translate-x-8 translate-y-8">
                <div className="w-full h-full rounded-full bg-white/5" />
            </div>

            {/* Content */}
            <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                    <div className={cn("p-3 rounded-xl", style.iconBg)}>
                        <Icon className="w-6 h-6 text-white" />
                    </div>

                    {trend && (
                        <div className={cn(
                            "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold",
                            trend.isPositive
                                ? "bg-white/20 text-white"
                                : "bg-red-100/20 text-white"
                        )}>
                            {trend.isPositive ? (
                                <TrendingUp className="w-3.5 h-3.5" />
                            ) : (
                                <TrendingDown className="w-3.5 h-3.5" />
                            )}
                            <span>{trend.isPositive ? "+" : ""}{trend.value}%</span>
                        </div>
                    )}
                </div>

                <div>
                    <h3 className="text-3xl font-black text-white tracking-tight">
                        {value}
                    </h3>
                    <p className="text-white/80 text-sm font-medium mt-1">
                        {title}
                    </p>
                    {subtitle && (
                        <p className="text-white/60 text-xs mt-0.5">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

// Version alternative avec fond blanc
export function StatsCardLight({
    title,
    value,
    icon: Icon,
    trend,
    color = "blue",
    subtitle,
}: StatsCardProps) {
    const style = colorStyles[color];

    return (
        <div
            className={cn(
                "relative overflow-hidden bg-white rounded-2xl p-5 border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-default",
                style.border
            )}
        >
            {/* Content */}
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-gray-500 text-sm font-medium mb-1">
                        {title}
                    </p>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                        {value}
                    </h3>
                    {subtitle && (
                        <p className="text-gray-400 text-xs mt-1">
                            {subtitle}
                        </p>
                    )}

                    {trend && (
                        <div className={cn(
                            "flex items-center gap-1 mt-3 text-xs font-bold",
                            trend.isPositive ? "text-emerald-600" : "text-red-500"
                        )}>
                            {trend.isPositive ? (
                                <TrendingUp className="w-3.5 h-3.5" />
                            ) : (
                                <TrendingDown className="w-3.5 h-3.5" />
                            )}
                            <span>{trend.isPositive ? "+" : ""}{trend.value}% vs hier</span>
                        </div>
                    )}
                </div>

                <div className={cn("p-3 rounded-xl", style.light)}>
                    <Icon className={cn("w-6 h-6", style.iconLight)} />
                </div>
            </div>
        </div>
    );
}
