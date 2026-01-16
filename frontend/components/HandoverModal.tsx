"use client";

import { useState, useEffect } from "react";
import { Check, Loader2, Factory, FileText, Truck, ShieldCheck } from "lucide-react";
import clsx from "clsx";

interface HandoverModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipeName: string;
}

export default function HandoverModal({ isOpen, onClose, recipeName }: HandoverModalProps) {
    const [step, setStep] = useState(0); // 0: Init, 1: Checks, 2: Sending, 3: Done

    useEffect(() => {
        if (isOpen) {
            setStep(0);
            const timer1 = setTimeout(() => setStep(1), 500); // Start checks
            const timer2 = setTimeout(() => setStep(2), 2500); // Start sending
            const timer3 = setTimeout(() => setStep(3), 4500); // Done

            return () => {
                clearTimeout(timer1);
                clearTimeout(timer2);
                clearTimeout(timer3);
            };
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-indigo-600 px-6 py-4 flex items-center gap-3">
                    <Factory className="w-6 h-6 text-white" />
                    <div>
                        <h3 className="font-bold text-white text-lg">생산 공정 이관 (Handover)</h3>
                        <p className="text-indigo-100 text-xs">대상: 스마트 팩토리 라인 A-04</p>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    <div>
                        <h4 className="font-bold text-slate-900 mb-1">{recipeName}</h4>
                        <p className="text-sm text-slate-500">생산 준비 프로세스를 진행합니다.</p>
                    </div>

                    {/* Progress Checklist */}
                    <div className="space-y-3">
                        {/* Item 1 */}
                        <div className="flex items-center gap-3">
                            <div className={clsx("w-6 h-6 rounded-full flex items-center justify-center transition-colors", step >= 1 ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-300")}>
                                {step >= 1 ? <Check className="w-3.5 h-3.5" /> : <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            </div>
                            <div className={step >= 1 ? "text-slate-800" : "text-slate-400"}>
                                <span className="text-sm font-bold flex items-center gap-2"><FileText className="w-3 h-3" /> 최종 배합비 (BOM) 검증</span>
                            </div>
                        </div>

                        {/* Item 2 */}
                        <div className="flex items-center gap-3">
                            <div className={clsx("w-6 h-6 rounded-full flex items-center justify-center transition-colors", step >= 2 ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-300")}>
                                {step >= 2 ? <Check className="w-3.5 h-3.5" /> : step === 1 ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <div className="w-2 h-2 rounded-full bg-slate-300" />}
                            </div>
                            <div className={step >= 2 ? "text-slate-800" : "text-slate-400"}>
                                <span className="text-sm font-bold flex items-center gap-2"><ShieldCheck className="w-3 h-3" /> 식품 안전성(MSDS) 확인</span>
                            </div>
                        </div>

                        {/* Item 3 */}
                        <div className="flex items-center gap-3">
                            <div className={clsx("w-6 h-6 rounded-full flex items-center justify-center transition-colors", step >= 3 ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-300")}>
                                {step >= 3 ? <Check className="w-3.5 h-3.5" /> : step === 2 ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <div className="w-2 h-2 rounded-full bg-slate-300" />}
                            </div>
                            <div className={step >= 3 ? "text-slate-800" : "text-slate-400"}>
                                <span className="text-sm font-bold flex items-center gap-2"><Truck className="w-3 h-3" /> 팩토리 슬롯 예약</span>
                            </div>
                        </div>
                    </div>

                    {/* Completion State */}
                    {step === 3 && (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center animate-in fade-in slide-in-from-bottom-2">
                            <p className="text-emerald-700 font-bold text-sm mb-1">이관 완료 (Transferred)</p>
                            <p className="text-emerald-600 text-xs">예상 생산 완료일: <span className="font-mono font-bold">2026. 01. 20</span></p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-slate-50 px-6 py-4 flex justify-end border-t border-slate-100">
                    <button
                        onClick={onClose}
                        className={clsx(
                            "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                            step === 3
                                ? "bg-slate-900 text-white hover:bg-slate-800 shadow-md"
                                : "bg-slate-200 text-slate-400 cursor-not-allowed"
                        )}
                        disabled={step < 3}
                    >
                        {step < 3 ? "처리 중..." : "확인 및 닫기"}
                    </button>
                </div>
            </div>
        </div>
    );
}
