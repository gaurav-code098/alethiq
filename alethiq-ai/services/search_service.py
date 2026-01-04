from tavily import TavilyClient
import requests
import json
import os
from dotenv import load_dotenv
import trafilatura
from services.llm_service import summarize_text

load_dotenv(override=True)

# --- HELPER: Deduplicate Sources ---
def deduplicate_results(results):
    """
    Removes duplicate sources based on URL or Identical Titles.
    Keeps the one with the highest score (or first found).
    """
    unique_results = []
    seen_urls = set()
    seen_titles = set()

    for res in results:
        url = res.get("url")
        title = res.get("title")

        # Skip if we already have this URL or Title
        if url in seen_urls or title in seen_titles:
            continue
        
        seen_urls.add(url)
        seen_titles.add(title)
        unique_results.append(res)
    
    return unique_results

# --- SCRAPER ---
def scrape_and_summarize(url):
    print(f"   ↳ Deep scraping & Summarizing: {url}")
    try:
        downloaded = trafilatura.fetch_url(url)
        if downloaded:
            raw_text = trafilatura.extract(downloaded, include_comments=False)
            if raw_text:
                return summarize_text(raw_text)
        return "" 
    except:
        return ""

# --- SEARCH FUNCTIONS ---
def search_tavily(query, mode="fast"):
    """
    Searches Tavily with dynamic depth. TEXT ONLY.
    """
    api_key = os.getenv("TAVILY_API_KEY")
    tavily = TavilyClient(api_key=api_key)
    
    # 🟢 DYNAMIC CONFIGURATION
    search_depth = "basic" if mode == "fast" else "advanced"
    max_results = 5 if mode == "fast" else 10 
    
    print(f"🕵️ Search (Tavily) | Mode: {mode} | Depth: {search_depth}...")
    
    try:
        response = tavily.search(
            query=query, 
            search_depth=search_depth, 
            max_results=max_results
        )
        results = response.get("results", [])
        
        cleaned_results = []
        for res in results:
            text = res.get("content")
            
            # If content is empty/thin, use your Scraper Logic
            if not text or len(text) < 50:
                 text = scrape_and_summarize(res.get("url"))

            if text:
                cleaned_results.append({
                    "title": res.get("title"),
                    "url": res.get("url"),
                    "content": text,
                    "score": res.get("score")
                })
        
        # APPLY DEDUPLICATION HERE
        return deduplicate_results(cleaned_results)
    except Exception as e:
        print(f"❌ Tavily Error: {e}")
        return []

def search_serper(query):
    """
    Fallback Text Search (No Images).
    """
    api_key = os.getenv("SERPER_API_KEY")
    print("🛡️ Fallback (Serper)...")
    url = "https://google.serper.dev/search"
    payload = json.dumps({"q": query, "num": 5})
    headers = {'X-API-KEY': api_key, 'Content-Type': 'application/json'}
    
    try:
        response = requests.post(url, headers=headers, data=payload)
        data = response.json()
        results = []
        if "organic" in data:
            for i, item in enumerate(data["organic"]):
                if i < 3: 
                    content = scrape_and_summarize(item.get("link"))
                    if content:
                        results.append({
                            "title": item.get("title"),
                            "url": item.get("link"),
                            "content": content,
                            "score": 0.9
                        })
        return deduplicate_results(results)
    except:
        return []

def search_web(query, mode="fast"):
    """
    Main entry point. Tries Tavily (with mode), falls back to Serper.
    """
    try:
        # Pass the mode to Tavily
        res = search_tavily(query, mode=mode)
        if not res: raise Exception("Empty")
        return res
    except:
        return search_serper(query)
    
def search_web_multi(queries):
    """
    Executes the Search Plan and Consolidates Results.
    """
    all_results = []
    
    print(f"🧠 Executing Search Plan: {queries}")
    
    # Run searches
    for q in queries:
        try:
            results = search_tavily(q, mode="fast") 
            all_results.extend(results)
        except Exception as e:
            print(f"   ⚠️ Sub-query '{q}' failed: {e}")
            
    # Deduplicate
    unique_results = deduplicate_results(all_results)
    
    print(f"✅ Consolidated {len(all_results)} raw results into {len(unique_results)} unique sources.")
    return unique_results[:7]