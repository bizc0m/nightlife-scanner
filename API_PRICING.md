# 🔌 Comparatif des APIs - Nightlife Scanner

## 📍 Localisation & Places (Primary)

### 1. Google Places API ⭐ BEST
```
Pricing: $0.17 - $7.00 per 1000 requests
Free quota: 1,000 requests/day (no charge)
Monthly estimate: $0 - $150

Details:
├─ Text search: $0.029/req
├─ Nearby search: $0.032/req
├─ Place details: $0.017/req
├─ Place photos: $0.007/req
└─ Autocomplete: $0.029/req (paid)

What you get:
├─ Bar, club, pub, lounge searches ✅
├─ Rating + reviews count ✅
├─ Opening hours ✅
├─ Phone number ✅
├─ Website ✅
├─ Photos (500+ per place) ✅
├─ User ratings ✅
└─ Reviews text ✅

Best for: Complete establishment data
```

---

### 2. Foursquare Places API (Swarm)
```
Pricing: $0.05 per request OR $99/month (premium)
Free quota: 999 requests/day
Monthly estimate: $0 - $150

Details:
├─ Venue search: $0.05/req (free 999/day)
├─ Venue details: $0.05/req (free 999/day)
└─ Photos: Included

What you get:
├─ Venue categories ✅
├─ Tips (user comments) ✅
├─ Photos (quality) ✅
├─ Rating ✅
├─ Hours ✅
└─ Price tier (€€€) ✅

Best for: Enrichment + user tips
```

---

### 3. OpenStreetMap (Nominatim)
```
Pricing: FREE (non-commercial)
Restrictions: Max 1 req/sec, must use free version
Monthly estimate: $0

What you get:
├─ Geocoding (address → GPS) ✅
├─ Reverse geocoding (GPS → address) ✅
└─ Basic place search ⚠️ (limited)

Limitations:
├─ No business data
├─ No ratings
├─ No hours
└─ No photos

Best for: Geocoding only (free fallback)
```

---

## 💬 Reviews & Ratings

### 4. Google Reviews (included in Places API)
```
Pricing: Included in Places API ($0.017/details)
What you get:
├─ Review text ✅
├─ Rating (1-5) ✅
├─ Reviewer name ✅
├─ Review date ✅
└─ Review count ✅

Best for: User opinions
```

---

### 5. Yelp Fusion API
```
Pricing: FREE (up to 5k calls/month)
Limit: 5,000 calls/month (then pay/wait)
Monthly estimate: $0

What you get:
├─ Business search ✅
├─ Rating + reviews count ✅
├─ Hours ✅
├─ Photos ✅
├─ Phone number ✅
├─ Address ✅
├─ URL ✅
└─ Review snippets ⚠️ (limited)

Limitations:
├─ 5k calls/month only
├─ US-focused (limited international)
└─ Need API key

Best for: US bars, complementary to Google
```

---

## 📸 Photos & Media

### 6. Unsplash API
```
Pricing: FREE
What you get:
├─ Stock photos (bars, drinks, atmosphere) ✅
└─ High quality images ✅

Limitations:
├─ Generic (not venue-specific)
├─ Need to credit photographer
└─ Limited to stock library

Best for: Generic venue photos
```

---

### 7. Pexels API
```
Pricing: FREE
What you get:
├─ Stock photos (bars, drinks, clubs) ✅
└─ High quality ✅

Limitations:
├─ Generic (not venue-specific)
└─ Limited API endpoints

Best for: Background images, generic photos
```

---

## 🍺 Specialty APIs (Niche)

### 8. Untappd API
```
Pricing: FREE (non-commercial) OR $500+/month (commercial)
What you get:
├─ Beer database ✅
├─ Brewery info ✅
├─ Beer ratings ✅
├─ User check-ins ✅
└─ Venue check-ins ✅

Limitations:
├─ Beer/brewery focused (not all venues)
├─ Commercial = expensive
└─ Rate limits (100 calls/hour free)

Best for: Beer-focused bars only
```

---

### 9. Open Hours Database
```
Pricing: FREE (OSM data)
What you get:
├─ Opening hours format standardization ✅
└─ Holiday exceptions ✅

Limitations:
├─ Need manual entry from sources
└─ Not auto-populated

Best for: Data validation only
```

---

## 🗺️ Maps & Visualization

### 10. Leaflet (Maps)
```
Pricing: FREE (open source)
What you get:
├─ Interactive maps ✅
├─ Markers/popups ✅
├─ Custom styling ✅
└─ Offline capable ✅

Best for: Frontend mapping
```

---

### 11. Mapbox (Premium Maps)
```
Pricing: FREE tier (50k static images/month)
           OR $4/month (premium)
Monthly estimate: $0 - $100+

What you get:
├─ Beautiful map styles ✅
├─ Real-time updates ✅
├─ Custom layers ✅
└─ Navigation ✅

Best for: Premium UX
```

