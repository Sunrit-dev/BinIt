# Binit — REST API Specification

> **Base URL:** `/api/v1`  
> **Protocol:** HTTPS / JSON  
> **Auth Header:** `Authorization: Bearer <clerk_session_jwt>`

---

## 1. Response & Error Envelopes

### Success Response Envelope
```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": {
    "request_id": "req_01HPX7K9V2",
    "timestamp": "2026-09-19T09:30:15Z"
  }
}
```

### Error Response Envelope
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INVALID_STATE_TRANSITION",
    "message": "Cannot transition report from SUBMITTED directly to RESOLVED.",
    "details": {}
  },
  "meta": {
    "request_id": "req_01HPX7K9V2",
    "timestamp": "2026-09-19T09:30:15Z"
  }
}
```

---

## 2. Core Endpoints

### 2.1 Reports

#### `POST /api/v1/reports`
Create and submit a new waste report with image and location.
- **Roles:** `CITIZEN`, `OPERATOR`, `ADMIN`
- **Content-Type:** `multipart/form-data`
- **Form Fields:**
  - `image`: File (JPEG, PNG, WebP; max 10MB)
  - `latitude`: Float (`-90.0` to `90.0`)
  - `longitude`: Float (`-180.0` to `180.0`)
  - `location_accuracy`: Float (optional)
  - `description`: String (optional, max 1000 chars)
  - `zone`: String (optional: `KOLKATA_URBAN` | `GRAM_PANCHAYAT`)
- **Response `201 Created`:**
```json
{
  "success": true,
  "data": {
    "id": "b8f10a82-4f11-4a1b-90f7-d0e5f2c4a912",
    "status": "SUBMITTED",
    "image_url": "https://storage.../reports/2026/09/b8f10a82.webp",
    "thumbnail_url": "https://storage.../reports/2026/09/b8f10a82_thumb.webp",
    "latitude": 22.5726,
    "longitude": 88.3639,
    "created_at": "2026-09-19T09:30:00Z"
  }
}
```

#### `GET /api/v1/reports`
Retrieve paginated reports with spatial and category filters.
- **Roles:** `OPERATOR`, `ADMIN`
- **Query Params:**
  - `status`: String (optional)
  - `waste_category`: String (optional)
  - `severity`: String (optional)
  - `zone`: String (optional: `KOLKATA_URBAN` | `GRAM_PANCHAYAT`)
  - `page`: Integer (default: 1)
  - `page_size`: Integer (default: 20)

#### `GET /api/v1/reports/{id}`
Retrieve complete detail, AI inferences, and status history.

#### `PATCH /api/v1/reports/{id}/status`
Execute state machine transition.
- **Roles:** `OPERATOR`, `WORKER`, `ADMIN`
- **Body:**
```json
{
  "to_status": "ACKNOWLEDGED",
  "reason_note": "Verified image; assigning to KMC ward 64 pickup team."
}
```

---

## 3. Geospatial & Routing

#### `GET /api/v1/map/bounds`
Returns points within current map viewport.
- **Query Params:** `min_lat`, `min_lon`, `max_lat`, `max_lon`, `category`, `severity`

#### `POST /api/v1/routes/optimize`
Calculate optimal collection route through selected reports via OSRM.
- **Body:**
```json
{
  "report_ids": [
    "b8f10a82-...",
    "a1b2c3d4-...",
    "f9e8d7c6-..."
  ]
}
```
- **Response:**
```json
{
  "success": true,
  "data": {
    "total_distance_km": 4.82,
    "estimated_duration_min": 18.5,
    "waypoint_order": [0, 2, 1],
    "route_geojson": {
      "type": "LineString",
      "coordinates": [[88.3639, 22.5726], [88.3712, 22.5801], ...]
    }
  }
}
```

---
*End of API Specification*
