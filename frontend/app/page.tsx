"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles, ArrowRight, ArrowLeft } from "lucide-react";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { DirectionAwareHover } from "./components/ui/card";
import { MovieLoader } from "./components/ui/loader";
import { MovieModal } from "./components/movie-modal";
import { api } from "./lib/api";
import { getPosterUrl } from "./lib/image-util";

const MOODS = ["Happy", "Dark", "Adrenaline", "Mind-Bending", "Romantic", "Scary"];
const GENRES = ["Action", "Sci-Fi", "Comedy", "Romance", "Horror", "Anime", "Drama", "Thriller"];

export default function CineMatchHybrid() {
  const [mode, setMode] = useState<"search" | "wizard">("search");
  const [selectedResult, setSelectedResult] = useState<any>(null);

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-black selection:text-white pb-10">
      <nav className="w-full max-w-7xl mx-auto p-4 md:p-6 flex flex-col md:flex-row justify-between items-center gap-4 z-50">
        <h1 className="text-2xl font-black tracking-tighter">CineMatch.</h1>
        <div className="flex bg-zinc-100 p-1 rounded-full border border-zinc-200">
            <button onClick={() => setMode("search")} className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${mode === 'search' ? 'bg-white shadow-sm text-black' : 'text-zinc-500 hover:text-black'}`}>
                <Search size={14}/> Search
            </button>
            <button onClick={() => setMode("wizard")} className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${mode === 'wizard' ? 'bg-black shadow-sm text-white' : 'text-zinc-500 hover:text-black'}`}>
                <Sparkles size={14}/> Concierge
            </button>
        </div>
      </nav>

      <div className="w-full max-w-7xl mx-auto px-4 md:px-6">
          {mode === "search" ? <SearchMode onSelect={setSelectedResult} /> : <WizardMode onSelect={setSelectedResult} />}
      </div>

      <MovieModal isOpen={!!selectedResult} movie={selectedResult} onClose={() => setSelectedResult(null)} />
    </main>
  );
}

function SearchMode({ onSelect }: { onSelect: (m: any) => void }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const performSearch = async (q: string) => {
        if(!q.trim()) return;
        setLoading(true);
        const data = await api.search(q);
        const enriched = await fetchImagesWithDelay(data.results);
        setResults(enriched);
        setLoading(false);
    };

    const handleLucky = async () => {
        setLoading(true);
        const item = await api.getLucky();
        const poster = await getPosterUrl(Number(item.id), item.type, item.title);
        onSelect({ ...item, poster });
        setLoading(false);
    };

    return (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex flex-col items-center pt-10 md:pt-20">
            <h2 className="text-4xl md:text-7xl font-black mb-6 tracking-tighter text-center leading-tight">
                Find it fast.
            </h2>
            
            <div className="w-full max-w-2xl relative mb-12">
                <Input 
                    label="Type a movie, genre, or very specific plot..." 
                    value={query} onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && performSearch(query)}
                    className="py-6 text-lg border-zinc-300 focus:border-black bg-transparent"
                />
                    <Button className="absolute right-2 top-2" onClick={() => performSearch(query)}>Go</Button>
                    <Button variant="outline" onClick={handleLucky} title="I'm Feeling Lucky">I'm Feeling Lucky</Button>
            </div>

            {loading && <MovieLoader />}

            {!loading && results.length > 0 && (
                 <div className="grid grid-cols-1 place-items-center sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
                    {results.map((item) => (
                        <div key={item.id} onClick={() => onSelect(item)} className="cursor-pointer">
                            <DirectionAwareHover imageUrl={item.poster || ""}>
                                <div className="space-y-1">
                                    <p className="font-bold text-lg leading-tight line-clamp-2">{item.title}</p>
                                    <p className="text-xs text-gray-300">{item.type} • ⭐ {item.rating?.toFixed(1)}</p>
                                </div>
                            </DirectionAwareHover>
                        </div>
                    ))}
                 </div>
            )}
        </motion.div>
    )
}

