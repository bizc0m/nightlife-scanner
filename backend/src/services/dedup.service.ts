import pool from '../db/connection';
import { levenshteinDistance } from '../utils/string-similarity';

export class DedupService {
  private similarityThreshold = parseFloat(process.env.DEDUP_SIMILARITY_THRESHOLD || '0.85');

  async findDuplicates(cityId: string) {
    const query = 'SELECT id, name, latitude, longitude FROM establishments WHERE city_id = $1 AND status != \'closed\'';
    const result = await pool.query(query, [cityId]);
    const establishments = result.rows;

    const duplicates = [];

    for (let i = 0; i < establishments.length; i++) {
      for (let j = i + 1; j < establishments.length; j++) {
        const e1 = establishments[i];
        const e2 = establishments[j];

        const nameSimilarity = this.calculateNameSimilarity(e1.name, e2.name);
        const distanceKm = this.haversineDistance(e1.latitude, e1.longitude, e2.latitude, e2.longitude);

        // Consider duplicates if names are similar AND they're within 50m
        if (nameSimilarity >= this.similarityThreshold && distanceKm < 0.05) {
          duplicates.push({
            id1: e1.id,
            id2: e2.id,
            name1: e1.name,
            name2: e2.name,
            similarity: nameSimilarity,
            distance_meters: distanceKm * 1000
          });
        }
      }
    }

    return duplicates;
  }

  async markDuplicates(establishment1Id: string, establishment2Id: string, mergeToId: string) {
    const query = `
      INSERT INTO duplicate_candidates (establishment_id_1, establishment_id_2, merged_to_id, is_merged, similarity_score)
      VALUES ($1, $2, $3, true, 0.99)
      ON CONFLICT DO NOTHING
    `;

    await pool.query(query, [establishment1Id, establishment2Id, mergeToId]);
  }

  async mergeDuplicates(primaryId: string, secondaryId: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get data from both establishments
      const primary = await client.query('SELECT * FROM establishments WHERE id = $1', [primaryId]);
      const secondary = await client.query('SELECT * FROM establishments WHERE id = $1', [secondaryId]);

      if (primary.rows.length === 0 || secondary.rows.length === 0) {
        throw new Error('Establishment not found');
      }

      const p = primary.rows[0];
      const s = secondary.rows[0];

      // Merge data (prefer primary, fill gaps from secondary)
      const merged = {
        google_place_id: p.google_place_id || s.google_place_id,
        google_rating: Math.max(p.google_rating || 0, s.google_rating || 0),
        google_reviews_count: (p.google_reviews_count || 0) + (s.google_reviews_count || 0),
        foursquare_id: p.foursquare_id || s.foursquare_id,
        foursquare_rating: Math.max(p.foursquare_rating || 0, s.foursquare_rating || 0),
        phone: p.phone || s.phone,
        website: p.website || s.website,
        description: p.description || s.description
      };

      // Update primary with merged data
      await client.query(
        `UPDATE establishments SET
          google_place_id = $2, google_rating = $3, google_reviews_count = $4,
          foursquare_id = $5, foursquare_rating = $6, phone = $7, website = $8, description = $9
        WHERE id = $1`,
        [primaryId, merged.google_place_id, merged.google_rating, merged.google_reviews_count,
         merged.foursquare_id, merged.foursquare_rating, merged.phone, merged.website, merged.description]
      );

      // Move photos from secondary to primary
      await client.query(
        'UPDATE photos SET establishment_id = $1 WHERE establishment_id = $2',
        [primaryId, secondaryId]
      );

      // Move happy hours from secondary to primary
      await client.query(
        'UPDATE happy_hours SET establishment_id = $1 WHERE establishment_id = $2',
        [primaryId, secondaryId]
      );

      // Move specialties from secondary to primary
      await client.query(
        'UPDATE specialties SET establishment_id = $1 WHERE establishment_id = $2',
        [primaryId, secondaryId]
      );

      // Delete secondary
      await client.query('DELETE FROM establishments WHERE id = $1', [secondaryId]);

      // Mark as merged
      await this.markDuplicates(primaryId, secondaryId, primaryId);

      await client.query('COMMIT');
      return { success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private calculateNameSimilarity(name1: string, name2: string): number {
    const normalized1 = name1.toLowerCase().trim();
    const normalized2 = name2.toLowerCase().trim();

    const distance = levenshteinDistance(normalized1, normalized2);
    const maxLength = Math.max(normalized1.length, normalized2.length);

    return 1 - distance / maxLength;
  }

  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}
