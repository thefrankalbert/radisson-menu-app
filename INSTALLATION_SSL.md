# 🔒 Guide d'Installation SSL - Certificat Let's Encrypt

## 📋 Prérequis

- Accès SSH au serveur : `blu@148.230.115.224`
- Domaine configuré : `www.theblutable.com`
- CloudPanel configuré avec le site Node.js
- Nginx fonctionnel (géré par CloudPanel)

---

## 🔧 Méthode 1 : Via CloudPanel (Recommandé - Plus Simple)

CloudPanel a souvent une option intégrée pour SSL :

1. **Connectez-vous à CloudPanel** (interface web)
2. **Allez dans Sites → Votre site (www.theblutable.com)**
3. **Cherchez l'onglet "SSL" ou "Let's Encrypt"**
4. **Cliquez sur "Install SSL" ou "Obtenir un certificat"**
5. **Sélectionnez Let's Encrypt**
6. **Cochez les domaines** : `www.theblutable.com` et `theblutable.com` (si vous voulez les deux)
7. **Cliquez sur "Install"**

CloudPanel configurera automatiquement Nginx et renouvellera le certificat.

---

## 🔧 Méthode 2 : Installation Manuelle avec Certbot

Si CloudPanel n'a pas d'option SSL, suivez ces étapes :

### Étape 1 : Installer Certbot

```bash
# Se connecter en SSH
ssh blu@148.230.115.224

# Mettre à jour les paquets
sudo apt update

# Installer Certbot
sudo apt install certbot python3-certbot-nginx -y
```

### Étape 2 : Vérifier la Configuration Nginx

```bash
# Trouver le fichier de configuration Nginx pour votre site
# CloudPanel stocke généralement les configs dans /etc/nginx/sites-available/
sudo ls -la /etc/nginx/sites-available/ | grep theblutable

# Voir le contenu du fichier de configuration
sudo cat /etc/nginx/sites-available/www.theblutable.com.conf
# OU
sudo cat /etc/nginx/sites-available/theblutable.com.conf
```

**Important** : Le fichier de configuration doit contenir un `server_name` avec votre domaine :
```nginx
server_name www.theblutable.com;
```

### Étape 3 : Obtenir le Certificat SSL

```bash
# Obtenir le certificat (remplacez par votre email)
sudo certbot --nginx -d www.theblutable.com -d theblutable.com --email votre-email@example.com --agree-tos --non-interactive

# OU en mode interactif (recommandé pour la première fois)
sudo certbot --nginx -d www.theblutable.com -d theblutable.com
```

Certbot va :
- Obtenir le certificat Let's Encrypt
- Modifier automatiquement la configuration Nginx
- Redémarrer Nginx
- Configurer le renouvellement automatique

### Étape 4 : Vérifier l'Installation

```bash
# Vérifier que le certificat est installé
sudo certbot certificates

# Tester la configuration Nginx
sudo nginx -t

# Redémarrer Nginx si nécessaire
sudo systemctl restart nginx
```

### Étape 5 : Tester dans le Navigateur

- Ouvrir `https://www.theblutable.com`
- Vérifier que le cadenas SSL s'affiche
- Vérifier que l'application fonctionne toujours

---

## 🔄 Renouvellement Automatique

Certbot configure automatiquement le renouvellement. Vérifiez que c'est actif :

```bash
# Tester le renouvellement (dry-run)
sudo certbot renew --dry-run

# Vérifier le timer systemd
sudo systemctl status certbot.timer
```

Le certificat Let's Encrypt expire après 90 jours, mais Certbot le renouvelle automatiquement.

---

## 🆘 Dépannage

### Problème : Certbot ne peut pas vérifier le domaine

**Causes possibles** :
- Le domaine ne pointe pas vers ce serveur
- Le port 80 est bloqué par un firewall
- Nginx n'est pas configuré correctement

**Solutions** :
```bash
# Vérifier que le domaine pointe vers ce serveur
dig www.theblutable.com

# Vérifier que le port 80 est ouvert
sudo netstat -tulpn | grep :80

# Vérifier la configuration Nginx
sudo nginx -t
```

### Problème : Erreur "Failed to obtain certificate"

**Solutions** :
```bash
# Vérifier les logs Certbot
sudo tail -f /var/log/letsencrypt/letsencrypt.log

# Réessayer avec plus de verbosité
sudo certbot --nginx -d www.theblutable.com --verbose
```

### Problème : Le site ne fonctionne plus après l'installation SSL

**Vérifications** :
```bash
# Vérifier la configuration Nginx
sudo nginx -t

# Vérifier les logs Nginx
sudo tail -f /var/log/nginx/error.log

# Vérifier que PM2 fonctionne toujours
pm2 status
```

### Problème : Redirection HTTP vers HTTPS ne fonctionne pas

Certbot devrait l'avoir configuré automatiquement, mais si ce n'est pas le cas :

```bash
# Éditer la configuration Nginx
sudo nano /etc/nginx/sites-available/www.theblutable.com.conf
```

Ajouter un bloc de redirection :
```nginx
server {
    listen 80;
    server_name www.theblutable.com theblutable.com;
    return 301 https://www.theblutable.com$request_uri;
}
```

Puis redémarrer Nginx :
```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

## 📝 Configuration Nginx Typique après Certbot

Après l'installation, votre configuration Nginx devrait ressembler à ceci :

```nginx
server {
    listen 80;
    server_name www.theblutable.com theblutable.com;
    return 301 https://www.theblutable.com$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.theblutable.com;

    ssl_certificate /etc/letsencrypt/live/www.theblutable.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.theblutable.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## ✅ Checklist d'Installation SSL

- [ ] Certbot installé
- [ ] Configuration Nginx vérifiée
- [ ] Certificat SSL obtenu
- [ ] Nginx redémarré
- [ ] Site accessible en HTTPS
- [ ] Redirection HTTP → HTTPS fonctionne
- [ ] Renouvellement automatique configuré
- [ ] Application fonctionne toujours

---

## 🎉 C'est Terminé !

Votre site devrait maintenant être accessible en HTTPS : `https://www.theblutable.com`

Le certificat sera renouvelé automatiquement tous les 90 jours par Certbot.
