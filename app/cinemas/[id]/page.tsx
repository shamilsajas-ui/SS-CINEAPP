"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Film,
  Calendar,
  Clock,
  Ticket,
  ChevronLeft,
} from "lucide-react";

interface ShowtimeItem {
  id: string;
  movieId: string;
  movieTitle: string;
  moviePoster: string;
  movieRating: string;
  movieDuration: number;
  startTime: string;
  endTime: string;
  format: string;
  basePriceMinorUnits: number;
  auditoriumName: string;
}

interface CinemaDetails {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  amenities: string[];
}

export default function CinemaSchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [cinema, setCinema] = useState<CinemaDetails | null>(null);
  const [showtimes, setShowtimes] = useState<ShowtimeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/cinemas/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.cinema) {
          setCinema(data.cinema);
          setShowtimes(data.showtimes || []);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-slate-400">Loading cinema schedule...</p>
      </div>
    );
  }

  if (!cinema) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Cinema Not Found</h2>
        <Link
          href="/cinemas"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Cinemas
        </Link>
      </div>
    );
  }

  // Group showtimes by movie
  const moviesMap = new Map<string, { info: any; showtimes: ShowtimeItem[] }>();
  for (const st of showtimes) {
    if (!moviesMap.has(st.movieId)) {
      moviesMap.set(st.movieId, {
        info: {
          id: st.movieId,
          title: st.movieTitle,
          poster: st.moviePoster,
          rating: st.movieRating,
          duration: st.movieDuration,
        },
        showtimes: [],
      });
    }
    moviesMap.get(st.movieId)!.showtimes.push(st);
  }

  const groupedMovies = Array.from(moviesMap.values());

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-3 border-b border-cine-800 pb-6">
        <Link
          href="/cinemas"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          All Cinemas
        </Link>

        <h1 className="text-3xl font-black text-white tracking-tight">
          {cinema.name}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-cine-gold" />
            {cinema.address}, {cinema.city}, {cinema.state} {cinema.postalCode}
          </span>
          {cinema.phone && (
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-indigo-400" />
              {cinema.phone}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 pt-2">
          {cinema.amenities?.map((a, idx) => (
            <span
              key={idx}
              className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-cine-900 border border-cine-700 text-indigo-300"
            >
              {a}
            </span>
          ))}
        </div>
      </div>

      {/* Schedule by Movie */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Film className="w-5 h-5 text-cine-accent" />
          Today's Scheduled Movies & Showtimes
        </h2>

        {groupedMovies.length === 0 ? (
          <div className="text-center py-16 bg-cine-900/40 border border-cine-800 rounded-2xl text-xs text-slate-400">
            No showtimes currently scheduled at this cinema today.
          </div>
        ) : (
          <div className="space-y-6">
            {groupedMovies.map(({ info, showtimes }) => (
              <div
                key={info.id}
                className="bg-cine-900/80 border border-cine-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row gap-6"
              >
                {/* Movie mini info */}
                <div className="md:w-64 space-y-2 shrink-0">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cine-950 border border-white/20 text-white">
                    {info.rating}
                  </span>
                  <h3 className="text-lg font-bold text-white">{info.title}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    {info.duration} min
                  </p>
                  <Link
                    href={`/movies/${info.id}`}
                    className="inline-block text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                  >
                    Movie Details →
                  </Link>
                </div>

                {/* Showtimes buttons */}
                <div className="flex-1">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {showtimes.map((st) => {
                      const startTime = new Date(st.startTime).toLocaleTimeString(
                        "en-US",
                        { hour: "numeric", minute: "2-digit" }
                      );
                      const price = (st.basePriceMinorUnits / 100).toFixed(2);

                      return (
                        <Link
                          key={st.id}
                          href={`/showtimes/${st.id}/seats`}
                          className="p-3 bg-cine-950 border border-cine-700 hover:border-indigo-500 rounded-xl transition-all hover:scale-[1.02] text-center space-y-1"
                        >
                          <div className="text-sm font-extrabold text-white">
                            {startTime}
                          </div>
                          <div className="text-[10px] text-indigo-300 font-semibold truncate">
                            {st.format}
                          </div>
                          <div className="text-[11px] font-bold text-cine-gold">
                            ${price}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
