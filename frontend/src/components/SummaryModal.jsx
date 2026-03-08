import React from 'react';
import { X, BookOpen, Hash, FileText } from 'lucide-react';
import Markdown from 'react-markdown';

export default function SummaryModal({ isOpen, onClose, docName, summaryData, loading }) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            {/* Modal card */}
            <div className="relative bg-[#0E0E12] border border-zinc-800/70 rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-2xl shadow-black/70 overflow-hidden"
                style={{ animation: 'msg-in .25s ease-out both' }}>

                {/* Green top accent line */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500/50 to-transparent" />

                {/* ── Header ──────────────────────────────────────── */}
                <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-zinc-800/60">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-4 h-4 text-yellow-400" />
                        </div>
                        <div>
                            <h2 className="text-[14px] font-semibold text-zinc-100 leading-tight">Document Summary</h2>
                            <p className="text-[11px] text-zinc-500 mt-0.5 truncate max-w-xs" title={docName}>{docName}</p>
                        </div>
                    </div>
                    <button onClick={onClose}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* ── Metadata pills (only when loaded) ──────────── */}
                {summaryData && !loading && (
                    <div className="flex items-center gap-2 px-6 py-2.5 border-b border-zinc-800/40 bg-zinc-900/30">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            <FileText className="w-2.5 h-2.5" />
                            {summaryData.document_type?.replace(/_/g, ' ') || 'Unknown type'}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                            <Hash className="w-2.5 h-2.5" />
                            {summaryData.total_sections} section{summaryData.total_sections !== 1 ? 's' : ''}
                        </span>
                        <span className="ml-auto text-[10px] text-zinc-600 italic">Cached — instant on re-open</span>
                    </div>
                )}

                {/* ── Content ─────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {loading ? (
                        /* Shimmer skeleton */
                        <div className="p-5 space-y-3">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="rounded-xl p-4 space-y-2.5 border border-zinc-800/40 bg-zinc-900/20">
                                    <div className="flex items-center gap-2">
                                        <div className="h-3.5 w-8 rounded animate-shimmer" />
                                        <div className="h-3.5 w-1/3 rounded animate-shimmer" />
                                    </div>
                                    <div className="h-3 w-full rounded animate-shimmer" />
                                    <div className="h-3 w-11/12 rounded animate-shimmer" />
                                    <div className="h-3 w-4/5 rounded animate-shimmer" />
                                </div>
                            ))}
                            <p className="text-center text-[11px] text-zinc-700 animate-pulse pt-1">Generating via LLM…</p>
                        </div>
                    ) : summaryData ? (
                        <div className="p-5 space-y-3">
                            {summaryData.summaries.map((section, idx) => (
                                <div key={idx}
                                    className="group rounded-xl border border-zinc-800/50 bg-zinc-900/20 hover:border-zinc-700/70 hover:bg-zinc-800/30 transition-all duration-200 overflow-hidden">

                                    {/* Section header */}
                                    <div className="flex items-center gap-2.5 px-4 pt-3.5 pb-2 border-b border-zinc-800/40">
                                        <span className="text-[9px] font-mono text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded font-bold tracking-wider">
                                            §{String(idx + 1).padStart(2, '0')}
                                        </span>
                                        <h3 className="text-[12px] font-semibold text-zinc-200 leading-tight">
                                            {section.title || `Section ${idx + 1}`}
                                        </h3>
                                    </div>

                                    {/* Summary Markdown */}
                                    <div className="px-4 py-3">
                                        <div className="prose prose-invert prose-sm max-w-none
                                            prose-p:text-zinc-400 prose-p:leading-relaxed prose-p:my-1 prose-p:text-[12px]
                                            prose-headings:text-zinc-300 prose-headings:text-[12px]
                                            prose-strong:text-zinc-300 prose-strong:font-semibold
                                            prose-code:text-emerald-400 prose-code:bg-zinc-800 prose-code:px-1 prose-code:rounded prose-code:text-[11px] prose-code:before:content-none prose-code:after:content-none
                                            prose-ul:my-1 prose-li:my-0 prose-li:text-zinc-400 prose-li:text-[12px]
                                            prose-a:text-green-400 prose-a:no-underline hover:prose-a:underline">
                                            <Markdown>{section.summary}</Markdown>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-40 text-zinc-700">
                            <BookOpen className="w-7 h-7 mb-2 opacity-30" />
                            <p className="text-[12px]">No summary available.</p>
                        </div>
                    )}
                </div>

                {/* ── Footer ──────────────────────────────────────── */}
                <div className="px-5 py-3.5 border-t border-zinc-800/60 flex justify-end">
                    <button onClick={onClose}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-[12px] font-medium transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
