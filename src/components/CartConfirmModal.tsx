"use client";

import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import ConfirmModal from "./ConfirmModal";

export default function CartConfirmModal() {
    const { pendingAddToCart, confirmPendingAddToCart, cancelPendingAddToCart } = useCart();
    const { language } = useLanguage();

    return (
        <ConfirmModal
            isOpen={pendingAddToCart !== null}
            onClose={cancelPendingAddToCart}
            onConfirm={confirmPendingAddToCart}
            title={language === 'fr' ? "Changer de restaurant" : "Change restaurant"}
            message={language === 'fr' 
                ? "Vous changez de carte de restaurant. Votre panier actuel sera vidé. Continuer ?" 
                : "You are changing restaurant menu. Your current cart will be cleared. Continue?"}
            confirmText={language === 'fr' ? "Continuer" : "Continue"}
            cancelText={language === 'fr' ? "Annuler" : "Cancel"}
            variant="warning"
        />
    );
}
