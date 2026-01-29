"use client";

import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

type StatsCardProps = {
    title: string;
    value: string | number;
    icon?: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    color?: string; // Kept for compatibility but largely unused for background
    subtitle?: string;
};

export default function StatsCard({
    title,
    value,
    icon: Icon,
    trend,
    subtitle,
    color = "blue" // Default color, mapped below
}: StatsCardProps) {
    // Map colors to styles
    const colors: Record<string, string> = {
        blue: "text-blue-600 bg-blue-50 border-blue-100",
        green: "text-emerald-600 bg-emerald-50 border-emerald-100",
        orange: "text-orange-600 bg-orange-50 border-orange-100",
        purple: "text-purple-600 bg-purple-50 border-purple-100",
        gold: "text-amber-600 bg-amber-50 border-amber-100",
    };

    const activeColor = colors[color] || colors.blue;

    return (
        <div className="bg-white border border-gray-100 rounded-xl p-6 flex flex-col justify-between h-full hover:bg-gray-50/50 transition-colors duration-300">
            <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                        {title}
                    </h3>
                    <div className="text-3xl font-black text-gray-900 tracking-tight">
                        {value}
                    </div>
                </div>

                {Icon && (
                    <div className={`p-3 rounded-xl ${activeColor.split(' ')[1]} ${activeColor.split(' ')[0]}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2 mt-auto pt-2">
                {trend && (
                    <div className={cn(
                        "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold",
                        trend.isPositive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                    )}>
                        {trend.isPositive ? (
                            <TrendingUp className="w-3 h-3" />
                        ) : (
                            <TrendingDown className="w-3 h-3" />
                        )}
                        <span>{trend.value}%</span>
                    </div>
                )}
                {subtitle && (
                    <span className="text-xs text-gray-400 font-medium ml-auto">
                        {subtitle}
                    </span>
                )}
            </div>
        </div>
    );
}
