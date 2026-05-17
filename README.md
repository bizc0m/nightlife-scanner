# 🌙 Nightlife Scanner

A comprehensive platform to discover, map, and share information about nightlife venues (bars, clubs, pubs) in your city.

## Features

✨ **Public Interface**
- Interactive map showing all venues
- Filter by rating, type, happy hours
- Detailed venue pages with hours, contact info, photos
- Export data as CSV/JSON

🤝 **Contributor System**
- Register and contribute information
- Submit edits: hours, happy hours, specialties, combos, photos
- View contribution status (pending, approved, rejected)
- Earn recognition for contributions

✔️ **Validation Workflow**
- Validators review pending contributions
- Approve/reject with feedback
- Maintain data quality and accuracy
- Audit trail of all changes

📊 **Open Data**
- Export validated data for public use
- GeoJSON format for mapping
- CSV format for data analysis
- Creative Commons license

## Tech Stack

### Backend
- **Node.js** + Express.js
- **PostgreSQL** + PostGIS (geospatial queries)
- **TypeScript**
- **JWT** authentication

### Frontend
- **React** 18 + TypeScript
- **Leaflet** for mapping
- **Axios** for API calls
- **React Router** for navigation

### Data Sources
- **Google Maps API** (places, ratings, reviews)
- **Foursquare API** (venue details, photos)
- **User Contributions** (verified by validators)

## Getting Started

### Prerequisites
- Node.js 20+ and npm
- Docker & Docker Compose
- PostgreSQL 15+ (or use Docker)

### Installation

1. **Clone and setup**
```bash
cd nightlife-scanner
npm install
cd backend && npm install
cd ../frontend && npm install
```

2. **Start PostgreSQL**
```bash
docker-compose up -d
```

3. **Configure environment**
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your API keys
export GOOGLE_MAPS_API_KEY=your_key
export FOURSQUARE_API_KEY=your_key
```

4. **Start backend**
```bash
cd backend
npm run dev  # Development mode
# or
npm run build && npm start  # Production
```

5. **Start frontend**
```bash
cd frontend
npm run dev
```

6. **Access the app**
- Public: http://localhost:5173
- API: http://localhost:3001/api

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Sign in

### Establishments
- `GET /api/establishments/city/:cityId` - Get venues in city
- `GET /api/establishments/:id` - Get venue details
- `GET /api/establishments/nearby/:lat/:lon` - Get nearby venues
- `POST /api/establishments` - Create venue (contributors)
- `PATCH /api/establishments/:id` - Update venue
- `DELETE /api/establishments/:id` - Delete venue (admin only)

### Contributions
- `GET /api/contributions/pending` - Get pending reviews (validators)
- `GET /api/contributions/establishment/:id` - Get venue contributions
- `POST /api/contributions` - Submit contribution
- `PATCH /api/contributions/:id/approve` - Approve (validators)
- `PATCH /api/contributions/:id/reject` - Reject (validators)

## Database Schema

### Tables
- `users` - User accounts with roles
- `cities` - City configurations
- `establishments` - Venue records
- `opening_hours` - Regular hours per day
- `happy_hours` - Special offers
- `specialties` - Venue characteristics
- `combos` - Special deals
- `photos` - Venue images
- `contributions` - User-submitted edits
- `duplicate_candidates` - Deduplication tracking

## Deduplication Strategy

The system automatically detects and merges duplicate venue entries:
- **Name similarity**: Levenshtein distance
- **Geographic proximity**: < 50 meters
- **Threshold**: 85% match confidence
- **Manual review**: Validators can confirm merges

## Contributing Venues

### What You Can Add
1. **Opening Hours** - Day/time combinations
2. **Happy Hours** - Time slots with offers
3. **Specialties** - Drink types, music, atmosphere
4. **Combos** - Special pricing
5. **Photos** - Venue images
6. **Contact** - Phone, website updates

### Validation Process
1. Submit your contribution
2. Validator reviews within 24 hours
3. Receive feedback if changes needed
4. Approved changes go live immediately

## Data Quality Standards

✅ **Requirements**
- Accurate, current information
- Specific and detailed descriptions
- Proper date/time formatting
- Clear, professional language
- No spam or self-promotion

❌ **Not Allowed**
- Unverified information
- Commercial advertising
- Misleading or false claims
- Low-quality photos
- Duplicate submissions

## Export & Open Data

Export validated data in multiple formats:

```bash
# CSV Export
GET /api/export/csv?city=Paris&validated_only=true

# GeoJSON Export
GET /api/export/geojson?city=Paris

# All establishments (Open Data)
GET /api/export/all
```

License: **Creative Commons Attribution 4.0**

## User Roles

### Contributor
- Can add/edit venue information
- Submit photos and details
- View own contribution history
- Cannot validate others' contributions

### Validator
- Review pending contributions
- Approve/reject with feedback
- Can edit venue info directly
- Access analytics dashboard

### Admin
- Full system access
- Manage users and permissions
- Delete venues/contributions
- Configure city settings
- Export all data

## Future Enhancements

🚀 **Planned Features**
- Mobile app (iOS/Android)
- Real-time events & promotions
- User ratings & reviews
- Photo deduplication with ML
- Event calendar integration
- Mobile check-ins
- Integration with booking systems
- Advanced analytics for venue owners

## License

Creative Commons Attribution 4.0 International

## Support

For issues or questions:
- GitHub Issues: [Link to issues]
- Documentation: [Link to docs]
- Community Forum: [Link to forum]

## Credits

Built with ❤️ for nightlife enthusiasts everywhere.
