CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'producer',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  client VARCHAR(255),
  lead_producer VARCHAR(255),
  assistant_producer VARCHAR(255),
  project_overview TEXT,
  timeline TEXT,
  ros TEXT,
  budget VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  section VARCHAR(50) DEFAULT 'sandbox',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assets (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) DEFAULT 'digital',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS specifications (
  id SERIAL PRIMARY KEY,
  asset_id INTEGER REFERENCES assets(id) ON DELETE CASCADE,
  designer VARCHAR(100),
  copy TEXT,
  width VARCHAR(50),
  height VARCHAR(50),
  format VARCHAR(20),
  status VARCHAR(50) DEFAULT 'producer_input',
  producer_notes TEXT,
  designer_notes TEXT,
  client_notes TEXT,
  internal_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS timeline_start DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS timeline_end DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS venue_name VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS venue_location VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS venue_contact VARCHAR(255);

-- Vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  vendor_name VARCHAR(255) NOT NULL,
  vendor_type VARCHAR(255),
  vendor_contact VARCHAR(255),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Venue files (site visit photos)
CREATE TABLE IF NOT EXISTS venue_files (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  uploaded_by VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add milestone dates to specifications
ALTER TABLE specifications ADD COLUMN IF NOT EXISTS due_revision DATE;
ALTER TABLE specifications ADD COLUMN IF NOT EXISTS due_client_review DATE;
ALTER TABLE specifications ADD COLUMN IF NOT EXISTS due_approved DATE;

-- Premier saves (archived snapshots)
CREATE TABLE IF NOT EXISTS premier_saves (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  label VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS spec_files (
  id SERIAL PRIMARY KEY,
  specification_id INTEGER REFERENCES specifications(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50),
  uploaded_by VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
