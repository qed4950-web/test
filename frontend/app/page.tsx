"use client";

import Link from 'next/link';
import { Dna, Palette, FlaskConical, ArrowRight, Sparkles } from 'lucide-react';

const features = [
  {
    id: 'dna',
    name: 'Flavor DNA',
    korean: '맛 벡터 분석',
    description: '맛집 리뷰에서 맛의 유전자를 추출하고 시각화합니다. 12차원 벡터로 맛을 정량화합니다.',
    icon: Dna,
    color: 'from-purple-500 to-indigo-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    href: '/dna',
    features: ['맛 벡터 추출', 'DNA 시각화', '레퍼런스 등록']
  },
  {
    id: 'vibe',
    name: 'Vibe Lab',
    korean: '감각 큐레이션',
    description: '공간의 분위기를 분석하여 향, 색상, 음악을 통합 설계합니다.',
    icon: Palette,
    color: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    href: '/vibe',
    features: ['공간 사진 분석', '향/색/음악 큐레이션', '감각 시뮬레이션']
  },
  {
    id: 'experiment',
    name: 'AI Experiment',
    korean: 'AI 실험실',
    description: '맛 벡터를 조합하고 AI로 새로운 레시피를 창조합니다.',
    icon: FlaskConical,
    color: 'from-orange-500 to-red-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    href: '/experiment',
    features: ['맛 조합 실험', 'AI 레시피 변이', '고객 시뮬레이션']
  }
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white p-8">
      {/* Hero */}
      <div className="max-w-4xl mx-auto text-center mb-16">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4" />
          맛 데이터 AI 연구소
        </div>
        <h1 className="text-5xl font-bold text-slate-900 mb-4 tracking-tight">
          FlavorOS
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          맛과 향을 데이터로 변환하고, AI로 새로운 경험을 설계하는 연구소
        </p>
      </div>

      {/* 3 Feature Cards */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((feature) => (
          <Link
            key={feature.id}
            href={feature.href}
            className={`group relative p-8 rounded-3xl border-2 ${feature.borderColor} ${feature.bgColor} hover:shadow-2xl hover:scale-[1.02] transition-all duration-300`}
          >
            {/* Icon */}
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
              <feature.icon className="w-8 h-8 text-white" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-slate-900 mb-1">
              {feature.name}
            </h2>
            <p className="text-sm text-slate-500 mb-4">{feature.korean}</p>

            {/* Description */}
            <p className="text-slate-600 mb-6 leading-relaxed">
              {feature.description}
            </p>

            {/* Feature List */}
            <ul className="space-y-2 mb-6">
              {feature.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                  <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${feature.color}`} />
                  {f}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <div className="flex items-center gap-2 text-slate-900 font-medium group-hover:gap-3 transition-all">
              시작하기
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        ))}
      </div>

      {/* Footer */}
      <div className="max-w-4xl mx-auto text-center mt-16 text-sm text-slate-400">
        Powered by Local LLM (Gemma 3 4B) · FlavorOS v1.0
      </div>
    </div>
  );
}
