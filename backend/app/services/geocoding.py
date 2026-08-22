import requests
import time
import logging
import re

logger = logging.getLogger(__name__)

def extract_pincode(text: str):
    match = re.search(r'\b\d{6}\b', text)
    return match.group(0) if match else None

def geocode(address: str):
    if not address or address.strip() in ["", ", India", "India"]:
        return None

    # Clean address
    address = re.sub(r'\s+', ' ', address).strip()
    address = re.sub(r',\s*,', ',', address)
    address = address.strip(', ')

    logger.info(f"🔍 Geocoding: {address}")

    queries = [address]
    pincode = extract_pincode(address)
    if pincode:
        queries.append(f"{pincode}, India")
        parts = [p.strip() for p in address.split(',')]
        if len(parts) >= 2:
            state_candidate = parts[-2] if len(parts) >= 2 else None
            if state_candidate and not re.match(r'\d+', state_candidate):
                queries.append(f"{state_candidate}, {pincode}, India")
        if len(parts) >= 1:
            last = parts[-1]
            if last and not re.match(r'\d+', last) and last.lower() not in ['india']:
                queries.append(f"{last}, {pincode}, India")

    # Remove duplicates
    seen = set()
    unique_queries = []
    for q in queries:
        if q not in seen:
            seen.add(q)
            unique_queries.append(q)

    for query in unique_queries:
        result = _geocode_single(query)
        if result:
            return result

    logger.warning(f"❌ All geocoding attempts failed for: {address}")
    return None

def _geocode_single(query: str):
    url = "https://nominatim.openstreetmap.org/search"
    params = {"q": query, "format": "json", "limit": 1}
    headers = {"User-Agent": "KisanMitra/1.0 (student project; contact: swapniljadhav0041@gmail.com)"}
    try:
        time.sleep(0.5)
        response = requests.get(url, params=params, headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data:
                lat = float(data[0]["lat"])
                lon = float(data[0]["lon"])
                logger.info(f"✅ Found: {lat}, {lon} for query: {query}")
                return lat, lon
        else:
            logger.error(f"HTTP {response.status_code} for: {query}")
    except Exception as e:
        logger.error(f"Geocoding error: {e}")
    return None