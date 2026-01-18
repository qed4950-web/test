import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// === Interfaces ===

export interface Reference {
    id: string;
    org_id: string;
    name: string;
    reference_type: 'ANCHOR' | 'BRAND' | 'INTERNAL_BEST' | 'AROMA';
    menu_category: string;
    created_at: string;
    fingerprints: ReferenceFingerprint[];
}

export interface ReferenceFingerprint {
    id: string;
    version: number;
    vector: number[];
    metrics_json: any;
    notes?: string;
}

export interface Transform {
    id: string;
    mode: 'COPY' | 'DISTANCE' | 'REDIRECT';
    status: 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
    result_recipe_version_id?: string;
    created_at: string;
}

export interface Deployment {
    id: string;
    recipe_version_id: string;
    scope: string;
    status: string;
    created_at: string;
}

export interface RecipeVersion {
    id: string;
    recipe_id: string;
    version_number: number;
    version_label: string;
    approval_status: string; // e.g. PENDING, APPROVED, REJECTED
    fingerprint_vector?: number[];
    metrics_json?: any;
    created_at: string;
}

export interface Recipe {
    id: string;
    org_id: string;
    name: string;
    menu_category: string;
    status: string; // e.g. ACTIVE, ARCHIVED, APPROVED, DEPRECATED
    created_at: string;
    versions?: RecipeVersion[];
}


export interface DNASignature {
    id: string;
    brand_id: string;
    vector_profile: number[];
    dominant_traits: string[];
    icon_seed: string;
    pattern_type: string;
    color_hex: string;
}

export interface StrategyReport {
    id: string;
    anchor_id: string;
    recommended_strategy: {
        mode: string;
        alpha: number;
        target_id?: string;
    };
    kpi_predictions: {
        sales_lift?: number;
        cost_delta?: number;
    };
    risk_scores: {
        brand_conflict?: number;
        price_mismatch?: number;
    };
    reasoning: string;
    confidence: number;
    created_at?: string;
}

export interface TrendPrediction {
    axis: string;
    direction: string;
    magnitude: number;
    confidence: number;
}

// === Main Service ===

