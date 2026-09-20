import json
from datetime import datetime, timedelta, timezone
from math import atan2, cos, radians, sin, sqrt
from typing import Any
from uuid import UUID

import httpx

from app.core.config import get_settings
from app.core.geo import haversine_m


def nearest_neighbor_order(coords: list[tuple[float, float]]) -> list[int]:
    if not coords:
        return []
    remaining = list(range(1, len(coords)))
    order = [0]
    current = 0
    while remaining:
        nxt = min(remaining, key=lambda i: haversine_m(coords[current][1], coords[current][0], coords[i][1], coords[i][0]))
        remaining.remove(nxt)
        order.append(nxt)
        current = nxt
    return order


def geodesic_line(coords: list[tuple[float, float]]) -> dict[str, Any]:
    return {"type": "LineString", "coordinates": [[lon, lat] for lon, lat in coords]}


async def optimize_trip(coordinates: list[tuple[float, float]]) -> dict[str, Any]:
    settings = get_settings()
    if len(coordinates) == 1:
        return {
            "distance_km": 0.0,
            "duration_min": 0.0,
            "geometry": geodesic_line(coordinates),
            "waypoint_order": [0],
        }
    coord_str = ";".join(f"{lon:.6f},{lat:.6f}" for lon, lat in coordinates)
    url = (
        f"{settings.routing_base_url.rstrip('/')}/trip/v1/driving/{coord_str}"
        "?overview=full&geometries=geojson&roundtrip=false&source=first"
    )
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()
        trip = data["trips"][0]
        return {
            "distance_km": round(trip["distance"] / 1000.0, 2),
            "duration_min": round(trip["duration"] / 60.0, 1),
            "geometry": trip["geometry"],
            "waypoint_order": [wp.get("waypoint_index", i) for i, wp in enumerate(data.get("waypoints", []))],
        }
    except Exception:
        order = nearest_neighbor_order(coordinates)
        ordered = [coordinates[i] for i in order]
        dist = 0.0
        for i in range(1, len(ordered)):
            dist += haversine_m(ordered[i - 1][1], ordered[i - 1][0], ordered[i][1], ordered[i][0])
        return {
            "distance_km": round(dist / 1000.0, 2),
            "duration_min": round((dist / 1000.0) / 0.25, 1),
            "geometry": geodesic_line(ordered),
            "waypoint_order": order,
            "fallback": True,
        }
