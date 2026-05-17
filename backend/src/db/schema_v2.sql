-- 🔥 NIGHTLIFE SCANNER - DATA KILLER SCHEMA v2
-- Optimized for massive data accumulation (no photos for now)

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS uuid-ossp;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'contributor',
  points INT DEFAULT 0,
  scans_count INT DEFAULT 0,
  badges TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cities
CREATE TABLE IF NOT EXISTS cities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  country VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  search_radius_km INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, country)
);

-- 🔥 ESTABLISHMENTS (DATA FOCUSED - NO PHOTOS)
CREATE TABLE IF NOT EXISTS establishments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id UUID NOT NULL REFERENCES cities(id),
  name VARCHAR(255) NOT NULL,
  name_normalized VARCHAR(255),
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
  type VARCHAR(100),
  description TEXT,
  status VARCHAR(50) DEFAULT 'unvalidated',
  
  -- 🎵 VIBE DATA
  music_type TEXT[],
  crowd_type VARCHAR(100),
  noise_level VARCHAR(50),
  price_tier VARCHAR(10),
  atmosphere_tags TEXT[],
  
  last_scraped_at TIMESTAMP,
  source_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(google_place_id, city_id),
  UNIQUE(foursquare_id, city_id)
);

CREATE INDEX idx_establishments_location ON establishments USING gist (ll_to_earth(latitude, longitude));
CREATE INDEX idx_establishments_city ON establishments(city_id);
CREATE INDEX idx_establishments_status ON establishments(status);

-- Opening hours (detailed)
CREATE TABLE IF NOT EXISTS opening_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  day_of_week INTEGER,
  open_time TIME,
  close_time TIME,
  is_closed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 🍺 HAPPY HOURS (DETAILED)
CREATE TABLE IF NOT EXISTS happy_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  day_of_week INTEGER,
  start_time TIME,
  end_time TIME,
  offer TEXT,
  drinks_included TEXT[],
  discount_percent INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Specialties
CREATE TABLE IF NOT EXISTS specialties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  category VARCHAR(100),
  name VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 🎁 COMBOS & OFFRES
CREATE TABLE IF NOT EXISTS combos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  name VARCHAR(255),
  description TEXT,
  price DECIMAL(8, 2),
  discount_percent INT,
  validity_start DATE,
  validity_end DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 🎵 EVENTS & SPECIALS
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  name VARCHAR(255),
  description TEXT,
  day_of_week INTEGER,
  start_time TIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contributions (user edits)
CREATE TABLE IF NOT EXISTS contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establishment_id UUID NOT NULL REFERENCES establishments(id),
  user_id UUID NOT NULL REFERENCES users(id),
  contribution_type VARCHAR(50),
  old_value JSONB,
  new_value JSONB,
  status VARCHAR(50) DEFAULT 'pending',
  validator_id UUID REFERENCES users(id),
  validator_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  validated_at TIMESTAMP
);

CREATE INDEX idx_contributions_establishment ON contributions(establishment_id);
CREATE INDEX idx_contributions_status ON contributions(status);

-- Duplicate detection
CREATE TABLE IF NOT EXISTS duplicate_candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establishment_id_1 UUID NOT NULL REFERENCES establishments(id),
  establishment_id_2 UUID NOT NULL REFERENCES establishments(id),
  similarity_score DECIMAL(3, 2),
  is_merged BOOLEAN DEFAULT FALSE,
  merged_to_id UUID REFERENCES establishments(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Version history
CREATE TABLE IF NOT EXISTS establishment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establishment_id UUID NOT NULL REFERENCES establishments(id),
  changed_by_user_id UUID REFERENCES users(id),
  field_name VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  change_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Batch scan sessions
CREATE TABLE IF NOT EXISTS scan_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  city_id UUID NOT NULL REFERENCES cities(id),
  venues_count INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- Updated trigger
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
