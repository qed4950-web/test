"use client";

import { useState } from "react";
import { flavorService } from "@/services/api";
import {
    Dices, Palette, Swords, Sparkles,
    Loader2, RefreshCw, Volume2, VolumeX,
    Zap, Star, Trophy
} from "lucide-react";
import clsx from "clsx";

// Game Card Component
function GameCard({
    title,
    description,
    icon: Icon,
    color,
    onClick,
    children,
    isActive
}: {
    title: string;
    description: string;
    icon: any;
    color: string;
    onClick?: () => void;
    children?: React.ReactNode;
    isActive?: boolean;
}) {
    return (
        <div
            className={clsx(
                "relative rounded-2xl p-6 transition-all duration-300 cursor-pointer group overflow-hidden",
                isActive
                    ? "bg-zinc-800 border-2 scale-[1.02]"
                    : "bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 hover:scale-[1.01]",
                color === "violet" && (isActive ? "border-violet-500 shadow-lg shadow-violet-500/20" : "hover:shadow-violet-500/10"),
                color === "pink" && (isActive ? "border-pink-500 shadow-lg shadow-pink-500/20" : "hover:shadow-pink-500/10"),
                color === "cyan" && (isActive ? "border-cyan-500 shadow-lg shadow-cyan-500/20" : "hover:shadow-cyan-500/10"),
                color === "amber" && (isActive ? "border-amber-500 shadow-lg shadow-amber-500/20" : "hover:shadow-amber-500/10")
            )}
            onClick={onClick}
        >
            {/* Glow effect */}
            <div className={clsx(
                "absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-opacity",
                color === "violet" && "bg-violet-500",
                color === "pink" && "bg-pink-500",
                color === "cyan" && "bg-cyan-500",
                color === "amber" && "bg-amber-500"
            )} />

            <div className="relative z-10">
                <div className={clsx(
                    "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                    color === "violet" && "bg-violet-500/20 text-violet-400",
                    color === "pink" && "bg-pink-500/20 text-pink-400",
                    color === "cyan" && "bg-cyan-500/20 text-cyan-400",
                    color === "amber" && "bg-amber-500/20 text-amber-400"
                )}>
                    <Icon className="w-6 h-6" />
                </div>

                <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
                <p className="text-sm text-zinc-400 mb-4">{description}</p>

                {children}
            </div>
        </div>
    );
}

