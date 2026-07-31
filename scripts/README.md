# Gestion de la carte en ligne de commande

Le tableau de bord d'administration n'est plus le point d'entrée : la carte se
gère ici.

```bash
npm run menu -- help
```

## Lecture — aucune clé secrète

```bash
npm run menu -- menus                                  # cartes et compteurs
npm run menu -- categories --menu panorama
npm run menu -- list --menu lobby
npm run menu -- list --search burger
npm run menu -- list --unavailable                     # ce qui est coupé
npm run menu -- show 'Cheeseburger'
```

## Écriture — clé de service requise

La clé anon est bloquée en écriture par les politiques RLS. Récupérez la clé
`service_role` dans **Supabase → Project Settings → API**.

Elle n'est **pas** rangée dans `.env.local` : ce fichier est aussi lu par
l'application, une clé de service qui y traîne est une fuite en puissance.

```bash
# le temps d'une commande
SUPABASE_SERVICE_ROLE_KEY='...' npm run menu -- available 'Cheeseburger' off

# ou pour toute une session de travail
export SUPABASE_SERVICE_ROLE_KEY='...'
```

### Disponibilité

```bash
npm run menu -- available 'Cheeseburger' off           # rupture d'un plat
npm run menu -- available 'Cheeseburger' on            # retour
npm run menu -- bulk-available off --category Desserts # toute une catégorie
npm run menu -- bulk-available on --menu pool          # toute une carte
```

### Contenu

```bash
npm run menu -- price 'Club Sandwich' 9000
npm run menu -- rename 782eb0bc --fr 'Cheeseburger Maison' --en 'House Cheeseburger'
npm run menu -- describe 782eb0bc --fr 'Fromage local, steak haché, frites'
npm run menu -- photo 782eb0bc https://…/cheeseburger.jpg
npm run menu -- photo 782eb0bc none                    # retire la photo
npm run menu -- feature 'Hamburger Simple' on          # mise en avant accueil
```

### Commandes clients

Les commandes sont invisibles à la clé anon (les politiques RLS les réservent au
personnel) : ces commandes exigent donc la clé de service.

```bash
npm run menu -- orders --today                         # la journée
npm run menu -- orders --status pending                # en attente cuisine
npm run menu -- orders --table P05
npm run menu -- orders:delete --table TEST-01          # purge des essais
npm run menu -- orders:delete --ids b1cb9f5c-…,775ffecb-…
```

`orders:delete` supprime aussi les lignes de commande, et affiche la liste avant
de demander confirmation.

## Sécurité d'usage

- Toute écriture affiche l'**avant/après** et demande confirmation.
- `--dry-run` montre l'effet sans rien modifier — à utiliser en cas de doute,
  surtout sur `bulk-available`.
- `--yes` saute la confirmation (scripts, tâches planifiées).
- Une référence de plat ambiguë **arrête** la commande et liste les candidats,
  plutôt que d'en choisir un.

## Désigner un plat

Identifiant complet, début d'identifiant (`782eb0bc`), ou fragment de nom
(`'Cheese'`). Les accents et la casse sont ignorés.

## Délai de prise en compte

Les pages publiques sont mises en cache 60 secondes. Après une modification :

- les téléphones **déjà ouverts** sur la carte se rafraîchissent aussitôt (canal
  temps réel) ;
- les nouvelles visites voient le changement au plus tard une minute après.

## Photos

Seules les **URL absolues** (`https://…`) sont acceptées. Les chemins relatifs
comme `/images/x.jpg` ne sont pas servis par l'application — c'est exactement ce
qui laissait tous les plats sans photo. Hébergez les images dans Supabase
Storage et utilisez l'URL publique.

Un plat sans photo affiche un visuel de repli ivoire, jamais une image cassée.
