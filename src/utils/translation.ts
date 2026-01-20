
/**
 * Helper central pour la traduction des contenus dynamiques.
 * Retourne le contenu en Anglais si la langue est 'en' et que le contenu EN existe.
 * Sinon retourne le contenu par défaut (Français).
 * 
 * @param lang - Code langue ('fr' | 'en')
 * @param frContent - Contenu en Français (défaut)
 * @param enContent - Contenu en Anglais (optionnel)
 */
export const getTranslatedContent = (
    lang: string,
    frContent: string,
    enContent?: string | null
): string => {
    // Si la langue est Anglais ET que le contenu anglais existe et n'est pas vide/whitespace
    if (lang === 'en' && enContent && enContent.trim().length > 0) {
        return enContent;
    }
    // Sinon (Français ou contenu anglais manquant), on retourne le Français
    return frContent || "";
};
