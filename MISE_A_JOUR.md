# 🔄 Guide de Mise à Jour - Serveur Hostinger

## Méthode Rapide (Recommandée)

Une fois connecté en SSH au serveur :

```bash
cd ~/htdocs/www.theblutable.com
./update.sh
```

C'est tout ! Le script s'occupe de tout automatiquement.

---

## Méthode Manuelle (Commandes)

Si vous préférez exécuter les commandes manuellement :

```bash
# 1. Se connecter en SSH
ssh blu@148.230.115.224

# 2. Aller dans le répertoire du site
cd ~/htdocs/www.theblutable.com

# 3. Charger nvm (si nécessaire après reconnexion)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 18

# 4. Sauvegarder temporairement vos modifications locales
git stash push -m "Sauvegarde avant mise à jour $(date +%Y%m%d_%H%M%S)" || true

# 5. Récupérer les modifications depuis GitHub
git pull

# 6. Réappliquer vos modifications locales
git stash pop || true

# 7. Si conflit sur ecosystem.config.js, garder votre version locale :
#    git checkout --theirs ecosystem.config.js
#    git add ecosystem.config.js

# 8. Réinstaller les dépendances (si package.json a changé)
npm install --legacy-peer-deps

# 9. Rebuilder l'application
npm run build

# 10. Redémarrer PM2 pour appliquer les changements
pm2 restart radisson-menu-app --update-env

# 11. Vérifier que tout fonctionne
pm2 status
pm2 logs radisson-menu-app --lines 15 --nostream
```

---

## ⚠️ Fichiers Locaux à Conserver

Ces fichiers ne doivent **PAS** être commités sur GitHub (ils sont spécifiques au serveur) :

- `.env.production` - Variables d'environnement Supabase
- `update.sh` - Script de mise à jour (optionnel)

Le fichier `ecosystem.config.js` sur le serveur contient une fonction `loadEnvFile()` qui charge les variables depuis `.env.production`. Cette version locale doit être préservée lors des mises à jour.

---

## 🔍 Vérification après Mise à Jour

1. **Vérifier PM2** :
   ```bash
   pm2 status
   ```
   L'application doit être `online`.

2. **Vérifier les logs** :
   ```bash
   pm2 logs radisson-menu-app --lines 20
   ```
   Pas d'erreurs critiques.

3. **Tester dans le navigateur** :
   - Ouvrir `http://www.theblutable.com`
   - Vérifier que les restaurants s'affichent
   - Vérifier que les menus se chargent

---

## 📝 Notes

- **Node.js** : Le serveur utilise Node.js 18 (via nvm). Supabase recommande Node.js 20+, mais ça fonctionne encore.
- **Conflits Git** : Si un conflit survient sur `ecosystem.config.js`, **garder toujours la version locale** (celle sur le serveur) car elle contient la logique pour charger `.env.production`.
- **Variables d'environnement** : Elles sont chargées depuis `.env.production` par `ecosystem.config.js` et injectées dans PM2.

---

## 🆘 En cas de Problème

1. **L'application ne démarre pas** :
   ```bash
   pm2 logs radisson-menu-app --err
   ```

2. **Revenir à une version précédente** :
   ```bash
   git log --oneline  # Voir l'historique
   git checkout <commit-hash>
   npm install --legacy-peer-deps
   npm run build
   pm2 restart radisson-menu-app
   ```

3. **Forcer une réinstallation complète** :
   ```bash
   rm -rf node_modules package-lock.json .next
   npm install --legacy-peer-deps
   npm run build
   pm2 restart radisson-menu-app
   ```
