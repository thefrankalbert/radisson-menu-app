# 🚀 Scripts de Déploiement et Mise à Jour

Ce dossier contient des scripts pour faciliter le déploiement et la mise à jour de l'application sur le serveur VPS.

## 📋 Scripts Disponibles

### 1. `deploy.sh` - Déploiement Initial

Script pour la première installation de l'application sur le serveur VPS.

**Utilisation:**
```bash
cd ~/htdocs/www.theblutable.com
chmod +x deploy.sh
./deploy.sh
```

**Ce que fait le script:**
- ✅ Vérifie/installe NVM (Node Version Manager)
- ✅ Installe Node.js 18
- ✅ Clone le repository GitHub
- ✅ Crée un fichier `.env.production` exemple (si nécessaire)
- ✅ Installe les dépendances npm
- ✅ Build l'application Next.js
- ✅ Installe et configure PM2
- ✅ Démarre l'application avec PM2
- ✅ Configure PM2 pour démarrer au boot

**⚠️ Important:**
- Avant de continuer, modifiez `.env.production` avec vos vraies valeurs Supabase
- Le script vous demandera de confirmer après avoir modifié le fichier

---

### 2. `update.sh` - Mise à Jour

Script pour mettre à jour l'application avec les dernières modifications depuis GitHub.

**Utilisation de base:**
```bash
cd ~/htdocs/www.theblutable.com
chmod +x update.sh
./update.sh
```

**Options disponibles:**
```bash
# Mise à jour normale
./update.sh

# Forcer la mise à jour (ignore les conflits locaux)
./update.sh --force

# Mise à jour sans rebuild
./update.sh --no-build

# Mise à jour sans redémarrer PM2
./update.sh --no-restart

# Combinaison d'options
./update.sh --no-build --no-restart
```

**Ce que fait le script:**
- ✅ Charge NVM et utilise Node.js 18
- ✅ Sauvegarde les modifications locales (git stash)
- ✅ Récupère les dernières modifications depuis GitHub
- ✅ Réapplique les modifications locales (si nécessaire)
- ✅ Résout automatiquement les conflits sur `.env.production` et `ecosystem.config.js`
- ✅ Installe les nouvelles dépendances
- ✅ Build l'application
- ✅ Redémarre l'application avec PM2
- ✅ Affiche le statut de l'application

**Gestion des conflits:**
- Les conflits sur `.env.production` sont automatiquement résolus en conservant la version locale
- Les conflits sur `ecosystem.config.js` sont automatiquement résolus en conservant la version locale
- Les autres modifications locales sont préservées via git stash

---

## 🔧 Configuration

### Variables d'environnement

Les scripts utilisent les variables suivantes (optionnelles):

```bash
# Répertoire de l'application (par défaut: ~/htdocs/www.theblutable.com)
export APP_DIR="/chemin/vers/votre/app"

# Branche Git à utiliser (par défaut: main)
export GIT_BRANCH="main"
```

**Exemple:**
```bash
export APP_DIR="/home/user/myapp"
export GIT_BRANCH="develop"
./update.sh
```

---

## 📝 Workflow Recommandé

### Première Installation

1. Connectez-vous au serveur VPS via SSH:
   ```bash
   ssh blu@148.230.115.224
   ```

2. Naviguez vers le répertoire de l'application:
   ```bash
   cd ~/htdocs/www.theblutable.com
   ```

3. Clonez le repository (si pas déjà fait):
   ```bash
   git clone https://github.com/thefrankalbert/radisson-menu-app.git .
   ```

4. Rendez les scripts exécutables:
   ```bash
   chmod +x deploy.sh update.sh
   ```

5. Exécutez le script de déploiement:
   ```bash
   ./deploy.sh
   ```

6. Modifiez `.env.production` avec vos vraies valeurs Supabase

7. Redémarrez l'application:
   ```bash
   pm2 restart radisson-menu-app --update-env
   ```

### Mises à Jour Régulières

1. Connectez-vous au serveur VPS:
   ```bash
   ssh blu@148.230.115.224
   ```

2. Naviguez vers le répertoire:
   ```bash
   cd ~/htdocs/www.theblutable.com
   ```

3. Exécutez le script de mise à jour:
   ```bash
   ./update.sh
   ```

C'est tout ! Le script s'occupe de tout le reste.

---

## 🆘 Dépannage

### Le script échoue avec "Command not found: nvm"

**Solution:**
```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 18
```

### Le script échoue avec "supabaseUrl is required"

**Solution:**
Vérifiez que `.env.production` existe et contient:
```
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon
```

### PM2 ne démarre pas

**Solution:**
```bash
# Vérifier les logs
pm2 logs radisson-menu-app --err

# Vérifier que le port 3000 n'est pas utilisé
netstat -tulpn | grep 3000

# Redémarrer manuellement
pm2 restart radisson-menu-app
```

### Conflits Git non résolus

**Solution:**
```bash
# Voir les conflits
git status

# Résoudre manuellement
git checkout --ours fichier-en-conflit
git add fichier-en-conflit

# Ou utiliser --force
./update.sh --force
```

---

## 📊 Commandes PM2 Utiles

```bash
# Voir le statut
pm2 status

# Voir les logs
pm2 logs radisson-menu-app

# Voir les logs en temps réel (50 dernières lignes)
pm2 logs radisson-menu-app --lines 50

# Redémarrer
pm2 restart radisson-menu-app

# Arrêter
pm2 stop radisson-menu-app

# Démarrer
pm2 start radisson-menu-app

# Redémarrer avec mise à jour des variables d'environnement
pm2 restart radisson-menu-app --update-env

# Supprimer de PM2
pm2 delete radisson-menu-app

# Monitorer (dashboard)
pm2 monit
```

---

## 🔐 Sécurité

- ⚠️ Ne commitez jamais `.env.production` dans Git
- ⚠️ Le fichier `.env.production` est automatiquement préservé lors des mises à jour
- ⚠️ Utilisez des tokens d'accès GitHub avec des permissions limitées si possible

---

## 📞 Support

En cas de problème, vérifiez:
1. Les logs PM2: `pm2 logs radisson-menu-app`
2. Les logs système: `journalctl -u pm2-*` (si configuré)
3. Le statut PM2: `pm2 status`
4. La configuration CloudPanel/Nginx

---

## 🎉 C'est Terminé !

Votre application devrait maintenant être facilement déployable et mise à jour avec ces scripts.

Pour toute question ou problème, consultez les fichiers:
- `DEPLOIEMENT_COMPLET.md` - Guide de déploiement détaillé
- `DEPLOY_HOSTINGER.md` - Guide spécifique Hostinger

