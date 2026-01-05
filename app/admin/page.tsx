"use client";

import { useState, useEffect, useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis, ResponsiveContainer } from "recharts";

interface TownStats {
  name: string;
  clicks: number;
  directions: number;
  calls: number;
  websites: number;
  blogReads: number;
  businesses: number;
}

interface DashboardData {
  overview: {
    totalClicks: number;
    totalDirections: number;
    totalCalls: number;
    totalShares: number;
    totalWebsites: number;
    totalInteractions: number;
  };
  towns: TownStats[];
  period: string;
}

interface TownDetailData {
  town: string;
  period: string;
  businesses: Array<{
    business: string;
    category: string;
    metrics: {
      clicks: number;
      directions: number;
      calls: number;
      websites: number;
      shares: number;
      total: number;
    };
  }>;
  totals: {
    clicks: number;
    directions: number;
    calls: number;
    websites: number;
    shares: number;
    totalInteractions: number;
  };
  businessCount: number;
}

import { logError } from "@/lib/logger";

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [selectedTown, setSelectedTown] = useState<TownDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    fetchDashboardData();
  }, [range]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`/api/admin/dashboard?range=${range}`);
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      logError('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTownClick = async (townName: string) => {
    try {
      const response = await fetch(`/api/admin/dashboard?town=${encodeURIComponent(townName)}&range=${range}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedTown(data);
      }
    } catch (error) {
      logError('Failed to fetch town data:', error);
    }
  };

  const downloadTownReport = () => {
    if (!selectedTown) return;

    const csvContent = [
      `Town: ${selectedTown.town}`,
      `Period: ${selectedTown.period}`,
      `Business Count: ${selectedTown.businessCount}`,
      '',
      'Business,Category,Clicks,Directions,Calls,Websites,Shares,Total',
      ...selectedTown.businesses.map(b =>
        `"${b.business}","${b.category}",${b.metrics.clicks},${b.metrics.directions},${b.metrics.calls},${b.metrics.websites},${b.metrics.shares},${b.metrics.total}`
      ),
      '',
      `Totals,${selectedTown.totals.clicks},${selectedTown.totals.directions},${selectedTown.totals.calls},${selectedTown.totals.websites},${selectedTown.totals.shares},${selectedTown.totals.totalInteractions}`
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTown.town}_${selectedTown.period}_report.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const statCards = useMemo(() => {
    if (!dashboardData) return [];

    const { overview } = dashboardData;
    return [
      {
        label: "Total Clicks",
        value: overview.totalClicks.toLocaleString(),
        delta: "+12% vs last month"
      },
      {
        label: "Directions",
        value: overview.totalDirections.toLocaleString(),
        delta: "+8% vs last month"
      },
      {
        label: "Calls",
        value: overview.totalCalls.toLocaleString(),
        delta: "+5% vs last month"
      },
      {
        label: "Shares",
        value: overview.totalShares.toLocaleString(),
        delta: "+14% vs last month"
      },
    ];
  }, [dashboardData]);

  const chartData = useMemo(() => {
    return dashboardData?.towns || [];
  }, [dashboardData]);

  return (
    <div className="space-y-6">
      <div className="glass border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400 font-semibold">Overview</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white">Admin Dashboard</h2>
          <p className="text-sm text-slate-400">Clicks, directions, and calls across all towns.</p>
        </div>
        <div className="flex gap-2">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as 'weekly' | 'monthly' | 'yearly')}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-100 font-semibold focus:outline-none focus:border-sky-400/60"
          >
            <option value="weekly">This Week</option>
            <option value="monthly">This Month</option>
            <option value="yearly">This Year</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass border border-white/10 rounded-2xl p-4 space-y-1 animate-pulse">
              <div className="h-3 bg-white/10 rounded mb-2"></div>
              <div className="h-8 bg-white/10 rounded mb-2"></div>
              <div className="h-3 bg-white/10 rounded w-24"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <div key={card.label} className="glass border border-white/10 rounded-2xl p-4 space-y-1">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-semibold">{card.label}</p>
              <p className="text-2xl font-bold text-white">{card.value}</p>
              <p className="text-xs text-emerald-300">{card.delta}</p>
            </div>
          ))}
        </div>
      )}

      <div className="glass border border-white/10 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Town Performance Metrics</h3>
            <p className="text-sm text-slate-400">Click on any town to see detailed statistics.</p>
          </div>
          <div className="flex gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-sky-500 rounded"></div>
              <span className="text-slate-400">Clicks</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-violet-500 rounded"></div>
              <span className="text-slate-400">Directions</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-emerald-500 rounded"></div>
              <span className="text-slate-400">Calls</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span className="text-slate-400">Websites</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-slate-400">Blog Reads</span>
            </div>
          </div>
        </div>
        <div className="h-80 w-full">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-white">Loading town statistics...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barCategoryGap={10}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  style={{ cursor: 'pointer' }}
                  onClick={(data) => {
                    if (data && data.value) {
                      handleTownClick(data.value);
                    }
                  }}
                />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                  cursor={{ fill: 'rgba(56, 189, 248, 0.1)' }}
                />
                <Bar
                  dataKey="clicks"
                  fill="#38bdf8"
                  radius={[2, 2, 0, 0]}
                  style={{ cursor: 'pointer' }}
                  onClick={(data) => {
                    if (data && data.name) {
                      handleTownClick(data.name);
                    }
                  }}
                />
                <Bar
                  dataKey="directions"
                  fill="#a855f7"
                  radius={[2, 2, 0, 0]}
                  style={{ cursor: 'pointer' }}
                  onClick={(data) => {
                    if (data && data.name) {
                      handleTownClick(data.name);
                    }
                  }}
                />
                <Bar
                  dataKey="calls"
                  fill="#10b981"
                  radius={[2, 2, 0, 0]}
                  style={{ cursor: 'pointer' }}
                  onClick={(data) => {
                    if (data && data.name) {
                      handleTownClick(data.name);
                    }
                  }}
                />
                <Bar
                  dataKey="websites"
                  fill="#f97316"
                  radius={[2, 2, 0, 0]}
                  style={{ cursor: 'pointer' }}
                  onClick={(data) => {
                    if (data && data.name) {
                      handleTownClick(data.name);
                    }
                  }}
                />
                <Bar
                  dataKey="blogReads"
                  fill="#ef4444"
                  radius={[2, 2, 0, 0]}
                  style={{ cursor: 'pointer' }}
                  onClick={(data) => {
                    if (data && data.name) {
                      handleTownClick(data.name);
                    }
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Town Details Modal */}
      {selectedTown && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass border border-white/10 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedTown.town} Statistics</h2>
                  <p className="text-slate-400">
                    {selectedTown.businessCount} businesses • {selectedTown.period} period
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={downloadTownReport}
                    className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold border border-sky-400/50 transition shadow-[0_0_20px_rgba(56,189,248,0.35)]"
                  >
                    Download Report
                  </button>
                  <button
                    onClick={() => setSelectedTown(null)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-100 font-semibold border border-white/10 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Town Summary */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6 mb-6">
                <div className="glass border border-white/10 rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-semibold">Total Interactions</p>
                  <p className="text-2xl font-bold text-white">{selectedTown.totals.totalInteractions.toLocaleString()}</p>
                </div>
                <div className="glass border border-white/10 rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-semibold">Clicks</p>
                  <p className="text-2xl font-bold text-sky-300">{selectedTown.totals.clicks.toLocaleString()}</p>
                </div>
                <div className="glass border border-white/10 rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-semibold">Directions</p>
                  <p className="text-2xl font-bold text-violet-300">{selectedTown.totals.directions.toLocaleString()}</p>
                </div>
                <div className="glass border border-white/10 rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-semibold">Calls</p>
                  <p className="text-2xl font-bold text-emerald-300">{selectedTown.totals.calls.toLocaleString()}</p>
                </div>
                <div className="glass border border-white/10 rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-semibold">Websites</p>
                  <p className="text-2xl font-bold text-orange-300">{selectedTown.totals.websites.toLocaleString()}</p>
                </div>
                <div className="glass border border-white/10 rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-semibold">Blog Reads</p>
                  <p className="text-2xl font-bold text-red-300">{selectedTown.businesses.reduce((sum, b) => sum + b.metrics.shares, 0).toLocaleString()}</p>
                </div>
              </div>

              {/* Business Breakdown */}
              <div className="glass border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/10">
                  <h3 className="text-lg font-semibold text-white">Business Performance</h3>
                  <p className="text-sm text-slate-400">Detailed statistics for each business in {selectedTown.town}</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Business</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Clicks</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Directions</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Calls</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Websites</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Shares</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {selectedTown.businesses.map((business, index) => (
                        <tr key={index} className="hover:bg-white/5 transition">
                          <td className="px-4 py-3 text-sm font-medium text-white">{business.business}</td>
                          <td className="px-4 py-3 text-sm text-slate-300">{business.category}</td>
                          <td className="px-4 py-3 text-sm text-right text-sky-300">{business.metrics.clicks.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-right text-violet-300">{business.metrics.directions.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-right text-emerald-300">{business.metrics.calls.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-right text-orange-300">{business.metrics.websites.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-right text-red-300">{business.metrics.shares.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-white">{business.metrics.total.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

