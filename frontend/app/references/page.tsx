"use client";

import { useEffect, useState } from 'react';
import { flavorService, Reference } from '@/services/api';
import { BookOpen, Search, Plus, X, Brain, Sparkles, Zap } from 'lucide-react';
import clsx from 'clsx';

// Simulated AI extraction keywords
const AI_KEYWORDS: Record<string, { axis: string; weight: number }> = {
    '불향': { axis: 'fire', weight: 0.8 },
    '미쳤다': { axis: 'addictiveness', weight: 0.7 },
    '중독': { axis: 'addictiveness', weight: 0.9 },
    '또먹고싶': { axis: 'repeat', weight: 0.8 },
    '단짠': { axis: 'sweet', weight: 0.6 },
    '짭짤': { axis: 'salt', weight: 0.5 },
    '바삭': { axis: 'crisp', weight: 0.7 },
    '촉촉': { axis: 'juicy', weight: 0.6 },
    '고소': { axis: 'fat', weight: 0.5 },
    '감칠맛': { axis: 'umami', weight: 0.8 },
    '마늘': { axis: 'garlic', weight: 0.6 },
};

export default function ReferencesPage() {
    const [references, setReferences] = useState<Reference[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showAiModal, setShowAiModal] = useState(false);
    const [reviewText, setReviewText] = useState('');
    const [extractedVector, setExtractedVector] = useState<Record<string, number> | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        menu_category: 'pork_belly',
        reference_type: 'ANCHOR',
        source_kind: 'MARKET',
        org_id: ''
    });

    useEffect(() => {
        fetchRefs();
    }, []);

    async function fetchRefs() {
        try {
            const data = await flavorService.getReferences();
            setReferences(data);
            if (data.length > 0 && !formData.org_id) {
                setFormData(prev => ({ ...prev, org_id: data[0].org_id }));
            }
        } catch (e) {
            console.error("Failed to fetch references", e);
        } finally {
            setLoading(false);
        }
    }

    // AI Extract from review text
    const handleAiExtract = () => {
        const result: Record<string, number> = {
            salt: 50, sweet: 50, sour: 30, bitter: 20, umami: 50,
            fat: 50, crisp: 50, juicy: 50,
            fire: 50, garlic: 50, fermented: 30, spice: 30,
            addictiveness: 50, satiety: 50, repeat: 50,
        };

        // Parse keywords from review
        Object.entries(AI_KEYWORDS).forEach(([keyword, { axis, weight }]) => {
            if (reviewText.includes(keyword)) {
                result[axis] = Math.min(130, result[axis] + weight * 50);
            }
        });

        setExtractedVector(result);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await flavorService.createReference(formData);
            await fetchRefs();
            setShowModal(false);
            setFormData(prev => ({ ...prev, name: '' }));
        } catch (e) {
            console.error("Failed to create reference", e);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-gray-400">Loading References...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                        <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Flavor References</h1>
                        <p className="text-sm text-gray-500">맛집 레퍼런스 및 벡터 라이브러리</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowAiModal(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gradient-to-r from-purple-500 to-violet-600 rounded-xl hover:from-purple-600 hover:to-violet-700 transition-all shadow-lg"
                    >
                        <Brain className="w-4 h-4" />
                        AI 추출
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white/10 border border-gray-700 rounded-xl hover:bg-white/20 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        수동 추가
                    </button>
                </div>
            </div>

            {/* Reference Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {references.map((ref) => (
                    <div key={ref.id} className="bg-gray-800/50 rounded-2xl border border-gray-700 p-5 hover:border-gray-600 transition-all group">
                        <div className="flex justify-between items-start mb-3">
                            <span className={clsx(
                                "px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider",
                                ref.reference_type === 'ANCHOR' ? "bg-amber-500/20 text-amber-400" :
                                    ref.reference_type === 'BRAND' ? "bg-emerald-500/20 text-emerald-400" :
                                        "bg-gray-500/20 text-gray-400"
                            )}>
                                {ref.reference_type === 'ANCHOR' ? 'TARGET' : 'CURRENT'}
                            </span>
                            <span className="text-xs text-gray-500 font-mono">{ref.id.substring(0, 6)}</span>
                        </div>

                        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-amber-400 transition-colors">
                            {ref.name}
                        </h3>
                        <p className="text-xs text-gray-500 mb-4">{ref.menu_category}</p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1 mb-4">
                            {['불향', '감칠맛', '중독성'].map(tag => (
                                <span key={tag} className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 text-[9px] font-medium rounded-full border border-amber-500/20">
                                    {tag}
                                </span>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 pt-4 border-t border-gray-700">
                            <div className="flex-1 text-xs text-gray-500">
                                <span className="font-semibold text-white">{ref.fingerprints?.length || 0}</span> Versions
                            </div>
                            <button className="text-xs font-medium text-amber-400 hover:underline">
                                View Vector
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* AI Extract Modal */}
            {showAiModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-lg border border-gray-700 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <Brain className="w-5 h-5 text-purple-400" />
                                <h2 className="text-lg font-bold">AI 리뷰 → 벡터 추출</h2>
                            </div>
                            <button onClick={() => { setShowAiModal(false); setExtractedVector(null); setReviewText(''); }} className="text-gray-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-sm text-gray-400 mb-4">
                            맛집 리뷰를 붙여넣으면 AI가 Flavor Vector를 자동 추출합니다.
                        </p>

                        <textarea
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            placeholder="예: 불향이 미쳤다. 진짜 중독성 있음. 또 먹고 싶다. 단짠 조합이 완벽함."
                            className="w-full h-32 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:border-purple-500 focus:outline-none resize-none"
                        />

                        <button
                            onClick={handleAiExtract}
                            disabled={!reviewText}
                            className="w-full mt-4 py-3 bg-gradient-to-r from-purple-500 to-violet-600 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Zap className="w-4 h-4" />
                            AI 분석
                        </button>

                        {extractedVector && (
                            <div className="mt-4 p-4 bg-gray-800/50 rounded-xl border border-purple-500/30">
                                <div className="flex items-center gap-2 mb-3">
                                    <Sparkles className="w-4 h-4 text-purple-400" />
                                    <span className="text-sm font-bold text-purple-400">추출된 Flavor Vector</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                    {Object.entries(extractedVector).slice(0, 12).map(([key, val]) => (
                                        <div key={key} className="flex justify-between bg-gray-900/50 px-2 py-1 rounded">
                                            <span className="text-gray-400">{key}</span>
                                            <span className={clsx("font-mono font-bold", val > 70 ? "text-amber-400" : "text-gray-300")}>
                                                {val.toFixed(0)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <button className="w-full mt-3 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/30 transition-all">
                                    이 벡터로 Reference 생성
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Manual Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-700 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold">New Reference</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:border-amber-500 focus:outline-none"
                                    placeholder="e.g., Famous BBQ Gangnam"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
                                <select
                                    value={formData.reference_type}
                                    onChange={(e) => setFormData(prev => ({ ...prev, reference_type: e.target.value }))}
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:border-amber-500 focus:outline-none"
                                >
                                    <option value="ANCHOR">Target (맛집 벤치마크)</option>
                                    <option value="BRAND">Current (자사 표준)</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-400 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
