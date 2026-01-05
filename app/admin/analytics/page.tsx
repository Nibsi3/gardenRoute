"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Line, LineChart, CartesianGrid, Tooltip, XAxis, YAxis, ResponsiveContainer, Legend } from "recharts";

import { logError } from '@/lib/logger';

export default function AdminAnalytics() {
  const [range, setRange] = useState<"daily" | "monthly" | "yearly">("daily");
  const [chartData, setChartData] = useState<any[]>([]);
  const [topBusinesses, setTopBusinesses] = useState<any[]>([]);
  const [blogReads, setBlogReads] = useState<any[]>([]);
  const [spotlightData, setSpotlightData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [range]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch business analytics (using first business as example for chart)
      const businessResponse = await fetch('/api/admin/analytics/business?name=George Blinds & Awnings&range=' + range);
      let businessData = [];
      if (businessResponse.ok) {
        const data = await businessResponse.json();
        businessData = data.data || [];
      }

      // Fetch top businesses (get all businesses and sort by clicks)
      const businessesResponse = await fetch('/api/admin/businesses');
      let businesses: any[] = [];
      if (businessesResponse.ok) {
        const data = await businessesResponse.json();
        const businessesArray = data.businesses || [];
        if (Array.isArray(businessesArray)) {
          businesses = businessesArray
            .sort((a: any, b: any) => (b.clicks || 0) - (a.clicks || 0))
            .slice(0, 5)
            .map((b: any) => ({
              name: b.name,
              town: b.town,
              clicks: b.clicks || 0,
              directions: 0, // Placeholder
              calls: b.calls || 0,
            }));
        }
      }

      // Fetch blog analytics
      const blogsResponse = await fetch('/api/admin/analytics/blogs?range=' + range);
      let blogs = [];
      if (blogsResponse.ok) {
        const data = await blogsResponse.json();
        blogs = data.posts || [];
      }

      // Fetch spotlight analytics
      const period = range === 'daily' ? '7d' : range === 'monthly' ? '30d' : 'all';
      const spotlightResponse = await fetch('/api/metrics/spotlight?period=' + period);
      let spotlight = [];
      if (spotlightResponse.ok) {
        const data = await spotlightResponse.json();
        spotlight = data.data || [];
      }

      setChartData(businessData);
      setTopBusinesses(businesses);
      setBlogReads(blogs);
      setSpotlightData(spotlight);
    } catch (error) {
      logError('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400 font-semibold">Analytics</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white">Clicks, Directions, Calls</h2>
          <p className="text-sm text-slate-400">Monitor performance by day and export reports for businesses.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-100 font-semibold border border-white/10 transition">
            Share Report
          </button>
        </div>
      </div>

      <div className="glass border border-white/10 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Weekly Trend</h3>
            <p className="text-sm text-slate-400">Track daily clicks, directions, and calls.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setRange("daily")}
              className={`px-3 py-2 rounded-lg border text-xs transition ${
                range === "daily"
                  ? "bg-sky-500/20 border-sky-400/50 text-white"
                  : "bg-white/5 border-white/10 text-slate-200 hover:bg-white/10"
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setRange("monthly")}
              className={`px-3 py-2 rounded-lg border text-xs transition ${
                range === "monthly"
                  ? "bg-sky-500/20 border-sky-400/50 text-white"
                  : "bg-white/5 border-white/10 text-slate-200 hover:bg-white/10"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setRange("yearly")}
              className={`px-3 py-2 rounded-lg border text-xs transition ${
                range === "yearly"
                  ? "bg-sky-500/20 border-sky-400/50 text-white"
                  : "bg-white/5 border-white/10 text-slate-200 hover:bg-white/10"
              }`}
            >
              Yearly
            </button>
          </div>
        </div>
        <div className="h-80 w-full">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-white">Loading chart data...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="label" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
                <Legend />
                <Line type="monotone" dataKey="clicks" stroke="#38bdf8" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="directions" stroke="#a855f7" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="calls" stroke="#22c55e" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="websites" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="shares" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="glass border border-white/10 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Top Businesses</h3>
        </div>
        <div className="overflow-hidden rounded-xl border border-white/10">
          <div className="grid grid-cols-5 bg-white/5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 px-4 py-3">
            <span>Name</span>
            <span>Town</span>
            <span>Clicks</span>
            <span>Directions</span>
            <span>Calls</span>
          </div>
          <div className="divide-y divide-white/5">
            {loading ? (
              <div className="px-4 py-8 text-center text-slate-400">Loading businesses...</div>
            ) : topBusinesses.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-400">No business data available</div>
            ) : (
              topBusinesses.map((biz) => (
                <div key={biz.name} className="grid grid-cols-5 px-4 py-3 text-sm text-slate-200 hover:bg-white/5 transition">
                  <span className="font-semibold text-white">{biz.name}</span>
                  <span className="text-slate-400">{biz.town}</span>
                  <span className="text-sky-300">{biz.clicks.toLocaleString()}</span>
                  <span className="text-violet-300">{biz.directions?.toLocaleString() || '0'}</span>
                  <span className="text-emerald-300">{biz.calls.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="glass border border-white/10 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Blog Reads</h3>
        </div>
        <div className="overflow-hidden rounded-xl border border-white/10">
          <div className="grid grid-cols-4 bg-white/5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 px-4 py-3">
            <span>Title</span>
            <span>Date</span>
            <span>Reads</span>
            <span>Shares</span>
          </div>
          <div className="divide-y divide-white/5">
            {loading ? (
              <div className="px-4 py-8 text-center text-slate-400">Loading blog analytics...</div>
            ) : blogReads.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-400">No blog data available</div>
            ) : (
              blogReads.map((post) => (
                <div key={post.title} className="grid grid-cols-4 px-4 py-3 text-sm text-slate-200 hover:bg-white/5 transition">
                  <span className="font-semibold text-white truncate">{post.title}</span>
                  <span className="text-slate-400">{post.date}</span>
                  <span className="text-sky-300">{post.reads.toLocaleString()}</span>
                  <span className="text-emerald-300">{post.shares.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Spotlight Analytics */}
      <div className="glass border border-white/10 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Spotlight Performance</h3>
            <p className="text-sm text-slate-400">Track views and clicks for featured businesses per location</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="text-xs text-amber-400 font-semibold">Featured</span>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-white/10">
          <div className="grid grid-cols-5 bg-white/5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 px-4 py-3">
            <span>Business</span>
            <span>Location</span>
            <span>Views</span>
            <span>Clicks</span>
            <span>Click Rate</span>
          </div>
          <div className="divide-y divide-white/5">
            {loading ? (
              <div className="px-4 py-8 text-center text-slate-400">Loading spotlight analytics...</div>
            ) : spotlightData.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-400">No spotlight data available yet</div>
            ) : (
              spotlightData.map((item: any) => (
                <div key={`${item.businessName}-${item.location}`} className="grid grid-cols-5 px-4 py-3 text-sm text-slate-200 hover:bg-white/5 transition">
                  <span className="font-semibold text-white truncate">{item.businessName}</span>
                  <span className="text-slate-400 capitalize">{item.location}</span>
                  <span className="text-amber-300">{item.views.toLocaleString()}</span>
                  <span className="text-sky-300">{item.clicks.toLocaleString()}</span>
                  <span className="text-emerald-300">{item.clickRate}%</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