---

## 📊 Analytics & Events

### 12. Eventful API
```
Pricing: FREE
What you get:
├─ Event listings ✅
├─ Venue events ✅
└─ Dates/times ✅

Limitations:
├─ Event-focused (not all venues)
└─ Limited coverage

Best for: Nightlife events discovery
```

---

## 💳 Payment/Transactions

### 13. Stripe (optional - bookings)
```
Pricing: 2.9% + $0.30 per transaction
Monthly estimate: $0 (only if you add bookings)

Best for: If you add table reservations
```

---

## 🏆 RECOMMENDED COMBO FOR NIGHTLIFE

### **Tier 1: Production (Medium traffic)**
```
├─ Google Places API: ~$50/month (main source)
├─ Foursquare API: ~$30/month (enrichment)
├─ Yelp API: FREE (5k/month)
├─ Leaflet: FREE
├─ OpenStreetMap: FREE (backup geocoding)
│
└─ TOTAL: ~$80/month
```

### **Tier 2: Startup (Low traffic)**
```
├─ Google Places API: FREE (1k/day)
├─ Foursquare API: FREE (999/day)
├─ Yelp API: FREE (5k/month)
├─ Leaflet: FREE
├─ OpenStreetMap: FREE
│
└─ TOTAL: $0/month ✨
```

### **Tier 3: Full-Service (High volume)**
```
├─ Google Places API: $150/month (100k reqs)
├─ Foursquare API: $150/month (3k reqs/day)
├─ Yelp API: Pay extra (>5k/month)
├─ Mapbox: $50/month
├─ Eventful: FREE
├─ Leaflet: FREE
│
└─ TOTAL: ~$350/month
```

---

## 🎮 NIGHTLIFE SCANNER RECOMMENDATION

**For your use case (bars, clubs, happy hours):**

### ✅ PRIMARY SOURCE
- **Google Places API**
  - Why: Best bar data, complete coverage, proven
  - Cost: $0-50/month (depending on volume)
  - Covers: 95% of use cases

### ✅ SECONDARY (Enrichment)
- **Foursquare API**
  - Why: Better tips, user content, venue vibe
  - Cost: $0 (free 999/day)
  - Adds: Tips, better photos, ambiance

### ✅ FALLBACK
- **OpenStreetMap**
  - Why: Free geocoding if needed
  - Cost: $0
  - For: Address validation only

### ❌ NOT NEEDED
- Yelp: US-only, redundant with Google
- Untappd: Only if beer-focused
- Eventful: Only if adding events
- Mapbox: Leaflet is free enough
- Stripe: Only if booking feature

---

## 💡 COST BREAKDOWN FOR 1 CITY (1000 bars)

### Scenario 1: Auto-scrape (Google + Foursquare)
```
One-time scan:
├─ Google Places nearby: 10 requests × $0.032 = $0.32
├─ Google Details: 1000 × $0.017 = $17
├─ Google Photos: 1000 × $0.007 = $7
├─ Foursquare search: 10 requests × $0 = $0 (free)
├─ Foursquare details: 1000 × $0 = $0 (free)
│
└─ TOTAL: ~$24.32 one-time
```

### Scenario 2: Monthly refresh (daily updates)
```
Per day:
├─ Google (light refresh): $5
├─ Foursquare: $0
└─ TOTAL/day: $5

Per month:
└─ $150

Per year:
└─ $1,800
```

### Scenario 3: Crowdsourced (Zero API)
```
├─ No API calls
├─ Just hosting
└─ TOTAL: $0 (API-wise)
```

---

## 🎯 FINAL RECOMMENDATION

**Start with: CROWDSOURCED (Hunt Mode)**
- Cost: $0 API
- Coverage: User-generated
- Quality: High (humans verify)
- Engagement: Gamified

**Add later: Google Places (if needed)**
- Cost: $50/month
- Coverage: Complete
- Quality: Official data
- Use case: Bootstrap new cities

---

## 📝 Summary Table

| API | Price | Coverage | Quality | Bars | Events |
|-----|-------|----------|---------|------|--------|
| Google Places | $0.017-0.032/req | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ | ✅ |
| Foursquare | FREE (999/day) | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ | ✅ |
| Yelp | FREE (5k/mo) | ⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ | ❌ |
| OpenStreetMap | FREE | ⭐⭐⭐ | ⭐⭐⭐ | ❌ | ❌ |
| Untappd | FREE (limited) | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⚠️ | ❌ |
| Eventful | FREE | ⭐⭐ | ⭐⭐⭐ | ❌ | ✅ |
| Leaflet | FREE | - | - | - | - |

---

**Questions?** Quelle approche tu préfères?
