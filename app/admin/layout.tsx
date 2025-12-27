"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

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

  const handleSignOut = () => {
    // Clear the session cookie
    document.cookie = "admin-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/admin/login");
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
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400 font-semibold">Admin</p>
            <h1 className="text-xl font-bold text-white">Garden Route Defaults</h1>
            <Link href="/" className="text-sky-400 text-sm hover:text-white transition">
              ← Back to Map
            </Link>
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
                <h1 className="text-lg font-bold text-white">Garden Route Defaults</h1>
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

