# Binit — System Architecture Document

> **Status:** Architecture Reference  
> **Target Scope:** Dual-Zone MVP (Kolkata Urban & Gram Panchayat)

---

## 1. Architectural Overview

Binit operates as a **modular monolithic architecture** engineered for high developer velocity, testability, and seamless scalability from hackathon MVP to municipal deployment.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Binit Logical Architecture                      │
├────────────────────────────────────────────────────────────────────────┤
│ Client Apps (Next.js 14 App Router, TypeScript, Tailwind CSS, MapLibre)│
├────────────────────────────────────────────────────────────────────────┤
│ API Gateway / Auth Layer (Clerk JWT Validation, RBAC Guard, SlowAPI)  │
├────────────────────────────────────────────────────────────────────────┤
│ Service Layer (Reports, AI Vision, Severity, Geospatial, OSRM Routing) │
├────────────────────────────────────────────────────────────────────────┤
│ Provider Adapters (WasteClassifier, RoutingProvider, StorageProvider)  │
├────────────────────────────────────────────────────────────────────────┤
│ Data Layer (PostgreSQL 15+ with PostGIS Extension, S3 Object Storage)  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Subsystems & Boundaries

### 2.1 Geospatial Subsystem (Dual-Zone Focus)
The geospatial engine provides dedicated support for two distinct geographic administrative contexts:
- **Kolkata Urban Zone (`KOLKATA_URBAN`):** Covers Kolkata Municipal Corporation (KMC) wards (Park Street, Salt Lake, New Town, Gariahat, Shyambazar). Focuses on high-density commercial/packaging waste, blocked drains, and multi-lane road networks. Default center: `[88.3639, 22.5726]`.
- **Gram Panchayat Zone (`GRAM_PANCHAYAT`):** Covers peri-urban and rural panchayat areas (e.g., Rajarhat Bishnupur Gram Panchayat). Focuses on agricultural runoff, pond (*pukur*) & canal (*khal*) waste, and local e-rickshaw (*Toto*) dispatch. Default center: `[88.5122, 22.6105]`.

### 2.2 AI Computer Vision Subsystem
- Abstract `BaseWasteClassifier` enables seamless swapping between:
  - `MockWasteClassifier`: Fast, deterministic keyword/hash-based mock for testing and local development.
  - `HuggingFaceWasteClassifier`: Production Vision Transformer (`ViT`) pipeline.
- Outputs standardized categories, continuous confidence score ($0.0 - 1.0$), and sets `NEEDS_REVIEW` flag when confidence $< 0.70$.

### 2.3 Storage Subsystem
- S3-compatible `StorageProvider` interface (AWS S3, Cloudflare R2, Supabase Storage, or Local Disk).
- Server-side EXIF metadata stripping for citizen privacy.
- Automatic conversion to WebP format and proportional 400px thumbnail generation.

---

## 3. Technology Decision Matrix

| Layer | Chosen Technology | Rationale |
|---|---|---|
| **Frontend** | Next.js 14 (App Router) | High performance SSR, native TypeScript, layout nesting. |
| **Map Rendering** | MapLibre GL JS + OpenFreeMap | Free vector tiles, zero vendor lock-in, high-performance WebGL. |
| **Backend API** | FastAPI (Python 3.11+) | Asynchronous ASGI throughput, Pydantic v2 validation, native Python ML library integration. |
| **Database** | PostgreSQL 15 + PostGIS | Spherical spatial geography indexing (`GiST`), robust ACID transactions. |
| **Authentication**| Clerk Identity | Managed authentication, session tokens, multi-platform UI components. |
| **Routing** | OSRM (Open Source Routing Machine) | Open-source Traveling Salesperson (TSP) route calculation based on OSM networks. |

---
*End of Architecture Document*
