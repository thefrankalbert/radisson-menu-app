"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function ClearStorage() {
  const pathname = usePathname();

  useEffect(() => {
    // Vider le localStorage ET sessionStorage quand on accède à la racine sans paramètres
    if (pathname === '/') {
      const timer = setTimeout(() => {
        const hasParams = window.location.search.length > 0;
        
        // Si on est à la racine SANS paramètres, nettoyer TOUT
        if (!hasParams) {
          console.log('Nettoyage automatique du localStorage et sessionStorage à la racine (sans paramètres)');
          localStorage.clear();
          sessionStorage.clear();
          
          // S'assurer que l'URL est vraiment propre (sans paramètres)
          if (window.location.search !== '') {
            window.history.replaceState({}, '', '/');
          }
        } else {
          // Si on a des paramètres (QR code), ne pas nettoyer pour préserver les données
          console.log('Paramètres présents - préservation du localStorage');
        }
      }, 50); // Petit délai pour laisser les autres composants s'initialiser
      
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  return null;
}

