"use client";

import { useState, useEffect } from 'react';
import { flavorService } from '@/services/api';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend
} from 'recharts';
import { Sparkles, Copy, ArrowRightLeft, Compass, Wand2, ChevronRight, Zap, Brain, MessageSquare, TrendingUp } from 'lucide-react';
import clsx from 'clsx';

// 15-axis Flavor Vector (12 + 3 Behavior)
const FLAVOR_AXES = [
  // Taste (5)
  { key: 'salt', label: '짠맛', category: 'Taste' },
  { key: 'sweet', label: '단맛', category: 'Taste' },
  { key: 'sour', label: '신맛', category: 'Taste' },
  { key: 'bitter', label: '쓴맛', category: 'Taste' },
  { key: 'umami', label: '감칠맛', category: 'Taste' },
  // Texture (3)
  { key: 'fat', label: '기름기', category: 'Texture' },
  { key: 'crisp', label: '바삭함', category: 'Texture' },
  { key: 'juicy', label: '육즙', category: 'Texture' },
  // Aroma (4)
  { key: 'fire', label: '불향', category: 'Aroma' },
  { key: 'garlic', label: '마늘향', category: 'Aroma' },
  { key: 'fermented', label: '발효향', category: 'Aroma' },
  { key: 'spice', label: '향신료', category: 'Aroma' },
  // Behavior (3) - 기획1.md 핵심
  { key: 'addictiveness', label: '중독성', category: 'Behavior' },
  { key: 'satiety', label: '포만감', category: 'Behavior' },
  { key: 'repeat', label: '재구매', category: 'Behavior' },
];

// Strategy definitions with predictions
const STRATEGIES = [
  {
    id: 'COPY',
    name: 'Copy',
    icon: Copy,
    desc: '맛집을 그대로 복제',
    color: 'from-blue-500 to-indigo-600',
    predictions: {
      brandConflict: 0.72,
      priceMatch: 0.85,
      customerReaction: '검증된 맛, 신뢰감',
    },
  },
  {
    id: 'DISTANCE',
    name: 'Distance',
    icon: ArrowRightLeft,
    desc: '핵심만 가져오고 톤 유지',
    color: 'from-emerald-500 to-teal-600',
    predictions: {
      brandConflict: 0.15,
      priceMatch: 0.92,
      customerReaction: '익숙하면서 차별화',
    },
  },
  {
    id: 'DIRECTION',
    name: 'Direction',
    icon: Compass,
    desc: '반대 축으로 경쟁 회피',
    color: 'from-purple-500 to-violet-600',
    predictions: {
      brandConflict: 0.05,
      priceMatch: 0.78,
      customerReaction: '새로운 시도로 인식',
    },
  },
  {
    id: 'SIGNATURE',
    name: 'Signature',
    icon: Wand2,
    desc: '중독 구조만 차용, 새 맛',
    color: 'from-amber-500 to-orange-600',
    predictions: {
      brandConflict: 0.02,
      priceMatch: 0.65,
      customerReaction: '시그니처 메뉴 가능',
    },
  },
];

interface Reference {
  id: string;
  name: string;
  reference_type: string;
  menu_category: string;
  fingerprints: { vector: number[]; metrics_json?: Record<string, number> }[];
  tags?: string[];
}

