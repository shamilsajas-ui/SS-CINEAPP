"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Clock,
  Calendar,
  MapPin,
  Play,
  Ticket,
  ChevronLeft,
  Sparkles,
  Info,
} from "lucide-react";

interface Showtime {
  id: string;
  startTime: string;
  endTime: string;
  basePriceMinorUnits: number;
  format: string;
  auditorium: {
    id: string;
    name: string;
    screenType: string;
    totalSeats: number;
  };
}

interface CinemaGroup {
  id: string;
  name: string;
  address: string;
  city: string;
  showtimes: Showtime[];
}

interface MovieDetails {
  id: string;
  title: string;
  synopsis: string;
  durationMinutes: number;
  contentRating: string;
  language: string;
  releaseDate: string;
  posterUrl: string;
  backdropUrl: string;
  trailerUrl: string | null;
  genres: { id: string; name: string }[];
}

export default function MovieDetailsClient({ id }: { id: string }) {
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [cinemas, setCinemas] = useState<CinemaGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(0);

  useEffect(() => {
    fetch(`/api/movies/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.movie) {
          setMovie(data.movie);
          setCinemas(data.cinemas || data.cinemasWithShowtimes || []);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 text-sm">Loading movie details and schedules...</p>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Movie Not Found</h2>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Movies
        </Link>
      </div>
    );
  }

  // Filter showtimes for the selected day offset
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + selectedDay);

  const dayPills = [0, 1, 2].map((offset) => {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    return {
      offset,
      dayName:
        offset === 0
          ? "Today"
          : offset === 1
          ? "Tomorrow"
          : d.toLocaleDateString("en-US", { weekday: "short" }),
      dateLabel: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    };
  });

  return (
    <div className="space-y-12 pb-20">
      {/* Movie Backdrop Header */}
      <div className="relative w-full min-h-[460px] flex items-end overflow-hidden border-b border-cine-800">
        <div className="absolute inset-0 z-0">
          <Image
            src={movie.backdropUrl}
            alt={movie.title}
            fill
            priority
            className="object-cover object-center opacity-30 brightness-75 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-cine-950 via-cine-950/80 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to All Movies
          </Link>

          <div className="flex flex-col md:flex-row gap-8 items-start md:items-end">
            {/* Poster */}
            <div className="relative w-44 sm:w-52 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10 shrink-0 hidden sm:block bg-cine-900">
              <Image
                src={movie.posterUrl}
                alt={movie.title}
                fill
                className="object-cover"
              />
            </div>

            {/* Info */}
            <div className="space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-white/10 border border-white/20 text-white">
                  {movie.contentRating}
                </span>
                <span className="text-xs text-slate-300 font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  {movie.durationMinutes} min
                </span>
                <span className="text-xs text-indigo-300 font-medium px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-500/20">
                  {movie.language}
                </span>
                <span className="text-xs text-slate-400">
                  Released: {movie.releaseDate}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                {movie.title}
              </h1>

              <div className="flex flex-wrap gap-2">
                {movie.genres?.map((g) => (
                  <span
                    key={g.id}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-cine-800 border border-cine-700 text-slate-200"
                  >
                    {g.name}
                  </span>
                ))}
              </div>

              <p className="text-sm text-slate-300 leading-relaxed pt-2">
                {movie.synopsis}
              </p>

              {movie.trailerUrl && (
                <div className="pt-2">
                  <a
                    href={movie.trailerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-cine-900 border border-cine-700 hover:border-slate-400 text-white transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 text-cine-gold" />
                    Watch Official Trailer
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Showtimes & Booking Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-cine-800">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Ticket className="w-6 h-6 text-cine-accent" />
              Select Showtime & Auditorium
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Choose your preferred cinema, screen format, and time slot to book your seats.
            </p>
          </div>

          {/* Day Selector Pills */}
          <div className="flex items-center gap-2 bg-cine-900 p-1.5 rounded-2xl border border-cine-800">
            {dayPills.map((p) => (
              <button
                key={p.offset}
                onClick={() => setSelectedDay(p.offset)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all text-center ${
                  selectedDay === p.offset
                    ? "bg-cine-accent text-white shadow-glow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <div className="text-[11px] font-semibold uppercase">{p.dayName}</div>
                <div className="text-xs">{p.dateLabel}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Cinemas with Showtimes */}
        {cinemas.length === 0 ? (
          <div className="text-center py-16 bg-cine-900/50 rounded-2xl border border-cine-800">
            <p className="text-sm text-slate-400">
              No scheduled showtimes currently listed for this movie.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {cinemas.map((cinema) => {
              // Filter showtimes matching the selected day
              const filteredShowtimes = (cinema.showtimes || []).filter((st) => {
                const stDate = new Date(st.startTime);
                return (
                  stDate.getFullYear() === targetDate.getFullYear() &&
                  stDate.getMonth() === targetDate.getMonth() &&
                  stDate.getDate() === targetDate.getDate()
                );
              });

              if (filteredShowtimes.length === 0) return null;

              return (
                <div
                  key={cinema.id}
                  className="bg-cine-900/80 border border-cine-800 rounded-2xl p-6 shadow-xl space-y-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cine-800/80 pb-4">
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-cine-gold" />
                        {cinema.name}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {cinema.address}, {cinema.city}
                      </p>
                    </div>
                    <Link
                      href={`/cinemas/${cinema.id}`}
                      className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                    >
                      View Cinema Info →
                    </Link>
                  </div>

                  {/* Showtime Buttons Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredShowtimes.map((st) => {
                      const startTimeFormatted = new Date(
                        st.startTime
                      ).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      });

                      const priceFormatted = (st.basePriceMinorUnits / 100).toFixed(2);

                      return (
                        <Link
                          key={st.id}
                          href={`/showtimes/${st.id}/seats`}
                          className="group relative p-4 rounded-xl bg-cine-950 border border-cine-700/70 hover:border-indigo-500 transition-all duration-200 hover:-translate-y-1 hover:shadow-glow flex flex-col justify-between space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-base font-extrabold text-white group-hover:text-indigo-300 transition-colors">
                              {startTimeFormatted}
                            </span>
                            <span className="text-xs font-bold text-cine-gold">
                              ${priceFormatted}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <div className="text-xs font-semibold text-slate-300">
                              {st.auditorium.name}
                            </div>
                            <div className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 border border-indigo-500/30 text-indigo-300">
                              {st.format}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-cine-800 flex items-center justify-between text-[11px] text-slate-400 group-hover:text-indigo-200">
                            <span>Select Seats</span>
                            <span>→</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
