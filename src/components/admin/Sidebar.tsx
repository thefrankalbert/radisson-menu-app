"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    ShoppingBag,
    ChefHat,
    BookOpen,
    Folder,
    UtensilsCrossed,
    Megaphone,
    QrCode,
    BarChart3,
    Settings,
    LogOut,
    CreditCard,
    Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@supabase/supabase-js";
import { toast } from "react-hot-toast";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Structure du menu avec groupes
const menuGroups = [
    {
        items: [
            { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
            { icon: CreditCard, label: "Caisse (POS)", href: "/admin/pos", highlight: true },
        ]
    },
    {
        title: "Commandes",
        items: [
            { icon: ShoppingBag, label: "Commandes", href: "/admin/orders" },
            { icon: ChefHat, label: "Cuisine (KDS)", href: "/admin/kitchen" },
        ]
    },
    {
        title: "Menu",
        items: [
            { icon: BookOpen, label: "Cartes", href: "/admin/cards" },
            { icon: Folder, label: "Catégories", href: "/admin/categories" },
            { icon: UtensilsCrossed, label: "Plats", href: "/admin/items" },
        ]
    },
    {
        title: "Marketing",
        items: [
            { icon: Megaphone, label: "Annonces", href: "/admin/announcements" },
            { icon: QrCode, label: "QR Codes", href: "/admin/qrcodes" },
        ]
    },
    {
        title: "Back Office",
        items: [
            { icon: BarChart3, label: "Rapports", href: "/admin/reports" },
            { icon: Users, label: "Utilisateurs", href: "/admin/users" },
            { icon: Settings, label: "Paramètres", href: "/admin/settings" },
        ]
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            toast.success("Déconnexion réussie");
            router.push("/admin/login");
            router.refresh();
        } catch (error: any) {
            toast.error("Erreur lors de la déconnexion");
        }
    };

    return (
        <div className="w-full h-full bg-white flex flex-col border-r border-gray-100">
            {/* Logo Section */}
            <div className="p-6 border-b border-gray-100">
                <Link href="/admin" className="flex items-center space-x-3 group">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#003058] to-[#004a87] rounded-xl flex items-center justify-center shadow-lg shadow-[#003058]/20 group-hover:shadow-[#003058]/30 transition-shadow">
                        <span className="text-white font-black text-lg">R</span>
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-900 text-sm">Radisson Blu</h2>
                        <p className="text-[10px] text-[#C5A065] font-semibold uppercase tracking-wider">N'Djamena</p>
                    </div>
                </Link>
            </div>

            {/* User Profile Mini */}
            <div className="px-4 py-3 mx-3 mt-3 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl border border-gray-100">
                <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#C5A065] to-[#a8864f] flex items-center justify-center text-white font-bold text-sm shadow-md">
                        AD
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">Admin</p>
                        <p className="text-[10px] text-gray-500 truncate">Super Admin</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 custom-scrollbar">
                {menuGroups.map((group, groupIndex) => (
                    <div key={groupIndex}>
                        {group.title && (
                            <p className="px-3 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
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
                                        className={cn(
                                            "group flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative",
                                            isActive
                                                ? "bg-[#003058] text-white shadow-lg shadow-[#003058]/25"
                                                : isHighlight
                                                    ? "bg-gradient-to-r from-orange-50 to-amber-50 text-orange-600 border border-orange-200 hover:border-orange-300"
                                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        )}
                                    >
                                        <item.icon className={cn(
                                            "w-[18px] h-[18px] transition-transform group-hover:scale-110",
                                            isActive ? "text-white" : isHighlight ? "text-orange-500" : "text-gray-400 group-hover:text-gray-600"
                                        )} />
                                        <span className="font-medium text-[13px]">{item.label}</span>

                                        {isHighlight && !isActive && (
                                            <span className="ml-auto w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Bottom Section */}
            <div className="p-3 border-t border-gray-100">
                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all group"
                >
                    <LogOut className="w-[18px] h-[18px] transition-transform group-hover:-translate-x-0.5" />
                    <span className="font-medium text-[13px]">Déconnexion</span>
                </button>
            </div>

            {/* Custom Scrollbar Styles */}
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e5e7eb;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #d1d5db;
                }
            `}</style>
        </div>
    );
}
