"use client";

import { usePathname } from "next/navigation";
import { User, Bell, ChevronDown, LogOut, Settings } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/context/LanguageContext";
import type { AuthUser } from "@/types/auth";

type TranslateFunction = (key: string) => string;

const getPageTitle = (pathname: string, t: TranslateFunction): string => {
    const pathPrefix = pathname.split('/').slice(0, 3).join('/');
    const titles: Record<string, string> = {
        "/admin": t('dashboard'),
        "/admin/orders": t('orders_mgmt'),
        "/admin/cards": t('menus_mgmt'),
        "/admin/items": t('dishes_mgmt'),
        "/admin/announcements": t('announcements_mgmt'),
        "/admin/qrcodes": t('qr_generator'),
        "/admin/settings": t('sys_settings'),
        "/admin/pos": t('pos_caisse'),
        "/admin/kitchen": t('kitchen_kds'),
        "/admin/reports": t('revenue_day'),
        "/admin/users": t('team')
    };
    return titles[pathPrefix] || titles[pathname] || "Admin Hub";
};

interface HeaderProps {
    user?: AuthUser | null;
}

export default function Header({ user }: HeaderProps) {
    const pathname = usePathname();
    const { t } = useLanguage();
    const [showProfile, setShowProfile] = useState(false);

    const currentTitle = getPageTitle(pathname, t);

    return (
        <header className="h-16 bg-background border-b border-border flex items-center justify-between px-6 sticky top-0 z-30 font-sans">
            <div className="flex flex-col">
                <h1 className="text-sm font-semibold text-foreground tracking-tight">{currentTitle}</h1>
            </div>

            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                    <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-all relative group">
                        <Bell className="w-4 h-4" />
                        <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary rounded-full border border-background"></span>
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => setShowProfile(!showProfile)}
                            className="flex items-center space-x-2 p-1 pl-2 rounded-md hover:bg-accent transition-all border border-transparent"
                        >
                            <div className="text-right hidden sm:block">
                                <p className="text-[11px] font-semibold text-foreground leading-none">{user?.email === 'admin@bluetable.com' ? 'Super Admin' : 'Admin'}</p>
                            </div>
                            <div className="relative">
                                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-primary-foreground" />
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border border-background rounded-full" />
                            </div>
                            <ChevronDown className={cn("w-3 h-3 text-muted-foreground transition-transform duration-300", showProfile ? "rotate-180" : "")} />
                        </button>

                        <AnimatePresence>
                            {showProfile && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                                    className="absolute right-0 mt-2 w-56 bg-background rounded-md border border-border p-1 shadow-none z-50 animate-in fade-in zoom-in duration-200"
                                >
                                    <div className="px-3 py-2 border-b border-border mb-1">
                                        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Session active</p>
                                        <p className="text-xs font-semibold text-foreground truncate">{user?.email || 'admin@bluetable.com'}</p>
                                    </div>

                                    <button className="w-full flex items-center space-x-2 px-3 py-2 rounded-sm hover:bg-accent text-sm text-muted-foreground hover:text-foreground transition-colors group">
                                        <User className="w-3.5 h-3.5" />
                                        <span>Profil</span>
                                    </button>

                                    <button className="w-full flex items-center space-x-2 px-3 py-2 rounded-sm hover:bg-accent text-sm text-muted-foreground hover:text-foreground transition-colors group">
                                        <Settings className="w-3.5 h-3.5" />
                                        <span>Paramètres</span>
                                    </button>

                                    <div className="my-1 border-t border-border" />

                                    <button
                                        onClick={async () => {
                                            await supabase.auth.signOut();
                                            window.location.replace('/admin/login');
                                        }}
                                        className="w-full flex items-center space-x-2 px-3 py-2 rounded-sm hover:bg-destructive/10 text-sm text-destructive transition-colors group"
                                    >
                                        <LogOut className="w-3.5 h-3.5" />
                                        <span>{t('logout')}</span>
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </header>
    );
}
