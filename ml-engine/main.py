from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from pinecone import Pinecone
from sentence_transformers import SentenceTransformer
from thefuzz import process, fuzz
import random
import os

PINECONE_API_KEY = os.environ.get("PINECONE_API_KEY")
INDEX_NAME = "cine-match"

if not PINECONE_API_KEY:
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip().startswith("PINECONE_API_KEY"):
                    parts = line.split("=", 1)
                    if len(parts) > 1:
                        PINECONE_API_KEY = parts[1].strip().strip('"').strip("'")
                        break

if not PINECONE_API_KEY:
    raise RuntimeError(
        "PINECONE_API_KEY not set. Add it to environment or ml-engine/.env"
    )

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

print("⏳ Loading AI Model...")
model = SentenceTransformer('all-MiniLM-L6-v2')
pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(INDEX_NAME)
print("✅ Brain Online!")

class SearchRequest(BaseModel):
    query: str
    filter_type: str = "All"

class QuizRequest(BaseModel):
    genre: str

class FinalRecommendationRequest(BaseModel):
    mood: str
    selected_titles: list[str]
    genre: str

@app.post("/search")
def semantic_search(req: SearchRequest):
    try:
        query_vector = model.encode(req.query).tolist()
        filter_dict = {}
        if req.filter_type != "All":
            filter_dict = {"type": req.filter_type}

        results = index.query(
            vector=query_vector,
            top_k=80, 
            include_metadata=True,
            filter=filter_dict if filter_dict else None
        )
        
        candidates = []
        for match in results['matches']:
            meta = match['metadata']
            candidates.append({
                "id": meta['original_id'],
                "title": meta['title'],
                "type": meta['type'],
                "score": match['score'],
                "rating": meta.get('rating', 0)
            })
        
        final_results = []
        for item in candidates:
            fuzzy_score = fuzz.ratio(req.query.lower(), item['title'].lower())

            if fuzzy_score > 85:
                item['score'] += 2.0 
            
            elif fuzz.partial_ratio(req.query.lower(), item['title'].lower()) > 90:
                item['score'] += 0.5

            final_results.append(item)

        final_results.sort(key=lambda x: x['score'], reverse=True)

        return {"results": final_results[:20]}
        
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/mood")
def mood_search(mood: str):
    mood_map = {
        "Happy": "Feel good movie, comedy, lighthearted, happy ending",
        "Dark": "Dark, psychological thriller, disturbing, gritty, noir",
        "Adrenaline": "High stakes action, fast paced, car chases, explosions",
        "Mind-Bending": "Confusing plot, time travel, philosophy, deep thoughts",
        "Romantic": "Love story, romance, heartbreak, relationship",
        "Scary": "Horror, ghosts, jump scares, terrifying"
    }
    search_query = mood_map.get(mood, mood)
    return semantic_search(SearchRequest(query=search_query))

@app.post("/get-quiz-items")
def get_quiz_items(req: QuizRequest):
    query = f"Popular, famous, high rated {req.genre} movies or anime"
    vector = model.encode(query).tolist()
    results = index.query(
        vector=vector, top_k=20, include_metadata=True,
        filter={"type": "Anime" if req.genre == "Anime" else "Movie"}
    )
    items = [{"id": m['metadata']['original_id'], "title": m['metadata']['title'], "type": m['metadata']['type'], "poster": None} for m in results['matches']]
    return {"items": items}

@app.post("/hybrid-recommend")
def hybrid_recommend(req: FinalRecommendationRequest):
    joined_titles = ", ".join(req.selected_titles)
    semantic_query = f"{req.mood} {req.genre} similar to {joined_titles}"
    query_vector = model.encode(semantic_query).tolist()
    results = index.query(vector=query_vector, top_k=60, include_metadata=True)
    
    recommendations = []
    for match in results['matches']:
        meta = match['metadata']
        if meta['title'] in req.selected_titles: continue
        reason = f"Because you liked {random.choice(req.selected_titles)} and wanted something {req.mood}."
        recommendations.append({
            "id": meta['original_id'],
            "title": meta['title'],
            "type": meta['type'],
            "score": match['score'],
            "rating": meta.get('rating', 0),
            "reason": reason 
        })
    return {"results": recommendations}

@app.get("/lucky")
def lucky_pick():
    vector = model.encode("Masterpiece, highly rated, famous, classic, 5 stars").tolist()
    results = index.query(vector=vector, top_k=50, include_metadata=True)
    if not results['matches']: raise HTTPException(status_code=404, detail="No movies found")
    match = random.choice(results['matches'])
    meta = match['metadata']
    return {
        "id": meta['original_id'], "title": meta['title'], "type": meta['type'],
        "rating": meta.get('rating', 0), "reason": "Serendipity ✨"
    }