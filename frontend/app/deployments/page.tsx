"use client";

import { Rocket, History, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";

export default function Deployments() {
    const deployments = [
        { id: 1, name: "Gangnam Standard v2.1", storeCount: 12, status: "DEPLOYED", date: "2024-03-20 14:00" },
        { id: 2, name: "Summer Season Spicy v1.0", storeCount: 5, status: "SCHEDULED", date: "2024-04-01 09:00" },
        { id: 3, name: "Test Batch A/B", storeCount: 3, status: "ROLLED_BACK", date: "2024-03-15 11:30" },
    ];

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Deployments</h1>
                    <p className="text-slate-500 mt-1">Manage recipe distribution across your franchise.</p>
                </div>
                <button className="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2">
                    <Rocket className="w-4 h-4" /> New Deployment
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {deployments.map((d) => (
                    <div key={d.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-full ${d.status === 'DEPLOYED' ? 'bg-emerald-100 text-emerald-600' : d.status === 'ROLLED_BACK' ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-600'}`}>
                                {d.status === 'DEPLOYED' ? <CheckCircle className="w-6 h-6" /> : d.status === 'ROLLED_BACK' ? <History className="w-6 h-6" /> : <Rocket className="w-6 h-6" />}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">{d.name}</h3>
                                <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                                    <span>{d.date}</span>
                                    <span>•</span>
                                    <span>{d.storeCount} Stores</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className={`px-3 py-1 rounded-full text-xs font-bold ${d.status === 'DEPLOYED' ? 'bg-emerald-50 text-emerald-700' :
                                    d.status === 'ROLLED_BACK' ? 'bg-slate-100 text-slate-600' :
                                        'bg-blue-50 text-blue-700'
                                }`}>
                                {d.status.replace('_', ' ')}
                            </div>
                            {d.status === 'DEPLOYED' && (
                                <button className="text-sm font-bold text-slate-400 hover:text-red-500 transition-colors">
                                    Rollback
                                </button>
                            )}
                            <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400">
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
