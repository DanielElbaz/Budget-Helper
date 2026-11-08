# Règles de sécurité (obligatoires pour toute modification)

Ces règles s'appliquent à chaque nouvelle fonctionnalité, table, route ou intégration.

1. **Clés et secrets** : seules la `anon`/`publishable` key et l'URL Supabase peuvent
   aller côté client (variables `VITE_*`). La `service_role` key et tout autre secret
   ne doivent jamais être dans le code, dans une variable `VITE_*`, ni commités ;
   ils vivent uniquement dans les variables d'environnement serveur (Vercel,
   secrets Supabase/GitHub).
2. **RLS partout** : toute table du schéma `public` (et tout bucket Storage) doit
   avoir Row Level Security activé avec des policies explicites, dès sa création.
   Pas de table sans RLS, pas de policy `using (true)`.
3. **Propriété des données** : chaque policy vérifie à qui appartient la ligne
   (ex. `auth.uid()`/appartenance au foyer). Ne jamais se contenter de
   `auth.role() = 'authenticated'`, qui laisse passer n'importe quel compte.
4. **Admin** : toute page ou action admin est protégée côté serveur (policy RLS
   ou vérification d'un rôle stocké en base / `app_metadata`), jamais uniquement
   en cachant un bouton côté client. Le rôle ne doit pas être modifiable par
   l'utilisateur lui-même (`user_metadata` est modifiable par lui : ne pas l'utiliser).
5. **Inscriptions** : limiter la création de comptes (inscriptions désactivées ou
   CAPTCHA + rate limits Supabase Auth) pour empêcher la création massive par des bots.
6. **Webhooks** : tout endpoint webhook vérifie la signature de l'émetteur
   (ex. `stripe.webhooks.constructEvent`, secret partagé HMAC) avant de traiter
   quoi que ce soit, et rejette les requêtes non signées ou rejouées.

Après tout changement de schéma, lancer les advisors de sécurité Supabase.

# Interface

- Appli uniquement en hébreu (RTL), montants en shekels (₪). Utiliser les propriétés
  logiques (`ms-`/`me-`/`ps-`/`pe-`/`start`/`end`), jamais `left`/`right` pour la mise en page.
- Couleurs et police : tokens dans `src/index.css` (`brand-*`, `ink`, `line`, `surface`…),
  pas de couleurs en dur dans les composants.
- Composants partagés dans `src/components/ui.tsx` ; confirmations et messages via
  `useFeedback()` (`run`, `confirm`, `toast`) — toute suppression demande confirmation,
  toute écriture affiche un succès ou une erreur.
- Icônes d'interface : `lucide-react` (pas d'emoji) ; les emoji restent pour les catégories
  choisies par l'utilisateur. Zones tactiles d'au moins 44px.
- Pour tout travail d'UI/UX, utiliser le skill `ui-ux-pro-max` (`.claude/skills/`).
