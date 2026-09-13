"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Film, Ticket, User, ShieldCheck, LogOut, Menu, X, ChevronDown } from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
}

export default function Navbar() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null));
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setDropdownOpen(false);
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-cine-950/85 backdrop-blur-md border-b border-cine-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cine-accent via-indigo-500 to-cine-gold flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform">
                <Film className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-wider bg-gradient-to-r from-white via-indigo-100 to-cine-gold bg-clip-text text-transparent">
                  CINEBOOK
                </span>
                <span className="text-[10px] tracking-widest text-indigo-400 font-semibold uppercase -mt-1">
                  Cinema Experience
                </span>
              </div>
            </Link>

            {/* Navigation links (Desktop) */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === "/"
                    ? "text-white bg-cine-800"
                    : "text-slate-400 hover:text-white hover:bg-cine-900"
                }`}
              >
                Movies
              </Link>
              <Link
                href="/cinemas"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith("/cinemas")
                    ? "text-white bg-cine-800"
                    : "text-slate-400 hover:text-white hover:bg-cine-900"
                }`}
              >
                Cinemas & Experiences
              </Link>
              <Link
                href="/account/bookings"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith("/account/bookings")
                    ? "text-white bg-cine-800"
                    : "text-slate-400 hover:text-white hover:bg-cine-900"
                }`}
              >
                My Tickets
              </Link>
            </nav>
          </div>

          {/* Right Action / Auth */}
          <div className="hidden md:flex items-center gap-4">
            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 transition-all shadow-gold"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin Portal
              </Link>
            )}

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-cine-900 border border-cine-700/60 hover:border-indigo-500/50 transition-all text-sm"
                >
                  <div className="w-7 h-7 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/40">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-slate-200">{user.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {dropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-52 rounded-xl bg-cine-900 border border-cine-700 shadow-2xl py-1.5 z-50 backdrop-blur-lg animate-in fade-in slide-in-from-top-2"
                    onMouseLeave={() => setDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-cine-800">
                      <p className="text-xs text-slate-400">Signed in as</p>
                      <p className="text-sm font-semibold text-white truncate">
                        {user.email}
                      </p>
                    </div>

                    <Link
                      href="/account/bookings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:bg-cine-800 hover:text-white"
                    >
                      <Ticket className="w-4 h-4 text-indigo-400" />
                      My Bookings & Passes
                    </Link>

                    {user.role === "ADMIN" && (
                      <Link
                        href="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-amber-300 hover:bg-cine-800"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Admin Dashboard
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-400 hover:bg-cine-800 hover:text-red-300 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-cine-accent hover:bg-indigo-600 transition-all shadow-glow hover:shadow-indigo-500/50"
                >
                  Get Tickets
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-cine-900 border border-cine-800 text-slate-300"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-5 space-y-2 bg-cine-950 border-b border-cine-800">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-200 hover:bg-cine-900"
          >
            Movies
          </Link>
          <Link
            href="/cinemas"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-200 hover:bg-cine-900"
          >
            Cinemas
          </Link>
          <Link
            href="/account/bookings"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-200 hover:bg-cine-900"
          >
            My Bookings
          </Link>
          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-amber-300 hover:bg-cine-900"
            >
              Admin Dashboard
            </Link>
          )}

          <div className="pt-3 border-t border-cine-800">
            {user ? (
              <div className="space-y-2">
                <div className="text-xs text-slate-400 px-3">
                  Signed in as <span className="text-white font-medium">{user.name}</span>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-cine-900 rounded-md"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex gap-2 pt-1">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 rounded-lg bg-cine-900 text-sm font-medium text-white border border-cine-700"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 rounded-lg bg-cine-accent text-sm font-medium text-white shadow-glow"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
