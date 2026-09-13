"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  CreditCard,
  Lock,
  Clock,
  ChevronLeft,
  AlertCircle,
  Ticket,
  CheckCircle2,
  Sparkles,
  Info,
} from "lucide-react";

interface SeatSnapshot {
  row: string;
  number: number;
  type: string;
  priceMinorUnits: number;
}

interface BookingDetails {
  id: string;
  bookingReference: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "EXPIRED";
  subtotalMinorUnits: number;
  feeMinorUnits: number;
  taxMinorUnits: number;
  totalMinorUnits: number;
  currency: string;
  expiresAt: string;
  movieTitle: string;
  moviePoster: string;
  cinemaName: string;
  cinemaAddress: string;
  auditoriumName: string;
  format: string;
  startTime: string;
  showtimeId?: string;
  seats: SeatSnapshot[];
}

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = use(params);
  const router = useRouter();

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  // Form states for test payment
  const [cardNumber, setCardNumber] = useState("4242 •••• •••• 4242");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvc, setCardCvc] = useState("123");
  const [cardName, setCardName] = useState("Jane Doe");

  useEffect(() => {
    fetch(`/api/bookings/${bookingId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Could not load booking");
        return res.json();
      })
      .then((data) => {
        if (data?.booking) {
          setBooking(data.booking);
          if (data.booking.status === "CONFIRMED") {
            router.push(`/tickets/${bookingId}`);
          }
        }
      })
      .catch((err) => setErrorMessage(err.message))
      .finally(() => setLoading(false));
  }, [bookingId, router]);

  // Countdown timer for 10-minute hold
  useEffect(() => {
    if (!booking || booking.status !== "PENDING") return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expires = new Date(booking.expiresAt).getTime();
      const diff = Math.max(0, Math.floor((expires - now) / 1000));
      setSecondsRemaining(diff);

      if (diff <= 0) {
        setErrorMessage(
          "Your seat reservation hold has expired. Please select your seats again."
        );
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [booking]);

  const handlePayNow = async () => {
    if (!booking) return;
    setPaying(true);
    setErrorMessage(null);

    // Generate client idempotency key
    const idempotencyKey = `pay_${booking.id}_${Date.now()}`;

    try {
      const res = await fetch(`/api/bookings/${booking.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey,
          provider: "MOCK_TEST",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Payment failed. Please try again.");
        return;
      }

      // Success -> navigate to digital ticket pass
      router.push(`/tickets/${booking.id}`);
    } catch (err) {
      setErrorMessage("Network error during payment confirmation.");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 text-sm">Preparing secure checkout...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Booking Not Found</h2>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    );
  }

  const minutes = Math.floor((secondsRemaining || 0) / 60);
  const seconds = (secondsRemaining || 0) % 60;
  const isExpired = secondsRemaining !== null && secondsRemaining <= 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button and title */}
      <div className="space-y-2">
        <Link
          href={`/showtimes/${booking.showtimeId || ""}/seats`}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Change Seats
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Checkout & Payment
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Booking Reference:{" "}
              <span className="font-mono text-indigo-300 font-bold">
                {booking.bookingReference}
              </span>
            </p>
          </div>

          {/* Countdown Hold Timer */}
          <div
            className={`px-4 py-2 rounded-xl border flex items-center gap-2.5 text-xs font-bold ${
              isExpired
                ? "bg-red-950/80 border-red-800 text-red-300"
                : "bg-amber-950/60 border-amber-500/40 text-amber-300 shadow-gold"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>
              {isExpired
                ? "Hold Expired"
                : `Seat Hold Expires: ${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`}
            </span>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Checkout Columns */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Col: Payment Method Selector */}
        <div className="md:col-span-7 bg-cine-900/90 border border-cine-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-cine-800 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-cine-accent" />
              Payment Details
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950 border border-emerald-500/30 text-emerald-400">
              Test Mode Active
            </span>
          </div>

          {/* Test Mode Banner */}
          <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-300 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-white">
              <Sparkles className="w-4 h-4 text-cine-gold" />
              Instant Sandbox Payment Simulation
            </p>
            <p className="text-slate-400 leading-relaxed">
              No real charge will be incurred. Pre-filled with Stripe test mode credentials for seamless end-to-end verification.
            </p>
          </div>

          {/* Card Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Cardholder Name
              </label>
              <input
                type="text"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                className="w-full px-4 py-2.5 bg-cine-950 border border-cine-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Card Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full px-4 py-2.5 bg-cine-950 border border-cine-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
                <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Expiry Date
                </label>
                <input
                  type="text"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  className="w-full px-4 py-2.5 bg-cine-950 border border-cine-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 text-center font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  CVC / CVV
                </label>
                <input
                  type="text"
                  value={cardCvc}
                  onChange={(e) => setCardCvc(e.target.value)}
                  className="w-full px-4 py-2.5 bg-cine-950 border border-cine-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 text-center font-mono"
                />
              </div>
            </div>
          </div>

          {/* Pay Button */}
          <button
            disabled={paying || isExpired}
            onClick={handlePayNow}
            className="w-full py-4 rounded-xl font-bold text-sm bg-gradient-to-r from-cine-accent via-indigo-500 to-cine-purple hover:from-indigo-600 hover:to-purple-600 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-glow transition-all flex items-center justify-center gap-2"
          >
            {paying ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Authorizing Payment...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>
                  Confirm & Pay ${(booking.totalMinorUnits / 100).toFixed(2)}
                </span>
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-4 text-xs text-slate-500 pt-2">
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              256-Bit SSL Encrypted
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              Idempotent Verification
            </span>
          </div>
        </div>

        {/* Right Col: Itemized Order Summary */}
        <div className="md:col-span-5 bg-cine-900/90 border border-cine-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-cine-800 pb-4">
            <Ticket className="w-5 h-5 text-cine-accent" />
            Order Review
          </h3>

          {/* Movie Details */}
          <div className="space-y-1 bg-cine-950 p-4 rounded-2xl border border-cine-800">
            <h4 className="font-bold text-white text-base">{booking.movieTitle}</h4>
            <p className="text-xs text-slate-400">
              {booking.cinemaName} • {booking.auditoriumName}
            </p>
            <p className="text-xs text-indigo-400 font-semibold">
              {new Date(booking.startTime).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}{" "}
              at{" "}
              {new Date(booking.startTime).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>

          {/* Selected Seats Table */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Selected Seats ({booking.seats.length})
            </span>
            <div className="space-y-1.5">
              {booking.seats.map((s, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-cine-950 border border-cine-800/80 text-xs"
                >
                  <span className="font-bold text-slate-200">
                    Row {s.row} - Seat {s.number}{" "}
                    <span className="text-[10px] text-slate-400 uppercase font-normal">
                      ({s.type})
                    </span>
                  </span>
                  <span className="font-semibold text-cine-gold">
                    ${(s.priceMinorUnits / 100).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Cost Line Items */}
          <div className="space-y-2.5 pt-4 border-t border-cine-800 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal Tickets</span>
              <span className="text-white font-medium">
                ${(booking.subtotalMinorUnits / 100).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Convenience Fee ($1.50/seat)</span>
              <span className="text-white font-medium">
                ${(booking.feeMinorUnits / 100).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Sales Tax (8.5%)</span>
              <span className="text-white font-medium">
                ${(booking.taxMinorUnits / 100).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-white pt-3 border-t border-cine-800">
              <span>Total Amount</span>
              <span className="text-cine-gold text-xl font-mono font-black">
                ${(booking.totalMinorUnits / 100).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
