import os
import json
import re
import asyncio
import uvicorn
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, BackgroundTasks
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# 🟢 IMPORT GROQ DIRECTLY (For Deep Mode in main.py)
from groq import Groq

# --- Custom Services ---
from services.search_service import search_tavily 
from services.vector_service import init_vector_db, find_similar_context, store_knowledge
from services.llm_service import stream_answer
from services.cache_server import get_cached_response, set_cached_response, r as redis_client 

# 🟢 IMPORT: YoutubeLoader
from langchain_community.document_loaders import YoutubeLoader

# 1. Load Keys
load_dotenv(override=True)

# --- HELPERS ---
def chunk_text(text, chunk_size=20):
    """Splits a string into small chunks to simulate a streaming effect."""
    for i in range(0, len(text), chunk_size):
        yield text[i:i + chunk_size]

async def refresh_knowledge_task(q: str, mode: str):
    """Background task to refresh stale cache. Performs search + LLM generation."""
    try:
        found_sources = search_tavily(q, mode=mode)
        context_text = "\n".join([res.get('content', '') for res in found_sources])
        
        full_answer = ""
        for token in stream_answer(q, context_text, mode=mode):
            full_answer += token
            
        if full_answer:
            set_cached_response(q, mode, full_answer, found_sources)
    except:
        pass

# 2. Database Startup Logic
@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        if redis_client and redis_client.ping():
            pass
    except:
        pass

    try:
        await init_vector_db()
    except:
        pass 
    yield

# 3. Initialize App
app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    query: str
    mode: str = "fast" 

def get_video_id(text: str):
    pattern = r'(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})'
    match = re.search(pattern, text)
    if match:
        return match.group(1)
    return None

