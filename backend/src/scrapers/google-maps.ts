import axios from 'axios';
import { EstablishmentService, Establishment } from '../services/establishment.service';

interface GooglePlaceResult {
  name: string;
  rating: number;
  reviewCount: number;
  address: string;
  phone?: string;
  website?: string;
  placeId: string;
  latitude: number;
  longitude: number;
}

export class GoogleMapsScraperService {
  private apiKey = process.env.GOOGLE_MAPS_API_KEY || '';
  private establishmentService = new EstablishmentService();

  async scrapeCity(cityName: string, centerLat: number, centerLon: number, cityId: string) {
    if (!this.apiKey) {
      console.warn('Google Maps API key not configured. Skipping Google Maps scraping.');
      return [];
    }

    try {
      const radiusM = 5000; // 5km
      const types = ['bar', 'night_club', 'cafe'];
      const results: GooglePlaceResult[] = [];

      for (const type of types) {
        const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
          params: {
            location: `${centerLat},${centerLon}`,
            radius: radiusM,
            type: type,
            key: this.apiKey
          }
        });

        const places = response.data.results || [];
        console.log(`Found ${places.length} places of type ${type}`);

        for (const place of places) {
          if (place.rating && place.rating >= 3 && place.rating <= 5) {
            // Get detailed info
            const details = await this.getPlaceDetails(place.place_id);

            results.push({
              name: place.name,
              rating: place.rating,
              reviewCount: place.user_ratings_total || 0,
              address: place.formatted_address || '',
              phone: details?.formatted_phone_number,
              website: details?.website,
              placeId: place.place_id,
              latitude: place.geometry.location.lat,
              longitude: place.geometry.location.lng
            });
          }
        }

        // Respecter les rate limits
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Save to database
      for (const result of results) {
        try {
          await this.establishmentService.createEstablishment({
            city_id: cityId,
            name: result.name,
            address: result.address,
            latitude: result.latitude,
            longitude: result.longitude,
            google_place_id: result.placeId,
            google_rating: result.rating,
            google_reviews_count: result.reviewCount,
            phone: result.phone,
            website: result.website,
            type: 'bar',
            status: 'unvalidated'
          });
        } catch (error) {
          console.error(`Failed to save ${result.name}:`, error);
        }
      }

      return results;
    } catch (error) {
      console.error('Google Maps scraping error:', error);
      throw error;
    }
  }

  private async getPlaceDetails(placeId: string) {
    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
        params: {
          place_id: placeId,
          fields: 'formatted_phone_number,website,opening_hours',
          key: this.apiKey
        }
      });

      return response.data.result;
    } catch (error) {
      console.error(`Error fetching details for ${placeId}:`, error);
      return null;
    }
  }
}
