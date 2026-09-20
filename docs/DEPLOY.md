# 🚀 BinIt Deployment Guide: FastAPI Cloud & Vercel

This guide provides step-by-step instructions for deploying the complete **BinIt** civic waste intelligence platform:
- **Backend API**: Deployed on **[FastAPI Cloud](https://fastapi.tiangolo.com/)** using native FastAPI CLI packaging.
- **Frontend Web**: Deployed on **[Vercel](https://vercel.com/)** for Next.js 14 App Router with Global Edge CDN.

---

## 📋 Recommended Deployment Architecture

| Tier | Provider | Purpose | Key Features |
|---|---|---|---|
| **Backend API** | [FastAPI Cloud](https://fastapi.tiangolo.com/) | FastAPI, Async SQLAlchemy, SQLite, OSRM Routing, Computer Vision | Native FastAPI CLI integration (`pyproject.toml`), automatic SSL/HTTPS, instant Swagger docs |
| **Frontend Web** | [Vercel](https://vercel.com/) | Next.js 14 App Router, MapLibre GL, Tailwind CSS, Lucide Icons | Zero-config Next.js deployment, Edge network, automatic preview environments |

---

## ⚙️ Part 1: Deploy Backend (FastAPI Cloud)

BinIt's backend (`apps/api`) is packaged with modern Python standard packaging (`pyproject.toml` with Hatchling and `[tool.fastapi]` configuration), allowing one-command deployment to FastAPI Cloud.

### 1. Prerequisites & CLI Installation

Ensure you have Python 3.10+ installed and install the standard FastAPI CLI:

```bash
# Install FastAPI with standard CLI utilities
pip install "fastapi[standard]"
```

Verify the CLI is ready:
```bash
fastapi --help
```

---

### 2. Login to FastAPI Cloud

Authenticate your terminal session with FastAPI Cloud:

```bash
fastapi cloud login
```
*(Follow the interactive browser prompt to authorize your account).*

---

### 3. Deploy the Backend

Navigate to the API project directory and trigger deployment:

```bash
# Navigate to the backend directory
cd apps/api

# Deploy to FastAPI Cloud
fastapi deploy
```

> **Note**: You can also run `fastapi cloud deploy` from the root directory:
> ```bash
> fastapi cloud deploy apps/api
> ```
> FastAPI Cloud automatically detects the configuration in `pyproject.toml`:
> ```toml
> [tool.fastapi]
> app = "app.main:app"
> ```

---

### 4. Configure Backend Environment Variables

In your FastAPI Cloud Project Settings (or via CLI secrets), configure the following production environment variables:

| Environment Variable | Recommended Value | Description |
|---|---|---|
| `ENVIRONMENT` | `production` | Sets production mode |
| `DEBUG` | `false` | Disables debug stack traces in responses |
| `SECRET_KEY` | `generate-a-secure-32-character-random-key` | Secret key for JWT signing |
| `DATABASE_URL` | `sqlite+aiosqlite:///./.data/binit.db` | Local async SQLite database (or Postgres URI) |
| `STORAGE_PROVIDER` | `local` | Uploaded images storage (`local` or `s3`) |
| `STORAGE_LOCAL_DIR` | `./.data/uploads` | Directory for report photos & thumbnails |
| `AI_CLASSIFIER_PROVIDER` | `mock` | Instant mock AI classification for demos |
| `AI_CONFIDENCE_THRESHOLD` | `0.70` | Threshold below which human triage is flagged |
| `ROUTING_PROVIDER` | `osrm` | Geospatial routing engine |
| `ROUTING_BASE_URL` | `https://router.project-osrm.org` | Public OSRM routing endpoint |
| `SEED_ON_START` | `true` | **Essential for Demos**: Pre-seeds 4 demo roles & realistic Kolkata/Rajarhat reports |
| `BACKEND_CORS_ORIGINS` | `["*"]` | Allows your Vercel frontend domain to make API requests |

Once deployed, copy your FastAPI Cloud live URL (e.g., `https://binit-api.fastapi.cloud`).

---

## 🌐 Part 2: Deploy Frontend (Next.js on Vercel)

### 1. Import Repository into Vercel
1. Go to your [Vercel Dashboard](https://vercel.com) and click **Add New...** → **Project**.
2. Connect your GitHub repository (`BinIt-spot-it-snap-it-solve-it`).

### 2. Configure Project Build Settings
- **Framework Preset**: `Next.js`
- **Root Directory**: Click *Edit* and select **`apps/web`**
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)

### 3. Configure Frontend Environment Variables
In the Vercel **Environment Variables** section, add the following:

| Key | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://<YOUR-FASTAPI-CLOUD-URL>/api/v1` | **Point to your FastAPI Cloud backend URL + `/api/v1`** |
| `NEXT_PUBLIC_MAP_STYLE_URL` | `https://tiles.openfreemap.org/styles/liberty` | Free OpenFreeMap vector tile style (no API key required) |
| `NEXT_PUBLIC_DEFAULT_MAP_LAT` | `22.5726` | Kolkata Urban Center Latitude |
| `NEXT_PUBLIC_DEFAULT_MAP_LON` | `88.3639` | Kolkata Urban Center Longitude |
| `NEXT_PUBLIC_DEFAULT_MAP_ZOOM` | `12.5` | Default Urban zoom |
| `NEXT_PUBLIC_PANCHAYAT_MAP_LAT` | `22.6105` | Rajarhat Gram Panchayat Latitude |
| `NEXT_PUBLIC_PANCHAYAT_MAP_LON` | `88.5122` | Rajarhat Gram Panchayat Longitude |
| `NEXT_PUBLIC_PANCHAYAT_MAP_ZOOM` | `13.5` | Panchayat zoom level |

### 4. Deploy
Click **Deploy**. Vercel will build the frontend and provide your production URL (e.g. `https://binit-civic.vercel.app`).

---

## 🧪 Part 3: Verification & Demo Checklist

After completing both deployments:

1. **Verify Backend Health & OpenAPI Docs**:
   - Open `https://<your-backend-url>/health` → should return `{"status": "ok"}`
   - Open `https://<your-backend-url>/docs` → interactive Swagger API docs should render smoothly.
2. **Verify Frontend UI & Map**:
   - Open `https://<your-frontend-url>/` → verify landing page, product showcase, and Civic Copilot assistant.
   - Click **Explore Live Demo** or **Sign In** → select any demo persona (Citizen, Operator, Worker, Admin).
3. **Verify Reporting & Map Layers**:
   - As **Citizen (`citizen@binit.civic`)**: Submit a photo report; verify instant AI classification and status update.
   - As **Operator (`operator@binit.civic`)**: Open live triage and map bounds; inspect severity hotspots and cluster pins.
   - As **Worker (`worker@binit.civic`)**: View assigned collection routes and OSRM turn-by-turn navigation.
   - As **Admin (`admin@binit.civic`)**: Inspect MTTR, ward benchmarks, and SLA compliance metrics.

---

## 💡 Hackathon Demo Tips

- **One-Click Personas**: With `SEED_ON_START=true`, sample accounts and realistic geo-tagged reports for Kolkata Urban and Rajarhat Gram Panchayat are pre-loaded on boot.
- **Mobile Responsive**: The web application features a responsive mobile app shell with quick sign-out, bottom-sheet profile switchers, and touch-optimized map controls.
- **Instant AI Classification**: The mock AI classifier returns realistic labels with confidence metrics instantly without requiring external paid API keys during demonstrations.
