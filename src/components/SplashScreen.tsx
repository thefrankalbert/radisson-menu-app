"use client";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true); // Commencer visible par défaut
  const [isFading, setIsFading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    
    // Attendre un court instant pour que le DOM soit prêt
    const checkAndDisplay = () => {
      try {
        // Ne montrer le splash screen qu'une fois par session
        const hasSeenSplash = typeof window !== 'undefined' ? sessionStorage.getItem("hasSeenSplash") : null;
        
        if (hasSeenSplash) {
          // Si déjà vu dans cette session, cacher immédiatement
          setIsVisible(false);
          return;
        }
        
        // Sinon, afficher le splash screen
        setIsVisible(true);
        
        // Cacher le splash screen après le chargement complet
        timerRef.current = setTimeout(() => {
          setIsFading(true);
          fadeTimerRef.current = setTimeout(() => {
            setIsVisible(false);
            // Marquer comme vu seulement après qu'il se soit caché
            if (typeof window !== 'undefined') {
              sessionStorage.setItem("hasSeenSplash", "true");
            }
          }, 500); // Durée de l'animation de fondu
        }, 2000); // Afficher pendant 2 secondes minimum

        return () => {
          if (timerRef.current) clearTimeout(timerRef.current);
          if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
        };
      } catch (error) {
        // Si sessionStorage n'est pas disponible, afficher quand même le splash screen
        console.warn("sessionStorage not available:", error);
        setIsVisible(true);
        timerRef.current = setTimeout(() => {
          setIsFading(true);
          fadeTimerRef.current = setTimeout(() => {
            setIsVisible(false);
          }, 500);
        }, 2000);
      }
    };

    // Petit délai pour s'assurer que le composant est monté
    const timeout = setTimeout(checkAndDisplay, 0);
    
    return () => {
      clearTimeout(timeout);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, []);

  // Ne rien rendre pendant le SSR
  if (!mounted || !isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center transition-opacity duration-500 ${
        isFading ? "opacity-0" : "opacity-100"
      }`}
      style={{ 
        pointerEvents: isFading ? 'none' : 'auto'
      }}
    >
      <div className="flex flex-col items-center justify-center gap-6">
        {/* Logo */}
        <div className="relative w-32 h-32 md:w-40 md:h-40 animate-fade-in-up">
          <Image
            src="/logo.png"
            alt="BLU TABLE"
            fill
            className="object-contain"
            priority
            unoptimized
          />
        </div>

        {/* Titre */}
        <h1 className="text-2xl md:text-3xl font-black text-[#002C5F] uppercase tracking-wider animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          BLU TABLE
        </h1>

        {/* Sous-titre */}
        <p className="text-sm md:text-base text-gray-500 font-medium animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
          N&apos;Djamena
        </p>

        {/* Loading indicator */}
        <div className="mt-8 animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
          <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="w-1/3 h-full bg-[#002C5F] rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
