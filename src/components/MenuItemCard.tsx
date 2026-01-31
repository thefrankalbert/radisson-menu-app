import { Plus, Minus, Leaf, Flame, Utensils, ChevronDown, Martini } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { getTranslatedContent } from "@/utils/translation";

// Types pour options et variantes
interface ItemOption {
    id: string;
    name_fr: string;
    name_en?: string;
    display_order: number;
    is_default: boolean;
}

interface ItemPriceVariant {
    id: string;
    variant_name_fr: string;
    variant_name_en?: string;
    price: number;
    display_order: number;
    is_default: boolean;
}

interface MenuItemProps {
    item: {
        id: string;
        name: string;
        name_en?: string | null;
        description: string;
        description_en?: string | null;
        price: number;
        image_url?: string;
        is_vegetarian?: boolean;
        is_spicy?: boolean;
        is_available?: boolean;
        category_id?: string;
        options?: ItemOption[];
        price_variants?: ItemPriceVariant[];
    };
    restaurantId: string;
    priority?: boolean;
    category?: string;
}

export default function MenuItemCard({ item, restaurantId, priority = false, category = "" }: MenuItemProps) {
    const { addToCart, updateQuantity, items } = useCart();
    const { language } = useLanguage();
    const { formatPrice } = useCurrency();
    const [isAnimating, setIsAnimating] = useState(false);
    const [imageError, setImageError] = useState(false);

    // État pour les sélections
    const [selectedOption, setSelectedOption] = useState<ItemOption | null>(null);
    const [selectedVariant, setSelectedVariant] = useState<ItemPriceVariant | null>(null);
    const [showVariantDropdown, setShowVariantDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Déterminer si c'est une boisson basé sur la catégorie
    const isDrinkCategory = category.toLowerCase().match(/boisson|cocktail|vin|bière|beer|soda|jus|spirit|drink|beverage|wine|eau|water|soft|alcool|apéritif|digestif|champagne|whisky|rhum|vodka|gin/);

    // Initialiser les sélections par défaut
    useEffect(() => {
        if (item.options?.length) {
            const defaultOption = item.options.find(o => o.is_default) || item.options[0];
            setSelectedOption(defaultOption);
        }
        if (item.price_variants?.length) {
            const defaultVariant = item.price_variants.find(v => v.is_default) || item.price_variants[0];
            setSelectedVariant(defaultVariant);
        }
    }, [item.options, item.price_variants]);

    // Fermer le dropdown quand on clique ailleurs
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowVariantDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Obtenir le prix actuel (avec variante si applicable)
    const currentPrice = selectedVariant ? selectedVariant.price : item.price;

    // Clé unique pour le panier (inclut option/variante)
    const getCartKey = () => {
        let key = item.id;
        if (selectedOption) key += `-opt-${selectedOption.name_fr}`;
        if (selectedVariant) key += `-var-${selectedVariant.variant_name_fr}`;
        return key;
    };

    // Trouver l'item dans le panier
    const cartItem = items.find((i) => {
        let itemKey = i.id;
        if (i.selectedOption) itemKey += `-opt-${i.selectedOption.name_fr}`;
        if (i.selectedVariant) itemKey += `-var-${i.selectedVariant.name_fr}`;
        return itemKey === getCartKey();
    });

    const handleAdd = () => {
        // Validation de disponibilité côté client
        if (item.is_available === false) {
            toast.error("Ce plat n'est plus disponible");
            return;
        }

        setIsAnimating(true);

        const cartItemData: any = {
            id: item.id,
            name: item.name,
            name_en: item.name_en,
            price: currentPrice,
            image_url: item.image_url,
            quantity: 1,
            category_id: item.category_id,
            category_name: category
        };

        if (selectedOption) {
            cartItemData.selectedOption = {
                name_fr: selectedOption.name_fr,
                name_en: selectedOption.name_en
            };
        }

        if (selectedVariant) {
            cartItemData.selectedVariant = {
                name_fr: selectedVariant.variant_name_fr,
                name_en: selectedVariant.variant_name_en,
                price: selectedVariant.price
            };
        }

        addToCart(cartItemData, restaurantId);
        setTimeout(() => setIsAnimating(false), 300);
    };

    // Helper pour obtenir le nom traduit
    const getOptionName = (option: ItemOption) => {
        return language === 'en' && option.name_en ? option.name_en : option.name_fr;
    };

    const getVariantName = (variant: ItemPriceVariant) => {
        return language === 'en' && variant.variant_name_en ? variant.variant_name_en : variant.variant_name_fr;
    };

    const hasOptions = item.options && item.options.length > 0;
    const hasVariants = item.price_variants && item.price_variants.length > 0;
    const isUnavailable = item.is_available === false;

    return (
        <div
            onClick={handleAdd}
            className={`group py-4 px-4 flex items-start gap-4 relative transition-all duration-150 active:scale-[0.99] select-none cursor-pointer hover:bg-gray-50/30 ${isUnavailable ? 'opacity-50' : ''}`}
        >
            {/* 1. TEXT CONTENT (Left) */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start gap-1.5 mb-1">
                    <h3 className="text-[15px] font-semibold text-gray-900 leading-tight line-clamp-2">
                        {getTranslatedContent(language, item.name, item.name_en)}
                    </h3>
                    <div className="flex gap-1 flex-shrink-0 mt-0.5">
                        {item.is_vegetarian && <Leaf size={12} className="text-green-500" />}
                        {item.is_spicy && <Flame size={12} className="text-red-500" />}
                    </div>
                </div>

                <p className="text-[13px] text-gray-500 leading-snug line-clamp-2 mb-2">
                    {getTranslatedContent(language, item.description, item.description_en)}
                </p>

                <div className="flex items-center gap-2 mt-auto">
                    <span className="text-[16px] font-bold text-[#C5A065]">
                        {currentPrice > 0 ? formatPrice(currentPrice) : (language === 'en' ? 'Included' : 'Inclus')}
                    </span>
                    {/* Add "Popular" badge if price is above a certain threshold or mock it for now as per request structure */}
                    {item.price > 15000 && (
                        <span className="text-[11px] text-red-600 font-medium bg-red-50 px-1.5 py-0.5 rounded">
                            {language === 'en' ? 'Popular' : 'Populaire'}
                        </span>
                    )}
                </div>

                {/* Variants Dropdown (if any) */}
                {hasVariants && (
                    <div className="mt-2 relative" ref={dropdownRef}>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowVariantDropdown(!showVariantDropdown);
                            }}
                            className="flex items-center gap-1 text-[12px] text-orange-600 bg-orange-50 px-2 py-1 rounded-md"
                        >
                            {getVariantName(selectedVariant!)}
                            <ChevronDown size={12} className={`transition-transform ${showVariantDropdown ? 'rotate-180' : ''}`} />
                        </button>
                        {showVariantDropdown && (
                            <div className="absolute top-full left-0 mt-1 bg-white rounded-lg border border-gray-200 py-1 z-20 shadow-lg min-w-[120px]">
                                {item.price_variants?.map((variant) => (
                                    <button
                                        key={variant.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedVariant(variant);
                                            setShowVariantDropdown(false);
                                        }}
                                        className={`w-full px-3 py-2 text-left text-xs hover:bg-gray-50 ${selectedVariant?.id === variant.id ? 'text-orange-600 font-bold bg-orange-50' : 'text-gray-700'}`}
                                    >
                                        {getVariantName(variant)} - {formatPrice(variant.price)}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 2. IMAGE SECTION (Right) */}
            <div className="relative flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24">
                <div className="w-full h-full rounded-lg overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center">
                    {(item.image_url && !item.image_url.includes('placeholder') && !imageError) ? (
                        <Image
                            src={item.image_url}
                            alt={item.name}
                            fill
                            sizes="(max-width: 640px) 80px, 96px"
                            className="object-cover"
                            onError={() => setImageError(true)}
                            priority={priority}
                        />
                    ) : (
                        isDrinkCategory ? <Martini size={24} className="text-gray-300" /> : <Utensils size={24} className="text-gray-300" />
                    )}
                </div>

                {/* Floating Add Card Logic */}
                <div className="absolute -bottom-1 -right-1">
                    {cartItem ? (
                        <div className="flex items-center bg-white rounded-full shadow-md border border-gray-200 p-0.5">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    updateQuantity(getCartKey(), cartItem.quantity - 1);
                                }}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-[#C5A065] hover:bg-gray-50 active:scale-90 transition-all"
                            >
                                <Minus size={16} strokeWidth={2.5} />
                            </button>
                            <span className="text-[13px] font-bold text-gray-900 w-6 text-center">
                                {cartItem.quantity}
                            </span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    updateQuantity(getCartKey(), cartItem.quantity + 1);
                                }}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-[#C5A065] hover:bg-gray-50 active:scale-90 transition-all"
                            >
                                <Plus size={16} strokeWidth={2.5} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleAdd();
                            }}
                            disabled={isUnavailable}
                            className={`w-10 h-10 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center text-[#C5A065] shadow-md hover:border-[#C5A065]/30 active:scale-90 transition-all ${isAnimating ? "scale-110 bg-[#C5A065]/10" : ""}`}
                        >
                            <Plus size={20} strokeWidth={2.5} />
                        </button>
                    )}
                </div>
            </div>

            {/* Availability Badge Overlay */}
            {isUnavailable && (
                <div className="absolute inset-0 bg-white/40 flex items-center justify-center pointer-events-none">
                    <span className="bg-gray-900/80 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">
                        Indisponible
                    </span>
                </div>
            )}
        </div>
    );
}

