"use client";

import { useEffect, useRef } from "react";

export default function ClearStorage() {
  const hasCleared = useRef(false);

  useEffect(() => {
    // Vider tout le localStorage une seule fois au montage du composant
    // Utiliser un délai pour éviter les conflits avec d'autres composants
    if (!hasCleared.current) {
      const timer = setTimeout(() => {
        localStorage.clear();
        hasCleared.current = true;
      }, 50); // Petit délai pour laisser les autres composants s'initialiser
      
      return () => clearTimeout(timer);
    }
  }, []);

  return null;
}

