import requests
import json

url = "http://localhost:8000/query-stream"
payload = {"query": "Difference between java and go"}

print(f"🌊 Connecting to {url}...")

try:
    with requests.post(url, json=payload, stream=True) as r:
        r.raise_for_status()
        print("✅ Connected! receiving stream:\n")
        
        for line in r.iter_lines():
            if line:
                decoded_line = line.decode('utf-8')
                print(decoded_line)
                
except Exception as e:
    print(f"❌ Error: {e}")