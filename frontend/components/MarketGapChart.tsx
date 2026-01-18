"use client";

import {
    ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell
} from 'recharts';
import { motion } from 'framer-motion';
import { Target, TrendingUp, AlertCircle } from 'lucide-react';

interface MarketGapChartProps {
    data: {
        competitors: any[];
        blue_ocean: any;
        reasoning: string;
    };
    onApplyStrategy: () => void;
}

export default function MarketGapChart({ data, onApplyStrategy }: MarketGapChartProps) {
    const chartData = [
        ...data.competitors.map((c, i) => ({ ...c, type: 'competitor', id: i })),
        { ...data.blue_ocean, type: 'blue_ocean', z: 100 } // Make blue ocean larger
    ];

    return (
        <div className="bg-white/50 rounded-xl p-6 border border-orange-100">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-bold text-orange-900 flex items-center gap-2">
                        <Target className="w-5 h-5 text-blue-500" />
                        Blue Ocean Map
                    </h3>
                    <p className="text-xs text-orange-500">경쟁사 밀도 분석을 통한 기회 포착</p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                        <span>Competitors</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
                        <span className="font-bold text-blue-600">Blue Ocean</span>
                    </div>
                </div>
            </div>

            <div className="h-[300px] w-full mb-6 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis
                            type="number"
                            dataKey="x"
                            name="Savory (감칠맛)"
                            domain={[0, 100]}
                            unit="%"
                            label={{ value: 'Savory →', position: 'insideBottomRight', offset: -10 }}
                        />
                        <YAxis
                            type="number"
                            dataKey="y"
                            name="Sweet (단맛)"
                            domain={[0, 100]}
                            unit="%"
                            label={{ value: 'Sweet ↑', position: 'insideTopLeft', offset: 10 }}
                        />
                        <ZAxis type="number" dataKey="z" range={[50, 400]} name="Spicy" />
                        <Tooltip
                            cursor={{ strokeDasharray: '3 3' }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const d = payload[0].payload;
                                    return (
                                        <div className="bg-white p-3 border border-orange-200 shadow-xl rounded-lg text-xs">
                                            <strong className="block mb-1 text-sm">{d.label}</strong>
                                            <div>감칠맛: {d.x.toFixed(0)}</div>
                                            <div>단맛: {d.y.toFixed(0)}</div>
                                            <div>매운맛: {d.z.toFixed(0)}</div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Scatter name="Brands" data={chartData} fill="#8884d8">
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.type === 'blue_ocean' ? '#3b82f6' : '#9ca3af'}
                                    opacity={entry.type === 'blue_ocean' ? 1 : 0.5}
                                />
                            ))}
                            <LabelList dataKey="label" position="top" style={{ fontSize: '10px', fill: '#666' }} />
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>

                {/* Animated Pulse Ring for Blue Ocean */}
                {/* Note: In a real implementation, we'd map coordinates to pixels. Here simplified. */}
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                        <h4 className="font-bold text-blue-900 text-sm mb-1">AI 전략 제언</h4>
                        <p className="text-sm text-blue-700 leading-relaxed whitespace-pre-line">
                            {data.reasoning}
                        </p>
                    </div>
                </div>
            </div>

            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onApplyStrategy}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-200 transition-all flex items-center justify-center gap-2"
            >
                <TrendingUp className="w-4 h-4" />
                블루오션 전략 적용하기 (좌표 동기화)
            </motion.button>
        </div>
    );
}
