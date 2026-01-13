"use client";

import { Activity, TrendingUp, AlertOctagon, BarChart3, CalendarDays, ChefHat } from "lucide-react";
import clsx from "clsx";
import { useState, useEffect } from 'react';
import { flavorService } from '@/services/api';

export default function Home() {
  const [stores, setStores] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [storesData, recipesData, alertsData] = await Promise.all([
          flavorService.getStores(),
          flavorService.getRecipes(),
          flavorService.getAlerts()
        ]);
        setStores(storesData);
        setRecipes(recipesData);
        setAlerts(alertsData);
      } catch (e) {
        console.error("Failed to fetch data", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Calculate KPIs from real data
  const avgDeviation = stores.length > 0
    ? (stores.reduce((sum, s) => sum + parseFloat(s.deviation || 0), 0) / stores.length).toFixed(1)
    : "0.0";
  const flavorStability = stores.length > 0
    ? (100 - parseFloat(avgDeviation)).toFixed(1)
    : "100.0";
  const warningCount = stores.filter(s => parseFloat(s.deviation || 0) > 15 || s.status === 'WARNING').length;

  // Mock trend data for chart
  const trendData = [
    { day: '월', value: 94.2 },
    { day: '화', value: 93.8 },
    { day: '수', value: 92.5 },
    { day: '목', value: 93.1 },
    { day: '금', value: parseFloat(flavorStability) },
  ];

  return (
    <div className="p-6 min-h-[calc(100vh-64px)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col gap-1 mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Dashboard overview</h1>
        <p className="text-sm text-gray-500">Monitor your franchise stability and performance metrics.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Flavor Stability", value: flavorStability, unit: "Score", change: "+2.1%", icon: Activity, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Avg Deviation", value: avgDeviation, unit: "%", change: stores.length + " stores", icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Active Alerts", value: alerts.filter(a => a.is_resolved === 0).length.toString(), unit: "Issues", change: warningCount > 0 ? "Action Needed" : "All Good", icon: AlertOctagon, color: warningCount > 0 ? "text-amber-600" : "text-emerald-600", bg: warningCount > 0 ? "bg-amber-50" : "bg-emerald-50" },
          { label: "Active Recipes", value: recipes.length.toString(), unit: "Total", change: "In Library", icon: ChefHat, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{stat.label}</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold text-gray-900">{loading ? "..." : stat.value}</h3>
                  <span className="text-sm text-gray-400 font-medium">{stat.unit}</span>
                </div>
              </div>
              <div className={clsx("p-2 rounded-lg", stat.bg)}>
                <stat.icon className={clsx("w-4 h-4", stat.color)} />
              </div>
            </div>
            <div className="mt-3 flex items-center text-sm">
              <span className={clsx("font-medium", stat.color)}>{stat.change}</span>
              <span className="text-gray-400 ml-2 text-xs">vs last period</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content - Expanded */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Heatmap + Trend */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Heatmap Section */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex-1">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-semibold text-gray-900">Store Deviation Heatmap</h2>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500"></span>0-5%</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500"></span>5-15%</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500"></span>15%+</span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {loading ? (
                <div className="col-span-4 text-center py-8 text-gray-400">Loading stores...</div>
              ) : (
                stores.map((store, i) => {
                  const deviation = parseFloat(store.deviation) || 0;
                  return (
                    <div
                      key={store.id || i}
                      className={clsx(
                        "p-4 rounded-lg transition-all hover:scale-105 cursor-pointer",
                        deviation > 15 ? "bg-red-100 border border-red-200 hover:border-red-400" :
                          deviation > 5 ? "bg-amber-100 border border-amber-200 hover:border-amber-400" :
                            "bg-emerald-100 border border-emerald-200 hover:border-emerald-400"
                      )}
                    >
                      <div className="text-xs font-medium text-gray-700 mb-1 truncate">{store.name}</div>
                      <div className="text-xs text-gray-500 mb-2">{store.region || '지역 미지정'}</div>
                      <div className={clsx(
                        "text-xl font-bold font-mono",
                        deviation > 15 ? "text-red-600" :
                          deviation > 5 ? "text-amber-600" :
                            "text-emerald-600"
                      )}>{deviation.toFixed(1)}%</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Trend Chart Section */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-500" /> Weekly Stability Trend
              </h2>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <CalendarDays className="w-3 h-3" /> Last 5 days
              </span>
            </div>
            <div className="flex items-end justify-between h-32 gap-2">
              {trendData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className={clsx(
                      "w-full rounded-t-lg transition-all",
                      i === trendData.length - 1 ? "bg-blue-500" : "bg-blue-200"
                    )}
                    style={{ height: `${(d.value - 85) * 6}px` }}
                  />
                  <span className="text-xs text-gray-500 font-medium">{d.day}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4 pt-4 border-t border-gray-100">
              <div>
                <span className="text-xs text-gray-500">Average</span>
                <div className="text-lg font-bold text-gray-900">{(trendData.reduce((s, d) => s + d.value, 0) / trendData.length).toFixed(1)}%</div>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-500">Trend</span>
                <div className="text-lg font-bold text-emerald-600">↑ Improving</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Alerts + Quick Actions */}
        <div className="flex flex-col gap-6">
          {/* Alerts Feed - Expanded */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex-1">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-semibold text-gray-900">Active Alerts</h2>
              <span className={clsx(
                "px-2 py-0.5 text-[10px] font-bold rounded-full border",
                alerts.filter(a => a.is_resolved === 0).length > 0
                  ? "bg-red-50 text-red-700 border-red-100"
                  : "bg-emerald-50 text-emerald-700 border-emerald-100"
              )}>{alerts.filter(a => a.is_resolved === 0).length} Active</span>
            </div>
            <div className="space-y-0 divide-y divide-gray-100">
              {alerts.filter(a => a.is_resolved === 0).slice(0, 6).map((alert, i) => (
                <div key={i} className="py-3 flex gap-3 items-start hover:bg-gray-50 -mx-2 px-2 rounded transition-colors">
                  <div className={clsx(
                    "w-2 h-2 mt-1.5 rounded-full shrink-0",
                    alert.severity === 'CRITICAL' ? 'bg-red-500' :
                      alert.severity === 'HIGH' ? 'bg-orange-500' : 'bg-amber-500'
                  )} />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">{alert.message}</h4>
                    <p className="text-[10px] text-gray-400 mt-1 font-mono">{alert.alert_type} • {alert.severity}</p>
                  </div>
                </div>
              ))}
              {alerts.filter(a => a.is_resolved === 0).length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  <AlertOctagon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No active alerts
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl shadow-lg text-white">
            <h2 className="text-sm font-bold text-white/80 uppercase tracking-wider mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors text-left px-4">
                🧪 Generate New Recipe
              </button>
              <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors text-left px-4">
                🔍 Check All Deviations
              </button>
              <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors text-left px-4">
                📊 Export Monthly Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
