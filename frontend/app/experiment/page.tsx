"use client";

import { useState, useEffect, Suspense } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import {
    ArrowRight, Copy, ArrowRightLeft, Compass, Wand2, FlaskConical, Save, RotateCcw,
    Sparkles, Wind
} from 'lucide-react';
import clsx from 'clsx';
import { flavorService, Reference } from '@/services/api';
import { useRouter, useSearchParams } from 'next/navigation';
import InlineNotice from '@/components/InlineNotice';

const STRATEGIES = [
    {
        id: 'COPY',
        name: '카피 및 재현',
        icon: Copy,
        desc: '성공 공식을 정밀하게 재현',
        color: 'from-slate-500 to-slate-600',
        textColor: 'text-slate-500',
        activeBorder: 'border-slate-500',
        activeBg: 'bg-slate-100'
    },
    {
        id: 'DISTANCE',
        name: '거리 조절',
        icon: ArrowRightLeft,
        desc: '핵심은 유지하되 차별화',
        color: 'from-emerald-500 to-teal-600',
        textColor: 'text-emerald-600',
        activeBorder: 'border-emerald-500',
        activeBg: 'bg-emerald-50'
    },
    {
        id: 'REDIRECT', // Previously DIRECTION
        name: '방향 전환',
        icon: Compass,
        desc: '경쟁을 피해 새로운 방향으로',
        color: 'from-purple-500 to-violet-600',
        textColor: 'text-purple-600',
        activeBorder: 'border-purple-500',
        activeBg: 'bg-purple-50'
    },
    {
        id: 'SIGNATURE',
        name: '시그니처',
        icon: Wand2,
        desc: '독보적인 중독성 구조 설계',
        color: 'from-indigo-500 to-blue-600',
        textColor: 'text-indigo-600',
        activeBorder: 'border-indigo-500',
        activeBg: 'bg-indigo-50'
    }
];

function RecipeLabContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    // Core state
    const [mode, setMode] = useState('DISTANCE');
    const [distance, setDistance] = useState(30);
    const [redirectDirection, setRedirectDirection] = useState(0);
    const [redirectAxis, setRedirectAxis] = useState('spicy');

    const [references, setReferences] = useState<Reference[]>([]);
    const [chartData, setChartData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [ref1, setRef1] = useState<Reference | null>(null);
    const [ref2, setRef2] = useState<Reference | null>(null);
    const [seeding, setSeeding] = useState(false);
    const [notice, setNotice] = useState<{ tone: "info" | "success" | "warning" | "error"; message: string } | null>(null);

    // Layer controls
    const [layerLocks, setLayerLocks] = useState({ spray: false, oil: false, powder: false });
    const [selectedLayers, setSelectedLayers] = useState({ spray: true, oil: true, powder: true });

    // Results
    const [generatedCandidates, setGeneratedCandidates] = useState<any[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");

    useEffect(() => {
        async function loadData() {
            try {
                const refs = await flavorService.getReferences();
                setReferences(refs);

                const anchor = refs.find(r => r.reference_type === 'ANCHOR');
                const brand = refs.find(r => r.reference_type === 'BRAND');
                if (anchor) setRef1(anchor);
                if (brand) setRef2(brand);
            } catch (e) {
                console.error("Failed to fetch references", e);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const handleSeedDemo = async () => {
        try {
            setSeeding(true);
            await flavorService.seedDemoData();
            const refs = await flavorService.getReferences();
            setReferences(refs);
            const anchor = refs.find(r => r.reference_type === 'ANCHOR');
            const brand = refs.find(r => r.reference_type === 'BRAND');
            if (anchor) setRef1(anchor);
            if (brand) setRef2(brand);
        } catch (e) {
            console.error("Failed to seed demo data", e);
        } finally {
            setSeeding(false);
        }
    };

    useEffect(() => {
        if (!references.length) return;
        const modeParam = searchParams.get("mode");
        const alphaParam = searchParams.get("alpha");
        const anchorId = searchParams.get("anchor_id");
        const targetId = searchParams.get("target_id");

        if (modeParam) {
            setMode(modeParam);
        }
        if (alphaParam) {
            const parsedAlpha = Number(alphaParam);
            if (!Number.isNaN(parsedAlpha)) {
                setDistance(Math.round(parsedAlpha * 100));
            }
        }
        if (anchorId) {
            const anchorRef = references.find(r => r.id === anchorId);
            if (anchorRef) setRef1(anchorRef);
        }
        if (targetId) {
            const targetRef = references.find(r => r.id === targetId);
            if (targetRef) setRef2(targetRef);
        }
    }, [references, searchParams]);

    // [New] Vibe Concept Integration
    const vibeMode = searchParams.get("vibe_mode");
    const vibeEra = searchParams.get("vibe_era");
    const vibeScent = searchParams.get("vibe_scent");

    // Auto-select Strategy based on Vibe
    useEffect(() => {
        if (vibeMode) {
            // Suggest SIGNATURE strategy for new concepts
            setMode("SIGNATURE");
        }
    }, [vibeMode]);

    useEffect(() => {
        if (ref1 && ref2) updateChart(ref1, ref2);
    }, [ref1, ref2]);

    const updateChart = (a: Reference, b: Reference, cVec?: number[]) => {
        if (a.fingerprints.length > 0 && b.fingerprints.length > 0) {
            const subjects = ['탑 노트', '첫 맛', '짠맛', '여운', '물림', '감칠맛'];
            const newData = subjects.map((subj, i) => ({
                subject: subj,
                A: a.fingerprints[0].vector[i] || 0,
                B: b.fingerprints[0].vector[i] || 0,
                C: cVec ? cVec[i] : undefined,
                fullMark: 150
            }));
            setChartData(newData);
        }
    };

    const handleGenerate = async () => {
        if (!ref1 || !ref2) return;
        setIsGenerating(true);

        try {
            if (mode === 'SIGNATURE') {
                setStatusMessage("AI Recipe Mutation 엔진 가동 중...");

                // Use the new AI Mutation API
                const mutationResult = await flavorService.mutateRecipe(
                    {
                        name: ref1.name,
                        ingredients: [], // Placeholder: In real app, fetch full recipe 
                        flavor_profile: { spicy: 50, savory: 50 }, // Placeholder
                        steps: []
                    },
                    vibeScent ? `Signature twist with ${vibeScent} note` : "Create unique signature twist",
                    distance // using distance slider as intensity
                );

                if (mutationResult && mutationResult.mutated_recipe) {
                    // Create a mock version object to display in the list
                    const mutatedVersion = {
                        id: `mut-${Date.now()}`,
                        version_label: "AI Signature",
                        created_at: new Date().toISOString(),
                        fingerprint_vector: [80, 70, 60, 90, 40, 85], // Mock vector for visualization
                        metrics_json: mutationResult.mutated_recipe
                    };

                    setGeneratedCandidates(prev => [mutatedVersion, ...prev]);
                    updateChart(ref1, ref2, mutatedVersion.fingerprint_vector);
                    setStatusMessage("AI 변이 완료!");
                } else {
                    throw new Error("Mutation failed");
                }
                setTimeout(() => { setIsGenerating(false); setStatusMessage(""); }, 1000);
                return;
            }

            // Original Logic for other modes
            setStatusMessage("양자 변환 초기화 중...");
            const alphaValue = mode === 'COPY' ? 1.0 : mode === 'DISTANCE' ? distance / 100 : 0.5;
            const directionValue = mode === 'REDIRECT' ? redirectAxis : undefined;

            const tx = await flavorService.createTransform({
                org_id: ref1.org_id,
                mode: mode === 'REDIRECT' ? 'REDIRECT' : mode,
                reference_1_id: ref1.id,
                reference_2_id: ref2.id,
                alpha: alphaValue,
                direction_key: directionValue,
                layer_mask: { spray: selectedLayers.spray, oil: selectedLayers.oil, powder: selectedLayers.powder }
            });

            setStatusMessage("벡터 공간 최적화 중...");

            const poll = setInterval(async () => {
                const update = await flavorService.getTransform(tx.id);
                if (update.status === 'SUCCEEDED' && update.result_recipe_version_id) {
                    clearInterval(poll);
                    const version = await flavorService.getRecipeVersion(update.result_recipe_version_id);
                    setGeneratedCandidates(prev => [version, ...prev]);
                    updateChart(ref1, ref2, version.fingerprint_vector);
                    setStatusMessage("생성 완료!");
                    setTimeout(() => { setIsGenerating(false); setStatusMessage(""); }, 1000);
                } else if (update.status === 'FAILED') {
                    clearInterval(poll);
                    setIsGenerating(false);
                    setNotice({ tone: "error", message: "레시피 생성에 실패했어요. 다시 시도해주세요." });
                }
            }, 1000);
        } catch (e) {
            console.error(e);
            setIsGenerating(false);
            setNotice({ tone: "error", message: "작업을 시작하지 못했어요. 백엔드를 확인해주세요." });
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-white text-slate-500">연구소 로딩 중...</div>;

    if (!ref1 || !ref2) {
        return (
            <div className="h-screen flex items-center justify-center bg-white text-slate-900 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[500px] bg-indigo-50/50 blur-[100px] pointer-events-none" />
                <div className="text-center bg-white border border-slate-200 rounded-3xl p-10 shadow-xl relative z-10">
                    <FlaskConical className="w-12 h-12 mx-auto mb-4 text-indigo-300" />
                    <div className="text-lg font-bold text-slate-900 mb-2">실험 환경 설정 필요</div>
                    <div className="text-sm text-slate-500 mb-6">데모 데이터를 로드하거나, 백엔드 연결을 확인해주세요.</div>
                    <button
                        onClick={handleSeedDemo}
                        disabled={seeding}
                        className="px-6 py-3 text-sm font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 disabled:opacity-50 shadow-lg shadow-indigo-100"
                    >
                        {seeding ? "데이터 생성 중..." : "데모 데이터 로드"}
                    </button>
                </div>
            </div>
        );

    }

    const currentStrategy = STRATEGIES.find(s => s.id === mode);
    const hasCandidates = generatedCandidates.length > 0;

    return (
        <div className="h-screen flex flex-col bg-slate-50 text-slate-900 overflow-hidden font-sans">
            {/* Ambient Background */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-indigo-50/50 blur-[100px] pointer-events-none" />

            {/* Header */}
            <div className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 flex items-center justify-between z-20">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white border border-slate-200 rounded-xl text-orange-600 shadow-sm">
                        <FlaskConical className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-slate-900">AI Experiment</h1>
                        <p className="text-xs text-slate-500">맛 조합 실험실</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => { setGeneratedCandidates([]); setChartData(prev => prev.map(d => ({ ...d, C: undefined }))); }}
                        className="px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 rounded-full flex items-center gap-2 transition-colors">
                        <RotateCcw className="w-4 h-4" /> 초기화
                    </button>
                    <button
                        onClick={() => {
                            if (!hasCandidates) return;
                            const ids = generatedCandidates.map(c => c.id).join(',');
                            router.push(`/blueprints?highlight=${ids}`);
                        }}
                        disabled={!hasCandidates}
                        className={clsx(
                            "px-4 py-2 text-sm font-medium rounded-full flex items-center gap-2 shadow-sm transition-all",
                            hasCandidates
                                ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-100"
                                : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                        )}
                    >
                        <Save className="w-4 h-4" /> 설계도로 이동
                    </button>
                </div>
            </div>

            <div className="px-6 pt-4 relative z-10">
                {notice && (
                    <InlineNotice
                        tone={notice.tone}
                        message={notice.message}
                        onClose={() => setNotice(null)}
                    />
                )}
            </div>

            <div className="flex-1 flex overflow-hidden relative z-10">
                {/* Left Panel: References & Chart */}
                <div className="w-[380px] bg-white/80 border-r border-slate-200 flex flex-col overflow-y-auto backdrop-blur-sm">
                    <div className="p-6 border-b border-slate-200">
                        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Compass className="w-3 h-3" />
                            레퍼런스 정렬
                        </h2>
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50">
                                <div className="flex justify-between mb-1">
                                    <span className="text-[10px] font-bold text-indigo-600 px-2 py-0.5 rounded border border-indigo-200 bg-white">목표 (Anchor)</span>
                                </div>
                                <select
                                    className="w-full bg-transparent font-bold text-slate-900 text-lg focus:outline-none"
                                    value={ref1?.id || ''}
                                    onChange={(e) => setRef1(references.find(r => r.id === e.target.value) || null)}
                                >
                                    {references.filter(r => r.reference_type === 'ANCHOR').map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-center text-slate-300"><ArrowRight className="w-5 h-5 rotate-90" /></div>

                            <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/50">
                                <div className="flex justify-between mb-1">
                                    <span className="text-[10px] font-bold text-emerald-600 px-2 py-0.5 rounded border border-emerald-200 bg-white">현재 (Brand)</span>
                                </div>
                                <select
                                    className="w-full bg-transparent font-bold text-slate-900 text-lg focus:outline-none"
                                    value={ref2?.id || ''}
                                    onChange={(e) => setRef2(references.find(r => r.id === e.target.value) || null)}
                                >
                                    {references.filter(r => r.reference_type === 'BRAND').map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 p-6 flex flex-col">
                        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">맛 프로필 분석</h2>
                        <div className="h-64 w-full flex-1 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                    <PolarGrid stroke="#e2e8f0" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                                    <Radar name="Target" dataKey="A" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} />
                                    <Radar name="Current" dataKey="B" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
                                    {generatedCandidates.length > 0 && <Radar name="New" dataKey="C" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />}
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Center Panel: Experiment Controls */}
                <div className="flex-1 flex flex-col p-8 overflow-y-auto scrollbar-hide">


                    {/* Imported Concept Card */}
                    {vibeMode && (
                        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-8 flex items-start gap-4 animate-in fade-in slide-in-from-top-4 shadow-sm">
                            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600 shadow-sm">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Imported Concept</h3>
                                        <div className="text-sm text-slate-500 mt-1 flex items-center gap-3">
                                            <span>Mode: <strong className="text-indigo-600">{vibeMode}</strong></span>
                                            <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                            <span>Era: <strong className="text-indigo-600">{vibeEra || 'Modern'}</strong></span>
                                            {vibeScent && (
                                                <>
                                                    <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                                    <span className="flex items-center gap-1 text-emerald-600"><Wind className="w-3 h-3" /> {vibeScent}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest border border-indigo-200 px-2 py-1 rounded-full bg-indigo-50">
                                            AI SUGGESTION
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-600">
                                    <p>
                                        선택됨: <b>{vibeMode}</b> 무드 & <b>{vibeEra}</b> 시대. <span className="text-indigo-600 font-bold">시그니처</span> 전략 자동 선택됨.
                                        {vibeScent && <span> <b>{vibeScent}</b> 노트를 위한 벡터 변이 적용됨.</span>}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="max-w-3xl mx-auto w-full">
                        <div className="flex justify-between items-end mb-4">
                            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">전략 선택</h2>
                            {/* Quick Presets */}
                            <div className="flex gap-2">
                                {[
                                    { label: "완벽 카피 100%", mode: "COPY", alpha: 1.0 },
                                    { label: "거리 60%", mode: "DISTANCE", alpha: 0.6 },
                                    { label: "시그니처", mode: "SIGNATURE", alpha: 0.6 },
                                ].map((preset) => (
                                    <button
                                        key={preset.label}
                                        onClick={() => {
                                            setMode(preset.mode);
                                            setDistance(Math.round(preset.alpha * 100));
                                        }}
                                        className="px-3 py-1.5 text-[10px] font-bold rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Strategy Selector */}
                        <div className="grid grid-cols-4 gap-4 mb-8">
                            {STRATEGIES.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => setMode(s.id)}
                                    className={clsx(
                                        "p-5 rounded-3xl border text-left transition-all relative overflow-hidden group",
                                        mode === s.id
                                            ? `${s.activeBorder} ${s.activeBg} shadow-sm`
                                            : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300"
                                    )}
                                >
                                    {mode === s.id && <div className={clsx("absolute top-0 left-0 w-full h-1 bg-gradient-to-r", s.color)} />}
                                    <div className={clsx("mb-4 p-2 rounded-xl inline-block bg-white border border-slate-100", mode === s.id ? s.textColor : "text-slate-400")}>
                                        <s.icon className="w-6 h-6" />
                                    </div>
                                    <div className={clsx("font-bold text-lg mb-1", mode === s.id ? "text-slate-900" : "text-slate-500")}>{s.name}</div>
                                    <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                                </button>
                            ))}
                        </div>

                        {/* Controls */}
                        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                            {(mode === 'DISTANCE' || mode === 'COPY') && (
                                <div className="mb-8 relative z-10">
                                    <div className="flex justify-between mb-4">
                                        <label className="text-sm font-bold text-slate-900">변이 강도 (Mutation Alpha)</label>
                                        <span className="text-emerald-600 font-mono font-bold text-lg">{distance}%</span>
                                    </div>
                                    <input
                                        type="range" min="0" max="100" value={distance}
                                        onChange={(e) => setDistance(Number(e.target.value))}
                                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                    />
                                    <div className="flex justify-between mt-2 text-xs text-slate-400">
                                        <span>보수적 (Conservative)</span>
                                        <span>급진적 (Radical)</span>
                                    </div>
                                </div>
                            )}

                            {mode === 'REDIRECT' && (
                                <div className="mb-8 relative z-10">
                                    <label className="text-sm font-bold text-slate-900 block mb-4">회피 축 (Avoidance Axis)</label>
                                    <div className="flex gap-3">
                                        {['spicy', 'savory', 'clean', 'rich'].map(axis => (
                                            <button
                                                key={axis}
                                                onClick={() => setRedirectAxis(axis)}
                                                className={clsx(
                                                    "px-6 py-3 rounded-xl text-sm font-bold border transition-all flex-1",
                                                    redirectAxis === axis
                                                        ? "bg-purple-50 border-purple-200 text-purple-700"
                                                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                                                )}
                                            >
                                                {axis.charAt(0).toUpperCase() + axis.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {mode === 'SIGNATURE' && (
                                <div className="mb-8 bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100 relative z-10">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Sparkles className="w-4 h-4 text-indigo-600" />
                                        <span className="font-bold text-indigo-600 text-sm tracking-wide">AI VECTOR MUTATION</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                                        Preserving Anchor success structure while strategically mutating
                                        {vibeScent ? (
                                            <span className="text-emerald-600"> detected <b>{vibeScent}</b> note amplification </span>
                                        ) : " flavor expressions "}
                                        to design a new signature.
                                    </p>
                                    <div className="space-y-3">
                                        {[
                                            { label: 'Main Note', val: 'Keep' },
                                            { label: 'Sweetness', val: '-30%' },
                                            { label: vibeScent ? `${vibeScent} (Aroma)` : 'Fermentation', val: '+35%', highlight: true }
                                        ].map(m => (
                                            <div key={m.label} className="flex justify-between text-sm border-b border-indigo-200/50 pb-2 last:border-0">
                                                <span className="text-slate-600">{m.label}</span>
                                                <span className={clsx("font-mono font-bold", m.highlight ? "text-emerald-600" : "text-indigo-600")}>{m.val}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className={clsx(
                                    "w-full py-5 rounded-2xl font-bold text-lg shadow-sm transition-all flex items-center justify-center gap-3 relative z-10 group overflow-hidden",
                                    isGenerating
                                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                        : `bg-gradient-to-r ${currentStrategy?.color} text-white hover:scale-[1.01] active:scale-[0.99]`
                                )}
                            >
                                {isGenerating ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>양자 변환 처리 중...</span>
                                    </>
                                ) : (
                                    <>
                                        <FlaskConical className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                        <span>설계도 생성 (Generate Blueprint)</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Results */}
                <div className="w-[320px] bg-white border-l border-slate-200 flex flex-col p-6 overflow-y-auto backdrop-blur-md">
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-6">생성된 후보 (Generated Candidates)</h2>
                    <div className="space-y-4">
                        {generatedCandidates.length === 0 && (
                            <div className="text-center py-16 text-slate-400 text-xs border-2 border-dashed border-slate-200 rounded-2xl">
                                <FlaskConical className="w-8 h-8 mx-auto mb-3 opacity-20" />
                                생성된 후보가 없습니다<br />
                                실험을 시작하세요
                            </div>
                        )}
                        {generatedCandidates.map((v) => (
                            <div key={v.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:bg-slate-50 transition-all cursor-pointer group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-50/50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-indigo-100 transition-colors" />
                                <div className="flex justify-between items-start mb-3 relative z-10">
                                    <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded border border-indigo-100">{v.version_label}</span>
                                    <span className="text-[10px] text-slate-400">{new Date(v.created_at).toLocaleTimeString()}</span>
                                </div>
                                <div className="text-xs text-slate-500 mb-3 relative z-10">
                                    전략: <span className="font-bold text-slate-900">{mode}</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2 relative z-10">
                                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: '70%' }}></div>
                                </div>
                                <div className="text-[10px] text-slate-500 text-right font-mono relative z-10">일치도: <span className="text-indigo-600 font-bold">70%</span></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function RecipeLab() {
    return (
        <Suspense fallback={<div className="h-screen flex items-center justify-center bg-white text-slate-600">Lab 환경 로딩 중...</div>}>
            <RecipeLabContent />
        </Suspense>
    );
}
