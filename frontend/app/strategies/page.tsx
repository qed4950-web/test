"use client";

import { Layers, Copy, ArrowRightLeft, Compass, Wand2 } from 'lucide-react';
import clsx from 'clsx';

const STRATEGIES = [
    {
        id: 'COPY',
        name: 'Copy Strategy',
        icon: Copy,
        desc: '맛집의 성공 공식을 그대로 가져온다',
        color: 'from-blue-500 to-indigo-600',
        when: '신규 브랜드, 첫 히트 메뉴 필요',
        risk: '브랜드 충돌, "어디서 먹어본 맛" 인식',
        example: '"강남역 유명 삼겹살집"을 80% 복제',
    },
    {
        id: 'DISTANCE',
        name: 'Distance Reduce',
        icon: ArrowRightLeft,
        desc: '핵심 축만 가져오고 브랜드 톤 유지',
        color: 'from-emerald-500 to-teal-600',
        when: '기존 브랜드 강화, 프랜차이즈 표준화',
        risk: '낮음',
        example: '불향 + 감칠맛만 ↑, 단맛은 유지',
    },
    {
        id: 'DIRECTION',
        name: 'Direction Shift',
        icon: Compass,
        desc: '맛집이 강한 축을 반대로 사용',
        color: 'from-purple-500 to-violet-600',
        when: '직접 경쟁 회피, 같은 상권 공존',
        risk: '시장 검증 필요',
        example: '단짠 불향 → 담백 고소, 무거움 → 가벼움',
    },
    {
        id: 'SIGNATURE',
        name: 'New Signature',
        icon: Wand2,
        desc: '중독 구조만 차용, 완전히 새로운 맛',
        color: 'from-amber-500 to-orange-600',
        when: '브랜드 자산 확보, 시그니처 메뉴 개발',
        risk: '높음 (실험적)',
        example: '중독 구조(감칠맛+불향)는 유지, 표현은 완전 변경',
    },
];

export default function StrategiesPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white p-8">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl">
                    <Layers className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Strategy Guide</h1>
                    <p className="text-sm text-gray-500">4가지 맛 전략 가이드</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                {STRATEGIES.map((s) => (
                    <div
                        key={s.id}
                        className={clsx(
                            "rounded-2xl p-6 bg-gradient-to-br border border-gray-700",
                            s.color
                        )}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <s.icon className="w-8 h-8" />
                            <h2 className="text-xl font-bold">{s.name}</h2>
                        </div>
                        <p className="text-white/80 mb-4">{s.desc}</p>

                        <div className="space-y-3 text-sm">
                            <div>
                                <span className="text-white/50">사용 시점:</span>
                                <p className="text-white/90">{s.when}</p>
                            </div>
                            <div>
                                <span className="text-white/50">리스크:</span>
                                <p className="text-white/90">{s.risk}</p>
                            </div>
                            <div>
                                <span className="text-white/50">예시:</span>
                                <p className="text-white/90">{s.example}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
