#!/bin/bash

# Script de déploiement initial pour VPS
# Usage: ./deploy.sh

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
# Détecter automatiquement le répertoire Git actuel ou utiliser le répertoire du script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -d "$SCRIPT_DIR/.git" ]; then
    APP_DIR="$SCRIPT_DIR"
else
    # Si le script n'est pas dans un dépôt Git, chercher le dépôt parent
    CURRENT_DIR="$SCRIPT_DIR"
    while [ "$CURRENT_DIR" != "/" ]; do
        if [ -d "$CURRENT_DIR/.git" ]; then
            APP_DIR="$CURRENT_DIR"
            break
        fi
        CURRENT_DIR="$(dirname "$CURRENT_DIR")"
    done
    # Fallback vers le répertoire par défaut si aucun Git trouvé
    APP_DIR="${APP_DIR:-$HOME/htdocs/www.theblutable.com/radisson-menu-app}"
fi
APP_NAME="radisson-menu-app"
NODE_VERSION="18"
GIT_REPO="https://github.com/thefrankalbert/radisson-menu-app.git"
GIT_BRANCH="${GIT_BRANCH:-main}"

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_info "🚀 Déploiement initial de l'application"
echo ""

# Vérifier/Créer le répertoire
if [ ! -d "$APP_DIR" ]; then
    log_info "Création du répertoire $APP_DIR..."
    mkdir -p "$APP_DIR"
fi

cd "$APP_DIR"
log_info "Répertoire de travail: $(pwd)"

# Résoudre le problème de propriété Git si nécessaire
if git config --global --get safe.directory "$APP_DIR" &> /dev/null; then
    log_info "Répertoire Git sécurisé configuré"
else
    log_warning "Configuration de la sécurité Git pour ce répertoire..."
    git config --global --add safe.directory "$APP_DIR" || true
fi

# Installer NVM si nécessaire
log_info "Vérification de NVM..."
export NVM_DIR="$HOME/.nvm"
if [ ! -d "$NVM_DIR" ]; then
    log_warning "NVM n'est pas installé. Installation..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

# Charger NVM
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Installer Node.js
log_info "Installation de Node.js $NODE_VERSION..."
nvm install $NODE_VERSION || nvm use $NODE_VERSION
nvm alias default $NODE_VERSION

# Vérifier Git
if ! command -v git &> /dev/null; then
    log_error "Git n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Cloner ou mettre à jour le repository
if [ -d ".git" ]; then
    log_warning "Le dépôt Git existe déjà. Mise à jour..."
    git fetch origin
    git reset --hard origin/$GIT_BRANCH
else
    log_info "Clonage du repository..."
    git clone -b $GIT_BRANCH $GIT_REPO .
fi

# Vérifier/Créer .env.production
if [ ! -f ".env.production" ]; then
    log_warning ".env.production n'existe pas!"
    log_info "Création d'un fichier .env.production exemple..."
    cat > .env.production << EOF
# Variables d'environnement de production
# Remplacez les valeurs ci-dessous par vos vraies valeurs

NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon
NODE_ENV=production
PORT=3000
EOF
    log_warning "⚠️  IMPORTANT: Modifiez .env.production avec vos vraies valeurs avant de continuer!"
    read -p "Appuyez sur Entrée après avoir modifié .env.production..."
fi

# Installer les dépendances
log_info "Installation des dépendances..."
npm install --legacy-peer-deps

# Builder l'application
log_info "Build de l'application..."
npm run build

# Installer PM2
log_info "Installation de PM2..."
npm install -g pm2 || log_warning "PM2 pourrait déjà être installé"

# Créer le répertoire pour les logs
mkdir -p logs

# Démarrer avec PM2
log_info "Démarrage de l'application avec PM2..."
pm2 start ecosystem.config.js || {
    log_warning "L'application pourrait déjà être en cours d'exécution"
    pm2 restart "$APP_NAME" --update-env
}

# Sauvegarder la configuration PM2
pm2 save

# Configurer PM2 pour démarrer au boot
log_info "Configuration de PM2 pour démarrer au boot..."
log_warning "Exécutez la commande suivante si demandé:"
pm2 startup || true

# Rendre update.sh exécutable
if [ -f "update.sh" ]; then
    chmod +x update.sh
    log_success "Script update.sh rendu exécutable"
fi

# Afficher le statut
echo ""
log_success "Déploiement terminé!"
echo ""
log_info "Statut PM2:"
pm2 status
echo ""
log_info "Commandes utiles:"
log_info "  - Voir les logs: pm2 logs $APP_NAME"
log_info "  - Redémarrer: pm2 restart $APP_NAME"
log_info "  - Arrêter: pm2 stop $APP_NAME"
log_info "  - Mise à jour: ./update.sh"
echo ""

