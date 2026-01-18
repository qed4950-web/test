"use client";

import Link from 'next/link';
import { Dna, Sparkles, FlaskConical, ArrowRight } from 'lucide-react';

const features = [
  {
    name: 'Flavor DNA',
    description: '맛 데이터를 벡터로 변환하고 분석합니다',
    href: '/flavor-dna',
    icon: Dna,
    color: 'from-purple-500 to-indigo-600',
  },
  {
    name: 'Vibe Lab',
    description: '공간의 분위기를 향/색/음악으로 큐레이션합니다',
    href: '/vibe-lab',
    icon: Sparkles,
    color: 'from-pink-500 to-rose-600',
  },
  {
    name: 'AI Experiment',
    description: '맛 조합 실험과 AI 레시피 뮤테이션',
    href: '/experiment',
    icon: FlaskConical,
    color: 'from-emerald-500 to-teal-600',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full text-indigo-600 text-sm font-medium mb-6">
          <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
          AI Powered
        </div>
        <h1 className="text-5xl font-bold text-slate-900 mb-4 tracking-tight">
          Flavor<span className="text-indigo-600">OS</span>
        </h1>
        <p className="text-xl text-slate-600">
          맛과 향의 데이터를 탐구하는 AI 연구소
        </p>
      </div>

      {/* Feature Cards */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature) => (
          <Link
            key={feature.name}
            href={feature.href}
            className="group relative bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300"
          >
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              <feature.icon className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.name}</h3>
            <p className="text-slate-600 text-sm mb-4">{feature.description}</p>
            <div className="flex items-center gap-1 text-indigo-600 text-sm font-medium group-hover:gap-2 transition-all">
              시작하기
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        ))}
      </div>

      {/* Bottom Info */}
      <div className="max-w-4xl mx-auto mt-16 text-center">
        <p className="text-sm text-slate-500">
          Powered by Local LLM (Gemma 3 4B) • Metal GPU Accelerated
        </p>
      </div>
    </div>
  );
}
