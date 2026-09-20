# Binit — Database & PostGIS Strategy

> **Engine:** PostgreSQL 15+  
> **Spatial Extension:** PostGIS 3.x (`GEOGRAPHY(Point, 4326)`)  
> **ORM:** SQLAlchemy 2.0 (Async) + GeoAlchemy2  
> **Migrations:** Alembic

---

## 1. Spatial Tables & Geographic Indexing

```sql
-- 1. Reports Table with PostGIS Geography column
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_url VARCHAR(1024) NOT NULL,
    thumbnail_url VARCHAR(1024),
    description TEXT,
    location GEOGRAPHY(Point, 4326) NOT NULL,
    location_accuracy NUMERIC(6, 2),
    zone_code VARCHAR(32) DEFAULT 'KOLKATA_URBAN', -- 'KOLKATA_URBAN' | 'GRAM_PANCHAYAT'
    address_text VARCHAR(512),
    waste_category waste_category_enum NOT NULL DEFAULT 'UNKNOWN',
    classification_status classification_status_enum NOT NULL DEFAULT 'PENDING',
    severity severity_level_enum NOT NULL DEFAULT 'LOW',
    severity_score INTEGER NOT NULL DEFAULT 15 CHECK (severity_score BETWEEN 0 AND 100),
    severity_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
    status report_status_enum NOT NULL DEFAULT 'SUBMITTED',
    assigned_worker_id UUID REFERENCES users(id) ON DELETE SET NULL,
    parent_report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
    collection_task_id UUID REFERENCES collection_tasks(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Spatial R-Tree GiST Index
CREATE INDEX idx_reports_location_gist ON reports USING GIST(location);
```

---

## 2. Standard Spatial Queries

### Radius Search (Distance in Meters)
```sql
SELECT id, waste_category, severity, status, 
       ST_Y(location::geometry) AS latitude, 
       ST_X(location::geometry) AS longitude,
       ST_Distance(location, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography) AS distance_meters
FROM reports
WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography, :radius_meters)
  AND status NOT IN ('REJECTED', 'CLOSED', 'CANCELLED')
ORDER BY distance_meters ASC;
```

### Viewport Bounding Box Query
```sql
SELECT id, waste_category, severity, status, 
       ST_Y(location::geometry) AS latitude, 
       ST_X(location::geometry) AS longitude
FROM reports
WHERE location::geometry && ST_MakeEnvelope(:min_lon, :min_lat, :max_lon, :max_lat, 4326);
```

---
*End of Database Document*
