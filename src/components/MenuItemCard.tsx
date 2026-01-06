import { Plus, Minus, Leaf, Flame } from "lucide-react";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { useState } from "react";
import { getSafeImageUrl } from "@/lib/imageUtils";

interface MenuItemProps {
    item: {
        id: string;
        name: string;
        description: string;
        price: number;
        image_url?: string;
        is_vegetarian?: boolean;
        is_spicy?: boolean;
    };
    restaurantId: string;
    priority?: boolean;
    category?: string;
}

export default function MenuItemCard({ item, restaurantId, priority = false, category = "" }: MenuItemProps) {
    const { addToCart, updateQuantity, items } = useCart();
    const cartItem = items.find((i) => i.id === item.id);
    const [isAnimating, setIsAnimating] = useState(false);

    const handleAdd = () => {
        setIsAnimating(true);
        addToCart({
            id: item.id,
            name: item.name,
            price: item.price,
            image_url: item.image_url,
            quantity: 1,
        }, restaurantId);
        setTimeout(() => setIsAnimating(false), 300);
    };

    // FORCE SAFE IMAGES as requested - ignore potentially broken DB urls
    const displayImage = getSafeImageUrl(item.name + " " + (category || ""));

    return (
        <div className="group bg-white rounded-2xl p-3 shadow-sm border border-gray-200 flex items-center gap-4 hover:shadow-md transition-all duration-300 h-28 w-full overflow-hidden relative">
            {/* 1. IMAGE (Left) */}
            <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gray-50 border border-gray-50">
                <Image
                    src={displayImage}
                    alt={item.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    priority={priority}
                    loading={priority ? undefined : "lazy"}
                    unoptimized={true}
                />
            </div>

            {/* 2. INFORMATIONS (Centre - Flex 1) */}
            <div className="flex-1 flex flex-col justify-center min-w-0 h-full">
                <div className="flex items-center gap-1.5 mb-1">
                    <h3 className="text-[15px] font-bold text-[#002C5F] line-clamp-1 leading-tight">
                        {item.name}
                    </h3>
                    <div className="flex gap-1">
                        {item.is_vegetarian && <Leaf size={12} className="text-green-500" />}
                        {item.is_spicy && <Flame size={12} className="text-red-500" />}
                    </div>
                </div>

                <p className="text-[11px] text-gray-400 leading-tight line-clamp-2 mb-2">
                    {item.description}
                </p>

                <div className="flex items-baseline">
                    <span className="text-base font-black text-orange-500">
                        {item.price?.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-orange-400 font-bold ml-1 uppercase">FCFA</span>
                </div>
            </div>

            {/* 3. ACTION (Droite) */}
            <div className="flex-shrink-0 flex items-center justify-center pl-2">
                {cartItem ? (
                    <div className="flex flex-col items-center bg-gray-50 rounded-full p-1 border border-gray-100 animate-scale-up gap-1">
                        <button
                            onClick={() => updateQuantity(item.id, cartItem.quantity + 1)}
                            className="w-7 h-7 rounded-full bg-[#002C5F] flex items-center justify-center text-white active:scale-90"
                        >
                            <Plus size={14} strokeWidth={3} />
                        </button>
                        <span className="text-[11px] font-black text-[#002C5F]">
                            {cartItem.quantity}
                        </span>
                        <button
                            onClick={() => updateQuantity(item.id, cartItem.quantity - 1)}
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
    );
}
