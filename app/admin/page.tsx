"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  DollarSign,
  Ticket,
  Film,
  Users,
  Percent,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

interface AdminMetrics {
  totalRevenueMinorUnits: number;
  totalTicketsSold: number;
  activeMovies: number;
  occupancyRatePercentage: number;
  totalSeatsTracked: number;
  heldSeatsCount: number;
}

interface RecentBooking {
  id: string;
  bookingReference: string;
  status: string;
  totalMinorUnits: number;
  createdAt: string;
  userName: string;
  userEmail: string;
  movieTitle: string;
}

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/metrics")
      .then((res) => res.json())
      .then((data) => {
        if (data?.metrics) {
          setMetrics(data.metrics);
          setRecentBookings(data.recentBookings || []);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-slate-400">Loading system metrics...</p>
      </div>
    );
  }

  const revenueDollars = ((metrics?.totalRevenueMinorUnits || 0) / 100).toFixed(2);

  return (
    <div className="space-y-8">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-cine-900/90 border border-cine-800 rounded-2xl p-5 space-y-2 shadow-xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            ${revenueDollars}
          </div>
          <p className="text-[11px] text-emerald-400 font-medium">
            From confirmed bookings
          </p>
        </div>

        {/* Metric 2 */}
        <div className="bg-cine-900/90 border border-cine-800 rounded-2xl p-5 space-y-2 shadow-xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Tickets Issued</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {metrics?.totalTicketsSold || 0}
          </div>
          <p className="text-[11px] text-indigo-300 font-medium">
            With digital QR codes
          </p>
        </div>

        {/* Metric 3 */}
        <div className="bg-cine-900/90 border border-cine-800 rounded-2xl p-5 space-y-2 shadow-xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Auditorium Occupancy</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {metrics?.occupancyRatePercentage || 0}%
          </div>
          <p className="text-[11px] text-slate-400">
            Across {metrics?.totalSeatsTracked || 0} seats
          </p>
        </div>

        {/* Metric 4 */}
        <div className="bg-cine-900/90 border border-cine-800 rounded-2xl p-5 space-y-2 shadow-xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Active Movies</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Film className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {metrics?.activeMovies || 0}
          </div>
          <p className="text-[11px] text-amber-300">
            Currently scheduled
          </p>
        </div>
      </div>

      {/* Quick Ops & Scanner Action */}
      <div className="bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/30 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cine-gold" />
            Cinema Staff Ticket Validation Tool
          </h3>
          <p className="text-xs text-slate-300">
            Scan QR code or enter ticket reference to grant audience admission and update ticket status.
          </p>
        </div>
        <Link
          href="/admin/scanner"
          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-white text-cine-950 hover:bg-slate-200 transition-colors shrink-0 text-center"
        >
          Open Ticket Scanner
        </Link>
      </div>

      {/* Recent Bookings Table */}
      <div className="bg-cine-900/90 border border-cine-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white">Recent System Bookings</h3>

        {recentBookings.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">
            No bookings recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-cine-800 text-slate-400 font-semibold">
                  <th className="pb-3">Reference</th>
                  <th className="pb-3">Movie</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cine-800/60">
                {recentBookings.map((b) => (
                  <tr key={b.id} className="text-slate-300 hover:bg-cine-800/40">
                    <td className="py-3 font-mono font-bold text-indigo-300">
                      {b.bookingReference}
                    </td>
                    <td className="py-3 font-medium text-white">{b.movieTitle}</td>
                    <td className="py-3">
                      <div>{b.userName}</div>
                      <div className="text-[10px] text-slate-500">{b.userEmail}</div>
                    </td>
                    <td className="py-3 font-mono font-semibold text-cine-gold">
                      ${(b.totalMinorUnits / 100).toFixed(2)}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          b.status === "CONFIRMED"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30"
                            : b.status === "CANCELLED"
                            ? "bg-red-950 text-red-400 border border-red-500/30"
                            : "bg-amber-950 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400">
                      {new Date(b.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
