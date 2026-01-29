"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { toast } from "react-hot-toast";
import { LogIn, Loader2, Mail, Lock } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
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

    const handleSignUp = async () => {
        if (!email || !password) {
            toast.error("Remplis l'email et le mot de passe");
            return;
        }
        setLoading(true);
        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        role: 'admin' // Annotation optionnelle pour tes politiques RLS
                    }
                }
            });
            if (error) throw error;
            toast.success("Compte créé ! Tu peux maintenant te connecter.");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#003058] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-[#C5A065]/10 rounded-full -ml-48 -mt-48 blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#C5A065]/5 rounded-full -mr-48 -mb-48 blur-3xl" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white rounded-[2.5rem] border border-gray-100 p-10 relative z-10"
            >
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 bg-[#003058] rounded-2xl flex items-center justify-center mb-6">
                        <span className="text-white font-black text-3xl">R</span>
                    </div>
                    <h1 className="text-2xl font-black text-[#003058] tracking-tight text-center">
                        Admin Portal
                    </h1>
                    <p className="text-[#C5A065] text-[10px] font-bold uppercase tracking-[0.2em] mt-2">
                        Radisson Blu Hub
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">
                            Email professionnel
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full h-14 bg-[#F5F5F5] border-none rounded-2xl pl-12 pr-4 text-[#003058] font-bold focus:ring-2 focus:ring-[#C5A065]/20 transition-all"
                                placeholder="admin@radisson.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between ml-4">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Mot de passe
                            </label>
                            <button type="button" className="text-[10px] font-black text-[#C5A065] uppercase hover:underline">
                                Oublié ?
                            </button>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full h-14 bg-[#F5F5F5] border-none rounded-2xl pl-12 pr-4 text-[#003058] font-bold focus:ring-2 focus:ring-[#C5A065]/20 transition-all"
                                placeholder="••••••••••••"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={handleSignUp}
                            disabled={loading}
                            className="h-14 bg-white border-2 border-[#F5F5F5] text-[#C5A065] font-black rounded-2xl flex items-center justify-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            <span className="uppercase tracking-widest text-[10px]">S&apos;inscrire</span>
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="h-14 bg-[#C5A065] hover:bg-[#b08e5a] text-[#003058] font-black rounded-2xl flex items-center justify-center space-x-2 border border-[#b08e5a]/50 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    <span className="uppercase tracking-widest text-[10px]">Accéder</span>
                                    <LogIn className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </form>

                <div className="mt-10 text-center">
                    <p className="text-[10px] text-slate-400 font-medium">
                        Sécurisé par Radisson IT Systems
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
