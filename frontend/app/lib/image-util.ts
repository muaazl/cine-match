const TMDB_API_KEY = "e3553ae9c663d81cb23cea986235cd4d"; 

export const getPosterUrl = async (id: number, type: string, title: string) => {
  try {
    if (type === "Anime") {
      const res = await fetch(`https://api.jikan.moe/v4/anime/${id}`);
      const data = await res.json();
      return data.data?.images?.jpg?.large_image_url || null;
    } else {
      const res = await fetch(
        `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_API_KEY}`
      );
      
      if (!res.ok) {
        const search = await fetch(
            `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`
        );
        const searchData = await search.json();
        if(searchData.results?.[0]?.poster_path) {
            return `https://image.tmdb.org/t/p/w500${searchData.results[0].poster_path}`;
        }
        return null;
      }

      const data = await res.json();
      if (data.poster_path) {
        return `https://image.tmdb.org/t/p/w500${data.poster_path}`;
      }
    }
  } catch (e) {
    console.error("Image fetch error", e);
  }
  return "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=600";
};