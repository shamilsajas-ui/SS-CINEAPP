"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Ticket,
  Clock,
  ShieldAlert,
  Armchair,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";

interface SeatItem {
  id: string; // showtime_seat id
  seatId: string;
  row: string;
  number: number;
  type: "REGULAR" | "PREMIUM" | "VIP" | "ACCESSIBLE";
  status: "AVAILABLE" | "HELD" | "BOOKED" | "BLOCKED";
  isHeldByMe: boolean;
  priceMinorUnits: number;
}

interface RowItem {
  rowLabel: string;
  seats: SeatItem[];
}

interface ShowtimeMeta {
  id: string;
  startTime: string;
  format: string;
  basePriceMinorUnits: number;
  movieTitle: string;
  moviePoster: string;
  movieRating: string;
  cinemaName: string;
  cinemaCity: string;
  auditoriumName: string;
  screenType: string;
}

export default function SeatSelectionClient({ id }: { id: string }) {
  const router = useRouter();

  const [showtime, setShowtime] = useState<ShowtimeMeta | null>(null);
  const [rows, setRows] = useState<RowItem[]>([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchSeatLayout = () => {
    fetch(`/api/showtimes/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.showtime) {
          setShowtime(data.showtime);
          setRows(data.rows || []);
        }
      })
      .catch((err) => console.error("Failed to load seats:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSeatLayout();
    // Poll for seat changes every 10 seconds for real-time occupancy
    const interval = setInterval(fetchSeatLayout, 10000);
    return () => clearInterval(interval);
  }, [id]);

  // Find all selected seat objects
  const allSeats = rows.flatMap((r) => r.seats);
  const selectedSeats = allSeats.filter((s) => selectedSeatIds.includes(s.id));

  // Pricing calculations
  const subtotalMinorUnits = selectedSeats.reduce(
    (sum, s) => sum + s.priceMinorUnits,
    0
  );
  const feeMinorUnits = selectedSeats.length * 150; // $1.50 per seat
  const taxMinorUnits = Math.round((subtotalMinorUnits + feeMinorUnits) * 0.085); // 8.5%
  const totalMinorUnits = subtotalMinorUnits + feeMinorUnits + taxMinorUnits;

  const toggleSeat = (seat: SeatItem) => {
    setErrorMessage(null);
    if (seat.status !== "AVAILABLE" && !seat.isHeldByMe) return;

    if (selectedSeatIds.includes(seat.id)) {
      setSelectedSeatIds(selectedSeatIds.filter((sid) => sid !== seat.id));
    } else {
      if (selectedSeatIds.length >= 8) {
        setErrorMessage("Maximum 8 seats allowed per booking transaction.");
        return;
      }
      setSelectedSeatIds([...selectedSeatIds, seat.id]);
    }
  };

  const handleProceedToHold = async () => {
    if (selectedSeatIds.length === 0) return;
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/bookings/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          showtimeId: id,
          showtimeSeatIds: selectedSeatIds,
        }),
      });

      const data = await res.json();

      if (res.status === 401) {
        // Redirect to login with return URL
        router.push(`/login?redirect=/showtimes/${id}/seats`);
        return;
      }

      if (!res.ok) {
        setErrorMessage(
          data.error || "Failed to hold seats. Someone may have just reserved them."
        );
        // Refresh seat map immediately
        fetchSeatLayout();
        return;
      }

      // Successful hold -> Navigate to checkout
      router.push(`/checkout/${data.id || data.bookingId}`);
    } catch (err: any) {
      setErrorMessage("Network error reserving seats. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 text-sm">Loading auditorium layout...</p>
      </div>
    );
  }

  if (!showtime) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Showtime Not Found</h2>
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

  const startTimeFormatted = new Date(showtime.startTime).toLocaleTimeString(
    "en-US",
    { hour: "numeric", minute: "2-digit" }
  );
  const startDateFormatted = new Date(showtime.startTime).toLocaleDateString(
    "en-US",
    { weekday: "short", month: "short", day: "numeric" }
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cine-800 pb-4">
        <div className="space-y-1">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Showtimes
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {showtime.movieTitle}
          </h1>
          <p className="text-xs text-slate-400">
            {showtime.cinemaName} • {showtime.auditoriumName} •{" "}
            <span className="text-indigo-400 font-semibold">{showtime.format}</span> •{" "}
            {startDateFormatted} at {startTimeFormatted}
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 bg-cine-900/90 border border-cine-800 px-4 py-2 rounded-xl text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-cine-800 border border-cine-600" />
            <span className="text-slate-300">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-cine-accent border border-indigo-400 shadow-glow" />
            <span className="text-white font-medium">Selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-amber-500/80 border border-amber-400" />
            <span className="text-slate-300">Held</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-slate-800 border border-slate-700 opacity-50" />
            <span className="text-slate-500">Booked</span>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs font-medium flex items-center gap-2 animate-shake">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Seat Map and Checkout Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Seat Map Area */}
        <div className="lg:col-span-8 bg-cine-900/60 border border-cine-800 rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col items-center space-y-10 overflow-x-auto">
          {/* Curved Screen */}
          <div className="w-full max-w-xl space-y-2 text-center">
            <div className="cinema-screen w-full" />
            <span className="text-[11px] uppercase tracking-widest text-indigo-400/80 font-bold">
              SCREEN • AUDITORIUM STAGE
            </span>
          </div>

          {/* Seat Grid */}
          <div className="space-y-3 w-full max-w-xl flex flex-col items-center">
            {rows.map((row) => (
              <div
                key={row.rowLabel}
                className="flex items-center justify-center gap-2 sm:gap-3 w-full"
              >
                {/* Row Label Left */}
                <span className="w-6 text-xs font-bold text-slate-500 text-center">
                  {row.rowLabel}
                </span>

                {/* Seat Buttons */}
                <div className="flex items-center gap-2 sm:gap-2.5">
                  {row.seats.map((seat) => {
                    const isSelected = selectedSeatIds.includes(seat.id);
                    const isAvailable =
                      seat.status === "AVAILABLE" || seat.isHeldByMe;
                    const isBooked = seat.status === "BOOKED";
                    const isHeld =
                      seat.status === "HELD" && !seat.isHeldByMe;

                    let bgStyle =
                      "bg-cine-800/80 border-cine-700/80 text-slate-300 hover:border-indigo-400 hover:scale-105";

                    if (isSelected) {
                      bgStyle =
                        "bg-cine-accent border-indigo-400 text-white shadow-glow scale-105";
                    } else if (isBooked) {
                      bgStyle =
                        "bg-slate-900 border-slate-800 text-slate-600 opacity-40 cursor-not-allowed";
                    } else if (isHeld) {
                      bgStyle =
                        "bg-amber-900/50 border-amber-600/70 text-amber-300 opacity-70 cursor-not-allowed";
                    } else if (seat.type === "VIP") {
                      bgStyle =
                        "bg-purple-950/70 border-purple-600/60 text-purple-200 hover:border-purple-400";
                    } else if (seat.type === "PREMIUM") {
                      bgStyle =
                        "bg-blue-950/60 border-blue-600/60 text-blue-200 hover:border-blue-400";
                    }

                    return (
                      <button
                        key={seat.id}
                        disabled={!isAvailable}
                        onClick={() => toggleSeat(seat)}
                        title={`Row ${seat.row} Seat ${seat.number} (${seat.type}) - $${(
                          seat.priceMinorUnits / 100
                        ).toFixed(2)} [${seat.status}]`}
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg border text-xs font-extrabold flex items-center justify-center transition-all ${bgStyle}`}
                      >
                        {seat.number}
                      </button>
                    );
                  })}
                </div>

                {/* Row Label Right */}
                <span className="w-6 text-xs font-bold text-slate-500 text-center">
                  {row.rowLabel}
                </span>
              </div>
            ))}
          </div>

          {/* Seat Categories Legend & Pricing Tiers */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-6 border-t border-cine-800/80 text-xs text-slate-400 w-full">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-cine-800 border border-cine-600" />
              <span>Regular ($15.00)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-blue-950 border border-blue-600" />
              <span>Premium ($18.75)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-purple-950 border border-purple-600" />
              <span>VIP Royale ($24.00)</span>
            </div>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-4 bg-cine-900/90 border border-cine-800 rounded-3xl p-6 shadow-xl space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-cine-800 pb-3">
            <Ticket className="w-5 h-5 text-cine-accent" />
            Reservation Summary
          </h3>

          {/* Showtime Details Card */}
          <div className="space-y-2 text-xs text-slate-300 bg-cine-950 p-4 rounded-xl border border-cine-800">
            <p className="font-bold text-white text-sm">{showtime.movieTitle}</p>
            <p className="text-slate-400">
              {showtime.cinemaName} • {showtime.auditoriumName}
            </p>
            <p className="text-indigo-400 font-semibold">
              {startDateFormatted} at {startTimeFormatted}
            </p>
          </div>

          {/* Selected Seats List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Selected Seats ({selectedSeats.length})</span>
              {selectedSeats.length > 0 && (
                <button
                  onClick={() => setSelectedSeatIds([])}
                  className="text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  Clear All
                </button>
              )}
            </div>

            {selectedSeats.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-cine-800 rounded-xl">
                Please click on the available seats on the map to select your seats.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedSeats.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-cine-950 border border-cine-800 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Armchair className="w-4 h-4 text-cine-accent" />
                      <span className="font-bold text-white">
                        Row {s.row} - Seat {s.number}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase">
                        ({s.type})
                      </span>
                    </div>
                    <span className="font-semibold text-cine-gold">
                      ${(s.priceMinorUnits / 100).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Price Breakdown */}
          {selectedSeats.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-cine-800 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal ({selectedSeats.length} tickets)</span>
                <span className="text-white">
                  ${(subtotalMinorUnits / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Convenience Fee ($1.50/tkt)</span>
                <span className="text-white">
                  ${(feeMinorUnits / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Estimated Sales Tax (8.5%)</span>
                <span className="text-white">
                  ${(taxMinorUnits / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-cine-800">
                <span>Estimated Total</span>
                <span className="text-cine-gold text-base">
                  ${(totalMinorUnits / 100).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Proceed Button */}
          <button
            disabled={selectedSeats.length === 0 || submitting}
            onClick={handleProceedToHold}
            className="w-full py-3.5 rounded-xl font-bold text-sm bg-cine-accent hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-glow transition-all flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Locking Seats...</span>
              </>
            ) : (
              <>
                <span>Hold Seats & Checkout</span>
                <span>→</span>
              </>
            )}
          </button>

          <p className="text-[11px] text-slate-500 text-center leading-relaxed">
            Upon proceeding, seats will be temporarily held for 10 minutes to guarantee your reservation.
          </p>
        </div>
      </div>
    </div>
  );
}
