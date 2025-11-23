## Rapport de projet — EFREI Covoiturage (Vue 3 + Express + MySQL)

### 1. Objectifs et périmètre
- Plateforme de covoiturage dédiée à la communauté EFREI (trajets vers/depuis les campus de Villejuif).
- SPA Vue 3 (Vite) + API Node/Express.
- Persistance MySQL (mysql2), auth JWT via cookie httpOnly, mots de passe hachés bcrypt.
- Contraintes métiers : si le départ n’est pas EFREI, la destination doit être l’un des 3 campus EFREI ; adresses validées via l’API adresse.gouv ; date/heure future uniquement ; réservation décrémente les places (annulation les réaugmente).

### 2. Architecture
- Frontend : `/client` (Vue 3, Vue Router, fetch API avec credentials).
- Backend : `/server` (Express, mysql2, cookie-parser, cors avec credentials).
- Base : schéma dans `server/schema.sql` (tables `users`, `rides`, `ride_bookings`).
- Auth : JWT signé avec `JWT_SECRET`, stocké en cookie httpOnly ; bcrypt pour les mots de passe.

### 3. Back-end (Express)
- Endpoints principaux :
  - Auth : `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.
  - Trajets : `GET /api/rides` (filtre futureOnly par défaut), `POST /api/rides`, `PATCH /api/rides/:id`, `DELETE /api/rides/:id`.
  - Réservations : `GET /api/bookings`, `POST /api/bookings`, `DELETE /api/bookings/:id`.
  - Profil synthèse : `GET /api/me/summary` (mes trajets + mes réservations).
- Validation adresses : appel à `https://api-adresse.data.gouv.fr/search` côté serveur et côté front ; règle EFREI (destination campus si départ hors EFREI).
- Sécurité : JWT httpOnly, CORS credentials, transactions MySQL pour réserver/annuler.

### 4. Front-end (Vue 3)
- Pages/Composants : Home, AuthUser, ProfilUser, AjoutTrajet, ListeTrajet, AboutUs.
- Formulaire publication : datalist + suggestions adresse.gouv, datetime-local avec min=now, validation métier EFREI.
- Liste trajets publics : réservation en un clic (si connecté), affichage des places restantes.
- Profil : gérer ses trajets (créer/éditer/supprimer), voir/annuler ses réservations.
- Style : `src/style.css`, palette sombre personnalisée, image d’illustration sur l’accueil.

### 5. Base de données
- Tables : `users` (id, name, email unique, password_hash), `rides` (driver_id FK, origin/destination, departure, seats_total/available, price, notes), `ride_bookings` (user_id, ride_id, passenger_name).
- Script SQL : `server/schema.sql` (inclut un seed optionnel avec utilisateurs alice/bruno, mdp `efrei123`, et trajets de démo).

### 6. Mise en place
1) MySQL : créer la base et charger `server/schema.sql`.
2) `.env` dans `server` (copie depuis `.env.example`) : `MYSQL_HOST/USER/PASSWORD/DB`, `JWT_SECRET`, `PORT=4000`.
3) Backend : `cd server && npm install && npm run dev`.
4) Frontend : `cd client && npm install && npm run dev` (http://localhost:5173).
5) Tests manuels :
   - Inscription/connexion, puis `/profil`.
   - Publier un trajet : adresse valide FR, règle EFREI, datetime future.
   - Réserver un trajet public : décrément des places ; annuler depuis Profil : réincrémente.

### 7. Sources / crédits
- Illustration page d’accueil : Unsplash (crédit mentionné dans AboutUs).
- API adresses : adresse.data.gouv.fr (publique, sans clé).

### 8. État Git / dépôt
- Dépôt : https://github.com/Neaz29/transport-efrei (branche master).
- Commits principaux : initial full stack Vue/Express/MySQL, ajouts contraintes adresses/date, rapport actuel.

### 9. Points de vigilance / pistes d’amélioration
- Remplacer les appels directs à adresse.gouv côté backend si le réseau est restreint (cache local ou saisie forcée par autocomplete).
- Ajouter des tests automatisés (API + e2e) et une CI.
- Internationalisation et accessibilité (a11y) à compléter.
- Gestion d’upload d’avatar/conducteur non implémentée (optionnel).
