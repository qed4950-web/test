"use client";

import { Check, Clock, Droplets, SprayCan, Utensils } from "lucide-react";
import { useState } from "react";

export default function StoreTabletView({ params }: { params: { id: string } }) {
    const [step, setStep] = useState(0);

    const steps = [
        {
            id: 1,
            title: "PREP",
            instruction: "Meat Preparation",
            detail: "150g Cuts / Remove excess moisture",
            icon: Utensils,
            color: "bg-slate-100 text-slate-600"
        },
        {
            id: 2,
            title: "AROMA",
            instruction: "Apply Signature Scent",
            detail: "SPRAY 2 TIMES (Distance: 15cm)",
            icon: SprayCan,
            color: "bg-purple-100 text-purple-600",
            highlight: true
        },
        {
            id: 3,
            title: "COOK",
            instruction: "Grill Process",
            detail: "Target: 180°C / Flip every 45s",
            icon: Clock,
            color: "bg-orange-100 text-orange-600"
        },
        {
            id: 4,
            title: "FINISH",
            instruction: "Glaze & Serve",
            detail: "Brush Oil: 1 stroke ONLY",
            icon: Droplets,
            color: "bg-emerald-100 text-emerald-600",
            highlight: true
        }
    ];

    if (step === steps.length) {
        return (
            <div className="h-screen bg-emerald-600 flex flex-col items-center justify-center text-white">
                <div className="bg-white/20 p-8 rounded-full mb-6">
                    <Check className="w-24 h-24" />
                </div>
                <h1 className="text-6xl font-black mb-4">COMPLETE</h1>
                <p className="text-2xl opacity-80 mb-12">Log saved successfully</p>
                <button
                    onClick={() => setStep(0)}
                    className="px-12 py-6 bg-white text-emerald-700 text-2xl font-bold rounded-2xl shadow-lg hover:scale-105 transition-transform"
                >
                    NEXT ORDER
                </button>
            </div>
        );
    }

    const currentStep = steps[step];

    return (
        <div className="h-screen flex flex-col bg-slate-50">
            {/* Top Bar */}
            <div className="h-20 bg-slate-900 text-white flex items-center justify-between px-8">
                <div className="text-xl font-bold text-slate-400">ORDER #2841</div>
                <div className="text-2xl font-black text-emerald-400">PORK BELLY - STD v2.4</div>
            </div>

            {/* Main Instruction */}
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className={`p-8 rounded-full mb-8 ${currentStep.color}`}>
                    <currentStep.icon className="w-32 h-32" />
                </div>
                <h2 className="text-4xl font-bold text-slate-400 uppercase tracking-widest mb-4">STEP {step + 1} / {steps.length}</h2>
                <h1 className="text-8xl font-black text-slate-900 mb-6">{currentStep.instruction}</h1>
                <div className={`text-4xl font-bold px-8 py-4 rounded-xl inline-block ${currentStep.highlight ? 'bg-yellow-100 text-yellow-700 animate-pulse' : 'text-slate-500'}`}>
                    {currentStep.detail}
                </div>
            </div>

            {/* Bottom Action */}
            <button
                onClick={() => setStep(s => s + 1)}
                className="h-32 bg-slate-900 text-white text-4xl font-black uppercase tracking-wider hover:bg-emerald-600 transition-colors"
            >
                CONFIRM STEP
            </button>
        </div>
    );
}
