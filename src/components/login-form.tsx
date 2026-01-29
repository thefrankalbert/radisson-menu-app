'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { createBrowserClient } from "@supabase/ssr"
import { toast } from "react-hot-toast"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
    return (
        <input
            type={type}
            data-slot="input"
            className={cn(
                "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
                className
            )}
            {...props}
        />
    )
}

export function LoginForm() {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const [rememberMe, setRememberMe] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // For 3D card effect - increased rotation range for more pronounced 3D effect
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const rotateX = useTransform(mouseY, [-300, 300], [10, -10]);
    const rotateY = useTransform(mouseX, [-300, 300], [-10, 10]);

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left - rect.width / 2);
        mouseY.set(e.clientY - rect.top - rect.height / 2);
        setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseLeave = () => {
        mouseX.set(0);
        mouseY.set(0);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            // Enregistrer le log de connexion
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('admin_login_logs').insert([{
                    user_email: user.email,
                    user_id: user.id,
                    user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : null
                }]);
            }

            toast.success("Connexion réussie");
            window.location.href = "/admin";
        } catch (error: any) {
            toast.error(error.message || "Erreur de connexion");
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full h-full flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="w-full max-w-sm relative z-10"
                style={{ perspective: 1500 }}
            >
                <motion.div
                    className="relative"
                    style={{ rotateX, rotateY }}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    whileHover={{ z: 10 }}
                >
                    <div className="relative group">
                        {/* Card glow effect */}
                        <motion.div
                            className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-70 transition-opacity duration-700"
                            animate={{
                                boxShadow: [
                                    "0 0 10px 2px rgba(197, 160, 101, 0.03)",
                                    "0 0 15px 5px rgba(197, 160, 101, 0.05)",
                                    "0 0 10px 2px rgba(197, 160, 101, 0.03)"
                                ],
                                opacity: [0.2, 0.4, 0.2]
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut",
                                repeatType: "mirror"
                            }}
                        />

                        {/* Traveling light beam effect - Gold */}
                        <div className="absolute -inset-[1px] rounded-2xl overflow-hidden">
                            <motion.div
                                className="absolute top-0 left-0 h-[3px] w-[50%] bg-gradient-to-r from-transparent via-[#C5A065] to-transparent opacity-70"
                                initial={{ filter: "blur(2px)" }}
                                animate={{
                                    left: ["-50%", "100%"],
                                    opacity: [0.3, 0.7, 0.3],
                                    filter: ["blur(1px)", "blur(2.5px)", "blur(1px)"]
                                }}
                                transition={{
                                    left: { duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1 },
                                    opacity: { duration: 1.2, repeat: Infinity, repeatType: "mirror" },
                                }}
                            />
                            <motion.div
                                className="absolute top-0 right-0 h-[50%] w-[3px] bg-gradient-to-b from-transparent via-[#C5A065] to-transparent opacity-70"
                                initial={{ filter: "blur(2px)" }}
                                animate={{
                                    top: ["-50%", "100%"],
                                }}
                                transition={{
                                    top: { duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1, delay: 0.6 },
                                }}
                            />
                            <motion.div
                                className="absolute bottom-0 right-0 h-[3px] w-[50%] bg-gradient-to-r from-transparent via-[#C5A065] to-transparent opacity-70"
                                animate={{
                                    right: ["-50%", "100%"],
                                }}
                                transition={{
                                    right: { duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1, delay: 1.2 },
                                }}
                            />
                            <motion.div
                                className="absolute bottom-0 left-0 h-[50%] w-[3px] bg-gradient-to-b from-transparent via-[#C5A065] to-transparent opacity-70"
                                animate={{
                                    bottom: ["-50%", "100%"],
                                }}
                                transition={{
                                    bottom: { duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1, delay: 1.8 },
                                }}
                            />
                        </div>

                        {/* Card border glow */}
                        <div className="absolute -inset-[0.5px] rounded-2xl bg-gradient-to-r from-[#C5A065]/20 via-[#C5A065]/40 to-[#C5A065]/20 opacity-0 group-hover:opacity-70 transition-opacity duration-500" />

                        {/* Glass card background - Radisson Dark Blue base */}
                        <div className="relative bg-[#002545]/80 backdrop-blur-xl rounded-2xl p-6 border border-[#C5A065]/10 shadow-2xl overflow-hidden">
                            {/* Subtle card inner patterns */}
                            <div className="absolute inset-0 opacity-[0.03]"
                                style={{
                                    backgroundImage: `linear-gradient(135deg, #C5A065 0.5px, transparent 0.5px), linear-gradient(45deg, #C5A065 0.5px, transparent 0.5px)`,
                                    backgroundSize: '30px 30px'
                                }}
                            />

                            {/* Logo and header */}
                            <div className="text-center space-y-1 mb-5">
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: "spring", duration: 0.8 }}
                                    className="mx-auto w-10 h-10 rounded-lg flex items-center justify-center relative overflow-hidden bg-[#C5A065] shadow-lg shadow-[#C5A065]/20"
                                >
                                    <span className="text-xl font-black text-[#003058]">R</span>
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent opacity-50" />
                                </motion.div>

                                <motion.h1
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-xl font-bold text-white tracking-tight"
                                >
                                    Admin Portal
                                </motion.h1>

                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-white/60 text-xs tracking-wider"
                                >
                                    RADISSON BLU HUB
                                </motion.p>
                            </div>

                            {/* Login form */}
                            <form onSubmit={handleLogin} className="space-y-4">
                                <motion.div className="space-y-3">
                                    {/* Email input */}
                                    <motion.div
                                        className={`relative ${focusedInput === "email" ? 'z-10' : ''}`}
                                        whileFocus={{ scale: 1.02 }}
                                        whileHover={{ scale: 1.01 }}
                                    >
                                        <div className="absolute -inset-[0.5px] bg-gradient-to-r from-[#C5A065]/30 via-[#C5A065]/20 to-[#C5A065]/30 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300" />

                                        <div className="relative flex items-center overflow-hidden rounded-lg bg-[#001A33]/50">
                                            <Mail className={`absolute left-3 w-4 h-4 transition-all duration-300 ${focusedInput === "email" ? 'text-[#C5A065]' : 'text-white/40'
                                                }`} />

                                            <Input
                                                type="email"
                                                placeholder="Email professionnel"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                onFocus={() => setFocusedInput("email")}
                                                onBlur={() => setFocusedInput(null)}
                                                className="w-full bg-transparent border-transparent focus:border-[#C5A065]/30 text-white placeholder:text-white/30 h-10 transition-all duration-300 pl-10 pr-3"
                                            />
                                        </div>
                                    </motion.div>

                                    {/* Password input */}
                                    <motion.div
                                        className={`relative ${focusedInput === "password" ? 'z-10' : ''}`}
                                        whileFocus={{ scale: 1.02 }}
                                        whileHover={{ scale: 1.01 }}
                                    >
                                        <div className="absolute -inset-[0.5px] bg-gradient-to-r from-[#C5A065]/30 via-[#C5A065]/20 to-[#C5A065]/30 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300" />

                                        <div className="relative flex items-center overflow-hidden rounded-lg bg-[#001A33]/50">
                                            <Lock className={`absolute left-3 w-4 h-4 transition-all duration-300 ${focusedInput === "password" ? 'text-[#C5A065]' : 'text-white/40'
                                                }`} />

                                            <Input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Mot de passe"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                onFocus={() => setFocusedInput("password")}
                                                onBlur={() => setFocusedInput(null)}
                                                className="w-full bg-transparent border-transparent focus:border-[#C5A065]/30 text-white placeholder:text-white/30 h-10 transition-all duration-300 pl-10 pr-10"
                                            />

                                            <div
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 cursor-pointer"
                                            >
                                                {showPassword ? (
                                                    <Eye className="w-4 h-4 text-white/40 hover:text-[#C5A065] transition-colors duration-300" />
                                                ) : (
                                                    <EyeOff className="w-4 h-4 text-white/40 hover:text-[#C5A065] transition-colors duration-300" />
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                </motion.div>

                                {/* Remember me & Forgot password */}
                                <div className="flex items-center justify-between pt-1">
                                    <div className="flex items-center space-x-2">
                                        {/* Simplified Checkbox for brevity */}
                                        <input
                                            type="checkbox"
                                            className="accent-[#C5A065] h-4 w-4 bg-white/10 border-white/20 rounded"
                                            checked={rememberMe}
                                            onChange={() => setRememberMe(!rememberMe)}
                                        />
                                        <label className="text-xs text-white/60 hover:text-white transition-colors duration-200">
                                            Se souvenir de moi
                                        </label>
                                    </div>

                                    <div className="text-xs relative group/link">
                                        <Link href="#" className="text-[#C5A065]/80 hover:text-[#C5A065] transition-colors duration-200">
                                            Mot de passe oublié ?
                                        </Link>
                                    </div>
                                </div>

                                {/* Sign in button */}
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full relative group/button mt-5"
                                >
                                    <div className="absolute inset-0 bg-[#C5A065]/20 rounded-lg blur-lg opacity-0 group-hover/button:opacity-70 transition-opacity duration-300" />

                                    <div className="relative overflow-hidden bg-[#C5A065] text-[#003058] font-bold h-10 rounded-lg transition-all duration-300 flex items-center justify-center shadow-lg shadow-[#C5A065]/20">

                                        <AnimatePresence mode="wait">
                                            {isLoading ? (
                                                <motion.div
                                                    key="loading"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                >
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                </motion.div>
                                            ) : (
                                                <motion.span
                                                    key="button-text"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
                                                >
                                                    Se connecter
                                                    <ArrowRight className="w-4 h-4 group-hover/button:translate-x-1 transition-transform duration-300" />
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </motion.button>
                            </form>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}
