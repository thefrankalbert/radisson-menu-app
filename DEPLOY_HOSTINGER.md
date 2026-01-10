# 🚀 Guide de Déploiement - Hostinger VPS avec CloudPanel

## Étape 1: Configuration dans CloudPanel

1. Créer un site Node.js dans CloudPanel
   - Port: **3000**
   - Node.js version: **18**
   - Domain: votre domaine

2. Configurer les variables d'environnement dans CloudPanel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NODE_ENV=production`
   - `PORT=3000`

## Étape 2: Installation sur le serveur

```bash
# Aller dans le répertoire du site
cd ~/htdocs/www.theblutable.com

# Supprimer le dossier cloné précédemment (si existe)
rm -rf radisson-menu-app

# Cloner le repo mis à jour
git clone https://github.com/thefrankalbert/radisson-menu-app.git .

# Charger nvm (si pas déjà chargé)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 18

# Installer les dépendances
npm install

# Builder l'application
npm run build

# Installer PM2 (si pas déjà installé)
npm install -g pm2

# Démarrer avec PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Vérification

```bash
pm2 status
pm2 logs radisson-menu-app
```
