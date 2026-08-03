import {
    Salad,
    UtensilsCrossed,
    Soup,
    Cookie,
    Wine,
    Pizza,
    Beef,
    ChefHat,
    Croissant,
    Wheat,
    Coffee,
    Martini,
} from "lucide-react";
import type { LucideProps } from "lucide-react";

export type CategoryIconKey =
    | "starter"
    | "main"
    | "side"
    | "dessert"
    | "drink"
    | "cocktail"
    | "coffee"
    | "salad"
    | "pizza"
    | "burger"
    | "asian"
    | "african"
    | "pasta"
    | "bakery";

const ICON_MAP: Record<CategoryIconKey, React.ComponentType<LucideProps>> = {
    starter: Salad,
    main: UtensilsCrossed,
    side: Soup,
    dessert: Cookie,
    drink: Wine,
    cocktail: Martini,
    coffee: Coffee,
    salad: Salad,
    pizza: Pizza,
    burger: Beef,
    asian: Soup,
    african: ChefHat,
    pasta: Wheat,
    bakery: Croissant,
};

export function CategoryIcon({
    name,
    size = 28,
    className = "",
}: {
    name: string;
    size?: number;
    className?: string;
}) {
    const Cmp = ICON_MAP[name as CategoryIconKey] ?? UtensilsCrossed;
    return <Cmp width={size} height={size} strokeWidth={1.6} className={className} />;
}

/**
 * Palette des tuiles catégories. Les teintes viennent du monde de l'hôtel —
 * bleu ardoise du lobby, or du bar, vert olive et bois chaud de la salle —
 * plutôt que d'un nuancier générique. Chroma volontairement basse pour rester
 * en accord avec le navy de la marque.
 */
const CATEGORY_COLORS: Record<CategoryIconKey, { bg: string; fg: string }> = {
    starter: { bg: "oklch(0.96 0.02 140)", fg: "oklch(0.44 0.07 140)" },
    main: { bg: "oklch(0.96 0.02 55)", fg: "oklch(0.44 0.08 55)" },
    side: { bg: "oklch(0.96 0.015 75)", fg: "oklch(0.45 0.05 75)" },
    dessert: { bg: "oklch(0.96 0.02 15)", fg: "oklch(0.46 0.09 15)" },
    drink: { bg: "oklch(0.95 0.025 250)", fg: "oklch(0.40 0.09 250)" },
    cocktail: { bg: "oklch(0.95 0.025 320)", fg: "oklch(0.44 0.09 320)" },
    coffee: { bg: "oklch(0.95 0.02 60)", fg: "oklch(0.40 0.06 60)" },
    salad: { bg: "oklch(0.96 0.025 150)", fg: "oklch(0.44 0.08 150)" },
    pizza: { bg: "oklch(0.96 0.02 45)", fg: "oklch(0.44 0.09 45)" },
    burger: { bg: "oklch(0.96 0.025 40)", fg: "oklch(0.46 0.10 40)" },
    asian: { bg: "oklch(0.96 0.02 85)", fg: "oklch(0.45 0.08 85)" },
    african: { bg: "oklch(0.96 0.025 35)", fg: "oklch(0.46 0.10 35)" },
    pasta: { bg: "oklch(0.96 0.02 85)", fg: "oklch(0.45 0.08 85)" },
    bakery: { bg: "oklch(0.96 0.02 50)", fg: "oklch(0.44 0.08 50)" },
};

const DEFAULT_COLORS = { bg: "oklch(0.96 0.012 240)", fg: "oklch(0.40 0.06 240)" };

export function getCategoryColors(key: string): { bg: string; fg: string } {
    return CATEGORY_COLORS[key as CategoryIconKey] ?? DEFAULT_COLORS;
}

export function deriveCategoryIconKey(categoryName: string): CategoryIconKey {
    const lower = categoryName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "");

    if (lower.includes("entre") && !lower.includes("entre deux")) return "starter";
    if (lower.includes("dessert") || lower.includes("sucre") || lower.includes("patisserie"))
        return "dessert";
    if (lower.includes("cocktail") || lower.includes("mocktail") || lower.includes("spiritueux"))
        return "cocktail";
    if (lower.includes("cafe") || lower.includes("the ") || lower.includes("coffee"))
        return "coffee";
    if (
        lower.includes("boisson") ||
        lower.includes("drink") ||
        lower.includes("jus") ||
        lower.includes("vin") ||
        lower.includes("wine") ||
        lower.includes("champagne") ||
        lower.includes("biere") ||
        lower.includes("beer") ||
        lower.includes("soft")
    )
        return "drink";
    if (lower.includes("salade") || lower.includes("salad")) return "salad";
    if (lower.includes("pizza")) return "pizza";
    if (lower.includes("burger") || lower.includes("sandwich") || lower.includes("club"))
        return "burger";
    if (
        lower.includes("asiatique") ||
        lower.includes("sushi") ||
        lower.includes("wok") ||
        lower.includes("noodle")
    )
        return "asian";
    if (
        lower.includes("african") ||
        lower.includes("africain") ||
        lower.includes("tchad") ||
        lower.includes("local")
    )
        return "african";
    if (lower.includes("pate") || lower.includes("pasta") || lower.includes("nouille"))
        return "pasta";
    if (
        lower.includes("viennois") ||
        lower.includes("boulanger") ||
        lower.includes("bakery") ||
        lower.includes("croissant") ||
        lower.includes("petit dejeuner") ||
        lower.includes("breakfast")
    )
        return "bakery";
    if (
        lower.includes("accomp") ||
        lower.includes("frite") ||
        lower.includes("riz") ||
        lower.includes("side") ||
        lower.includes("doigt") ||
        lower.includes("snack")
    )
        return "side";
    return "main";
}
