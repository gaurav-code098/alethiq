import requests
import json
import os
from dotenv import load_dotenv

load_dotenv(override=True)

def get_google_images(query):
    """
    Fetches 4 relevant images from Google Images via Serper.
    """
    api_key = os.getenv("SERPER_API_KEY")
    if not api_key: return []

    url = "https://google.serper.dev/images"
    payload = json.dumps({
        "q": query,
        "num": 4  # We only need a few high-quality ones
    })
    headers = {
        'X-API-KEY': api_key,
        'Content-Type': 'application/json'
    }

    try:
        response = requests.post(url, headers=headers, data=payload)
        data = response.json()
        
        image_results = []
        if "images" in data:
            for img in data["images"]:
                image_results.append({
                    "title": img.get("title"),
                    "url": img.get("imageUrl"),
                    "thumbnail": img.get("thumbnailUrl"),
                    "source": img.get("domain")
                })
        return image_results
        
    except Exception as e:
        print(f"❌ Image Search Failed: {e}")
        return []