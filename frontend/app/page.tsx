"use client";

import { useEffect, useState } from 'react';
import { flavorService } from '@/services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import {
  Activity, ArrowUpRight, AlertTriangle, CheckCircle,
  FlaskConical, Layout, Zap, Clock, ShieldAlert, Loader2, PieChart
} from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';

export default function Dashboard() {
  const defaultTrendData = [
    { day: 'Mon', experiments: 3, success_rate: 78 },
    { day: 'Tue', experiments: 4, success_rate: 82 },
    { day: 'Wed', experiments: 2, success_rate: 74 },
    { day: 'Thu', experiments: 6, success_rate: 85 },
    { day: 'Fri', experiments: 7, success_rate: 88 },
    { day: 'Sat', experiments: 5, success_rate: 83 },
    { day: 'Sun', experiments: 6, success_rate: 90 },
  ];

  const [summary, setSummary] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [trendData, setTrendData] = useState(defaultTrendData);
  const [cfoRadar, setCfoRadar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [dashData, logData, trendResp, radarData] = await Promise.all([
        flavorService.getDashboardSummary(),
        flavorService.getLogs(),
        flavorService.getDashboardTrends(),
        flavorService.getCFORadar()
      ]);
      setSummary(dashData);
      setLogs(logData);
      setCfoRadar(radarData);
      if (trendResp?.trend?.length) {
        setTrendData(trendResp.trend);
      }
    } catch (e) {
      console.error("Dashboard load failed", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDemo = async () => {
    try {
      setSeeding(true);
      await flavorService.seedDemoData();
      await fetchData();
      window.location.href = "/lab";
    } catch (e) {
      console.error("Demo seed failed", e);
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400">
        대시보드 로딩 중...
      </div>
    );
  }

  const logCounts = logs.reduce(
    (acc, log) => {
      const type = log.event_type || "UNKNOWN";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  const lastLogTime = logs.length > 0 ? new Date(logs[0].ts).toLocaleString() : "No data";
  const hasActivity = (summary?.active_references || 0) > 0 || (summary?.queued_experiments || 0) > 0 || logs.length > 0;

  return (
    <div className="min-h-screen bg-white p-8 text-slate-900 relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50/50 blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-50/50 blur-[120px] -z-10" />

      {/* Header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">FlavorOS 연구소</h1>
          <p className="text-slate-500">미각 AI 파이프라인 & 연구 현황</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full shadow-sm">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-600">시스템 정상 가동</span>
        </div>
      </div>

      {/* Demo / Onboarding Banner */}
      {summary?.active_references === 0 && (
        <div className="mb-8 bg-white border border-slate-200 rounded-3xl p-6 flex items-center justify-between shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider rounded border border-indigo-100">데모 모드</span>
              <h2 className="text-lg font-bold text-slate-900">데이터가 없습니다</h2>
            </div>
            <p className="text-sm text-slate-500 max-w-lg">
              공간 사진으로 감각 큐레이션을 시작하거나, 샘플 레퍼런스로 연구 흐름을 빠르게 경험해보세요.<br />
              최종 산출물은 레시피이며, 설계도(Blueprints)에서 검토 및 적용됩니다.
            </p>
          </div>
          <div className="relative z-10 flex items-center gap-3">
            <Link
              href="/admin"
              className="px-5 py-3 font-semibold bg-indigo-600 text-white rounded-full shadow-md hover:bg-indigo-500 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <FlaskConical className="w-4 h-4 fill-current" />
              큐레이션 시작
            </Link>
            <button
              onClick={handleSeedDemo}
              disabled={seeding}
              className="px-5 py-3 font-semibold bg-white border border-slate-200 text-slate-600 rounded-full shadow-sm transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:transform-none flex items-center gap-2 hover:bg-slate-50 hover:text-slate-900"
            >
              {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
              {seeding ? "생성 중..." : "데모 시작"}
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link href="/references" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-slate-100 text-indigo-600 rounded-2xl group-hover:bg-white transition-colors">
              <Layout className="w-6 h-6" />
            </div>
            {(summary?.active_references || 0) > 0 && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">+12%</span>
            )}
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900 mb-1">{summary?.active_references || 0}</div>
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider group-hover:text-indigo-600 transition-colors">활성 레퍼런스</div>
          </div>
        </Link>

        <Link href="/lab" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-emerald-300 hover:bg-emerald-50/30 transition-all cursor-pointer group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-slate-100 text-emerald-600 rounded-2xl group-hover:bg-white transition-colors">
              <CheckCircle className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">최적</span>
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900 mb-1">{summary?.quality_score?.toFixed(1) || 95.0}</div>
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider group-hover:text-emerald-600 transition-colors">평균 모델 품질</div>
          </div>
        </Link>

        <Link href="/logs" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-rose-300 hover:bg-rose-50/30 transition-all cursor-pointer group">
          <div className="flex justify-between items-start mb-4">
            <div className={clsx("p-3 rounded-2xl transition-colors", (summary?.critical_alerts || 0) > 0 ? "bg-rose-50 text-rose-600 group-hover:bg-rose-100" : "bg-slate-100 text-slate-500")}>
              <ShieldAlert className="w-6 h-6" />
            </div>
            {(summary?.critical_alerts || 0) > 0 && <span className="animate-pulse w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.4)]"></span>}
          </div>
          <div>
            <div className={clsx("text-3xl font-bold mb-1", (summary?.pipeline_alerts || 0) > 0 ? "text-rose-600" : "text-slate-900")}>
              {summary?.pipeline_alerts || 0}
            </div>
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider group-hover:text-rose-600 transition-colors">시스템 알림</div>
          </div>
        </Link>

        <Link href="/strategies" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-slate-100 text-indigo-600 rounded-2xl group-hover:bg-white transition-colors">
              <FlaskConical className="w-6 h-6" />
            </div>
            {(summary?.queued_experiments || 0) > 0 && (
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">진행 중</span>
            )}
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900 mb-1">{summary?.queued_experiments || 0}</div>
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider group-hover:text-indigo-600 transition-colors">활성 실험</div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart / Empty State */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
          {hasActivity ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-600" />
                    실험 효율성 추이
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">주간 모델 성공률 및 실험량 분석</p>
                </div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <defs>
                      <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.8} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#0f172a', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      itemStyle={{ color: '#334155' }}
                      cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="success_rate"
                      name="모델 성공률 (%)"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                      activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: '#ecfdf5' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="experiments"
                      name="실험 수"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }}
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-indigo-600" />
                  아직 실험 데이터가 없습니다
                </h2>
                <p className="text-xs text-slate-500">흐름 시작: 공간 사진 → 감각 큐레이션 → 레시피 생성</p>
              </div>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
                <Link href="/admin" className="bg-slate-50 border border-slate-200 rounded-2xl p-4 hover:border-indigo-300 transition-all">
                  <div className="text-sm font-semibold text-slate-700">1. 공간 사진 업로드</div>
                  <div className="text-[10px] text-slate-500 mt-1">감각 큐레이션 시작</div>
                </Link>
                <Link href="/lab" className="bg-slate-50 border border-slate-200 rounded-2xl p-4 hover:border-emerald-300 transition-all">
                  <div className="text-sm font-semibold text-slate-700">2. 레시피 실험</div>
                  <div className="text-[10px] text-slate-500 mt-1">조합 생성 및 테스트</div>
                </Link>
                <Link href="/blueprints" className="bg-slate-50 border border-slate-200 rounded-2xl p-4 hover:border-indigo-300 transition-all">
                  <div className="text-sm font-semibold text-slate-700">3. 설계도 검토</div>
                  <div className="text-[10px] text-slate-500 mt-1">생성된 레시피 승인</div>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions & Activity */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-600" />
              빠른 작업
            </h2>
            <div className="grid grid-cols-1 gap-3">
              <Link href="/admin" className="group relative overflow-hidden bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl p-4 transition-all shadow-sm">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors border border-slate-100">
                      <FlaskConical className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 group-hover:text-indigo-700">공간 큐레이션</div>
                      <div className="text-[10px] text-slate-500">사진으로 감각 설계</div>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </Link>
              <Link href="/lab" className="group relative overflow-hidden bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-4 transition-all shadow-sm">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors border border-slate-100">
                      <FlaskConical className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 group-hover:text-emerald-700">새 실험 시작</div>
                      <div className="text-[10px] text-slate-500">맛 조합 연구</div>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </Link>

              <Link href="/blueprints" className="group relative overflow-hidden bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl p-4 transition-all shadow-sm">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors border border-slate-100">
                      <Layout className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 group-hover:text-indigo-700">설계도 관리</div>
                      <div className="text-[10px] text-slate-500">생성된 레시피 검토</div>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </Link>
              <Link href="/accounting" className="group relative overflow-hidden bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-100/50 rounded-2xl p-4 transition-all shadow-sm">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors border border-slate-100">
                      <PieChart className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 group-hover:text-emerald-700">재무/세무 (New)</div>
                      <div className="text-[10px] text-slate-500">AI 세액 공제 감지</div>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </Link>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              활동 요약
            </h2>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
                <div className="text-slate-500">마지막 이벤트</div>
                <div className="text-slate-900 font-semibold mt-1">{lastLogTime}</div>
              </div>
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
                <div className="text-slate-500">총 로그</div>
                <div className="text-slate-900 font-semibold mt-1">{logs.length}</div>
              </div>
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
                <div className="text-slate-500">오류</div>
                <div className="text-slate-900 font-semibold mt-1">{logCounts.ERROR || 0}</div>
              </div>
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
                <div className="text-slate-500">완료됨</div>
                <div className="text-slate-900 font-semibold mt-1">{logCounts.END || 0}</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              시스템 로그
            </h2>
            <div className="space-y-3">
              {logs.slice(0, 3).map((log, i) => (
                <div key={i} className="text-xs p-3 bg-slate-50 rounded-lg border border-slate-200 flex gap-2 items-start">
                  <div className={clsx("w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0",
                    log.event_type === 'ERROR' ? 'bg-red-500' :
                      log.event_type === 'END' ? 'bg-emerald-500' : 'bg-blue-500'
                  )} />
                  <div>
                    <span className="text-slate-700 font-medium block mb-0.5">{log.event_type}</span>
                    <span className="text-slate-500 block leading-tight">{log.msg}</span>
                    <span className="text-[10px] text-slate-400 mt-1 block">{new Date(log.ts).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-center py-4 text-xs text-slate-500">
                  기록된 로그가 없습니다.
                </div>
              )}
            </div>
            <Link href="/logs" className="block text-center text-xs text-indigo-600 hover:text-indigo-800 mt-4 py-2 hover:bg-indigo-50 rounded transition-colors">
              모든 로그 보기
            </Link>
          </div>

          {/* CFO Radar Widget */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900">CFO 역량 진단 (Beta)</h3>
              </div>
              <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-bold">LIVE</span>
            </div>

            <div className="flex-1 w-full h-[250px] relative z-10">
              {cfoRadar ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={cfoRadar.metrics}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      name="Capabilities"
                      dataKey="A"
                      stroke="#4f46e5"
                      strokeWidth={2}
                      fill="#6366f1"
                      fillOpacity={0.4}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">데이터 로딩 중...</div>
              )}
            </div>

            {cfoRadar && (
              <div className="mt-4 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                <p className="text-xs text-indigo-800 flex gap-2">
                  <span className="font-bold shrink-0">Insight:</span>
                  {cfoRadar.insight}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
