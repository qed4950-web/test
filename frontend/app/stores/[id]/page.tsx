"use client";

import { Check, Clock, Droplets, SprayCan, Utensils } from "lucide-react";
import { useState } from "react";

export default function StoreTabletView({ params }: { params: { id: string } }) {
    const [step, setStep] = useState(0);

    const steps = [
        {
            id: 1,
            title: "PREP",
            instruction: "육류 준비 (Meat Prep)",
            detail: "150g 커팅 / 수분 제거",
            icon: Utensils,
            color: "bg-slate-100 text-slate-500 border border-slate-200"
        },
        {
            id: 2,
            title: "AROMA",
            instruction: "시그니처 향 입히기",
            detail: "스프레이 2회 (거리: 15cm)",
            icon: SprayCan,
            color: "bg-purple-50 text-purple-600 border border-purple-200",
            highlight: true
        },
        {
            id: 3,
            title: "COOK",
            instruction: "그릴링 (Grill Process)",
            detail: "목표온도: 180°C / 45초마다 뒤집기",
            icon: Clock,
            color: "bg-orange-50 text-orange-600 border border-orange-200"
        },
        {
            id: 4,
            title: "FINISH",
            instruction: "글레이징 & 서빙",
            detail: "오일 브러쉬: 1회만 터치",
            icon: Droplets,
            color: "bg-emerald-50 text-emerald-600 border border-emerald-200",
            highlight: true
        }
    ];

    if (step === steps.length) {
        return (
            <div className="h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-900">
                <div className="bg-emerald-50 p-8 rounded-full mb-6 border border-emerald-200">
                    <Check className="w-24 h-24 text-emerald-500" />
                </div>
                <h1 className="text-6xl font-black mb-4 tracking-tight">완료 (COMPLETE)</h1>
                <p className="text-2xl text-slate-500 mb-12">로그가 성공적으로 저장되었습니다</p>
                <button
                    onClick={() => setStep(0)}
                    className="px-12 py-6 bg-emerald-600 text-white text-2xl font-bold rounded-2xl shadow-lg hover:bg-emerald-500 hover:scale-105 transition-all shadow-emerald-200"
                >
                    다음 주문 (NEXT ORDER)
                </button>
            </div>
        );
    }

    const currentStep = steps[step];

    return (
        <div className="h-screen flex flex-col bg-white font-sans text-slate-900">
            {/* Top Bar */}
            <div className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8">
                <div className="text-xl font-bold text-slate-400">주문 #2841</div>
                <div className="text-2xl font-black text-indigo-600">삼겹살 - STD v2.4</div>
            </div>

            {/* Main Instruction */}
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50">
                <div className={`p-8 rounded-full mb-8 ${currentStep.color}`}>
                    <currentStep.icon className="w-32 h-32" />
                </div>
                <h2 className="text-4xl font-bold text-slate-400 uppercase tracking-widest mb-4">STEP {step + 1} / {steps.length}</h2>
                <h1 className="text-7xl font-black text-slate-900 mb-6">{currentStep.instruction}</h1>
                <div className={`text-4xl font-bold px-8 py-4 rounded-xl inline-block border ${currentStep.highlight ? 'bg-indigo-50 border-indigo-200 text-indigo-700 animate-pulse' : 'bg-white border-slate-200 text-slate-500 shadow-sm'}`}>
                    {currentStep.detail}
                </div>
            </div>

            {/* Bottom Action */}
            <button
                onClick={() => setStep(s => s + 1)}
                className="h-32 bg-white border-t border-slate-200 text-slate-400 text-4xl font-black uppercase tracking-wider hover:bg-indigo-600 hover:text-white transition-colors"
            >
                확인 (CONFIRM)
            </button>
        </div>
    );
}
