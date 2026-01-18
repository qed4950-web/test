"use client";

import { useEffect, useRef, useState } from 'react';
import { Reference } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Share2, UserCheck, Sparkles, Globe, ChefHat } from 'lucide-react';

interface Star {
    id: string;
    x: number;
    y: number;
    z: number;
    size: number;
    color: string;
    label: string;
    type: 'ANCHOR' | 'BRAND' | 'AROMA' | 'COMPETITOR' | 'BLUE_OCEAN' | 'PERSONA' | 'INGREDIENT';
    speed: number;
    review?: string; // For Tasting mode
}

const MODES = [
    { id: 'GALAXY', label: 'Flavor Space', icon: Globe, desc: "전체 맛의 우주를 탐험하세요." },
    { id: 'MARKET', label: 'Market Gap', icon: Target, desc: "경쟁사가 없는 블루오션을 찾았습니다." },
    { id: 'PAIRING', label: 'Pairing', icon: Share2, desc: "분자 단위의 숨겨진 맛의 연결고리." },
    { id: 'TASTING', label: 'AI Tasting', icon: UserCheck, desc: "AI 페르소나들의 실시간 검증." },
];

export default function FlavorGalaxy({ references = [] }: { references?: Reference[] }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [mode, setMode] = useState('GALAXY');
    const [stars, setStars] = useState<Star[]>([]);
    const [hoveredStar, setHoveredStar] = useState<Star | null>(null);

    // For HTML Overlay (AI Reviews)
    const [projectedStars, setProjectedStars] = useState<any[]>([]);

    // Rotation state
    const rotation = useRef({ x: 0, y: 0 });
    const targetRotation = useRef({ x: 0, y: 0 });
    const isDragging = useRef(false);
    const lastMouse = useRef({ x: 0, y: 0 });

    // --- Data Generation per Mode ---
    useEffect(() => {
        rotation.current = { x: 0, y: 0 }; // Reset rotation on mode change
        targetRotation.current = { x: 0, y: 0 };

        let newStars: Star[] = [];

        if (mode === 'GALAXY') {
            // Original Logic + Mock Data if empty
            const baseRefs = references.length > 0 ? references : [
                { id: 'r1', name: 'Anchor Flavor', reference_type: 'ANCHOR' },
                { id: 'r2', name: 'My Brand', reference_type: 'BRAND' }
            ];

            newStars = baseRefs.map((ref: any, i) => {
                const hash = (ref.id || '0').split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
                const r = 250 + (hash % 150);
                const theta = (hash % 360) * (Math.PI / 180);
                const phi = ((hash * 13) % 180) * (Math.PI / 180);
                return {
                    id: ref.id,
                    x: r * Math.sin(phi) * Math.cos(theta),
                    y: r * Math.sin(phi) * Math.sin(theta),
                    z: r * Math.cos(phi),
                    size: ref.reference_type === 'ANCHOR' ? 6 : 4,
                    color: ref.reference_type === 'ANCHOR' ? '#a78bfa' : '#34d399',
                    label: ref.name,
                    type: ref.reference_type || 'BRAND',
                    speed: 0.002
                };
            });
            // Add background stars
            for (let i = 0; i < 50; i++) {
                const r = 400 + Math.random() * 200;
                newStars.push({
                    id: `bg-${i}`,
                    x: (Math.random() - 0.5) * r,
                    y: (Math.random() - 0.5) * r,
                    z: (Math.random() - 0.5) * r,
                    size: 1,
                    color: '#ffffff',
                    label: '',
                    type: 'BRAND',
                    speed: 0.0005
                });
            }

        } else if (mode === 'MARKET') {
            // Mock Competitors clustered, Blue Ocean isolated
            for (let i = 0; i < 20; i++) {
                // Cluster around (100, 100, 50)
                newStars.push({
                    id: `comp-${i}`,
                    x: 100 + (Math.random() - 0.5) * 150,
                    y: 100 + (Math.random() - 0.5) * 150,
                    z: 50 + (Math.random() - 0.5) * 100,
                    size: 3,
                    color: '#94a3b8', // Slate-400
                    label: `Competitor ${i + 1}`,
                    type: 'COMPETITOR',
                    speed: 0.001
                });
            }
            // Blue Ocean
            newStars.push({
                id: 'blue-ocean',
                x: -150, y: -100, z: -50,
                size: 15,
                color: '#3b82f6', // Blue-500
                label: 'BLUE OCEAN',
                type: 'BLUE_OCEAN',
                speed: 0
            });

        } else if (mode === 'PAIRING') {
            // Central Node + Compounds + Related Ingredients
            const center = { id: 'center', x: 0, y: 0, z: 0, size: 10, color: '#f97316', label: 'Strawberry', type: 'INGREDIENT', speed: 0 };
            newStars.push(center as Star);

            const compounds = ["Furanneol", "Ethyl Butyrate", "Methyl Cinnamate"];
            compounds.forEach((c, i) => {
                const angle = (i / compounds.length) * Math.PI * 2;
                const r = 100;
                newStars.push({
                    id: `comp-${i}`,
                    x: r * Math.cos(angle),
                    y: r * Math.sin(angle),
                    z: 0,
                    size: 5,
                    color: '#22d3ee', // Cyan
                    label: c,
                    type: 'AROMA',
                    speed: 0.002
                } as Star);

                // Connected Ingredient
                const r2 = 200;
                newStars.push({
                    id: `pair-${i}`,
                    x: r2 * Math.cos(angle),
                    y: r2 * Math.sin(angle),
                    z: (Math.random() - 0.5) * 50,
                    size: 8,
                    color: '#84cc16', // Lime
                    label: ['Tomato', 'Parmesan', 'Basil'][i],
                    type: 'INGREDIENT',
                    speed: 0.001
                } as Star);
            });

        } else if (mode === 'TASTING') {
            // Recipe in center, Personas orbiting
            newStars.push({
                id: 'recipe', x: 0, y: 50, z: 0, size: 12, color: '#f59e0b', label: 'Signature Burger', type: 'ANCHOR', speed: 0
            } as Star);

            const personas = [
                { name: "대학생", review: "가성비가 좀 아쉽네요 😅", color: "#fca5a5" },
                { name: "미식가", review: "훈연 향의 밸런스가 완벽합니다.", color: "#86efac" },
                { name: "힙스터", review: "비주얼은 합격, 근데 맛은?", color: "#c4b5fd" },
                { name: "다이어터", review: "칼로리 표시 좀 해주세요.", color: "#fdba74" },
                { name: "매니아", review: "좀 더 매웠으면 좋겠어요!", color: "#93c5fd" },
            ];

            personas.forEach((p, i) => {
                const angle = (i / personas.length) * Math.PI * 2;
                const r = 200;
                newStars.push({
                    id: `persona-${i}`,
                    x: r * Math.cos(angle),
                    y: 0,
                    z: r * Math.sin(angle),
                    size: 8,
                    color: p.color,
                    label: p.name,
                    review: p.review,
                    type: 'PERSONA',
                    speed: 0.01 // Fast orbit
                } as Star);
            });
        }

        setStars(newStars);
    }, [mode, references]);

    // Animation Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;
        const focalLength = 400;

        const render = () => {
            // Auto Rotation logic
            if (!isDragging.current) {
                targetRotation.current.y += mode === 'TASTING' ? 0.005 : 0.002; // Faster in Tasting
            }
            rotation.current.x += (targetRotation.current.x - rotation.current.x) * 0.1;
            rotation.current.y += (targetRotation.current.y - rotation.current.y) * 0.1;

            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const dpr = window.devicePixelRatio || 1;
                if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
                    canvas.width = rect.width * dpr;
                    canvas.height = rect.height * dpr;
                    ctx.scale(dpr, dpr);
                }
            }

            const width = canvas.width / (window.devicePixelRatio || 1);
            const height = canvas.height / (window.devicePixelRatio || 1);
            const centerX = width / 2;
            const centerY = height / 2;

            ctx.clearRect(0, 0, width, height);

            // Calculation & Projection
            const projected = stars.map(star => {
                const cosX = Math.cos(rotation.current.x);
                const sinX = Math.sin(rotation.current.x);
                const cosY = Math.cos(rotation.current.y);
                const sinY = Math.sin(rotation.current.y);

                let y = star.y * cosX - star.z * sinX;
                let z = star.y * sinX + star.z * cosX;
                let x = star.x * cosY - z * sinY;
                z = star.x * sinY + z * cosY;

                const scale = focalLength / (focalLength + z);
                const screenX = centerX + x * scale;
                const screenY = centerY + y * scale;

                return { ...star, screenX, screenY, scale, zDepth: z };
            }).filter(s => s.zDepth > -focalLength + 50).sort((a, b) => b.zDepth - a.zDepth);

            // Save for React Overlay
            setProjectedStars(projected);

            // Draw Connections (Pairing Mode)
            if (mode === 'PAIRING') {
                ctx.lineWidth = 1;
                projected.forEach(p => {
                    if (p.type === 'AROMA') {
                        // Connect to center an ingredients
                        projected.forEach(other => {
                            const dx = p.x - other.x;
                            const dy = p.y - other.y;
                            const dist = Math.sqrt(dx * dx + dy * dy); // 3D distance approx
                            if (dist < 150) { // Should connect neighbors
                                ctx.strokeStyle = `rgba(34, 211, 238, 0.3)`;
                                ctx.beginPath();
                                ctx.moveTo(p.screenX, p.screenY);
                                ctx.lineTo(other.screenX, other.screenY);
                                ctx.stroke();
                            }
                        });
                    }
                });
            }

            // Draw Stars
            projected.forEach(p => {
                ctx.fillStyle = p.color;

                // Special Effect for Blue Ocean
                if (p.type === 'BLUE_OCEAN') {
                    const time = Date.now() * 0.003;
                    const pulse = 1 + Math.sin(time) * 0.3;

                    // Pulse Ring
                    ctx.beginPath();
                    ctx.arc(p.screenX, p.screenY, p.size * p.scale * pulse * 2, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(59, 130, 246, ${0.5 - pulse * 0.1})`;
                    ctx.stroke();
                    ctx.shadowBlur = 20 * p.scale;
                    ctx.shadowColor = '#3b82f6';
                } else if (p.type === 'COMPETITOR') {
                    ctx.shadowBlur = 0;
                } else {
                    ctx.shadowBlur = 10 * p.scale;
                    ctx.shadowColor = p.color;
                }

                const size = p.size * p.scale * (p.type === 'BLUE_OCEAN' ? 1.5 : 1);
                ctx.beginPath();
                ctx.arc(p.screenX, p.screenY, size, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;

                // Labels (Canvas) - Basic labels
                if (p.scale > 0.5 && mode !== 'TASTING') { // HTML overlay handles tasting
                    ctx.font = `bold ${10 * p.scale}px sans-serif`;
                    ctx.fillStyle = "white";
                    ctx.textAlign = "center";
                    ctx.fillText(p.label, p.screenX, p.screenY + size + 10 * p.scale);
                }
            });

            animationId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationId);
    }, [stars, mode]); // Re-bind when stars/mode change

    // Interaction Handlers (Simplified)
    const handleMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true;
        const rect = canvasRef.current!.getBoundingClientRect();
        lastMouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (isDragging.current) {
            const deltaX = x - lastMouse.current.x;
            const deltaY = y - lastMouse.current.y;
            targetRotation.current.y += deltaX * 0.005;
            targetRotation.current.x += deltaY * 0.005;
            lastMouse.current = { x, y };
        }

        // Hover Logic (Find nearest projected star)
        let found = null;
        for (const p of projectedStars) {
            const dx = x - p.screenX;
            const dy = y - p.screenY;
            if (dx * dx + dy * dy < 400 * p.scale) { // 20px radius
                found = p;
                break; // Front-most sorted
            }
        }
        setHoveredStar(found);
    };

    const currentMode = MODES.find(m => m.id === mode);

    return (
        <div ref={containerRef} className="w-full h-[600px] rounded-2xl overflow-hidden relative border border-slate-800 shadow-2xl group bg-slate-900">
            {/* Background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1e1b4b] via-[#0f172a] to-slate-950 pointer-events-none" />

            {/* Canvas */}
            <canvas
                ref={canvasRef}
                className="w-full h-full cursor-move active:cursor-grabbing relative z-0"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={() => isDragging.current = false}
                onMouseLeave={() => isDragging.current = false}
            />

            {/* HTML Overlay for React Elements (Tooltips, Reviews) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <AnimatePresence>
                    {projectedStars.map((p) => {
                        // Only show overlays for certain types/depths
                        if (p.zDepth < -200) return null;

                        if (mode === 'TASTING' && p.type === 'PERSONA') {
                            return (
                                <motion.div
                                    key={p.id}
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0 }}
                                    className="absolute transform -translate-x-1/2 -translate-y-full pointer-events-auto"
                                    style={{ left: p.screenX, top: p.screenY - 20 }}
                                >
                                    <div className="bg-white text-slate-900 px-4 py-3 rounded-2xl rounded-bl-none shadow-xl max-w-[200px] border border-slate-200">
                                        <div className="text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full" style={{ background: p.color }}></div>
                                            {p.label}
                                        </div>
                                        <div className="text-xs font-medium leading-relaxed">
                                            "{p.review}"
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        }
                        return null;
                    })}
                </AnimatePresence>

                {/* Hover Tooltip */}
                {hoveredStar && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute bg-slate-900/90 border border-slate-700 text-white px-3 py-2 rounded-lg backdrop-blur-md pointer-events-none z-50 shadow-xl"
                        style={{ left: (hoveredStar as any).screenX + 10, top: (hoveredStar as any).screenY + 10 }}
                    >
                        <div className="text-xs font-bold text-cyan-400">{hoveredStar.type}</div>
                        <div className="font-bold">{hoveredStar.label}</div>
                    </motion.div>
                )}
            </div>

            {/* UI Layer: Controls */}
            <div className="absolute top-6 left-6 z-10 pointer-events-auto">
                <h3 className="text-white font-bold text-2xl flex items-center gap-3 drop-shadow-md">
                    <Globe className="w-6 h-6 text-indigo-400 animate-spin-slow" />
                    Flavor Galaxy <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">Unified Intelligence</span>
                </h3>
            </div>

            {/* Mode Switcher */}
            <div className="absolute top-6 right-6 z-10 flex gap-2">
                {MODES.map((m) => {
                    const isActive = mode === m.id;
                    const Icon = m.icon;
                    return (
                        <button
                            key={m.id}
                            onClick={() => setMode(m.id)}
                            className={`px-4 py-2 rounded-xl backdrop-blur-md border transition-all flex items-center gap-2 text-sm font-bold shadow-lg
                                ${isActive
                                    ? 'bg-indigo-600/80 border-indigo-400 text-white ring-2 ring-indigo-400/30'
                                    : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {m.label}
                        </button>
                    );
                })}
            </div>

            {/* Bottom Panel: Narrative */}
            <div className="absolute bottom-6 left-6 right-6 z-10">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={mode}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-2xl p-6 shadow-2xl"
                    >
                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-xl bg-gradient-to-br ${mode === 'GAP' ? 'from-blue-500 to-cyan-500' :
                                    mode === 'TASTING' ? 'from-pink-500 to-rose-500' :
                                        mode === 'PAIRING' ? 'from-green-500 to-emerald-500' :
                                            'from-indigo-500 to-violet-500'
                                }`}>
                                {currentMode?.icon && <currentMode.icon className="w-6 h-6 text-white" />}
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-lg mb-1">{currentMode?.label} Mode</h4>
                                <p className="text-slate-300 text-sm leading-relaxed">{currentMode?.desc}</p>
                                {mode === 'MARKET' && (
                                    <div className="mt-3 flex gap-2">
                                        <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded border border-blue-500/30">Target: Blue Ocean (X:-150, Y:-100)</span>
                                    </div>
                                )}
                                {mode === 'TASTING' && (
                                    <div className="mt-3 flex gap-2">
                                        <span className="text-xs bg-pink-500/20 text-pink-300 px-2 py-1 rounded border border-pink-500/30 font-bold">LIVE SESSION</span>
                                        <span className="text-xs text-slate-400 py-1">5 Personas Connected...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
