"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  Ticket,
  Play,
  Filter,
  X,
  Star,
  Film,
} from "lucide-react";

interface Genre {
  id: string;
  name: string;
  slug: string;
}

interface Movie {
  id: string;
  title: string;
  slug: string;
  synopsis: string;
  durationMinutes: number;
  contentRating: string;
  language: string;
  releaseDate: string;
  posterUrl: string;
  backdropUrl: string;
  trailerUrl: string | null;
  isFeatured: boolean;
  genres: Genre[];
}

interface Cinema {
  id: string;
  name: string;
  city: string;
}

export default function HomePage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [selectedLanguage, setSelectedLanguage] = useState("ALL");
  const [selectedCinema, setSelectedCinema] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  // Dates for the next 5 days
  const dateOptions = Array.from({ length: 5 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const label =
      i === 0
        ? "Today"
        : i === 1
        ? "Tomorrow"
        : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    return { dateStr, label };
  });

  // Fetch cinemas on mount
  useEffect(() => {
    fetch("/api/cinemas")
      .then((res) => res.json())
      .then((data) => {
        if (data?.cinemas) setCinemas(data.cinemas);
      })
      .catch(console.error);
  }, []);

  // Fetch movies whenever filters change
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (selectedGenre !== "all") params.set("genre", selectedGenre);
    if (selectedLanguage !== "ALL") params.set("language", selectedLanguage);
    if (selectedCinema) params.set("cinemaId", selectedCinema);
    if (selectedDate) params.set("date", selectedDate);

    fetch(`/api/movies?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.movies) setMovies(data.movies);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [searchQuery, selectedGenre, selectedLanguage, selectedCinema, selectedDate]);

  const featuredMovie = movies.find((m) => m.isFeatured) || movies[0];

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedGenre("all");
    setSelectedLanguage("ALL");
    setSelectedCinema("");
    setSelectedDate("");
  };

  const hasActiveFilters =
    Boolean(searchQuery) ||
    selectedGenre !== "all" ||
    selectedLanguage !== "ALL" ||
    Boolean(selectedCinema) ||
    Boolean(selectedDate);

  const genresList = [
    { name: "All Genres", slug: "all" },
    { name: "Sci-Fi", slug: "sci-fi" },
    { name: "Action", slug: "action" },
    { name: "Drama", slug: "drama" },
    { name: "Animation", slug: "animation" },
    { name: "Thriller", slug: "thriller" },
  ];

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Spotlight Section */}
      {featuredMovie && !hasActiveFilters && (
        <section className="relative w-full min-h-[500px] lg:min-h-[560px] flex items-end overflow-hidden border-b border-cine-800">
          <div className="absolute inset-0 z-0">
            <Image
              src={featuredMovie.backdropUrl}
              alt={featuredMovie.title}
              fill
              priority
              className="object-cover object-center opacity-40 brightness-75 scale-105 filter blur-[0.5px]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-cine-950 via-cine-950/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-cine-950 via-cine-950/80 to-transparent" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full flex flex-col justify-end">
            <div className="max-w-2xl space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-cine-gold text-cine-950 flex items-center gap-1 shadow-gold">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  Featured Blockbuster
                </span>
                <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-white/10 border border-white/20 text-white">
                  {featuredMovie.contentRating}
                </span>
                <span className="text-xs text-slate-300 font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  {featuredMovie.durationMinutes} min
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-lg">
                {featuredMovie.title}
              </h1>

              <p className="text-sm sm:text-base text-slate-300 line-clamp-3 leading-relaxed">
                {featuredMovie.synopsis}
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {featuredMovie.genres?.map((g) => (
                  <span
                    key={g.id}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-cine-800/80 border border-cine-700 text-indigo-300"
                  >
                    {g.name}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Link
                  href={`/movies/${featuredMovie.id}`}
                  className="px-6 py-3.5 rounded-xl font-bold text-sm bg-cine-accent hover:bg-indigo-600 text-white flex items-center gap-2 shadow-glow hover:shadow-indigo-500/50 transition-all scale-100 hover:scale-[1.02]"
                >
                  <Ticket className="w-4 h-4" />
                  Select Seats & Book Tickets
                </Link>
                {featuredMovie.trailerUrl && (
                  <a
                    href={featuredMovie.trailerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-3.5 rounded-xl font-semibold text-sm bg-cine-900/90 border border-cine-700 hover:border-slate-400 text-slate-200 flex items-center gap-2 transition-colors"
                  >
                    <Play className="w-4 h-4 text-cine-gold" />
                    Watch Trailer
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Content & Discovery Filter Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Filter Navigation Bar */}
        <div className="bg-cine-900/90 border border-cine-800 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-md space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="md:col-span-4 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search movies by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-cine-950 border border-cine-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Cinema Dropdown */}
            <div className="md:col-span-3 relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                value={selectedCinema}
                onChange={(e) => setSelectedCinema(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 bg-cine-950 border border-cine-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer"
              >
                <option value="">All Partner Cinemas</option>
                {cinemas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.city})
                  </option>
                ))}
              </select>
            </div>

            {/* Language Selector */}
            <div className="md:col-span-2">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full px-3 py-2.5 bg-cine-950 border border-cine-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer"
              >
                <option value="ALL">All Languages</option>
                <option value="English">English</option>
                <option value="Korean">Korean</option>
                <option value="Japanese">Japanese</option>
              </select>
            </div>

            {/* Date Quick Selector */}
            <div className="md:col-span-3">
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-cine-950 border border-cine-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer"
              >
                <option value="">Any Showtime Date</option>
                {dateOptions.map((d) => (
                  <option key={d.dateStr} value={d.dateStr}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Genre Pills */}
          <div className="flex items-center justify-between pt-2 border-t border-cine-800/80 overflow-x-auto">
            <div className="flex items-center gap-2 py-1">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5" />
                Genres:
              </span>
              {genresList.map((g) => (
                <button
                  key={g.slug}
                  onClick={() => setSelectedGenre(g.slug)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedGenre === g.slug
                      ? "bg-indigo-600 text-white shadow-glow"
                      : "bg-cine-950 text-slate-400 hover:text-white hover:bg-cine-800"
                  }`}
                >
                  {g.name}
                </button>
              ))}
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold whitespace-nowrap flex items-center gap-1 pl-4"
              >
                <X className="w-3.5 h-3.5" />
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Section Heading */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Film className="w-6 h-6 text-cine-accent" />
              Now Showing in Theaters
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Showing {movies.length} {movies.length === 1 ? "movie" : "movies"} available for booking
            </p>
          </div>
        </div>

        {/* Movies Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-96 rounded-2xl bg-cine-900 border border-cine-800 animate-pulse flex flex-col justify-end p-4 space-y-3"
              >
                <div className="h-4 bg-cine-800 rounded w-3/4" />
                <div className="h-3 bg-cine-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : movies.length === 0 ? (
          <div className="text-center py-20 bg-cine-900/50 border border-cine-800 rounded-3xl p-8 space-y-4">
            <Film className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-lg font-bold text-white">No Movies Match Your Criteria</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              We couldn't find any scheduled showtimes matching your selected filters.
            </p>
            <button
              onClick={clearFilters}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {movies.map((movie) => (
              <div
                key={movie.id}
                className="group relative bg-cine-900/80 border border-cine-800/80 hover:border-indigo-500/50 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-1.5 flex flex-col"
              >
                {/* Poster Container */}
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-cine-950">
                  <Image
                    src={movie.posterUrl}
                    alt={movie.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-cine-900 via-transparent to-transparent opacity-80" />

                  {/* Rating Badge */}
                  <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-[11px] font-extrabold bg-cine-950/80 backdrop-blur-md border border-white/20 text-white">
                    {movie.contentRating}
                  </span>

                  {/* Language */}
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-950/80 backdrop-blur-md border border-indigo-500/30 text-indigo-300">
                    {movie.language}
                  </span>
                </div>

                {/* Info Container */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      {movie.durationMinutes} min
                    </div>
                    <h3 className="font-black text-white text-base group-hover:text-indigo-300 transition-colors line-clamp-1">
                      {movie.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {movie.synopsis}
                    </p>
                  </div>

                  {/* Genre Pills */}
                  <div className="flex flex-wrap gap-1">
                    {movie.genres?.slice(0, 2).map((g) => (
                      <span
                        key={g.id}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cine-800 text-slate-300"
                      >
                        {g.name}
                      </span>
                    ))}
                  </div>

                  {/* Booking Button */}
                  <Link
                    href={`/movies/${movie.id}`}
                    className="w-full py-2.5 rounded-xl font-bold text-xs text-center bg-cine-accent hover:bg-indigo-600 text-white flex items-center justify-center gap-2 shadow-glow transition-all"
                  >
                    <Ticket className="w-3.5 h-3.5" />
                    Book Showtimes
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
