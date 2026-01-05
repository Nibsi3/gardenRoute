"use client";

import { useEffect, useState, useMemo } from "react";
import { logError } from "@/lib/logger";

type AdminBiz = {
  name: string;
  category: string;
  town: string;
  clicks: number;
  calls: number;
  websites: number;
};

type SortOption = "none" | "clicks-high" | "clicks-low" | "calls-high" | "calls-low" | "websites-high" | "websites-low";

export default function AdminBusinesses() {
  const [biz, setBiz] = useState<AdminBiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedTown, setSelectedTown] = useState("All Towns");
  const [sortBy, setSortBy] = useState<SortOption>("none");

  const categories = useMemo(() => {
    if (!Array.isArray(biz)) return [];
    return [...new Set(biz.map((b) => b.category))];
  }, [biz]);

  const towns = useMemo(() => {
    if (!Array.isArray(biz)) return [];
    return [...new Set(biz.map((b) => b.town))];
  }, [biz]);

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      const response = await fetch('/api/admin/businesses');
      if (response.ok) {
        const data = await response.json();
        const businessesArray = data.businesses || [];
        setBiz(Array.isArray(businessesArray) ? businessesArray : []);
      } else {
        setBiz([]);
      }
    } catch (error) {
      logError('Failed to fetch businesses:', error);
      setBiz([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBusiness = async (name: string) => {
    if (!confirm('Are you sure you want to delete this business?')) return;

    try {
      const response = await fetch('/api/admin/businesses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (response.ok) {
        setBiz(biz.filter(b => b.name !== name));
      }
    } catch (error) {
      logError('Failed to delete business:', error);
    }
  };

  const handleSendReport = async (businessName: string, period: string) => {
    if (!confirm(`Send ${period} report to ${businessName}?`)) return;

    try {
      const response = await fetch('/api/admin/reports/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName, period }),
      });

      if (response.ok) {
        alert('Report sent successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to send report: ${error.error}`);
      }
    } catch (error) {
      logError('Failed to send report:', error);
      alert('Failed to send report');
    }
  };

  const filteredBusinesses = useMemo(() => {
    let filtered = biz;

    if (searchTerm) {
      filtered = filtered.filter(business =>
        business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        business.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "All Categories") {
      filtered = filtered.filter(business => business.category === selectedCategory);
    }

    if (selectedTown !== "All Towns") {
      filtered = filtered.filter(business => business.town === selectedTown);
    }

    // Apply sorting
    if (sortBy !== "none") {
      filtered = [...filtered].sort((a, b) => {
        switch (sortBy) {
          case "clicks-high": return b.clicks - a.clicks;
          case "clicks-low": return a.clicks - b.clicks;
          case "calls-high": return b.calls - a.calls;
          case "calls-low": return a.calls - b.calls;
          case "websites-high": return b.websites - a.websites;
          case "websites-low": return a.websites - b.websites;
          default: return 0;
        }
      });
    }

    return filtered;
  }, [biz, searchTerm, selectedCategory, selectedTown, sortBy]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white">Loading businesses...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400 font-semibold">Businesses</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white">Manage Businesses</h2>
          <p className="text-sm text-slate-400">Add, reorder, and assign businesses to categories and towns.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-100 font-semibold border border-white/10 transition">
            Import CSV
          </button>
          <button className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold border border-sky-400/50 transition shadow-[0_0_20px_rgba(56,189,248,0.35)]">
            New Business
          </button>
        </div>
      </div>

      <div className="glass border border-white/10 rounded-2xl p-4 md:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <input
              placeholder="Search businesses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400/60"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-slate-200 focus:outline-none"
            >
              <option>All Categories</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <select
              value={selectedTown}
              onChange={(e) => setSelectedTown(e.target.value)}
              className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-slate-200 focus:outline-none"
            >
              <option>All Towns</option>
              {towns.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-400/60"
            >
              <option value="none">Sort By</option>
              <optgroup label="Clicks">
                <option value="clicks-high">Clicks: High to Low</option>
                <option value="clicks-low">Clicks: Low to High</option>
              </optgroup>
              <optgroup label="Calls">
                <option value="calls-high">Calls: High to Low</option>
                <option value="calls-low">Calls: Low to High</option>
              </optgroup>
              <optgroup label="Website">
                <option value="websites-high">Website: High to Low</option>
                <option value="websites-low">Website: Low to High</option>
              </optgroup>
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-white/10">
          <div className="grid grid-cols-7 bg-white/5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 px-4 py-3">
            <span>Name</span>
            <span>Category</span>
            <span>Town</span>
            <span>Clicks</span>
            <span>Calls</span>
            <span>Website</span>
            <span>Actions</span>
          </div>
          <div className="divide-y divide-white/5">
            {filteredBusinesses.map((item) => (
              <div
                key={item.name}
                className="grid grid-cols-7 px-4 py-3 text-sm text-slate-200 hover:bg-white/5 transition"
              >
                <span className="font-semibold text-white">{item.name}</span>
                <span>{item.category}</span>
                <span>{item.town}</span>
                <span className="text-sky-300">{item.clicks.toLocaleString()}</span>
                <span className="text-emerald-300">{item.calls.toLocaleString()}</span>
                <span className="text-violet-300">{item.websites.toLocaleString()}</span>
                <div className="flex flex-wrap gap-2 text-xs">
                  <button className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition">
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteBusiness(item.name)}
                    className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-rose-500/20 hover:border-rose-400/40 transition text-rose-200"
                  >
                    Remove
                  </button>
                  <button
                    onClick={() => handleSendReport(item.name, 'weekly')}
                    className="px-2 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/30 transition"
                  >
                    Send Weekly Report
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

