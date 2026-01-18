"use client";

import { useState, useEffect } from "react";
import { flavorService } from "@/services/api";
import {
    Sparkles, FlaskConical, Target, ChefHat,
    ArrowRight, Check, Loader2, Upload, Zap,
    TrendingUp, AlertCircle
} from "lucide-react";
import clsx from "clsx";

// Step definitions
const STEPS = [
    { id: 1, name: "레퍼런스", icon: Sparkles, description: "맛의 기준점 설정" },
    { id: 2, name: "DNA 분석", icon: FlaskConical, description: "맛 프로파일 추출" },
    { id: 3, name: "전략 수립", icon: Target, description: "차별화 전략 도출" },
    { id: 4, name: "레시피", icon: ChefHat, description: "최종 레시피 생성" },
];

export default function StudioPage() {
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [references, setReferences] = useState<any[]>([]);
    const [selectedRef, setSelectedRef] = useState<any>(null);
    const [dnaResult, setDnaResult] = useState<any>(null);
    const [strategyResult, setStrategyResult] = useState<any>(null);
    const [recipeResult, setRecipeResult] = useState<any>(null);

    useEffect(() => {
        loadReferences();
    }, []);

    const loadReferences = async () => {
        try {
            const data = await flavorService.getReferences();
            setReferences(data);
        } catch (e) {
            console.error("Failed to load references", e);
        }
    };

    const handleSelectReference = (ref: any) => {
        setSelectedRef(ref);
    };

    const handleAnalyzeDNA = async () => {
        if (!selectedRef) return;
        setLoading(true);
        try {
            // Simulate DNA analysis
            await new Promise(r => setTimeout(r, 1500));
            setDnaResult({
                vector: selectedRef.fingerprints?.[0]?.vector || [50, 60, 40, 70, 55],
                metrics: selectedRef.fingerprints?.[0]?.metrics_json || {},
                profile: {
                    spicy: 65,
                    sweet: 40,
                    savory: 80,
                    fresh: 55,
                    umami: 70
                }
            });
            setCurrentStep(2);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateStrategy = async () => {
        setLoading(true);
        try {
            // Simulate strategy generation
            await new Promise(r => setTimeout(r, 2000));
            setStrategyResult({
                mode: "REDIRECT",
                alpha: 0.7,
                reasoning: "현재 맛 프로파일에서 '감칠맛'을 강화하고 '단맛'을 줄이는 방향으로 차별화하면 경쟁력이 높아질 것으로 예측됩니다.",
                recommendations: [
                    "감칠맛 강화: 발효 재료 추가 (된장, 간장)",
                    "단맛 감소: 설탕 대신 천연 감미료",
                    "풍미 레이어링: 훈제 향 추가"
                ]
            });
            setCurrentStep(3);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateRecipe = async () => {
        setLoading(true);
        try {
            // Simulate recipe generation
            await new Promise(r => setTimeout(r, 2500));
            setRecipeResult({
                name: "시그니처 불맛 버거",
                description: "훈제 향과 깊은 감칠맛이 어우러진 프리미엄 버거",
                ingredients: [
                    "소고기 패티 180g (된장 마리네이드)",
                    "훈제 체다 치즈",
                    "캐러멜라이즈드 양파",
                    "트러플 아이올리",
                    "브리오슈 번"
                ],
                flavorNotes: "첫 입에서 훈제 향, 중반 감칠맛 폭발, 피니시에 은은한 단맛"
            });
            setCurrentStep(4);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-orange-900 mb-2">🔬 Flavor Studio</h1>
                <p className="text-orange-600">레퍼런스부터 레시피까지, 하나의 흐름으로</p>
            </div>

            {/* Stepper */}
            <div className="bg-white/80 backdrop-blur rounded-2xl border border-orange-100 p-6 mb-8 shadow-sm">
                <div className="flex items-center justify-between">
                    {STEPS.map((step, idx) => (
                        <div key={step.id} className="flex items-center flex-1">
                            <div className="flex flex-col items-center">
                                <div
                                    className={clsx(
                                        "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
                                        currentStep > step.id
                                            ? "bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-200"
                                            : currentStep === step.id
                                                ? "bg-gradient-to-br from-orange-400 to-amber-400 text-white shadow-lg shadow-orange-200 animate-pulse"
                                                : "bg-orange-100 text-orange-400"
                                    )}
                                >
                                    {currentStep > step.id ? (
                                        <Check className="w-5 h-5" />
                                    ) : (
                                        <step.icon className="w-5 h-5" />
                                    )}
                                </div>
                                <span className={clsx(
                                    "mt-2 text-sm font-medium",
                                    currentStep >= step.id ? "text-orange-900" : "text-orange-400"
                                )}>
                                    {step.name}
                                </span>
                                <span className="text-[10px] text-orange-500">{step.description}</span>
                            </div>
                            {idx < STEPS.length - 1 && (
                                <div className={clsx(
                                    "flex-1 h-1 mx-4 rounded-full transition-all duration-500",
                                    currentStep > step.id ? "bg-gradient-to-r from-orange-400 to-amber-400" : "bg-orange-100"
                                )} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Step 1: Reference Selection */}
                <div className={clsx(
                    "bg-white/80 backdrop-blur rounded-2xl border p-6 transition-all duration-300",
                    currentStep === 1 ? "border-orange-300 shadow-lg shadow-orange-100" : "border-orange-100"
                )}>
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-5 h-5 text-orange-500" />
                        <h2 className="font-bold text-orange-900">1. 레퍼런스 선택</h2>
                    </div>

                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                        {references.length === 0 ? (
                            <div className="text-center py-8 text-orange-400">
                                <Upload className="w-8 h-8 mx-auto mb-2" />
                                <p className="text-sm">레퍼런스가 없습니다</p>
                            </div>
                        ) : (
                            references.map((ref) => (
                                <button
                                    key={ref.id}
                                    onClick={() => handleSelectReference(ref)}
                                    className={clsx(
                                        "w-full p-4 rounded-xl border text-left transition-all",
                                        selectedRef?.id === ref.id
                                            ? "border-orange-400 bg-orange-50 shadow-md"
                                            : "border-orange-100 hover:border-orange-200 hover:bg-orange-50/50"
                                    )}
                                >
                                    <div className="font-medium text-orange-900">{ref.name}</div>
                                    <div className="text-xs text-orange-500">{ref.menu_category}</div>
                                </button>
                            ))
                        )}
                    </div>

                    {selectedRef && currentStep === 1 && (
                        <button
                            onClick={handleAnalyzeDNA}
                            disabled={loading}
                            className="w-full mt-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium rounded-xl shadow-lg shadow-orange-200 hover:shadow-xl transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    DNA 분석 시작 <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    )}
                </div>

                {/* Step 2: DNA Analysis */}
                <div className={clsx(
                    "bg-white/80 backdrop-blur rounded-2xl border p-6 transition-all duration-300",
                    currentStep === 2 ? "border-orange-300 shadow-lg shadow-orange-100" : "border-orange-100",
                    currentStep < 2 && "opacity-50"
                )}>
                    <div className="flex items-center gap-2 mb-4">
                        <FlaskConical className="w-5 h-5 text-orange-500" />
                        <h2 className="font-bold text-orange-900">2. DNA 분석</h2>
                    </div>

                    {dnaResult ? (
                        <div className="space-y-4">
                            <div className="text-sm text-orange-600 mb-4">맛 프로파일 추출 완료</div>

                            {/* Flavor Bars */}
                            <div className="space-y-3">
                                {Object.entries(dnaResult.profile).map(([key, value]: [string, any]) => (
                                    <div key={key}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-orange-700 capitalize">{key}</span>
                                            <span className="text-orange-500">{value}%</span>
                                        </div>
                                        <div className="h-2 bg-orange-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-orange-400 to-amber-400 rounded-full transition-all duration-1000"
                                                style={{ width: `${value}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {currentStep === 2 && (
                                <button
                                    onClick={handleGenerateStrategy}
                                    disabled={loading}
                                    className="w-full mt-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium rounded-xl shadow-lg shadow-orange-200 hover:shadow-xl transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            전략 생성 <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-orange-400">
                            <FlaskConical className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">레퍼런스를 선택하세요</p>
                        </div>
                    )}
                </div>

                {/* Step 3: Strategy */}
                <div className={clsx(
                    "bg-white/80 backdrop-blur rounded-2xl border p-6 transition-all duration-300",
                    currentStep === 3 ? "border-orange-300 shadow-lg shadow-orange-100" : "border-orange-100",
                    currentStep < 3 && "opacity-50"
                )}>
                    <div className="flex items-center gap-2 mb-4">
                        <Target className="w-5 h-5 text-orange-500" />
                        <h2 className="font-bold text-orange-900">3. 전략 수립</h2>
                    </div>

                    {strategyResult ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded">
                                    {strategyResult.mode}
                                </span>
                                <span className="text-xs text-orange-500">α = {strategyResult.alpha}</span>
                            </div>

                            <p className="text-sm text-orange-700 leading-relaxed">
                                {strategyResult.reasoning}
                            </p>

                            <div className="space-y-2">
                                {strategyResult.recommendations.map((rec: string, i: number) => (
                                    <div key={i} className="flex items-start gap-2 text-sm">
                                        <TrendingUp className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                                        <span className="text-orange-800">{rec}</span>
                                    </div>
                                ))}
                            </div>

                            {currentStep === 3 && (
                                <button
                                    onClick={handleGenerateRecipe}
                                    disabled={loading}
                                    className="w-full mt-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium rounded-xl shadow-lg shadow-orange-200 hover:shadow-xl transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            레시피 생성 <ChefHat className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-orange-400">
                            <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">DNA 분석을 완료하세요</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Step 4: Recipe Result (Full Width) */}
            {recipeResult && (
                <div className="mt-6 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl p-8 text-white shadow-xl animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <ChefHat className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-xs text-white/70 uppercase tracking-wider">생성된 레시피</div>
                            <h3 className="text-2xl font-bold">{recipeResult.name}</h3>
                        </div>
                    </div>

                    <p className="text-white/80 mb-6">{recipeResult.description}</p>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                            <h4 className="font-bold mb-3 flex items-center gap-2">
                                🥘 재료
                            </h4>
                            <ul className="space-y-2">
                                {recipeResult.ingredients.map((ing: string, i: number) => (
                                    <li key={i} className="flex items-center gap-2 text-sm text-white/90">
                                        <span className="w-1.5 h-1.5 bg-white/60 rounded-full" />
                                        {ing}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                            <h4 className="font-bold mb-3 flex items-center gap-2">
                                👃 맛 노트
                            </h4>
                            <p className="text-sm text-white/90 leading-relaxed">
                                {recipeResult.flavorNotes}
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                        <button className="px-6 py-3 bg-white text-orange-600 font-bold rounded-xl hover:bg-orange-50 transition-colors">
                            레시피 저장
                        </button>
                        <button
                            onClick={() => {
                                setCurrentStep(1);
                                setDnaResult(null);
                                setStrategyResult(null);
                                setRecipeResult(null);
                                setSelectedRef(null);
                            }}
                            className="px-6 py-3 bg-white/20 text-white font-medium rounded-xl hover:bg-white/30 transition-colors"
                        >
                            새로 시작
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
