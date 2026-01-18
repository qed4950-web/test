"use client";

import { useEffect, useState } from "react";
import { flavorService } from "@/services/api";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
    History, CheckCircle2, XCircle, Clock,
    AlertCircle, Activity
} from "lucide-react";
import clsx from "clsx";
import { motion } from "framer-motion";

export default function LogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const data = await flavorService.getLogs();
            setLogs(data);
        } catch (e) {
            console.error("Failed to fetch logs", e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-8">
            <div className="max-w-5xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-8"
                >
                    <div>
                        <h1 className="text-3xl font-bold text-orange-900 mb-2 flex items-center gap-2">
                            <History className="w-8 h-8 text-orange-500" />
                            히스토리
                        </h1>
                        <p className="text-orange-600">AI 파이프라인 실행 기록</p>
                    </div>
                    <button
                        onClick={fetchLogs}
                        className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-colors shadow-md shadow-orange-200"
                    >
                        새로고침
                    </button>
                </motion.div>

                <div className="bg-white/80 backdrop-blur rounded-2xl border border-orange-100 shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="grid grid-cols-12 gap-4 p-4 bg-orange-50/50 border-b border-orange-100 text-sm font-medium text-orange-900">
                        <div className="col-span-2">상태</div>
                        <div className="col-span-3">작업 ID / 컨텍스트</div>
                        <div className="col-span-5">로그 상세</div>
                        <div className="col-span-2 text-right">시간</div>
                    </div>

                    {/* List */}
                    <div className="divide-y divide-orange-50">
                        {loading ? (
                            <div className="p-12 text-center text-orange-400">
                                <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-2" />
                                로딩 중...
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="p-12 text-center text-orange-400">
                                기록이 없습니다.
                            </div>
                        ) : (
                            logs.map((log, i) => (
                                <motion.div
                                    key={log.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="grid grid-cols-12 gap-4 p-4 hover:bg-orange-50/50 transition-colors items-center"
                                >
                                    <div className="col-span-2">
                                        <span className={clsx(
                                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                                            log.event_type === "ERROR"
                                                ? "bg-red-50 text-red-700 border-red-200"
                                                : log.event_type === "SUCCESS" || log.event_type === "END"
                                                    ? "bg-green-50 text-green-700 border-green-200"
                                                    : "bg-blue-50 text-blue-700 border-blue-200"
                                        )}>
                                            {log.event_type === "ERROR" && <AlertCircle className="w-3 h-3" />}
                                            {(log.event_type === "SUCCESS" || log.event_type === "END") && <CheckCircle2 className="w-3 h-3" />}
                                            {!(log.event_type === "ERROR" || log.event_type === "SUCCESS" || log.event_type === "END") && <Activity className="w-3 h-3" />}
                                            {log.event_type}
                                        </span>
                                    </div>
                                    <div className="col-span-3 text-sm text-orange-800 font-mono truncate px-2">
                                        {log.store_id || log.recipe_version_id || "-"}
                                    </div>
                                    <div className="col-span-5 text-sm text-orange-600 truncate">
                                        {JSON.stringify(log.payload_json || {})}
                                    </div>
                                    <div className="col-span-2 text-right text-xs text-orange-400 flex items-center justify-end gap-1">
                                        <Clock className="w-3 h-3" />
                                        {log.ts ? format(new Date(log.ts), "MM-dd HH:mm", { locale: ko }) : "-"}
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
