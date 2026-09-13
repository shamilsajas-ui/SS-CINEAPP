"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Ticket,
  CheckCircle2,
  Printer,
  Calendar,
  Clock,
  MapPin,
  ChevronLeft,
  Share2,
  Armchair,
  Sparkles,
} from "lucide-react";

interface TicketItem {
  id: string;
  ticketCode: string;
  qrCodeData: string;
  status: "VALID" | "USED" | "CANCELLED";
  issuedAt: string;
}

interface SeatItem {
  row: string;
  number: number;
  type: string;
}

interface ConfirmedBooking {
  id: string;
  bookingReference: string;
  status: string;
  totalMinorUnits: number;
  movieTitle: string;
  moviePoster: string;
  cinemaName: string;
  cinemaAddress: string;
  auditoriumName: string;
  format: string;
  startTime: string;
  endTime: string;
  seats: SeatItem[];
  tickets: TicketItem[];
}

export default function TicketConfirmationPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = use(params);
  const [booking, setBooking] = useState<ConfirmedBooking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/bookings/${bookingId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.booking) {
          setBooking(data.booking);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [bookingId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 text-sm">Generating your digital cinema passes...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
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

  const startDate = new Date(booking.startTime).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const startTime = new Date(booking.startTime).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Success Banner */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto mb-3 shadow-glow">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">
          Booking Confirmed!
        </h1>
        <p className="text-sm text-slate-400">
          Your admission tickets have been issued and are ready for entry.
        </p>
      </div>

      {/* Digital Cinema Ticket Card (Realistic Perforated Notch Design) */}
      <div className="ticket-card rounded-3xl overflow-hidden shadow-2xl border border-cine-700/80 bg-cine-900">
        <div className="grid grid-cols-1 md:grid-cols-12">
          {/* Main Ticket Info (Left/Top) */}
          <div className="md:col-span-8 p-6 sm:p-8 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-cine-accent text-white shadow-glow">
                  {booking.format}
                </span>
                <span className="font-mono text-sm font-bold text-cine-gold">
                  REF: {booking.bookingReference}
                </span>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {booking.movieTitle}
                </h2>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cine-gold" />
                  {booking.cinemaName} • {booking.auditoriumName}
                </p>
              </div>
            </div>

            {/* Event Time and Location Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-cine-800 text-xs">
              <div>
                <span className="text-slate-500 block uppercase font-bold text-[10px]">
                  Date
                </span>
                <span className="font-semibold text-slate-200">{startDate}</span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase font-bold text-[10px]">
                  Showtime
                </span>
                <span className="font-semibold text-slate-200">{startTime}</span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase font-bold text-[10px]">
                  Cinema Screen
                </span>
                <span className="font-semibold text-slate-200">
                  {booking.auditoriumName}
                </span>
              </div>
            </div>

            {/* Reserved Seats List */}
            <div className="space-y-2 pt-4 border-t border-cine-800">
              <span className="text-slate-500 block uppercase font-bold text-[10px]">
                Reserved Seats ({booking.seats.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {booking.seats.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-lg bg-cine-950 border border-cine-700 text-xs font-bold text-white flex items-center gap-1.5"
                  >
                    <Armchair className="w-3.5 h-3.5 text-indigo-400" />
                    Row {s.row} - Seat {s.number}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Perforated Stub with QR Code (Right/Bottom) */}
          <div className="md:col-span-4 bg-cine-950 p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-4 border-t md:border-t-0 md:border-l border-dashed border-cine-700 relative">
            {/* Notch markers */}
            <div className="hidden md:block ticket-notch-left top-1/2 -translate-y-1/2" />
            <div className="hidden md:block ticket-notch-right top-1/2 -translate-y-1/2" />

            <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">
              SCAN FOR ADMISSION
            </span>

            {/* Dynamic QR Code Image */}
            {booking.tickets?.[0]?.qrCodeData ? (
              <div className="p-2.5 bg-white rounded-2xl shadow-xl">
                <Image
                  src={booking.tickets[0].qrCodeData}
                  alt="Entry QR Pass"
                  width={160}
                  height={160}
                  className="rounded-lg"
                />
              </div>
            ) : (
              <div className="w-40 h-40 bg-white rounded-2xl flex items-center justify-center text-xs text-slate-800 font-mono">
                QR CODE READY
              </div>
            )}

            <div className="space-y-1">
              <p className="font-mono text-xs font-bold text-white tracking-widest">
                {booking.tickets?.[0]?.ticketCode || "TKT-VALID-PASS"}
              </p>
              <p className="text-[10px] text-slate-400">
                Present this pass at the usher turnstile
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
        <button
          onClick={() => window.print()}
          className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-cine-900 border border-cine-700 hover:border-slate-400 text-white flex items-center gap-2 transition-colors"
        >
          <Printer className="w-4 h-4 text-indigo-400" />
          Print / Save Pass (PDF)
        </button>
        <Link
          href="/account/bookings"
          className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-cine-accent hover:bg-indigo-600 text-white flex items-center gap-2 shadow-glow transition-all"
        >
          <Ticket className="w-4 h-4" />
          View in My Bookings
        </Link>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          Browse More Movies
        </Link>
      </div>
    </div>
  );
}