function WizardMode({ onSelect }: { onSelect: (m: any) => void }) {
    const [step, setStep] = useState<"intro" | "genre" | "select" | "loading" | "results">("intro");
    const [mood, setMood] = useState("");
    const [genre, setGenre] = useState("");
    const [selectedMovies, setSelectedMovies] = useState<string[]>([]);
    const [selectionItems, setSelectionItems] = useState<any[]>([]);
    const [results, setResults] = useState<any[]>([]);

    const handleGenreSelect = async (g: string) => {
        setGenre(g);
        setStep("loading");
        const data = await api.getQuizItems(g);
        const enriched = await fetchImagesWithDelay(data.items);
        setSelectionItems(enriched);
        setStep("select");
    };

    const handleGetResults = async () => {
        setStep("loading");
        const data = await api.getHybridRecommendations(mood, genre, selectedMovies);
        const enriched = await fetchImagesWithDelay(data.results);
        setResults(enriched);
        setStep("results");
    };

    const toggleSelection = (t: string) => {
        if(selectedMovies.includes(t)) setSelectedMovies(p => p.filter(x => x !== t));
        else if(selectedMovies.length < 5) setSelectedMovies(p => [...p, t]);
    };

    return (
        <div className="w-full pt-6 md:pt-10">
            <AnimatePresence mode="wait">
                {step === 'intro' && (
                    <motion.div key="intro" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="max-w-xl mx-auto space-y-8 px-4">
                        <div className="text-center">
                            <h2 className="text-4xl md:text-5xl font-black mb-2">The Concierge.</h2>
                            <p className="text-zinc-500">Let us curate a playlist for your current vibe.</p>
                        </div>
                        <div className="space-y-6 bg-white p-6 md:p-8 rounded-2xl border border-zinc-100 shadow-xl shadow-zinc-200/50">
                            <div>
                                <Input label="Current Mood" value={mood} onChange={e => setMood(e.target.value)} />
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {MOODS.map(m => (
                                        <Badge key={m} variant="outline" className="cursor-pointer hover:bg-black hover:text-white transition" onClick={() => setMood(m)}>{m}</Badge>
                                    ))}
                                </div>
                            </div>
                            <Button className="w-full h-12 text-lg" disabled={!mood} onClick={() => setStep("genre")}>Start Curating <ArrowRight size={16}/></Button>
                        </div>
                    </motion.div>
                )}

                {step === 'genre' && (
                    <motion.div key="genre" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="text-center">
                         <Button variant="ghost" className="mb-8" onClick={() => setStep("intro")}><ArrowLeft size={14}/> Back</Button>
                         <h2 className="text-3xl md:text-4xl font-bold mb-8">Pick a Genre.</h2>
                         <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
                            {GENRES.map(g => (
                                <button key={g} onClick={() => handleGenreSelect(g)} className="w-full sm:w-auto px-8 py-6 rounded-xl border border-zinc-200 bg-white hover:border-black hover:shadow-lg transition-all text-xl font-bold">
                                    {g}
                                </button>
                            ))}
                         </div>
                    </motion.div>
                )}

                {step === 'loading' && <motion.div key="loading" exit={{opacity:0}}><MovieLoader /></motion.div>}

                {step === 'select' && (
                    <motion.div key="select" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="pb-20">
                        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                            <div>
                                <h2 className="text-3xl font-bold">Refine your taste.</h2>
                                <p className="text-zinc-500">Select 3 {genre} titles you enjoyed.</p>
                            </div>
                            <Button onClick={handleGetResults} disabled={selectedMovies.length < 1} size="lg" className="w-full md:w-auto px-8">View Results <ArrowRight size={16}/></Button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
                            {selectionItems.map(item => {
                                const active = selectedMovies.includes(item.title);
                                return (
                                    <div key={item.id} onClick={() => toggleSelection(item.title)} className={`relative cursor-pointer transition-all ${active ? 'ring-4 ring-black rounded-lg scale-95' : 'hover:opacity-80'}`}>
                                        <img src={item.poster || "/placeholder.jpg"} className="rounded-lg aspect-[2/3] object-cover w-full h-full"/>
                                        {active && <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold rounded-lg">SELECTED</div>}
                                    </div>
                                )
                            })}
                        </div>
                    </motion.div>
                )}

                {step === 'results' && (
                    <motion.div key="results" initial={{opacity:0}} animate={{opacity:1}} className="pb-20">
                         <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl md:text-3xl font-bold">Top Picks for</h2>
                            <Button variant="outline" onClick={() => setStep("intro")}>Start Over</Button>
                         </div>
                         <div className="grid grid-cols-1 place-items-center sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {results.map(item => (
                                <div key={item.id} onClick={() => onSelect(item)} className="cursor-pointer">
                                    <DirectionAwareHover imageUrl={item.poster || ""}>
                                        <div className="space-y-1">
                                            <p className="font-bold text-xl leading-tight line-clamp-2">{item.title}</p>
                                            <p className="text-xs text-gray-300">Match: {Math.round((item.score || 0)*100)}%</p>
                                            <p className="text-xs text-gray-400 mt-2 line-clamp-2">{item.reason}</p>
                                        </div>
                                    </DirectionAwareHover>
                                </div>
                            ))}
                         </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

const fetchImagesWithDelay = async (items: any[]) => {
    const res = [];
    for (const item of items) {
      const poster = await getPosterUrl(Number(item.id), item.type, item.title);
      res.push({ ...item, poster });
      await new Promise(r => setTimeout(r, 80));
    }
    return res;
};