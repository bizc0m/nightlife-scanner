import pool from '../db/connection';
import { v4 as uuidv4 } from 'uuid';

export interface Establishment {
  id?: string;
  city_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  google_place_id?: string;
  google_rating?: number;
  google_reviews_count?: number;
  foursquare_id?: string;
  foursquare_rating?: number;
  phone?: string;
  website?: string;
  type: string;
  description?: string;
  status?: string;
}

export class EstablishmentService {
  async createEstablishment(establishment: Establishment) {
    const id = uuidv4();
    const { city_id, name, address, latitude, longitude, google_place_id, google_rating, google_reviews_count, foursquare_id, foursquare_rating, phone, website, type, description, status } = establishment;

    const query = `
      INSERT INTO establishments (
        id, city_id, name, address, latitude, longitude, google_place_id, google_rating,
        google_reviews_count, foursquare_id, foursquare_rating, phone, website, type, description, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      ON CONFLICT (google_place_id, city_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const result = await pool.query(query, [
      id, city_id, name, address, latitude, longitude, google_place_id, google_rating,
      google_reviews_count, foursquare_id, foursquare_rating, phone, website, type, description, status || 'unvalidated'
    ]);

    return result.rows[0];
  }

  async getEstablishmentsByCity(city_id: string, filters?: { rating_min?: number; type?: string; validated_only?: boolean }) {
    let query = 'SELECT * FROM establishments WHERE city_id = $1';
    const params: any[] = [city_id];

    if (filters?.rating_min) {
      query += ` AND google_rating >= $${params.length + 1}`;
      params.push(filters.rating_min);
    }

    if (filters?.type) {
      query += ` AND type = $${params.length + 1}`;
      params.push(filters.type);
    }

    if (filters?.validated_only) {
      query += ` AND status = 'validated'`;
    }

    query += ' ORDER BY google_rating DESC NULLS LAST';

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getEstablishmentById(id: string) {
    const query = 'SELECT * FROM establishments WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  async updateEstablishment(id: string, updates: Partial<Establishment>) {
    const fields = Object.keys(updates).filter(key => key !== 'id');
    const values = fields.map(key => updates[key as keyof Establishment]);

    const query = `
      UPDATE establishments
      SET ${fields.map((field, i) => `${field} = $${i + 1}`).join(', ')}
      WHERE id = $${fields.length + 1}
      RETURNING *;
    `;

    const result = await pool.query(query, [...values, id]);
    return result.rows[0];
  }

  async getNearbyEstablishments(latitude: number, longitude: number, radiusKm: number = 5) {
    const query = `
      SELECT *,
        earth_distance(ll_to_earth(latitude, longitude), ll_to_earth($1, $2)) / 1000 AS distance_km
      FROM establishments
      WHERE earth_distance(ll_to_earth(latitude, longitude), ll_to_earth($1, $2)) / 1000 <= $3
      AND status = 'validated'
      ORDER BY distance_km ASC
    `;

    const result = await pool.query(query, [latitude, longitude, radiusKm]);
    return result.rows;
  }

  async deleteEstablishment(id: string) {
    const query = 'DELETE FROM establishments WHERE id = $1 RETURNING id;';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}
