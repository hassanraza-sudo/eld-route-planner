"""
Route calculation using OpenRouteService API with mock fallback.
"""
import os
import math
import requests
from django.conf import settings

ORS_GEOCODE_URL = "https://api.openrouteservice.org/geocode/search"
ORS_DIRECTIONS_URL = "https://api.openrouteservice.org/v2/directions/driving-hgv"

# Approximate mph for truck driving
TRUCK_SPEED_MPH = 55.0
METERS_TO_MILES = 0.000621371
SECONDS_TO_HOURS = 1 / 3600


def geocode_location(location_name, api_key):
    """Convert location name to [lon, lat] coordinates."""
    params = {
        "api_key": api_key,
        "text": location_name,
        "size": 1,
    }
    resp = requests.get(ORS_GEOCODE_URL, params=params, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    features = data.get("features", [])
    if not features:
        raise ValueError(f"Could not geocode location: {location_name}")
    coords = features[0]["geometry"]["coordinates"]  # [lon, lat]
    label = features[0]["properties"].get("label", location_name)
    return {"coords": coords, "label": label}


def get_route_ors(waypoints, api_key):
    """
    Get route from ORS for a list of [lon, lat] waypoints.
    Returns summary dict and list of [lat, lon] coordinates.
    """
    headers = {
        "Authorization": api_key,
        "Content-Type": "application/json",
    }
    body = {
        "coordinates": waypoints,
        "instructions": False,
        "units": "mi",
    }
    resp = requests.post(ORS_DIRECTIONS_URL, json=body, headers=headers, timeout=15)
    resp.raise_for_status()
    data = resp.json()

    route = data["routes"][0]
    summary = route["summary"]
    distance_miles = summary["distance"]
    duration_hours = summary["duration"] * SECONDS_TO_HOURS

    # Decode geometry
    geometry = route.get("geometry", "")
    coords = decode_polyline(geometry) if isinstance(geometry, str) else []

    return {
        "distance_miles": round(distance_miles, 1),
        "duration_hours": round(duration_hours, 2),
        "polyline": coords,
    }


def decode_polyline(encoded):
    """Decode Google-style encoded polyline to list of [lat, lon]."""
    coords = []
    index = 0
    lat = 0
    lng = 0
    while index < len(encoded):
        b, shift, result = 0, 0, 0
        while True:
            b = ord(encoded[index]) - 63
            index += 1
            result |= (b & 0x1F) << shift
            shift += 5
            if b < 0x20:
                break
        dlat = ~(result >> 1) if result & 1 else result >> 1
        lat += dlat

        b, shift, result = 0, 0, 0
        while True:
            b = ord(encoded[index]) - 63
            index += 1
            result |= (b & 0x1F) << shift
            shift += 5
            if b < 0x20:
                break
        dlng = ~(result >> 1) if result & 1 else result >> 1
        lng += dlng

        coords.append([lat / 1e5, lng / 1e5])
    return coords


# ─── Haversine distance fallback ─────────────────────────────────────────────

def haversine_miles(lat1, lon1, lat2, lon2):
    R = 3958.8  # Earth radius in miles
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def interpolate_coords(start, end, n=20):
    """Generate intermediate [lat, lon] points between two coords."""
    lat1, lon1 = start
    lat2, lon2 = end
    return [[lat1 + (lat2 - lat1) * i / n, lon1 + (lon2 - lon1) * i / n] for i in range(n + 1)]


# ─── Mock / fallback city coordinates ────────────────────────────────────────

MOCK_CITIES = {
    "chicago": (41.8781, -87.6298),
    "st louis": (38.6270, -90.1994),
    "dallas": (32.7767, -96.7970),
    "new york": (40.7128, -74.0060),
    "los angeles": (34.0522, -118.2437),
    "houston": (29.7604, -95.3698),
    "phoenix": (33.4484, -112.0740),
    "philadelphia": (39.9526, -75.1652),
    "san antonio": (29.4241, -98.4936),
    "san diego": (32.7157, -117.1611),
    "miami": (25.7617, -80.1918),
    "atlanta": (33.7490, -84.3880),
    "denver": (39.7392, -104.9903),
    "seattle": (47.6062, -122.3321),
    "boston": (42.3601, -71.0589),
    "detroit": (42.3314, -83.0458),
    "nashville": (36.1627, -86.7816),
    "memphis": (35.1495, -90.0490),
    "oklahoma city": (35.4676, -97.5164),
    "kansas city": (39.0997, -94.5786),
}


def fuzzy_geocode_mock(name):
    lower = name.lower().strip()
    # Try direct match
    for city, coords in MOCK_CITIES.items():
        if city in lower or lower in city:
            return list(reversed(coords)), name  # [lon, lat]
    # Default fallback: Chicago
    return [-87.6298, 41.8781], name


def get_mock_route(origin_coords, via_coords, dest_coords, origin_name, via_name, dest_name):
    """Generate a mock route when API key is missing."""
    # lat/lon order in our storage
    o = [origin_coords[1], origin_coords[0]]   # [lat, lon]
    v = [via_coords[1], via_coords[0]]
    d = [dest_coords[1], dest_coords[0]]

    d1 = haversine_miles(o[0], o[1], v[0], v[1])
    d2 = haversine_miles(v[0], v[1], d[0], d[1])
    total_miles = d1 + d2

    # Add ~20% for road factor
    total_miles *= 1.2
    d1 *= 1.2
    d2 *= 1.2
    duration_hours = total_miles / TRUCK_SPEED_MPH

    polyline = (
        interpolate_coords((o[0], o[1]), (v[0], v[1]), 15)
        + interpolate_coords((v[0], v[1]), (d[0], d[1]), 15)
    )

    return {
        "distance_miles": round(total_miles, 1),
        "distance_to_pickup_miles": round(d1, 1),
        "distance_to_dropoff_miles": round(d2, 1),
        "duration_hours": round(duration_hours, 2),
        "polyline": polyline,
        "origin": {"coords": o, "label": origin_name},
        "pickup": {"coords": v, "label": via_name},
        "dropoff": {"coords": d, "label": dest_name},
        "using_mock": True,
    }


def get_full_route(current_location, pickup_location, dropoff_location):
    """Main entry point. Returns route dict."""
    api_key = settings.ORS_API_KEY

    if not api_key:
        # Use mock route
        o_coords, o_label = fuzzy_geocode_mock(current_location)
        p_coords, p_label = fuzzy_geocode_mock(pickup_location)
        d_coords, d_label = fuzzy_geocode_mock(dropoff_location)

        return get_mock_route(o_coords, p_coords, d_coords, o_label, p_label, d_label)

    try:
        o = geocode_location(current_location, api_key)
        p = geocode_location(pickup_location, api_key)
        d = geocode_location(dropoff_location, api_key)

        waypoints = [o["coords"], p["coords"], d["coords"]]
        route_data = get_route_ors(waypoints, api_key)

        # Estimate leg distances
        d1 = haversine_miles(o["coords"][1], o["coords"][0], p["coords"][1], p["coords"][0]) * 1.2
        d2 = haversine_miles(p["coords"][1], p["coords"][0], d["coords"][1], d["coords"][0]) * 1.2

        return {
            "distance_miles": route_data["distance_miles"],
            "distance_to_pickup_miles": round(d1, 1),
            "distance_to_dropoff_miles": round(d2, 1),
            "duration_hours": route_data["duration_hours"],
            "polyline": route_data["polyline"],
            "origin": {"coords": [o["coords"][1], o["coords"][0]], "label": o["label"]},
            "pickup": {"coords": [p["coords"][1], p["coords"][0]], "label": p["label"]},
            "dropoff": {"coords": [d["coords"][1], d["coords"][0]], "label": d["label"]},
            "using_mock": False,
        }
    except Exception as e:
        # Fallback to mock on any API error
        o_coords, o_label = fuzzy_geocode_mock(current_location)
        p_coords, p_label = fuzzy_geocode_mock(pickup_location)
        d_coords, d_label = fuzzy_geocode_mock(dropoff_location)
        result = get_mock_route(o_coords, p_coords, d_coords, o_label, p_label, d_label)
        result["api_error"] = str(e)
        return result
