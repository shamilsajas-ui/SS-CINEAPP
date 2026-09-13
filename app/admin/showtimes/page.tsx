"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, Plus, Sparkles } from "lucide-react";

interface ShowtimeItem {
  id: string;
  startTime: string;
  endTime: string;
  format: string;
  basePriceMinorUnits: number;
  movieTitle: string;
  auditoriumName: string;
  cinemaName: string;
}

export default function AdminShowtimesPage() {
  const [showtimes, setShowtimes] = useState<ShowtimeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/showtimes")
      .then((res) => res.json())
      .then((data) => {
        if (data?.showtimes) setShowtimes(data.showtimes);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="border-b border-cine-800 pb-4 space-y-1">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-amber-400" />
          Showtimes Scheduler
        </h2>
        <p className="text-xs text-slate-400">
          Scheduled cinema presentations with auto-populated auditorium seat grids.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-xs text-slate-400">
          Loading showtimes...
        </div>
      ) : (
        <div className="bg-cine-900/90 border border-cine-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-cine-800 text-slate-400 font-semibold">
                  <th className="pb-3">Movie</th>
                  <th className="pb-3">Cinema Venue</th>
                  <th className="pb-3">Auditorium Screen</th>
                  <th className="pb-3">Format</th>
                  <th className="pb-3">Showtime Start</th>
                  <th className="pb-3">Base Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cine-800/60">
                {showtimes.map((st) => (
                  <tr key={st.id} className="text-slate-300 hover:bg-cine-800/40">
                    <td className="py-3 font-bold text-white">{st.movieTitle}</td>
                    <td className="py-3 text-slate-400">{st.cinemaName}</td>
                    <td className="py-3 text-indigo-300 font-semibold">
                      {st.auditoriumName}
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded bg-cine-950 text-indigo-400 font-bold border border-indigo-500/20 text-[10px]">
                        {st.format}
                      </span>
                    </td>
                    <td className="py-3 text-slate-300">
                      {new Date(st.startTime).toLocaleString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3 font-mono font-semibold text-cine-gold">
                      ${(st.basePriceMinorUnits / 100).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
