"use client";

export default function AdminSettings() {
  return (
    <div className="space-y-6">
      <div className="glass border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400 font-semibold">Settings</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white">Admin Settings</h2>
          <p className="text-sm text-slate-400">Control map defaults, navigation, and export preferences.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-100 font-semibold border border-white/10 transition">
            Save Changes
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass border border-white/10 rounded-2xl p-5 space-y-3">
          <h3 className="text-lg font-semibold text-white">Map Defaults</h3>
          <div className="space-y-2 text-sm text-slate-300">
            <label className="flex items-center justify-between gap-2">
              <span>Home Pitch</span>
              <input type="range" min="0" max="60" defaultValue="25" className="w-40 accent-sky-400" />
            </label>
            <label className="flex items-center justify-between gap-2">
              <span>Town Pitch</span>
              <input type="range" min="0" max="80" defaultValue="60" className="w-40 accent-sky-400" />
            </label>
            <label className="flex items-center justify-between gap-2">
              <span>Bearing</span>
              <input type="range" min="-30" max="30" defaultValue="-10" className="w-40 accent-sky-400" />
            </label>
          </div>
        </div>

        <div className="glass border border-white/10 rounded-2xl p-5 space-y-3">
          <h3 className="text-lg font-semibold text-white">Navigation & Footer</h3>
          <div className="space-y-2 text-sm text-slate-300">
            <label className="flex flex-col gap-1">
              <span>Footer Links</span>
              <input className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none" placeholder="About, Blogs, Contact, Partners" />
            </label>
            <label className="flex flex-col gap-1">
              <span>Support Email</span>
              <input className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none" placeholder="support@example.com" />
            </label>
          </div>
        </div>

        <div className="glass border border-white/10 rounded-2xl p-5 space-y-3">
          <h3 className="text-lg font-semibold text-white">Exports & Reports</h3>
          <div className="space-y-2 text-sm text-slate-300">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="accent-sky-400" defaultChecked />
              Include directions and calls in PDF exports
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="accent-sky-400" />
              Send weekly summary to businesses
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="accent-sky-400" defaultChecked />
              Enable CSV downloads in Analytics
            </label>
          </div>
        </div>

        <div className="glass border border-white/10 rounded-2xl p-5 space-y-3">
          <h3 className="text-lg font-semibold text-white">Theme</h3>
          <div className="space-y-2 text-sm text-slate-300">
            <label className="flex items-center gap-2">
              <input type="radio" name="theme" className="accent-sky-400" defaultChecked />
              Dark (current)
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="theme" className="accent-sky-400" />
              Light
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="theme" className="accent-sky-400" />
              System
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

