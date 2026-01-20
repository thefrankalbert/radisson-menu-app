# 🚀 Guide de Déploiement Complet - Serveur Hostinger VPS

## 📋 Prérequis

- Accès SSH au serveur : `blu@148.230.115.224`
- Compte GitHub avec le repository du projet
- Variables d'environnement Supabase :
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- CloudPanel configuré avec le domaine : `www.theblutable.com`

---

## 🔧 Étape 1 : Connexion SSH et Préparation

```bash
# Se connecter au serveur
ssh blu@148.230.115.224

# Aller dans le répertoire htdocs
cd ~/htdocs

# Vérifier que le répertoire du site existe, sinon le créer
mkdir -p www.theblutable.com
cd www.theblutable.com
```

---

## 📦 Étape 2 : Installation de Node.js via NVM

```bash
# Installer NVM (Node Version Manager) si pas déjà installé
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Charger NVM dans la session actuelle
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Installer Node.js 18
nvm install 18
nvm use 18
nvm alias default 18

# Vérifier l'installation
node --version  # Doit afficher v18.x.x
npm --version   # Doit afficher une version npm
```

---

## 📥 Étape 3 : Cloner le Repository GitHub

```bash
# Aller dans le répertoire du site
cd ~/htdocs/www.theblutable.com

# Cloner le repository (remplacez par votre URL GitHub)
git clone https://github.com/VOTRE_USERNAME/VOTRE_REPO.git .

# OU si le répertoire existe déjà avec des fichiers :
# git init
# git remote add origin https://github.com/VOTRE_USERNAME/VOTRE_REPO.git
# git pull origin main
```

**⚠️ Si erreur "dubious ownership"** :
```bash
git config --global --add safe.directory /home/theblutable/htdocs/www.theblutable.com
```

---

## 🔐 Étape 4 : Configuration des Variables d'Environnement

```bash
# Créer le fichier .env.production
nano .env.production
```

**Ajouter les variables suivantes** (remplacez par vos vraies valeurs) :
```
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon
```

**Sauvegarder** : `Ctrl+X`, puis `Y`, puis `Entrée`

---

## 📝 Étape 5 : Vérifier/Créer ecosystem.config.js

Vérifier que le fichier `ecosystem.config.js` existe et contient :

```bash
cat ecosystem.config.js
```

Si le fichier n'existe pas ou est incorrect, le créer :

```bash
nano ecosystem.config.js
```

**Contenu du fichier** :
```javascript
const fs = require('fs');
const path = require('path');

// Charger les variables depuis .env.production
function loadEnvFile() {
  const envPath = path.join(__dirname, '.env.production');
  const env = {};
  
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        }
      }
    });
  }
  
  return env;
}

const envVars = loadEnvFile();

module.exports = {
  apps: [
    {
      name: 'radisson-menu-app',
      script: 'npm',
      args: 'start',
      cwd: './',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        ...envVars, // Ajouter toutes les variables de .env.production
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '1G',
      watch: false,
    },
  ],
};
```

**Sauvegarder** : `Ctrl+X`, puis `Y`, puis `Entrée`

---

## 📦 Étape 6 : Installation des Dépendances

```bash
# S'assurer d'être dans le bon répertoire
cd ~/htdocs/www.theblutable.com

# Charger NVM (si nouvelle session SSH)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 18

# Installer les dépendances
npm install --legacy-peer-deps
```

---

## 🔨 Étape 7 : Build de l'Application

```bash
# Builder l'application (les variables d'environnement seront lues depuis .env.production)
npm run build
```

**⚠️ Si erreur "supabaseUrl is required"** :
- Vérifier que `.env.production` existe et contient les bonnes variables
- Vérifier que les variables commencent par `NEXT_PUBLIC_`

---

## 🚀 Étape 8 : Installation et Configuration de PM2

```bash
# Installer PM2 globalement
npm install -g pm2

# Créer le répertoire pour les logs
mkdir -p logs

# Démarrer l'application avec PM2
pm2 start ecosystem.config.js

# Sauvegarder la configuration PM2 pour qu'elle persiste après redémarrage
pm2 save

# Configurer PM2 pour démarrer au boot (optionnel mais recommandé)
pm2 startup
# Suivre les instructions affichées (copier-coller la commande suggérée)
```

---

## 🌐 Étape 9 : Configuration CloudPanel/Nginx

1. **Se connecter à CloudPanel** (interface web)

