import google.generativeai as genai
import os
import json
from dotenv import load_dotenv
from functools import lru_cache
load_dotenv(override=True)

PLANNER_MODEL = "models/gemini-1.5-flash-latest"

def configure_genai():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key: return False
    genai.configure(api_key=api_key)
    return True
@lru_cache(maxsize=100)
def classify_intent(query):
    """
    Step 1: Visual Intent Classification.
    Decides if the user's query requires visual aids (Images/Diagrams).
    Returns: True (Visual) or False (Text-only)
    """
    if not configure_genai(): return True # Default to yes if API fails

    model = genai.GenerativeModel(PLANNER_MODEL)
    
    prompt = f"""
    Analyze this user query: "{query}"
    
    Does this query benefit from IMAGES, DIAGRAMS, or CHARTS?
    - "C# vs C++" -> YES (Architecture diagrams)
    - "How to tie a tie" -> YES (Step-by-step images)
    - "Define recursion" -> NO (Text is enough)
    - "Write a Python script" -> NO (Code is better)
    
    Reply with ONLY the word "YES" or "NO".
    """
    
    try:
        response = model.generate_content(prompt)
        intent = response.text.strip().upper()
        print(f"🧠 Visual Intent: {intent}")
        return "YES" in intent
    except:
        return True # Fallback to safety
@lru_cache(maxsize=100)
def optimize_search_query(user_query):
    # ... (Keep your existing optimize function here) ...
    if not configure_genai(): return user_query
    
    model = genai.GenerativeModel(PLANNER_MODEL)
    prompt = f"Refine this into a detailed Google search query: '{user_query}'. Return ONLY the query."
    try:
        return model.generate_content(prompt).text.strip()
    except:
        return user_query