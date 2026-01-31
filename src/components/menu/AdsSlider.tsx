"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

interface Ad {
    id: string;
    image_url: string;
    link?: string;
}

const AdsSlider = () => {
    const [ads, setAds] = useState<Ad[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAds = async () => {
            try {
                const { data, error } = await supabase
                    .from('ads')
                    .select('id, image_url, link')
                    .eq('active', true)
                    .order('sort_order', { ascending: true });

                if (error) {
                    // Table might not exist or RLS policy issue - fail silently
                    if (error.code === '42P01' || error.message?.includes('does not exist')) {
                        // Table doesn't exist - this is expected in some environments
                        setAds([]);
                    } else {
                        console.warn('Ads loading skipped:', error.message);
                    }
                } else if (data && data.length > 0) {
                    setAds(data);
                }
            } catch {
                // Silently fail - ads are not critical
            } finally {
                setIsLoading(false);
            }
        };

        fetchAds();
    }, []);

    const nextSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, [ads.length]);

    useEffect(() => {
        if (ads.length <= 1) return;
        const interval = setInterval(nextSlide, 5000);
        return () => clearInterval(interval);
    }, [ads.length, nextSlide]);

    if (isLoading || ads.length === 0) return null;

    return (
        <div className="w-full px-4 mb-6">
            <div className="relative h-32 md:h-44 w-full rounded-2xl overflow-hidden shadow-sm group">
                <AnimatePresence initial={false} mode="wait">
                    <motion.div
                        key={ads[currentIndex].id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="relative w-full h-full"
                    >
                        {ads[currentIndex].link ? (
                            <a href={ads[currentIndex].link} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                                <Image
                                    src={ads[currentIndex].image_url}
                                    alt="Advertisement"
                                    fill
                                    className="object-cover"
                                    priority
                                />
                            </a>
                        ) : (
                            <Image
                                src={ads[currentIndex].image_url}
                                alt="Advertisement"
                                fill
                                className="object-cover"
                                priority
                            />
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Dots Indicator */}
                {ads.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/10 backdrop-blur-md px-2 py-1 rounded-full">
                        {ads.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-white w-4' : 'bg-white/50'
                                    }`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdsSlider;