2. **Aller dans Sites → Node.js**

3. **Ajouter/Configurer le site** :
   - **Domain** : `www.theblutable.com`
   - **Port** : `3000`
   - **Node.js version** : `18`

4. **Sauvegarder**

CloudPanel configurera automatiquement Nginx comme reverse proxy.

---

## ✅ Étape 10 : Vérification

```bash
# Vérifier le statut PM2
pm2 status

# Vérifier les logs
pm2 logs radisson-menu-app --lines 20

# Vérifier que les variables d'environnement sont chargées
pm2 env 0 | grep SUPABASE
```

**Dans le navigateur** :
- Ouvrir `http://www.theblutable.com`
- Vérifier que les restaurants s'affichent
- Vérifier que les menus se chargent

---

## 🔄 Étape 11 : Créer le Script de Mise à Jour (Optionnel)

```bash
# Créer le script update.sh
cat > ~/htdocs/www.theblutable.com/update.sh << 'EOF'
#!/bin/bash
set -e

echo "🔄 Mise à jour de l'application..."

cd ~/htdocs/www.theblutable.com

# Charger nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 18

# Stash modifications locales
echo "📦 Sauvegarde des modifications locales..."
git stash push -m "Sauvegarde avant mise à jour $(date +%Y%m%d_%H%M%S)" || true

# Pull depuis GitHub
echo "⬇️  Récupération des modifications depuis GitHub..."
git pull

# Réappliquer stash
echo "🔀 Réapplication des modifications locales..."
if git stash pop 2>/dev/null; then
    if git status | grep -q "CONFLICT.*ecosystem.config.js"; then
        echo "⚠️  Conflit détecté sur ecosystem.config.js, garde la version locale..."
        git checkout --theirs ecosystem.config.js
        git add ecosystem.config.js
    fi
fi

# Installer dépendances
echo "📦 Installation des dépendances..."
npm install --legacy-peer-deps

# Builder
echo "🔨 Build de l'application..."
npm run build

# Redémarrer PM2
echo "🔄 Redémarrage PM2..."
pm2 restart radisson-menu-app --update-env

# Statut
echo ""
echo "✅ Mise à jour terminée!"
echo ""
pm2 status
EOF

# Rendre le script exécutable
chmod +x ~/htdocs/www.theblutable.com/update.sh
```

---

## 🆘 Dépannage

### Problème : "Command 'node' not found"
```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 18
```

### Problème : "supabaseUrl is required" lors du build
```bash
# Vérifier que .env.production existe
cat .env.production

# Vérifier le format (pas d'espaces autour du =)
# NEXT_PUBLIC_SUPABASE_URL=https://...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Problème : PM2 ne démarre pas
```bash
# Vérifier les logs
pm2 logs radisson-menu-app --err

# Vérifier que le port 3000 n'est pas déjà utilisé
netstat -tulpn | grep 3000

# Redémarrer PM2
pm2 restart radisson-menu-app
```

### Problème : Le site affiche une page par défaut
- Vérifier dans CloudPanel que le site Node.js est bien configuré sur le port 3000
- Vérifier que PM2 est en cours d'exécution : `pm2 status`

### Problème : Les variables d'environnement ne sont pas chargées
```bash
# Vérifier que ecosystem.config.js contient loadEnvFile()
cat ecosystem.config.js | grep loadEnvFile

# Vérifier que .env.production existe
ls -la .env.production

# Redémarrer PM2 avec mise à jour des variables
pm2 restart radisson-menu-app --update-env
```

---

## 📝 Checklist de Déploiement

- [ ] Node.js 18 installé via NVM
- [ ] Repository GitHub cloné
- [ ] Fichier `.env.production` créé avec les variables Supabase
- [ ] Fichier `ecosystem.config.js` créé avec la fonction `loadEnvFile()`
- [ ] Dépendances installées (`npm install --legacy-peer-deps`)
- [ ] Application buildée (`npm run build`)
- [ ] PM2 installé et application démarrée
- [ ] PM2 configuré pour démarrer au boot
- [ ] CloudPanel configuré avec le domaine et le port 3000
- [ ] Site accessible dans le navigateur
- [ ] Script `update.sh` créé (optionnel)

---

## 🎉 C'est Terminé !

Votre application devrait maintenant être accessible sur `http://www.theblutable.com`

Pour les prochaines mises à jour, utilisez simplement :
```bash
cd ~/htdocs/www.theblutable.com
./update.sh
```
