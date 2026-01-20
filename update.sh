#!/bin/bash

# Script de mise à jour et déploiement pour VPS
# Usage: ./update.sh [--force] [--no-build] [--no-restart]

set -e  # Arrêter en cas d'erreur

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
# Détecter automatiquement le répertoire Git actuel
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
GIT_BRANCH="${GIT_BRANCH:-main}"

# Options
FORCE=false
NO_BUILD=false
NO_RESTART=false

# Parser les arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --force)
            FORCE=true
            shift
            ;;
        --no-build)
            NO_BUILD=true
            shift
            ;;
        --no-restart)
            NO_RESTART=true
            shift
            ;;
        *)
            echo -e "${RED}Option inconnue: $1${NC}"
            echo "Usage: $0 [--force] [--no-build] [--no-restart]"
            exit 1
            ;;
    esac
done

# Fonction pour afficher les messages
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

# Vérifier que nous sommes dans le bon répertoire
if [ ! -d "$APP_DIR" ]; then
    log_error "Le répertoire $APP_DIR n'existe pas!"
    exit 1
fi

# Changer vers le répertoire de l'application
cd "$APP_DIR"
log_info "Répertoire Git détecté: $(pwd)"

# Charger NVM
log_info "Chargement de NVM..."
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Vérifier que NVM est chargé
if ! command -v nvm &> /dev/null && [ ! -s "$NVM_DIR/nvm.sh" ]; then
    log_error "NVM n'est pas installé ou n'est pas accessible!"
    exit 1
fi

# Utiliser la version Node.js spécifiée
log_info "Utilisation de Node.js $NODE_VERSION..."
nvm use $NODE_VERSION || nvm install $NODE_VERSION

# Résoudre le problème de propriété Git si nécessaire
if git config --global --get safe.directory "$APP_DIR" &> /dev/null; then
    log_info "Répertoire Git sécurisé configuré"
else
    log_warning "Configuration de la sécurité Git pour ce répertoire..."
    git config --global --add safe.directory "$APP_DIR" || true
fi

# Vérifier que Git est initialisé
if [ ! -d ".git" ]; then
    log_warning "Le répertoire n'est pas un dépôt Git. Initialisation..."
    git init
    git config --global --add safe.directory "$APP_DIR" || true
    git remote add origin https://github.com/thefrankalbert/radisson-menu-app.git || true
fi

# Vérifier le remote origin
if ! git remote get-url origin &> /dev/null; then
    log_warning "Remote origin non configuré. Ajout..."
    git remote add origin https://github.com/thefrankalbert/radisson-menu-app.git
fi

# Sauvegarder les modifications locales
log_info "Vérification des modifications locales..."
if [ -n "$(git status --porcelain)" ]; then
    log_warning "Modifications locales détectées. Sauvegarde..."
    STASH_MESSAGE="Sauvegarde avant mise à jour $(date +%Y%m%d_%H%M%S)"
    git stash push -m "$STASH_MESSAGE" || true
    STASHED=true
else
    STASHED=false
fi

# Récupérer les dernières modifications depuis GitHub
log_info "Récupération des modifications depuis GitHub (branche: $GIT_BRANCH)..."
if [ "$FORCE" = true ]; then
    git fetch origin
    git reset --hard origin/$GIT_BRANCH
else
    git fetch origin
    git pull origin $GIT_BRANCH || {
        log_error "Erreur lors du pull. Vérifiez les conflits ou utilisez --force"
        exit 1
    }
fi

# Réappliquer les modifications locales si elles existaient
if [ "$STASHED" = true ]; then
    log_info "Réapplication des modifications locales..."
    if git stash pop 2>/dev/null; then
        # Vérifier les conflits sur ecosystem.config.js
        if git status | grep -q "CONFLICT.*ecosystem.config.js"; then
            log_warning "Conflit détecté sur ecosystem.config.js. Conservation de la version locale..."
            git checkout --ours ecosystem.config.js
            git add ecosystem.config.js
        fi
        
        # Vérifier les conflits sur .env.production
        if git status | grep -q "CONFLICT.*\.env.production"; then
            log_warning "Conflit détecté sur .env.production. Conservation de la version locale..."
            git checkout --ours .env.production
            git add .env.production
        fi
        
        # Résoudre les autres conflits si nécessaire
        if [ -n "$(git status --porcelain | grep '^UU')" ]; then
            log_warning "Conflits détectés. Résolution automatique..."
            git checkout --ours .env.production ecosystem.config.js 2>/dev/null || true
            git add .env.production ecosystem.config.js 2>/dev/null || true
        fi
    fi
fi

# Vérifier que .env.production existe
if [ ! -f ".env.production" ]; then
    log_warning ".env.production n'existe pas. Vérifiez votre configuration!"
fi

# Installer les dépendances
log_info "Installation des dépendances..."
npm install --legacy-peer-deps || {
    log_error "Erreur lors de l'installation des dépendances"
    exit 1
}

# Builder l'application
if [ "$NO_BUILD" = false ]; then
    log_info "Build de l'application..."
    npm run build || {
        log_error "Erreur lors du build"
        exit 1
    }
    log_success "Build terminé avec succès!"
else
    log_warning "Build ignoré (--no-build)"
fi

# Redémarrer PM2
if [ "$NO_RESTART" = false ]; then
    log_info "Redémarrage de l'application avec PM2..."
    
    # Vérifier si PM2 est installé
    if ! command -v pm2 &> /dev/null; then
        log_warning "PM2 n'est pas installé. Installation..."
        npm install -g pm2
    fi
    
    # Vérifier si l'application est déjà en cours d'exécution
    if pm2 list | grep -q "$APP_NAME"; then
        log_info "Redémarrage de $APP_NAME..."
        pm2 restart "$APP_NAME" --update-env || {
            log_error "Erreur lors du redémarrage PM2"
            exit 1
        }
    else
        log_info "Démarrage de $APP_NAME..."
        pm2 start ecosystem.config.js || {
            log_error "Erreur lors du démarrage PM2"
            exit 1
        }
        pm2 save
    fi
    
    log_success "Application redémarrée!"
else
    log_warning "Redémarrage ignoré (--no-restart)"
fi

# Afficher le statut
echo ""
log_success "Mise à jour terminée avec succès!"
echo ""
log_info "Statut PM2:"
pm2 status "$APP_NAME" || true
echo ""
log_info "Pour voir les logs: pm2 logs $APP_NAME"
log_info "Pour voir les logs en temps réel: pm2 logs $APP_NAME --lines 50"

