-- Enable PostGIS extension for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS uuid-ossp;

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'contributor', -- 'contributor', 'validator', 'admin'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cities
CREATE TABLE cities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  country VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  search_radius_km INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, country)
);

-- Establishments (main table)
CREATE TABLE establishments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id UUID NOT NULL REFERENCES cities(id),
  name VARCHAR(255) NOT NULL,
  name_normalized VARCHAR(255), -- for deduplication
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  google_place_id VARCHAR(255),
  google_rating DECIMAL(3, 1),
  google_reviews_count INTEGER,
  foursquare_id VARCHAR(255),
  foursquare_rating DECIMAL(3, 1),
  phone VARCHAR(20),
  website VARCHAR(500),
  type VARCHAR(100), -- 'bar', 'club', 'pub', 'lounge', 'disco'
  description TEXT,
  status VARCHAR(50) DEFAULT 'unvalidated', -- 'unvalidated', 'pending_validation', 'validated', 'closed'

  -- Scraped metadata
  last_scraped_at TIMESTAMP,
  source_data JSONB, -- store raw scraped data

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(google_place_id, city_id),
  UNIQUE(foursquare_id, city_id)
);

-- Create GiST index for geographic queries
CREATE INDEX idx_establishments_location ON establishments USING gist (ll_to_earth(latitude, longitude));

-- Opening hours
CREATE TABLE opening_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  day_of_week INTEGER, -- 0=Monday, 6=Sunday (NULL for all days)
  open_time TIME,
  close_time TIME,
  is_closed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Happy hours
CREATE TABLE happy_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  day_of_week INTEGER, -- 0-6
  start_time TIME,
  end_time TIME,
  offer TEXT, -- 'Buy 1 get 1', '2 beers for 1 price', etc
  drinks_included TEXT[], -- ['beer', 'wine', 'shots']
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Specialties
CREATE TABLE specialties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  category VARCHAR(100), -- 'drinks', 'music', 'atmosphere', 'events'
  name VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Combos
CREATE TABLE combos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  name VARCHAR(255),
  description TEXT,
  price DECIMAL(8, 2),
  validity_start DATE,
  validity_end DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Photos
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  source VARCHAR(100), -- 'google', 'foursquare', 'user_upload'
  alt_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contributions (edits proposed by users)
CREATE TABLE contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establishment_id UUID NOT NULL REFERENCES establishments(id),
  user_id UUID NOT NULL REFERENCES users(id),
  contribution_type VARCHAR(50), -- 'edit', 'new_happy_hour', 'update_hours', 'add_photo'
  old_value JSONB,
  new_value JSONB,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  validator_id UUID REFERENCES users(id),
  validator_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  validated_at TIMESTAMP
);

-- Duplicates identified by the system
CREATE TABLE duplicate_candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establishment_id_1 UUID NOT NULL REFERENCES establishments(id),
  establishment_id_2 UUID NOT NULL REFERENCES establishments(id),
  similarity_score DECIMAL(3, 2),
  is_merged BOOLEAN DEFAULT FALSE,
  merged_to_id UUID REFERENCES establishments(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Version history
CREATE TABLE establishment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establishment_id UUID NOT NULL REFERENCES establishments(id),
  changed_by_user_id UUID REFERENCES users(id),
  field_name VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  change_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_establishments_city ON establishments(city_id);
CREATE INDEX idx_establishments_status ON establishments(status);
CREATE INDEX idx_establishments_google_place ON establishments(google_place_id);
CREATE INDEX idx_contributions_establishment ON contributions(establishment_id);
CREATE INDEX idx_contributions_status ON contributions(status);
CREATE INDEX idx_users_email ON users(email);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_establishments_updated_at BEFORE UPDATE ON establishments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
