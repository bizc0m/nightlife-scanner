import pool from '../db/connection';
import { v4 as uuidv4 } from 'uuid';
import { DedupService } from './dedup.service';

export interface VenueData {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
  type?: string;
  google_rating?: number;
  foursquare_rating?: number;
  music_type?: string[];
  crowd_type?: string;
  noise_level?: string;
  price_tier?: string;
  atmosphere_tags?: string[];
  hours?: { day: number; open: string; close: string; closed?: boolean }[];
  happy_hours?: { day: number; start: string; end: string; offer: string; drinks?: string[]; discount?: number }[];
  specialties?: { category: string; name: string; description?: string }[];
  combos?: { name: string; description?: string; price?: number; discount?: number }[];
  events?: { name: string; day: number; time: string }[];
  notes?: string;
}

export interface BatchUpload {
  user_id: string;
  city_id: string;
  venues: VenueData[];
  session_id?: string;
}

export class BatchService {
  private dedupService = new DedupService();

  async uploadBatch(batch: BatchUpload) {
    const client = await pool.connect();
    const sessionId = batch.session_id || uuidv4();

    try {
      await client.query('BEGIN');

      // Create scan session
      await client.query(
        'INSERT INTO scan_sessions (id, user_id, city_id, venues_count, status) VALUES ($1, $2, $3, $4, $5)',
        [sessionId, batch.user_id, batch.city_id, batch.venues.length, 'processing']
      );

      let mergedCount = 0;
      let createdCount = 0;
      const results: any[] = [];

      // Process each venue
      for (const venue of batch.venues) {
        try {
          const venueId = await this.saveVenue(client, venue, batch.city_id);

          // Save hours
          if (venue.hours) {
            for (const hour of venue.hours) {
              await client.query(
                `INSERT INTO opening_hours (establishment_id, day_of_week, open_time, close_time, is_closed)
                 VALUES ($1, $2, $3, $4, $5)`,
                [venueId, hour.day, hour.open, hour.close, hour.closed || false]
              );
            }
          }

          // Save happy hours
          if (venue.happy_hours) {
            for (const hh of venue.happy_hours) {
              await client.query(
                `INSERT INTO happy_hours (establishment_id, day_of_week, start_time, end_time, offer, drinks_included, discount_percent)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [venueId, hh.day, hh.start, hh.end, hh.offer, hh.drinks || [], hh.discount || 0]
              );
            }
          }

          // Save specialties
          if (venue.specialties) {
            for (const spec of venue.specialties) {
              await client.query(
                `INSERT INTO specialties (establishment_id, category, name, description)
                 VALUES ($1, $2, $3, $4)`,
                [venueId, spec.category, spec.name, spec.description]
              );
            }
          }

          // Save combos
          if (venue.combos) {
            for (const combo of venue.combos) {
              await client.query(
                `INSERT INTO combos (establishment_id, name, description, price, discount_percent)
                 VALUES ($1, $2, $3, $4, $5)`,
                [venueId, combo.name, combo.description, combo.price, combo.discount || 0]
              );
            }
          }

          // Save events
          if (venue.events) {
            for (const event of venue.events) {
              await client.query(
                `INSERT INTO events (establishment_id, name, day_of_week, start_time)
                 VALUES ($1, $2, $3, $4)`,
                [venueId, event.name, event.day, event.time]
              );
            }
          }

          // Save contribution
          await client.query(
            `INSERT INTO contributions (establishment_id, user_id, contribution_type, new_value, status)
             VALUES ($1, $2, $3, $4, 'pending')`,
            [venueId, batch.user_id, 'edit', JSON.stringify(venue)]
          );

          createdCount++;
          results.push({ venue: venue.name, status: 'success', id: venueId });
        } catch (error) {
          console.error(`Error processing venue ${venue.name}:`, error);
          results.push({ venue: venue.name, status: 'error', error: String(error) });
        }
      }

      // Try deduplication
      const duplicates = await this.dedupService.findDuplicates(batch.city_id);
      for (const dup of duplicates) {
        try {
          await this.dedupService.mergeDuplicates(dup.id1, dup.id2);
          mergedCount++;
        } catch (error) {
          console.error('Error merging duplicates:', error);
        }
      }

      // Update user points
      const points = (createdCount * 10) + (mergedCount * 5);
      await client.query(
        'UPDATE users SET points = points + $1, scans_count = scans_count + $2 WHERE id = $3',
        [points, batch.venues.length, batch.user_id]
      );

      // Update session
      await client.query(
        'UPDATE scan_sessions SET status = $1, completed_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['completed', sessionId]
      );

      await client.query('COMMIT');

      return {
        session_id: sessionId,
        total_venues: batch.venues.length,
        created: createdCount,
        merged: mergedCount,
        points_earned: points,
        results
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async saveVenue(client: any, venue: VenueData, cityId: string) {
    const id = uuidv4();
    const result = await client.query(
      `INSERT INTO establishments (
        id, city_id, name, address, latitude, longitude, phone, website, type,
        google_rating, music_type, crowd_type, noise_level, price_tier, atmosphere_tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id`,
      [
        id, cityId, venue.name, venue.address, venue.latitude, venue.longitude,
        venue.phone, venue.website, venue.type || 'bar',
        venue.google_rating, venue.music_type || [], venue.crowd_type,
        venue.noise_level, venue.price_tier, venue.atmosphere_tags || []
      ]
    );
    return result.rows[0].id;
  }

  async getBatchStatus(sessionId: string) {
    const result = await pool.query('SELECT * FROM scan_sessions WHERE id = $1', [sessionId]);
    return result.rows[0];
  }

  async getVenuesByCity(cityId: string, limit = 100) {
    const result = await pool.query(
      `SELECT e.*,
        array_agg(DISTINCT h.offer) as happy_hours,
        array_agg(DISTINCT s.name) as specialties,
        COUNT(DISTINCT h.id) as happy_hours_count
       FROM establishments e
       LEFT JOIN happy_hours h ON e.id = h.establishment_id
       LEFT JOIN specialties s ON e.id = s.establishment_id
       WHERE e.city_id = $1
       GROUP BY e.id
       LIMIT $2`,
      [cityId, limit]
    );
    return result.rows;
  }
}
