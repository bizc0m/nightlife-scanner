import puppeteer, { Browser, Page } from 'puppeteer';
import { EstablishmentService, Establishment } from '../services/establishment.service';

interface GooglePlaceResult {
  name: string;
  rating: number;
  reviewCount: number;
  address: string;
  phone?: string;
  website?: string;
  placeId: string;
}

export class GoogleMapsScraperService {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private establishmentService = new EstablishmentService();

  async initialize() {
    try {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-blink-features=AutomationControlled'
        ]
      });
      this.page = await this.browser.newPage();
    } catch (error) {
      console.error('Failed to initialize Puppeteer:', error);
      throw error;
    }
  }

  async scrapeCity(cityName: string, centerLat: number, centerLon: number, cityId: string) {
    if (!this.page) {
      throw new Error('Scraper not initialized');
    }

    try {
      const query = `${cityName} bars clubs pubs`;
      const googleMapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}/@${centerLat},${centerLon},13z`;

      console.log(`Scraping: ${googleMapsUrl}`);
      await this.page.goto(googleMapsUrl, { waitUntil: 'networkidle2', timeout: 30000 });

      // Wait for results to load
      await this.page.waitForSelector('[role="listbox"]', { timeout: 5000 }).catch(() => {});

      // Scroll to load more results
      let previousHeight = 0;
      for (let i = 0; i < 5; i++) {
        const scrollHeight = await this.page.evaluate(() => document.body.scrollHeight);
        if (scrollHeight === previousHeight) break;
        previousHeight = scrollHeight;
        await this.page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await this.page.waitForTimeout(1000);
      }

      // Extract place data from the page
      const places = await this.page.evaluate(() => {
        const items: any[] = [];
        const elements = document.querySelectorAll('[role="listbox"] [role="option"]');

        elements.forEach((element) => {
          const titleElement = element.querySelector('[data-item-id]');
          const ratingElement = element.querySelector('[role="img"]');

          if (titleElement) {
            items.push({
              name: titleElement.textContent?.trim(),
              rating: ratingElement?.getAttribute('aria-label')
            });
          }
        });

        return items;
      });

      // For each place, click and extract detailed info
      const results: GooglePlaceResult[] = [];
      for (const place of places.slice(0, 50)) { // Limit to first 50 for demo
        try {
          // Click on the place to open details panel
          await this.page.evaluate((name: string) => {
            const element = Array.from(document.querySelectorAll('[role="option"]')).find(
              (el) => el.textContent?.includes(name)
            );
            if (element) (element as HTMLElement).click();
          }, place.name);

          await this.page.waitForTimeout(1500);

          // Extract details from the side panel
          const details = await this.page.evaluate(() => {
            const nameEl = document.querySelector('h1');
            const ratingEl = document.querySelector('[role="img"][aria-label*="stars"]');
            const addressEl = Array.from(document.querySelectorAll('button')).find(
              (el) => el.textContent?.includes('Address')
            )?.nextElementSibling;
            const phoneEl = Array.from(document.querySelectorAll('button')).find(
              (el) => el.textContent?.includes('Phone')
            )?.nextElementSibling;
            const websiteEl = Array.from(document.querySelectorAll('a')).find(
              (el) => el.getAttribute('data-url')
            );

            return {
              name: nameEl?.textContent?.trim(),
              rating: ratingEl?.getAttribute('aria-label'),
              address: addressEl?.textContent?.trim(),
              phone: phoneEl?.textContent?.trim(),
              website: websiteEl?.href
            };
          });

          if (details.name && details.rating) {
            const ratingValue = parseFloat(details.rating.split(' ')[0]);
            if (ratingValue >= 3 && ratingValue <= 5) {
              results.push({
                name: details.name,
                rating: ratingValue,
                reviewCount: 0,
                address: details.address || '',
                phone: details.phone,
                website: details.website,
                placeId: `google-${Math.random()}`
              });
            }
          }
        } catch (error) {
          console.error(`Error processing place ${place.name}:`, error);
        }
      }

      // Save to database
      for (const result of results) {
        await this.establishmentService.createEstablishment({
          city_id: cityId,
          name: result.name,
          address: result.address,
          latitude: centerLat,
          longitude: centerLon,
          google_place_id: result.placeId,
          google_rating: result.rating,
          google_reviews_count: result.reviewCount,
          phone: result.phone,
          website: result.website,
          type: 'bar', // Default type, can be refined
          status: 'unvalidated'
        });
      }

      return results;
    } catch (error) {
      console.error('Scraping error:', error);
      throw error;
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}
