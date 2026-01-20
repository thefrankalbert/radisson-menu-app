"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
    BarChart3,
    Utensils,
    Calendar,
    Settings,
    Palette,
    LogOut,
    ChevronRight,
    LayoutDashboard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const menuItems = [
    { icon: LayoutDashboard, label: "Vue d'ensemble", href: "/admin" },
    { icon: Utensils, label: "Restaurants", href: "/admin/restaurants" },
    { icon: Calendar, label: "Événements", href: "/admin/events" },
    { icon: Palette, label: "Branding", href: "/admin/branding" },
    { icon: Settings, label: "Paramètres", href: "/admin/settings" },
];

export function AdminSidebar() {
    const pathname = usePathname();

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 w-64 p-4 gap-4">
            <div className="flex items-center gap-2 px-2 py-6">
                <div className="w-10 h-10 bg-[#002855] rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
                    <span className="text-white font-bold text-xl">R</span>
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-lg leading-tight tracking-tight dark:text-white">Radisson Blu</span>
                    <span className="text-xs text-slate-500 font-medium">ADMIN HUB</span>
                </div>
            </div>

            <nav className="flex-1 flex flex-col gap-2 pt-4">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href || (item.href === "/admin" && pathname === "/admin/dashboard");
                    return (
                        <Link key={item.href} href={item.href}>
                            <div className={cn(
                                "group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 relative overflow-hidden",
                                isActive
                                    ? "bg-[#002855] text-white shadow-md shadow-blue-900/20"
                                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                            )}>
                                <item.icon className={cn("w-5 h-5 transition-transform duration-300 group-hover:scale-110", isActive ? "text-white" : "group-hover:text-[#002855] dark:group-hover:text-blue-400")} />
                                <span className="font-semibold text-[15px]">{item.label}</span>

                                {isActive && (
                                    <motion.div
                                        layoutId="sidebarActive"
                                        className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-none"
                                        initial={{ x: "-100%" }}
                                        animate={{ x: "0%" }}
                                        transition={{ duration: 0.5 }}
                                    />
                                )}
                            </div>
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="mb-4 px-2 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden border-2 border-slate-100 dark:border-slate-700">
                        <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold">
                            AD
                        </div>
                    </div>
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-bold truncate dark:text-white">Admin Radisson</span>
                        <span className="text-[10px] text-slate-500 truncate">admin@radisson.com</span>
                    </div>
                </div>
                <Button variant="ghost" className="w-full justify-start gap-3 rounded-2xl text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 h-12">
                    <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                    <span className="font-semibold">Déconnexion</span>
                </Button>
            </div>
        </div>
    );
}
