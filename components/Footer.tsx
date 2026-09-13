import Link from "next/link";
import { Film, ShieldCheck, Heart, Sparkles } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-cine-950 border-t border-cine-800/80 text-slate-400 text-sm mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1: Brand */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <Film className="w-4 h-4" />
              </div>
              <span className="text-lg font-black tracking-wider text-white">
                CINEBOOK
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              Production-ready cinema ticket booking experience powered by Next.js, Neon Serverless PostgreSQL, and Drizzle ORM.
            </p>
            <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Real-time seat concurrency engine</span>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Discover</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Now Showing
                </Link>
              </li>
              <li>
                <Link href="/cinemas" className="hover:text-white transition-colors">
                  Partner Cinemas & IMAX
                </Link>
              </li>
              <li>
                <Link href="/account/bookings" className="hover:text-white transition-colors">
                  My Tickets & QR Passes
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Technology */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Architecture</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Next.js 15 App Router
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                Neon Serverless PostgreSQL
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Drizzle ORM & Migrations
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                Vercel Functions & Cron
              </li>
            </ul>
          </div>

          {/* Col 4: Quick Portals */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Portals</h4>
            <div className="space-y-2.5">
              <Link
                href="/login"
                className="block text-xs text-slate-300 hover:text-white"
              >
                Customer Sign In
              </Link>
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cine-900 border border-cine-700 text-xs font-medium text-amber-300 hover:border-amber-500/50"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin Management Portal
              </Link>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-cine-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} CineBook Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Built for Vercel Deployment</span>
            <span>PCI Compliant Mock & Stripe Integration</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
