import pandas as pd
import numpy as np
import pickle
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import ast

DATA_PATH = '../data/' 
MAX_ITEMS = 12000

def process_movies():
    print("🎬 Processing TMDB Movies...")
    movies = pd.read_csv(DATA_PATH + 'tmdb_5000_movies.csv')
    
    movies['release_date'] = pd.to_datetime(movies['release_date'], errors='coerce')
    movies = movies.dropna(subset=['release_date'])
    
    movies = movies[
        (movies['release_date'].dt.year >= 2000) | 
        ((movies['release_date'].dt.year < 2000) & (movies['vote_count'] > 1500))
    ].copy()
    
    def parse_genres(x):
        try:
            return " ".join([i['name'] for i in ast.literal_eval(x)])
        except:
            return ""

    movies['genres_str'] = movies['genres'].apply(parse_genres)
    movies['tags'] = movies['overview'].fillna('') + " " + movies['genres_str']
    movies['type'] = 'Movie'
    movies = movies[['id', 'title', 'tags', 'vote_average', 'vote_count', 'type', 'genres_str']]
    movies.rename(columns={'vote_average': 'rating', 'genres_str': 'genre_list'}, inplace=True)
    
    return movies

def process_anime():
    print("🍙 Processing Anime...")
    anime = pd.read_csv(DATA_PATH + 'anime.csv')
    
    anime = anime[anime['members'] > 40000].copy()
    anime['name'] = anime['name'].fillna('')
    anime['genre'] = anime['genre'].fillna('')
    anime['type'] = anime['type'].fillna('Anime')
    anime['tags'] = anime['genre'] + " " + anime['type'] + " " + anime['name']
    anime['genre_list'] = "Anime"
    anime.rename(columns={'anime_id': 'id', 'name': 'title', 'rating': 'rating', 'members': 'vote_count'}, inplace=True)
    anime['type'] = 'Anime'
    
    anime = anime[['id', 'title', 'tags', 'rating', 'vote_count', 'type', 'genre_list']]
    
    return anime

def build_engine():
    df_movies = process_movies()
    df_anime = process_anime()
    
    combined = pd.concat([df_movies, df_anime], ignore_index=True)
    combined = combined.sample(frac=1, random_state=42).reset_index(drop=True)
    if len(combined) > MAX_ITEMS:
        print(f"⚠️ Trimming dataset from {len(combined)} to {MAX_ITEMS}...")
        combined = combined.head(MAX_ITEMS)

    print(f"📊 Total Database: {len(combined)} items.")
    print("🧠 Training NLP Model...")
    cv = CountVectorizer(max_features=5000, stop_words='english')
    vectors = cv.fit_transform(combined['tags']).toarray()
    print("📐 Calculating Cosine Similarity...")
    similarity = cosine_similarity(vectors)
    print("📝 Generating Quiz Data...")
    
    all_genres = set()
    for g in combined['genre_list'].dropna():
        cleaned = g.replace(" ", ",").split(",") 
        for item in cleaned:
            if item and len(item) > 2: all_genres.add(item.strip())
            
    quiz_data = {}
    for genre in all_genres:
        if genre == "Anime":
            mask = combined['type'] == 'Anime'
        else:
            mask = (combined['genre_list'].str.contains(genre, case=False, na=False)) & (combined['type'] == 'Movie')
            
        top_items = combined[mask].sort_values(by='rating', ascending=False).head(20)
        
        if not top_items.empty:
            quiz_data[genre] = top_items[['id', 'title', 'type']].to_dict('records')

    print("💾 Saving Artifacts...")
    pickle.dump(combined, open('movie_list.pkl', 'wb'))
    pickle.dump(similarity, open('similarity.pkl', 'wb'))
    pickle.dump(quiz_data, open('quiz_data.pkl', 'wb'))
    
    print("🎉 DONE! Backend ready.")

if __name__ == "__main__":
    build_engine()