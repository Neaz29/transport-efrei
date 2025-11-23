## EFREI Covoiturage - Vue 3 + Express + MySQL

Plateforme de covoiturage pour la communaute etudiante EFREI :
- SPA Vue 3 (Vite + Vue Router)
- API Node.js/Express
- Persistance SQL (MySQL via mysql2) — SQLite supprimé
- Authentification JWT (cookie httpOnly) + hashage bcrypt

### Demarrage rapide
1) Base de donnees  
   - Creer une base MySQL (ex. `efrei_covoit`) et charger `server/schema.sql` :
     ```sql
     CREATE DATABASE efrei_covoit CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
     USE efrei_covoit;
     SOURCE server/schema.sql;
     ```

2) API
```bash
cd server
npm install
# .env a creer depuis .env.example : MYSQL_HOST/USER/PASSWORD/DB, JWT_SECRET, PORT=4000
npm run dev   # http://localhost:4000
```

3) Client
```bash
cd client
npm install
npm run dev   # http://localhost:5173
```

### Fonctionnalites cles
- AuthUser : inscription/connexion (bcrypt + JWT cookie).
- ProfilUser : creation/edition/suppression de trajets publies, annulation des reservations.
- AjoutTrajet : publication avec contraintes adresse (API adresse.gouv), date/heure future.
- ListeTrajet : catalogue public des trajets futurs, reservation en un clic avec decrement des places.
- AboutUs : credits (photo Unsplash citee dans la page credits).

### Tech / API
- Backend : Express, mysql2, CORS credentials, cookie-parser, JWT, bcrypt.
- Modele : `users`, `rides` (trajets avec conducteur, horaires, places), `ride_bookings` (reservations, incr/decr de places).
- Frontend : Vue 3 + Router, composition API, fetch avec `credentials: include`, design personnalise.
