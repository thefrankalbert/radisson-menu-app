'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Définition des types
type CartItem = {
    id: string; // ou number selon ta BDD
    name: string;
    price: number;
    quantity: number;
    image_url?: string;
    restaurant_id?: string; // Important pour la vérification
    name_en?: string; // Pour la traduction
};

type CartContextType = {
    items: CartItem[];
    addToCart: (item: CartItem, restaurantId: string, skipConfirm?: boolean) => void;
    removeFromCart: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    totalItems: number;
    totalPrice: number;
    currentRestaurantId: string | null;
    // Adding back previous keys to avoid breaking build, mapping them to new state
    restaurantId: string | null;
    lastVisitedMenuUrl: string | null;
    setLastVisitedMenuUrl: (url: string) => void;
    pendingAddToCart: { item: CartItem; restaurantId: string } | null;
    confirmPendingAddToCart: () => void;
    cancelPendingAddToCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
    const [items, setItems] = useState<CartItem[]>([]);
    const [currentRestaurantId, setCurrentRestaurantId] = useState<string | null>(null);
    const [lastVisitedMenuUrl, setLastVisitedMenuUrlState] = useState<string | null>(null);
    const [pendingAddToCart, setPendingAddToCart] = useState<{ item: CartItem; restaurantId: string } | null>(null);

    // Chargement initial depuis localStorage
    useEffect(() => {
        const savedCart = localStorage.getItem('cart');
        const savedResto = localStorage.getItem('cart_restaurant_id');
        const savedLastMenu = localStorage.getItem('radisson_last_menu');

        if (savedCart) setItems(JSON.parse(savedCart));
        if (savedResto) setCurrentRestaurantId(savedResto);
        if (savedLastMenu) setLastVisitedMenuUrlState(savedLastMenu);
    }, []);

    // Sauvegarde automatique
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(items));
        if (currentRestaurantId) {
            localStorage.setItem('cart_restaurant_id', currentRestaurantId);
        } else {
            localStorage.removeItem('cart_restaurant_id');
        }
        if (lastVisitedMenuUrl) {
            localStorage.setItem("radisson_last_menu", lastVisitedMenuUrl);
        } else {
            localStorage.removeItem("radisson_last_menu");
        }
    }, [items, currentRestaurantId, lastVisitedMenuUrl]);

    const addToCart = (newItem: CartItem, restaurantId: string, skipConfirm: boolean = false) => {
        // Vérification Multi-Restaurant avant de modifier le state
        if (items.length > 0 && currentRestaurantId && currentRestaurantId !== restaurantId && !skipConfirm) {
            setPendingAddToCart({ item: newItem, restaurantId });
            return;
        }

        setItems((prevItems) => {
            // Si on change de restaurant (skipConfirm = true)
            if (prevItems.length > 0 && currentRestaurantId && currentRestaurantId !== restaurantId) {
                setCurrentRestaurantId(restaurantId);
                return [{ ...newItem, quantity: 1, restaurant_id: restaurantId }];
            }

            // Si c'est le même restaurant ou panier vide
            if (prevItems.length === 0) {
                setCurrentRestaurantId(restaurantId);
            }

            // 2. Vérification si l'item existe déjà
            const existingItem = prevItems.find((i) => i.id === newItem.id);
            if (existingItem) {
                return prevItems.map((i) =>
                    i.id === newItem.id ? { ...i, quantity: i.quantity + 1 } : i
                );
            }

            return [...prevItems, { ...newItem, quantity: 1, restaurant_id: restaurantId }];
        });
    };

    const confirmPendingAddToCart = () => {
        if (pendingAddToCart) {
            addToCart(pendingAddToCart.item, pendingAddToCart.restaurantId, true);
            setPendingAddToCart(null);
        }
    };

    const cancelPendingAddToCart = () => {
        setPendingAddToCart(null);
    };

    const removeFromCart = (id: string) => {
        setItems((prev) => {
            const newItems = prev.filter((i) => i.id !== id);
            if (newItems.length === 0) setCurrentRestaurantId(null);
            return newItems;
        });
    };

    const updateQuantity = (id: string, quantity: number) => {
        if (quantity < 1) return removeFromCart(id);
        setItems((prev) =>
            prev.map((i) => (i.id === id ? { ...i, quantity } : i))
        );
    };

    const clearCart = () => {
        setItems([]);
        setCurrentRestaurantId(null);
        localStorage.removeItem('cart');
        localStorage.removeItem('cart_restaurant_id');
    };

    const setLastVisitedMenuUrl = (url: string) => {
        setLastVisitedMenuUrlState(url);
    };

    const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
    const totalPrice = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

    return (
        <CartContext.Provider
            value={{
                items,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                totalItems,
                totalPrice,
                currentRestaurantId,
                // Compatibility Aliases
                restaurantId: currentRestaurantId,
                lastVisitedMenuUrl,
                setLastVisitedMenuUrl,
                pendingAddToCart,
                confirmPendingAddToCart,
                cancelPendingAddToCart
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
