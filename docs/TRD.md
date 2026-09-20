# Binit — Technical Requirements Document (TRD)

> **Version:** 1.0  
> **Status:** Architecture & Implementation Ready  
> **Date:** 2026-09-19  
> **Author:** Senior Architect & Engineering Lead  
> **Project:** Binit (*Spot It. Snap It. Solve It.*)

---

## Table of Contents

1. [Technical Executive Summary](#1-technical-executive-summary)
2. [Architecture Goals & System Quality Attributes](#2-architecture-goals--system-quality-attributes)
3. [Technology Stack & Decision Records](#3-technology-stack--decision-records)
4. [High-Level System Architecture](#4-high-level-system-architecture)
5. [Component & Subsystem Architecture](#5-component--subsystem-architecture)
6. [Frontend Architecture (Next.js App Router)](#6-frontend-architecture-nextjs-app-router)
7. [Backend Architecture (FastAPI Modular Monolith)](#7-backend-architecture-fastapi-modular-monolith)
8. [Database Architecture & PostGIS Strategy](#8-database-architecture--postgis-strategy)
9. [Entity Relationship Diagram (Mermaid ERD)](#9-entity-relationship-diagram-mermaid-erd)
10. [Data Models & PostgreSQL Schema Definition](#10-data-models--postgresql-schema-definition)
11. [REST API Architecture & Endpoint Specification](#11-rest-api-architecture--endpoint-specification)
12. [AI & Computer Vision Pipeline Architecture](#12-ai--computer-vision-pipeline-architecture)
13. [Explainable Severity Scoring Engine](#13-explainable-severity-scoring-engine)
14. [Geospatial & Map Architecture](#14-geospatial--map-architecture)
15. [Routing & Collection Optimization Architecture](#15-routing--collection-optimization-architecture)
16. [Duplicate Report Detection Engine](#16-duplicate-report-detection-engine)
17. [Authentication & Authorization (Clerk + RBAC)](#17-authentication--authorization-clerk--rbac)
18. [File & Binary Asset Handling](#18-file--binary-asset-handling)
19. [Report State Machine & Event Auditing](#19-report-state-machine--event-auditing)
20. [Security & Privacy Engineering](#20-security--privacy-engineering)
21. [Observability, Structured Logging & Health Probes](#21-observability-structured-logging--health-probes)
22. [Error Handling & Standard Error Envelopes](#22-error-handling--standard-error-envelopes)
23. [Testing Strategy & Test Automation](#23-testing-strategy--test-automation)
24. [DevOps, Deployment & CI/CD](#24-devops-deployment--cicd)
25. [Environment Variables & Configuration Matrix](#25-environment-variables--configuration-matrix)
26. [Repository & Monorepo Directory Structure](#26-repository--monorepo-directory-structure)
27. [Phased Implementation Plan (Phases 0 to 10)](#27-phased-implementation-plan-phases-0-to-10)
28. [Technical Open Questions & Recommendations](#28-technical-open-questions--recommendations)

---

## 1. Technical Executive Summary

Binit is engineered as a high-performance, modular monolithic web platform comprising a **Next.js 14+ (App Router, TypeScript, Tailwind CSS)** frontend and a **FastAPI (Python 3.11+, Pydantic v2, SQLAlchemy 2.x)** backend backed by **PostgreSQL 15+ with the PostGIS extension**.

The system isolates domain concerns using clear interface boundaries:
- **AI Classification Subsystem:** Pluggable `WasteClassifier` provider interface supporting PyTorch, Hugging Face Transformers, remote inference endpoints, or mock implementations.
- **Geospatial & GIS Subsystem:** PostGIS spatial queries, vector tile rendering via MapLibre GL JS, and provider-agnostic `GeocodingProvider` and `RoutingProvider` abstractions (backed by OSRM).
- **Storage Subsystem:** S3-compatible `StorageProvider` managing EXIF sanitization, WebP compression, thumbnail generation, and secure presigned URL delivery.
- **Identity & Security:** External Clerk JWT verification integrated with database-enforced RBAC (`CITIZEN`, `WORKER`, `OPERATOR`, `ADMIN`).

---

## 2. Architecture Goals & System Quality Attributes

| Quality Attribute | Architectural Tactic / Design Decision |
|---|---|
| **Modularity & Decoupling** | Strict separation into Service and Repository layers; provider abstraction patterns for AI, GIS, Routing, and Object Storage. |
| **Data Integrity & Consistency** | PostgreSQL ACID transactions, foreign key constraints, UUID primary keys, and strict enum checking for state transitions. |
| **Spatial Query Efficiency** | Native PostGIS geometries with Spatial R-Tree GiST indexes for sub-millisecond bounding box and radius queries. |
| **Fault Tolerance & Graceful Degradation** | Non-blocking asynchronous AI pipeline; AI inference timeouts or failures transition reports to `AI_FAILED` without losing citizen report data. |
| **Extensibility for Roadmap** | Data schemas designed to accept future IoT bin sensor telemetry and multi-vehicle routing payloads without schema breaking changes. |
| **Developer Ergonomics & Testability** | Mockable service layer allowing full end-to-end integration tests without live third-party cloud dependencies. |

---

## 3. Technology Stack & Decision Records

### 3.1 Architectural Decision Records (ADRs)

| Component | Selected Technology | Primary Rationale | Evaluated Alternatives |
|---|---|---|---|
| **Frontend Framework** | **Next.js 14+ (App Router)** | Server-side rendering (SSR), TypeScript first-class support, built-in layout management, fast routing. | Vite + React SPA (lacks SSR/SEO), Remix. |
| **Frontend Styling** | **Tailwind CSS** | Design system token consistency, rapid prototyping, zero runtime overhead. | Vanilla CSS Modules, Styled Components. |
| **Map Rendering** | **MapLibre GL JS** | Open-source, high-performance WebGL vector tile rendering, zero vendor lock-in. | Mapbox GL (proprietary license), Leaflet (raster-heavy, poor vector perf). |
| **Map Tiles** | **OpenFreeMap / OSM Vector** | Free open-source vector basemaps without mandatory proprietary API keys. | Mapbox Tiles, Google Maps Platform (high cost). |
| **Backend API** | **FastAPI (Python 3.11+)** | High throughput (ASGI / Starlette), native Pydantic v2 data validation, direct interoperability with PyTorch / Hugging Face AI stacks. | Django REST Framework (heavyweight), Express / NestJS (awkward Python ML interop). |
| **ORM & Data Layer**| **SQLAlchemy 2.0 (Async)** | Modern Python async ORM, explicit query semantics, robust PostGIS integration via GeoAlchemy2. | Tortoise-ORM, raw asyncpg. |
| **Database Engine** | **PostgreSQL 15+ with PostGIS**| Standard relational engine with spatial data types (`GEOGRAPHY`), spatial indexing (GiST), and spatial functions (`ST_DWithin`, `ST_ClusterDBSCAN`). | MySQL with Spatial (inferior GIS function library), MongoDB GeoJSON. |
| **Authentication** | **Clerk Identity** | Managed multi-tenant auth, prebuilt responsive UI components, secure session management, webhook synchronization. | NextAuth / Auth.js (self-managed infra overhead), Supabase Auth. |
| **Routing Engine** | **OSRM (Open Source Routing Machine)**| Open-source shortest-path and Traveling Salesperson (TSP) route calculation based on OpenStreetMap road networks. | GraphHopper, Google Directions API. |
| **AI / ML Framework**| **PyTorch & Hugging Face Transformers** | Standard ecosystem for Vision Transformers (ViT), ResNet, and YOLO architectures. | TensorFlow / Keras, ONNX Runtime. |
| **Object Storage** | **S3-Compatible Storage (MinIO / Supabase / R2)** | Standardized S3 API, signed URLs, decoupled binary storage from PostgreSQL. | Local filesystem, GridFS. |

---

## 4. High-Level System Architecture

```mermaid
flowchart TB
    subgraph Client_Layer ["Client Layer (Browsers / PWA)"]
        CitizenClient["Citizen Web Client<br>(Mobile / Desktop)"]
        OperatorClient["Operator Dashboard<br>(Desktop / Tablet)"]
        WorkerClient["Worker Portal<br>(Mobile Web)"]
    end

    subgraph CDN_Gateway ["Edge & Routing Layer"]
        VercelEdge["Vercel Edge / Reverse Proxy"]
        ClerkAuth["Clerk Identity Provider<br>(JWT Issuance)"]
    end

    subgraph Frontend_App ["Next.js 14 App Router"]
        ServerComponents["React Server Components"]
        ClientComponents["React Client Components<br>(MapLibre, Forms, Charts)"]
        TanStackQuery["TanStack Query Cache"]
    end

    subgraph Backend_App ["FastAPI Backend (Modular Monolith)"]
        APIRouter["FastAPI API Router (/api/v1)"]
        AuthMiddleware["Clerk JWT Verification & RBAC Guard"]
        
        subgraph Services ["Service Layer"]
            ReportService["Report Service"]
            AIService["AI Vision Service"]
            GeoService["GIS & Mapping Service"]
            RoutingService["Routing & Dispatch Service"]
            SeverityService["Explainable Severity Engine"]
            StorageService["Storage & Image Service"]
            DuplicateService["Duplicate Detection Engine"]
        end
        
        subgraph Adapters ["Provider Adapters"]
            WasteClassifier["WasteClassifier (PyTorch / HF / Mock)"]
            OSRMAdapter["OSRM Routing Provider"]
            NominatimAdapter["Geocoding Provider"]
            S3StorageAdapter["S3 / R2 Object Storage Provider"]
        end
    end

    subgraph Persistence_Layer ["Data & Storage Layer"]
        PostgresDB[("PostgreSQL 15+ PostGIS<br>- Spatial Index GiST<br>- Reports, Users, Audits")]
        ObjectStorage[("Object Storage S3 / R2<br>- Sanitized Images<br>- WebP Thumbnails")]
    end

    CitizenClient --> VercelEdge
    OperatorClient --> VercelEdge
    WorkerClient --> VercelEdge
    
    CitizenClient <--> ClerkAuth
    OperatorClient <--> ClerkAuth
    WorkerClient <--> ClerkAuth

    VercelEdge --> Frontend_App
    Frontend_App --> APIRouter
    
    APIRouter --> AuthMiddleware
    AuthMiddleware --> ReportService
    AuthMiddleware --> RoutingService
    AuthMiddleware --> GeoService
    
    ReportService --> SeverityService
    ReportService --> DuplicateService
    ReportService --> AIService
    ReportService --> StorageService
    ReportService --> GeoService
    RoutingService --> GeoService
    
    AIService --> WasteClassifier
    RoutingService --> OSRMAdapter
    GeoService --> NominatimAdapter
    StorageService --> S3StorageAdapter
    
    ReportService --> PostgresDB
    AIService --> PostgresDB
    RoutingService --> PostgresDB
    GeoService --> PostgresDB
    S3StorageAdapter --> ObjectStorage
```

---

## 5. Component & Subsystem Architecture

```mermaid
graph TD
    subgraph Core_Domains ["Domain Core Modules"]
        DomainReports["Reports Domain<br>- Report Entity<br>- Status State Machine<br>- History and Audit Logs"]
        DomainAI["AI Vision Domain<br>- Preprocessing and Validation<br>- Classifier Engine<br>- Model Versioning Metadata"]
        DomainGeo["Geospatial Domain<br>- Point Geometries (EPSG:4326)<br>- Radius and Bounding Queries<br>- Hotspot Density Clustering"]
        DomainOps["Operations Domain<br>- Collection Tasks<br>- Worker Assignments<br>- Route Waypoints"]
    end

    subgraph Cross_Cutting ["Cross-Cutting Concerns"]
        Security["RBAC Guard and Token Verifier"]
        Telemetry["Structured JSON Logger and Health Probes"]
        ErrorHandling["Global Error Envelope Handler"]
    end

    DomainReports --> Security
    DomainAI --> Telemetry
    DomainGeo --> ErrorHandling
    DomainOps --> Security
```

---

## 6. Frontend Architecture (Next.js App Router)

### 6.1 App Router Directory Map
```
apps/web/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   └── sign-up/[[...sign-up]]/page.tsx
│   ├── (public)/
│   │   ├── page.tsx                      # Landing & marketing page
│   │   └── about/page.tsx
│   ├── (protected)/
│   │   ├── layout.tsx                    # Shared authenticated wrapper (Clerk + Profile loader)
│   │   ├── citizen/
│   │   │   ├── report/page.tsx           # Photo capture + GPS submission form
│   │   │   ├── my-reports/page.tsx       # Citizen's historical reports
│   │   │   └── map/page.tsx              # Public/Citizen blurred nearby map
│   │   ├── operator/
│   │   │   ├── dashboard/page.tsx        # Overview analytics & KPI counters
│   │   │   ├── queue/page.tsx            # Filterable triage table with side-drawer
│   │   │   ├── map/page.tsx              # Operational map (Heatmap, Clustering, Filters)
│   │   │   └── routes/page.tsx           # Multi-stop collection route builder
│   │   ├── worker/
│   │   │   ├── tasks/page.tsx            # Assigned collection task cards
│   │   │   └── tasks/[id]/page.tsx       # Task navigation & resolution upload
│   │   └── admin/
│   │       ├── analytics/page.tsx        # Longitudinal municipal intelligence charts
│   │       ├── users/page.tsx            # Role management (Citizen -> Worker/Operator)
│   │       └── audit-logs/page.tsx       # System event logs & AI threshold configs
│   ├── api/                              # Optional Next.js edge route handlers
│   ├── globals.css                       # Tailwind design tokens & base resets
│   └── layout.tsx                        # Root HTML & ClerkProvider
├── components/
│   ├── ui/                               # Atomic primitives (Button, Modal, Badge, Drawer)
│   ├── map/                              # MapLibre container, Marker, Popup, HeatmapLayer
│   ├── forms/                            # ReportForm, ImageUploadDropzone, GPSPicker
│   └── charts/                           # Recharts wrappers (CategoryDonut, TrendLineChart)
└── lib/
    ├── api-client.ts                     # Axios/Fetch client with automatic Clerk JWT injection
    ├── hooks/                            # useGeolocation, useReportsQuery, useReportDetail
    └── types/                            # Shared TypeScript interfaces & Zod schemas
```

---

## 7. Backend Architecture (FastAPI Modular Monolith)

### 7.1 Backend Layering Structure
```
backend/app/
├── api/
│   ├── v1/
│   │   ├── auth.py             # User sync & profile endpoints
│   │   ├── reports.py          # CRUD, submission, status transitions
│   │   ├── ai.py               # Direct classification test endpoints
│   │   ├── map.py              # Geospatial bounding box & heatmap points
│   │   ├── routes.py           # OSRM routing & optimization dispatch
│   │   ├── dashboard.py        # Aggregated KPI and chart metrics
│   │   └── admin.py            # User role management, threshold config
│   └── router.py               # Aggregates /api/v1 endpoints
├── core/
│   ├── config.py               # Pydantic BaseSettings (.env reader)
│   ├── security.py             # Clerk JWT verification & decode logic
│   ├── rbac.py                 # Dependency injectors: require_role(RoleEnum)
│   └── exceptions.py           # Custom exception classes & handlers
├── models/                     # SQLAlchemy 2.0 ORM Declarative Models
│   ├── user.py
│   ├── report.py
│   ├── ai_analysis.py
│   ├── report_status_history.py
│   ├── collection_task.py
│   ├── notification.py
│   └── audit_log.py
├── schemas/                    # Pydantic v2 validation models (Request/Response)
│   ├── user.py
│   ├── report.py
│   ├── ai.py
│   ├── geo.py
│   ├── route.py
│   └── common.py               # Base envelope models
├── services/                   # Pure business logic layer
│   ├── report_service.py
│   ├── ai_service.py
│   ├── geo_service.py
│   ├── severity_service.py
│   ├── duplicate_service.py
│   └── route_service.py
├── repositories/               # Data access layer (Async SQLAlchemy queries)
│   ├── report_repo.py
│   ├── user_repo.py
│   └── task_repo.py
├── ai/                         # Pluggable computer vision modules
│   ├── base.py                 # Abstract BaseWasteClassifier
│   ├── mock_classifier.py      # Deterministic Mock Classifier for Dev/Test
│   ├── hf_classifier.py        # HuggingFace Vision Transformer / Pipeline
│   └── preprocessor.py         # OpenCV image resizing & normalization
├── geo/                        # Map & routing abstractions
│   ├── geocoder_base.py        # Abstract GeocodingProvider
│   ├── nominatim.py            # OSM Nominatim implementation
│   ├── router_base.py          # Abstract RoutingProvider
│   └── osrm.py                 # OSRM HTTP API integration
├── storage/                    # Binary object storage
│   ├── base.py                 # Abstract StorageProvider
│   ├── s3.py                   # AWS S3 / Cloudflare R2 / MinIO implementation
│   └── local.py                # Local disk storage for offline testing
└── main.py                     # FastAPI initialization, middleware, CORS
```

---

## 8. Database Architecture & PostGIS Strategy

### 8.1 Spatial Column & Coordinate Reference System (CRS)
- **CRS / SRID:** Standard WGS 84 (`EPSG:4326`).
- **Data Type:** `GEOGRAPHY(Point, 4326)` for calculations in real-world spherical meters without planar projection distortion.
- **Spatial Indexing:** GiST (Generalized Search Tree) index created over `location` columns.

### 8.2 Common Spatial SQL Queries

#### Radius Search (Find reports within $X$ meters)
```sql
SELECT id, waste_category, severity, status, 
       ST_Y(location::geometry) AS latitude, 
       ST_X(location::geometry) AS longitude
FROM reports
WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography, :radius_meters)
  AND status NOT IN ('REJECTED', 'CLOSED', 'CANCELLED');
```

#### Viewport Bounding Box Query
```sql
SELECT id, waste_category, severity, status, 
       ST_Y(location::geometry) AS latitude, 
       ST_X(location::geometry) AS longitude
FROM reports
WHERE location::geometry && ST_MakeEnvelope(:min_lon, :min_lat, :max_lon, :max_lat, 4326);
```

#### Hotspot Density Grid Aggregation
```sql
SELECT ST_AsGeoJSON(ST_Centroid(ST_Collect(location::geometry))) AS center,
       COUNT(*) AS report_count,
       MAX(severity_score) AS max_severity
FROM reports
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY ST_SnapToGrid(location::geometry, 0.005, 0.005);
```

---

## 9. Entity Relationship Diagram (Mermaid ERD)

```mermaid
erDiagram
    USERS ||--o{ REPORTS : "creates"
    USERS ||--o{ COLLECTION_TASKS : "assigned_to"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ AUDIT_LOGS : "triggers"
    
    REPORTS ||--|| AI_ANALYSES : "evaluated_by"
    REPORTS ||--o{ REPORT_STATUS_HISTORY : "tracks"
    COLLECTION_TASKS ||--o{ REPORTS : "batches"
    REPORTS ||--o{ REPORTS : "duplicates"

    USERS {
        uuid id PK
        string clerk_id UK
        string email UK
        string full_name
        string role
        string phone_number
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    REPORTS {
        uuid id PK
        uuid user_id FK
        string image_url
        string thumbnail_url
        text description
        geography location
        float location_accuracy
        string address_text
        string waste_category
        string classification_status
        string severity
        int severity_score
        jsonb severity_reasons
        string status
        uuid assigned_worker_id FK
        uuid parent_report_id FK
        uuid collection_task_id FK
        timestamp created_at
        timestamp updated_at
        timestamp resolved_at
    }

    AI_ANALYSES {
        uuid id PK
        uuid report_id FK
        string model_name
        string model_version
        string primary_category
        float confidence
        jsonb secondary_predictions
        jsonb raw_detection_boxes
        float inference_time_ms
        timestamp processed_at
    }

    REPORT_STATUS_HISTORY {
        uuid id PK
        uuid report_id FK
        string from_status
        string to_status
        uuid changed_by_user_id FK
        text reason_note
        timestamp created_at
    }

    COLLECTION_TASKS {
        uuid id PK
        uuid worker_id FK
        string status
        jsonb route_geojson
        float total_distance_km
        float estimated_duration_min
        date scheduled_date
        timestamp created_at
        timestamp completed_at
    }

    NOTIFICATIONS {
        uuid id PK
        uuid user_id FK
        uuid report_id FK
        string title
        text message
        string type
        boolean is_read
        timestamp created_at
    }

    AUDIT_LOGS {
        uuid id PK
        uuid actor_user_id FK
        string action_type
        string entity_name
        uuid entity_id
        jsonb state_before
        jsonb state_after
        string ip_address
        timestamp created_at
    }
```

---

## 10. Data Models & PostgreSQL Schema Definition

### 10.1 Database Enums
```sql
CREATE TYPE user_role_enum AS ENUM ('CITIZEN', 'WORKER', 'OPERATOR', 'ADMIN');

CREATE TYPE waste_category_enum AS ENUM (
    'PLASTIC', 'PAPER', 'METAL', 'GLASS', 'ORGANIC', 
    'E_WASTE', 'TEXTILE', 'MIXED', 'HAZARDOUS', 'OTHER', 'UNKNOWN'
);

CREATE TYPE classification_status_enum AS ENUM (
    'PENDING', 'CLASSIFIED', 'NEEDS_REVIEW', 'MANUAL_OVERRIDE', 'FAILED'
);

CREATE TYPE severity_level_enum AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

CREATE TYPE report_status_enum AS ENUM (
    'SUBMITTED', 'AI_PROCESSING', 'CLASSIFIED', 'PENDING_REVIEW', 
    'ACKNOWLEDGED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 
    'VERIFIED', 'CLOSED', 'REJECTED', 'DUPLICATE', 'CANCELLED', 'AI_FAILED'
);

CREATE TYPE task_status_enum AS ENUM (
    'CREATED', 'DISPATCHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
);
```

### 10.2 Core Table DDL (PostgreSQL + PostGIS)

```sql
-- Enable PostGIS & UUID extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 1. USERS
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_id VARCHAR(128) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'CITIZEN',
    phone_number VARCHAR(32),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_users_role ON users(role);

-- 2. COLLECTION_TASKS (Created prior to reports for FK reference)
CREATE TABLE collection_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status task_status_enum NOT NULL DEFAULT 'CREATED',
    route_geojson JSONB,
    total_distance_km NUMERIC(8, 2),
    estimated_duration_min NUMERIC(8, 2),
    scheduled_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);
CREATE INDEX idx_collection_tasks_worker ON collection_tasks(worker_id);
CREATE INDEX idx_collection_tasks_status ON collection_tasks(status);

-- 3. REPORTS
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_url VARCHAR(1024) NOT NULL,
    thumbnail_url VARCHAR(1024),
    description TEXT,
    location GEOGRAPHY(Point, 4326) NOT NULL,
    location_accuracy NUMERIC(6, 2),
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
-- Spatial Index
CREATE INDEX idx_reports_location_gist ON reports USING GIST(location);
-- Filter & Operational Indexes
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_severity ON reports(severity);
CREATE INDEX idx_reports_category ON reports(waste_category);
CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX idx_reports_assigned_worker ON reports(assigned_worker_id);

-- 4. AI_ANALYSES
CREATE TABLE ai_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID UNIQUE NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    model_name VARCHAR(128) NOT NULL,
    model_version VARCHAR(64) NOT NULL,
    primary_category waste_category_enum NOT NULL,
    confidence NUMERIC(5, 4) NOT NULL,
    secondary_predictions JSONB DEFAULT '[]'::jsonb,
    raw_detection_boxes JSONB DEFAULT '[]'::jsonb,
    inference_time_ms NUMERIC(8, 2) NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ai_analyses_report_id ON ai_analyses(report_id);

-- 5. REPORT_STATUS_HISTORY (Audit Log for State Machine)
CREATE TABLE report_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    from_status report_status_enum NOT NULL,
    to_status report_status_enum NOT NULL,
    changed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reason_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_status_history_report ON report_status_history(report_id);

-- 6. NOTIFICATIONS
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(32) NOT NULL DEFAULT 'STATUS_CHANGE',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notifs_user_unread ON notifications(user_id, is_read);

-- 7. AUDIT_LOGS
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(64) NOT NULL,
    entity_name VARCHAR(64) NOT NULL,
    entity_id UUID NOT NULL,
    state_before JSONB,
    state_after JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_entity ON audit_logs(entity_name, entity_id);
```

---

## 11. REST API Architecture & Endpoint Specification

### 11.1 Base Conventions
- **Base URL:** `/api/v1`
- **Authentication:** Header `Authorization: Bearer <clerk_session_jwt>`
- **Response Format:** Standardized JSON Envelope:
```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": {
    "request_id": "req_01HPX7K9...",
    "timestamp": "2026-09-19T09:30:00Z"
  }
}
```

### 11.2 Endpoint Reference Matrix

| Method | Endpoint | Authorized Roles | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/sync` | Authenticated | Syncs Clerk user metadata into PostgreSQL `users` table. |
| `GET` | `/api/v1/users/me` | Authenticated | Returns current profile, assigned role, and permissions. |
| `POST` | `/api/v1/reports` | `CITIZEN`, `OPERATOR`, `ADMIN` | Multipart upload creating a report and starting AI ingestion. |
| `GET` | `/api/v1/reports` | `OPERATOR`, `ADMIN` | Paginated, filterable report list (by category, severity, status, date). |
| `GET` | `/api/v1/reports/me` | `CITIZEN` | Returns reports submitted by current citizen user. |
| `GET` | `/api/v1/reports/nearby` | Authenticated | Returns reports within radius $R$ meters of `(lat, lon)` (Citizen view is blurred). |
| `GET` | `/api/v1/reports/{id}` | Authenticated | Returns full report detail, AI analysis, and status history. |
| `PATCH`| `/api/v1/reports/{id}/status` | `OPERATOR`, `WORKER`, `ADMIN` | State machine transition endpoint with audit record. |
| `PATCH`| `/api/v1/reports/{id}/override` | `OPERATOR`, `ADMIN` | Manually overrides AI classification category. |
| `POST` | `/api/v1/reports/{id}/assign` | `OPERATOR`, `ADMIN` | Assigns a single report to a worker ID. |
| `POST` | `/api/v1/routes/optimize` | `OPERATOR`, `ADMIN` | Takes array of report IDs, calls OSRM, returns optimized waypoint order & polyline. |
| `POST` | `/api/v1/tasks/dispatch` | `OPERATOR`, `ADMIN` | Bundles report IDs + route GeoJSON into a `collection_task`. |
| `GET` | `/api/v1/worker/tasks` | `WORKER` | Returns assigned collection tasks for current worker. |
| `GET` | `/api/v1/map/bounds` | Authenticated | Returns geo points within bounding box `(min_lat, min_lon, max_lat, max_lon)`. |
| `GET` | `/api/v1/map/heatmap` | `OPERATOR`, `ADMIN` | Returns spatial density clusters for heatmap rendering. |
| `GET` | `/api/v1/dashboard/summary` | `OPERATOR`, `ADMIN` | Returns overview KPI counts (total, pending, high severity, resolved today). |
| `GET` | `/api/v1/dashboard/analytics` | `OPERATOR`, `ADMIN` | Returns category distribution, severity breakdown, and 30-day volume trends. |
| `GET` | `/api/v1/notifications` | Authenticated | Returns paginated list of unread/read in-app notifications. |
| `GET` | `/health` | Public | Liveness probe returning 200 OK. |
| `GET` | `/ready` | Public | Readiness probe checking DB connection, AI model load, and S3 reachability. |

---

## 12. AI & Computer Vision Pipeline Architecture

### 12.1 Pluggable Abstraction Interface
```python
# backend/app/ai/base.py
from abc import ABC, abstractmethod
from typing import Dict, Any, List
from pydantic import BaseModel

class ClassificationResult(BaseModel):
    primary_category: str
    confidence: float
    secondary_predictions: List[Dict[str, Any]]
    inference_time_ms: float
    model_name: str
    model_version: str

class BaseWasteClassifier(ABC):
    @abstractmethod
    async def predict(self, image_bytes: bytes) -> ClassificationResult:
        """Classifies image bytes into a waste category."""
        pass

    @abstractmethod
    def health_check(self) -> bool:
        """Checks if model weights are loaded and ready."""
        pass
```

### 12.2 Inference Pipeline Flow
```mermaid
flowchart TD
    RawImage["Raw Uploaded Image<br>(JPEG / PNG / WebP)"] --> Validate["Sanity and MIME Validation"]
    Validate --> Preprocess["OpenCV Preprocessing:<br>- Strip EXIF<br>- Resize to 384x384 or 224x224<br>- RGB Channel Normalization"]
    Preprocess --> Classifier{"Classifier Provider"}
    
    Classifier -->|Dev / Test| MockClassifier["MockWasteClassifier<br>(Deterministic Keyword/Hash)"]
    Classifier -->|Production| ViTModel["HuggingFace Vision Transformer<br>(waste-classification-vit)"]
    
    ViTModel --> Softmax["Softmax Probabilities Distribution"]
    Softmax --> CheckThreshold{"Max Confidence >= Threshold (0.70)?"}
    
    CheckThreshold -->|Yes| SetClassified["classification_status = CLASSIFIED<br>status = CLASSIFIED"]
    CheckThreshold -->|No| SetReview["classification_status = NEEDS_REVIEW<br>status = PENDING_REVIEW"]
    
    SetClassified --> SevEngine["Run Explainable Severity Engine"]
    SetReview --> SevEngine
    SevEngine --> Persist["Persist to ai_analyses and reports DB"]
```

---

## 13. Explainable Severity Scoring Engine

```python
# backend/app/services/severity_service.py
from typing import List, Tuple
from app.models.enums import WasteCategoryEnum, SeverityLevelEnum

class SeverityEvaluation:
    def __init__(self, score: int, level: SeverityLevelEnum, reasons: List[str]):
        self.score = score
        self.level = level
        self.reasons = reasons

class SeverityService:
    CATEGORY_BASE_SCORES = {
        WasteCategoryEnum.HAZARDOUS: 70,
        WasteCategoryEnum.E_WASTE: 50,
        WasteCategoryEnum.MIXED: 35,
        WasteCategoryEnum.ORGANIC: 30,
        WasteCategoryEnum.PLASTIC: 25,
        WasteCategoryEnum.METAL: 25,
        WasteCategoryEnum.GLASS: 20,
        WasteCategoryEnum.PAPER: 15,
        WasteCategoryEnum.TEXTILE: 15,
        WasteCategoryEnum.OTHER: 20,
        WasteCategoryEnum.UNKNOWN: 15,
    }

    @classmethod
    def evaluate(
        cls, 
        category: WasteCategoryEnum, 
        near_water_body: bool = False,
        near_main_road: bool = False,
        duplicate_count: int = 0,
        unresolved_hours: float = 0.0
    ) -> SeverityEvaluation:
        reasons = []
        score = cls.CATEGORY_BASE_SCORES.get(category, 15)
        reasons.append(f"Base category weight for {category.value}: +{score} pts")

        if category == WasteCategoryEnum.HAZARDOUS:
            score = max(score, 70)
            reasons.append("Hazardous material detected (Mandatory High floor: 70 pts)")

        if near_water_body:
            score += 15
            reasons.append("Environmental proximity: Located within 50m of water body (+15 pts)")

        if near_main_road:
            score += 10
            reasons.append("Public safety: Located near high-traffic thoroughfare (+10 pts)")

        if duplicate_count >= 2:
            score += 10
            reasons.append(f"Community recurrence: {duplicate_count} reports filed in proximity (+10 pts)")

        if unresolved_hours > 48:
            score += 5
            reasons.append(f"Escalation: Unresolved for {int(unresolved_hours)} hours (+5 pts)")

        final_score = min(100, score)

        if final_score >= 81:
            level = SeverityLevelEnum.CRITICAL
        elif final_score >= 61:
            level = SeverityLevelEnum.HIGH
        elif final_score >= 31:
            level = SeverityLevelEnum.MEDIUM
        else:
            level = SeverityLevelEnum.LOW

        return SeverityEvaluation(score=final_score, level=level, reasons=reasons)
```

---

## 14. Geospatial & Map Architecture

### 14.1 MapLibre GL Integration & Dual-Zone Configuration
- Frontend loads `@maplibre/maplibre-gl-js`.
- Basemap styles loaded via vector tile URLs configured in `NEXT_PUBLIC_MAP_STYLE_URL` (pointing to OpenFreeMap `https://tiles.openfreemap.org/styles/liberty`).
- Reports loaded dynamically via TanStack Query connecting to `/api/v1/map/bounds?min_lat=...&max_lat=...`.

#### Dual-Zone Geographic Presets (Kolkata Urban & Gram Panchayat)
```typescript
export interface GeoZonePreset {
  id: string;
  name: string;
  type: "URBAN" | "GRAM_PANCHAYAT";
  center: [number, number]; // [lon, lat]
  zoom: number;
  bounds?: [[number, number], [number, number]]; // [[minLon, minLat], [maxLon, maxLat]]
}

export const GEO_ZONE_PRESETS: Record<string, GeoZonePreset> = {
  KOLKATA_URBAN: {
    id: "KOLKATA_URBAN",
    name: "Kolkata Urban (KMC)",
    type: "URBAN",
    center: [88.3639, 22.5726], // Park Street / Central Kolkata
    zoom: 12.5,
    bounds: [[88.2500, 22.4500], [88.4800, 22.6500]],
  },
  GRAM_PANCHAYAT: {
    id: "GRAM_PANCHAYAT",
    name: "Rajarhat Bishnupur Gram Panchayat",
    type: "GRAM_PANCHAYAT",
    center: [88.5122, 22.6105], // Peri-urban / rural village center
    zoom: 13.5,
    bounds: [[88.4600, 22.5600], [88.5700, 22.6600]],
  },
};
```

### 14.2 Marker Clustering & Heatmap Layer
- GeoJSON feature collection loaded into a MapLibre GeoJSON Source with `cluster: true`, `clusterRadius: 50`, and `clusterMaxZoom: 14`.
- A dedicated Heatmap layer toggles on/off based on operator UI state, using `heatmap-weight` weighted by `severity_score / 100`.
- Fast camera flyTo transitions between Kolkata Municipal Wards and Gram Panchayat village points.

---

## 15. Routing & Collection Optimization Architecture

### 15.1 OSRM Provider Integration
```python
# backend/app/geo/osrm.py
import httpx
from typing import List, Tuple, Dict, Any

class OSRMRoutingProvider:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")

    async def optimize_trip(self, coordinates: List[Tuple[float, float]]) -> Dict[str, Any]:
        """
        Calls OSRM Trip service (Traveling Salesperson solution).
        coordinates format: [(lon1, lat1), (lon2, lat2), ...]
        """
        coord_str = ";".join([f"{lon:.6f},{lat:.6f}" for lon, lat in coordinates])
        url = f"{self.base_url}/trip/v1/driving/{coord_str}?overview=full&geometries=geojson&roundtrip=false&source=first"
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()

        trip = data["trips"][0]
        return {
            "distance_km": trip["distance"] / 1000.0,
            "duration_min": trip["duration"] / 60.0,
            "geometry": trip["geometry"],  # GeoJSON LineString
            "waypoint_order": [wp["waypoint_index"] for wp in data["waypoints"]]
        }
```

---

## 16. Duplicate Report Detection Engine

### 16.1 Heuristic Matching Formula
When a new report $R_{\text{new}}$ is submitted at location $L_{\text{new}}$ with category $C_{\text{new}}$ at time $T_{\text{new}}$:
1. Spatial query checks for existing active reports $R_i$ within radius $d \le 50\text{ meters}$.
2. Temporal filter checks if $|T_{\text{new}} - T_i| \le 48\text{ hours}$.
3. Categorical match checks if $C_{\text{new}} == C_i$ or either category is `MIXED`.
4. If conditions match, $R_{\text{new}}$ is tagged with a warning flag `possible_duplicate_of = R_i.id`.
5. The operator dashboard presents a visual side-by-side comparison modal allowing one-click consolidation into `DUPLICATE` status.

---

## 17. Authentication & Authorization (Clerk + RBAC)

### 17.1 JWT Validation Flow
```mermaid
sequenceDiagram
    participant Browser as Next.js Client
    participant Clerk as Clerk Auth Service
    participant API as FastAPI Backend
    participant DB as PostgreSQL

    Browser->>Clerk: User logs in
    Clerk-->>Browser: Issues Session JWT (with sub=clerk_user_id)
    Browser->>API: HTTP Request + Bearer JWT
    API->>API: Verify Clerk RSA Public Key & expiration
    API->>DB: Query users WHERE clerk_id = JWT.sub
    DB-->>API: User record (role='OPERATOR')
    API->>API: Evaluate require_role(RoleEnum.OPERATOR)
    API-->>Browser: Return authorized response
```

---

## 18. File & Binary Asset Handling

### 18.1 Storage Processing Pipeline
1. **Validation:** Server inspects first 512 bytes with `python-magic` to confirm true MIME type (`image/jpeg`, `image/png`, `image/webp`). Max file size enforced at 10 MB.
2. **EXIF Sanitization:** Image passed through Pillow (`PIL.Image`), EXIF tag dictionary stripped to protect citizen camera serials and home location leakage.
3. **WebP Compression:** Image re-encoded to WebP format with `quality=82`.
4. **Thumbnail Creation:** Proportional thumbnail generated with max dimension 400px.
5. **Storage Dispatch:** Uploaded to S3 bucket path `/reports/{year}/{month}/{uuid}.webp` and `/reports/{year}/{month}/{uuid}_thumb.webp`.

---

## 19. Report State Machine & Event Auditing

### 19.1 State Transition Matrix Enforcement
```python
# backend/app/services/report_service.py
VALID_TRANSITIONS = {
    ReportStatusEnum.SUBMITTED: [
        ReportStatusEnum.AI_PROCESSING, 
        ReportStatusEnum.CANCELLED
    ],
    ReportStatusEnum.AI_PROCESSING: [
        ReportStatusEnum.CLASSIFIED, 
        ReportStatusEnum.PENDING_REVIEW, 
        ReportStatusEnum.AI_FAILED
    ],
    ReportStatusEnum.AI_FAILED: [
        ReportStatusEnum.PENDING_REVIEW,
        ReportStatusEnum.AI_PROCESSING
    ],
    ReportStatusEnum.CLASSIFIED: [
        ReportStatusEnum.ACKNOWLEDGED, 
        ReportStatusEnum.REJECTED, 
        ReportStatusEnum.DUPLICATE
    ],
    ReportStatusEnum.PENDING_REVIEW: [
        ReportStatusEnum.ACKNOWLEDGED, 
        ReportStatusEnum.REJECTED, 
        ReportStatusEnum.DUPLICATE
    ],
    ReportStatusEnum.ACKNOWLEDGED: [
        ReportStatusEnum.ASSIGNED, 
        ReportStatusEnum.REJECTED
    ],
    ReportStatusEnum.ASSIGNED: [
        ReportStatusEnum.IN_PROGRESS, 
        ReportStatusEnum.ACKNOWLEDGED
    ],
    ReportStatusEnum.IN_PROGRESS: [
        ReportStatusEnum.RESOLVED, 
        ReportStatusEnum.ASSIGNED
    ],
    ReportStatusEnum.RESOLVED: [
        ReportStatusEnum.VERIFIED, 
        ReportStatusEnum.IN_PROGRESS
    ],
    ReportStatusEnum.VERIFIED: [
        ReportStatusEnum.CLOSED
    ],
}
```

---

## 20. Security & Privacy Engineering

- **CORS Policy:** Strict origin allowlist configured in `BACKEND_CORS_ORIGINS`.
- **SQL Injection:** 100% parameterized queries via SQLAlchemy 2.0 ORM.
- **XSS Sanitization:** React JSX output auto-escaping + strict Content Security Policy (CSP) headers in Next.js.
- **Rate Limiting:** SlowAPI / Redis-backed rate limiting applied to `POST /api/v1/reports` (max 10 submissions per minute per user).
- **Secrets Management:** Secrets ingested exclusively through environment variables; zero hardcoded credentials.

---

## 21. Observability, Structured Logging & Health Probes

### 21.1 Structured JSON Logging Format
```json
{
  "timestamp": "2026-09-19T09:30:15.123Z",
  "level": "INFO",
  "logger": "binit.api.reports",
  "request_id": "req_01HPX7K9V2",
  "user_id": "usr_998124",
  "role": "CITIZEN",
  "action": "CREATE_REPORT",
  "report_id": "b8f10a82-...",
  "duration_ms": 184.2,
  "status_code": 201
}
```

---

## 22. Error Handling & Standard Error Envelopes

### 22.1 Standard Error Envelope Structure
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INVALID_STATE_TRANSITION",
    "message": "Cannot transition report from SUBMITTED directly to RESOLVED.",
    "details": {
      "current_status": "SUBMITTED",
      "attempted_status": "RESOLVED",
      "allowed_transitions": ["AI_PROCESSING", "CANCELLED"]
    }
  },
  "meta": {
    "request_id": "req_01HPX7K9V2",
    "timestamp": "2026-09-19T09:30:15.123Z"
  }
}
```

---

## 23. Testing Strategy & Test Automation

```
┌─────────────────────────────────────────────────────────────┐
│                    Testing Pyramid                          │
│                                                             │
│                    /   E2E Tests   \   (Playwright)         │
│                   / Integration API \  (pytest + testclient)│
│                  / Unit & AI Mocking \ (pytest, vitest)     │
└─────────────────────────────────────────────────────────────┘
```

- **Unit Tests:** Test pure functions: Severity calculation, state machine transitions, image preprocessors.
- **Integration Tests:** Use an ephemeral PostGIS test database container to test spatial queries (`ST_DWithin`, bounding boxes, user role permissions).
- **Mock AI Classifier:** In automated CI pipelines, `MockWasteClassifier` runs in under 5ms per test without downloading multi-gigabyte neural network weights.

---

## 24. DevOps, Deployment & CI/CD

```mermaid
flowchart LR
    GitHub["GitHub Repository<br>(main branch)"] --> CI["GitHub Actions CI<br>- Linting ruff, eslint<br>- Tests pytest, vitest<br>- Docker build validation"]
    
    CI --> DeployFront["Deploy Frontend<br>to Vercel Edge"]
    CI --> DeployBack["Deploy Backend API<br>to Render or Railway"]
    CI --> DeployDB["Database Migrations<br>via Alembic on startup"]
```

---

## 25. Environment Variables & Configuration Matrix

### Frontend (`apps/web/.env.example`)
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_MAP_STYLE_URL=https://tiles.openfreemap.org/styles/liberty
# Default Geographic Focus (Kolkata Urban)
NEXT_PUBLIC_DEFAULT_MAP_LAT=22.5726
NEXT_PUBLIC_DEFAULT_MAP_LON=88.3639
NEXT_PUBLIC_DEFAULT_MAP_ZOOM=12.5
# Rural Focus (Rajarhat Bishnupur Gram Panchayat)
NEXT_PUBLIC_PANCHAYAT_MAP_LAT=22.6105
NEXT_PUBLIC_PANCHAYAT_MAP_LON=88.5122
NEXT_PUBLIC_PANCHAYAT_MAP_ZOOM=13.5
```

### Backend (`apps/api/.env.example`)
```env
ENVIRONMENT=development
DEBUG=True
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/binit_db
CLERK_ISSUER_URL=https://clerk.your-domain.com
CLERK_AUDIENCE=
STORAGE_PROVIDER=local
STORAGE_LOCAL_DIR=./uploads
AI_CLASSIFIER_PROVIDER=mock
AI_CONFIDENCE_THRESHOLD=0.70
ROUTING_PROVIDER=osrm
ROUTING_BASE_URL=http://router.project-osrm.org
BACKEND_CORS_ORIGINS=["http://localhost:3000"]
# Geospatial Default Anchors
DEFAULT_ZONE_KOLKATA_LAT=22.5726
DEFAULT_ZONE_KOLKATA_LON=88.3639
DEFAULT_ZONE_PANCHAYAT_LAT=22.6105
DEFAULT_ZONE_PANCHAYAT_LON=88.5122
```

---

## 26. Repository & Monorepo Directory Structure

```
binit/
├── apps/
│   ├── web/                        # Next.js 14 Web Application
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── public/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── tailwind.config.ts
│   └── api/                        # FastAPI Backend Application
│       ├── app/
│       │   ├── api/
│       │   ├── core/
│       │   ├── models/
│       │   ├── schemas/
│       │   ├── services/
│       │   ├── repositories/
│       │   ├── ai/
│       │   ├── geo/
│       │   ├── storage/
│       │   └── main.py
│       ├── alembic/                # DB Migrations
│       ├── tests/
│       ├── pyproject.toml
│       └── Dockerfile
├── docs/                           # Living Architecture Documentation
│   ├── PRD.md
│   ├── TRD.md
│   ├── API.md
│   ├── DATABASE.md
│   └── ARCHITECTURE.md
├── docker/
│   └── docker-compose.yml          # PostgreSQL 15 + PostGIS + Local OSRM
├── .gitignore
├── README.md
└── PROMPT.txt
```

---

## 27. Phased Implementation Plan (Phases 0 to 10)

```mermaid
gantt
    title Binit Engineering Roadmap
    dateFormat  YYYY-MM-DD
    section Setup and Foundation
    Phase 0 - Project Monorepo and Infra Setup   :p0, 2026-09-19, 1d
    Phase 1 - Auth and User RBAC Integration    :p1, after p0, 1d
    section Core Reporting Pipeline
    Phase 2 - Waste Reporting and Spatial API   :p2, after p1, 1d
    Phase 3 - Image Storage and EXIF Processing :p3, after p2, 1d
    Phase 4 - AI Classification and Severity    :p4, after p3, 1d
    section Geospatial and Operations
    Phase 5 - MapLibre Visualizer and Hotspots  :p5, after p4, 1d
    Phase 6 - State Machine and Lifecycle Flow  :p6, after p5, 1d
    Phase 7 - Operator Dashboard and Dispatch   :p7, after p6, 1d
    section Optimization and Delivery
    Phase 8 - Analytics and Environmental Intel :p8, after p7, 1d
    Phase 9 - OSRM Route Optimization         :p9, after p8, 1d
    Phase 10 - E2E Verification and Deployment  :p10, after p9, 1d
```

### Phase 0: Project Setup & Monorepo Foundation
- **Objectives:** Initialize monorepo directory layout, Docker Compose with PostGIS, configure Next.js with Tailwind, configure FastAPI with Alembic.
- **Affected Files:** `docker/docker-compose.yml`, `apps/web/*`, `apps/api/*`, `.env.example`.
- **Acceptance Criteria:** `docker-compose up` launches PostgreSQL with PostGIS extension active; FastAPI `/health` returns 200 OK.

### Phase 1: Authentication & User RBAC System
- **Objectives:** Integrate Clerk on frontend; implement JWT verification middleware and role resolution dependency in FastAPI.
- **Affected Files:** `apps/web/app/(auth)/*`, `apps/api/app/core/security.py`, `apps/api/app/core/rbac.py`, `apps/api/app/models/user.py`.
- **Acceptance Criteria:** Authenticated user can call `POST /api/v1/auth/sync` to persist profile; non-admins receive 403 when accessing protected admin endpoints.

### Phase 2: Waste Report Submission & Spatial Persistence
- **Objectives:** Create Report submission UI with HTML5 GPS and MapLibre draggable pin; implement `POST /api/v1/reports` endpoint.
- **Affected Files:** `apps/web/app/(protected)/citizen/report/page.tsx`, `apps/api/app/api/v1/reports.py`, `apps/api/app/models/report.py`.
- **Acceptance Criteria:** Citizen submits report; PostGIS stores exact geography point; database returns report ID in `SUBMITTED` state.

### Phase 3: Image Storage & EXIF Sanitization
- **Objectives:** Implement `StorageProvider` interface (local disk & S3); strip EXIF metadata, compress to WebP, generate 400px thumbnail.
- **Affected Files:** `apps/api/app/storage/*`, `apps/api/app/services/storage_service.py`.
- **Acceptance Criteria:** Uploaded photo stripped of device metadata; both full-res WebP and thumbnail WebP saved and accessible via secure URL.

### Phase 4: AI Classification & Explainable Severity Engine
- **Objectives:** Implement `BaseWasteClassifier` with `MockWasteClassifier` and HuggingFace pipeline; implement rule-based `SeverityService`.
- **Affected Files:** `apps/api/app/ai/*`, `apps/api/app/services/severity_service.py`, `apps/api/app/models/ai_analysis.py`.
- **Acceptance Criteria:** Report transitions from `SUBMITTED` -> `AI_PROCESSING` -> `CLASSIFIED` (or `PENDING_REVIEW` if confidence < 0.70); severity score and explainable reasons stored.

### Phase 5: Location & Map Subsystem
- **Objectives:** Build MapLibre interactive canvas on frontend; implement spatial radius search, bounding box query, and heatmap density aggregation in FastAPI.
- **Affected Files:** `apps/web/components/map/*`, `apps/api/app/api/v1/map.py`, `apps/api/app/services/geo_service.py`.
- **Acceptance Criteria:** Map renders color-coded severity markers; clusters unpack smoothly on zoom; bounding box filter updates points dynamically.

### Phase 6: Report Lifecycle State Machine & Audit History
- **Objectives:** Enforce valid state transition matrix in `report_service.py`; record every transition in `report_status_history`.
- **Affected Files:** `apps/api/app/services/report_service.py`, `apps/api/app/models/report_status_history.py`.
- **Acceptance Criteria:** Illegal state transitions rejected with HTTP 422; audit log table accurately stores actor user ID, timestamp, and notes.

### Phase 7: Operator Dashboard & Dispatch Management
- **Objectives:** Build Operator Queue table with multi-filter controls (category, severity, status); build side-drawer detail view with override and assign actions.
- **Affected Files:** `apps/web/app/(protected)/operator/*`, `apps/api/app/api/v1/reports.py`.
- **Acceptance Criteria:** Operator can filter queue to `HIGH` severity `PLASTIC`, override classification, and assign report to a designated worker.

### Phase 8: Analytics & Environmental Intelligence
- **Objectives:** Build municipal analytics dashboard with Recharts (KPI cards, category donuts, 30-day inflow/resolution trends).
- **Affected Files:** `apps/web/app/(protected)/operator/dashboard/page.tsx`, `apps/api/app/api/v1/dashboard.py`.
- **Acceptance Criteria:** Dashboard reflects live database aggregations; responsive layout renders smoothly across tablet and desktop.

### Phase 9: Routing & Collection Task Optimization (OSRM)
- **Objectives:** Implement `OSRMRoutingProvider`; build frontend route generator allowing operators to pick reports and render an optimized route polyline.
- **Affected Files:** `apps/api/app/geo/osrm.py`, `apps/api/app/api/v1/routes.py`, `apps/web/app/(protected)/operator/routes/page.tsx`.
- **Acceptance Criteria:** Selecting 4 reports returns an optimized TSP polyline; dispatch creates a `collection_task` record.

### Phase 10: End-to-End Verification & Production Deployment
- **Objectives:** Execute automated test suite (pytest + vitest); configure CI/CD deployment pipelines to Vercel and Render/Railway.
- **Affected Files:** `.github/workflows/*`, `apps/api/tests/*`.
- **Acceptance Criteria:** Complete end-to-end user flow passes automated testing; demo scenario validated with seed dataset.

---

## 28. Technical Open Questions & Recommendations

| # | Item | Question / Technical Choice | Recommendation |
|---|---|---|---|
| 1 | **AI Inference Worker Isolation** | Should AI computer vision execute inside the FastAPI web process or in a separate Celery/Redis background worker? | **For Hackathon MVP:** Execute asynchronously via FastAPI background tasks using lightweight CPU models/mocks to keep dev setup simple. **For Production:** Transition to Celery + Redis + GPU worker node. |
| 2 | **Public Map Tile Cost** | OpenFreeMap vs. self-hosted Protomaps tiles? | **For Hackathon MVP:** Use OpenFreeMap vector tile endpoint (no cost, zero API key). Provider interface allows seamless migration. |
| 3 | **Real-Time Map Updates** | WebSockets vs. TanStack Query polling? | **For MVP:** 15-second TanStack Query polling interval is reliable, stateless, and simple. WebSockets/SSE deferred to Phase 2. |

---

## 29. Recommended Next Step

Proceed directly to **Phase 0 & Phase 1 Implementation**:
1. Initialize the monorepo workspace structure (`apps/web`, `apps/api`, `docker`).
2. Launch PostgreSQL 15 + PostGIS via Docker.
3. Scaffold the FastAPI backend with database models, Alembic migrations, and Clerk JWT verification.
4. Scaffold the Next.js 14 frontend with Tailwind CSS and MapLibre GL JS integration.

---
*End of Technical Requirements Document (TRD)*
