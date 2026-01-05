"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { logError } from "@/lib/logger";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/blogs", label: "Blogs" },
  { href: "/admin/businesses", label: "Businesses" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      window.location.href = "/admin/login";
    } catch (error) {
      logError("Logout failed", error);
      // Fallback
      document.cookie = "admin-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      router.push("/admin/login");
    }
  };

  return (
    <div className="min-h-screen bg-[#04060c] text-slate-100 relative">
      <div className="noise-overlay" />
      <div className="absolute inset-0 -z-10 blur-3xl">
        <div className="glow-ring left-1/3 top-1/4 h-80 w-80 bg-sky-400/10" />
        <div className="glow-ring right-1/4 top-1/3 h-96 w-96 bg-violet-500/10" />
      </div>

      <div className="flex">
        <aside className="w-64 hidden md:block border-r border-white/10 bg-slate-900/60 backdrop-blur-xl min-h-screen p-6 space-y-6">
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400 font-semibold">Admin</p>
              <h1 className="text-xl font-bold text-white">Spotlight</h1>
            </div>
            {/* Editor/Admin Toggle */}
            <div className="flex rounded-xl border border-white/10 overflow-hidden">
              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-sky-400 hover:bg-white/5 transition border-r border-white/10"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Preview Site
              </Link>
              <Link
                href="/editor"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Editor
              </Link>
            </div>
          </div>
          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-xl px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/5 hover:text-white border border-transparent hover:border-white/10 transition"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="pt-6 border-t border-white/10">
            <div className="text-xs text-slate-400 mb-2">
              Logged in as: Admin
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-red-500/10 hover:text-red-300 border border-transparent hover:border-red-400/20 transition"
            >
              Sign Out
            </button>
          </div>
        </aside>

        <main className="flex-1 p-4 md:p-8">
          <div className="md:hidden mb-4">
            <div className="flex items-center justify-between glass rounded-2xl p-3 border border-white/10">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400 font-semibold">Admin</p>
                <h1 className="text-lg font-bold text-white">Spotlight</h1>
              </div>
              <button
                onClick={handleSignOut}
                className="text-red-400 text-sm hover:text-red-300 transition"
              >
                Sign Out
              </button>
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