# --- Streaming Logic ---
async def stream_processor(q: str, mode: str, background_tasks: BackgroundTasks):
    # 1. Identity Guard
    identity_triggers = ["who are you", "who made you", "who created you", "who owns you", "who developed you", "what are you", "your developer", "who developed you", "what are you", "your developer", "core model", 
        "maintaining you", "responsible for you"]
    if any(trigger in q.lower() for trigger in identity_triggers):
        yield f"data: {json.dumps({'status': 'Answering directly...'})}\n\n"
        for token in stream_answer(q, "CONTEXT: The user is asking about your identity. Do NOT search the web. Answer directly based on your system instructions.", mode=mode):
            yield f"data: {json.dumps({'answer_chunk': token})}\n\n"
            await asyncio.sleep(0.005)
        yield f"data: {json.dumps({'status': 'Done'})}\n\n"
        yield "data: [DONE]\n\n"
        return

    # 2. Check SWR Cache
    payload, status = get_cached_response(q, mode)

    if payload:
        if status == "STALE":
            background_tasks.add_task(refresh_knowledge_task, q, mode)
            yield f"data: {json.dumps({'status': '⚡ Refreshing insights...'})}\n\n"
        else:
            yield f"data: {json.dumps({'status': '⚡ Instant Recall from Cache'})}\n\n"

        yield f"data: {json.dumps({'sources': payload.get('sources', [])})}\n\n"
        for chunk in chunk_text(payload.get('answer', '')):
            yield f"data: {json.dumps({'answer_chunk': chunk})}\n\n"
            await asyncio.sleep(0.002)
        
        yield f"data: {json.dumps({'status': 'Done'})}\n\n"
        yield "data: [DONE]\n\n"
        return
    
    full_answer_accumulator = ""
    found_sources = []

    try:
        yield f"data: {json.dumps({'status': 'Thinking...'})}\n\n"
        
        # YouTube Logic
        video_id = get_video_id(q)
        if video_id:
            yield f"data: {json.dumps({'status': 'Found YouTube Link...'})}\n\n"
            try:
                clean_url = f"https://www.youtube.com/watch?v={video_id}"
                docs = []
                video_title = "YouTube Video"

                try: 
                    loader = YoutubeLoader.from_youtube_url(clean_url, add_video_info=True, language=["en", "en-US"])
                    docs = loader.load()
                except: pass 

                if not docs:
                    try: 
                        loader = YoutubeLoader.from_youtube_url(clean_url, add_video_info=True, language=["hi", "hi-IN"])
                        docs = loader.load()
                    except: pass
                
                if not docs:
                    try:
                        loader = YoutubeLoader.from_youtube_url(clean_url, add_video_info=False, language=["hi", "hi-IN", "es", "fr"])
                        docs = loader.load()
                    except: pass

                if not docs:
                    try: 
                        loader = YoutubeLoader.from_youtube_url(clean_url, add_video_info=False)
                        docs = loader.load()
                    except Exception as e: 
                        raise ValueError(f"Could not find transcript. ({str(e)})")

                if docs:
                    if docs[0].metadata: video_title = docs[0].metadata.get('title', "YouTube Video")
                    yield f"data: {json.dumps({'status': 'Reading Transcript...'})}\n\n"
                    
                    full_transcript = " ".join([d.page_content for d in docs])
                    
                    # 🔴 FIX 1: Limit transcript to 3500 chars (safe zone for 70B model free tier)
                    limit_chars = 3500 
                    transcript_text = full_transcript[:limit_chars]
                    if len(full_transcript) > limit_chars: 
                        transcript_text += "\n[...Transcript Truncated due to size limit...]"

                    context_text = f"RAW TRANSCRIPT ({video_title}):\n{transcript_text}"
                    
                    prompt = (
                        f"Analyze the following video transcript for '{video_title}'. "
                        f"Summarize key points and answer: {q}"
                    )

                    yield f"data: {json.dumps({'status': 'Translating & Analyzing (Deep Mode)...'})}\n\n"
                    
                    # 🟢 FIX 2: Use Local Groq Client for 70B Model (Deep Mode)
                    # We bypass llm_service here to use the better model directly
                    deep_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
                    
                    completion = deep_client.chat.completions.create(
                        model="llama-3.3-70b-versatile",  # <--- THE BETTER MODEL
                        messages=[
                            {"role": "system", "content": "You are a helpful AI video analyst. Summarize and answer based on the transcript."},
                            {"role": "user", "content": f"Context: {context_text}\n\nQuestion: {prompt}"}
                        ],
                        stream=True,
                        temperature=0.6,
                        max_tokens=1024
                    )

                    for chunk in completion:
                        token = chunk.choices[0].delta.content or ""
                        full_answer_accumulator += token 
                        yield f"data: {json.dumps({'answer_chunk': token})}\n\n"
                        await asyncio.sleep(0.005) 

                    if full_answer_accumulator:
                        set_cached_response(q, mode, full_answer_accumulator, [{"title": video_title, "url": clean_url}])
                    yield f"data: {json.dumps({'status': 'Done'})}\n\n"
                    yield "data: [DONE]\n\n"
                    return 
            except Exception as e:
                yield f"data: {json.dumps({'answer_chunk': f'\n**⚠️ Error Loading Video:** {str(e)}\n\n'})}\n\n"
                return

        # Memory Logic
        try:
            memory_hit = await find_similar_context(q, threshold=0.85)
            if memory_hit:
                yield f"data: {json.dumps({'status': 'Found in Memory!'})}\n\n"
                found_sources = memory_hit.get('sources', [])
                yield f"data: {json.dumps({'sources': found_sources})}\n\n"
                for token in stream_answer(q, memory_hit["text"], mode=mode):
                    full_answer_accumulator += token
                    yield f"data: {json.dumps({'answer_chunk': token})}\n\n"
                    await asyncio.sleep(0.005)
                if full_answer_accumulator: set_cached_response(q, mode, full_answer_accumulator, found_sources)
                yield f"data: {json.dumps({'status': 'Done'})}\n\n"
                yield "data: [DONE]\n\n"
                return 
        except: pass

        # Web Search
        yield f"data: {json.dumps({'status': 'Searching the Web...'})}\n\n"
        found_sources = search_tavily(q, mode=mode)
        yield f"data: {json.dumps({'sources': found_sources})}\n\n"
        yield f"data: {json.dumps({'status': 'Writing Answer...'})}\n\n"
        
        try: await store_knowledge(found_sources)
        except: pass
        
        context_text = "\n".join([f"{res.get('content', '')}" for res in found_sources]) if found_sources else "No results found."
        for token in stream_answer(q, context_text, mode=mode):
            full_answer_accumulator += token
            yield f"data: {json.dumps({'answer_chunk': token})}\n\n"
            await asyncio.sleep(0.005)
        
        if full_answer_accumulator and found_sources:
             set_cached_response(q, mode, full_answer_accumulator, found_sources)

        yield f"data: {json.dumps({'status': 'Done'})}\n\n"
        yield "data: [DONE]\n\n"

    except Exception as global_e:
        yield f"data: {json.dumps({'answer_chunk': f'\n\n**System Error:** {str(global_e)}'})}\n\n"
        yield "data: [DONE]\n\n"

# --- Endpoints ---

@app.get("/get-suggestions")
async def get_suggestions():
    # 1. Check Redis Cache first
    try:
        cached = redis_client.get("global_suggestions")
        if cached:
            return json.loads(cached)
    except:
        pass # If Redis fails, continue to Groq

    # 2. If not in cache, fetch from Groq
    prompt = "Generate 6 short, trending, and diverse search suggestions for an AI search engine. Examples: 'Future of AI', 'SpaceX updates'. Return ONLY a JSON list of strings."
    try:
        response = ""
        # Using your existing stream_answer logic
        for token in stream_answer(prompt, "Return a JSON list like ['Topic 1', 'Topic 2']", mode="fast"):
            response += token
        
        # Clean the response to ensure it's valid JSON
        match = re.search(r'\[.*\]', response, re.DOTALL)
        if match:
            suggestions = json.loads(match.group())
            # 3. Store in Redis for 30 minutes (1800 seconds)
            try:
                redis_client.setex("global_suggestions", 1800, json.dumps(suggestions))
            except:
                pass
            return suggestions
    except Exception as e:
        print(f"Suggestion Error: {e}")
    
    # Fallback list if everything fails
    return ["AI Agents", "SpaceX Starship", "NVIDIA Stock", "Quantum Computing", "Sci-Fi 2024", "Python vs Java"]

@app.get("/")
def health_check():
    return {"status": "online"}

@app.post("/query-stream")
async def process_query_stream(body: QueryRequest, background_tasks: BackgroundTasks):
    return StreamingResponse(stream_processor(body.query, body.mode, background_tasks), media_type="text/event-stream")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)