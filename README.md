# Budget Helper

Application pour gérer le budget familial à deux : revenus, dépenses fixes et compteurs par catégorie, partagée en temps réel entre deux téléphones.

## Fonctionnalités

- Suivi des revenus et dépenses avec catégories personnalisables (icône + couleur), adaptées à un vrai budget familial (logement, enfants, assurances, épargne, courses, loisirs...)
- **Ajout rapide** : bouton ⚡ flottant sur toutes les pages pour enregistrer une dépense en 2 taps juste après un achat
- **Dépenses fixes** : une charge cochée "dépense fixe" (loyer, abonnements...) se régénère automatiquement chaque mois, pas besoin de la ressaisir
- Budgets mensuels par catégorie avec barres de progression et alertes de dépassement (= combien il reste à dépenser par catégorie)
- Dashboard : revenus vs dépenses du mois, reste à vivre global, répartition par catégorie, évolution sur 6 mois
- **Partagé en temps réel** entre toi et ta femme : les deux téléphones voient les mêmes données instantanément (Supabase)
- Accès protégé par un code partagé
- **Installable sur l'écran d'accueil** (iPhone et Android), fonctionne comme une app
- Bilingue FR / HE

## Stack

- React + TypeScript + Vite
- Tailwind CSS v4
- Supabase (Postgres + Auth + Realtime) pour le stockage partagé
- Recharts, React Router
- vite-plugin-pwa (installation sur écran d'accueil)

## Configuration Supabase (à faire une seule fois)

L'app a besoin d'un projet Supabase gratuit pour que les données soient partagées et synchronisées en temps réel entre les deux téléphones.

1. Crée un compte sur [supabase.com](https://supabase.com) et un nouveau projet (gratuit).
2. Dans **SQL Editor**, colle et exécute le contenu de [`supabase/schema.sql`](supabase/schema.sql). Ça crée les tables `categories`, `transactions`, `budgets`, active la sécurité (RLS) et le temps réel.
3. Dans **Authentication → Users**, clique **Add user** et crée un seul compte partagé pour vous deux, par exemple :
   - Email : `famille@budget-helper.local` (n'importe quel email, pas besoin qu'il existe vraiment)
   - Password : votre "code d'accès" commun (celui que vous taperez tous les deux sur l'écran de connexion)
4. Dans **Project Settings → API**, récupère `Project URL` et la clé `anon public`.
5. Copie `.env.example` vers `.env.local` et renseigne :
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   VITE_SHARED_ACCOUNT_EMAIL=famille@budget-helper.local
   ```

## Développement

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Déploiement (Vercel)

1. Connecte le repo GitHub à [vercel.com](https://vercel.com) (import du projet, Vercel détecte Vite automatiquement).
2. Dans les réglages du projet Vercel, ajoute les mêmes variables d'environnement que dans `.env.local` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SHARED_ACCOUNT_EMAIL`).
3. Déploie. Vercel te donne une URL fixe en HTTPS (ex: `budget-helper.vercel.app`).

## Installer l'app sur le téléphone

Une fois l'URL Vercel obtenue, sur **chaque** téléphone :

- **iPhone (Safari)** : ouvrir l'URL → bouton Partager (carré avec flèche) → **Sur l'écran d'accueil**.
- **Android (Chrome)** : ouvrir l'URL → menu ⋮ → **Ajouter à l'écran d'accueil** / **Installer l'application**.

L'app s'ouvre alors en plein écran comme une app native, avec son icône. Connectez-vous une fois avec le code d'accès partagé sur chaque téléphone — ensuite les deux verront les mêmes revenus, dépenses et compteurs en direct.

## Régénérer les icônes PWA

Si tu changes `public/pwa-icon-source.svg` :

```bash
npm run generate-pwa-assets
```
