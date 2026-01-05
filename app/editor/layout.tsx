"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { 
  LayoutDashboard, 
  FileText, 
  MapPin, 
  Building2, 
  Star, 
  Info, 
  Settings,
  ArrowLeft,
  Save,
  Eye,
  Sparkles
} from "lucide-react";

const navItems = [
  { href: "/editor", label: "Dashboard", icon: LayoutDashboard },
  { href: "/editor/live", label: "Live Editor", icon: Sparkles, highlight: true },
  { href: "/editor/blogs", label: "Blogs", icon: FileText },
  { href: "/editor/locations", label: "Locations", icon: MapPin },
  { href: "/editor/businesses", label: "Businesses", icon: Building2 },
  { href: "/editor/spotlights", label: "Spotlights", icon: Star },
  { href: "/editor/settings", label: "Settings", icon: Settings },
];

export default function EditorLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated as admin
    const checkAuth = () => {
      const adminSession = document.cookie.includes("admin-session=true");
      if (!adminSession) {
        router.push("/admin/login");
      } else {
        setIsAuthenticated(true);
      }
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#04060c] flex items-center justify-center">
        <div className="text-white">Loading editor...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#04060c] text-slate-100 relative">
      <div className="noise-overlay" />
      <div className="absolute inset-0 -z-10 blur-3xl">
        <div className="glow-ring left-1/3 top-1/4 h-80 w-80 bg-violet-500/10" />
        <div className="glow-ring right-1/4 top-1/3 h-96 w-96 bg-sky-400/10" />
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-72 hidden lg:block border-r border-white/10 bg-slate-900/60 backdrop-blur-xl min-h-screen p-6 space-y-6 sticky top-0">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400 font-semibold">Site</p>
                <h1 className="text-lg font-bold text-white">Editor</h1>
              </div>
            </div>
            <div className="flex gap-2">
              <Link 
                href="/" 
                target="_blank"
                className="flex-1 flex items-center justify-center gap-2 text-sky-400 text-xs hover:text-white transition bg-white/5 rounded-lg py-2 border border-white/10 hover:border-white/20"
              >
                <Eye className="w-3.5 h-3.5" />
                Preview Site
              </Link>
              <Link 
                href="/admin" 
                className="flex-1 flex items-center justify-center gap-2 text-slate-400 text-xs hover:text-white transition bg-white/5 rounded-lg py-2 border border-white/10 hover:border-white/20"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Admin
              </Link>
            </div>
          </div>

          <nav className="space-y-1">
            <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-semibold mb-3 px-3">Content</p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/editor" && pathname?.startsWith(item.href));
              const isHighlight = 'highlight' in item && item.highlight;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-violet-500/20 text-white border border-violet-400/30"
                      : isHighlight
                        ? "bg-gradient-to-r from-violet-500/10 to-purple-500/10 text-violet-300 hover:from-violet-500/20 hover:to-purple-500/20 border border-violet-400/20"
                        : "text-slate-300 hover:bg-white/5 hover:text-white border border-transparent"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-violet-400" : isHighlight ? "text-violet-400" : "text-slate-500"}`} />
                  {item.label}
                  {isHighlight && !isActive && (
                    <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-violet-500/30 text-violet-300 font-bold">NEW</span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-white/10">
            <div className="glass rounded-xl p-4 border border-white/10 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs text-slate-400">Auto-save enabled</span>
              </div>
              <p className="text-[10px] text-slate-500">
                Changes are saved automatically. Analytics history is preserved.
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          {/* Mobile Header */}
          <div className="lg:hidden sticky top-0 z-50 bg-slate-900/90 backdrop-blur-xl border-b border-white/10 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <LayoutDashboard className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-lg font-bold text-white">Editor</h1>
              </div>
              <div className="flex gap-2">
                <Link href="/" target="_blank" className="p-2 rounded-lg bg-white/5 text-sky-400">
                  <Eye className="w-4 h-4" />
                </Link>
                <Link href="/admin" className="p-2 rounded-lg bg-white/5 text-slate-400">
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </div>
            </div>
            {/* Mobile Nav */}
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== "/editor" && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                      isActive
                        ? "bg-violet-500/20 text-white border border-violet-400/30"
                        : "bg-white/5 text-slate-400 border border-white/10"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="p-4 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
