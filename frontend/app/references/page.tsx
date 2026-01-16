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
    const [seeding, setSeeding] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showAiModal, setShowAiModal] = useState(false);
    const [reviewText, setReviewText] = useState('');
    const sampleReview = "불향이 확 올라오고 단짠 밸런스가 미쳤다. 마늘향이 진하고 바삭하면서 촉촉한 식감. 또 먹고싶다.";
    const [extractedVector, setExtractedVector] = useState<Record<string, number> | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        menu_category: 'pork_belly',
        reference_type: 'ANCHOR',
        source_kind: 'MARKET',
        org_id: ''
    });
    const [viewingRef, setViewingRef] = useState<Reference | null>(null);

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

    const handleSeedDemo = async () => {
        try {
            setSeeding(true);
            await flavorService.seedDemoData();
            await fetchRefs();
        } catch (e) {
            console.error("Failed to seed demo data", e);
        } finally {
            setSeeding(false);
        }
    };

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
            const newRef = await flavorService.createReference(formData);

            // If we have an extracted vector, save it as a fingerprint
            if (extractedVector) {
                // Map vector keys to standard 12-axis order
                const ORDERED_KEYS = ['salt', 'sweet', 'sour', 'bitter', 'umami', 'fat', 'crisp', 'juicy', 'fire', 'garlic', 'fermented', 'spice'];
                const vectorValues = ORDERED_KEYS.map(k => extractedVector[k] || 0);
                const metrics = {
                    addictiveness: extractedVector.addictiveness || 0,
                    satiety: extractedVector.satiety || 0,
                    repeat: extractedVector.repeat || 0,
                    source_text: reviewText.substring(0, 100) + "..."
                };

                await flavorService.createFingerprint(newRef.id, vectorValues, metrics);
                setExtractedVector(null); // Reset
            }

            await fetchRefs();
            setShowModal(false);
            setFormData(prev => ({ ...prev, name: '' }));
        } catch (e) {
            console.error("Failed to create reference", e);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-slate-400">레퍼런스 로딩 중...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 p-6 font-sans">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white border border-slate-200 rounded-xl shadow-sm">
                        <BookOpen className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">레퍼런스 (References)</h1>
                        <p className="text-sm text-slate-500">벤치마크 및 벡터 라이브러리</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleSeedDemo}
                        disabled={seeding}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50"
                    >
                        <Zap className="w-4 h-4" />
                        {seeding ? "생성 중..." : "데모 로드"}
                    </button>
                    <button
                        onClick={() => setShowAiModal(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-50 transition-all shadow-sm"
                    >
                        <Brain className="w-4 h-4" />
                        AI 추출
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        수동 추가
                    </button>
                </div>
            </div>

            {/* Reference Cards */}
            {references.length === 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 mb-6 shadow-sm">
                    <div className="text-sm font-bold text-slate-900 mb-2">등록된 레퍼런스가 없습니다</div>
                    <div className="text-xs text-slate-500 mb-4">데모 데이터를 로드하거나 새로운 레퍼런스를 추가해보세요.</div>
                    <div className="flex justify-center gap-2">
                        <button
                            onClick={handleSeedDemo}
                            disabled={seeding}
                            className="px-4 py-2 text-sm font-medium bg-slate-100 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-200 transition-all disabled:opacity-50"
                        >
                            {seeding ? "생성 중..." : "데모 데이터 로드"}
                        </button>
                        <button
                            onClick={() => setShowModal(true)}
                            className="px-4 py-2 text-sm font-medium bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all"
                        >
                            수동 추가
                        </button>
                    </div>
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {references.map((ref) => (
                    <div key={ref.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all group shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                            <span className={clsx(
                                "px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider border",
                                ref.reference_type === 'ANCHOR' ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
                                    ref.reference_type === 'BRAND' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                        "bg-slate-100 text-slate-500 border-slate-200"
                            )}>
                                {ref.reference_type === 'ANCHOR' ? 'TARGET' : 'CURRENT'}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">{ref.id.substring(0, 6)}</span>
                        </div>

                        <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
                            {ref.name}
                        </h3>
                        <p className="text-xs text-slate-500 mb-4">{ref.menu_category}</p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1 mb-4">
                            {['Smoky', 'Umami', 'Addictive'].map(tag => (
                                <span key={tag} className="px-1.5 py-0.5 bg-slate-50 text-slate-500 text-[9px] font-medium rounded-full border border-slate-200">
                                    {tag}
                                </span>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                            <div className="flex-1 text-xs text-slate-500">
                                <span className="font-semibold text-slate-900">{ref.fingerprints?.length || 0}</span> Versions
                            </div>
                            <button onClick={() => setViewingRef(ref)} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
                                벡터 보기
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* View Vector Modal */}
            {viewingRef && (
                <div className="fixed inset-0 bg-slate-900/20 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg border border-slate-200 shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">{viewingRef.name}</h2>
                                <p className="text-xs text-slate-500">맛 벡터 분석 (Flavor Vector Analysis)</p>
                            </div>
                            <button onClick={() => setViewingRef(null)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 mb-6">
                            <div className="grid grid-cols-3 gap-3 text-xs">
                                {['Salt', 'Sweet', 'Sour', 'Bitter', 'Umami', 'Fat', 'Crisp', 'Juicy', 'Fire', 'Garlic', 'Fermented', 'Spice'].map((label, i) => {
                                    const val = viewingRef.fingerprints?.[0]?.vector?.[i] || 0;
                                    return (
                                        <div key={label} className="flex justify-between bg-white px-2 py-1.5 rounded border border-slate-200 shadow-sm">
                                            <span className="text-slate-600">{label}</span>
                                            <span className={clsx("font-mono font-bold", val > 70 ? "text-indigo-600" : "text-slate-400")}>
                                                {val.toFixed(0)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={() => setViewingRef(null)}
                                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Extract Modal */}
            {showAiModal && (
                <div className="fixed inset-0 bg-slate-900/20 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg border border-slate-200 shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <Brain className="w-5 h-5 text-indigo-600" />
                                <h2 className="text-lg font-bold text-slate-900">AI 리뷰 → 벡터 추출</h2>
                            </div>
                            <button onClick={() => { setShowAiModal(false); setExtractedVector(null); setReviewText(''); }} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-sm text-slate-500 mb-4">
                            음식 리뷰를 붙여넣으면 AI가 자동으로 맛 벡터를 추출합니다.
                        </p>

                        <textarea
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            placeholder="예: 불향이 확 올라오고 단짠 밸런스가 미쳤다. 마늘향이 진하고..."
                            className="w-full h-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:border-indigo-500 focus:outline-none resize-none placeholder:text-slate-400"
                        />

                        <div className="mt-4 flex items-center justify-between">
                            <button
                                onClick={() => setReviewText(sampleReview)}
                                className="text-xs text-indigo-600 hover:text-indigo-700"
                            >
                                샘플 리뷰 입력
                            </button>
                            <button
                                onClick={handleAiExtract}
                                disabled={!reviewText}
                                className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
                            >
                                <Zap className="w-4 h-4" />
                                AI 분석 실행
                            </button>
                        </div>

                        {extractedVector && (
                            <div className="mt-4 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                                <div className="flex items-center gap-2 mb-3">
                                    <Sparkles className="w-4 h-4 text-indigo-600" />
                                    <span className="text-sm font-bold text-indigo-700">추출된 맛 벡터 (Extracted Flavor Vector)</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                    {Object.entries(extractedVector).slice(0, 12).map(([key, val]) => (
                                        <div key={key} className="flex justify-between bg-white px-2 py-1 rounded border border-indigo-100 shadow-sm">
                                            <span className="text-slate-600">{key}</span>
                                            <span className={clsx("font-mono font-bold", val > 70 ? "text-indigo-600" : "text-slate-400")}>
                                                {val.toFixed(0)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={() => { setShowAiModal(false); setShowModal(true); }}
                                    className="w-full mt-3 py-2 bg-white text-indigo-600 border border-indigo-200 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-all shadow-sm"
                                >
                                    벡터로 레퍼런스 생성
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Manual Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/20 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md border border-slate-200 shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-slate-900">새 레퍼런스 추가</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">이름 (Name)</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                                    placeholder="예: 강남 유명 맛집"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">유형 (Type)</label>
                                <select
                                    value={formData.reference_type}
                                    onChange={(e) => setFormData(prev => ({ ...prev, reference_type: e.target.value }))}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                                >
                                    <option value="ANCHOR">Target (Benchmark)</option>
                                    <option value="BRAND">Current (Standard)</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-all shadow-sm"
                                >
                                    생성
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
