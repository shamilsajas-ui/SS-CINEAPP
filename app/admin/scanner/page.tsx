"use client";

import { useState } from "react";
import {
  QrCode,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MapPin,
  Calendar,
  Clock,
  Armchair,
} from "lucide-react";

export default function TicketScannerPage() {
  const [ticketCode, setTicketCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketCode.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/validate-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketCode: ticketCode.trim() }),
      });

      const data = await res.json();
      setResult({ status: res.status, ...data });
    } catch (err: any) {
      setResult({
        valid: false,
        message: "Network error connecting to validation service.",
      });
    } finally {
      setLoading(false);
    }
  };

  const sampleValidate = (code: string) => {
    setTicketCode(code);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4">
      <div className="border-b border-cine-800 pb-4 space-y-1">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <QrCode className="w-5 h-5 text-amber-400" />
          Cinema Gate Ticket Scanner & Validator
        </h2>
        <p className="text-xs text-slate-400">
          Verify digital QR tickets and mark admission passes as redeemed in real time.
        </p>
      </div>

      {/* Code Input Form */}
      <div className="bg-cine-900/90 border border-cine-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
        <form onSubmit={handleValidate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Enter or Scan Ticket Code
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={ticketCode}
                onChange={(e) => setTicketCode(e.target.value)}
                placeholder="e.g. TKT-XXXXXXXX"
                className="w-full pl-10 pr-4 py-3 bg-cine-950 border border-cine-700 rounded-xl text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-cine-950 transition-all flex items-center justify-center gap-2 shadow-gold"
          >
            {loading ? "Validating Ticket..." : "Verify & Admit Ticket"}
          </button>
        </form>
      </div>

      {/* Result Display Card */}
      {result && (
        <div
          className={`rounded-3xl p-6 sm:p-8 border shadow-2xl space-y-5 animate-in fade-in zoom-in-95 ${
            result.valid
              ? "bg-emerald-950/40 border-emerald-500/50"
              : "bg-red-950/40 border-red-500/50"
          }`}
        >
          <div className="flex items-center gap-3">
            {result.valid ? (
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center shrink-0">
                <XCircle className="w-6 h-6" />
              </div>
            )}
            <div>
              <h3
                className={`text-lg font-bold ${
                  result.valid ? "text-emerald-300" : "text-red-300"
                }`}
              >
                {result.valid ? "Valid Ticket - Admission Approved" : "Ticket Validation Failed"}
              </h3>
              <p className="text-xs text-slate-300">{result.message}</p>
            </div>
          </div>

          {/* Ticket Information */}
          {result.ticket && (
            <div className="p-4 bg-cine-950/80 rounded-2xl border border-cine-800 space-y-3 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[10px]">
                    Movie
                  </span>
                  <span className="font-bold text-white text-sm">
                    {result.ticket.movieTitle}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[10px]">
                    Auditorium & Screen
                  </span>
                  <span className="font-semibold text-slate-200">
                    {result.ticket.auditoriumName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[10px]">
                    Assigned Seat
                  </span>
                  <span className="font-bold text-cine-gold text-sm flex items-center gap-1">
                    <Armchair className="w-3.5 h-3.5" />
                    Row {result.ticket.rowLabel} - Seat {result.ticket.seatNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[10px]">
                    Customer
                  </span>
                  <span className="font-semibold text-slate-200">
                    {result.ticket.userName}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
