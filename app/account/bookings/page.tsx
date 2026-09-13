"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Ticket,
  Calendar,
  Clock,
  MapPin,
  XCircle,
  AlertTriangle,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

interface BookingItem {
  id: string;
  bookingReference: string;
  status: "CONFIRMED" | "PENDING" | "CANCELLED" | "EXPIRED";
  totalMinorUnits: number;
  createdAt: string;
  showtimeId: string;
  startTime: string;
  format: string;
  movieTitle: string;
  cinemaName: string;
  auditoriumName: string;
  seats: { row: string; number: number; type: string }[];
  tickets: { id: string; ticketCode: string; status: string }[];
}

export default function BookingHistoryPage() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

  // Cancellation modal state
  const [cancellingBooking, setCancellingBooking] = useState<BookingItem | null>(null);
  const [submittingCancel, setSubmittingCancel] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const fetchBookings = () => {
    fetch("/api/bookings")
      .then((res) => res.json())
      .then((data) => {
        if (data?.bookings) {
          setBookings(data.bookings);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async () => {
    if (!cancellingBooking) return;
    setSubmittingCancel(true);
    setCancelError(null);

    try {
      const res = await fetch(`/api/bookings/${cancellingBooking.id}/cancel`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setCancelError(data.error || "Failed to cancel booking");
        return;
      }

      setCancellingBooking(null);
      fetchBookings();
    } catch (err) {
      setCancelError("Network error while cancelling booking.");
    } finally {
      setSubmittingCancel(false);
    }
  };

  const now = new Date();
  const upcomingBookings = bookings.filter((b) => new Date(b.startTime) >= now);
  const pastBookings = bookings.filter((b) => new Date(b.startTime) < now);

  const displayedList = activeTab === "upcoming" ? upcomingBookings : pastBookings;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cine-800 pb-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Ticket className="w-7 h-7 text-cine-accent" />
            My Bookings & Passes
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Access your active digital admission passes or review previous transactions.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-cine-900 p-1 rounded-xl border border-cine-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === "upcoming"
                ? "bg-cine-accent text-white shadow-glow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Upcoming ({upcomingBookings.length})
          </button>
          <button
            onClick={() => setActiveTab("past")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === "past"
                ? "bg-cine-accent text-white shadow-glow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Past Movies ({pastBookings.length})
          </button>
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-xs text-slate-400">Loading your reservations...</p>
        </div>
      ) : displayedList.length === 0 ? (
        <div className="text-center py-16 bg-cine-900/50 border border-cine-800 rounded-3xl p-8 space-y-4">
          <Ticket className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">
            No {activeTab} bookings found
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Ready for your next movie experience? Discover the latest blockbuster showtimes.
          </p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 rounded-xl text-xs font-semibold bg-cine-accent hover:bg-indigo-600 text-white transition-colors"
          >
            Explore Now Showing
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedList.map((b) => {
            const startDate = new Date(b.startTime).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            });
            const startTime = new Date(b.startTime).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            });

            // Cancellation eligibility: at least 2 hours before showtime
            const hoursUntilShowtime =
              (new Date(b.startTime).getTime() - new Date().getTime()) /
              (1000 * 60 * 60);
            const canCancel =
              (b.status === "CONFIRMED" || b.status === "PENDING") &&
              hoursUntilShowtime >= 2;

            return (
              <div
                key={b.id}
                className="bg-cine-900/80 border border-cine-800 rounded-2xl p-6 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-cine-700 transition-colors"
              >
                {/* Left: Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase ${
                        b.status === "CONFIRMED"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30"
                          : b.status === "CANCELLED"
                          ? "bg-red-950 text-red-400 border border-red-500/30"
                          : "bg-amber-950 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {b.status}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      REF: {b.bookingReference}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-cine-950 text-indigo-300 font-semibold border border-indigo-500/20">
                      {b.format}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white">{b.movieTitle}</h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-cine-gold" />
                      {startDate} at {startTime}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-cine-gold" />
                      {b.cinemaName} • {b.auditoriumName}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 pt-1">
                    Seats:{" "}
                    {b.seats.map((s) => `Row ${s.row}-${s.number}`).join(", ")}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  {b.status === "CONFIRMED" && (
                    <Link
                      href={`/tickets/${b.id}`}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-cine-accent hover:bg-indigo-600 text-white shadow-glow transition-all flex items-center gap-1.5"
                    >
                      <Ticket className="w-4 h-4" />
                      View QR Pass
                    </Link>
                  )}

                  {canCancel && (
                    <button
                      onClick={() => setCancellingBooking(b)}
                      className="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-cine-950 border border-cine-700 text-slate-400 hover:text-red-400 hover:border-red-500/50 transition-colors"
                    >
                      Cancel Booking
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Booking Confirmation Modal */}
      {cancellingBooking && (
        <div className="fixed inset-0 z-50 bg-cine-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-cine-900 border border-cine-700 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-white">
                Cancel Booking {cancellingBooking.bookingReference}?
              </h3>
              <p className="text-xs text-slate-400">
                Are you sure you want to cancel your reservation for{" "}
                <span className="text-white font-semibold">
                  {cancellingBooking.movieTitle}
                </span>
                ? Your seats will be released back to the auditorium.
              </p>
            </div>

            {cancelError && (
              <div className="p-3 rounded-xl bg-red-950 border border-red-800 text-red-300 text-xs">
                {cancelError}
              </div>
            )}

            <div className="p-3 bg-cine-950 rounded-xl border border-cine-800 text-xs text-slate-300 space-y-1">
              <div className="flex justify-between">
                <span>Refund Amount:</span>
                <span className="text-cine-gold font-bold">
                  ${(cancellingBooking.totalMinorUnits / 100).toFixed(2)}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Refund will be credited back to your original payment method.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                disabled={submittingCancel}
                onClick={() => setCancellingBooking(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-cine-950 border border-cine-700 text-slate-300 hover:text-white"
              >
                Keep Booking
              </button>
              <button
                disabled={submittingCancel}
                onClick={handleCancelBooking}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors flex items-center justify-center gap-1.5"
              >
                {submittingCancel ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
