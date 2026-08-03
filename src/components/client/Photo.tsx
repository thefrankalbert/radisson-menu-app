"use client";

import { useState } from "react";
import Image from "next/image";
import { PhotoPlaceholder } from "./PhotoPlaceholder";

/**
 * La base stocke `/images/placeholder.png` pour les plats sans photo — un chemin
 * qui n'existe pas dans `public/`. Rendu tel quel, il affiche l'icône d'image
 * cassée du navigateur. On le traite donc comme une absence de photo.
 */
export function hasRealPhoto(src?: string | null): src is string {
    if (!src || src.trim().length === 0) return false;
    const lower = src.toLowerCase();
    return !lower.includes("placeholder") && !lower.includes("/default");
}

export interface PhotoProps {
    src?: string | null;
    alt: string;
    kind?: "food" | "drink";
    fill?: boolean;
    width?: number;
    height?: number;
    className?: string;
    sizes?: string;
    priority?: boolean;
    /**
     * Remplace le visuel de repli ivoire. `null` n'affiche rien — utile quand le
     * conteneur porte déjà son propre fond (tuiles de cartes sur fond encre).
     */
    fallback?: React.ReactNode;
}

/**
 * Point de passage unique de toute image convive : accueil, carte, fiche détail,
 * panier. Une URL absente, marquée « placeholder » ou qui échoue au chargement
 * laisse place au visuel de repli ivoire — jamais à l'icône d'image cassée.
 *
 * Le repli sur erreur compte : plusieurs lignes en base pointent vers des
 * fichiers qui n'existent plus (`/images/pool.jpg`, `/images/drinks.jpg`), et
 * l'URL seule ne permet pas de le savoir.
 */
export function Photo({
    src,
    alt,
    kind,
    fill,
    width,
    height,
    className = "",
    sizes,
    priority,
    fallback,
}: PhotoProps) {
    const [failed, setFailed] = useState(false);

    if (!hasRealPhoto(src) || failed) {
        return fallback !== undefined ? (
            <>{fallback}</>
        ) : (
            <PhotoPlaceholder kind={kind} className={className} />
        );
    }

    const onError = () => setFailed(true);

    if (fill) {
        return (
            <Image
                src={src}
                alt={alt}
                fill
                priority={priority}
                sizes={sizes ?? "(max-width: 480px) 100vw, 480px"}
                className={`object-cover ${className}`}
                onError={onError}
            />
        );
    }
    return (
        <Image
            src={src}
            alt={alt}
            width={width ?? 80}
            height={height ?? 80}
            className={`object-cover ${className}`}
            onError={onError}
        />
    );
}
