"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function ClearStorage() {
  const pathname = usePathname();

  useEffect(() => {
    // Vider le localStorage ET sessionStorage uniquement si on accède directement à la racine sans paramètres
    // Ne pas nettoyer si c'est une navigation depuis le bouton Accueil (flag présent)
    if (pathname === '/') {
      const timer = setTimeout(() => {
        const isNavigationFromButton = sessionStorage.getItem('navigating_to_home') === 'true';
        const hasParams = window.location.search.length > 0;
        
        // Vérifier si c'est un accès direct (pas de referrer ou referrer externe)
        const isDirectAccess = !document.referrer || 
                              !document.referrer.includes(window.location.origin) ||
                              document.referrer === window.location.href;
        
        // Si accès direct à la racine sans paramètres, nettoyer TOUT et nettoyer l'URL
        if (window.location.pathname === '/' && !hasParams && isDirectAccess && !isNavigationFromButton) {
          console.log('Nettoyage du localStorage et sessionStorage sur la racine (accès direct)');
          localStorage.clear();
          sessionStorage.clear(); // Nettoyer aussi sessionStorage pour un accès direct
          
          // S'assurer que l'URL est vraiment propre (sans paramètres)
          if (window.location.search !== '') {
            window.history.replaceState({}, '', '/');
          }
        } else if (isNavigationFromButton && window.location.search === '') {
          // Navigation depuis bouton sans params → nettoyer quand même
          console.log('Navigation depuis bouton sans params - nettoyage');
          localStorage.clear();
          sessionStorage.clear();
        }
      }, 50); // Petit délai pour laisser les autres composants s'initialiser
      
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  return null;
}

