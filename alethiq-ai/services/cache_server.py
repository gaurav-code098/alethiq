import redis
import json
import os
import time
from dotenv import load_dotenv

load_dotenv(override=True)

# 🟢 Connect to Upstash using the URL from .env
REDIS_URL = os.getenv("REDIS_URL")

try:
    if REDIS_URL:
        # Use from_url for Upstash
        r = redis.from_url(REDIS_URL, decode_responses=True)
        print("🌐 Connecting to Upstash Redis...")
    else:
        # Fallback to local if no URL found (will cause the 10061 error if local is down)
        r = redis.Redis(host='localhost', port=6379, decode_responses=True)
        print("🏠 Connecting to Local Redis...")
except Exception as e:
    print(f"❌ Redis Init Error: {e}")
    r = None

# Configuration for SWR
STALE_AFTER = 60 # 1 MIin (Data considered stale after this)
MAX_TTL = 86400     # 24 hours (Hard delete)

def get_cached_response(query, mode):
    if not r: return None, "MISS"
    key = f"cache:{mode}:{query.lower().strip()}"
    try:
        data = r.get(key)
        if not data: return None, "MISS"

        cached_obj = json.loads(data)
        # Extract payload and timestamp
        payload = cached_obj.get('payload')
        timestamp = cached_obj.get('timestamp', 0)
        
        age = time.time() - timestamp

        if age > STALE_AFTER:
            return payload, "STALE"
        
        return payload, "FRESH"
    except:
        return None, "MISS"

def set_cached_response(query, mode, answer, sources):
    if not r: return
    key = f"cache:{mode}:{query.lower().strip()}"
    cache_data = {
        "timestamp": time.time(),
        "payload": {
            "answer": answer,
            "sources": sources
        }
    }
    try:
        # Save with absolute max TTL
        r.setex(key, MAX_TTL, json.dumps(cache_data))
    except Exception as e:
        print(f"⚠️ Failed to write to Redis: {e}")