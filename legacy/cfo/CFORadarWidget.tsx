// Legacy CFO Radar Widget Code
// Originally in frontend/app/page.tsx (lines 414-454)

// State (add to component):
// const [cfoRadar, setCfoRadar] = useState<any>(null);

// Fetch (add to fetchData):
// const radarData = await flavorService.getCFORadar();
// setCfoRadar(radarData);

// JSX:
{/* CFO Radar Widget */ }
<div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden">
    <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900">CFO 역량 진단 (Beta)</h3>
        </div>
        <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-bold">LIVE</span>
    </div>

    <div className="flex-1 w-full h-[250px] relative z-10">
        {cfoRadar ? (
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={cfoRadar.metrics}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                        name="Capabilities"
                        dataKey="A"
                        stroke="#4f46e5"
                        strokeWidth={2}
                        fill="#6366f1"
                        fillOpacity={0.4}
                    />
                </RadarChart>
            </ResponsiveContainer>
        ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">데이터 로딩 중...</div>
        )}
    </div>

    {cfoRadar && (
        <div className="mt-4 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
            <p className="text-xs text-indigo-800 flex gap-2">
                <span className="font-bold shrink-0">Insight:</span>
                {cfoRadar.insight}
            </p>
        </div>
    )}
</div>
