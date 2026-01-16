"use client";

import { useState, useEffect } from "react";
import { ChevronRight, ChevronLeft, X } from "lucide-react";
import clsx from "clsx";

export interface TourStep {
    targetId: string;
    title: string;
    content: string;
    position?: "top" | "bottom" | "left" | "right";
}

interface OnboardingGuideProps {
    steps: TourStep[];
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
}

export default function OnboardingGuide({ steps, isOpen, onClose, onComplete }: OnboardingGuideProps) {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        if (isOpen) {
            updatePosition();
            window.addEventListener("resize", updatePosition);
            window.addEventListener("scroll", updatePosition);
        }
        return () => {
            window.removeEventListener("resize", updatePosition);
            window.removeEventListener("scroll", updatePosition);
        };
    }, [isOpen, currentStepIndex]);

    const updatePosition = () => {
        const step = steps[currentStepIndex];
        const element = document.getElementById(step.targetId);
        if (element) {
            setTargetRect(element.getBoundingClientRect());
            element.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
            setTargetRect(null);
        }
    };

    const handleNext = () => {
        if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex((prev) => prev + 1);
        } else {
            onComplete();
        }
    };

    const handlePrev = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex((prev) => prev - 1);
        }
    };

    if (!isOpen) return null;

    const currentStep = steps[currentStepIndex];

    // Calculate Popover Position
    const getPopoverStyle = () => {
        if (!targetRect) return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };

        const gap = 12;
        // Default to bottom if not specified
        const pos = currentStep.position || "bottom";

        switch (pos) {
            case "top":
                return {
                    top: targetRect.top - gap,
                    left: targetRect.left + targetRect.width / 2,
                    transform: "translate(-50%, -100%)",
                };
            case "bottom":
                return {
                    top: targetRect.bottom + gap,
                    left: targetRect.left + targetRect.width / 2,
                    transform: "translate(-50%, 0)",
                    zIndex: 9999
                };
            case "left":
                return {
                    top: targetRect.top + targetRect.height / 2,
                    left: targetRect.left - gap,
                    transform: "translate(-100%, -50%)",
                };
            case "right":
                return {
                    top: targetRect.top + targetRect.height / 2,
                    left: targetRect.right + gap,
                    transform: "translate(0, -50%)",
                };
            default:
                return {};
        }
    };

    return (
        <div className="fixed inset-0 z-[200] pointer-events-none">
            {/* Dark Overlay with cutout */}
            <div className="absolute inset-0 bg-slate-900/50 transition-all duration-300 backdrop-blur-sm" />

            {/* Spotlight Border */}
            {targetRect && (
                <div
                    className="absolute border-2 border-indigo-400 rounded-xl shadow-[0_0_0_9999px_rgba(15,23,42,0.5)] transition-all duration-300 ease-in-out box-content pointer-events-none"
                    style={{
                        top: targetRect.top - 4,
                        left: targetRect.left - 4,
                        width: targetRect.width + 8,
                        height: targetRect.height + 8,
                    }}
                />
            )}

            {/* Popover Card */}
            <div
                className="absolute pointer-events-auto w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200"
                style={getPopoverStyle() as React.CSSProperties}
                role="dialog"
                aria-label="투어 안내"
            >
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                            Step {currentStepIndex + 1} of {steps.length}
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 leading-tight">
                            {currentStep.title}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                        aria-label="투어 종료"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">
                    {currentStep.content}
                </p>

                <div className="flex gap-2 mt-2 pt-4 border-t border-slate-100">
                    <button
                        onClick={handlePrev}
                        disabled={currentStepIndex === 0}
                        className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-500 transition-colors"
                    >
                        이전
                    </button>
                    <button
                        onClick={handleNext}
                        className="ml-auto px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-full transition-all shadow-md shadow-indigo-200 flex items-center gap-1"
                    >
                        {currentStepIndex === steps.length - 1 ? "완료" : "다음"}
                        {currentStepIndex !== steps.length - 1 && <ChevronRight className="w-3 h-3" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
