# ELD Route Planner

A full-stack FMCSA-compliant ELD (Electronic Logging Device) route planning application built as a Full Stack Developer assessment.

## Features

- **HOS-Compliant Scheduling**: Enforces all FMCSA Hours of Service rules for property carrying drivers
  - 11-hour driving limit per day
  - 14-hour duty window
  - 30-minute break after 8 cumulative driving hours
  - 10-hour consecutive off-duty rest requirement
  - 70-hour / 8-day cycle tracking
  - Automatic 34-hour cycle restart when limit is exhausted
- **Smart Route Planning**: OpenRouteService integration with automatic mock fallback (works without API key)
- **Fuel Stop Automation**: Fuel stops inserted every 1,000 miles
- **FMCSA ELD Daily Logs**: Authentic grid-based SVG log sheets per FMCSA format
- **Multi-Day Support**: Generates complete schedule across multiple days
- **Export**: Download daily logs as PNG or PDF
- **Interactive Route Map**: Dark-themed Leaflet map with route polyline and markers

## Tech Stack

**Backend**: Python · Django · Django REST Framework · django-cors-headers  
**Frontend**: React · Vite · TailwindCSS · React Leaflet · Axios · React Icons

## Installation

### Prerequisites
- Python 3.9+
- Node.js 18+

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your ORS_API_KEY (optional — works without it)

# Run migrations
python manage.py migrate

# Start server
python manage.py runserver
```

Backend runs at: http://localhost:8000

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment (optional)
cp .env.example .env

# Start dev server
npm run dev
```

Frontend runs at: http://localhost:5173

## Environment Variables

### Backend (`backend/.env`)

```
ORS_API_KEY=your_openrouteservice_api_key_here
DEBUG=True
SECRET_KEY=your-secret-key-change-in-production
```

Get a free ORS API key at: https://openrouteservice.org/dev/#/signup

**Note**: The application runs perfectly without an API key using a mock route calculator based on haversine distance.

### Frontend (`frontend/.env`)

```
VITE_API_BASE_URL=http://localhost:8000
```

## API Reference

### POST /api/trip/plan/

**Request:**
```json
{
  "current_location": "Chicago, IL",
  "pickup_location": "St Louis, MO",
  "dropoff_location": "Dallas, TX",
  "current_cycle_used": 20
}
```

**Response:**
```json
{
  "route": {
    "origin": { "coords": [lat, lon], "label": "Chicago, IL" },
    "pickup": { "coords": [lat, lon], "label": "St Louis, MO" },
    "dropoff": { "coords": [lat, lon], "label": "Dallas, TX" },
    "polyline": [[lat, lon], ...],
    "distance_miles": 972.1,
    "duration_hours": 17.67
  },
  "summary": {
    "total_distance_miles": 972.1,
    "total_driving_hours": 17.67,
    "total_days": 2,
    "fuel_stop_count": 0,
    "rest_stop_count": 1,
    "total_log_sheets": 2,
    "remaining_cycle_hours": 50.0
  },
  "stops": {
    "fuel_stops": [],
    "rest_stops": [...]
  },
  "schedule": [...],
  "daily_logs": [...]
}
```

## HOS Rules Implementation

| Rule | Value |
|------|-------|
| Max driving per day | 11 hours |
| Max duty window | 14 hours |
| Break required after | 8 hours cumulative driving |
| Break duration | 30 minutes |
| Off-duty rest required | 10 consecutive hours |
| Cycle limit | 70 hours / 8 days |
| Cycle restart | 34 hours off duty |
| Fuel stop interval | Every 1,000 miles |
| Pickup service time | 1 hour (On Duty Not Driving) |
| Dropoff service time | 1 hour (On Duty Not Driving) |

## GitHub Push Instructions

```bash
git init
git add .
git commit -m "feat: initial ELD Route Planner MVP"
git branch -M main
git remote add origin https://github.com/yourusername/eld-route-planner.git
git push -u origin main
```

## Deployment

### Backend (Railway / Render / Heroku)

1. Set `DEBUG=False` in production
2. Set a strong `SECRET_KEY`
3. Add `ALLOWED_HOSTS` with your domain
4. Use PostgreSQL instead of SQLite
5. Set `ORS_API_KEY` in environment variables

### Frontend (Vercel / Netlify)

1. Set `VITE_API_BASE_URL` to your backend URL
2. Run `npm run build` — deploy the `dist/` folder

## Project Structure

```
eld-route-planner/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── eld_backend/          # Django project settings
│   │   ├── settings.py
│   │   └── urls.py
│   ├── trip_planner/         # Route + trip planning API
│   │   ├── views.py          # POST /api/trip/plan/
│   │   └── route_service.py  # ORS API + mock fallback
│   ├── hos/
│   │   └── engine.py         # Full HOS rules engine
│   └── logs/
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── pages/
│       │   ├── HomePage.jsx      # Hero + planner form
│       │   └── ResultsPage.jsx   # Tabbed results
│       ├── components/
│       │   ├── SummaryCards.jsx  # Trip summary stats
│       │   ├── RouteMap.jsx      # Leaflet map
│       │   ├── TripTimeline.jsx  # Day-by-day event log
│       │   ├── StopsPanel.jsx    # Fuel + rest stops
│       │   └── DailyLogSheet.jsx # FMCSA SVG ELD logs
│       └── services/
│           └── api.js
└── README.md
```

## Assessment Notes

- Built as a property carrying driver application (70 Hr / 8-Day Rule)
- No adverse driving conditions assumed
- Truck average speed: 55 mph for time calculations
- HOS engine handles edge cases: break insertion mid-segment, window expiry mid-drive, cycle exhaustion with restart
- Mock route uses haversine distance with 1.2× road factor

## License

MIT
