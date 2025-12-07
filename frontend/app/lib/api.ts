const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const TMDB_KEY = process.env.TMDB_KEY;

export const api = {
  search: async (query: string, type: string = "All") => {
    const res = await fetch(`${API_URL}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, filter_type: type }),
    });
    return await res.json();
  },

  searchByMood: async (mood: string) => {
    const res = await fetch(`${API_URL}/mood?mood=${encodeURIComponent(mood)}`, {
        method: "POST"
    });
    return await res.json();
  },

  getQuizItems: async (genre: string) => {
    const res = await fetch(`${API_URL}/get-quiz-items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ genre }),
    });
    return await res.json();
  },

  getHybridRecommendations: async (mood: string, genre: string, selectedTitles: string[]) => {
    const res = await fetch(`${API_URL}/hybrid-recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mood, genre, selected_titles: selectedTitles }),
    });
    return await res.json();
  },

  getLucky: async () => {
    const res = await fetch(`${API_URL}/lucky`);
    return await res.json();
  },

  getTrailer: async (id: string, type: string) => {
    try {
        if(type === 'Anime') return null; 
        
        const res = await fetch(`https://api.themoviedb.org/3/movie/${id}/videos?api_key=${TMDB_KEY}`);
        const data = await res.json();
        
        const trailer = data.results?.find((v: any) => v.site === "YouTube" && v.type === "Trailer");
        return trailer ? trailer.key : null;
    } catch(e) { 
        console.error(e);
        return null; 
    }
  }
};
