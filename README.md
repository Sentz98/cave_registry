# (UN)official Catasto Grotte (Trentino Cave Registry)

A modern, web-based Proof of Concept (PoC) for a cave registry of the Trentino–Alto Adige region, made with ❤️ by cave enthusiasts. **Note: This is NOT the official registry website.** This application provides a public interface for exploring cave data and a private administrative dashboard for data management, serving as a tribute to the region's speleological heritage.

## 🚀 Overview

The project is designed to handle spatial data of caves, including their locations, physical characteristics, and associated media (photos and surveys). It features a robust ingestion pipeline to import data from authoritative CSV sources.

### Key Features

*   **Public Area:**
    *   **Interactive Map:** Full-screen map with marker clustering and satellite layer toggle (ESRI).
    *   **Cave List:** Sortable and searchable table of all published caves.
    *   **Cave Detail:** Comprehensive view of a single cave, including its technical data and media gallery.
*   **Private Area (Admin):**
    *   **Secure Dashboard:** Access restricted to authenticated users.
    *   **Data Management:** Full CRUD operations for caves and their metadata.
    *   **Media Management:** Upload and manage photos and survey PDFs per cave.
*   **Data Ingestion:** Idempotent command-line tool to import/update cave data from CSV files.

## 🛠 Tech Stack

*   **Backend:** [Django](https://www.djangoproject.com/) 5.x with [Django REST Framework](https://www.django-rest-framework.org/) and [PostGIS](https://postgis.net/).
*   **Dependency Management:** [uv](https://github.com/astral-sh/uv) for fast, reproducible Python environments.
*   **Frontend:** [React](https://react.dev/) 18+, [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/).
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) v3.
*   **Maps:** [Leaflet](https://leafletjs.com/) with OpenStreetMap and ESRI tiles.
*   **Containerization:** [Docker Compose](https://docs.docker.com/compose/) for orchestration.

## 📁 Project Structure

```
.
├── backend/            # Django application (API, Models, Management Commands)
├── frontend/           # React application (Vite, Tailwind, Leaflet)
├── data/               # Source CSV files (Authoritative data)
├── specs/              # Design and requirement documents
├── docker-compose.yml  # Local development orchestration
└── Makefile            # Shortcut commands for common tasks
```

## 🏁 Getting Started

### Prerequisites

*   Docker and Docker Compose
*   `make` (optional, but recommended)

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd cave_registry
    ```

2.  **Configure the environment:**
    ```bash
    cp .env.example .env
    ```
    Edit `.env` if you need to change any defaults (DB credentials, secret key, etc.).

3.  **Start the services:**
    ```bash
    docker compose up -d
    ```
    This starts the database, backend, and frontend. Database migrations are applied automatically on startup — no manual step required.

4.  **Create an administrative account:**
    ```bash
    make createsuperuser
    ```

5.  **Import initial data:**
    Seed the database with cave data from the `data/` directory:
    ```bash
    make import_caves
    ```

The application will be available at:
*   **Frontend:** [http://localhost:5173](http://localhost:5173)
*   **Backend API:** [http://localhost:8000/api/v1/](http://localhost:8000/api/v1/)
*   **Django Admin:** [http://localhost:8000/admin/](http://localhost:8000/admin/)

## ⚙️ Development

### Makefile Commands

| Command | Description |
| :--- | :--- |
| `make dev` | Start all services in the foreground. |
| `make migrate` | Run Django database migrations. |
| `make createsuperuser` | Create a new Django admin user. |
| `make import` | Import cave data from `data/*.csv`. |
| `make shell` | Open a Django shell. |
| `make test` | Run backend tests. |
| `make lint` | Run Ruff (backend) and ESLint (frontend) checks. |

### Data Ingestion Pipeline

The `import_caves` management command handles data synchronization:
*   It reads all `*.csv` files in the `data/` folder.
*   It uses `catasto` (Numero di catasto) as a unique identifier.
*   It is **idempotent**: running it multiple times updates existing records without overwriting manual enrichment (like descriptions or geology) made via the dashboard.
*   Caves missing coordinates are skipped with a warning.

#### CSV Data Schema

To import data, place CSV files in the `data/` directory. The files should have a header row (optionally prefixed with `#`). The following columns are recognized:

| Column Header | Description | Required |
| :--- | :--- | :--- |
| `catasto` | Unique registry ID (Numero di catasto). | **Yes** |
| `Latitudine` | Latitude in decimal degrees (WGS 84). | **Yes** |
| `Longitudine` | Longitude in decimal degrees (WGS 84). | **Yes** |
| `Nome` | The name of the cave. | No |
| `Numero di placchetta` | Identification plaque number. | No |
| `Quota ingresso` | Entrance elevation in meters (integer). | No |
| `Estensione spaziale` | Total length/spatial extension in meters. | No |
| `Estensione verticale positiva` | Positive vertical extension (climb) in meters. | No |
| `Estensione verticale negativa` | Negative vertical extension (depth) in meters. | No |

Example CSV (`data/caves_sample.csv`):
```csv
#catasto,Nome,Latitudine,Longitudine,Quota ingresso,Estensione spaziale
100/TN,Grotta del Calgero,46.0123,11.1234,650,450
```

## 🗺️ Roadmap / Future Work

We are continuously looking to improve the registry. The following features are planned for future development:

### Map & Visualization
- [x] **Geology Layers:** Integration of official WMS geological maps (e.g., PAT) for terrain analysis.
- [x] **Interactive Map Filters:** Dynamic UI to filter caves on the map by depth, length, or elevation.
- [ ] **3D View:** Implementation of true 3D terrain and camera tilt (MapLibre GL or CesiumJS).
- [ ] **3D Survey Viewer:** Interactive web viewer for digital cave surveys (Therion/Compass files).

### Tools & Integration
- [ ] **GPX/KML Export:** One-click export for navigation and handheld GPS units.
- [ ] **Spatial Tools:** "Nearby Caves" discovery and distance calculation.
- [ ] **Weather & Hazards:** Real-time local precipitation and flood risk alerts.

### Community & Content
- [ ] **Crowdsourcing:** "Report a Change" system for public updates (pending moderation).
- [ ] **Expedition Logs:** Lightweight field notes for cave status (e.g., anchor conditions).
- [ ] **Bibliography:** Tracking of scientific publications and historical survey reports.

### Safety & Access
- [ ] **Access Status:** Clear indicators for seasonal closures (e.g., bat hibernation) and park restrictions.
- [ ] **Automated Fact Sheets:** PDF "Cave Card" generation with QR codes for field use.

## 📝 License

This project is a Proof of Concept. License details pending.
