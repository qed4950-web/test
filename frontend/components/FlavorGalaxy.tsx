"use client";

import { useEffect, useRef, useState } from 'react';
import { Reference } from '../services/api';

interface Star {
    x: number;
    y: number;
    z: number;
    size: number;
    color: string;
    ref: Reference;
    speed: number;
}

export default function FlavorGalaxy({ references }: { references: Reference[] }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [stars, setStars] = useState<Star[]>([]);
    const [hoveredStar, setHoveredStar] = useState<Star | null>(null);
    const [showAroma, setShowAroma] = useState(false);

    // Rotation state
    const rotation = useRef({ x: 0, y: 0 });
    const targetRotation = useRef({ x: 0, y: 0 });
    const isDragging = useRef(false);
    const lastMouse = useRef({ x: 0, y: 0 });

    // Initialize stars including Mock Aromas
    useEffect(() => {
        if (!references.length) return;

        const flavorStars: Star[] = references.map(ref => {
            const hash = ref.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const r = 300 + (hash % 150);
            const theta = (hash % 360) * (Math.PI / 180);
            const phi = ((hash * 13) % 180) * (Math.PI / 180);

            return {
                x: r * Math.sin(phi) * Math.cos(theta),
                y: r * Math.sin(phi) * Math.sin(theta),
                z: r * Math.cos(phi),
                size: ref.reference_type === 'ANCHOR' ? 6 : 4,
                color: ref.reference_type === 'ANCHOR' ? '#a78bfa' : // Violet-400
                    ref.reference_type === 'BRAND' ? '#34d399' : '#60a5fa', // Emerald-400 / Blue-400
                ref,
                speed: 0.002 + (hash % 100) * 0.00001
            };
        });

        // Mock Aromas
        const AROMAS = [
            { name: "Citrus Zest", id: "aroma-1" },
            { name: "Smoky Oak", id: "aroma-2" },
            { name: "Spicy Chili", id: "aroma-3" },
            { name: "Fresh Basil", id: "aroma-4" },
            { name: "Rich Vanilla", id: "aroma-5" },
            { name: "Roasted Garlic", id: "aroma-6" },
            { name: "Honey Butter", id: "aroma-7" },
            { name: "Truffle Oil", id: "aroma-8" },
            { name: "Green Onion", id: "aroma-9" },
            { name: "Soy Glaze", id: "aroma-10" },
        ];

        const aromaStars: Star[] = AROMAS.map((aroma, i) => {
            const r = 400 + (i * 10);
            const theta = (i * 36) * (Math.PI / 180);
            const phi = (i * 20 + 45) * (Math.PI / 180);

            return {
                x: r * Math.sin(phi) * Math.cos(theta),
                y: r * Math.sin(phi) * Math.sin(theta),
                z: r * Math.cos(phi),
                size: 4,
                color: '#22d3ee', // Cyan-400
                ref: { ...references[0], id: aroma.id, name: aroma.name, reference_type: 'AROMA' },
                speed: 0.001
            };
        });

        setStars([...flavorStars, ...aromaStars]);
    }, [references]);

    // Animation Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;
        const focalLength = 400;

        const render = () => {
            rotation.current.x += (targetRotation.current.x - rotation.current.x) * 0.1;
            rotation.current.y += (targetRotation.current.y - rotation.current.y) * 0.1;

            if (!isDragging.current) {
                targetRotation.current.y += 0.002;
            }

            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const dpr = window.devicePixelRatio || 1;
                if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
                    canvas.width = rect.width * dpr;
                    canvas.height = rect.height * dpr;
                    ctx.scale(dpr, dpr);
                }
                canvas.style.width = `${rect.width}px`;
                canvas.style.height = `${rect.height}px`;
            }

            const width = canvas.width / (window.devicePixelRatio || 1);
            const height = canvas.height / (window.devicePixelRatio || 1);
            const centerX = width / 2;
            const centerY = height / 2;

            ctx.clearRect(0, 0, width, height);

            // Draw Background Stars (Parallax)
            const time = Date.now() * 0.0005;
            for (let i = 0; i < 50; i++) {
                const x = ((i * 137.5) % width + time * 10) % width;
                const y = ((i * 23.15) % height);
                ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.3})`;
                ctx.fillRect(x, y, 1, 1);
            }

            // 1. Draw connections
            ctx.lineWidth = 0.5;
            stars.forEach((star, i) => {
                if (star.ref.reference_type === 'AROMA' && !showAroma) return;

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

                (star as any).screenX = screenX;
                (star as any).screenY = screenY;
                (star as any).scale = scale;
                (star as any).zDepth = z;

                if (star.ref.reference_type !== 'AROMA') {
                    stars.slice(i + 1).forEach(other => {
                        if (other.ref.reference_type === 'AROMA') return;

                        const dx = star.x - other.x;
                        const dy = star.y - other.y;
                        const dz = star.z - other.z;
                        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                        if (dist < 150) {
                            let oy = other.y * cosX - other.z * sinX;
                            let oz = other.y * sinX + other.z * cosX;
                            let ox = other.x * cosY - oz * sinY;
                            oz = other.x * sinY + oz * cosY;

                            const oScale = focalLength / (focalLength + oz);
                            const oScreenX = centerX + ox * oScale;
                            const oScreenY = centerY + oy * oScale;

                            const alpha = (1 - dist / 150) * 0.4; // Brighter lines
                            ctx.strokeStyle = `rgba(129, 140, 248, ${alpha})`; // Indigo-400
                            ctx.beginPath();
                            ctx.moveTo(screenX, screenY);
                            ctx.lineTo(oScreenX, oScreenY);
                            ctx.stroke();
                        }
                    });
                }
            });

            // 2. Project and Sort
            const projectedStars = stars.map(star => {
                if (star.ref.reference_type === 'AROMA' && !showAroma) return null;
                return { ...star, ...(star as any) };
            }).filter(s => s && s.zDepth).sort((a, b) => (b!.zDepth - a!.zDepth)) as any[];


            // 3. Draw Stars
            projectedStars.forEach(p => {
                if (p.zDepth < -focalLength + 50) return;

                ctx.fillStyle = p.color;
                // Add Glow
                if (p.zDepth > 0) {
                    ctx.shadowBlur = 10 * p.scale;
                    ctx.shadowColor = p.color;
                } else {
                    ctx.shadowBlur = 0;
                }

                ctx.globalAlpha = Math.min(1, Math.max(0.4, (p.zDepth + 500) / 800));

                if (p.ref.reference_type === 'AROMA') {
                    const size = p.size * p.scale * 1.5;
                    ctx.beginPath();
                    ctx.moveTo(p.screenX, p.screenY - size);
                    ctx.lineTo(p.screenX + size, p.screenY);
                    ctx.lineTo(p.screenX, p.screenY + size);
                    ctx.lineTo(p.screenX - size, p.screenY);
                    ctx.fill();

                    if (ctx.globalAlpha > 0.4) {
                        let nearest = null;
                        let minDist = 1000;
                        projectedStars.forEach(other => {
                            if (other.ref.reference_type !== 'AROMA') {
                                const dx = p.screenX - other.screenX;
                                const dy = p.screenY - other.screenY;
                                const d = Math.sqrt(dx * dx + dy * dy);
                                if (d < minDist && d < 120 * p.scale) {
                                    minDist = d;
                                    nearest = other;
                                }
                            }
                        });

                        if (nearest) {
                            ctx.beginPath();
                            ctx.strokeStyle = `rgba(34, 211, 238, ${0.4 * ctx.globalAlpha})`; // Cyan
                            ctx.setLineDash([4, 4]);
                            ctx.moveTo(p.screenX, p.screenY);
                            ctx.lineTo((nearest as any).screenX, (nearest as any).screenY);
                            ctx.stroke();
                            ctx.setLineDash([]);
                        }
                    }

                } else {
                    const size = p.size * p.scale;
                    ctx.beginPath();
                    ctx.arc(p.screenX, p.screenY, size, 0, Math.PI * 2);
                    ctx.fill();

                    if (p.ref.reference_type === 'ANCHOR') {
                        ctx.strokeStyle = '#fff';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.arc(p.screenX, p.screenY, size + 4, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                }

                ctx.shadowBlur = 0; // Reset

                // Label
                const isHovered = hoveredStar && hoveredStar.ref.id === p.ref.id;
                const isAnchor = p.ref.reference_type === 'ANCHOR';

                if (isHovered || (isAnchor && ctx.globalAlpha > 0.6)) {
                    ctx.font = isAnchor ? "bold 13px sans-serif" : "bold 12px sans-serif";
                    ctx.globalAlpha = isHovered ? 1 : 0.8;

                    const text = p.ref.name;
                    const textMetrics = ctx.measureText(text);
                    const padding = 6;

                    // Dark Pill for Label
                    ctx.fillStyle = "rgba(15, 23, 42, 0.9)"; // Slate-900 transparent
                    ctx.strokeStyle = p.color;
                    ctx.lineWidth = 0.5;

                    ctx.beginPath();
                    ctx.roundRect(
                        p.screenX + 12,
                        p.screenY - 12,
                        textMetrics.width + padding * 2,
                        22,
                        4
                    );
                    ctx.fill();
                    ctx.stroke();

                    // Text
                    ctx.fillStyle = "#fff";
                    ctx.textBaseline = 'middle';
                    ctx.fillText(text, p.screenX + 12 + padding, p.screenY - 1); // Centered Y

                    if (p.ref.reference_type === 'AROMA' && isHovered) {
                        // Subtitle
                        ctx.fillStyle = "#94a3b8"; // Slate-400
                        ctx.font = "10px sans-serif";
                        ctx.fillText("Pairing Candidate", p.screenX + 12 + padding, p.screenY + 14);
                    }
                }
            });

            animationId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationId);
    }, [stars, hoveredStar, showAroma]);

    // Mouse Handlers
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

        let found = null;
        for (const star of stars) {
            const s = star as any;
            if (star.ref.reference_type === 'AROMA' && !showAroma) continue;
            if (s.screenX) {
                const dx = x - s.screenX;
                const dy = y - s.screenY;
                if (Math.sqrt(dx * dx + dy * dy) < 15 * s.scale) {
                    if (!found || (s.zDepth > (found as any).zDepth)) {
                        found = star;
                    }
                }
            }
        }
        setHoveredStar(found);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true;
        const rect = canvasRef.current!.getBoundingClientRect();
        lastMouse.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const handleMouseUp = () => {
        isDragging.current = false;
    };

    return (
        <div ref={containerRef} className="w-full h-[500px] rounded-2xl overflow-hidden relative border border-slate-800 shadow-2xl group">
            {/* Deep Space Background */}
            <div className="absolute inset-0 bg-slate-900 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1e1b4b] via-[#0f172a] to-slate-950 pointer-events-none" />

            {/* Title Overlay */}
            <div className="absolute top-6 left-6 z-10 pointer-events-none">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse shadow-[0_0_10px_#818cf8]" />
                    Flavor Galaxy
                </h3>
                <p className="text-slate-400 text-xs mt-1">Interactive Flavor Space</p>
                {showAroma && <p className="text-cyan-400 text-xs mt-1 font-bold animate-pulse">● Aroma Layers Active</p>}
            </div>

            {/* Controls */}
            <div className="absolute top-6 right-6 z-10 flex flex-col gap-2 items-end">
                <button
                    onClick={() => setShowAroma(!showAroma)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all flex items-center gap-2 shadow-sm ${showAroma
                        ? 'bg-cyan-950/50 border-cyan-500 text-cyan-300'
                        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                        }`}
                >
                    {showAroma ? (
                        <><span>✨</span> Hide Aromas</>
                    ) : (
                        <><span>⚪</span> Show Aromas</>
                    )}
                </button>
                <div className="text-[10px] text-slate-500 bg-slate-900/80 px-2 py-1 rounded border border-slate-800 backdrop-blur-sm">
                    Drag to Rotate • Hover to Inspect
                </div>
            </div>

            {/* Canvas */}
            <canvas
                ref={canvasRef}
                className="w-full h-full cursor-move active:cursor-grabbing relative z-0"
                onMouseMove={handleMouseMove}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            />

            {/* Stats */}
            <div className="absolute bottom-4 right-4 text-xs text-slate-600 pointer-events-none font-mono">
                NODES: {stars.length} | ORBIT: {Math.round(rotation.current.y * 100) / 100}
            </div>
        </div>
    );
}
