"use client";

import { useState, useEffect } from "react";
import { flavorService } from "@/services/api";
import {
    Sparkles, FlaskConical, Target, ChefHat,
    ArrowRight, Check, Loader2, Upload, Zap,
    TrendingUp, AlertCircle, UserCheck
} from "lucide-react";
import clsx from "clsx";
import MarketGapChart from "@/components/MarketGapChart";
import IngredientNetwork from "@/components/IngredientNetwork";
import FocusGroupChat from "@/components/FocusGroupChat";
import { motion, AnimatePresence } from "framer-motion";

// Step definitions
const STEPS = [
    { id: 1, name: "레퍼런스", icon: Sparkles, description: "맛의 기준점 설정" },
    { id: 2, name: "DNA 분석", icon: FlaskConical, description: "맛 프로파일 추출" },
    { id: 3, name: "전략 수립", icon: Target, description: "차별화 전략 도출" },
    { id: 4, name: "레시피", icon: ChefHat, description: "최종 레시피 생성" },
    { id: 5, name: "검증", icon: UserCheck, description: "AI 가상 시식회" },
];

export default function StudioPage() {
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [loadingText, setLoadingText] = useState("");
    const [references, setReferences] = useState<any[]>([]);
    const [selectedRef, setSelectedRef] = useState<any>(null);
    const [dnaResult, setDnaResult] = useState<any>(null);
    const [strategyResult, setStrategyResult] = useState<any>(null);
    const [recipeResult, setRecipeResult] = useState<any>(null);
    const [marketGapData, setMarketGapData] = useState<any>(null);
    const [pairingData, setPairingData] = useState<any>(null);
    const [tastingResult, setTastingResult] = useState<any>(null);

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

    const simulateLoading = async (texts: string[]) => {
        setLoading(true);
        for (const text of texts) {
            setLoadingText(text);
            await new Promise(r => setTimeout(r, 800));
        }
    };

    const handleAnalyzeDNA = async () => {
        if (!selectedRef) return;
        await simulateLoading(["성분 데이터 추출 중...", "맛 벡터 변환 중...", "DNA 프로파일 매핑 중..."]);

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
        setLoading(false);
        setCurrentStep(2);
    };

    const handleGenerateStrategy = async () => {
        await simulateLoading(["시장 트렌드 분석 중...", "경쟁사 메뉴 데이터 수집...", "블루오션 탐색 중..."]);

        try {
            const gapData = await flavorService.getMarketGap("burger");
            setMarketGapData(gapData);

            setStrategyResult({
                mode: "BLUE_OCEAN",
                alpha: 0.9,
                reasoning: gapData.reasoning,
                recommendations: [
                    "경쟁 없는 맛의 좌표 선점",
                    "극단적인 맛의 대비(Contrast) 활용",
                    "매니아층 타겟팅"
                ]
            });
            setCurrentStep(3);
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
        setLoading(false);
    };

    const handleApplyGapStrategy = () => {
        handleGenerateRecipe();
    };

    const handleGenerateRecipe = async () => {
        await simulateLoading(["재료 조합 시뮬레이션...", "맛 밸런스 최적화...", "조리법 생성 중...", "최종 레시피 확정"]);

        // Fetch pairing data for the main ingredient
        try {
            const coupling = await flavorService.getPairingNetwork("tomato"); // Main ingredient of burger sauce
            setPairingData(coupling);
        } catch (e) {
            console.error(e);
        }

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
        setLoading(false);
        setCurrentStep(4);
    };

    const handleSimulateTasting = async () => {
        if (!recipeResult) return;
        await simulateLoading(["페르소나 섭외 중...", "시식회 준비 중...", "5인의 심사위원 시식 중..."]);

        try {
            const result = await flavorService.simulateTasting({
                menu_name: recipeResult.name,
                description: recipeResult.description,
                ingredients: recipeResult.ingredients
            });
            setTastingResult(result);
            setCurrentStep(5);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
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
                            <div className="flex flex-col items-center relative z-10">
                                <motion.div
                                    initial={false}
                                    animate={{
                                        backgroundColor: currentStep >= step.id ? (currentStep === step.id ? "#fbbf24" : "#f97316") : "#ffedd5",
                                        scale: currentStep === step.id ? 1.1 : 1,
                                        boxShadow: currentStep === step.id ? "0 4px 12px rgba(251, 191, 36, 0.4)" : "none"
                                    }}
                                    transition={{ duration: 0.3 }}
                                    className={clsx(
                                        "w-12 h-12 rounded-xl flex items-center justify-center text-white transition-colors"
                                    )}
                                >
                                    <AnimatePresence mode="wait">
                                        {currentStep > step.id ? (
                                            <motion.div
                                                key="check"
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                exit={{ scale: 0 }}
                                            >
                                                <Check className="w-6 h-6" />
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="icon"
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                exit={{ scale: 0 }}
                                                className={currentStep === step.id ? "text-white" : "text-orange-300"}
                                            >
                                                <step.icon className="w-5 h-5" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                                <div className={clsx(
                                    "mt-2 text-sm font-medium transition-colors duration-300",
                                    currentStep >= step.id ? "text-orange-900" : "text-orange-300"
                                )}>
                                    {step.name}
                                </div>
                                <div className="text-[10px] text-orange-400">{step.description}</div>
                            </div>
                            {idx < STEPS.length - 1 && (
                                <div className="flex-1 h-1 mx-4 bg-orange-100 rounded-full relative overflow-hidden">
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-orange-400 to-amber-400"
                                        initial={{ x: "-100%" }}
                                        animate={{ x: currentStep > step.id ? "0%" : "-100%" }}
                                        transition={{ duration: 0.5, ease: "easeInOut" }}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Step 1: Reference Selection */}
                <motion.div
                    animate={{
                        opacity: currentStep >= 1 ? 1 : 0.4,
                        scale: currentStep === 1 ? 1.02 : 1,
                        boxShadow: currentStep === 1 ? "0 10px 30px -10px rgba(251, 146, 60, 0.3)" : "none",
                        borderColor: currentStep === 1 ? "#fdba74" : "#ffedd5"
                    }}
                    className="bg-white/80 backdrop-blur rounded-2xl border p-6 transition-all duration-300"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-5 h-5 text-orange-500" />
                        <h2 className="font-bold text-orange-900">1. 레퍼런스 선택</h2>
                    </div>

                    <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                        {references.length === 0 ? (
                            <div className="text-center py-8 text-orange-400">
                                <Upload className="w-8 h-8 mx-auto mb-2" />
                                <p className="text-sm">레퍼런스가 없습니다</p>
                            </div>
                        ) : (
                            references.map((ref, idx) => (
                                <motion.button
                                    key={ref.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => handleSelectReference(ref)}
                                    className={clsx(
                                        "w-full p-4 rounded-xl border text-left transition-all relative overflow-hidden",
                                        selectedRef?.id === ref.id
                                            ? "border-orange-400 bg-orange-50 shadow-md"
                                            : "border-orange-100 hover:border-orange-200 hover:bg-orange-50/50"
                                    )}
                                >
                                    {selectedRef?.id === ref.id && (
                                        <motion.div
                                            layoutId="active-highlight"
                                            className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500"
                                        />
                                    )}
                                    <div className="font-medium text-orange-900">{ref.name}</div>
                                    <div className="text-xs text-orange-500">{ref.menu_category}</div>
                                </motion.button>
                            ))
                        )}
                    </div>

                    {selectedRef && currentStep === 1 && (
                        <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleAnalyzeDNA}
                            disabled={loading}
                            className="w-full mt-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium rounded-xl shadow-lg shadow-orange-200 hover:shadow-xl transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>{loadingText}</span>
                                </div>
                            ) : (
                                <>
                                    DNA 분석 시작 <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </motion.button>
                    )}
                </motion.div>

                {/* Step 2: DNA Analysis */}
                <motion.div
                    animate={{
                        opacity: currentStep >= 2 ? 1 : 0.4,
                        scale: currentStep === 2 ? 1.02 : 1,
                        boxShadow: currentStep === 2 ? "0 10px 30px -10px rgba(251, 146, 60, 0.3)" : "none",
                        borderColor: currentStep === 2 ? "#fdba74" : "#ffedd5"
                    }}
                    className="bg-white/80 backdrop-blur rounded-2xl border border-orange-100 p-6 transition-all duration-300"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <FlaskConical className="w-5 h-5 text-orange-500" />
                        <h2 className="font-bold text-orange-900">2. DNA 분석</h2>
                    </div>

                    <AnimatePresence mode="wait">
                        {dnaResult ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="space-y-4"
                            >
                                <div className="text-sm text-orange-600 mb-4 font-medium flex items-center gap-2">
                                    <Check className="w-4 h-4" /> 맛 프로파일 추출 완료
                                </div>

                                {/* Flavor Bars - Animated */}
                                <div className="space-y-4">
                                    {Object.entries(dnaResult.profile).map(([key, value]: [string, any], idx) => (
                                        <div key={key}>
                                            <div className="flex justify-between text-xs mb-1.5">
                                                <span className="text-orange-800 font-medium capitalize">{key}</span>
                                                <motion.span
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: 0.5 + idx * 0.1 }}
                                                    className="text-orange-500 font-bold"
                                                >
                                                    {value}%
                                                </motion.span>
                                            </div>
                                            <div className="h-2.5 bg-orange-100 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${value}% ` }}
                                                    transition={{ duration: 1, delay: idx * 0.1, ease: "easeOut" }}
                                                    className="h-full bg-gradient-to-r from-orange-400 to-amber-400 rounded-full relative"
                                                >
                                                    <motion.div
                                                        className="absolute right-0 top-0 bottom-0 w-1 bg-white/50"
                                                        animate={{ opacity: [0, 1, 0] }}
                                                        transition={{ duration: 1.5, repeat: Infinity }}
                                                    />
                                                </motion.div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {currentStep === 2 && (
                                    <motion.button
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.8 }}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleGenerateStrategy}
                                        disabled={loading}
                                        className="w-full mt-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium rounded-xl shadow-lg shadow-orange-200 hover:shadow-xl transition-all flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>{loadingText}</span>
                                            </div>
                                        ) : (
                                            <>
                                                전략 생성 <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </motion.button>
                                )}
                            </motion.div>
                        ) : (
                            <div className="text-center py-8 text-orange-400">
                                <FlaskConical className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">레퍼런스를 선택하세요</p>
                            </div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Step 3: Strategy */}
                <motion.div
                    animate={{
                        opacity: currentStep >= 3 ? 1 : 0.4,
                        scale: currentStep === 3 ? 1.02 : 1,
                        boxShadow: currentStep === 3 ? "0 10px 30px -10px rgba(251, 146, 60, 0.3)" : "none",
                        borderColor: currentStep === 3 ? "#fdba74" : "#ffedd5"
                    }}
                    className="bg-white/80 backdrop-blur rounded-2xl border border-orange-100 p-6 transition-all duration-300"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Target className="w-5 h-5 text-orange-500" />
                        <h2 className="font-bold text-orange-900">3. 전략 수립</h2>
                    </div>

                    <AnimatePresence mode="wait">
                        {strategyResult && marketGapData ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="space-y-4"
                            >
                                <MarketGapChart
                                    data={marketGapData}
                                    onApplyStrategy={handleApplyGapStrategy}
                                />
                            </motion.div>
                        ) : (
                            <div className="text-center py-8 text-orange-400">
                                <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">DNA 분석을 완료하세요</p>
                            </div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* Step 4: Recipe Result (Full Width) */}
            <AnimatePresence>
                {recipeResult && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: "spring", stiffness: 100, damping: 20 }}
                        className="mt-6 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl p-8 text-white shadow-xl"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <motion.div
                                initial={{ rotate: -180, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ delay: 0.2 }}
                                className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm"
                            >
                                <ChefHat className="w-6 h-6" />
                            </motion.div>
                            <div>
                                <div className="text-xs text-white/70 uppercase tracking-wider mb-1">생성된 레시피</div>
                                <motion.h3
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-3xl font-bold"
                                >
                                    {recipeResult.name}
                                </motion.h3>
                            </div>
                        </div>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-white/90 text-lg mb-8 font-light"
                        >
                            {recipeResult.description}
                        </motion.p>

                        <div className="grid md:grid-cols-2 gap-6">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 }}
                                className="bg-white/10 backdrop-blur rounded-xl p-6 hover:bg-white/20 transition-colors"
                            >
                                <h4 className="font-bold mb-4 flex items-center gap-2 text-lg">
                                    🥘 재료 가이드
                                </h4>
                                <ul className="space-y-3">
                                    {recipeResult.ingredients.map((ing: string, i: number) => (
                                        <motion.li
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.6 + i * 0.1 }}
                                            className="flex items-center gap-3 text-white/90"
                                        >
                                            <div className="w-1.5 h-1.5 bg-white rounded-full shrink-0" />
                                            {ing}
                                        </motion.li>
                                    ))}
                                </ul>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 }}
                                className="bg-white/10 backdrop-blur rounded-xl p-6 hover:bg-white/20 transition-colors"
                            >
                                <h4 className="font-bold mb-4 flex items-center gap-2 text-lg">
                                    👃 맛 노트
                                </h4>
                                <p className="text-white/90 leading-relaxed text-lg font-serif italic">
                                    "{recipeResult.flavorNotes}"
                                </p>
                            </motion.div>
                            <div className="mt-8 flex gap-4">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-8 py-4 bg-white text-orange-600 font-bold rounded-xl hover:bg-orange-50 transition-colors shadow-lg"
                                >
                                    레시피 저장
                                </motion.button>

                                {/* Verification Button */}
                                {currentStep === 4 && (
                                    <motion.button
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleSimulateTasting}
                                        className="px-8 py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2"
                                    >
                                        <UserCheck className="w-5 h-5" /> AI 검증 시작
                                    </motion.button>
                                )}

                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        setCurrentStep(1);
                                        setDnaResult(null);
                                        setStrategyResult(null);
                                        setRecipeResult(null);
                                        setSelectedRef(null);
                                        setMarketGapData(null);
                                        setPairingData(null);
                                        setTastingResult(null);
                                    }}
                                    className="px-8 py-4 bg-white/20 text-white font-medium rounded-xl hover:bg-white/30 transition-colors"
                                >
                                    새로 시작
                                </motion.button>
                            </div>

                            {/* Pairing Network Section */}
                            {pairingData && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.8 }}
                                    className="mt-8 pt-8 border-t border-white/20"
                                >
                                    <div className="bg-white rounded-2xl p-2">
                                        <IngredientNetwork data={pairingData} />
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 5: Focus Group Chat */}
                            {tastingResult && (
                                <motion.div
                                    initial={{ opacity: 0, y: 50 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="mt-8 pt-8 border-t border-white/20"
                                >
                                    <div className="bg-white/10 p-2 rounded-3xl">
                                        <FocusGroupChat
                                            reviews={tastingResult.reviews}
                                            overallSentiment={tastingResult.overall_sentiment}
                                            improvementSuggestion={tastingResult.improvement_suggestion}
                                        />
                                    </div>
                                </motion.div>
                            )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
