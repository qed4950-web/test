"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Beaker, Gamepad2, History, Flame } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
    {
        name: '대시보드',
        href: '/',
        icon: Home,
        description: '현황 요약',
        badge: null
    },
    {
        name: '스튜디오',
        href: '/studio',
        icon: Beaker,
        description: '레시피 설계',
        badge: 'WORK'
    },
    {
        name: '플레이그라운드',
        href: '/playground',
        icon: Gamepad2,
        description: '실험과 놀이',
        badge: 'PLAY'
    },
    {
        name: '히스토리',
        href: '/logs',
        icon: History,
        description: '작업 기록',
        badge: null
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const isPlayground = pathname === '/playground';

    return (
        <div className={clsx(
            "w-64 min-h-screen flex flex-col transition-all duration-300",
            isPlayground
                ? "bg-zinc-950 border-r border-zinc-800"
                : "bg-gradient-to-b from-orange-50 to-amber-50 border-r border-orange-100"
        )}>
            {/* Logo Section */}
            <div className={clsx(
                "h-16 flex items-center px-6 border-b",
                isPlayground ? "border-zinc-800" : "border-orange-100"
            )}>
                <div className="flex items-center gap-2">
                    <div className={clsx(
                        "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg text-white shadow-lg",
                        isPlayground
                            ? "bg-gradient-to-br from-violet-500 to-pink-500 shadow-violet-500/20"
                            : "bg-gradient-to-br from-orange-500 to-amber-500 shadow-orange-200"
                    )}>
                        <Flame className="w-5 h-5" />
                    </div>
                    <span className={clsx(
                        "font-bold tracking-tight text-md",
                        isPlayground ? "text-white" : "text-orange-900"
                    )}>FlavorOS</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-6 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const isPlaygroundItem = item.href === '/playground';

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={clsx(
                                "flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all duration-200",
                                isActive && !isPlayground && "bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium shadow-lg shadow-orange-200",
                                isActive && isPlayground && "bg-gradient-to-r from-violet-500 to-pink-500 text-white font-medium shadow-lg shadow-violet-500/20",
                                !isActive && !isPlayground && "text-orange-700 hover:text-orange-900 hover:bg-white/60 hover:shadow-sm",
                                !isActive && isPlayground && "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                            )}
                        >
                            <item.icon className={clsx(
                                "w-4 h-4",
                                isActive ? "text-white" : isPlayground ? "text-zinc-500" : "text-orange-500"
                            )} />
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    {item.name}
                                    {item.badge && (
                                        <span className={clsx(
                                            "text-[9px] px-1.5 py-0.5 rounded font-bold uppercase",
                                            item.badge === 'WORK' && (isPlayground ? "bg-orange-500/20 text-orange-400" : "bg-orange-100 text-orange-600"),
                                            item.badge === 'PLAY' && (isPlayground ? "bg-violet-500/20 text-violet-400" : "bg-violet-100 text-violet-600")
                                        )}>
                                            {item.badge}
                                        </span>
                                    )}
                                </div>
                                <div className={clsx(
                                    "text-[10px]",
                                    isActive ? "text-white/70" : isPlayground ? "text-zinc-600" : "text-orange-400"
                                )}>
                                    {item.description}
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Section */}
            <div className={clsx(
                "p-4 border-t",
                isPlayground ? "border-zinc-800" : "border-orange-100"
            )}>
                <div className={clsx(
                    "flex items-center gap-3 px-2 py-2 rounded-xl",
                    isPlayground ? "bg-zinc-900" : "bg-white/40"
                )}>
                    <div className={clsx(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm",
                        isPlayground
                            ? "bg-gradient-to-br from-violet-400 to-pink-400"
                            : "bg-gradient-to-br from-orange-400 to-amber-400"
                    )}>
                        🔥
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <div className={clsx(
                            "text-sm font-medium truncate",
                            isPlayground ? "text-white" : "text-orange-900"
                        )}>Flavor Lab</div>
                        <div className={clsx(
                            "text-[10px] truncate",
                            isPlayground ? "text-zinc-500" : "text-orange-600"
                        )}>히트 메뉴 설계 엔진</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
