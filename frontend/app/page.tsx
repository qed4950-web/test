"use client";

import { useEffect, useState } from 'react';
import { flavorService } from '@/services/api';
import {
  Beaker, Gamepad2, TrendingUp, Zap,
  Loader2, ArrowRight, Sparkles, Flame
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Home() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    // API call placeholder - utilizing static data for reliable demo rendering
    /*
    try {
      const data = await flavorService.getDashboardStats();
      setStats(data);
    } catch (e) {
    */
    // Fallback data for demo
    setStats({
      total_recipes: 124,
      avg_score: 92,
      today_trends: 8
    });
    /*
    }
    */
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-600 text-sm font-medium mb-6"
          >
            <span className="flex h-2 w-2 rounded-full bg-orange-500 mr-2 animate-pulse"></span>
            FlavorOS v2.0 Live
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl md:text-6xl font-black text-orange-950 mb-6 tracking-tight"
          >
            Data-Driven <span className="text-orange-500">Flavor</span> <br/>
            Innovation
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-orange-800/60 max-w-2xl mx-auto leading-relaxed"
          >
            데이터로 입증된 맛의 조합을 찾아내세요. <br/>
            AI가 당신의 브랜드에 맞는 최적의 레시피를 제안합니다.
          </motion.p>
        </motion.div>

        {/* Quick Stats */}
                  />
                )}
              </motion.div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/studio"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium rounded-xl shadow-lg shadow-orange-200 hover:shadow-xl transition-all"
            >
              <Zap className="w-4 h-4" />
              스튜디오에서 시작하기
            </Link>
          </div>
        </motion.div >
      </div >
    </div >
  );
}

function StatItem({ label, value, suffix = '', delay = 0 }: { label: string, value: number, suffix?: string, delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay }}
      className="text-center"
    >
      <div className="text-3xl font-bold text-orange-900">
        <CountUp value={value} />{suffix}
      </div>
      <div className="text-sm text-orange-500 font-medium">{label}</div>
    </motion.div>
  );
}

// Simple CountUp Component
function CountUp({ value }: { value: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;

    let timer = setInterval(() => {
      start += Math.ceil((end - start) / 10);
      if (start >= end) {
        start = end;
        clearInterval(timer);
      }
      setCount(start);
    }, 30);

    return () => clearInterval(timer);
  }, [value]);

  return <>{count}</>;
}
```
