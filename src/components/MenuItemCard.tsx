"use client";

import { Plus, Minus, Leaf, Flame } from "lucide-react";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { useState } from "react";

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
}

export default function MenuItemCard({ item, restaurantId }: MenuItemProps) {
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
            quantity: 1, // Fix: Explicitly provide quantity as required by CartContext type
        }, restaurantId);
        setTimeout(() => setIsAnimating(false), 300);
    };

    return (
        <div className="group bg-white rounded-3xl p-3 shadow-lg shadow-gray-100 border border-gray-100 relative flex items-stretch gap-4 hover:border-radisson-gold/30 transition-all duration-300 h-full">
            {/* Left Content */}
            <div className="flex-1 flex flex-col justify-between py-1 pl-1 min-w-0">
                <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-base md:text-lg font-bold text-gray-900 leading-tight line-clamp-2">
                            {item.name}
                        </h3>
                        <div className="flex gap-1 flex-shrink-0 pt-1">
                            {item.is_vegetarian && <Leaf size={14} className="text-green-500" />}
                            {item.is_spicy && <Flame size={14} className="text-red-500" />}
                        </div>
                    </div>

                    <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 mb-3">
                        {item.description}
                    </p>
                </div>

                <div className="mt-auto">
                    <span className="text-radisson-blue font-black text-base md:text-lg">
                        {item.price?.toLocaleString()} <span className="text-[10px] text-radisson-gold font-bold ml-0.5">FCFA</span>
                    </span>
                </div>
            </div>

            {/* Right Image & Action */}
            <div className="relative w-28 h-28 md:w-36 md:h-36 flex-shrink-0 rounded-2xl overflow-hidden bg-gray-50 shadow-inner">
                {item.image_url ? (
                    <Image
                        src={item.image_url}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-200 flex items-center justify-center">
                        <span className="text-gray-300 text-xs font-bold uppercase tracking-widest">Radisson</span>
                    </div>
                )}

                {/* Floating Action Button (FAB) or Counter */}
                <div className="absolute bottom-2 right-2 z-10">
                    {cartItem ? (
                        <div className="flex items-center bg-white rounded-full p-1 shadow-lg border border-gray-100 animate-scale-up">
                            <button
                                onClick={() => updateQuantity(item.id, cartItem.quantity - 1 >= 0 ? cartItem.quantity - 1 : 0)}
                                // Actually updateQuantity logic usually takes newQuantity or delta?
                                // Context says: updateQuantity(id, quantity).
                                // So I should pass the NEW quantity.
                                // If current is 1, passing 0 removes it (if logic in context supports it).
                                // Let's check CartContext logic briefly?
                                // User provided context code: "if (quantity < 1) return removeFromCart(id);"
                                // So passing 0 is fine.
                                className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-radisson-blue hover:bg-red-50 hover:text-red-500 transition-colors active:scale-90"
                            >
                                <Minus size={14} strokeWidth={3} />
                            </button>
                            <span className="w-6 text-center text-xs font-black text-radisson-blue">
                                {cartItem.quantity}
                            </span>
                            <button
                                onClick={() => updateQuantity(item.id, cartItem.quantity + 1)}
                                className="w-7 h-7 rounded-full bg-radisson-blue flex items-center justify-center text-white hover:bg-radisson-dark transition-colors active:scale-90"
                            >
                                <Plus size={14} strokeWidth={3} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleAdd}
                            className={`w-10 h-10 rounded-full bg-white text-radisson-blue shadow-lg flex items-center justify-center hover:bg-radisson-blue hover:text-white transition-all active:scale-90 ${isAnimating ? "!bg-radisson-gold !text-white scale-110" : ""
                                }`}
                        >
                            <Plus size={20} strokeWidth={3} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
