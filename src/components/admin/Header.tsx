"use client";

import { usePathname } from "next/navigation";
import { User, Bell, Search, ChevronDown, LogOut, Settings } from "lucide-react";
import LanguageSwitch from "./LanguageSwitch";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const pageTitles: { [key: string]: string } = {
    "/admin": "Tableau de Bord",
    "/admin/orders": "Gestion des Commandes",
    "/admin/cards": "Cartes & Menus",
    "/admin/items": "Gestion des Plats",
    "/admin/announcements": "Annonces & Pub",
    "/admin/qrcodes": "Générateur QR Codes",
    "/admin/settings": "Paramètres Système",
};

export default function Header() {
    const pathname = usePathname();
    const [showProfile, setShowProfile] = useState(false);
    const currentTitle = pageTitles[pathname] || "Admin Hub";

    return (
        <header className="h-24 bg-white border-b border-[#F5F5F5] flex items-center justify-between px-10 sticky top-0 z-30 shadow-sm">
            <div className="flex flex-col">
                <h1 className="text-2xl font-black text-[#003058] tracking-tight">
                    {currentTitle}
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                    <span className="w-1.5 h-1.5 bg-[#C5A065] rounded-full" />
                    <span className="text-[10px] text-[#C5A065] font-black uppercase tracking-widest">
                        Radisson Blu N&apos;Djamena
                    </span>
                </div>
            </div>

            <div className="flex items-center space-x-8">
                <div className="hidden lg:flex items-center bg-[#F5F5F5] px-5 py-3 rounded-2xl w-80 group focus-within:ring-2 focus-within:ring-[#C5A065]/20 focus-within:bg-white transition-all border border-transparent focus-within:border-[#C5A065]/10">
                    <Search className="w-5 h-5 text-slate-400 mr-3 group-focus-within:text-[#C5A065] transition-colors" />
                    <input
                        type="text"
                        placeholder="Recherche rapide..."
                        className="bg-transparent border-none focus:ring-0 text-sm font-bold text-[#003058] w-full placeholder:text-slate-400 placeholder:font-medium"
                    />
                </div>

                <div className="flex items-center space-x-6">
                    <div className="border-r border-slate-100 pr-6">
                        <LanguageSwitch />
                    </div>

                    <button className="p-3 text-slate-400 hover:text-[#003058] hover:bg-slate-50 rounded-xl transition-all relative group">
                        <Bell className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                        <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white shadow-sm animate-bounce"></span>
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => setShowProfile(!showProfile)}
                            className="flex items-center space-x-4 p-2 pl-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
                        >
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-black text-[#003058]">Admin Manager</p>
                                <p className="text-[10px] text-[#C5A065] font-bold uppercase tracking-tight">Superutilisateur</p>
                            </div>
                            <div className="relative">
                                <div className="w-12 h-12 bg-gradient-to-br from-[#003058] to-[#004a80] rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/10">
                                    <User className="w-6 h-6 text-white" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full" />
                            </div>
                            <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-300", showProfile ? "rotate-180" : "")} />
                        </button>

                        <AnimatePresence>
                            {showProfile && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 mt-4 w-64 bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-3 z-50 overflow-hidden"
                                >
                                    <div className="p-4 border-b border-slate-50 mb-2">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Session active</p>
                                        <p className="text-sm font-black text-[#003058]">admin@radisson.com</p>
                                    </div>

                                    <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors group">
                                        <User className="w-4 h-4 text-slate-400 group-hover:text-[#003058]" />
                                        <span className="text-sm font-bold group-hover:text-[#003058]">Profil Personnel</span>
                                    </button>

                                    <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors group">
                                        <Settings className="w-4 h-4 text-slate-400 group-hover:text-[#003058]" />
                                        <span className="text-sm font-bold group-hover:text-[#003058]">Mes Paramètres</span>
                                    </button>

                                    <div className="my-2 border-t border-slate-50" />

                                    <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-red-50 text-red-500 transition-colors group">
                                        <LogOut className="w-4 h-4" />
                                        <span className="text-sm font-bold tracking-wide">Déconnexion</span>
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

function cn(...classes: string[]) {
    return classes.filter(Boolean).join(" ");
}
