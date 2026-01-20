# Plan de Correction - Radisson Menu App

Ce document détaille les étapes pour stabiliser l'application en local et synchroniser le déploiement.

## État actuel
- Le serveur local tourne sur `http://localhost:3000`.
- Des modifications locales ne sont pas sur GitHub.
- Problèmes UI : Animations capricieuses, images manquantes, recherche inactive.

## Phase 1 : Stabilisation du Code Local (TERMINÉ)
- [x] Fixer l'animation de la `Home Page` (éviter que les cartes restent invisibles).
- [x] Vérifier et corriger les chemins d'images (error 404).
- [x] Activer une recherche basique sur la page d'accueil.

## Phase 2 : Synchronisation GitHub & Cloudflare (TERMINÉ)
- [x] Faire un commit propre des changements actuels.
- [x] Pousser le code vers GitHub.
- [ ] Vérifier le déclenchement du build sur Cloudflare.

## Phase 3 : Optimisation du Déploiement Cloudflare (EN COURS)
- [/] Résoudre l'erreur de conflit de dépendance (`next` vs `@cloudflare/next-on-pages`).
- [ ] Ajuster la configuration `wrangler.toml` (vérifier `pages_build_output_dir`).
- [ ] Vérifier les variables d'environnement sur Cloudflare.
