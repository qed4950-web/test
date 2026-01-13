"use client";

import { useEffect, useState } from 'react';
import { flavorService } from '@/services/api';
import { ChefHat, GitBranch, Calendar, Beaker, Flame, Droplet, Wind, CheckCircle2, AlertTriangle, Archive } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';

const STATUS_CONFIG = {
    DRAFT: { label: 'Test', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Beaker },
    APPROVED: { label: 'Active', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
    DEPRECATED: { label: 'Deprecated', color: 'bg-gray-100 text-gray-500 border-gray-200', icon: Archive },
};

export default function RecipesPage() {
    const [recipes, setRecipes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'DRAFT' | 'APPROVED' | 'DEPRECATED'>('ALL');

    useEffect(() => {
        async function fetchRecipes() {
            try {
                const data = await flavorService.getRecipes();
                setRecipes(data);
            } catch (e) {
                console.error("Failed to fetch recipes", e);
            } finally {
                setLoading(false);
            }
        }
        fetchRecipes();
    }, []);

    const filteredRecipes = filter === 'ALL' ? recipes : recipes.filter(r => r.status === filter);

    if (loading) return <div className="p-8 text-gray-500 font-medium">Loading Recipes...</div>;

    return (
        <div className="p-6 min-h-[calc(100vh-64px)]">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                        <ChefHat className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">Recipe Library</h1>
                        <p className="text-sm text-gray-500">실행 가능한 레시피 파라미터 세트</p>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                    {['ALL', 'DRAFT', 'APPROVED', 'DEPRECATED'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as typeof filter)}
                            className={clsx(
                                "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                                filter === f ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            {f === 'ALL' ? 'All' : STATUS_CONFIG[f as keyof typeof STATUS_CONFIG]?.label || f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Recipe Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredRecipes.map((recipe) => {
                    const statusConf = STATUS_CONFIG[recipe.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.DRAFT;
                    const StatusIcon = statusConf.icon;
                    const latestVersion = recipe.versions?.[recipe.versions.length - 1];
                    const vector = latestVersion?.fingerprint_vector || [];

                    return (
                        <div key={recipe.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-amber-300 transition-all group overflow-hidden">
                            {/* Header */}
                            <div className="p-5 border-b border-gray-100">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-amber-600 transition-colors">
                                        {recipe.name}
                                    </h3>
                                    <span className={clsx("px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1", statusConf.color)}>
                                        <StatusIcon className="w-3 h-3" />
                                        {statusConf.label}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <GitBranch className="w-3.5 h-3.5" />
                                        {recipe.versions?.length || 0} versions
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {format(new Date(recipe.created_at), 'MMM d, yyyy')}
                                    </div>
                                    <span className="px-2 py-0.5 bg-gray-50 border border-gray-200 rounded text-[10px] uppercase tracking-wider">
                                        {recipe.menu_category}
                                    </span>
                                </div>
                            </div>

                            {/* Execution Parameters */}
                            {latestVersion && (
                                <div className="p-5 bg-gray-50">
                                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">실행 파라미터</div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                                            <Wind className="w-4 h-4 mx-auto text-blue-500 mb-1" />
                                            <div className="text-xs text-gray-500">Spray</div>
                                            <div className="text-sm font-mono font-bold text-gray-900">{(vector[0] || 0).toFixed(1)}</div>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                                            <Droplet className="w-4 h-4 mx-auto text-amber-500 mb-1" />
                                            <div className="text-xs text-gray-500">Oil</div>
                                            <div className="text-sm font-mono font-bold text-gray-900">{(vector[1] || 0).toFixed(1)}g</div>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                                            <Flame className="w-4 h-4 mx-auto text-red-500 mb-1" />
                                            <div className="text-xs text-gray-500">Powder</div>
                                            <div className="text-sm font-mono font-bold text-gray-900">{(vector[2] || 0).toFixed(1)}g</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Version Badge & Actions */}
                            {latestVersion && (
                                <div className="px-5 py-3 bg-white border-t border-gray-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs text-gray-500">Latest: <span className="font-mono font-bold text-gray-700">{latestVersion.version_label}</span></span>
                                        <button className="text-xs font-medium text-amber-600 hover:text-amber-700">View Details →</button>
                                    </div>
                                    {recipe.status === 'DRAFT' && (
                                        <div className="flex gap-2 mt-2">
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        await flavorService.approveRecipe(recipe.id);
                                                        const updated = await flavorService.getRecipes();
                                                        setRecipes(updated);
                                                    } catch (e) {
                                                        console.error("Failed to approve", e);
                                                    }
                                                }}
                                                className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-colors"
                                            >
                                                ✓ 승인 (Active)
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        await flavorService.deprecateRecipe(recipe.id);
                                                        const updated = await flavorService.getRecipes();
                                                        setRecipes(updated);
                                                    } catch (e) {
                                                        console.error("Failed to deprecate", e);
                                                    }
                                                }}
                                                className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                            >
                                                폐기
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {filteredRecipes.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                    <ChefHat className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No recipes found in this category.</p>
                </div>
            )}
        </div>
    );
}
