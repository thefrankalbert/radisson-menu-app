# Blu Table — système de design de l'interface convive

Portée : les écrans client (accueil, carte, fiche plat, panier, commandes, réglages).
L'admin garde son propre châssis shadcn light/dark et n'est pas concerné.

## Direction

Le convive est assis à table au Radisson Blu N'Djamena, téléphone en main, souvent
en train de parler à quelqu'un. Il veut voir ce qui existe, comprendre un prix, et
commander sans réfléchir à l'outil. L'interface doit se sentir **calme et hôtelière** —
pas ludique, pas « app de livraison » — mais aussi rapide et sans cérémonie.

La structure est reprise du storefront Attabl (voir `../attabl-saas`), retokenisée
à l'identité Radisson. Le vert UberEats d'origine a été remplacé par le navy maison :
sur une carte d'hôtel il porte l'autorité que le vert n'a pas.

Mode clair uniquement. La photographie culinaire tient mieux sur blanc, et c'est
la norme du secteur (UberEats, Deliveroo, Just Eat).

## Jetons

Tous portés par le scope `.client-ui` dans `src/app/globals.css`.

| Rôle | Jeton | Valeur |
|---|---|---|
| Marque, actions | `--color-brand` | `#003058` (navy Radisson) |
| Marque appuyée | `--color-brand-dark` | `#002545` |
| Fond de marque | `--color-brand-light` | `#eaf1f7` |
| Fond | `--color-bg` | `#ffffff` |
| Surface secondaire | `--color-surface-alt` | `#f6f7f9` |
| Séparateur | `--color-divider` | `#e9ecef` |
| Texte 1 | `--color-ink` | `#14181d` |
| Texte 2 | `--color-ink-2` | `#3d444d` |
| Texte 3 | `--color-ink-muted` | `#6f7780` |
| Texte 4 | `--color-ink-soft` | `#adb3ba` |
| Or maison (accent, notes) | `--color-rating` | `#c5a065` |
| Promo, destructif | `--color-promo` | `#c0392b` |
| Succès, végétarien | `--color-success` | `#1c7c54` |
| Canevas sans photo | `--color-ivory` / `-fg` | `#f7f4ee` / `#a3937a` |

Rayons : `--radius-tag` 8 · `--radius-search` 10 · `--radius-card` 12 ·
`--radius-modal` 16 · `--radius-pill` 24 · `--radius-button-round` 50.

**Profondeur : bordures d'abord.** Une bordure `--color-divider` définit les cartes
et les séparations. Les ombres sont réservées aux éléments qui décollent vraiment :
le « + » des cartes plat, le panier flottant, les feuilles modales. Ne pas mélanger.

Une seule couleur d'accent. Le gris construit la structure, le navy signale l'action.
L'or reste rare — s'il apparaît partout il ne veut plus rien dire.

## Typographie

Plus Jakarta Sans (`--font-jakarta`), déjà en place. Le mono du système sert aux
étiquettes techniques (capitales, `tracking` 0.4–0.5px, 11px) : « VOUS ÊTES AU »,
titres de section des réglages, unités monétaires.

Échelle en pixels exacts, tracking négatif qui se resserre quand la taille monte :

- `11px / 500 / mono / +0.5px` — étiquette de section
- `12.5px / 400` — description, méta
- `13.5px / 600 / -0.2px` — nom de plat en vitrine
- `15.5px / 600 / -0.3px` — nom de plat en liste
- `16px / 600 / -0.4px` — titre d'écran
- `18.5px / 600 / -0.6px` — titre de section
- `20px / 700 / -0.6px` — barre de catégorie collante
- `22px / 600 / -0.7px` — nom de plat en fiche
- `25px / 600 / -0.9px` — héros

La hiérarchie passe par **graisse + couleur** autant que par taille. Tout nombre
qui change porte `tabular-nums` — sinon la mise en page saute à chaque quantité.

Le prix se compose en deux niveaux : montant dominant, unité en mono ~0.7× et
plus discrète (`components/client/Price.tsx`). Ne pas rendre `formatPrice()` brut
dans les vitrines.

## Densité et rythme

Base 4px. Gouttières d'écran : `px-4`. Cartes : `px-4 py-[13px]` à `py-[15px]`.
Sections espacées de `pt-5 pb-3.5` via `SectionHeader`.

Le rythme est volontairement inégal : les zones de contrôle sont serrées
(steppers, pastilles), le contenu respire. Une grille monotone signale que
personne n'a décidé.

## Mesures à retenir

- Coque : `client-ui flex h-dvh flex-col overflow-hidden`, une seule zone
  scrollable `#main-content` avec `overscroll-contain`, colonne `max-w-lg`.
  `#main-content` est aussi le conteneur de défilement visé par le scroll-spy.
- Barre d'onglets : 5 colonnes, hauteur 64px, icônes 22px (`strokeWidth` 2.2 actif,
  1.8 sinon), libellé 10.5px, `env(safe-area-inset-bottom)`.
- Panier flottant : `bottom-[92px]`, au-dessus de la barre d'onglets, `max-w-lg`
  centré (il est `fixed`, donc calé sur la fenêtre et non sur la coque).
- Carte plat liste : photo 104×104, `+` 34px débordant de `-6px` sur le coin.
- Carte plat vitrine : 200px de large, photo 140px de haut.
- Fiche plat : feuille `top-[46px]`, photo 250px, barre d'action 54px de haut.
- Pile collante de la carte : header 63 + pastilles 48 + titre ~58 = **169px**.
  Les sections portent `scroll-mt-[170px]` ; la dernière reçoit
  `min-h-[calc(100dvh-169px)]` pour pouvoir remonter sous la pile.
- Zones tactiles : 44px pour les cibles isolées (bouton compte, interrupteur).
  Jamais deux zones tactiles adjacentes qui se chevauchent (stepper `−`/`+`).

## Mouvement

Ressenti, pas regardé. `active:scale-95` (ou `0.98` sur les grandes surfaces) sur
tout ce qui se presse. Transitions 150ms sur les couleurs, 200–320ms sur les
feuilles avec `cubic-bezier(0.2, 0.8, 0.2, 1)` à l'entrée et `(0.32, 0.72, 0, 1)`
à la sortie. Ne jamais partir de `scale(0)`. `useReducedMotion` de framer-motion
est respecté sur les feuilles : l'opacité reste, le déplacement disparaît.

## Règles apprises sur les données

- **Photos** : tout passe par `components/client/Photo.tsx`. Absente, marquée
  « placeholder » ou en échec de chargement → visuel de repli ivoire. Passer
  `fallback={null}` quand le conteneur porte déjà son fond (tuiles de cartes sur
  fond encre). Ne jamais rendre `next/Image` directement sur une URL venue de la base.
- **Colonnes** : vérifier le schéma réel avant d'écrire un `select`. PostgREST
  répond 400 sur une colonne absente et supabase-js met `data` à `null` sans lever :
  l'écran se rend vide et muet. Logger `error` côté serveur.
- **Drapeaux vides** : aucune ligne n'est `is_featured`/`is_popular` en base.
  Toute section « mise en avant » a besoin d'un repli, sinon elle est vide en prod.

## Champs de saisie

16px minimum sur mobile (`text-[16px] md:text-[14px]`) : en dessous, iOS zoome sur
le champ au focus et casse la mise en page.
