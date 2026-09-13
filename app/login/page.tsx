"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Film, Lock, Mail, ShieldCheck, User, AlertCircle } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      router.push(redirectUrl);
      router.refresh();
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="max-w-md w-full mx-auto px-4 py-16 space-y-8">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cine-accent to-cine-gold flex items-center justify-center shadow-glow">
            <Film className="w-6 h-6 text-white" />
          </div>
        </Link>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Welcome to CineBook
        </h1>
        <p className="text-xs text-slate-400">
          Sign in to book tickets, manage seat reservations, and access digital passes.
        </p>
      </div>

      {/* Demo Quick Fill Buttons */}
      <div className="p-4 rounded-2xl bg-cine-900/90 border border-cine-800 space-y-2.5">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
          One-Click Demo Accounts:
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => fillDemo("jane@example.com", "customerpassword123")}
            className="p-2.5 rounded-xl bg-cine-950 border border-cine-700 hover:border-indigo-500 text-left transition-colors"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              Customer
            </div>
            <div className="text-[10px] text-slate-400">Jane Doe</div>
          </button>

          <button
            type="button"
            onClick={() => fillDemo("admin@cinebook.com", "adminpassword123")}
            className="p-2.5 rounded-xl bg-cine-950 border border-amber-500/30 hover:border-amber-500 text-left transition-colors"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin
            </div>
            <div className="text-[10px] text-slate-400">admin@cinebook.com</div>
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="bg-cine-900/80 border border-cine-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
        {error && (
          <div className="p-3 rounded-xl bg-red-950 border border-red-800 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-cine-950 border border-cine-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-cine-950 border border-cine-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-sm bg-cine-accent hover:bg-indigo-600 disabled:opacity-50 text-white shadow-glow transition-all flex items-center justify-center gap-2"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-slate-400">
          Don't have an account yet?{" "}
          <Link href="/register" className="text-indigo-400 font-semibold hover:underline">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-xs text-slate-400">Loading sign in...</div>}>
      <LoginForm />
    </Suspense>
  );
}
