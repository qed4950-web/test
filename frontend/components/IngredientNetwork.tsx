"use client";

import { motion } from "framer-motion";
import { atom } from "lucide-react";

interface IngredientNetworkProps {
    data: {
        nodes: any[];
        links: any[];
        analysis: string;
    };
}

export default function IngredientNetwork({ data }: IngredientNetworkProps) {
    if (!data || !data.nodes) return null;

    // Center node is always index 0
    const centerNode = data.nodes[0];
    const otherNodes = data.nodes.slice(1);

    // Calculate positions simply (circular layout)
    const radius = 120;
    const center = { x: 200, y: 150 };

    return (
        <div className="bg-white/50 rounded-xl p-6 border border-orange-100 flex flex-col items-center">
            <h3 className="text-lg font-bold text-orange-900 mb-4 flex items-center gap-2">
                🧬 분자 푸드 페어링
            </h3>

            <div className="relative w-[400px] h-[300px] border border-orange-100/50 rounded-lg bg-white/30 backdrop-blur-sm">
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {otherNodes.map((node, i) => {
                        const angle = (i * 2 * Math.PI) / otherNodes.length;
                        const x = center.x + radius * Math.cos(angle);
                        const y = center.y + radius * Math.sin(angle);

                        return (
                            <motion.line
                                key={i}
                                x1={center.x}
                                y1={center.y}
                                x2={x}
                                y2={y}
                                stroke="#fdba74"
                                strokeWidth="2"
                                strokeDasharray="4 4"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 1, delay: 0.5 }}
                            />
                        );
                    })}
                </svg>

                {/* Center Node */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-orange-300 z-10"
                    style={{ left: center.x - 40, top: center.y - 40 }}
                >
                    {centerNode.id}
                </motion.div>

                {/* Other Nodes */}
                {otherNodes.map((node, i) => {
                    const angle = (i * 2 * Math.PI) / otherNodes.length;
                    const x = center.x + radius * Math.cos(angle) - 30; // -30 for centering div
                    const y = center.y + radius * Math.sin(angle) - 30;

                    return (
                        <motion.div
                            key={i}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 + i * 0.1 }}
                            className="absolute w-16 h-16 bg-white border-2 border-orange-300 rounded-full flex items-center justify-center text-orange-800 text-xs font-medium shadow-sm z-10"
                            style={{ left: x, top: y }}
                        >
                            {node.id}
                        </motion.div>
                    );
                })}
            </div>

            <div className="mt-4 p-4 bg-orange-50 rounded-xl text-sm text-orange-800 leading-relaxed border border-orange-100 w-full">
                {data.analysis}
            </div>
        </div>
    );
}
