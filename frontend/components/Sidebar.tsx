"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, BookOpen, Layers, LayoutDashboard, FlaskConical, Gamepad2, PieChart } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
    { name: '대시보드', href: '/', icon: LayoutDashboard },
    { name: '레퍼런스', href: '/references', icon: Sparkles },
    { name: '레시피 연구소', href: '/lab', icon: FlaskConical },
    { name: '설계도', href: '/blueprints', icon: BookOpen },
    { name: '전략 분석', href: '/strategies', icon: Layers },
    { name: '재무/세무', href: '/accounting', icon: PieChart },
    { name: '플레이그라운드', href: '/admin', icon: Gamepad2 },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="w-64 bg-white border-r border-slate-200 min-h-screen flex flex-col">
            {/* Logo Section */}
            <div className="h-16 flex items-center px-6 border-b border-slate-200">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-lg text-white">
                        J
                    </div>
                    <span className="font-bold text-slate-900 tracking-tight text-md">주미당</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-6 space-y-0.5">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={clsx(
                                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                                isActive
                                    ? "bg-slate-100 text-slate-900 font-medium"
                                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                            )}
                        >
                            <item.icon className={clsx("w-4 h-4", isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600")} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Section */}
            <div className="p-4 border-t border-slate-200">
                <div className="flex items-center gap-3 px-2 py-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 border border-slate-200">
                        JD
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <div className="text-sm font-medium text-slate-900 truncate">주미당 Lab</div>
                        <div className="text-[10px] text-slate-500 truncate">Pro Plan</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
