"use client";

import { useState, useEffect } from "react";
import { Layers, Play, Loader2, FileText, TrendingUp, AlertTriangle, Target, Crosshair, Users } from 'lucide-react';
import clsx from 'clsx';
import { flavorService, Reference, StrategyReport } from "../../services/api";
import Link from "next/link";
import InlineNotice from "../../components/InlineNotice";

export default function StrategiesPage() {
    const [references, setReferences] = useState<Reference[]>([]);
    const [reports, setReports] = useState<StrategyReport[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamingLog, setStreamingLog] = useState("");
    const [streamingReasoning, setStreamingReasoning] = useState("");
    const [notice, setNotice] = useState<{ tone: "info" | "success" | "warning" | "error"; message: string } | null>(null);

    // Core state
    const [loading, setLoading] = useState(false);
    const [selectedAnchor, setSelectedAnchor] = useState<string>("");
    const [selectedCompetitors, setSelectedCompetitors] = useState<string[]>([]);
    const [selectedGoal, setSelectedGoal] = useState<string>("differentiate");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [refs, reps] = await Promise.all([
                flavorService.getReferences(),
                flavorService.getStrategyReports()
            ]);
            setReferences(refs);
            setReports(reps);

            // 자동으로 첫 번째 앵커와 경쟁사 선택
            const anchors = refs.filter(r => r.reference_type === 'ANCHOR');
            const competitors = refs.filter(r => r.reference_type === 'BRAND');
            if (anchors.length > 0 && !selectedAnchor) {
                setSelectedAnchor(anchors[0].id);
            }
            if (competitors.length > 0 && selectedCompetitors.length === 0) {
                setSelectedCompetitors([competitors[0].id]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const runAnalysis = async () => {
        if (!selectedAnchor || selectedCompetitors.length === 0) {
            setNotice({ tone: "warning", message: "앵커와 경쟁사를 선택해주세요." });
            return;
        }

        setIsStreaming(true);
        setStreamingLog("초기화 중...");
        setStreamingReasoning("");

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002'}/v1/strategies/analyze/stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    anchor_id: selectedAnchor,
                    competitor_ids: selectedCompetitors,
                    goal: selectedGoal
                })
            });

            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;
                const lines = buffer.split('\n\n');
                buffer = lines.pop() || "";

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        const jsonStr = line.slice(6);
                        try {
                            const data = JSON.parse(jsonStr);
                            if (data.type === 'progress') {
                                setStreamingLog(data.message);
                            } else if (data.type === 'token') {
                                setStreamingReasoning(prev => prev + data.text);
                            } else if (data.type === 'complete') {
                                setReports(prev => [data.result, ...prev]);
                                setIsStreaming(false);
                                setStreamingLog("분석 완료");
                            } else if (data.type === 'error') {
                                console.error(data.message);
                                setStreamingLog(`오류: ${data.message}`);
                                setIsStreaming(false);
                            }
                        } catch (e) {
                            console.error("JSON parse error", e);
                        }
                    }
                }
            }
        } catch (err) {
            console.error(err);
            setStreamingLog("스트리밍 연결 실패");
            setIsStreaming(false);
        }
    };

    const anchors = references.filter(r => r.reference_type === 'ANCHOR');
    const competitors = references.filter(r => r.reference_type === 'BRAND');

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 p-8 relative overflow-hidden font-sans">
            <div className="absolute top-0 right-0 w-[520px] h-[520px] bg-indigo-50 blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[520px] h-[520px] bg-purple-50 blur-[100px] pointer-events-none" />
            {/* Header */}
            <div className="flex items-center gap-3 mb-8 relative z-10">
                <div className="p-2 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <Layers className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">전략 분석 (Strategy Analysis)</h1>
                    <p className="text-sm text-slate-500">리포트 중심 인사이트 & 추천 (실시간 스트리밍)</p>
                </div>
            </div>

            {notice && (
                <InlineNotice
                    tone={notice.tone}
                    message={notice.message}
                    onClose={() => setNotice(null)}
                />
            )}

            {/* Analysis Section */}
            <div className="bg-white rounded-2xl p-6 mb-8 border border-slate-200 shadow-sm relative z-10">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900">
                    <Play className="w-5 h-5 text-indigo-600" /> 전략 분석 실행
                </h2>

                <div className="space-y-6 mb-8 bg-slate-50 p-6 rounded-xl border border-slate-200">
                    {/* Row 1: Selection Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm font-bold text-slate-500 block mb-2 flex items-center gap-2">
                                <Target className="w-4 h-4 text-indigo-600" />
                                앵커 (Anchor / 내 브랜드)
                            </label>
                            <select
                                value={selectedAnchor}
                                onChange={(e) => setSelectedAnchor(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-slate-900"
                            >
                                <option value="">브랜드 선택...</option>
                                {anchors.map(a => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-bold text-slate-500 block mb-2 flex items-center gap-2">
                                <Crosshair className="w-4 h-4 text-indigo-600" />
                                목표 설정 (Goal)
                            </label>
                            <select
                                value={selectedGoal}
                                onChange={(e) => setSelectedGoal(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-slate-900"
                            >
                                <option value="differentiate">차별화 (Differentiation)</option>
                                <option value="increase_sales">매출 증대 (Sales Growth)</option>
                                <option value="reduce_cost">비용 절감 (Cost Reduction)</option>
                            </select>
                        </div>
                    </div>

                    {/* Row 2: Competitors */}
                    <div>
                        <label className="text-sm font-bold text-slate-500 block mb-2 flex items-center gap-2">
                            <Users className="w-4 h-4 text-indigo-600" />
                            경쟁사 선택 (다중 선택 가능)
                        </label>
                        <div className="bg-white border border-slate-200 rounded-xl p-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {competitors.map(c => {
                                    const isSelected = selectedCompetitors.includes(c.id);
                                    return (
                                        <button
                                            key={c.id}
                                            onClick={() => {
                                                if (isSelected) {
                                                    setSelectedCompetitors(selectedCompetitors.filter(id => id !== c.id));
                                                } else {
                                                    setSelectedCompetitors([...selectedCompetitors, c.id]);
                                                }
                                            }}
                                            className={clsx(
                                                "flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 border",
                                                isSelected
                                                    ? "bg-indigo-600 border-indigo-500 text-white shadow-sm"
                                                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                            )}
                                        >
                                            <span className="truncate mr-2">{c.name}</span>
                                            {isSelected && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
                                        </button>
                                    );
                                })}
                                {competitors.length === 0 && (
                                    <div className="col-span-full text-center text-slate-400 py-4">
                                        경쟁사가 없습니다. 레퍼런스를 먼저 추가해주세요.
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="mt-2 text-xs text-right text-slate-500">
                            {selectedCompetitors.length}개 경쟁사 선택됨
                        </div>
                    </div>

                    {/* Row 3: Action */}
                    <button
                        onClick={runAnalysis}
                        disabled={isStreaming || !selectedAnchor || selectedCompetitors.length === 0}
                        className={clsx(
                            "w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all transform hover:scale-[1.01] active:scale-[0.99]",
                            isStreaming
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                                : !selectedAnchor || selectedCompetitors.length === 0
                                    ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                                    : "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md hover:shadow-lg hover:from-indigo-500 hover:to-violet-500"
                        )}
                    >
                        {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        {isStreaming ? "분석 중..." : "분석 실행"}
                    </button>
                </div>
            </div>

            {/* Live Console */}
            {(isStreaming || streamingReasoning || streamingLog) && (
                <div className="mt-6 bg-slate-900 rounded-xl p-4 border border-indigo-500/30 shadow-sm font-mono relative z-10 text-white">
                    <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2">
                        <span className="relative flex h-3 w-3">
                            <span className={clsx("absolute inline-flex h-full w-full rounded-full opacity-75", isStreaming ? "animate-ping bg-emerald-400" : "bg-slate-600")}></span>
                            <span className={clsx("relative inline-flex rounded-full h-3 w-3", isStreaming ? "bg-emerald-500" : "bg-slate-500")}></span>
                        </span>
                        <span className={clsx("text-xs font-bold uppercase tracking-wider", isStreaming ? "text-emerald-400" : "text-slate-500")}>
                            {isStreaming ? "라이브 엔진 (Live Engine)" : "대기 (Idle)"}
                        </span>
                        <span className="text-xs text-slate-500 ml-auto">
                            {streamingLog}
                        </span>
                    </div>
                    <div className="text-sm text-slate-300 min-h-[100px] whitespace-pre-wrap leading-relaxed">
                        {streamingReasoning}
                        {isStreaming && <span className="animate-pulse inline-block w-2 h-4 bg-indigo-500 ml-1 align-middle"></span>}
                    </div>
                </div>
            )}


            {/* Reports List */}
            <div className="relative z-10">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900">
                    <FileText className="w-5 h-5 text-indigo-600" /> 분석 리포트 ({reports.length})
                </h2>

                {reports.length === 0 ? (
                    <div className="bg-white rounded-xl p-8 text-center text-slate-500 border border-slate-200">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        분석 리포트가 없습니다.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reports.map((r) => (
                            <div key={r.id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded border border-indigo-100 font-medium">
                                            {r.recommended_strategy?.mode}
                                        </span>
                                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded ml-2 border border-slate-200">
                                            α = {r.recommended_strategy?.alpha?.toFixed(2)}
                                        </span>
                                    </div>
                                    <span className="text-sm text-slate-500 font-medium">
                                        신뢰도: {(r.confidence * 100).toFixed(0)}%
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                                        <div className="text-slate-500 text-xs mb-1">매출 상승 예상</div>
                                        <div className={clsx("font-bold", (r.kpi_predictions?.sales_lift || 0) >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                            <TrendingUp className="w-4 h-4 inline mr-1" />
                                            {((r.kpi_predictions?.sales_lift || 0) * 100).toFixed(1)}%
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                                        <div className="text-slate-500 text-xs mb-1">비용 변화</div>
                                        <div className="font-bold text-slate-700">
                                            {((r.kpi_predictions?.cost_delta || 0) * 100).toFixed(1)}%
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                                        <div className="text-slate-500 text-xs mb-1">상충 위험</div>
                                        <div className={clsx("font-bold", (r.risk_scores?.brand_conflict || 0) > 0.3 ? "text-amber-500" : "text-slate-400")}>
                                            <AlertTriangle className="w-4 h-4 inline mr-1" />
                                            {((r.risk_scores?.brand_conflict || 0) * 100).toFixed(0)}%
                                        </div>
                                    </div>
                                </div>
                                {r.reasoning && (
                                    <details className="mt-4 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
                                        <summary className="cursor-pointer text-slate-600 hover:text-slate-900 font-medium uppercase tracking-wide">
                                            상세 추론 보기 (Reasoning)
                                        </summary>
                                        <div className="mt-2 text-slate-600 leading-relaxed">
                                            {r.reasoning}
                                        </div>
                                    </details>
                                )}
                                <div className="mt-4 flex justify-end">
                                    <Link
                                        href={{
                                            pathname: "/lab",
                                            query: {
                                                mode: r.recommended_strategy?.mode || "DISTANCE",
                                                alpha: r.recommended_strategy?.alpha?.toString() || "0.5",
                                                anchor_id: r.anchor_id || "",
                                                target_id: r.recommended_strategy?.target_id || ""
                                            }
                                        }}
                                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1"
                                    >
                                        Lab에서 열기 <span aria-hidden="true">&rarr;</span>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div >
    );
}
