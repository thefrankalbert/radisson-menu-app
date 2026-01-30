"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { toast } from "react-hot-toast";
import { ArrowRight, Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Client Supabase pour l'auth côté client (compatible SSR/Cookies)
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            toast.success("Connexion réussie");
            // Utiliser window.location pour forcer un rechargement complet et s'assurer que le middleware voit les cookies
            window.location.href = "/admin";
        } catch (error: any) {
            toast.error(error.message || "Erreur de connexion");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#001833] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#002C5F] via-[#001833] to-[#001020]" />

            {/* Subtle background elements */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#C5A065]/5 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#003058]/30 rounded-full blur-3xl" />

            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-md relative z-10"
            >
                {/* Card with dotted border effect */}
                <div className="relative">
                    {/* Dotted border decoration */}
                    <div className="absolute -inset-4 border-2 border-dashed border-[#C5A065]/20 rounded-[2rem]" />
                    <div className="absolute -inset-2 border border-dotted border-[#C5A065]/10 rounded-[1.75rem]" />

                    {/* Main card */}
                    <div className="bg-[#0a1929]/80 backdrop-blur-xl rounded-[1.5rem] border border-[#1a3a5c]/50 p-8 md:p-10 relative overflow-hidden">
                        {/* Inner glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-b from-[#C5A065]/5 via-transparent to-transparent pointer-events-none" />

                        {/* Content */}
                        <div className="relative z-10">
                            {/* Logo and Title */}
                            <div className="flex flex-col items-center mb-8">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                    className="w-14 h-14 bg-gradient-to-br from-[#C5A065] to-[#a08050] rounded-xl flex items-center justify-center mb-5 shadow-lg shadow-[#C5A065]/20"
                                >
                                    <span className="text-white font-black text-2xl">R</span>
                                </motion.div>
                                <h1 className="text-2xl font-bold text-white tracking-tight text-center">
                                    Admin Portal
                                </h1>
                                <p className="text-[#C5A065]/80 text-[11px] font-semibold uppercase tracking-[0.25em] mt-2">
                                    Radisson Blu Hub
                                </p>
                            </div>

                            <form onSubmit={handleLogin} className="space-y-5">
                                {/* Email Field */}
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full h-14 bg-[#0d2137] border border-[#1a3a5c] rounded-xl pl-12 pr-4 text-white placeholder-slate-500 focus:border-[#C5A065]/50 focus:ring-1 focus:ring-[#C5A065]/20 transition-all outline-none"
                                        placeholder="Email professionnel"
                                    />
                                </div>

                                {/* Password Field */}
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full h-14 bg-[#0d2137] border border-[#1a3a5c] rounded-xl pl-12 pr-12 text-white placeholder-slate-500 focus:border-[#C5A065]/50 focus:ring-1 focus:ring-[#C5A065]/20 transition-all outline-none"
                                        placeholder="Mot de passe"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400 transition-colors"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-5 h-5" />
                                        ) : (
                                            <Eye className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>

                                {/* Remember Me & Forgot Password */}
                                <div className="flex items-center justify-between text-sm">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                checked={rememberMe}
                                                onChange={(e) => setRememberMe(e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-4 h-4 border border-[#1a3a5c] rounded bg-[#0d2137] peer-checked:bg-[#C5A065] peer-checked:border-[#C5A065] transition-all flex items-center justify-center">
                                                {rememberMe && (
                                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-slate-400 text-xs group-hover:text-slate-300 transition-colors">
                                            Se souvenir
                                        </span>
                                    </label>
                                    <button
                                        type="button"
                                        className="text-[#C5A065] text-xs hover:text-[#d4af74] transition-colors"
                                    >
                                        Mot de passe oublié ?
                                    </button>
                                </div>

                                {/* Submit Button */}
                                <motion.button
                                    type="submit"
                                    disabled={loading}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    className="w-full h-14 bg-gradient-to-r from-[#C5A065] to-[#b08e5a] hover:from-[#d4af74] hover:to-[#c09a64] text-[#001833] font-bold rounded-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#C5A065]/20"
                                >
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <span className="uppercase tracking-[0.15em] text-sm">Se connecter</span>
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </motion.button>
                            </form>

                            {/* Footer */}
                            <div className="mt-8 pt-6 border-t border-[#1a3a5c]/50">
                                <p className="text-center text-[11px] text-slate-500 italic">
                                    Protected by Radisson Secure Systems
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
