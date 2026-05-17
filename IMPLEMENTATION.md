# 🌙 Nightlife Scanner - Documentation Complète

## 📋 Table des Matières
1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Installation & Setup](#installation--setup)
4. [Scrapers - Google Maps vs Foursquare](#scrapers---google-maps-vs-foursquare)
5. [API Endpoints](#api-endpoints)
6. [Base de Données](#base-de-données)
7. [Frontend](#frontend)
8. [Déduplication](#déduplication)
9. [Validation & Contributions](#validation--contributions)
10. [Export OpenData](#export-opendata)
11. [Déploiement](#déploiement)
12. [Troubleshooting](#troubleshooting)

---

## Vue d'ensemble

**Nightlife Scanner** est une plateforme crowdsourced pour découvrir, mapper et partager des informations sur les établissements nocturnes (bars, clubs, pubs) dans n'importe quelle ville.

### Fonctionnalités principales

🗺️ **Carte Interactive**
- Visualiser tous les bars/clubs autour de vous
- Filtrer par note (3-5⭐), type, happy hours
- Recherche par rayon (5km par défaut)

👥 **Système de Contributions**
- Utilisateurs peuvent proposer des modifications
- Validateurs vérifient et approuvent
- Historique complet des changements

📊 **Open Data**
- Export des données validées
- Format CSV, GeoJSON
- Licence Creative Commons

---

## Architecture

### Stack Technologique

```
Frontend
├── React 18 + TypeScript
├── Leaflet (Mapping)
├── React Router (Navigation)
├── Axios (HTTP)
└── CSS3 (Styling)

Backend
├── Node.js + Express
├── PostgreSQL + PostGIS
├── JWT (Auth)
├── Puppeteer (Scraping)
└── TypeScript

Infrastructure
├── Docker + Docker Compose
├── PostgreSQL 15 + PostGIS
└── 2 services: Backend (3001) + Frontend (5173)
```

### Flux de données

```
Google Maps API ──┐
                  ├──> Scraper Service ──> Déduplication ──> PostgreSQL
Foursquare API ──┘                                              │
                                                                ├──> Public API
                                                                │
                                                        Contributions ─┐
                                                                       │
                                                          Validation ──┘
                                                                │
                                                          Frontend App
                                                                │
                                                        OpenData Export
```

---

## Installation & Setup

### Prérequis

```bash
Node.js >= 20.9.0
Docker & Docker Compose
npm >= 10.1.0
```

### 1. Configuration locale

```bash
# Clone et dépendances
cd nightlife-scanner
npm install

# Backend
cd backend
npm install
npm run build

# Frontend
cd ../frontend
npm install
```

### 2. Variables d'environnement

**backend/.env**
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nightlife_scanner
DB_USER=nightlife_user
DB_PASSWORD=nightlife_pass_dev

# Server
PORT=3001
NODE_ENV=development

# JWT
JWT_SECRET=your_super_secret_key_change_in_production
JWT_EXPIRES_IN=7d

# API Keys (REQUIS pour scrapers)
GOOGLE_MAPS_API_KEY=AIzaSy...
FOURSQUARE_API_KEY=fsq_...
FOURSQUARE_SECRET=...

# Settings
MAX_SEARCH_RADIUS_KM=5
DEDUP_SIMILARITY_THRESHOLD=0.85
```

### 3. Lancer PostgreSQL

```bash
# Avec Docker
docker-compose up -d

# Vérifier la connexion
psql -h localhost -U nightlife_user -d nightlife_scanner
```

### 4. Démarrer l'app

```bash
# Terminal 1 - Backend
cd backend
npm run dev
# Server runs on http://localhost:3001

# Terminal 2 - Frontend
cd frontend
npm run dev
# App runs on http://localhost:5173
```

### 5. Premier test

```bash
# Test API
curl http://localhost:3001/api/health

# Test page
open http://localhost:5173
```

---

## Scrapers - Google Maps vs Foursquare

### Google Maps API

**Avantages** ✅
- Données officielles de Google
- Couverture complète (partout)
- Ratings & reviews fiables
- Horaires mis à jour automatiquement
- Plus de 90% des établissements

**Inconvénients** ❌
- Limite de requêtes (API payante après quota gratuit)
- Scraping Puppeteer complexe & bloqué
- Coût si beaucoup de requêtes

**Fiabilité**: ⭐⭐⭐⭐⭐ (95%)

### Foursquare API

**Avantages** ✅
- Photos de qualité
- Catégorisation détaillée
- Tips & avis utilisateurs
- Horaires actualisés par users
- Bon pour enrichissement

**Inconvénients** ❌
- Couverture moins complète
- Données moins officielles
- Clé API requise
- Rate limits modérés

**Fiabilité**: ⭐⭐⭐⭐ (85%)

### Recommandation: Chaînage en cascade

```typescript
// Flux optimal
1. Google Places API
   ├─ Récupère toutes les venues
   ├─ Filtre: ratings 3-5⭐
   ├─ Récupère: nom, adresse, lat/lon, rating, reviews
   └─ Sauvegarde dans DB

2. Foursquare API (enrichissement)
   ├─ Pour chaque venue Google
   ├─ Match par proximité géographique
   ├─ Récupère: photos, heures, tips, catégories
   └─ Merge dans la même fiche

3. Déduplication
   ├─ Fusionne les doublons détectés
   ├─ Préfère données officielles (Google)
   └─ Garde enrichissements (Foursquare)

4. Database
   └─ Fiche consolidée unique par établissement
```

### Code d'implémentation recommandée

**backend/src/scrapers/places-api.ts** (à créer)
```typescript
import axios from 'axios'

export class GooglePlacesService {
  private apiKey = process.env.GOOGLE_MAPS_API_KEY
  
  async searchNearby(lat: number, lon: number, radius = 5000) {
    // Utilise Places API (pas Puppeteer)
    const url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json'
    
    const response = await axios.get(url, {
      params: {
        location: `${lat},${lon}`,
        radius: radius,
        type: 'bar|night_club|pub',
        minprice: 0,
        maxprice: 4,
        key: this.apiKey
      }
    })
    
    return response.data.results.filter((p: any) => 
      p.rating >= 3 && p.rating <= 5
    )
  }

  async getDetails(placeId: string) {
    // Récupère détails completo
    const url = 'https://maps.googleapis.com/maps/api/place/details/json'
    
    const response = await axios.get(url, {
      params: {
        place_id: placeId,
        fields: 'name,rating,reviews,formatted_address,opening_hours,photos,formatted_phone_number,website,url',
        key: this.apiKey
      }
    })
    
    return response.data.result
  }
}
```

---

## API Endpoints

### Authentication

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "nightowl",
  "password": "SecurePass123"
}

Response: { user, token }
```

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}

Response: { user, token }
```

### Establishments

```http
GET /api/establishments/city/:cityId?rating_min=3&type=bar&validated_only=true
Authorization: Bearer <token>

Response: [
  {
    id: "uuid",
    name: "The Irish Pub",
    address: "123 Rue de Rivoli, Paris",
    latitude: 48.8566,
    longitude: 2.3522,
    google_rating: 4.5,
    google_reviews_count: 234,
    phone: "+33 1 23 45 67 89",
    website: "https://...",
    type: "pub",
    status: "validated",
    ...
  }
]
```

```http
GET /api/establishments/:id
Authorization: Bearer <token>

Response: { établissement complet avec photos, heures, happy hours, etc }
```

```http
GET /api/establishments/nearby/:latitude/:longitude?radius=5
Authorization: Bearer <token>

Response: [ établissements dans le rayon avec distance ]
```

```http
POST /api/establishments
Authorization: Bearer <token>
Content-Type: application/json

{
  "city_id": "uuid",
  "name": "New Bar",
  "address": "456 Rue...",
  "latitude": 48.856,
  "longitude": 2.352,
  "type": "bar",
  "google_place_id": "ChIJ..."
}

Response: { établissement créé }
```

### Contributions

```http
POST /api/contributions
Authorization: Bearer <token>
Content-Type: application/json

{
  "establishment_id": "uuid",
  "contribution_type": "edit",
  "old_value": { "name": "Old Name" },
  "new_value": { "name": "New Name" }
}

Response: { contribution en attente de validation }
```

```http
GET /api/contributions/pending
Authorization: Bearer <token>
Roles: validator, admin

Response: [ toutes les contributions en attente ]
```

```http
PATCH /api/contributions/:id/approve
Authorization: Bearer <token>
Content-Type: application/json
Roles: validator, admin

{
  "notes": "Looks good!"
}

Response: { contribution approuvée + changements appliqués }
```

```http
PATCH /api/contributions/:id/reject
Authorization: Bearer <token>
Content-Type: application/json
Roles: validator, admin

{
  "notes": "Needs verification"
}

Response: { contribution rejetée }
```

---

## Base de Données

### Schema Principal

```sql
-- Users & Auth
users
├─ id (uuid)
├─ email (unique)
├─ username (unique)
├─ password_hash
├─ role (contributor, validator, admin)
└─ timestamps

-- Géographie
cities
├─ id (uuid)
├─ name
├─ country
├─ center_lat/lon
└─ search_radius_km

-- Établissements
establishments
├─ id (uuid)
├─ city_id (FK)
├─ name, address
├─ latitude, longitude (PostGIS)
├─ google_place_id, foursquare_id
├─ google_rating, foursquare_rating
├─ phone, website
├─ type (bar, club, pub, lounge)
├─ status (unvalidated, pending, validated, closed)
├─ last_scraped_at
└─ timestamps

-- Horaires réguliers
opening_hours
├─ id (uuid)
├─ establishment_id (FK)
├─ day_of_week (0=Monday, 6=Sunday)
├─ open_time, close_time
├─ is_closed
└─ notes

-- Happy hours
happy_hours
├─ id (uuid)
├─ establishment_id (FK)
├─ day_of_week
├─ start_time, end_time
├─ offer (ex: "2 pour 1")
└─ drinks_included (array)

-- Spécialités
specialties
├─ id (uuid)
├─ establishment_id (FK)
├─ category (drinks, music, atmosphere, events)
├─ name, description

-- Combos & Offres
combos
├─ id (uuid)
├─ establishment_id (FK)
├─ name, description
├─ price
├─ validity_start, validity_end

-- Photos
photos
├─ id (uuid)
├─ establishment_id (FK)
├─ url
├─ source (google, foursquare, user_upload)
└─ alt_text

-- Contributions (édits proposés)
contributions
├─ id (uuid)
├─ establishment_id (FK)
├─ user_id (FK)
├─ contribution_type (edit, new_happy_hour, etc)
├─ old_value, new_value (JSONB)
├─ status (pending, approved, rejected)
├─ validator_id (FK)
├─ validator_notes
└─ validated_at

-- Déduplication
duplicate_candidates
├─ id (uuid)
├─ establishment_id_1, establishment_id_2
├─ similarity_score
├─ is_merged
└─ merged_to_id

-- Historique
establishment_history
├─ id (uuid)
├─ establishment_id (FK)
├─ changed_by_user_id (FK)
├─ field_name, old_value, new_value
├─ change_reason
└─ created_at
```

### Indexes critiques

```sql
CREATE INDEX idx_establishments_location ON establishments USING gist (ll_to_earth(latitude, longitude));
CREATE INDEX idx_establishments_city ON establishments(city_id);
CREATE INDEX idx_establishments_status ON establishments(status);
CREATE INDEX idx_contributions_status ON contributions(status);
```

---

## Frontend

### Structure des pages

```
src/
├── pages/
│   ├── Map.tsx                    # Vue publique (carte + filtres)
│   ├── EstablishmentDetail.tsx    # Fiche établissement
│   ├── Login.tsx                  # Authentification
│   ├── Register.tsx               # Inscription
│   └── Contributor/
│       └── Dashboard.tsx          # Tableau de bord contributeur
├── components/
│   ├── EstablishmentCard.tsx      # Carte établissement
│   ├── HappiHoursList.tsx         # Liste des happy hours
│   └── PhotoGallery.tsx           # Galerie photos
├── services/
│   └── api.ts                     # Appels API
├── hooks/
│   ├── useEstablishments.ts       # Custom hook données
│   └── useAuth.ts                 # Custom hook auth
└── App.tsx                        # Router principal
```

### Composants clés

#### Map.tsx - Vue publique

```tsx
Features:
- Leaflet map interactive
- Filtres: ville, rating min, type
- Marqueurs clickables avec popup
- Lien vers détails établissement
- Export CSV/GeoJSON
```

#### EstablishmentDetail.tsx - Fiche complète

```tsx
Affiche:
- Nom, photo, rating
- Adresse + lien Google Maps
- Horaires d'ouverture
- Happy hours
- Spécialités & combos
- Contact (tel, website)
- Bouton "Contribuer"
- Historique des modifications
```

#### Contributor/Dashboard.tsx - Espace contributeur

```tsx
Tabs:
1. "Mes contributions" - Voir ses édits (pending/approved/rejected)
2. "À valider" - Pour validateurs (pending contributions)
3. "Guide" - Aide et bonnes pratiques
```

---

## Déduplication

### Stratégie

```typescript
Critères de match:
1. Similarité du nom (Levenshtein distance)
   └─ Seuil: 85% match
   
2. Distance géographique
   └─ Seuil: < 50 mètres
   
3. Validation manuelle
   └─ Validateurs peuvent forcer la fusion
```

### Exemple

```
Venue A: "The Irish Pub" @ 48.8566, 2.3522
Venue B: "Irish Pub Bar"  @ 48.8566, 2.3524

Distance: 22 mètres ✓
Similarité: 92% ✓
Résultat: DOUBLON DÉTECTÉ
          → Fusionner vers Venue A
          → Garder données les meilleures des deux
```

### Service de déduplication

```typescript
// backend/src/services/dedup.service.ts

async findDuplicates(cityId: string) {
  // 1. Récupère tous les établissements
  // 2. Compare chaque paire
  // 3. Détecte doublons par:
  //    - Levenshtein distance du nom
  //    - Distance haversine (GPS)
  // 4. Retourne candidats avec score

  return [
    {
      id1, id2,
      similarity: 0.92,
      distance_meters: 22,
      should_merge: true
    }
  ]
}

async mergeDuplicates(primaryId, secondaryId) {
  // 1. Merge les données (préfère données officielles)
  // 2. Déplace les relations (photos, hours, etc)
  // 3. Supprime la doublon
  // 4. Enregistre dans duplicate_candidates
}
```

---

## Validation & Contributions

### Workflow

```
User submits edit
      ↓
Contribution in "pending" status
      ↓
Validator reviews
      ↓
     ├─ APPROVED
     │   ├─ Changes applied to establishment
     │   ├─ Status → "approved"
     │   └─ Goes live immediately
     │
     └─ REJECTED
         ├─ Changes discarded
         ├─ Status → "rejected"
         ├─ Feedback sent to user
         └─ User can resubmit
```

### Types de contributions

```
1. edit                    - Modifier une info existante
2. new_happy_hour         - Ajouter happy hour
3. update_hours           - Modifier horaires
4. add_photo              - Ajouter photo
5. add_specialty          - Ajouter spécialité
6. add_combo              - Ajouter combo/offre
```

### Rôles & permissions

```
┌─────────────┬──────────┬──────────┬────────┐
│ Action      │ Contrib  │ Validator│ Admin  │
├─────────────┼──────────┼──────────┼────────┤
│ Read venues │    ✓     │    ✓     │   ✓    │
│ Submit edit │    ✓     │    ✓     │   ✓    │
│ Review edit │          │    ✓     │   ✓    │
│ Edit direct │          │    ✓     │   ✓    │
│ Delete      │          │          │   ✓    │
│ Manage users│          │          │   ✓    │
└─────────────┴──────────┴──────────┴────────┘
```

---

## Export OpenData

### Endpoints (à créer)

```http
GET /api/export/csv?city=Paris&validated_only=true
Content-Type: text/csv

name,address,latitude,longitude,rating,phone,website,type,hours,happy_hours
"The Irish Pub","123 Rue de Rivoli",48.8566,2.3522,4.5,"+33123456789","https://...",pub,...
```

```http
GET /api/export/geojson?city=Paris&validated_only=true
Content-Type: application/json

{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [2.3522, 48.8566]
      },
      "properties": {
        "name": "The Irish Pub",
        "rating": 4.5,
        "type": "pub",
        ...
      }
    }
  ]
}
```

### Licence

**Creative Commons Attribution 4.0 International (CC BY 4.0)**

```
Vous êtes libre de:
✓ Partager - Copier et distribuer
✓ Adapter - Transformer et construire
✓ Commercer - Utiliser à titre commercial

À condition de:
→ Attribuer - Créditer la source
→ Pas de restrictions - Pas de conditions légales/techniques supplémentaires
```

---

## Déploiement

### Production Setup

```bash
# 1. Clone repo
git clone <repo>
cd nightlife-scanner

# 2. Build
npm install
cd backend && npm run build
cd ../frontend && npm run build

# 3. Docker compose (production)
docker-compose -f docker-compose.prod.yml up -d

# 4. Migrations DB
npm run migrate

# 5. Init admin user
npm run seed:admin
```

### Variables d'environnement production

```env
NODE_ENV=production
PORT=3001
DB_HOST=postgres-prod
JWT_SECRET=<long-random-key>
GOOGLE_MAPS_API_KEY=<production-key>
FOURSQUARE_API_KEY=<production-key>
```

### Monitoring

```bash
# Logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Health check
curl http://localhost:3001/api/health

# DB backup
pg_dump -h localhost -U nightlife_user nightlife_scanner > backup.sql
```

---

## Troubleshooting

### "Cannot connect to database"

```bash
# Vérifier Docker
docker ps

# Vérifier containers
docker-compose logs postgres

# Reconnecter
docker-compose down
docker-compose up -d
```

### "Scrapers not finding venues"

```bash
# 1. Vérifier clés API
echo $GOOGLE_MAPS_API_KEY
echo $FOURSQUARE_API_KEY

# 2. Tester API directement
curl "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=48.8566,2.3522&radius=5000&key=$GOOGLE_MAPS_API_KEY"

# 3. Vérifier rate limits
# Google Maps: 1000 req/jour gratuit
# Foursquare: 999 req/jour gratuit
```

### "Frontend cannot connect to API"

```bash
# 1. Vérifier backend running
curl http://localhost:3001/api/health

# 2. Vérifier CORS dans backend
# app.ts devrait avoir: app.use(cors())

# 3. Vérifier URL dans frontend
// src/services/api.ts
const API_BASE = 'http://localhost:3001/api'
```

### "Deduplication not working"

```bash
# 1. Vérifier similarité threshold
console.log(process.env.DEDUP_SIMILARITY_THRESHOLD) // Should be ~0.85

# 2. Test service
npm run dedup:test

# 3. Check duplicates in DB
SELECT * FROM duplicate_candidates WHERE is_merged = false;
```

---

## Checklist d'implémentation

### Phase 1: Infrastructure ✅
- [x] PostgreSQL + PostGIS
- [x] Express API
- [x] React frontend
- [x] JWT auth
- [x] Database schema

### Phase 2: Scrapers
- [ ] Google Places API integration
- [ ] Foursquare API integration
- [ ] Chaînage des deux sources
- [ ] Tests scrapers

### Phase 3: Features
- [ ] Happy hours parser
- [ ] Photos deduplication
- [ ] Export OpenData
- [ ] Analytics dashboard

### Phase 4: Production
- [ ] Docker setup production
- [ ] CI/CD pipeline
- [ ] Monitoring & alerts
- [ ] Backup strategy
- [ ] CDN for images

---

## Contacts & Support

📧 Email: support@nightlifescanner.com
🐛 Issues: [GitHub Issues]
💬 Community: [Discord Server]
📚 Docs: [Full Documentation]

---

**Made with ❤️ for nightlife enthusiasts everywhere.**