export default function PlaygroundPage() {
    const [activeGame, setActiveGame] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);

    // Naming Roulette
    const [namingResult, setNamingResult] = useState<string[]>([]);
    const [isSpinning, setIsSpinning] = useState(false);

    // Vibe
    const [vibeResult, setVibeResult] = useState<any>(null);

    // Battle
    const [battleResult, setBattleResult] = useState<any>(null);

    const handleNamingRoulette = async () => {
        setIsSpinning(true);
        setNamingResult([]);

        // Simulate spinning animation
        const demoNames = [
            "불꽃 시그니처", "미드나잇 크런치", "골든 하모니",
            "스모키 블리스", "트러플 드림", "크리스피 인페르노"
        ];

        for (let i = 0; i < 8; i++) {
            await new Promise(r => setTimeout(r, 100 + i * 50));
            setNamingResult([demoNames[Math.floor(Math.random() * demoNames.length)]]);
        }

        // Final result
        await new Promise(r => setTimeout(r, 300));
        setNamingResult([
            "🔥 시그니처 블레이즈",
            "✨ 골든 크런치 마스터",
            "🌙 미드나잇 스모크"
        ]);
        setIsSpinning(false);
    };

    const handleVibeAnalysis = async () => {
        setLoading(true);
        try {
            await new Promise(r => setTimeout(r, 2000));
            setVibeResult({
                dna: "SPICY-UMAMI-SMOKY",
                mood: "🔥 Intense & Bold",
                colors: ["#FF6B35", "#F7C59F", "#2E2E2E"],
                music: "Lo-fi Hip Hop × Jazz",
                scent: "훈제 향, 마늘, 버터"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleBattle = async () => {
        setLoading(true);
        try {
            await new Promise(r => setTimeout(r, 2500));
            setBattleResult({
                winner: "불맛 버거",
                loser: "크리미 버거",
                score: { winner: 87, loser: 72 },
                reason: "강렬한 첫인상과 중독성에서 승리"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                        🎮 Flavor Playground
                    </h1>
                    <p className="text-zinc-500 mt-1">맛의 실험실에서 마음껏 놀아보세요</p>
                </div>

                <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors"
                >
                    {soundEnabled ? (
                        <Volume2 className="w-5 h-5 text-zinc-400" />
                    ) : (
                        <VolumeX className="w-5 h-5 text-zinc-600" />
                    )}
                </button>
            </div>

            {/* Game Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Naming Roulette */}
                <GameCard
                    title="🎲 네이밍 룰렛"
                    description="AI가 생성하는 창의적인 메뉴 이름"
                    icon={Dices}
                    color="violet"
                    isActive={activeGame === "naming"}
                    onClick={() => setActiveGame("naming")}
                >
                    {activeGame === "naming" && (
                        <div className="mt-4 space-y-4">
                            <button
                                onClick={handleNamingRoulette}
                                disabled={isSpinning}
                                className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl font-medium hover:from-violet-500 hover:to-purple-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isSpinning ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        룰렛 돌리는 중...
                                    </>
                                ) : (
                                    <>
                                        <Dices className="w-4 h-4" />
                                        룰렛 돌리기
                                    </>
                                )}
                            </button>

                            {namingResult.length > 0 && !isSpinning && (
                                <div className="space-y-2 animate-in fade-in">
                                    {namingResult.map((name, i) => (
                                        <div
                                            key={i}
                                            className="p-3 bg-violet-500/10 border border-violet-500/30 rounded-xl text-violet-300 font-medium"
                                        >
                                            {name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </GameCard>

                {/* Vibe Analysis */}
                <GameCard
                    title="🎨 Vibe 실험"
                    description="메뉴의 분위기를 분석하고 시각화"
                    icon={Palette}
                    color="pink"
                    isActive={activeGame === "vibe"}
                    onClick={() => setActiveGame("vibe")}
                >
                    {activeGame === "vibe" && (
                        <div className="mt-4 space-y-4">
                            <button
                                onClick={handleVibeAnalysis}
                                disabled={loading}
                                className="w-full py-3 bg-gradient-to-r from-pink-600 to-rose-600 rounded-xl font-medium hover:from-pink-500 hover:to-rose-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        Vibe 분석
                                    </>
                                )}
                            </button>

                            {vibeResult && (
                                <div className="space-y-3 animate-in fade-in">
                                    <div className="p-3 bg-pink-500/10 border border-pink-500/30 rounded-xl">
                                        <div className="text-xs text-pink-400 mb-1">Sensory DNA</div>
                                        <div className="text-pink-200 font-mono">{vibeResult.dna}</div>
                                    </div>
                                    <div className="p-3 bg-pink-500/10 border border-pink-500/30 rounded-xl">
                                        <div className="text-xs text-pink-400 mb-1">Mood</div>
                                        <div className="text-pink-200">{vibeResult.mood}</div>
                                    </div>
                                    <div className="p-3 bg-pink-500/10 border border-pink-500/30 rounded-xl">
                                        <div className="text-xs text-pink-400 mb-2">Color Palette</div>
                                        <div className="flex gap-2">
                                            {vibeResult.colors.map((color: string, i: number) => (
                                                <div
                                                    key={i}
                                                    className="w-8 h-8 rounded-lg shadow-lg"
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </GameCard>

                {/* Flavor Battle */}
                <GameCard
                    title="⚔️ 맛 배틀"
                    description="두 메뉴를 비교 분석하고 승자를 가리기"
                    icon={Swords}
                    color="cyan"
                    isActive={activeGame === "battle"}
                    onClick={() => setActiveGame("battle")}
                >
                    {activeGame === "battle" && (
                        <div className="mt-4 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-center">
                                    <div className="text-2xl mb-1">🍔</div>
                                    <div className="text-sm text-cyan-300">불맛 버거</div>
                                </div>
                                <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-center">
                                    <div className="text-2xl mb-1">🍔</div>
                                    <div className="text-sm text-cyan-300">크리미 버거</div>
                                </div>
                            </div>

                            <button
                                onClick={handleBattle}
                                disabled={loading}
                                className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl font-medium hover:from-cyan-500 hover:to-blue-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Swords className="w-4 h-4" />
                                        배틀 시작!
                                    </>
                                )}
                            </button>

                            {battleResult && (
                                <div className="p-4 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-xl animate-in fade-in">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Trophy className="w-5 h-5 text-amber-400" />
                                        <span className="font-bold text-cyan-200">승자: {battleResult.winner}</span>
                                    </div>
                                    <div className="flex gap-4 mb-3">
                                        <div className="flex-1">
                                            <div className="text-xs text-cyan-400 mb-1">{battleResult.winner}</div>
                                            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-cyan-400 to-cyan-500"
                                                    style={{ width: `${battleResult.score.winner}%` }}
                                                />
                                            </div>
                                            <div className="text-right text-xs text-cyan-300 mt-1">{battleResult.score.winner}점</div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-xs text-zinc-500 mb-1">{battleResult.loser}</div>
                                            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-zinc-600"
                                                    style={{ width: `${battleResult.score.loser}%` }}
                                                />
                                            </div>
                                            <div className="text-right text-xs text-zinc-500 mt-1">{battleResult.score.loser}점</div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-zinc-400">{battleResult.reason}</p>
                                </div>
                            )}
                        </div>
                    )}
                </GameCard>

                {/* AI Prediction */}
                <GameCard
                    title="🔮 AI 예측"
                    description="맛 트렌드와 성공 확률 예측"
                    icon={Zap}
                    color="amber"
                    isActive={activeGame === "predict"}
                    onClick={() => setActiveGame("predict")}
                >
                    {activeGame === "predict" && (
                        <div className="mt-4 space-y-4">
                            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                                <div className="flex items-center gap-2 mb-3">
                                    <Star className="w-5 h-5 text-amber-400" />
                                    <span className="font-bold text-amber-200">2024 트렌드 예측</span>
                                </div>
                                <ul className="space-y-2 text-sm text-amber-100">
                                    <li className="flex items-center gap-2">
                                        <span className="text-amber-400">📈</span> 발효 풍미 +32%
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-amber-400">📈</span> 스모키 향 +28%
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-amber-400">📈</span> 감칠맛 강화 +45%
                                    </li>
                                </ul>
                            </div>

                            <div className="p-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl">
                                <div className="text-xs text-amber-400 mb-1">성공 확률</div>
                                <div className="text-3xl font-bold text-amber-200">87%</div>
                                <div className="text-xs text-amber-400/60 mt-1">현재 전략 기준</div>
                            </div>
                        </div>
                    )}
                </GameCard>
            </div>

            {/* Footer */}
            <div className="mt-12 text-center">
                <p className="text-zinc-600 text-sm">
                    💡 팁: 각 게임을 클릭해서 활성화하세요
                </p>
            </div>
        </div>
    );
}
