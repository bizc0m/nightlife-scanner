import axios from 'axios';

interface FoursquareVenue {
  id: string;
  name: string;
  rating?: number;
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  contact?: {
    phone?: string;
    formattedPhone?: string;
  };
  url?: string;
  hours?: {
    status: string;
    isOpen: boolean;
  };
  categories?: Array<{
    name: string;
  }>;
}

export class FoursquareScraperService {
  private apiBaseUrl = 'https://api.foursquare.com/v2';
  private apiKey = process.env.FOURSQUARE_API_KEY || '';

  async scrapeCity(centerLat: number, centerLon: number, radiusKm: number = 5) {
    if (!this.apiKey) {
      console.warn('Foursquare API key not configured. Skipping Foursquare scraping.');
      return [];
    }

    try {
      const radiusM = radiusKm * 1000;
      const query = 'bars, clubs, pubs';

      // Search venues using Foursquare API
      const response = await axios.get(`${this.apiBaseUrl}/venues/search`, {
        params: {
          'll': `${centerLat},${centerLon}`,
          'query': query,
          'radius': Math.min(radiusM, 40000), // Max 40km
          'limit': 50,
          'client_id': this.apiKey,
          'client_secret': process.env.FOURSQUARE_SECRET || '',
          'v': '20231101'
        }
      });

      const venues = response.data.response.venues || [];
      const results: FoursquareVenue[] = [];

      for (const venue of venues) {
        if (venue.rating && venue.rating >= 3 && venue.rating <= 5) {
          results.push({
            id: venue.id,
            name: venue.name,
            rating: venue.rating,
            location: {
              address: venue.location.address || '',
              lat: venue.location.lat,
              lng: venue.location.lng
            },
            contact: venue.contact,
            url: venue.url,
            hours: venue.hours,
            categories: venue.categories
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Foursquare API error:', error);
      return [];
    }
  }

  async getVenueDetails(venueId: string) {
    if (!this.apiKey) {
      return null;
    }

    try {
      const response = await axios.get(`${this.apiBaseUrl}/venues/${venueId}`, {
        params: {
          'client_id': this.apiKey,
          'client_secret': process.env.FOURSQUARE_SECRET || '',
          'v': '20231101'
        }
      });

      const venue = response.data.response.venue;
      return {
        id: venue.id,
        name: venue.name,
        rating: venue.rating,
        tips: venue.tips?.count || 0,
        photos: venue.photos?.groups?.[0]?.items || [],
        hours: venue.hours,
        bestPhoto: venue.bestPhoto
      };
    } catch (error) {
      console.error(`Error fetching Foursquare venue ${venueId}:`, error);
      return null;
    }
  }

  async searchHours(venueId: string): Promise<any> {
    try {
      const details = await this.getVenueDetails(venueId);
      if (details && details.hours) {
        return details.hours;
      }
      return null;
    } catch (error) {
      console.error(`Error getting hours for ${venueId}:`, error);
      return null;
    }
  }
}
