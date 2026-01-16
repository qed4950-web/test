"use client";

import { useState, useEffect, Suspense } from "react";
import { flavorService, Recipe, RecipeVersion, Reference } from "../../services/api";
import { ChefHat, GitBranch, Plus, Loader2, Check, X, Wand2, Sparkles, RefreshCw, Eye } from 'lucide-react';
import clsx from 'clsx';
import InlineNotice from "../../components/InlineNotice";
import HandoverModal from "../../components/HandoverModal";
import { useSearchParams } from 'next/navigation';

function BlueprintsContent() {
    const searchParams = useSearchParams();
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [references, setReferences] = useState<Reference[]>([]);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);
    const [selectedForSignature, setSelectedForSignature] = useState<string[]>([]);
    const [notice, setNotice] = useState<{ tone: "info" | "success" | "warning" | "error"; message: string } | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Handover Modal State
    const [handoverRecipe, setHandoverRecipe] = useState<string | null>(null);

    // Highlight effect for new creations
    const highlightIds = searchParams.get('highlight')?.split(',') || [];

    useEffect(() => {
        fetchData();
        if (highlightIds.length > 0) {
            setNotice({ tone: "success", message: "새로운 레시피가 생성되었습니다." });
        }
    }, [searchParams]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [recipesData, refsData] = await Promise.all([
                flavorService.getRecipes(),
                flavorService.getReferences()
            ]);
            setRecipes(recipesData);
            setReferences(refsData);
        } catch (e) {
            console.error(e);
            setNotice({ tone: "error", message: "데이터를 불러오는데 실패했습니다." });
        } finally {
            setLoading(false);
        }
    };

    const handleSeedDemo = async () => {
        setSeeding(true);
        try {
            await flavorService.seedDemoData();
            await fetchData();
            setNotice({ tone: "success", message: "데모 데이터가 로드되었습니다." });
        } catch (e) {
            setNotice({ tone: "error", message: "데모 데이터 로드 실패" });
        } finally {
            setSeeding(false);
        }
    };

    const handleCreateSignature = async () => {
        if (selectedForSignature.length < 2) return;
        setActionLoading("signature");
        try {
            // Logic to create signature not fully implemented in frontend-only demo
            // relying on backend
            await new Promise(resolve => setTimeout(resolve, 1500));
            setNotice({ tone: "success", message: "시그니처 생성 요청이 완료되었습니다." });
            setSelectedForSignature([]);
        } catch (e) {
            setNotice({ tone: "error", message: "시그니처 생성 실패" });
        } finally {
            setActionLoading(null);
        }
    };

    const handleApprove = async (recipeId: string) => {
        setActionLoading(recipeId);
        try {
            // await flavorService.updateRecipeStatus(recipeId, 'APPROVED'); // API method needed
            await new Promise(resolve => setTimeout(resolve, 800));

            // Optimistic update
            setRecipes(prev => prev.map(r =>
                r.id === recipeId ? { ...r, status: 'APPROVED' } : r
            ));

            setNotice({ tone: "success", message: "레시피가 승인되었습니다." });
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeprecate = async (recipeId: string) => {
        setActionLoading(recipeId);
        try {
            // await flavorService.updateRecipeStatus(recipeId, 'DEPRECATED');
            await new Promise(resolve => setTimeout(resolve, 800));

            // Optimistic update
            setRecipes(prev => prev.map(r =>
                r.id === recipeId ? { ...r, status: 'DEPRECATED' } : r
            ));

            setNotice({ tone: "info", message: "레시피가 비활성화되었습니다." });
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full border border-emerald-200 font-bold flex items-center gap-1"><Check className="w-3 h-3" /> 승인됨 (Approved)</span>;
            case 'DEPRECATED':
                return <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full border border-slate-200 font-medium">비활성 (Deprecated)</span>;
            default:
                return <span className="text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded-full border border-orange-200 font-medium">대기 (Pending)</span>;
        }
    };

    const toggleSelect = (refId: string) => {
        if (selectedForSignature.includes(refId)) {
            setSelectedForSignature(selectedForSignature.filter(id => id !== refId));
        } else {
            setSelectedForSignature([...selectedForSignature, refId]);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 p-8 relative overflow-hidden font-sans">
            <div className="absolute top-0 right-0 w-[520px] h-[520px] bg-indigo-50/50 blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[520px] h-[520px] bg-slate-50/50 blur-[100px] pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white border border-slate-200 rounded-xl shadow-sm">
                        <ChefHat className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">레시피 설계도 (Blueprints)</h1>
                        <p className="text-sm text-slate-500">레시피 라이브러리 및 관리</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleSeedDemo}
                        disabled={seeding}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                        {seeding ? "생성 중..." : "데모 데이터 로드"}
                    </button>
                    <button onClick={fetchData} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg flex items-center gap-2 text-sm hover:bg-slate-50 transition-colors">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        새로고침
                    </button>
                </div>
            </div>

            {notice && (
                <InlineNotice
                    tone={notice.tone}
                    message={notice.message}
                    onClose={() => setNotice(null)}
                />
            )}

            {/* Signature Generator */}
            <div className="bg-white rounded-2xl p-6 mb-6 border border-slate-200 relative z-10 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <Wand2 className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-bold text-lg text-slate-900">시그니처 발명 모드</h3>
                    </div>
                    <button
                        onClick={handleCreateSignature}
                        disabled={selectedForSignature.length < 2 || actionLoading === "signature"}
                        className="px-4 py-2 bg-indigo-600 rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50 hover:bg-indigo-500 text-white shadow-sm transition-colors"
                    >
                        {actionLoading === "signature" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        시그니처 생성 ({selectedForSignature.length})
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {references.slice(0, 8).map(ref => (
                        <button
                            key={ref.id}
                            onClick={() => toggleSelect(ref.id)}
                            className={clsx(
                                "px-3 py-1.5 rounded-lg text-sm transition-all border",
                                selectedForSignature.includes(ref.id)
                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            )}
                        >
                            {ref.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                </div>
            )}

            {/* Empty State */}
            {!loading && recipes.length === 0 && (
                <div className="flex items-center justify-center h-64 border-2 border-dashed border-slate-200 rounded-2xl bg-white/50">
                    <div className="text-center text-slate-500">
                        <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-20 text-indigo-300" />
                        <p className="font-medium">생성된 레시피가 없습니다</p>
                        <p className="text-sm mt-1">레시피 전략 연구소에서 첫 번째 설계도를 만들어보세요.</p>
                        <button
                            onClick={handleSeedDemo}
                            disabled={seeding}
                            className="mt-4 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-50 transition-colors"
                        >
                            {seeding ? "생성 중..." : "데모 데이터 로드"}
                        </button>
                    </div>
                </div>
            )}

            {/* Recipes List */}
            {!loading && recipes.length > 0 && (
                <div className="space-y-4">
                    {recipes.map((recipe) => (
                        <div
                            key={recipe.id}
                            className={clsx(
                                "rounded-xl p-5 border shadow-sm transition-all relative z-10 group",
                                recipe.status === 'APPROVED'
                                    ? "bg-emerald-50/50 border-emerald-200 shadow-emerald-100/50"
                                    : "bg-white border-slate-200 hover:border-indigo-300"
                            )}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-lg font-bold text-slate-900">{recipe.name}</h3>
                                        {recipe.status === 'APPROVED' && <div className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">OFFICIAL</div>}
                                    </div>
                                    <p className="text-sm text-slate-500">
                                        카테고리: {recipe.menu_category} | 상태: <span className={recipe.status === 'APPROVED' ? "text-emerald-700 font-bold" : "text-slate-600"}>{recipe.status}</span>
                                    </p>
                                </div>
                                <div className="flex gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                    {recipe.status === 'APPROVED' ? (
                                        <div className="flex gap-2 animate-in fade-in duration-300">
                                            <button className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 flex items-center gap-1 shadow-sm font-medium">
                                                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                PDF 다운로드
                                            </button>
                                            <button
                                                onClick={() => setHandoverRecipe(recipe.name)}
                                                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 flex items-center gap-1 shadow-sm font-bold"
                                            >
                                                <svg className="w-4 h-4 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                생산 공정 전달
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => handleApprove(recipe.id)}
                                                disabled={actionLoading === recipe.id}
                                                className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-sm border border-emerald-200 hover:bg-emerald-200 flex items-center gap-1 transition-colors shadow-sm"
                                            >
                                                <Check className="w-4 h-4" />
                                                승인
                                            </button>
                                            <button
                                                onClick={() => handleDeprecate(recipe.id)}
                                                disabled={actionLoading === recipe.id}
                                                className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm border border-slate-200 hover:bg-slate-200 flex items-center gap-1 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                                비활성화
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Versions */}
                            {recipe.versions && recipe.versions.length > 0 && (
                                <div className="space-y-2">
                                    <div className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 mb-2">
                                        <GitBranch className="w-3 h-3" />
                                        버전 기록 (Version History)
                                    </div>
                                    {recipe.versions.map((v) => (
                                        <div
                                            key={v.id}
                                            className={clsx(
                                                "rounded-lg p-3 flex justify-between items-center transition-all duration-500 border",
                                                highlightIds.includes(v.id)
                                                    ? "bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200 animate-pulse"
                                                    : "bg-white/80 border-slate-200 hover:border-slate-300"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-mono text-slate-700 font-bold">{v.version_label}</span>
                                                {/* Inherit status for versions if needed, or check individual version logic */}
                                                {recipe.status === 'APPROVED' ? getStatusBadge('APPROVED') : getStatusBadge(v.approval_status)}
                                            </div>
                                            <button className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors">
                                                <Eye className="w-3 h-3" />
                                                상세 보기
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <HandoverModal
                isOpen={!!handoverRecipe}
                onClose={() => setHandoverRecipe(null)}
                recipeName={handoverRecipe || ''}
            />
        </div>
    );
}

export default function BlueprintsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-50 text-slate-600 flex items-center justify-center">설계도 로딩 중...</div>}>
            <BlueprintsContent />
        </Suspense>
    );
}
