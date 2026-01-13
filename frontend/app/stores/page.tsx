"use client";

import Link from "next/link";
import { Store as StoreIcon, MapPin, Signal, ChefHat, AlertTriangle, CheckCircle2, RotateCcw, Zap } from "lucide-react";
import clsx from 'clsx';
import { useState, useEffect } from 'react';
import { flavorService } from '@/services/api';

export default function StoresPage() {
    const [stores, setStores] = useState<any[]>([]);
    const [recipes, setRecipes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [assigningStore, setAssigningStore] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const [storesData, recipesData] = await Promise.all([
                    flavorService.getStores(),
                    flavorService.getRecipes()
                ]);
                setStores(storesData);
                setRecipes(recipesData);
            } catch (e) {
                console.error("Failed to fetch data", e);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const handleAssignRecipe = async (storeId: string, recipeVersionId: string) => {
        try {
            await flavorService.assignRecipeToStore(storeId, recipeVersionId);
            // Refresh stores
            const updated = await flavorService.getStores();
            setStores(updated);
        } catch (e) {
            console.error("Failed to assign recipe", e);
        }
        setAssigningStore(null);
    };

    const handleRollback = async (storeId: string) => {
        try {
            await flavorService.rollbackStore(storeId);
            // Refresh stores
            const updated = await flavorService.getStores();
            setStores(updated);
        } catch (e) {
            console.error("Failed to rollback store", e);
        }
    };

    if (loading) return <div className="p-8 text-gray-500 font-medium">Loading Stores...</div>;

    return (
        <div className="p-6 min-h-[calc(100vh-64px)]">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                        <StoreIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">Store Management</h1>
                        <p className="text-sm text-gray-500">실시간 매장 실행 상태 모니터링</p>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="flex gap-4">
                    <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm font-medium text-gray-700">{stores.filter(s => s.status === 'ACTIVE').length} Active</span>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-medium text-gray-700">{stores.filter(s => s.status === 'WARNING').length} Warning</span>
                    </div>
                </div>
            </div>

            {/* Store Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stores.map((s) => {
                    const deviation = parseFloat(s.deviation) || 0;
                    const isWarning = deviation > 15 || s.status === 'WARNING';

                    return (
                        <div
                            key={s.id}
                            className={clsx(
                                "bg-white rounded-xl border shadow-sm transition-all overflow-hidden",
                                isWarning ? "border-amber-300" : "border-gray-200 hover:border-indigo-300 hover:shadow-md"
                            )}
                        >
                            {/* Warning Banner */}
                            {isWarning && (
                                <div className="bg-amber-50 px-4 py-2 border-b border-amber-200 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                                    <span className="text-xs font-medium text-amber-700">편차 경고: 즉시 조치 필요</span>
                                </div>
                            )}

                            {/* Header */}
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-3">
                                    <div className={clsx("p-2 rounded-lg", isWarning ? "bg-amber-100 text-amber-600" : "bg-indigo-50 text-indigo-600")}>
                                        <StoreIcon className="w-5 h-5" />
                                    </div>
                                    <span className={clsx(
                                        "px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1",
                                        s.status === 'ACTIVE' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                    )}>
                                        <Signal className="w-3 h-3" />
                                        {s.status}
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold text-gray-900 mb-1">{s.name}</h3>
                                <div className="flex items-center text-gray-500 text-sm mb-4">
                                    <MapPin className="w-4 h-4 mr-1" />
                                    {s.region || 'N/A'}
                                </div>

                                {/* Deviation Meter */}
                                <div className="mb-4">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-gray-500">맛 편차</span>
                                        <span className={clsx("font-mono font-bold", isWarning ? "text-amber-600" : "text-gray-700")}>
                                            {deviation.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={clsx("h-full rounded-full transition-all", isWarning ? "bg-amber-500" : "bg-emerald-500")}
                                            style={{ width: `${Math.min(deviation * 5, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Active Recipe */}
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    <div className="flex items-center gap-2">
                                        <ChefHat className="w-4 h-4 text-amber-600" />
                                        <span className="text-sm font-medium text-gray-700">
                                            {s.active_recipe_version_id ? 'Recipe Assigned' : 'No Recipe Assigned'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex gap-2">
                                <button
                                    onClick={() => setAssigningStore(assigningStore === s.id ? null : s.id)}
                                    className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-indigo-300 hover:text-indigo-600 transition-colors flex items-center justify-center gap-1"
                                >
                                    <Zap className="w-3 h-3" />
                                    Recipe 할당
                                </button>
                                {isWarning && (
                                    <button
                                        onClick={() => handleRollback(s.id)}
                                        className="px-3 py-2 bg-amber-100 border border-amber-200 rounded-lg text-xs font-medium text-amber-700 hover:bg-amber-200 transition-colors flex items-center gap-1"
                                    >
                                        <RotateCcw className="w-3 h-3" />
                                        롤백
                                    </button>
                                )}
                            </div>

                            {/* Recipe Assignment Dropdown */}
                            {assigningStore === s.id && recipes.length > 0 && (
                                <div className="px-5 py-3 bg-white border-t border-gray-100">
                                    <div className="text-xs font-bold text-gray-400 uppercase mb-2">Select Recipe</div>
                                    <div className="space-y-1">
                                        {recipes.flatMap(r => r.versions?.map((v: any) => (
                                            <button
                                                key={v.id}
                                                onClick={() => handleAssignRecipe(s.id, v.id)}
                                                className="w-full p-2 text-left text-sm bg-gray-50 hover:bg-indigo-50 rounded border border-gray-200 hover:border-indigo-300 transition-colors"
                                            >
                                                {r.name} ({v.version_label})
                                            </button>
                                        )) || [])}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
