"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Film, Plus, Clock, Star, AlertCircle, CheckCircle2 } from "lucide-react";

interface Movie {
  id: string;
  title: string;
  slug: string;
  synopsis: string;
  durationMinutes: number;
  contentRating: string;
  language: string;
  posterUrl: string;
  isFeatured: boolean;
  isActive: boolean;
}

interface Genre {
  id: string;
  name: string;
}

export default function AdminMoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // New movie form states
  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("120");
  const [contentRating, setContentRating] = useState("PG-13");
  const [language, setLanguage] = useState("English");
  const [posterUrl, setPosterUrl] = useState(
    "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80"
  );
  const [backdropUrl, setBackdropUrl] = useState(
    "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1600&auto=format&fit=crop&q=80"
  );
  const [trailerUrl, setTrailerUrl] = useState("https://www.youtube.com");
  const [isFeatured, setIsFeatured] = useState(false);
  const [selectedGenreIds, setSelectedGenreIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchMovies = () => {
    fetch("/api/admin/movies")
      .then((res) => res.json())
      .then((data) => {
        if (data?.movies) setMovies(data.movies);
        if (data?.genres) setGenres(data.genres);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const handleAddMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError(null);

    try {
      const res = await fetch("/api/admin/movies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          synopsis,
          durationMinutes: parseInt(durationMinutes, 10),
          contentRating,
          language,
          posterUrl,
          backdropUrl,
          trailerUrl,
          isFeatured,
          genreIds: selectedGenreIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setModalError(data.error || "Failed to create movie");
        return;
      }

      setShowAddModal(false);
      setTitle("");
      setSynopsis("");
      fetchMovies();
    } catch (err) {
      setModalError("Network error while creating movie.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cine-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Film className="w-5 h-5 text-amber-400" />
            Movie Catalog Manager
          </h2>
          <p className="text-xs text-slate-400">
            Publish films, configure runtime details, and feature blockbusters.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-cine-950 flex items-center gap-1.5 shadow-gold transition-all"
        >
          <Plus className="w-4 h-4" />
          Add New Movie
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-xs text-slate-400">
          Loading catalog...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {movies.map((m) => (
            <div
              key={m.id}
              className="bg-cine-900/80 border border-cine-800 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between"
            >
              <div className="relative aspect-[16/9] w-full bg-cine-950">
                <Image
                  src={m.posterUrl}
                  alt={m.title}
                  fill
                  className="object-cover"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-cine-950/80 text-white border border-white/20">
                  {m.contentRating}
                </span>
                {m.isFeatured && (
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-cine-950">
                    Featured
                  </span>
                )}
              </div>

              <div className="p-4 space-y-2">
                <h3 className="text-sm font-bold text-white truncate">
                  {m.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2">
                  {m.synopsis}
                </p>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-cine-800">
                  <span>{m.durationMinutes} min</span>
                  <span>{m.language}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Movie Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-cine-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-cine-900 border border-cine-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white">Add New Movie</h3>

            {modalError && (
              <div className="p-3 bg-red-950 border border-red-800 text-red-300 text-xs rounded-xl">
                {modalError}
              </div>
            )}

            <form onSubmit={handleAddMovie} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Movie Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Gladiator II"
                  className="w-full px-3 py-2 bg-cine-950 border border-cine-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Synopsis
                </label>
                <textarea
                  required
                  rows={3}
                  value={synopsis}
                  onChange={(e) => setSynopsis(e.target.value)}
                  placeholder="Compelling synopsis of the movie..."
                  className="w-full px-3 py-2 bg-cine-950 border border-cine-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Duration (Min)
                  </label>
                  <input
                    type="number"
                    required
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full px-3 py-2 bg-cine-950 border border-cine-700 rounded-xl text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Rating
                  </label>
                  <select
                    value={contentRating}
                    onChange={(e) => setContentRating(e.target.value)}
                    className="w-full px-3 py-2 bg-cine-950 border border-cine-700 rounded-xl text-white text-sm"
                  >
                    <option value="G">G</option>
                    <option value="PG">PG</option>
                    <option value="PG-13">PG-13</option>
                    <option value="R">R</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Language
                  </label>
                  <input
                    type="text"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2 bg-cine-950 border border-cine-700 rounded-xl text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Poster Image URL
                </label>
                <input
                  type="url"
                  required
                  value={posterUrl}
                  onChange={(e) => setPosterUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-cine-950 border border-cine-700 rounded-xl text-white text-sm"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded bg-cine-950 border-cine-700"
                />
                <label htmlFor="featured" className="text-slate-300 font-medium">
                  Feature this movie on homepage banner
                </label>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-cine-950 border border-cine-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-cine-950 rounded-xl font-bold transition-colors"
                >
                  {submitting ? "Saving..." : "Create Movie"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
