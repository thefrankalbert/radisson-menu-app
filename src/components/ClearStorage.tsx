"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function ClearStorage() {
  const pathname = usePathname();

  useEffect(() => {
    // Vider le localStorage à chaque fois qu'on est sur la racine (/) sans paramètres
    if (pathname === '/') {
      const timer = setTimeout(() => {
        // Vérifier qu'on est toujours sur la racine sans paramètres avant de nettoyer
        if (window.location.pathname === '/' && window.location.search === '') {
          console.log('Nettoyage du localStorage sur la racine');
          localStorage.clear();
        }
      }, 50); // Petit délai pour laisser les autres composants s'initialiser
      
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  return null;
}

