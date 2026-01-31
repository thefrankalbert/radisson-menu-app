'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Définition des types
type CartItem = {
    id: string; // ou number selon ta BDD
    name: string;
    price: number;
    quantity: number;
    image_url?: string;
    restaurant_id?: string; // Important pour la vérification
    name_en?: string; // Pour la traduction
    // Support pour options et variantes
    selectedOption?: { name_fr: string; name_en?: string }; // Option sélectionnée (même prix)
    selectedVariant?: { name_fr: string; name_en?: string; price: number }; // Variante sélectionnée (prix différent)
    category_id?: string;
    category_name?: string;
};

type CartContextType = {
    items: CartItem[];
    addToCart: (item: CartItem, restaurantId: string, skipConfirm?: boolean) => Promise<void>;
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
    confirmPendingAddToCart: () => Promise<void>;
    cancelPendingAddToCart: () => void;
    notes: string;
    setNotes: (notes: string) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

// Génère une clé unique pour identifier un item du panier (inclut option/variante)
const getCartItemKey = (item: CartItem): string => {
    let key = item.id;
    if (item.selectedOption) {
        key += `-opt-${item.selectedOption.name_fr}`;
    }
    if (item.selectedVariant) {
        key += `-var-${item.selectedVariant.name_fr}`;
    }
    return key;
};

// Cache pour stocker les slugs des restaurants
const restaurantSlugCache = new Map<string, string>();

// Fonction pour obtenir le slug d'un restaurant depuis son ID
const getRestaurantSlug = async (restaurantId: string): Promise<string | null> => {
    // Vérifier le cache d'abord
    if (restaurantSlugCache.has(restaurantId)) {
        return restaurantSlugCache.get(restaurantId) || null;
    }

    try {
        const { data, error } = await supabase
            .from('restaurants')
            .select('slug')
            .eq('id', restaurantId)
            .single();

        if (error || !data) {
            console.error('Error fetching restaurant slug:', error);
            return null;
        }

        // Mettre en cache
        restaurantSlugCache.set(restaurantId, data.slug);
        return data.slug;
    } catch (error) {
        console.error('Error fetching restaurant slug:', error);
        return null;
    }
};

// Fonction pour vérifier si deux restaurants sont compatibles (même groupe)
const areRestaurantsCompatible = async (restaurantId1: string | null, restaurantId2: string): Promise<boolean> => {
    if (!restaurantId1 || restaurantId1 === restaurantId2) {
        return true; // Même restaurant ou panier vide
    }

    const slug1 = await getRestaurantSlug(restaurantId1);
    const slug2 = await getRestaurantSlug(restaurantId2);

    if (!slug1 || !slug2) {
        return false; // Si on ne peut pas récupérer les slugs, on refuse par sécurité
    }

    // Groupes de restaurants compatibles
    const panoramaGroup = ['carte-panorama-restaurant']; // Panorama et Tapas utilisent le même slug
    const lobbyGroup = ['carte-lobby-bar-snacks', 'pool']; // Lobby et Pool
    const drinksSlug = 'carte-des-boissons'; // Boissons

    // Vérifier si les deux restaurants sont dans le même groupe
    const isInPanoramaGroup = (slug: string) => panoramaGroup.some(s => slug.includes(s));
    const isInLobbyGroup = (slug: string) => lobbyGroup.some(s => slug.includes(s));
    const isDrinks = (slug: string) => slug.includes(drinksSlug);

    // Même groupe = compatible
    if (isInPanoramaGroup(slug1) && isInPanoramaGroup(slug2)) return true;
    if (isInLobbyGroup(slug1) && isInLobbyGroup(slug2)) return true;

    // Boissons est compatible avec Panorama et Lobby
    if (isDrinks(slug1) && (isInPanoramaGroup(slug2) || isInLobbyGroup(slug2))) return true;
    if (isDrinks(slug2) && (isInPanoramaGroup(slug1) || isInLobbyGroup(slug1))) return true;

    return false;
};

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
    const [items, setItems] = useState<CartItem[]>([]);
    const [currentRestaurantId, setCurrentRestaurantId] = useState<string | null>(null);
    const [lastVisitedMenuUrl, setLastVisitedMenuUrlState] = useState<string | null>(null);
    const [pendingAddToCart, setPendingAddToCart] = useState<{ item: CartItem; restaurantId: string } | null>(null);
    const [notes, setNotes] = useState<string>("");

    // Chargement initial depuis localStorage
    useEffect(() => {
        const savedCart = localStorage.getItem('cart');
        const savedResto = localStorage.getItem('cart_restaurant_id');
        const savedLastMenu = localStorage.getItem('radisson_last_menu');
        const savedNotes = localStorage.getItem('cart_notes');

        if (savedCart) setItems(JSON.parse(savedCart));
        if (savedResto) setCurrentRestaurantId(savedResto);
        if (savedLastMenu) setLastVisitedMenuUrlState(savedLastMenu);
        if (savedNotes) setNotes(savedNotes);
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
        localStorage.setItem('cart_notes', notes);
    }, [items, currentRestaurantId, lastVisitedMenuUrl, notes]);

    const addToCart = async (newItem: CartItem, restaurantId: string, skipConfirm: boolean = false) => {
        // Capturer l'état actuel pour éviter les race conditions
        const currentItems = items;
        const currentRestoId = currentRestaurantId;

        // Vérification Multi-Restaurant AVANT de modifier le state
        const isDifferentRestaurant = currentItems.length > 0 && currentRestoId && currentRestoId !== restaurantId;

        if (isDifferentRestaurant && !skipConfirm) {
            // Vérifier si les restaurants sont compatibles (async)
            const compatible = await areRestaurantsCompatible(currentRestoId, restaurantId);
            if (!compatible) {
                setPendingAddToCart({ item: newItem, restaurantId });
                return;
            }
            // Si compatibles, on continue sans modal
        }

        // Déterminer l'action à effectuer (calculé en dehors de setItems)
        const shouldClearCart = isDifferentRestaurant && skipConfirm;
        const shouldSetNewRestaurant = currentItems.length === 0 || shouldClearCart;

        // Mise à jour du restaurant ID si nécessaire
        if (shouldSetNewRestaurant) {
            setCurrentRestaurantId(restaurantId);
        }

        // Mise à jour synchrone des items
        setItems((prevItems) => {
            // Si on doit vider le panier (changement de restaurant confirmé)
            if (shouldClearCart) {
                return [{ ...newItem, quantity: 1, restaurant_id: restaurantId }];
            }

            // Vérification si l'item existe déjà (avec même option/variante)
            const cartItemKey = getCartItemKey(newItem);
            const existingItem = prevItems.find((i) => getCartItemKey(i) === cartItemKey);

            if (existingItem) {
                return prevItems.map((i) =>
                    getCartItemKey(i) === cartItemKey ? { ...i, quantity: i.quantity + 1 } : i
                );
            }

            return [...prevItems, { ...newItem, quantity: 1, restaurant_id: restaurantId }];
        });
    };

    const confirmPendingAddToCart = async () => {
        if (pendingAddToCart) {
            await addToCart(pendingAddToCart.item, pendingAddToCart.restaurantId, true);
            setPendingAddToCart(null);
        }
    };

    const cancelPendingAddToCart = () => {
        setPendingAddToCart(null);
    };

    const removeFromCart = (id: string) => {
        setItems((prev) => {
            // Utilise la clé unique pour trouver l'item (supporte options/variantes)
            const newItems = prev.filter((i) => getCartItemKey(i) !== id && i.id !== id);
            if (newItems.length === 0) setCurrentRestaurantId(null);
            return newItems;
        });
    };

    const updateQuantity = (id: string, quantity: number) => {
        if (quantity < 1) return removeFromCart(id);
        setItems((prev) =>
            prev.map((i) => (getCartItemKey(i) === id || i.id === id ? { ...i, quantity } : i))
        );
    };

    const clearCart = () => {
        setItems([]);
        setCurrentRestaurantId(null);
        localStorage.removeItem('cart');
        localStorage.removeItem('cart_restaurant_id');
        localStorage.removeItem('cart_notes');
        setNotes("");
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
                cancelPendingAddToCart,
                notes,
                setNotes
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
