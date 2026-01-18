"use client";

import { useEffect, useState } from 'react';
import { flavorService } from '@/services/api';
import {
  Beaker, Gamepad2, TrendingUp, Zap,
  Loader2, ArrowRight, Sparkles, Flame
} from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await flavorService.getDashboardSummary();
      setSummary(data);
    } catch (e) {
      console.error("Dashboard load failed", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-8">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 border border-orange-200 rounded-full mb-6 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          <span className="text-sm font-medium text-orange-700">AI 파이프라인 정상 가동</span>
        </div>

        <h1 className="text-5xl font-bold text-orange-900 mb-4 flex items-center justify-center gap-3">
          <Flame className="w-12 h-12 text-orange-500" />
          FlavorOS
        </h1>
        <p className="text-xl text-orange-600 mb-8">
          히트 메뉴를 설계하는 AI 엔진
        </p>

        {/* Quick Stats */}
        <div className="flex items-center justify-center gap-8 mb-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-900">{summary?.active_references || 0}</div>
            <div className="text-sm text-orange-500">레퍼런스</div>
          </div>
          <div className="w-px h-10 bg-orange-200" />
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-900">{summary?.quality_score?.toFixed(0) || 95}</div>
            <div className="text-sm text-orange-500">품질 점수</div>
          </div>
          <div className="w-px h-10 bg-orange-200" />
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-900">{summary?.queued_experiments || 0}</div>
            <div className="text-sm text-orange-500">실험 대기</div>
          </div>
        </div>
      </div>

      {/* Main Action Cards */}
      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6 mb-12">
        {/* Studio Card */}
        <Link
          href="/studio"
          className="group relative bg-white/80 backdrop-blur border border-orange-200 rounded-3xl p-8 hover:shadow-xl hover:shadow-orange-100 transition-all duration-300 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" />

          <div className="relative z-10">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-orange-200 group-hover:scale-110 transition-transform">
              <Beaker className="w-7 h-7 text-white" />
            </div>

            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-2xl font-bold text-orange-900">스튜디오</h2>
              <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-[10px] font-bold rounded uppercase">WORK</span>
            </div>

            <p className="text-orange-600 mb-6">
              레퍼런스 → DNA 분석 → 전략 수립 → 레시피 생성<br />
              <span className="text-orange-500 text-sm">하나의 연결된 워크플로우로 완결</span>
            </p>

            <div className="flex items-center gap-2 text-orange-500 group-hover:text-orange-700 transition-colors">
              <span className="font-medium">시작하기</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>

        {/* Playground Card */}
        <Link
          href="/playground"
          className="group relative bg-zinc-900 border border-zinc-800 rounded-3xl p-8 hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/30 to-pink-500/30 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" />

          <div className="relative z-10">
            <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-violet-500/20 group-hover:scale-110 transition-transform">
              <Gamepad2 className="w-7 h-7 text-white" />
            </div>

            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-2xl font-bold text-white">플레이그라운드</h2>
              <span className="px-2 py-0.5 bg-violet-500/20 text-violet-400 text-[10px] font-bold rounded uppercase">PLAY</span>
            </div>

            <p className="text-zinc-400 mb-6">
              네이밍 룰렛, Vibe 분석, 맛 배틀, AI 예측<br />
              <span className="text-zinc-500 text-sm">자유롭게 실험하는 놀이터</span>
            </p>

            <div className="flex items-center gap-2 text-violet-400 group-hover:text-violet-300 transition-colors">
              <span className="font-medium">놀러가기</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>
      </div>

      {/* Workflow Guide */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/60 backdrop-blur border border-orange-100 rounded-2xl p-6">
          <h3 className="font-bold text-orange-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-500" />
            FlavorOS 워크플로우
          </h3>

          <div className="flex items-center justify-between">
            {['레퍼런스 등록', 'DNA 분석', '전략 수립', '레시피 생성'].map((step, i) => (
              <div key={i} className="flex items-center">
                <div className="text-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full flex items-center justify-center text-orange-600 font-bold mb-2">
                    {i + 1}
                  </div>
                  <div className="text-xs text-orange-700">{step}</div>
                </div>
                {i < 3 && (
                  <div className="w-12 h-0.5 bg-gradient-to-r from-orange-200 to-amber-200 mx-2" />
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/studio"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium rounded-xl shadow-lg shadow-orange-200 hover:shadow-xl transition-all"
            >
              <Zap className="w-4 h-4" />
              스튜디오에서 시작하기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
