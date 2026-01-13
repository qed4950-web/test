"use client";

import { useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { ArrowRight, Copy, MoveHorizontal, GitMerge, FlaskConical, Save, RotateCcw, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import { flavorService, Reference } from '@/services/api';

const MODES = [
    { id: 'COPY', label: 'Copy Mode', icon: Copy, desc: 'Replicate target flavor profile' },
    { id: 'DISTANCE', label: 'Distance Mode', icon: MoveHorizontal, desc: 'Interpolate between Ref 1 & 2' },
    { id: 'REDIRECT', label: 'Redirect Mode', icon: GitMerge, desc: 'Shift flavor direction' },
];

export default function RecipeLab() {
    // Core state
    const [mode, setMode] = useState('DISTANCE');
    const [distance, setDistance] = useState(30);
    const [copyAlpha, setCopyAlpha] = useState(100); // Copy Mode: 0-100%
    const [redirectDirection, setRedirectDirection] = useState(0); // Redirect Mode: -50 to +50
    const [references, setReferences] = useState<Reference[]>([]);
    const [chartData, setChartData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Layer controls
    const [layerLocks, setLayerLocks] = useState({
        spray: false,
        oil: false,
        powder: false,
    });
    const [selectedLayers, setSelectedLayers] = useState({
        spray: true,
        oil: true,
        powder: true,
    });

    // Redirect axis selection
    const [redirectAxis, setRedirectAxis] = useState<'spicy' | 'savory' | 'clean' | 'rich'>('spicy');

    const [referenceMap, setReferenceMap] = useState<Record<string, Reference>>({});

    // Real candidates from generation
    const [generatedCandidates, setGeneratedCandidates] = useState<any[]>([]);

    // Status state
    const [isGenerating, setIsGenerating] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");

    useEffect(() => {
        async function loadData() {
            try {
                const refs = await flavorService.getReferences();
                setReferences(refs);
                const map = refs.reduce((acc, r) => ({ ...acc, [r.id]: r }), {} as Record<string, Reference>);
                setReferenceMap(map);

                // Transform for Chart: Assuming Ref 0 is Anchor, Ref 1 is Brand
                if (refs.length >= 2) {
                    const refA = refs.find(r => r.reference_type === 'ANCHOR');
                    const refB = refs.find(r => r.reference_type === 'BRAND');

                    updateChart(refA, refB); // Initial chart
                }
            } catch (e) {
                console.error("Failed to fetch references", e);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const updateChart = (refA?: Reference, refB?: Reference, candidateVec?: number[]) => {
        if (refA && refA.fingerprints.length > 0 && refB && refB.fingerprints.length > 0) {
            const subjects = ['Top Aroma', 'First Bite', 'Saltiness', 'Aftertaste', 'Fatigue', 'Umami'];
            const newData = subjects.map((subj, i) => ({
                subject: subj,
                A: refA.fingerprints[0].vector[i] || 0, // Target (Anchor)
                B: refB.fingerprints[0].vector[i] || 0, // Current (Brand)
                C: candidateVec ? candidateVec[i] : undefined, // Candidate
                fullMark: 150
            }));
            setChartData(newData);
        }
    };

    const ref1 = references.find(r => r.reference_type === 'ANCHOR');
    const ref2 = references.find(r => r.reference_type === 'BRAND');

    const handleGenerate = async () => {
        if (!ref1 || !ref2) return;
        setIsGenerating(true);
        setStatusMessage("Initializing Quantum Transform...");

        try {
            // 1. Start Job - mode-specific parameters
            const alphaValue = mode === 'COPY' ? copyAlpha / 100 : mode === 'DISTANCE' ? distance / 100 : 0;
            const directionValue = mode === 'REDIRECT' ? redirectAxis : undefined;

            const tx = await flavorService.createTransform({
                org_id: ref1.org_id,
                mode: mode,
                reference_1_id: ref1.id,
                reference_2_id: ref2.id,
                alpha: alphaValue,
                direction_key: directionValue,
                layer_mask: { spray: selectedLayers.spray, oil: selectedLayers.oil, powder: selectedLayers.powder }
            });

            setStatusMessage("Optimizing Vector Space...");

            // 2. Poll for Completion
            // Simple poll loop
            const poll = setInterval(async () => {
                try {
                    const update = await flavorService.getTransform(tx.id);
                    if (update.status === 'SUCCEEDED') {
                        clearInterval(poll);
                        setStatusMessage("Refining Recipe Spec...");

                        // 3. Fetch Result
                        if (update.result_recipe_version_id) {
                            const version = await flavorService.getRecipeVersion(update.result_recipe_version_id);

                            // Add to candidates list (prepend)
                            setGeneratedCandidates(prev => [version, ...prev]);

                            // Update Chart to show this candidate
                            updateChart(ref1, ref2, version.fingerprint_vector);

                            setStatusMessage("Generation Complete!");
                            setTimeout(() => { setIsGenerating(false); setStatusMessage(""); }, 1500);
                        }
                    } else if (update.status === 'FAILED') {
                        clearInterval(poll);
                        setIsGenerating(false);
                        setStatusMessage("Generation Failed.");
                        alert("Transform failed on server side.");
                    }
                } catch (e) {
                    console.error(e);
                    clearInterval(poll);
                    setIsGenerating(false);
                }
            }, 1000); // Poll every 1s

        } catch (e) {
            console.error(e);
            setIsGenerating(false);
            alert("Failed to start job");
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center">Loading Data...</div>;

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <div className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                        <FlaskConical className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">Recipe Lab</h1>
                        <p className="text-xs text-gray-500">R&D Workstation</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => { setGeneratedCandidates([]); setChartData(prev => prev.map(d => ({ ...d, C: undefined }))); alert("Workspace Reset"); }}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-2">
                        <RotateCcw className="w-4 h-4" /> Reset
                    </button>
                    <button
                        onClick={() => alert("Version saved to history (Simulation)")}
                        className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg flex items-center gap-2 shadow-sm">
                        <Save className="w-4 h-4" /> Save Version
                    </button>
                </div>
            </div>

            {/* Main Workspace */}
            <div className="flex-1 flex overflow-hidden">

                {/* Left: Reference Comparator */}
                <div className="w-1/3 min-w-[320px] bg-white border-r border-gray-200 flex flex-col">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">References</h2>
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl border-2 border-gray-200 bg-gray-50 cursor-pointer hover:border-emerald-400 transition-all">
                                <div className="flex justify-between mb-1">
                                    <span className="text-xs font-bold text-emerald-600">REFERENCE 1 (Target)</span>
                                </div>
                                <div className="font-bold text-gray-900 text-lg">{ref1?.name || "Loading..."}</div>
                                <div className="text-xs text-gray-500">Market Proven • {ref1?.menu_category}</div>
                            </div>

                            <div className="flex justify-center text-gray-400">
                                <ArrowRight className="w-5 h-5 rotate-90" />
                            </div>

                            <div className="p-4 rounded-xl border-2 border-indigo-100 bg-indigo-50 cursor-pointer">
                                <div className="flex justify-between mb-1">
                                    <span className="text-xs font-bold text-indigo-600">REFERENCE 2 (Current)</span>
                                </div>
                                <div className="font-bold text-gray-900 text-lg">{ref2?.name || "Loading..."}</div>
                                <div className="text-xs text-gray-500">Internal • {ref2?.menu_category}</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 p-6 min-h-0 overflow-y-auto">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Fingerprint Comparison</h2>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} />
                                    <Radar name="Ref 1" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                                    <Radar name="Ref 2" dataKey="B" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                                    {generatedCandidates.length > 0 && <Radar name="Candidate" dataKey="C" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.4} />}
                                    {/* Candidate Radar */}

                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center gap-6 text-xs font-medium mt-2">
                            <div className="flex items-center gap-2 text-emerald-600"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Target</div>
                            <div className="flex items-center gap-2 text-indigo-600"><div className="w-2 h-2 rounded-full bg-indigo-500" /> Current</div>
                            <div className="flex items-center gap-2 text-amber-500"><div className="w-2 h-2 rounded-full bg-amber-500" /> New</div>
                        </div>
                    </div>
                </div>

                {/* Center: Control Panel */}
                <div className="w-1/3 min-w-[320px] bg-gray-50 border-r border-gray-200 flex flex-col">
                    <div className="p-6">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Control Mode</h2>
                        <div className="grid grid-cols-3 gap-2 p-1 bg-gray-200 rounded-lg">
                            {MODES.map((m) => (
                                <button
                                    key={m.id}
                                    onClick={() => setMode(m.id)}
                                    className={clsx(
                                        "flex flex-col items-center py-3 px-1 rounded-md transition-all",
                                        mode === m.id ? "bg-white shadow-sm text-emerald-600" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                    )}
                                >
                                    <m.icon className="w-5 h-5 mb-1" />
                                    <span className="text-[10px] font-bold">{m.label}</span>
                                </button>
                            ))}
                        </div>
                        <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200 text-sm text-gray-600">
                            {MODES.find(m => m.id === mode)?.desc}
                        </div>
                    </div>

                    {/* Dynamic Controls based on Mode */}
                    <div className="p-6 border-t border-gray-200 flex-1 overflow-y-auto">
                        {/* COPY MODE */}
                        {mode === 'COPY' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="text-sm font-bold text-gray-700">Copy Intensity (α)</label>
                                        <span className="text-blue-600 font-mono font-bold">{copyAlpha}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={copyAlpha}
                                        onChange={(e) => setCopyAlpha(Number(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                    />
                                    <div className="flex justify-between text-xs text-gray-400 mt-2">
                                        <span>Partial Copy</span>
                                        <span>Full Copy</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase">Layer Lock (DNA 보호)</h3>
                                    {[
                                        { key: 'spray', label: 'Top Aroma (Spray)' },
                                        { key: 'oil', label: 'First Bite (Oil)' },
                                        { key: 'powder', label: 'Aftertaste (Powder)' },
                                    ].map((layer) => (
                                        <label key={layer.key} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300">
                                            <span className="text-sm font-medium text-gray-700">{layer.label}</span>
                                            <div className="flex items-center gap-2">
                                                <span className={clsx("text-xs", layerLocks[layer.key as keyof typeof layerLocks] ? "text-red-500" : "text-gray-400")}>
                                                    {layerLocks[layer.key as keyof typeof layerLocks] ? "🔒 Locked" : "Unlocked"}
                                                </span>
                                                <input
                                                    type="checkbox"
                                                    checked={layerLocks[layer.key as keyof typeof layerLocks]}
                                                    onChange={(e) => setLayerLocks(prev => ({ ...prev, [layer.key]: e.target.checked }))}
                                                    className="w-4 h-4 text-red-600 rounded border-gray-300"
                                                />
                                            </div>
                                        </label>
                                    ))}
                                </div>

                                <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
                                    <p><strong>Copy Mode:</strong> Ref 1(맛집)을 {copyAlpha}% 복제합니다.</p>
                                </div>
                            </div>
                        )}

                        {/* DISTANCE MODE */}
                        {mode === 'DISTANCE' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="text-sm font-bold text-gray-700">Distance Alpha (α)</label>
                                        <span className="text-emerald-600 font-mono font-bold">{distance}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={distance}
                                        onChange={(e) => setDistance(Number(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                    />
                                    <div className="flex justify-between text-xs text-gray-400 mt-2">
                                        <span>Current (0%)</span>
                                        <span>Target (100%)</span>
                                    </div>
                                </div>

                                {/* Layer Preview */}
                                <div className="space-y-2">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase">예상 변화량</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['Top Aroma', 'First Bite', 'Saltiness', 'Aftertaste'].map((axis, i) => (
                                            <div key={axis} className="bg-white p-3 rounded-lg border border-gray-200">
                                                <div className="text-xs text-gray-500">{axis}</div>
                                                <div className={clsx("text-sm font-mono font-bold", distance > 0 ? "text-emerald-600" : "text-gray-400")}>
                                                    {distance > 0 ? `+${(distance * 0.12 * (i + 1)).toFixed(1)}` : "—"}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase">Apply Layers</h3>
                                    {[
                                        { key: 'spray', label: 'Top Aroma (Spray)' },
                                        { key: 'oil', label: 'First Bite (Oil)' },
                                        { key: 'powder', label: 'Aftertaste (Powder)' },
                                    ].map((layer) => (
                                        <label key={layer.key} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-emerald-300">
                                            <input
                                                type="checkbox"
                                                checked={selectedLayers[layer.key as keyof typeof selectedLayers]}
                                                onChange={(e) => setSelectedLayers(prev => ({ ...prev, [layer.key]: e.target.checked }))}
                                                className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                                            />
                                            <span className="text-sm font-medium text-gray-700">{layer.label}</span>
                                        </label>
                                    ))}
                                </div>

                                {distance > 40 && (
                                    <div className="p-3 bg-amber-50 text-amber-700 rounded-lg text-sm flex items-start gap-2">
                                        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                        <p>High deviation detected. Existing customers might notice significant changes.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* REDIRECT MODE */}
                        {mode === 'REDIRECT' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="text-sm font-bold text-gray-700">Direction Shift (θ)</label>
                                        <span className="text-purple-600 font-mono font-bold">{redirectDirection > 0 ? '+' : ''}{redirectDirection}°</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="-50"
                                        max="50"
                                        value={redirectDirection}
                                        onChange={(e) => setRedirectDirection(Number(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                    />
                                    <div className="flex justify-between text-xs text-gray-400 mt-2">
                                        <span>–θ (반대)</span>
                                        <span className="text-purple-500">0 (유지)</span>
                                        <span>+θ (강화)</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase">Direction Axis (방향성)</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { key: 'spicy', label: '🌶️ Spicy', desc: '자극적인' },
                                            { key: 'savory', label: '🧈 Savory', desc: '고소한' },
                                            { key: 'clean', label: '💧 Clean', desc: '깔끔한' },
                                            { key: 'rich', label: '🍖 Rich', desc: '진한' },
                                        ].map((axis) => (
                                            <button
                                                key={axis.key}
                                                onClick={() => setRedirectAxis(axis.key as typeof redirectAxis)}
                                                className={clsx(
                                                    "p-3 rounded-lg border-2 text-left transition-all",
                                                    redirectAxis === axis.key
                                                        ? "border-purple-500 bg-purple-50"
                                                        : "border-gray-200 bg-white hover:border-purple-300"
                                                )}
                                            >
                                                <div className="text-sm font-bold">{axis.label}</div>
                                                <div className="text-xs text-gray-500">{axis.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-3 bg-purple-50 text-purple-700 rounded-lg text-sm">
                                    <p><strong>Redirect Mode:</strong> 맛 레벨 유지 + <strong>{redirectAxis}</strong> 방향으로 {Math.abs(redirectDirection)}° 이동</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 border-t border-gray-200 bg-white">
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className={clsx(
                                "w-full py-3 rounded-lg font-bold shadow-lg transition-all flex items-center justify-center gap-2",
                                isGenerating ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-900 text-white hover:bg-gray-800"
                            )}>
                            {isGenerating ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                    {statusMessage || "Processing..."}
                                </>
                            ) : (
                                <>
                                    <FlaskConical className="w-5 h-5" />
                                    Generate Recipe Candidates
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Right: Simulation & Results */}
            <div className="w-1/3 min-w-[320px] bg-gray-50 flex flex-col p-6 overflow-y-auto">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Simulation Result</h2>

                {/* KPI Prediction */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                        <div className="text-gray-500 text-xs font-medium">Predicted Revisit</div>
                        <div className="text-2xl font-bold text-emerald-600 mt-1">+4.2%</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                        <div className="text-gray-500 text-xs font-medium">Customer Churn</div>
                        <div className="text-2xl font-bold text-gray-700 mt-1">Low</div>
                    </div>
                </div>

                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Candidates</h2>

                {generatedCandidates.length === 0 && (
                    <div className="text-center py-10 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                        No candidates generated yet.<br />Adjust controls and click Generate.
                    </div>
                )}

                <div className="space-y-4">
                    {generatedCandidates.map((v) => (
                        <div key={v.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group">
                            <div className="flex justify-between items-start mb-3">
                                <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded">{v.version_label}</span>
                                <span className="text-xs text-gray-400 font-mono">{new Date(v.created_at).toLocaleTimeString()}</span>
                            </div>
                            <div className="space-y-2 text-sm text-gray-600">
                                {/* Crude display of vector stats */}
                                <div className="text-xs font-mono bg-gray-50 p-2 rounded">
                                    Top Aroma: {v.fingerprint_vector?.[0]?.toFixed(1)} <br />
                                    First Bite: {v.fingerprint_vector?.[1]?.toFixed(1)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}
