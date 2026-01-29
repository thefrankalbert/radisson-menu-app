"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    ClipboardList,
    BookOpen,
    QrCode,
    Settings,
    LogOut,
    ChefHat,
    Megaphone,
    Utensils,
    Laptop,
    ChevronRight,
    BarChart3,
    History as HistoryIcon,
    Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { useLanguage } from "@/context/LanguageContext";
import type { AuthUser } from "@/types/auth";

interface SidebarProps {
    user?: AuthUser | null;
    isCollapsed?: boolean;
    onToggle?: () => void;
}

export default function Sidebar({ user, isCollapsed = false, onToggle }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { t } = useLanguage();

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            toast.success("Déconnexion réussie");
            window.location.replace("/admin/login");
        } catch (error: any) {
            window.location.replace("/admin/login");
        }
    };

    const adminGroups = [
        {
            title: "Principal",
            items: [
                { href: "/admin", icon: LayoutDashboard, label: t('dashboard') },
                { href: "/admin/orders", icon: ClipboardList, label: t('orders_mgmt') },
            ]
        },
        {
            title: "Organisation",
            items: [
                { href: "/admin/cards", icon: Utensils, label: t('menus_mgmt') },
                { href: "/admin/items", icon: BookOpen, label: t('dishes_mgmt') },
                { href: "/admin/announcements", icon: Megaphone, label: t('announcements_mgmt') },
            ]
        },
        {
            title: "Outils",
            items: [
                { href: "/admin/pos", icon: Laptop, label: t('pos_caisse'), highlight: true },
                { href: "/admin/kitchen", icon: ChefHat, label: t('kitchen_kds'), highlight: true },
                { href: "/admin/qrcodes", icon: QrCode, label: t('qr_generator') },
                { href: "/admin/reports", icon: BarChart3, label: "Rapports" },
            ]
        },
        {
            title: t('sys_settings'),
            items: [
                { href: "/admin/settings", icon: Settings, label: t('sys_settings') },
                { href: "/admin/logs", icon: HistoryIcon, label: t('audit_logs') || "Journal" },
            ]
        }
    ];

    return (
        <div className={cn(
            "h-full bg-background flex flex-col border-r border-border transition-all duration-300 relative",
            isCollapsed ? "w-[80px]" : "w-full"
        )}>
            {/* Toggle Button for Desktop */}
            <button
                onClick={onToggle}
                className="absolute -right-3 top-20 w-6 h-6 bg-background border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground shadow-none z-50 hidden md:flex"
            >
                <ChevronRight className={cn("w-3 h-3 transition-transform text-muted-foreground", !isCollapsed && "rotate-180")} />
            </button>

            {/* Logo Section */}
            <div className={cn("p-6 border-b border-border", isCollapsed && "px-0 flex justify-center")}>
                <Link href="/admin" className="flex items-center space-x-3 group">
                    <div className="w-10 h-10 bg-primary rounded-md flex items-center justify-center transition-all shrink-0">
                        <span className="text-primary-foreground font-black text-lg">R</span>
                    </div>
                    {!isCollapsed && (
                        <div>
                            <h2 className="font-bold text-foreground text-sm tracking-tight uppercase">Radisson Blu</h2>
                        </div>
                    )}
                </Link>
            </div>


            {/* Navigation */}
            <nav className={cn("flex-1 min-h-0 overflow-y-auto py-4 px-3 space-y-6 custom-scrollbar", isCollapsed && "px-2")}>
                {adminGroups.map((group, groupIndex) => (
                    <div key={groupIndex}>
                        {group.title && !isCollapsed && (
                            <p className="px-3 mb-2 text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                                {group.title}
                            </p>
                        )}
                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const isActive = pathname === item.href ||
                                    (item.href === "/admin" && pathname === "/admin/dashboard");
                                const isHighlight = 'highlight' in item && item.highlight;

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        title={isCollapsed ? item.label : undefined}
                                        className={cn(
                                            "group flex items-center px-4 py-2.5 rounded-md transition-all duration-200 relative",
                                            isActive
                                                ? "bg-accent text-accent-foreground font-semibold"
                                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground font-medium",
                                            isCollapsed ? "justify-center px-0" : "space-x-3",
                                            isHighlight && !isActive && !isCollapsed && "bg-blue-50/50 border-blue-100/50 border"
                                        )}
                                    >
                                        <item.icon className={cn(
                                            "w-[18px] h-[18px] transition-transform group-hover:scale-105",
                                            isActive ? "text-accent-foreground" :
                                                isHighlight ? "text-blue-600" : "text-muted-foreground group-hover:text-accent-foreground"
                                        )} />
                                        {!isCollapsed && (
                                            <span className={cn(
                                                "text-sm tracking-tight leading-none",
                                                isHighlight && !isActive && "text-blue-900 font-bold"
                                            )}>
                                                {item.label}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Bottom Section */}
            <div className={cn("p-4 border-t border-border", isCollapsed && "px-2")}>
                <button
                    onClick={handleLogout}
                    title={isCollapsed ? t('logout') : undefined}
                    className={cn(
                        "w-full flex items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all group py-2.5",
                        isCollapsed ? "justify-center" : "px-4 space-x-3"
                    )}
                >
                    <LogOut className="w-[18px] h-[18px] text-muted-foreground group-hover:text-destructive" />
                    {!isCollapsed && <span className="font-medium text-sm tracking-tight">{t('logout')}</span>}
                </button>
            </div>
        </div>
    );
}
