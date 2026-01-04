import os
import psycopg2
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv

load_dotenv(override=True)

# 1. Initialize the Embedding Model (Load once to save time)
print("🧠 Loading Embedding Model...")
# We wrap this in a try-catch in case the model fails to download
try:
    model = SentenceTransformer('all-MiniLM-L6-v2')
except Exception as e:
    print(f"⚠️ Model Load Error: {e}")
    model = None

def get_db_connection():
    """Establishes a connection to the Neon Postgres DB."""
    url = os.getenv("DATABASE_URL")
    if not url:
        raise ValueError("DATABASE_URL is missing in .env")
    return psycopg2.connect(url)

# 🟢 CHANGE: Added 'async' keyword so main.py can await it
async def init_vector_db():
    """
    Creates the table and the vector extension if they don't exist.
    """
    if not os.getenv("DATABASE_URL"):
        print("⚠️ Vector DB: Skipped (No DATABASE_URL)")
        return

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Enable pgvector extension
        cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
        
        # Create table with a 384-dimensional vector column (matches MiniLM)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS knowledge (
                id SERIAL PRIMARY KEY,
                url TEXT,
                title TEXT,
                content TEXT,
                embedding vector(384),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        conn.commit()
        print("✅ Vector DB (Old Logic) Initialized.")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ DB Init Error: {e}")

# 🟢 CHANGE: Added 'async' keyword
async def store_knowledge(results):
    """
    Converts search results into vectors and saves them to Postgres.
    """
    if not results or model is None: return

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        print(f"💾 Memorizing {len(results)} new facts...")
        
        for res in results:
            content = res.get("content", "")
            if len(content) < 50: continue # Skip empty/short junk

            # Generate Vector (384 floats)
            vector = model.encode(content).tolist()
            
            # Insert into DB
            cur.execute("""
                INSERT INTO knowledge (url, title, content, embedding)
                VALUES (%s, %s, %s, %s)
            """, (res.get("url"), res.get("title"), content, vector))
            
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ Storage Error: {e}")

# 🟢 CHANGE: Added 'async' keyword
async def find_similar_context(query, threshold=0.8): # Default threshold 0.8
    """
    Searches the Vector DB for content similar to the user's query.
    """
    if model is None: return None

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # 1. Convert Query to Vector
        query_vector = model.encode(query).tolist()
        
        # 2. Vector Search SQL (Cosine Similarity)
        # We use <=> (cosine distance). 
        # Similarity = 1 - Distance.
        # We want results where (1 - Distance) > Threshold.
        cur.execute("""
            SELECT content, url, title, 1 - (embedding <=> %s::vector) as score
            FROM knowledge
            WHERE 1 - (embedding <=> %s::vector) > %s
            ORDER BY score DESC
            LIMIT 3;
        """, (query_vector, query_vector, threshold))
        
        rows = cur.fetchall()
        cur.close()
        conn.close()
        
        if not rows:
            return None # Nothing found in memory
            
        # 3. Format the results
        context_parts = []
        sources = []
        
        for row in rows:
            content, url, title, score = row
            # Add a tag so the AI knows this is from memory
            context_parts.append(f"MEMORY SOURCE ({title}): {content}")
            
            sources.append({
                "title": f"[Memory] {title}", # Mark title to show it's cached
                "url": url,
                "content": content,
                "score": float(score)
            })
            
        return {
            "text": "\n\n".join(context_parts),
            "sources": sources
        }

    except Exception as e:
        print(f"⚠️ Vector Search Failed: {e}")
        return None