"use client";

import { ReactNode, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Toaster } from "react-hot-toast";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminClientShell({
    children,
    user
}: {
    children: ReactNode;
    user: any;
}) {
    const pathname = usePathname();
    const isLoginPage = pathname === "/admin/login";
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Fermer la sidebar quand la route change
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [pathname]);

    if (isLoginPage) {
        return (
            <>
                <Toaster position="top-right" />
                <div className="min-h-screen bg-white">
                    {children}
                </div>
            </>
        );
    }

    return (
        <div className="flex h-screen bg-white overflow-hidden relative">
            <Toaster position="top-right" />

            {/* Mobile Menu Button - Floating */}
            <button
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#003058] text-white rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-transform"
            >
                <Menu className="w-6 h-6" />
            </button>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsSidebarOpen(false)}
                            className="fixed inset-0 bg-[#003058]/40 backdrop-blur-sm z-[100] md:hidden"
                        />
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 w-[280px] z-[101] md:hidden shadow-2xl overflow-hidden"
                        >
                            <Sidebar />
                            {/* Close button inside sidebar for mobile */}
                            <button
                                onClick={() => setIsSidebarOpen(false)}
                                className="absolute top-8 right-6 text-white/40 hover:text-white"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar */}
            <aside className="w-[280px] flex-shrink-0 hidden md:block border-r border-slate-100">
                <Sidebar />
            </aside>

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F5F5F5]/30">
                {/* Header - Dynamique */}
                <Header />

                {/* Contenu principal scrollable */}
                <main className="flex-1 overflow-y-auto p-6 md:p-10 relative custom-scrollbar">
                    <div className="max-w-7xl mx-auto">
                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {children}
                        </motion.div>
                    </div>
                </main>
            </div>
        </div>
    );
}