export const flavorService = {
    // --- Dashboard ---
    getDashboardSummary: async () => {
        const res = await api.get('/v1/dashboard/summary');
        return res.data;
    },
    getDashboardTrends: async () => {
        const res = await api.get('/v1/dashboard/trends');
        return res.data;
    },

    // --- References ---
    getReferences: async () => {
        const res = await api.get<Reference[]>('/v1/references/');
        return res.data;
    },
    createReference: async (data: any) => {
        const res = await api.post<Reference>('/v1/references/', data);
        return res.data;
    },
    uploadReferences: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.post('/v1/references/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
    },
    createFingerprint: async (referenceId: string, vector: number[], metrics: any = {}) => {
        const res = await api.post(`/v1/references/${referenceId}/fingerprints`, {
            vector,
            metrics_json: metrics,
            version: 1
        });
        return res.data;
    },
    vectorizeReference: async (referenceId: string) => {
        const res = await api.post(`/v1/references/${referenceId}/vectorize`);
        return res.data;
    },
    reverseEngineer: async (referenceId: string) => {
        const res = await api.post(`/v1/references/${referenceId}/reverse-engineer`);
        return res.data;
    },
    getDemoExperience: async () => {
        const res = await api.get('/v1/references/demo/experience');
        return res.data;
    },
    seedDemoData: async () => {
        const res = await api.post('/v1/references/demo/seed');
        return res.data;
    },

    // --- DNA ---
    generateDNA: async (referenceId: string) => {
        const res = await api.post<DNASignature>('/v1/dna/generate', { reference_id: referenceId });
        return res.data;
    },
    getDNA: async (referenceId: string) => {
        const res = await api.get<DNASignature>(`/v1/dna/${referenceId}`);
        return res.data;
    },
    getDNARadar: async (transformId: string) => {
        const res = await api.get(`/v1/dna/radar/${transformId}`);
        return res.data;
    },

    // --- Transforms ---
    createTransform: async (data: any) => {
        const res = await api.post<Transform>('/v1/transforms/', data);
        return res.data;
    },
    getTransform: async (id: string) => {
        const res = await api.get<Transform>(`/v1/transforms/${id}`);
        return res.data;
    },

    // --- Recipes ---
    getRecipes: async () => {
        const res = await api.get<any[]>('/v1/recipes/');
        return res.data;
    },
    getRecipeVersion: async (id: string) => {
        const res = await api.get<any>(`/v1/recipes/versions/${id}`);
        return res.data;
    },
    diffVersions: async (v1Id: string, v2Id: string) => {
        const res = await api.get(`/v1/recipes/diff_versions?v1_id=${v1Id}&v2_id=${v2Id}`);
        return res.data;
    },
    createSignature: async (baseReferenceIds: string[], direction: string = 'unique') => {
        const res = await api.post('/v1/recipes/signature', {
            base_reference_ids: baseReferenceIds,
            direction
        });
        return res.data;
    },
    approveRecipe: async (recipeId: string) => {
        const res = await api.post<any>(`/v1/recipes/${recipeId}/approve`);
        return res.data;
    },
    deprecateRecipe: async (recipeId: string) => {
        const res = await api.post<any>(`/v1/recipes/${recipeId}/deprecate`);
        return res.data;
    },

    // --- Strategies ---
    analyzeStrategy: async (anchorId: string, competitorIds: string[], goal: string = 'differentiate') => {
        const res = await api.post<StrategyReport>('/v1/strategies/analyze', {
            anchor_id: anchorId,
            competitor_ids: competitorIds,
            goal
        });
        return res.data;
    },
    getStrategyReports: async () => {
        const res = await api.get<StrategyReport[]>('/v1/strategies/reports');
        return res.data;
    },
    autoSearchStrategy: async (baseReferenceId: string, targetKpi: any, constraints: any = {}) => {
        const res = await api.post('/v1/strategies/auto-search', {
            base_reference_id: baseReferenceId,
            target_kpi: targetKpi,
            constraints
        });
        return res.data;
    },
    recommendStrategy: async (
        anchorId: string,
        competitorIds: string[],
        goal: string = "differentiate",
        brandTone: string = "premium",
        priceTier: string = "mid",
        targetCustomer: string = "general"
    ) => {
        const res = await api.post('/v1/strategies/recommend', null, {
            params: {
                anchor_id: anchorId,
                competitor_ids: competitorIds.join(','),
                goal,
                brand_tone: brandTone,
                price_tier: priceTier,
                target_customer: targetCustomer
            }
        });
        return res.data;
    },

    // --- Analysis ---
    getConflictMap: async (brandId: string, competitorIds: string[]) => {
        const res = await api.post('/v1/analysis/conflict-map', {
            brand_id: brandId,
            competitor_ids: competitorIds
        });
        return res.data;
    },
    getSynergyMap: async (referenceIds: string[]) => {
        const res = await api.post('/v1/analysis/synergy-map', {
            reference_ids: referenceIds
        });
        return res.data;
    },
    getRiskRadar: async (vector: number[], referenceName: string = '') => {
        const res = await api.post('/v1/analysis/risk-radar', {
            vector,
            reference_name: referenceName
        });
        return res.data;
    },

    // --- Deployments ---
    getDeployments: async () => {
        const res = await api.get<Deployment[]>('/v1/deployments/');
        return res.data;
    },
    createDeployment: async (data: any) => {
        const res = await api.post<Deployment>('/v1/deployments/', data);
        return res.data;
    },
    checkRollback: async () => {
        const res = await api.post('/v1/deployments/check-rollback');
        return res.data;
    },

    // --- Logs ---
    getLogs: async () => {
        const res = await api.get<any[]>('/v1/logs/');
        return res.data;
    },

    // --- Stores ---
    getStores: async () => {
        const res = await api.get<any[]>('/v1/stores/');
        return res.data;
    },
    assignRecipeToStore: async (storeId: string, recipeVersionId: string) => {
        const res = await api.post<any>(`/v1/stores/${storeId}/assign-recipe?recipe_version_id=${recipeVersionId}`);
        return res.data;
    },
    rollbackStore: async (storeId: string) => {
        const res = await api.post<any>(`/v1/stores/${storeId}/rollback`);
        return res.data;
    },

    // --- Alerts ---
    getAlerts: async () => {
        const res = await api.get<any[]>('/v1/alerts/');
        return res.data;
    },
    checkDeviationAlerts: async () => {
        const res = await api.post<any>('/v1/alerts/check-deviations');
        return res.data;
    },
    resolveAlert: async (alertId: string) => {
        const res = await api.post<any>(`/v1/alerts/${alertId}/resolve`);
        return res.data;
    },

    // --- AI ---
    interpretDistance: async (data: {
        reference1_name: string;
        reference2_name: string;
        gap_top3: Array<{ label: string; diff: number }>;
        addictiveness_diff: number;
        selected_strategy?: string;
    }) => {
        const res = await api.post<{ interpretation: string; strategy_recommendation: string }>('/v1/ai/interpret', data);
        return res.data;
    },
    simulateCustomer: async (data: { strategy: string; flavor_profile: Record<string, number> }) => {
        const res = await api.post<{ personas: Array<any> }>('/v1/ai/simulate', data);
        return res.data;
    },

    // --- Fun Features ---
    generateNaming: async (vector: number[], category: string = 'Chicken', style: string = 'premium') => {
        const res = await api.post('/v1/naming/generate', { vector, category, style });
        return res.data;
    },
    createSnapshot: async (referenceId: string, title?: string) => {
        const res = await api.post('/v1/snapshots/create', { reference_id: referenceId, title });
        return res.data;
    },
    mixBattle: async (ref1Id: string, ref2Id: string, mixRatio: number = 0.5) => {
        const res = await api.post('/v1/battles/mix', {
            ref1_id: ref1Id,
            ref2_id: ref2Id,
            mix_ratio: mixRatio
        });
        return res.data;
    },
    optimizePortfolio: async (referenceIds: string[], targetCoverage: number = 0.5) => {
        const res = await api.post('/v1/portfolio/optimize', {
            reference_ids: referenceIds,
            target_coverage: targetCoverage
        });
        return res.data;
    },
    timeMachine: async (currentVector: number[], targetEra: string, category: string = 'General') => {
        const res = await api.post('/v1/timemachine/restore', {
            current_vector: currentVector,
            target_era: targetEra,
            category
        });
        return res.data;
    },

    // --- Trends ---
    predictTrends: async (category: string, lookbackMonths: number = 6) => {
        const res = await api.post('/v1/trends/predict', {
            category,
            lookback_months: lookbackMonths
        });
        return res.data;
    },
    getBrandEvolution: async (brandId: string) => {
        const res = await api.get(`/v1/brands/${brandId}/evolution`);
        return res.data;
    },
    recordEvolution: async (brandId: string, eventType: string, notes: string) => {
        const res = await api.post(`/v1/brands/${brandId}/evolution?event_type=${eventType}&notes=${notes}`);
        return res.data;
    },

    // --- Explore ---
    getTransformRules: async () => {
        const res = await api.get('/v1/transforms/rules');
        return res.data;
    },
    applyTransformRule: async (vector: number[], ruleKey: string, intensity: number = 1.0) => {
        const res = await api.post('/v1/transforms/apply-rule', {
            vector,
            rule_key: ruleKey,
            intensity
        });
        return res.data;
    },
    vectorSearch: async (targetKpi: any, constraints: any = {}, iterations: number = 100) => {
        const res = await api.post('/v1/explore/vector-search', {
            target_kpi: targetKpi,
            constraints,
            iterations
        });
        return res.data;
    },

    // --- Benchmarks ---
    getBenchmarks: async () => {
        const res = await api.get('/v1/benchmarks');
        return res.data;
    },
    runBatchExperiment: async (baseReferenceId: string, targetReferenceIds: string[], modes?: string[], alphas?: number[]) => {
        const res = await api.post('/v1/experiments/run', {
            base_reference_id: baseReferenceId,
            target_reference_ids: targetReferenceIds,
            modes: modes || ['COPY', 'DISTANCE', 'REDIRECT'],
            alphas: alphas || [0.3, 0.5, 0.7]
        });
        return res.data;
    },
    getExperimentStatus: async (runId: string) => {
        const res = await api.get(`/v1/experiments/${runId}/status`);
        return res.data;
    },
    cleanupCache: async () => {
        const res = await api.post('/v1/cache/cleanup');
        return res.data;
    },

    // --- AI Mutation (New) ---
    mutateRecipe: async (recipe: any, strategy: string, intensity: number = 50) => {
        const res = await api.post('/v1/ai/mutate', { recipe, strategy, intensity });
        return res.data;
    }
};
