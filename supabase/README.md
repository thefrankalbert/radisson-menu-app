# Migrations

## À appliquer : `20260730_cap_order_quantity_and_tip.sql`

**Pas encore appliquée.** Tant qu'elle ne l'est pas, `create_order` — exécutable
par le rôle `anon`, dont la clé est publique et embarquée dans le navigateur —
n'a **aucune borne haute** sur la quantité ni sur le pourboire. Un appel direct
à l'API peut donc injecter en cuisine une commande à un million d'unités, ou
enchaîner les envois sans limite.

Les garde-fous actuels (30 articles par ligne, 30 secondes entre deux commandes)
vivent dans l'interface et dans `localStorage` : ils protègent l'usage normal,
pas un appel direct.

Ce que la migration ajoute, sans rien changer d'autre :

- quantité plafonnée à 30 par ligne, 60 lignes par commande ;
- pourboire plafonné (un montant supérieur se règle en espèces) ;
- délai minimum de 20 s entre deux commandes **d'une même table**, vérifié en
  base et non plus seulement dans le navigateur ;
- un index pour ce contrôle de cadence.

La validation des prix, le jeton d'accès et la valeur de retour sont inchangés.

### Appliquer

**Option 1 — console Supabase** (le plus direct)

Dashboard → SQL Editor → coller le contenu du fichier → Run.

**Option 2 — CLI Supabase**

```bash
supabase login
supabase link --project-ref <ref-du-projet>
supabase db push
```

**Option 3 — psql**

```bash
psql "$DATABASE_URL" -f supabase/migrations/20260730_cap_order_quantity_and_tip.sql
```

### Vérifier après application

```bash
# doit échouer avec « too_many_lines » ou une quantité ramenée à 30
npm run menu -- orders --today
```

Ou directement, en remplaçant les identifiants par des valeurs réelles :

```sql
select create_order(
  p_restaurant_id => '<uuid>',
  p_table_number  => 'TEST-CAP',
  p_items => '[{"menu_item_id":"<uuid>","quantity":999999,"price_at_order":<prix>}]'::jsonb
);
-- la commande doit être créée avec une quantité de 30, pas 999999
```

Pensez ensuite à supprimer la commande d'essai :

```bash
npm run menu -- orders:delete --table TEST-CAP
```
