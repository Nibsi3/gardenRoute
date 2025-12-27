"use client";

import { businessPoints } from "@/lib/businessData";

type CategoryRow = {
  name: string;
  count: number;
  towns: string[];
  order: number;
};

const buildCategories = (): CategoryRow[] => {
  const map = new Map<string, { count: number; towns: Set<string> }>();
  Object.entries(businessPoints).forEach(([town, list]) => {
    list.forEach((b) => {
      if (!map.has(b.category)) map.set(b.category, { count: 0, towns: new Set() });
      const entry = map.get(b.category)!;
      entry.count += 1;
      entry.towns.add(town.charAt(0).toUpperCase() + town.slice(1));
    });
  });
  return Array.from(map.entries())
    .map(([name, data], idx) => ({
      name,
      count: data.count,
      towns: Array.from(data.towns).sort(),
      order: idx + 1,
    }))
    .sort((a, b) => a.order - b.order);
};

const categoryRows = buildCategories();

export default function AdminCategories() {
  return (
    <div className="space-y-6">
      <div className="glass border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400 font-semibold">Categories</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white">Manage Categories</h2>
          <p className="text-sm text-slate-400">Create, rename, remove, and reorder categories across towns.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-100 font-semibold border border-white/10 transition">
            Import
          </button>
          <button className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold border border-sky-400/50 transition shadow-[0_0_20px_rgba(56,189,248,0.35)]">
            New Category
          </button>
        </div>
      </div>

      <div className="glass border border-white/10 rounded-2xl p-4 md:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex gap-2">
            <input
              placeholder="Search categories..."
              className="rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400/60"
            />
            <button className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-200 text-xs hover:bg-white/10 transition">
              Reorder
            </button>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-200 text-xs hover:bg-white/10 transition">
              Export
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-white/10">
          <div className="grid grid-cols-5 bg-white/5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 px-4 py-3">
            <span>Name</span>
            <span>Businesses</span>
            <span>Towns</span>
            <span>Order</span>
            <span>Actions</span>
          </div>
          <div className="divide-y divide-white/5">
            {categoryRows.map((cat) => (
              <div
                key={cat.name}
                className="grid grid-cols-5 px-4 py-3 text-sm text-slate-200 hover:bg-white/5 transition"
              >
                <span className="font-semibold text-white">{cat.name}</span>
                <span>{cat.count}</span>
                <span>{cat.towns.join(", ")}</span>
                <span className="text-sky-300">{cat.order}</span>
                <div className="flex gap-2 text-xs">
                  <button className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition">
                    Edit
                  </button>
                  <button className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-rose-500/20 hover:border-rose-400/40 transition text-rose-200">
                    Remove
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

