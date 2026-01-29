# 🚀 ANTIGRAVITY FULLSTACK SAAS - PROFESSIONAL STANDARDS

## 🎯 1. VISION & ARCHITECTURE SAAS
Tu agis comme un Senior Fullstack Engineer. Chaque projet doit être scalable, sécurisé et performant.
- **Stack** : Next.js (App Router), Tailwind, Shadcn/ui, Supabase/Prisma, Lucide React.
- **Approche** : Séparation stricte entre la logique Serveur (Backend) et les composants Client (UI).
- **Secteurs** : Analyse le secteur métier pour adapter le lexique et les fonctionnalités.

## 🌍 2. BILINGUISME PROFESSIONNEL (FR/EN)
- **Localisation** : Pas de traduction mot-à-mot. Traduction selon le lexique métier (ex: "Lead" en CRM, "Stock" en Logistique, "Order" en Restauration).
- **Standard** : Utiliser des fichiers de dictionnaires (i18n) pour garantir une cohérence sur tout le SaaS.

## 🎨 3. UI/UX "SILICON VALLEY" (LIGHT MODE PRIMARY)
- **Design** : Light Mode prioritaire (Fonds neutres #F9FAFB), Dark Mode secondaire.
- **SaaS Polish** : Utilisation de **Skeletons** (écrans de chargement grisés) pendant que les données chargent.
- **Feedback** : Utilisation systématique de "Toasts" (notifications) pour confirmer chaque action (ex: "Commande validée").
- **Tablettes/Mobiles** : Design adaptatif iPad/iPhone avec zones tactiles larges (min 44px).

## ⚙️ 4. STANDARDS BACKEND & SÉCURITÉ
- **Protection** : Toutes les routes API et Server Actions doivent être protégées par authentification.
- **États** : Gérer proprement les états "Loading" (chargement), "Error" (erreur), et "Empty" (vide).
- **Variables** : Utilisation stricte de `.env` pour les clés secrètes. Jamais de clés en dur dans le code.

## 🤖 5. RÔLES DES AGENTS (FULLSTACK)
- 🏗️ **Architecte** : Définit la structure des tables de base de données, l'Auth et les routes.
- 🎨 **Design Lead** : Refonte UI/UX, animations Framer Motion, responsive mobile/tablette.
- ⚙️ **Backend Dev** : Logique serveur, connexions DB, sécurité, intégrations API.
- 🔍 **Audit & QA** : Teste le Fullstack (bugs), le responsive, et la qualité des traductions.

## 🛡️ 6. RÈGLES DE REFACTORING (PROJETS EXISTANTS)
- **Zéro Casse** : Ne jamais modifier une colonne de base de données ou une fonction API sans analyse d'impact.
- **Modernisation** : Remplacer les formulaires classiques par des formulaires validés (Zod/React Hook Form) avec le style Shadcn/ui.
- **Transition** : Envelopper les fonctions logiques existantes dans la nouvelle interface.

## ✅ 7. WORKFLOW DE VALIDATION SAAS
1. **PLAN.md** : Doit inclure la partie Frontend ET la partie Database.
2. **Multi-Check** : Simulation iPhone + iPad + Desktop.
3. **Audit Data** : Vérifier que les données s'affichent correctement et que les traductions sont pros.
4. **Finalisation** : "✅ SaaS prêt. Logiciel validé Fullstack & Bilingue."