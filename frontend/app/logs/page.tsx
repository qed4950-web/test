"use client";

import { useEffect, useState } from 'react';
import { flavorService } from '@/services/api';
import { Activity, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';
import InlineNotice from '@/components/InlineNotice';

export default function LogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [notice, setNotice] = useState<{ tone: "info" | "success" | "warning" | "error"; message: string } | null>(null);

    async function fetchLogs() {
        setLoading(true);
        try {
            const data = await flavorService.getLogs();
            setLogs(data);
        } catch (e) {
            console.error("Failed to fetch logs", e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchLogs();
    }, []);

    const handleExport = () => {
        if (logs.length === 0) {
            setNotice({ tone: "warning", message: "내보낼 로그가 없습니다." });
            return;
        }

        // Simple CSV conversion
        const headers = ["ID", "Timestamp", "Type", "Store ID", "Recipe ID", "Payload"];
        const rows = logs.map(l => [
            l.id, l.ts, l.event_type, l.store_id || "", l.recipe_version_id || "", JSON.stringify(l.payload_json || "").replace(/,/g, ";")
        ]);

        const csvContent = "data:text/csv;charset=utf-8," +
            [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `system_logs_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading && logs.length === 0) return <div className="p-8 text-zinc-500 font-medium text-sm">Loading System Logs...</div>;


    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen bg-zinc-950 text-zinc-100 font-sans">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">Execution Logs</h1>
                    <p className="text-sm text-zinc-500 mt-1">Audit trail of system operations and recipe generations.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleExport}
                        className="px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-900 border border-zinc-700 rounded-full hover:bg-zinc-800 transition-colors shadow-sm">
                        Export CSV
                    </button>
                    <button
                        onClick={fetchLogs}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-full hover:bg-indigo-500 transition-colors shadow-sm">
                        Refresh
                    </button>
                </div>
            </div>

            {notice && (
                <InlineNotice
                    tone={notice.tone}
                    message={notice.message}
                    onClose={() => setNotice(null)}
                />
            )}

            <div className="bg-zinc-900 rounded-lg border border-zinc-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-zinc-950 text-zinc-500 font-medium border-b border-zinc-800">
                            <tr>
                                <th className="px-6 py-3 w-48">Timestamp</th>
                                <th className="px-6 py-3 w-32">Status</th>
                                <th className="px-6 py-3 w-64">Context</th>
                                <th className="px-6 py-3">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                                        No logs found.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-zinc-800/50 transition-colors group">
                                        <td className="px-6 py-4 text-zinc-400 font-mono text-xs whitespace-nowrap">
                                            {format(new Date(log.ts), 'yyyy-MM-dd HH:mm:ss')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={clsx(
                                                "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
                                                log.event_type === 'ERROR' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                                                    log.event_type === 'END' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                                        log.event_type === 'START' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                                            "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                                            )}>
                                                {log.event_type === 'ERROR' && <AlertCircle className="w-3 h-3" />}
                                                {log.event_type === 'END' && <CheckCircle2 className="w-3 h-3" />}
                                                {(log.event_type === 'START' || log.event_type === 'STEP') && <Clock className="w-3 h-3" />}
                                                {log.event_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-400">
                                            <div className="flex flex-col gap-1">
                                                {log.store_id && (
                                                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                        Store: <span className="font-mono text-zinc-300">{log.store_id.substring(0, 8)}</span>
                                                    </div>
                                                )}
                                                {log.recipe_version_id && (
                                                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                        Recipe: <span className="font-mono text-zinc-300">{log.recipe_version_id.substring(0, 8)}</span>
                                                    </div>
                                                )}
                                                {!log.store_id && !log.recipe_version_id && <span className="text-zinc-600 text-xs">-</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <code className="text-[10px] text-zinc-400 font-mono bg-zinc-950 px-2 py-1 rounded border border-zinc-800 block max-w-md truncate">
                                                {JSON.stringify(log.payload_json)}
                                            </code>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
