"use client";

import { ChefHat, Plus } from 'lucide-react';

export default function BlueprintsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white p-8">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
                        <ChefHat className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Blueprints</h1>
                        <p className="text-sm text-gray-500">생성된 레시피 블루프린트 라이브러리</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-700 rounded-2xl">
                <div className="text-center text-gray-500">
                    <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>아직 생성된 블루프린트가 없습니다</p>
                    <p className="text-sm">Recipe Lab에서 첫 블루프린트를 생성하세요</p>
                </div>
            </div>
        </div>
    );
}
