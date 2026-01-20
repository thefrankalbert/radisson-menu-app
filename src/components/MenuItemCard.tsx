import { Plus, Minus, Leaf, Flame, Utensils, ChevronDown, Martini } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";

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
        description: string;
        price: number;
        image_url?: string;
        is_vegetarian?: boolean;
        is_spicy?: boolean;
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
    const [isAnimating, setIsAnimating] = useState(false);

    // État pour les sélections
    const [selectedOption, setSelectedOption] = useState<ItemOption | null>(null);
    const [selectedVariant, setSelectedVariant] = useState<ItemPriceVariant | null>(null);
    const [showVariantDropdown, setShowVariantDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

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
        setIsAnimating(true);

        const cartItemData: any = {
            id: item.id,
            name: item.name,
            price: currentPrice,
            image_url: item.image_url,
            quantity: 1,
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

    return (
        <div className="group bg-white rounded-2xl p-3 shadow-sm border border-gray-300 flex flex-col hover:shadow-md transition-all duration-300 w-full overflow-hidden relative">
            {/* Ligne principale */}
            <div className="flex items-start gap-4 min-h-24">
                {/* 1. IMAGE (Left) */}
                <div className="w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gray-50 border border-gray-50 flex items-center justify-center">
                    {(item.image_url && !item.image_url.includes('placeholder')) ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                        (category.toLowerCase().includes('boisson') ||
                            category.toLowerCase().includes('cocktail') ||
                            category.toLowerCase().includes('vin') ||
                            category.toLowerCase().includes('bière') ||
                            category.toLowerCase().includes('soda') ||
                            category.toLowerCase().includes('jus') ||
                            category.toLowerCase().includes('spirit') ||
                            category.toLowerCase().includes('drink') ||
                            category.toLowerCase().includes('beverage') ||
                            category.toLowerCase().includes('wine') ||
                            category.toLowerCase().includes('beer')) ? <Martini size={32} className="text-gray-400" /> : <Utensils size={32} className="text-gray-400" />
                    )}
                </div>

                {/* 2. INFORMATIONS (Centre - Flex 1) */}
                <div className="flex-1 flex flex-col justify-start min-w-0 py-1">
                    <div className="flex items-start gap-1.5 mb-1">
                        <h3 className="text-[15px] font-bold text-[#002C5F] leading-tight break-words flex-1">
                            {item.name}
                        </h3>
                        <div className="flex gap-1 flex-shrink-0 mt-0.5">
                            {item.is_vegetarian && <Leaf size={12} className="text-green-500" />}
                            {item.is_spicy && <Flame size={12} className="text-red-500" />}
                        </div>
                    </div>

                    <p className="text-[11px] text-gray-400 leading-tight mb-2">
                        {item.description}
                    </p>

                    {/* Prix avec sélecteur de variante */}
                    <div className="flex items-center gap-2 mt-auto">
                        {hasVariants ? (
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setShowVariantDropdown(!showVariantDropdown)}
                                    className="flex items-center gap-1 bg-orange-50 rounded-lg px-2 py-1 border border-orange-200 hover:bg-orange-100 transition-colors"
                                >
                                    <span className="text-base font-black text-orange-500">
                                        {currentPrice?.toLocaleString()}
                                    </span>
                                    <span className="text-[9px] text-orange-400 font-bold uppercase">FCFA</span>
                                    <ChevronDown size={14} className={`text-orange-400 transition-transform ${showVariantDropdown ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Dropdown des variantes */}
                                {showVariantDropdown && (
                                    <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-max">
                                        {item.price_variants?.map((variant) => (
                                            <button
                                                key={variant.id}
                                                onClick={() => {
                                                    setSelectedVariant(variant);
                                                    setShowVariantDropdown(false);
                                                }}
                                                className={`w-full px-3 py-2 text-left flex justify-between items-center gap-4 hover:bg-gray-50 transition-colors ${selectedVariant?.id === variant.id ? 'bg-orange-50' : ''
                                                    }`}
                                            >
                                                <span className="text-sm text-gray-700">{getVariantName(variant)}</span>
                                                <span className="text-sm font-bold text-orange-500">{variant.price.toLocaleString()} FCFA</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-baseline">
                                <span className="text-base font-black text-orange-500">
                                    {currentPrice > 0 ? currentPrice?.toLocaleString() : (language === 'en' ? 'Included' : 'Inclus')}
                                </span>
                                {currentPrice > 0 && <span className="text-[9px] text-orange-400 font-bold ml-1 uppercase">FCFA</span>}
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. ACTION (Droite) */}
                <div className="flex-shrink-0 flex items-center justify-center pl-2">
                    {cartItem ? (
                        <div className="flex flex-col items-center bg-gray-50 rounded-full p-1 border border-gray-100 animate-scale-up gap-1">
                            <button
                                onClick={() => updateQuantity(getCartKey(), cartItem.quantity + 1)}
                                className="w-7 h-7 rounded-full bg-[#002C5F] flex items-center justify-center text-white active:scale-90"
                            >
                                <Plus size={14} strokeWidth={3} />
                            </button>
                            <span className="text-[11px] font-black text-[#002C5F]">
                                {cartItem.quantity}
                            </span>
                            <button
                                onClick={() => updateQuantity(getCartKey(), cartItem.quantity - 1)}
                                className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[#002C5F] active:scale-90"
                            >
                                <Minus size={14} strokeWidth={3} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleAdd}
                            className={`w-8 h-8 rounded-full bg-[#002C5F] text-white shadow-soft flex items-center justify-center hover:bg-[#00428C] transition-all active:scale-90 ${isAnimating ? "scale-110 !bg-orange-500" : ""}`}
                        >
                            <Plus size={18} strokeWidth={3} />
                        </button>
                    )}
                </div>
            </div>

            {/* Options (chips sélectionnables) - Affiché uniquement si options disponibles */}
            {hasOptions && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex flex-wrap gap-2">
                        {item.options?.map((option) => (
                            <button
                                key={option.id}
                                onClick={() => setSelectedOption(option)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedOption?.id === option.id
                                        ? 'bg-[#002C5F] text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {getOptionName(option)}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
