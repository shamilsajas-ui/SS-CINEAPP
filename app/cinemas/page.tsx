"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MapPin, Phone, Sparkles, Film, ChevronRight } from "lucide-react";

interface CinemaItem {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  amenities: string[];
  auditoriums: { id: string; name: string; screenType: string }[];
}

export default function CinemasDirectoryPage() {
  const [cinemas, setCinemas] = useState<CinemaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cinemas")
      .then((res) => res.json())
      .then((data) => {
        if (data?.cinemas) setCinemas(data.cinemas);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-cine-800 pb-4 space-y-1">
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
          <MapPin className="w-7 h-7 text-cine-gold" />
          Partner Cinemas & IMAX Venues
        </h1>
        <p className="text-xs text-slate-400">
          Experience films in ultra-premium projection with Dolby Atmos, IMAX 70mm, and VIP recliners.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-xs text-slate-400">Loading cinema locations...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cinemas.map((cinema) => (
            <div
              key={cinema.id}
              className="bg-cine-900/80 border border-cine-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-6 hover:border-indigo-500/50 transition-all hover:-translate-y-1"
            >
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">{cinema.name}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-cine-gold shrink-0" />
                    {cinema.address}, {cinema.city}, {cinema.state} {cinema.postalCode}
                  </p>
                  {cinema.phone && (
                    <p className="text-xs text-slate-400 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      {cinema.phone}
                    </p>
                  )}
                </div>

                {/* Amenities */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Auditorium Features
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {cinema.amenities?.map((amenity, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-cine-950 border border-cine-700/80 text-indigo-300"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Screens */}
                <div className="space-y-1 text-xs text-slate-400 pt-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Screens ({cinema.auditoriums?.length || 0})
                  </span>
                  <div className="text-slate-300 text-xs">
                    {cinema.auditoriums?.map((a) => a.name).join(" • ")}
                  </div>
                </div>
              </div>

              <Link
                href={`/cinemas/${cinema.id}`}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-center bg-cine-accent hover:bg-indigo-600 text-white shadow-glow transition-all flex items-center justify-center gap-1.5"
              >
                <span>View Daily Showtimes</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
