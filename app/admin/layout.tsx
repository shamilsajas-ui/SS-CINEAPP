"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Film,
  Calendar,
  QrCode,
  FileText,
  ShieldCheck,
  ChevronLeft,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/admin/scanner", label: "Ticket Scanner", icon: QrCode },
    { href: "/admin/movies", label: "Movie Catalog", icon: Film },
    { href: "/admin/showtimes", label: "Showtimes Scheduler", icon: Calendar },
    { href: "/admin/audit-logs", label: "Audit Logs", icon: FileText },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Admin Subheader */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cine-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              CineBook Administration Console
            </h1>
            <p className="text-xs text-slate-400">
              Operations, ticket validation, cinema catalog, and audit monitoring
            </p>
          </div>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
        >
          <ChevronLeft className="w-4 h-4" />
          Return to Customer Storefront
        </Link>
      </div>

      {/* Admin Tab Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-cine-800/80">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-gold"
                  : "bg-cine-900 border border-cine-800 text-slate-400 hover:text-white hover:bg-cine-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div>{children}</div>
    </div>
  );
}
