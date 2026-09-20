from math import asin, cos, radians, sin, sqrt

from app.models.enums import ZoneCode


def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371000.0
    p1, p2 = radians(lat1), radians(lat2)
    dphi = radians(lat2 - lat1)
    dlmb = radians(lon2 - lon1)
    a = sin(dphi / 2) ** 2 + cos(p1) * cos(p2) * sin(dlmb / 2) ** 2
    return 2 * r * asin(sqrt(a))


def fuzz_coordinate(value: float) -> float:
    """~100m neighborhood rounding (3 decimal places)."""
    return round(value, 3)


def infer_zone(lat: float, lon: float) -> ZoneCode:
    urban = haversine_m(lat, lon, 22.5726, 88.3639)
    gp = haversine_m(lat, lon, 22.6105, 88.5122)
    return ZoneCode.KOLKATA_URBAN if urban <= gp else ZoneCode.GRAM_PANCHAYAT


def near_water_body(lat: float, lon: float, zone: ZoneCode) -> bool:
    if zone == ZoneCode.GRAM_PANCHAYAT:
        return haversine_m(lat, lon, 22.6105, 88.5122) < 1800
    return lat < 22.56 and lon < 88.35


def near_main_road(lat: float, lon: float, zone: ZoneCode) -> bool:
    if zone == ZoneCode.KOLKATA_URBAN:
        return abs(lat - 22.5512) < 0.02 or abs(lat - 22.5726) < 0.015
    return abs(lat - 22.6105) < 0.01
