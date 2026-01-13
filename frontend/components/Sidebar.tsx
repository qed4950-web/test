"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, BookOpen, ChefHat, Layers } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
    { name: 'Recipe Lab', href: '/', icon: Sparkles },
    { name: 'References', href: '/references', icon: BookOpen },
    { name: 'Blueprints', href: '/blueprints', icon: ChefHat },
    { name: 'Strategies', href: '/strategies', icon: Layers },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="w-64 bg-gradient-to-b from-gray-900 to-gray-950 min-h-screen flex flex-col">
            {/* Logo Section */}
            <div className="h-20 flex items-center px-6 border-b border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center font-bold text-xl text-white shadow-lg">
                        J
                    </div>
                    <div>
                        <span className="font-bold text-white tracking-tight text-lg">FlavorOS</span>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">Recipe Strategy</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={clsx(
                                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                                isActive
                                    ? "bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-400 border border-amber-500/30"
                                    : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                            )}
                        >
                            <item.icon className={clsx("w-5 h-5", isActive ? "text-amber-400" : "text-gray-500")} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Section */}
            <div className="p-4 border-t border-gray-800">
                <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-xs font-bold text-white">
                        주
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <div className="text-sm font-medium text-white truncate">주미당</div>
                        <div className="text-[10px] text-gray-500 truncate">맛 전략 설계자</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