export default function RecipeStrategyLab() {
  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRef1, setSelectedRef1] = useState<Reference | null>(null);
  const [selectedRef2, setSelectedRef2] = useState<Reference | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [alpha, setAlpha] = useState(50);
  const [isGenerating, setIsGenerating] = useState(false);
  const [blueprint, setBlueprint] = useState<any>(null);
  const [aiInterpretation, setAiInterpretation] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const refs = await flavorService.getReferences();
        setReferences(refs);
        const anchor = refs.find((r: Reference) => r.reference_type === 'ANCHOR');
        const brand = refs.find((r: Reference) => r.reference_type === 'BRAND');
        if (anchor) setSelectedRef1(anchor);
        if (brand) setSelectedRef2(brand);
      } catch (e) {
        console.error("Failed to load references", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Build chart data from 15-axis vectors (pad missing axes)
  const buildChartData = () => {
    const vec1 = selectedRef1?.fingerprints[0]?.vector || [];
    const vec2 = selectedRef2?.fingerprints[0]?.vector || [];
    const metrics1 = selectedRef1?.fingerprints[0]?.metrics_json || {};
    const metrics2 = selectedRef2?.fingerprints[0]?.metrics_json || {};

    return FLAVOR_AXES.map((axis, i) => {
      let ref1Val = vec1[i] || 0;
      let ref2Val = vec2[i] || 0;

      // Behavior axes from metrics_json
      if (axis.category === 'Behavior') {
        ref1Val = metrics1[axis.key] || 0;
        ref2Val = metrics2[axis.key] || 0;
      }

      return {
        axis: axis.label,
        ref1: ref1Val,
        ref2: ref2Val,
        blueprint: blueprint?.fingerprint_vector?.[i] || 0,
      };
    });
  };

  // Calculate distance
  const calculateDistance = () => {
    const vec1 = selectedRef1?.fingerprints[0]?.vector || [];
    const vec2 = selectedRef2?.fingerprints[0]?.vector || [];
    if (vec1.length === 0 || vec2.length === 0) return 0;
    const sum = vec1.reduce((acc, v, i) => acc + Math.pow(v - (vec2[i] || 0), 2), 0);
    return Math.sqrt(sum / vec1.length);
  };

  // Find top differences
  const findTopDifferences = () => {
    const vec1 = selectedRef1?.fingerprints[0]?.vector || [];
    const vec2 = selectedRef2?.fingerprints[0]?.vector || [];
    return FLAVOR_AXES.slice(0, 12).map((axis, i) => ({
      label: axis.label,
      diff: (vec1[i] || 0) - (vec2[i] || 0),
    }))
      .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
      .slice(0, 3);
  };

  // AI Interpretation (simulated - will be LLM in production)
  const generateAiInterpretation = () => {
    const topDiffs = findTopDifferences();
    const metrics1 = selectedRef1?.fingerprints[0]?.metrics_json || {};
    const metrics2 = selectedRef2?.fingerprints[0]?.metrics_json || {};

    const addictDiff = (metrics1.addictiveness || 0) - (metrics2.addictiveness || 0);

    return `
**분석 요약**
${selectedRef1?.name}은 ${topDiffs[0]?.label}(${topDiffs[0]?.diff > 0 ? '+' : ''}${topDiffs[0]?.diff.toFixed(1)})와 ${topDiffs[1]?.label}(${topDiffs[1]?.diff > 0 ? '+' : ''}${topDiffs[1]?.diff.toFixed(1)})에서 강점을 보입니다.

**중독성 분석**
Target 맛집의 중독성 점수가 ${addictDiff > 0 ? addictDiff.toFixed(0) + '점 높습니다' : '비슷합니다'}. 
${addictDiff > 20 ? '이는 감칠맛과 불향의 조합으로 "먹고 난 뒤 기억"을 만드는 구조 때문입니다.' : ''}

**전략 제안**
${addictDiff > 15
        ? 'Distance Reduce 전략을 권장합니다. 핵심 중독 구조(감칠맛+불향)만 가져오고 브랜드 톤을 유지하세요.'
        : 'Copy 전략으로 빠르게 성공 공식을 가져올 수 있습니다.'}
        `.trim();
  };

  useEffect(() => {
    if (selectedRef1 && selectedRef2) {
      setAiInterpretation(generateAiInterpretation());
    }
  }, [selectedRef1, selectedRef2]);

  const handleGenerate = async () => {
    if (!selectedRef1 || !selectedRef2 || !selectedStrategy) return;
    setIsGenerating(true);
    try {
      const refs = await flavorService.getReferences();
      const orgId = refs[0]?.fingerprints?.[0] ? 'd2fb0950-4ce8-4f32-9201-380b0c9a7928' : '';

      const tx = await flavorService.createTransform({
        org_id: orgId,
        mode: selectedStrategy,
        reference_1_id: selectedRef1.id,
        reference_2_id: selectedRef2.id,
        alpha: alpha / 100,
      });

      const poll = setInterval(async () => {
        const update = await flavorService.getTransform(tx.id);
        if (update.status === 'SUCCEEDED' && update.result_recipe_version_id) {
          clearInterval(poll);
          const version = await flavorService.getRecipeVersion(update.result_recipe_version_id);
          setBlueprint(version);
          setIsGenerating(false);
        } else if (update.status === 'FAILED') {
          clearInterval(poll);
          setIsGenerating(false);
        }
      }, 1000);
    } catch (e) {
      console.error(e);
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-gray-400">Loading Strategy Lab...</div>
      </div>
    );
  }

  const chartData = buildChartData();
  const distance = calculateDistance();
  const topDiffs = findTopDifferences();
  const currentStrategy = STRATEGIES.find(s => s.id === selectedStrategy);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-8 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Recipe Strategy Lab</h1>
              <p className="text-xs text-gray-500">잘 팔리는 맛집의 구조를 분석, 복제, 재설계</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
            <Brain className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-emerald-400 font-medium">AI Powered</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Left Panel - Reference Selector */}
        <div className="w-72 border-r border-gray-800 p-4 space-y-4 overflow-y-auto">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">References</h2>

          {/* Reference 1 */}
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded">TARGET</span>
            </div>
            <select
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
              value={selectedRef1?.id || ''}
              onChange={(e) => setSelectedRef1(references.find(r => r.id === e.target.value) || null)}
            >
              {references.filter(r => r.reference_type === 'ANCHOR').map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <div className="flex flex-wrap gap-1 mt-2">
              {['불향', '단짠', '중독성'].map(tag => (
                <span key={tag} className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 text-[9px] font-medium rounded-full border border-amber-500/20">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-center"><ChevronRight className="w-5 h-5 text-gray-600 rotate-90" /></div>

          {/* Reference 2 */}
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded">CURRENT</span>
            </div>
            <select
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              value={selectedRef2?.id || ''}
              onChange={(e) => setSelectedRef2(references.find(r => r.id === e.target.value) || null)}
            >
              {references.filter(r => r.reference_type === 'BRAND').map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          {/* Distance */}
          <div className="bg-gradient-to-r from-amber-500/10 to-emerald-500/10 rounded-xl p-4 border border-gray-700 text-center">
            <div className="text-[10px] text-gray-500 mb-1">Flavor Distance</div>
            <div className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-emerald-400 bg-clip-text text-transparent">
              {distance.toFixed(2)}
            </div>
          </div>

          {/* Gap Analysis */}
          <div>
            <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-2">Gap Top 3</h3>
            <div className="space-y-1.5">
              {topDiffs.map((d, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-800/30 rounded-lg px-3 py-1.5">
                  <span className="text-xs text-gray-300">{d.label}</span>
                  <span className={clsx("text-xs font-mono font-bold", d.diff > 0 ? "text-amber-400" : "text-emerald-400")}>
                    {d.diff > 0 ? '+' : ''}{d.diff.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center - Chart + AI Interpretation */}
        <div className="flex-1 p-6 space-y-4 overflow-y-auto">
          {/* Chart */}
          <div className="bg-gray-800/30 rounded-2xl border border-gray-700 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-400">15-Axis Flavor Vector</h2>
              <div className="flex gap-3 text-[10px]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Target</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Current</span>
                {blueprint && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Blueprint</span>}
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis dataKey="axis" tick={{ fill: '#9ca3af', fontSize: 9 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                  <Radar name="Target" dataKey="ref1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                  <Radar name="Current" dataKey="ref2" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                  {blueprint && <Radar name="Blueprint" dataKey="blueprint" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />}
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Interpretation Panel */}
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl border border-blue-500/30 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-5 h-5 text-blue-400" />
              <h2 className="text-sm font-bold text-blue-400">AI 해석</h2>
            </div>
            <div className="text-sm text-gray-300 whitespace-pre-line leading-relaxed">
              {aiInterpretation}
            </div>
          </div>
        </div>

        {/* Right Panel - Strategy + Generate */}
        <div className="w-80 border-l border-gray-800 p-4 space-y-4 overflow-y-auto">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Strategy Engine</h2>

          {/* Strategy Cards */}
          <div className="space-y-2">
            {STRATEGIES.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedStrategy(s.id)}
                className={clsx(
                  "w-full text-left p-3 rounded-xl border transition-all",
                  selectedStrategy === s.id
                    ? `bg-gradient-to-r ${s.color} border-transparent`
                    : "bg-gray-800/50 border-gray-700 hover:border-gray-600"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <s.icon className="w-4 h-4" />
                  <span className="font-bold text-sm">{s.name}</span>
                </div>
                <p className="text-xs text-white/70">{s.desc}</p>
              </button>
            ))}
          </div>

          {/* Prediction Panel */}
          {currentStrategy && (
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-3">결과 예측</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">브랜드 충돌</span>
                  <span className={clsx(
                    "font-bold",
                    currentStrategy.predictions.brandConflict > 0.5 ? "text-red-400" : "text-emerald-400"
                  )}>
                    {(currentStrategy.predictions.brandConflict * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">가격대 적합성</span>
                  <span className="font-bold text-emerald-400">
                    {(currentStrategy.predictions.priceMatch * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">고객 반응</span>
                  <span className="font-bold text-blue-400">
                    {currentStrategy.predictions.customerReaction}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* AI Level 4: Customer Simulation */}
          {currentStrategy && (
            <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl p-4 border border-cyan-500/30">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-cyan-400">고객 반응 시뮬레이션</h3>
              </div>
              <div className="space-y-3">
                {/* Persona 1 */}
                <div className="bg-gray-900/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">직장인 남성</span>
                  </div>
                  <p className="text-xs text-gray-300 italic">"처음엔 센데, 계속 손이 감"</p>
                  <div className="flex gap-4 mt-2 text-[10px]">
                    <span className="text-gray-500">재구매: <span className="text-emerald-400 font-bold">중상</span></span>
                    <span className="text-gray-500">가격저항: <span className="text-emerald-400 font-bold">낮음</span></span>
                  </div>
                </div>
                {/* Persona 2 */}
                <div className="bg-gray-900/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] bg-pink-500/20 text-pink-400 px-1.5 py-0.5 rounded">2030 여성</span>
                  </div>
                  <p className="text-xs text-gray-300 italic">"SNS에 올리고 싶은 비주얼"</p>
                  <div className="flex gap-4 mt-2 text-[10px]">
                    <span className="text-gray-500">재구매: <span className="text-amber-400 font-bold">중</span></span>
                    <span className="text-gray-500">입소문: <span className="text-emerald-400 font-bold">높음</span></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Level 5: Recipe Mutation (for Signature strategy) */}
          {selectedStrategy === 'SIGNATURE' && (
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl p-4 border border-amber-500/30">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-amber-400">벡터 변이 (Mutation)</h3>
              </div>
              <p className="text-[10px] text-gray-400 mb-3">성공 구조 유지하며 맛 표현 변경</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">🔥 불향</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-500">유지</span>
                    <div className="w-16 h-1.5 bg-amber-500/30 rounded-full overflow-hidden">
                      <div className="w-full h-full bg-amber-500 rounded-full"></div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">🍯 단맛</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-red-400">-30%</span>
                    <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div className="w-[70%] h-full bg-amber-500 rounded-full"></div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">🫚 발효향</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-emerald-400">+30%</span>
                    <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div className="w-full h-full bg-emerald-500 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-amber-300 mt-3 font-medium">→ "어디에도 없는 맛, 성공 구조는 유지"</p>
            </div>
          )}

          {/* Alpha Slider */}
          {(selectedStrategy === 'COPY' || selectedStrategy === 'DISTANCE') && (
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <div className="flex justify-between mb-2">
                <span className="text-xs text-gray-400">Intensity (α)</span>
                <span className="text-xs font-mono text-amber-400">{alpha}%</span>
              </div>
              <input
                type="range" min="10" max="100" value={alpha}
                onChange={(e) => setAlpha(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!selectedStrategy || isGenerating}
            className={clsx(
              "w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all",
              selectedStrategy && !isGenerating
                ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg shadow-amber-500/20"
                : "bg-gray-700 text-gray-500 cursor-not-allowed"
            )}
          >
            {isGenerating ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
            ) : (
              <><Zap className="w-4 h-4" /> Generate Blueprint</>
            )}
          </button>

          {/* Blueprint Output */}
          {blueprint && (
            <div className="bg-gradient-to-br from-purple-500/10 to-violet-500/10 rounded-xl p-4 border border-purple-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-purple-400">New Blueprint</span>
              </div>
              <div className="text-sm font-bold mb-2">{blueprint.version_label}</div>

              {/* Marketing Copy */}
              <div className="bg-gray-900/50 p-2 rounded-lg mb-2">
                <div className="text-[10px] text-gray-500 mb-1">마케팅 문구</div>
                <p className="text-xs text-amber-300">
                  "불향 가득, 한 입에 중독되는 맛"
                </p>
              </div>

              <div className="text-[10px] text-gray-400 font-mono bg-gray-900/50 p-2 rounded-lg">
                {blueprint.spec_yaml?.slice(0, 150)}...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
