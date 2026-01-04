from contextlib import asynccontextmanager
from fastapi import FastAPI
from pydantic import BaseModel
from services.search_service import search_web
from services.vector_service import init_vector_db, store_knowledge, find_similar_context
from services.llm_service import generate_answer
import os
from dotenv import load_dotenv

# Force load the .env file
# Change this line:
load_dotenv(override=True)

# --- DEBUG PRINT ---
print("--- DEBUG: CHECKING KEYS ---")
print(f"TAVILY_KEY: {os.getenv('TAVILY_API_KEY')}")
print(f"GEMINI_KEY: {os.getenv('GEMINI_API_KEY')}")
print("----------------------------")

# 1. Define the Lifespan (Startup & Shutdown Logic)
@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- STARTUP LOGIC ---
    print("🚀 Alethiq Brain is waking up...")
    try:
        init_vector_db() # Connects to Neon and creates table
        print("✅ Database initialized successfully.")
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
    
    yield # The app runs while paused here
    
    # --- SHUTDOWN LOGIC ---
    print("🛑 Alethiq Brain is shutting down...")

# 2. Initialize App with Lifespan
app = FastAPI(lifespan=lifespan)

class QueryRequest(BaseModel):
    query: str

@app.get("/")
def health_check():
    return {"status": "online", "system": "Alethiq AI Brain"}

@app.post("/query")
def process_query(request: QueryRequest):
    q = request.query
    
    # 1. Search the Web (Tavily)
    raw_results = search_web(q)
    
    # 2. Embed & Store in Neon (Postgres Vector)
    store_knowledge(raw_results)
    
    # 3. Retrieve Best Context (RAG)
    context = find_similar_context(q)
    
    # 4. Generate Answer (Gemini)
    answer = generate_answer(q, context)
    
    return {
        "query": q,
        "answer": answer,
        "sources": raw_results 
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)