"use client";

import { useState } from "react";
import { 
  Save, 
  RefreshCw, 
  Download, 
  Upload, 
  Trash2, 
  AlertTriangle,
  Check,
  Database,
  Globe,
  Palette
} from "lucide-react";

export default function EditorSettings() {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleExportData = () => {
    try {
      const data = {
        blogs: localStorage.getItem("editor-blogs"),
        locations: localStorage.getItem("editor-locations"),
        businesses: localStorage.getItem("editor-businesses"),
        spotlights: localStorage.getItem("editor-spotlights"),
        about: localStorage.getItem("editor-about"),
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `spotlight-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      showMessage("success", "Data exported successfully!");
    } catch (error) {
      showMessage("error", "Failed to export data");
    }
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        
        if (data.blogs) localStorage.setItem("editor-blogs", data.blogs);
        if (data.locations) localStorage.setItem("editor-locations", data.locations);
        if (data.businesses) localStorage.setItem("editor-businesses", data.businesses);
        if (data.spotlights) localStorage.setItem("editor-spotlights", data.spotlights);
        if (data.about) localStorage.setItem("editor-about", data.about);

        showMessage("success", "Data imported successfully! Refresh to see changes.");
      } catch (error) {
        showMessage("error", "Failed to import data. Invalid file format.");
      }
    };
    reader.readAsText(file);
  };

  const handleClearCache = () => {
    if (confirm("Are you sure you want to clear all editor cache? This will reset to default data.")) {
      localStorage.removeItem("editor-blogs");
      localStorage.removeItem("editor-locations");
      localStorage.removeItem("editor-businesses");
      localStorage.removeItem("editor-spotlights");
      localStorage.removeItem("editor-about");
      showMessage("success", "Cache cleared! Refresh to load default data.");
    }
  };

  const handleSyncToServer = async () => {
    setSaving(true);
    try {
      // Sync all local changes to server
      const syncPromises = [];

      const blogs = localStorage.getItem("editor-blogs");
      if (blogs) {
        syncPromises.push(
          fetch("/api/editor/blogs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ posts: JSON.parse(blogs) }),
          })
        );
      }

      const locations = localStorage.getItem("editor-locations");
      if (locations) {
        syncPromises.push(
          fetch("/api/editor/locations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ locations: JSON.parse(locations) }),
          })
        );
      }

      const businesses = localStorage.getItem("editor-businesses");
      if (businesses) {
        syncPromises.push(
          fetch("/api/editor/businesses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ businesses: JSON.parse(businesses) }),
          })
        );
      }

      const spotlights = localStorage.getItem("editor-spotlights");
      if (spotlights) {
        syncPromises.push(
          fetch("/api/editor/spotlights", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ spotlights: JSON.parse(spotlights) }),
          })
        );
      }

      const about = localStorage.getItem("editor-about");
      if (about) {
        syncPromises.push(
          fetch("/api/editor/about", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sections: JSON.parse(about) }),
          })
        );
      }

      await Promise.all(syncPromises);
      showMessage("success", "All changes synced to server!");
    } catch (error) {
      showMessage("error", "Failed to sync some changes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass border border-white/10 rounded-3xl p-6">
        <h1 className="text-2xl font-bold text-white mb-2">Editor Settings</h1>
        <p className="text-slate-400">Manage your editor data, export/import configurations, and sync changes.</p>
      </div>

      {/* Message Toast */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border ${
          message.type === "success" 
            ? "bg-emerald-500/20 border-emerald-400/30 text-emerald-300" 
            : "bg-red-500/20 border-red-400/30 text-red-300"
        }`}>
          {message.type === "success" ? <Check className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      {/* Data Management */}
      <div className="glass border border-white/10 rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center">
            <Database className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Data Management</h2>
            <p className="text-sm text-slate-400">Export, import, and manage your editor data</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <button
            onClick={handleExportData}
            className="flex items-center justify-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-left"
          >
            <Download className="w-5 h-5 text-sky-400" />
            <div>
              <p className="font-medium text-white">Export Data</p>
              <p className="text-xs text-slate-400">Download all editor data as JSON</p>
            </div>
          </button>

          <label className="flex items-center justify-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition cursor-pointer">
            <Upload className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="font-medium text-white">Import Data</p>
              <p className="text-xs text-slate-400">Upload a previously exported JSON file</p>
            </div>
            <input
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="hidden"
            />
          </label>
        </div>

        <div className="border-t border-white/10 pt-4">
          <button
            onClick={handleSyncToServer}
            disabled={saving}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-violet-500/20 border border-violet-400/30 text-violet-300 hover:bg-violet-500/30 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${saving ? "animate-spin" : ""}`} />
            {saving ? "Syncing..." : "Sync All Changes to Server"}
          </button>
        </div>
      </div>

      {/* Cache Management */}
      <div className="glass border border-white/10 rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Cache Management</h2>
            <p className="text-sm text-slate-400">Clear local cache to reset to default data</p>
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-400/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-200 font-medium">Warning</p>
              <p className="text-xs text-amber-300/80 mt-1">
                Clearing the cache will remove all unsaved editor changes and reset to the default data. 
                Make sure to export your data first if you want to keep your changes.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleClearCache}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/20 border border-red-400/30 text-red-300 hover:bg-red-500/30 transition"
        >
          <Trash2 className="w-5 h-5" />
          Clear Editor Cache
        </button>
      </div>

      {/* Info */}
      <div className="glass border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-500/20 flex items-center justify-center">
            <Globe className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">About the Editor</h2>
            <p className="text-sm text-slate-400">How the site editor works</p>
          </div>
        </div>

        <div className="space-y-3 text-sm text-slate-400">
          <p>
            <strong className="text-white">Auto-save:</strong> All changes are automatically saved to your browser's local storage as you make them.
          </p>
          <p>
            <strong className="text-white">Analytics Preservation:</strong> When you edit businesses or spotlights, the analytics data (views, clicks, etc.) is preserved separately and won't be affected by your changes.
          </p>
          <p>
            <strong className="text-white">Server Sync:</strong> Changes are synced to the server in real-time. Use the "Sync All Changes" button to force a full sync.
          </p>
          <p>
            <strong className="text-white">Drag & Drop:</strong> Most lists support drag-and-drop reordering. Grab the handle on the left side of any item to move it.
          </p>
        </div>
      </div>
    </div>
  );
}
