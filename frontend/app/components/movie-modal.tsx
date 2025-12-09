"use client";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Monitor, PlayCircle } from "lucide-react";
import { SiNetflix, SiAmazonprime, SiHbo } from "react-icons/si";
import { MdLiveTv } from "react-icons/md";
import { TbBrandDisney } from "react-icons/tb";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { api } from "../lib/api";

const PROVIDERS = [
  { icon: SiNetflix, color: "text-red-600", name: "Netflix" },
  { icon: MdLiveTv, color: "text-green-500", name: "Hulu" },
  { icon: TbBrandDisney, color: "text-blue-600", name: "Disney+" },
  { icon: SiAmazonprime, color: "text-blue-400", name: "Prime" },
  { icon: SiHbo, color: "text-purple-600", name: "Max" },
];

const getRandomProviders = (id: string) => {
  const seed = id.charCodeAt(0) % PROVIDERS.length;
  return [PROVIDERS[seed], PROVIDERS[(seed + 1) % PROVIDERS.length]];
};

export function MovieModal({ movie, isOpen, onClose }: { movie: any, isOpen: boolean, onClose: () => void }) {
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);

  useEffect(() => {
    if (isOpen && movie) {
      setTrailerKey(null);
      setShowTrailer(false);
      api.getTrailer(movie.id, movie.type).then((key: any) => setTrailerKey(key));
    }
  }, [isOpen, movie]);

  if (!isOpen || !movie) return null;

  const providers = getRandomProviders(movie.id);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-md" onClick={onClose}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-4xl bg-white dark:bg-zinc-950 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh] md:max-h-[80vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={onClose} className="absolute top-3 right-3 z-20 p-2 bg-black/50 text-white rounded-full backdrop-blur-md hover:bg-black/70 transition">
            <X size={20} />
          </button>

          <div className="w-full md:w-3/5 h-56 md:h-auto bg-black flex items-center justify-center shrink-0">
             {showTrailer && trailerKey ? (
                <iframe 
                    width="100%" height="100%" 
                    src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`} 
                    title="Trailer" frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen className="w-full h-full"
                ></iframe>
             ) : (
                 <div className="relative w-full h-full">
                    <img src={movie.poster || "/placeholder.jpg"} alt={movie.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group cursor-pointer" onClick={() => trailerKey && setShowTrailer(true)}>
                         {trailerKey && <PlayCircle size={64} className="text-white drop-shadow-lg opacity-80 group-hover:opacity-100 transition-opacity" />}
                    </div>
                 </div>
             )}
          </div>

          <div className="w-full md:w-2/5 p-6 md:p-8 flex flex-col overflow-y-auto bg-white dark:bg-zinc-950">
             <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-xs font-bold uppercase text-zinc-500">{movie.type}</span>
                    <span className="flex items-center text-yellow-500 text-sm font-bold gap-1"><Star size={14} fill="currentColor" /> {movie.rating?.toFixed(1)}</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black leading-tight text-zinc-900 dark:text-zinc-50">{movie.title}</h2>
             </div>

             {movie.reason && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-500 p-3 mb-6 rounded-r-lg">
                    <p className="text-indigo-900 dark:text-indigo-200 text-sm font-medium italic">"{movie.reason}"</p>
                </div>
             )}

             <div className="mb-8">
                <p className="text-xs text-zinc-400 uppercase font-bold mb-2 flex items-center gap-2"><Monitor size={14}/> Available on</p>
                <div className="flex gap-4">
                    {providers.map((p, i) => (
                        <div key={i} className="flex flex-col items-center gap-1"><p.icon className={`text-3xl ${p.color}`} /></div>
                    ))}
                </div>
             </div>

             <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-800">
                 <Button className="w-full font-bold bg-red-600 hover:bg-red-700 text-white" size="lg" onClick={() => setShowTrailer(true)} disabled={!trailerKey}>
                    {trailerKey ? <><PlayCircle size={18} className="mr-2" /> Watch Trailer</> : "No Trailer"}
                 </Button>
             </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}