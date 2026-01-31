"use client";

import React from 'react';
import { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    subtitle: string;
    actionLabel: string;
    actionHref: string;
}

const EmptyState = ({ icon: Icon, title, subtitle, actionLabel, actionHref }: EmptyStateProps) => {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-fade-in-up">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative mb-8"
            >
                {/* Decorative Elements for a scene-like icon */}
                <div className="absolute inset-0 bg-blue-50/50 rounded-full scale-150 blur-3xl" />
                <div className="relative bg-white w-28 h-28 rounded-[2rem] flex items-center justify-center shadow-xl shadow-blue-900/5 border border-blue-50">
                    <Icon size={56} className="text-[#002C5F] opacity-20 absolute" strokeWidth={1} />
                    <Icon size={44} className="text-[#002C5F] relative z-10" strokeWidth={1.5} />
                </div>

                {/* Floating particles/shapes */}
                <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-blue-100 animate-bounce" style={{ animationDuration: '3s' }} />
                <div className="absolute -bottom-4 -left-4 w-6 h-6 rounded-lg bg-blue-50 rotate-12 animate-pulse" />
            </motion.div>

            <h2 className="text-2xl font-bold text-gray-900 mb-3 px-4">
                {title}
            </h2>

            <p className="text-gray-500 text-base max-w-[300px] mx-auto mb-10 leading-relaxed font-medium">
                {subtitle}
            </p>

            <Link
                href={actionHref}
                className="w-full max-w-[240px] bg-[#002C5F] text-white px-8 py-4 rounded-2xl font-bold text-base hover:bg-[#003B7A] transition-all transform active:scale-[0.98] shadow-lg shadow-blue-900/20 text-center uppercase tracking-wider"
            >
                {actionLabel}
            </Link>
        </div>
    );
};

export default EmptyState;
