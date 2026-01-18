"use client";

import { useState } from "react";
import {
    Dices, Mic2, Swords, Sparkles,
    RotateCw, Zap, Trophy
} from "lucide-react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import FlavorGalaxy from "@/components/FlavorGalaxy";

const GAMES = [
    { id: "naming", name: "네이밍 룰렛", icon: Dices, color: "from-pink-500 to-rose-500", desc: "힙한 메뉴 이름 랜덤 생성" },
    { id: "vibe", name: "Vibe 분석", icon: Mic2, color: "from-violet-500 to-purple-500", desc: "맛의 공감각적 시각화" },
    { id: "battle", name: "맛 배틀", icon: Swords, color: "from-cyan-500 to-blue-500", desc: "메뉴 vs 메뉴 가상 대결" },
    { id: "predict", name: "AI 점쟁이", icon: Sparkles, color: "from-amber-400 to-orange-500", desc: "출시 후 반응 예측" },
];

export default function PlaygroundPage() {
    const [activeGame, setActiveGame] = useState("naming");
    const [isSpinning, setIsSpinning] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handlePlay = async () => {
        setIsSpinning(true);
        setResult(null);

        // Simulate thinking/calculating time
        await new Promise(r => setTimeout(r, activeGame === "naming" ? 2000 : 1500));

        if (activeGame === "naming") {
            setResult("마라 로제 떡볶이 (Magic Hour Ver.)");
        } else if (activeGame === "vibe") {
            setResult({ score: 92, mood: "Hip & Energetic", color: "#FF0055" });
        } else if (activeGame === "battle") {
            setResult({ winner: "A", reason: "트렌드 적합도 15% 우세" });
        } else {
            setResult({ successRate: "88%", viralFactor: "High" });
        }

        setIsSpinning(false);
    };

    return (
        <div className="min-h-screen bg-zinc-950 p-8 text-white overflow-hidden relative">
            {/* Background Ambience */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-[128px]" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-[128px]" />

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 mb-12 text-center"
            >
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-pink-400 to-cyan-400 mb-2">
                    🕹️ Flavor Arcade
                </h1>
                <p className="text-zinc-400">심심할 때 돌려보는 창의력 실험실</p>
            </motion.div>

            {/* Unified Flavor Galaxy Section */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-12"
            >
                <div className="bg-slate-900 rounded-3xl p-1 border border-slate-800 shadow-2xl">
                    <FlavorGalaxy />
                </div>
            </motion.div>

            {/* Game Selection Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 relative z-10">
                {GAMES.map((game) => (
                    <motion.button
                        key={game.id}
                        onClick={() => { setActiveGame(game.id); setResult(null); }}
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        className={clsx(
                            "relative p-6 rounded-2xl border transition-all duration-300 overflow-hidden group text-left h-32 flex flex-col justify-between",
                            activeGame === game.id
                                ? "border-transparent bg-zinc-900 ring-2 ring-white/20"
                                : "border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800"
                        )}
                    >
                        {activeGame === game.id && (
                            <motion.div
                                layoutId="active-glow"
                                className={clsx("absolute inset-0 bg-gradient-to-br opacity-20", game.color)}
                            />
                        )}

                        <div className={clsx(
                            "w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors",
                            activeGame === game.id ? "bg-white/10 text-white" : "bg-zinc-800 text-zinc-500 group-hover:text-white"
                        )}>
                            <game.icon className="w-5 h-5" />
                        </div>

                        <div className="relative z-10">
                            <div className="font-bold text-sm">{game.name}</div>
                            <div className="text-[10px] text-zinc-500 truncate">{game.desc}</div>
                        </div>
                    </motion.button>
                ))}
            </div>

            {/* Active Game Stage */}
            <div className="max-w-2xl mx-auto relative z-10 min-h-[400px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeGame}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
                    >
                        {/* Ambient Glow for Active Card */}
                        <div className={clsx(
                            "absolute top-0 inset-x-0 h-1 bg-gradient-to-r",
                            GAMES.find(g => g.id === activeGame)?.color
                        )} />

                        {/* Content Switcher */}
                        <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">

                            {activeGame === "naming" && (
                                <>
                                    <motion.div
                                        animate={isSpinning ? { rotate: 360 } : { rotate: 0 }}
                                        transition={isSpinning ? { repeat: Infinity, ease: "linear", duration: 0.5 } : { type: "spring" }}
                                        className="w-32 h-32 mb-8 relative"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-tr from-pink-500 to-rose-500 rounded-full opacity-20 blur-xl animate-pulse" />
                                        <Dices className="w-full h-full text-pink-500 p-6 relative z-10" />
                                    </motion.div>

                                    {isSpinning ? (
                                        <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400 animate-pulse">
                                            힙한 이름 찾는 중...
                                        </div>
                                    ) : result ? (
                                        <motion.div
                                            initial={{ scale: 0.5, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="space-y-4"
                                        >
                                            <div className="text-sm text-pink-400 uppercase tracking-widest font-bold">Generated Name</div>
                                            <div className="text-4xl font-black text-white glow-text-pink">
                                                {result}
                                            </div>
                                            <div className="flex justify-center gap-2 mt-4">
                                                <span className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-400">#MZ세대</span>
                                                <span className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-400">#SNS각</span>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <p className="text-zinc-400 text-lg">버튼을 눌러 힙한 메뉴 이름을 생성해보세요!</p>
                                    )}
                                </>
                            )}

                            {activeGame === "battle" && (
                                <>
                                    <div className="flex items-center justify-center gap-8 mb-8">
                                        <motion.div
                                            animate={isSpinning ? { x: [0, -10, 0] } : {}}
                                            transition={{ repeat: Infinity, duration: 0.5 }}
                                            className="w-24 h-32 bg-zinc-800 rounded-xl border border-zinc-700 flex items-center justify-center"
                                        >
                                            <span className="text-2xl font-bold text-cyan-400">A</span>
                                        </motion.div>
                                        <div className="text-zinc-600 font-black text-2xl italic">VS</div>
                                        <motion.div
                                            animate={isSpinning ? { x: [0, 10, 0] } : {}}
                                            transition={{ repeat: Infinity, duration: 0.5 }}
                                            className="w-24 h-32 bg-zinc-800 rounded-xl border border-zinc-700 flex items-center justify-center"
                                        >
                                            <span className="text-2xl font-bold text-blue-400">B</span>
                                        </motion.div>
                                    </div>

                                    {result ? (
                                        <motion.div
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="bg-zinc-800/50 rounded-xl p-6 border border-cyan-500/30"
                                        >
                                            <div className="flex items-center justify-center gap-2 text-cyan-400 font-bold text-xl mb-2">
                                                <Trophy className="w-6 h-6" /> Winner: {result.winner}
                                            </div>
                                            <p className="text-zinc-300">{result.reason}</p>
                                        </motion.div>
                                    ) : (
                                        <p className="text-zinc-400">두 가지 옵션 중 승자를 예측합니다</p>
                                    )}
                                </>
                            )}

                            {/* Vibe & Predict placeholder */}
                            {(activeGame === "vibe" || activeGame === "predict") && (
                                <>
                                    <motion.div
                                        animate={isSpinning ? { scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] } : {}}
                                        transition={{ repeat: Infinity, duration: 1 }}
                                        className="mb-6"
                                    >
                                        {activeGame === "vibe" ? <Mic2 className="w-20 h-20 text-violet-500" /> : <Sparkles className="w-20 h-20 text-amber-500" />}
                                    </motion.div>
                                    {result ? (
                                        <motion.div
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            className="text-2xl font-bold text-white"
                                        >
                                            {activeGame === "vibe" ? "✨ " + result.mood : "📈 성공 확률: " + result.successRate}
                                        </motion.div>
                                    ) : (
                                        <p className="text-zinc-400">{activeGame === "vibe" ? "맛의 분위기를 분석합니다" : "출시 성과를 미리 예측해봅니다"}</p>
                                    )}
                                </>
                            )}

                            {/* Play Button */}
                            {!isSpinning && !result && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handlePlay}
                                    className={clsx(
                                        "mt-10 px-8 py-4 rounded-full font-bold text-white shadow-lg transition-all flex items-center gap-2",
                                        "bg-gradient-to-r hover:shadow-xl hover:shadow-white/10",
                                        GAMES.find(g => g.id === activeGame)?.color
                                    )}
                                >
                                    <Zap className="w-5 h-5 fill-current" />
                                    START GAME
                                </motion.button>
                            )}

                            {result && (
                                <motion.button
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    onClick={() => setResult(null)}
                                    className="mt-8 text-zinc-500 hover:text-white flex items-center gap-2 text-sm"
                                >
                                    <RotateCw className="w-4 h-4" /> 다시 하기
                                </motion.button>
                            )}

                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
