"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, MapPin, Building2, Star, Info, ArrowRight, TrendingUp, Eye, Maximize2, Minimize2, ExternalLink, Sparkles } from "lucide-react";

const quickActions = [
  {
    title: "Edit Blogs",
    description: "Manage blog posts, edit content, change images",
    href: "/editor/blogs",
    icon: FileText,
    color: "from-sky-500 to-blue-600",
    stats: "40+ posts"
  },
  {
    title: "Manage Locations",
    description: "Add, edit, or remove towns from the map",
    href: "/editor/locations",
    icon: MapPin,
    color: "from-amber-500 to-orange-600",
    stats: "7 towns"
  },
  {
    title: "Edit Businesses",
    description: "Manage businesses, coordinates, and details",
    href: "/editor/businesses",
    icon: Building2,
    color: "from-emerald-500 to-green-600",
    stats: "70+ businesses"
  },
  {
    title: "Spotlight Editor",
    description: "Drag and drop to reorder featured businesses",
    href: "/editor/spotlights",
    icon: Star,
    color: "from-violet-500 to-purple-600",
    stats: "21 featured"
  },
  {
    title: "About Page",
    description: "Edit the about page content and sections",
    href: "/editor/about",
    icon: Info,
    color: "from-rose-500 to-pink-600",
    stats: "4 sections"
  },
];

export default function EditorDashboard() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [previewPage, setPreviewPage] = useState<"map" | "blogs" | "about">("map");

  return (
    <div className="space-y-8">
      {/* Live Editor CTA */}
      <Link
        href="/editor/live"
        className="block glass border border-violet-400/30 rounded-3xl overflow-hidden transition-all duration-300 hover:border-violet-400/50 hover:scale-[1.01] group bg-gradient-to-r from-violet-500/10 via-purple-500/5 to-fuchsia-500/10"
      >
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-bold text-white group-hover:text-violet-300 transition">Live Editor</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/30 text-violet-300 font-bold uppercase">New</span>
                </div>
                <p className="text-slate-400">
                  Click, drag, and edit everything directly on the website. Full visual editing with snap-to-grid, undo/redo, and real-time preview.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-sm text-slate-300">Real-time</span>
              </div>
              <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-violet-500 text-white font-semibold group-hover:bg-violet-400 transition">
                Open Live Editor
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* Quick Preview */}
      <div className={`glass border border-white/10 rounded-3xl overflow-hidden transition-all duration-300 ${isFullscreen ? "fixed inset-4 z-50" : ""}`}>
        {/* Preview Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Quick Preview</h2>
              <p className="text-xs text-slate-400">Preview your site • Use Live Editor for full editing</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Page Selector */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
              <button
                onClick={() => setPreviewPage("map")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${previewPage === "map" ? "bg-sky-500/20 text-sky-300" : "text-slate-400 hover:text-white"}`}
              >
                Map
              </button>
              <button
                onClick={() => setPreviewPage("blogs")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${previewPage === "blogs" ? "bg-sky-500/20 text-sky-300" : "text-slate-400 hover:text-white"}`}
              >
                Blogs
              </button>
              <button
                onClick={() => setPreviewPage("about")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${previewPage === "about" ? "bg-sky-500/20 text-sky-300" : "text-slate-400 hover:text-white"}`}
              >
                About
              </button>
            </div>
            <a
              href={previewPage === "map" ? "/" : previewPage === "blogs" ? "/blogs" : "/about"}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition"
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        {/* Preview iframe */}
        <div className={`relative bg-slate-950 ${isFullscreen ? "h-[calc(100%-60px)]" : "h-[400px]"}`}>
          <iframe
            src={previewPage === "map" ? "/" : previewPage === "blogs" ? "/blogs" : "/about"}
            className="w-full h-full border-0"
            title="Quick Preview"
          />
        </div>
      </div>

      {/* Header */}
      <div className="glass border border-white/10 rounded-3xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Site Editor</h1>
            <p className="text-slate-400">
              Drag, drop, and customize every aspect of Spotlight. Changes are saved automatically.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-400/30">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-sm text-emerald-400 font-medium">Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">40+</p>
              <p className="text-xs text-slate-400">Blog Posts</p>
            </div>
          </div>
        </div>
        <div className="glass border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">7</p>
              <p className="text-xs text-slate-400">Locations</p>
            </div>
          </div>
        </div>
        <div className="glass border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">70+</p>
              <p className="text-xs text-slate-400">Businesses</p>
            </div>
          </div>
        </div>
        <div className="glass border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Star className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">21</p>
              <p className="text-xs text-slate-400">Spotlights</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="group glass border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs text-slate-500 bg-white/5 px-2 py-1 rounded-full">
                    {action.stats}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-sky-300 transition-colors">
                  {action.title}
                </h3>
                <p className="text-sm text-slate-400 mb-4">{action.description}</p>
                <div className="flex items-center gap-2 text-sm text-sky-400 font-medium">
                  Open Editor
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">How It Works</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400 font-bold text-sm">1</div>
            <h3 className="font-semibold text-white">Select a Section</h3>
            <p className="text-sm text-slate-400">Choose what you want to edit from the sidebar or quick actions above.</p>
          </div>
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 font-bold text-sm">2</div>
            <h3 className="font-semibold text-white">Drag & Drop</h3>
            <p className="text-sm text-slate-400">Reorder items, edit content inline, and upload new images with ease.</p>
          </div>
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm">3</div>
            <h3 className="font-semibold text-white">Auto-Save</h3>
            <p className="text-sm text-slate-400">Changes save automatically. Analytics history is always preserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
