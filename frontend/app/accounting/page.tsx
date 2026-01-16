"use client";

import { useState } from "react";
import { flavorService } from "../../services/api";
import { PieChart, Calculator, RefreshCw, Loader2, Coins, Building, Users, TrendingUp, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import InlineNotice from "../../components/InlineNotice";

export default function AccountingPage() {
    const [loading, setLoading] = useState(false);
    const [inputs, setInputs] = useState({
        employees_count: 10,
        youth_employees_count: 2,
        rnd_expenses: 50000000,
        facility_investment: 20000000,
        location: "metropolitan"
    });
    const [result, setResult] = useState<any>(null);

    const handleAnalyze = async () => {
        setLoading(true);
        try {
            const data = await flavorService.detectTaxCredits(inputs);
            // Simulate a slight delay for "AI processing" feel
            await new Promise(resolve => setTimeout(resolve, 1000));
            setResult(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(val);
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 p-8 relative overflow-hidden font-sans">
            <div className="absolute top-0 right-0 w-[520px] h-[520px] bg-emerald-50/50 blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[520px] h-[520px] bg-slate-50/50 blur-[100px] pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white border border-slate-200 rounded-xl shadow-sm">
                        <PieChart className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">재무/세무 (Accounting)</h1>
                        <p className="text-sm text-slate-500">AI Tax Detective & CFO Insights</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
                {/* Input Panel */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <Calculator className="w-5 h-5 text-emerald-600" />
                        <h3 className="text-lg font-bold text-slate-900">세무 공제 시뮬레이터</h3>
                    </div>

                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">총 직원 수</label>
                                <div className="relative">
                                    <Users className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                    <input
                                        type="number"
                                        value={inputs.employees_count}
                                        onChange={(e) => setInputs({ ...inputs, employees_count: parseInt(e.target.value) || 0 })}
                                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 transition-colors"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">청년 정규직 (만 15-29세)</label>
                                <div className="relative">
                                    <Users className="w-4 h-4 absolute left-3 top-3 text-emerald-500" />
                                    <input
                                        type="number"
                                        value={inputs.youth_employees_count}
                                        onChange={(e) => setInputs({ ...inputs, youth_employees_count: parseInt(e.target.value) || 0 })}
                                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 transition-colors"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">기업부설연구소 R&D 비용 (연간)</label>
                            <div className="relative">
                                <FlaskConicalIcon className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                <input
                                    type="number"
                                    value={inputs.rnd_expenses}
                                    onChange={(e) => setInputs({ ...inputs, rnd_expenses: parseInt(e.target.value) || 0 })}
                                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 transition-colors"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">사업용 설비 투자 금액</label>
                            <div className="relative">
                                <Building className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                <input
                                    type="number"
                                    value={inputs.facility_investment}
                                    onChange={(e) => setInputs({ ...inputs, facility_investment: parseInt(e.target.value) || 0 })}
                                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 transition-colors"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-2">사업장 위치 (수도권 과밀억제권역 여부)</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={inputs.location === "metropolitan"}
                                        onChange={() => setInputs({ ...inputs, location: "metropolitan" })}
                                        className="text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span className="text-sm text-slate-700">수도권 (서울/경기 일부)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={inputs.location === "regional"}
                                        onChange={() => setInputs({ ...inputs, location: "regional" })}
                                        className="text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span className="text-sm text-slate-700">비수도권/지방</span>
                                </label>
                            </div>
                        </div>

                        <button
                            onClick={handleAnalyze}
                            disabled={loading}
                            className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-2 mt-4"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Coins className="w-5 h-5" />}
                            AI 절세 혜택 분석 실행
                        </button>
                    </div>
                </div>

                {/* Result Panel */}
                <div className="space-y-6">
                    {!result && !loading && (
                        <div className="bg-slate-100 rounded-2xl border border-dashed border-slate-300 p-6 flex flex-col items-center justify-center h-full text-center text-slate-500 min-h-[400px]">
                            <PieChart className="w-16 h-16 mb-4 text-slate-300" />
                            <p className="font-bold text-lg mb-1">아직 분석 결과가 없습니다.</p>
                            <p className="text-sm">왼쪽 패널에 정보를 입력하고 분석을 실행해주세요.</p>
                        </div>
                    )}

                    {loading && (
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center justify-center h-full text-center min-h-[400px]">
                            <Loader2 className="w-12 h-12 mb-4 text-emerald-500 animate-spin" />
                            <p className="font-bold text-slate-700 animate-pulse">AI가 세법을 분석 중입니다...</p>
                            <p className="text-xs text-slate-400 mt-2">조세특례제한법 제29조의7 검토 중</p>
                        </div>
                    )}

                    {result && !loading && (
                        <>
                            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-1">총 예상 절세액</h3>
                                <div className="text-4xl font-extrabold text-emerald-600 tracking-tight">
                                    {formatCurrency(result.total_estimated_savings)}
                                </div>
                                <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-sm text-emerald-800 flex items-start gap-2">
                                    <TrendingUp className="w-4 h-4 mt-0.5 shrink-0" />
                                    {result.summary}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-sm font-bold text-slate-500 ml-1">상세 공제 항목</h4>
                                {result.deductions.map((item: any, idx: number) => (
                                    <div key={idx} className="bg-white rounded-xl border border-slate-200 p-4 hover:border-emerald-300 transition-colors shadow-sm">
                                        <div className="flex justify-between items-start mb-1">
                                            <h5 className="font-bold text-slate-800">{item.name}</h5>
                                            <span className="text-emerald-600 font-bold">{formatCurrency(item.amount)}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 mb-2">{item.description}</p>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${item.probability * 100}%` }} />
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400">적용 확률 {(item.probability * 100).toFixed(0)}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end">
                                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    본 결과는 모의 계산이며 실제 세무 신고와 다를 수 있습니다.
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function FlaskConicalIcon(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2" /><path d="M8.5 2h7" /><path d="M7 16h10" /></svg>
    )
}
