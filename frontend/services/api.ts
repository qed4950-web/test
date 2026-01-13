import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002';

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export interface Reference {
    id: string;
    org_id: string;
    name: string;
    reference_type: 'ANCHOR' | 'BRAND' | 'INTERNAL_BEST';
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

export const flavorService = {
    getReferences: async () => {
        const res = await api.get<Reference[]>('/v1/references/');
        return res.data;
    },
    createReference: async (data: any) => {
        const res = await api.post<Reference>('/v1/references/', data);
        return res.data;
    },
    createTransform: async (data: any) => {
        const res = await api.post<Transform>('/v1/transforms/', data);
        return res.data;
    },
    getTransform: async (id: string) => {
        const res = await api.get<Transform>(`/v1/transforms/${id}`);
        return res.data;
    },
    getRecipes: async () => {
        const res = await api.get<any[]>('/v1/recipes/');
        return res.data;
    },
    getLogs: async () => {
        const res = await api.get<any[]>('/v1/logs/');
        return res.data;
    },
    getRecipeVersion: async (id: string) => {
        const res = await api.get<any>(`/v1/recipes/versions/${id}`);
        return res.data;
    },
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
    approveRecipe: async (recipeId: string) => {
        const res = await api.post<any>(`/v1/recipes/${recipeId}/approve`);
        return res.data;
    },
    deprecateRecipe: async (recipeId: string) => {
        const res = await api.post<any>(`/v1/recipes/${recipeId}/deprecate`);
        return res.data;
    },
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
    // AI endpoints
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
    }
};
