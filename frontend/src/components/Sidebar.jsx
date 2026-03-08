import React, { useState, useEffect, useRef } from 'react';
import {
    Upload, FileText, Trash2, CheckSquare, Square,
    Search, Eye, Sparkles, AlertCircle, X, Tag, FolderOpen
} from 'lucide-react';
import client from '../api/client';
import clsx from 'clsx';
import SummaryModal from './SummaryModal';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const MAX_FILE_BYTES = 50 * 1024 * 1024;

const DOC_TYPE_META = {
    research_paper: { label: 'Research', color: 'blue' },
    educational_material: { label: 'Education', color: 'purple' },
    terms_and_conditions: { label: 'T&C', color: 'orange' },
    legal_document: { label: 'Legal', color: 'red' },
    invoice: { label: 'Invoice', color: 'yellow' },
    resume_cv: { label: 'Resume', color: 'teal' },
    technical_specification: { label: 'Tech Spec', color: 'cyan' },
    meeting_minutes: { label: 'Minutes', color: 'indigo' },
    proposal: { label: 'Proposal', color: 'emerald' },
    other: { label: 'Other', color: 'zinc' },
};

const COLOR_CLASSES = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/25',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/25',
    red: 'bg-red-500/10 text-red-400 border-red-500/25',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/25',
    teal: 'bg-teal-500/10 text-teal-400 border-teal-500/25',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25',
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    zinc: 'bg-zinc-700/40 text-zinc-400 border-zinc-600/40',
};

function DocTypeBadge({ type }) {
    const meta = DOC_TYPE_META[type] || DOC_TYPE_META['other'];
    const cls = COLOR_CLASSES[meta.color];
    return (
        <span className={clsx('inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md border leading-none', cls)}>
            <Tag className="w-2.5 h-2.5" />
            {meta.label}
        </span>
    );
}

export default function Sidebar({ selectedDocs, onSelectionChange }) {
    const [documents, setDocuments] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null);
    const [pendingDelete, setPendingDelete] = useState(null);
    const [summaryModal, setSummaryModal] = useState({ isOpen: false, docName: null, data: null, loading: false });
    const confirmRef = useRef(null);

    useEffect(() => {
        fetchDocuments();
    }, []);

    useEffect(() => {
        if (!pendingDelete) return;
        const handler = (e) => {
            if (confirmRef.current && !confirmRef.current.contains(e.target)) {
                setPendingDelete(null);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [pendingDelete]);

    const fetchDocuments = async () => {
        try {
            const res = await client.get('/documents/list');
            setDocuments(res.data.documents);
        } catch (err) {
            console.error(err);
            setError('Could not reach the backend. Is it running?');
        }
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > MAX_FILE_BYTES) {
            setError(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max 50 MB.`);
            e.target.value = '';
            return;
        }
        setError(null);
        setUploading(true);
        setUploadProgress(0);
        const formData = new FormData();
        formData.append('file', file);
        try {
            await client.post('/documents/upload', formData, {
                onUploadProgress: (ev) => {
                    if (ev.total) setUploadProgress(Math.round((ev.loaded * 100) / ev.total));
                },
            });
            await fetchDocuments();
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.detail || 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
            setUploadProgress(0);
            e.target.value = '';
        }
    };

    const handleDeleteClick = (filename, e) => {
        e.stopPropagation();
        setPendingDelete(prev => (prev === filename ? null : filename));
    };

    const confirmDelete = async (filename) => {
        setPendingDelete(null);
        try {
            await client.delete(`/documents/${filename}`);
            setDocuments(prev => prev.filter(d => (typeof d === 'string' ? d : d.name) !== filename));
            onSelectionChange(prev => prev.filter(d => d !== filename));
        } catch (err) {
            console.error(err);
            setError('Delete failed. Please try again.');
        }
    };

    const handleSummarize = async (filename, e) => {
        e.stopPropagation();
        setSummaryModal({ isOpen: true, docName: filename, data: null, loading: true });
        try {
            const res = await client.get(`/documents/summaries/${filename}`);
            setSummaryModal({ isOpen: true, docName: filename, data: res.data, loading: false });
        } catch (err) {
            console.error(err);
            setSummaryModal(prev => ({ ...prev, loading: false }));
            setError('Could not generate summary. Backend may be busy.');
        }
    };

    const toggleSelection = (filename) => {
        onSelectionChange(prev =>
            prev.includes(filename) ? prev.filter(d => d !== filename) : [...prev, filename]
        );
    };

    const filteredDocuments = documents.filter(doc => {
        const name = typeof doc === 'string' ? doc : doc.name;
        return name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <>
            <aside className="relative w-[280px] flex-shrink-0 bg-[#0A0A0D] border-r border-zinc-800/60 flex flex-col h-full z-20">

                {/* Subtle top accent line */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent" />

                {/* ── Header ──────────────────────────────────────── */}
                <div className="px-4 pt-5 pb-3">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center flex-shrink-0">
                            <FolderOpen className="w-3.5 h-3.5 text-zinc-300" />
                        </div>
                        <div>
                            <p className="text-[13px] font-semibold text-zinc-100 leading-none">My Library</p>
                            <p className="text-[10px] text-zinc-600 mt-0.5">
                                {documents.length} document{documents.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search…"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-zinc-900/80 border border-zinc-800 text-zinc-300 text-[12px] rounded-lg py-2 pl-8 pr-3
                                   placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 focus:bg-zinc-800/80 transition-all"
                        />
                    </div>
                </div>

                {/* ── Error banner ────────────────────────────────── */}
                {error && (
                    <div className="mx-3 mb-2 flex items-start gap-2 bg-red-500/8 border border-red-500/25 rounded-lg px-3 py-2 text-[11px] text-red-400">
                        <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                        <span className="flex-1">{error}</span>
                        <button onClick={() => setError(null)}><X className="w-3 h-3 opacity-60 hover:opacity-100" /></button>
                    </div>
                )}

                {/* ── Document list ────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-1 space-y-1">
                    {documents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-16 px-4 text-center">
                            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3">
                                <FileText className="w-4.5 h-4.5 text-zinc-600" />
                            </div>
                            <p className="text-[12px] text-zinc-500 font-medium">No documents yet</p>
                            <p className="text-[11px] text-zinc-700 mt-1">Upload a PDF below to get started.</p>
                        </div>
                    ) : filteredDocuments.length === 0 ? (
                        <div className="py-10 text-center text-[11px] text-zinc-600">No matches for "{searchTerm}"</div>
                    ) : filteredDocuments.map(doc => {
                        const docName = typeof doc === 'string' ? doc : doc.name;
                        const docType = typeof doc === 'object' ? doc.type : null;
                        const isSelected = selectedDocs.includes(docName);
                        const isPendingDel = pendingDelete === docName;

                        return (
                            <div
                                key={docName}
                                onClick={() => toggleSelection(docName)}
                                className={clsx(
                                    'group relative rounded-xl border cursor-pointer transition-all duration-200 overflow-hidden',
                                    isSelected
                                        ? 'bg-zinc-800/60 border-zinc-700/80 shadow-lg shadow-black/20'
                                        : 'bg-transparent border-transparent hover:bg-zinc-900/60 hover:border-zinc-800'
                                )}
                            >
                                {/* Green left-edge accent when selected */}
                                {isSelected && (
                                    <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-green-500" />
                                )}

                                <div className="px-3 py-2.5">
                                    {/* Top row: checkbox + name */}
                                    <div className="flex items-start gap-2">
                                        <div className={clsx(
                                            'flex-shrink-0 mt-0.5 transition-colors',
                                            isSelected ? 'text-green-400' : 'text-zinc-700 group-hover:text-zinc-500'
                                        )}>
                                            {isSelected
                                                ? <CheckSquare className="w-3.5 h-3.5" />
                                                : <Square className="w-3.5 h-3.5" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={clsx(
                                                'text-[12px] font-medium truncate leading-snug',
                                                isSelected ? 'text-zinc-100' : 'text-zinc-400 group-hover:text-zinc-300'
                                            )} title={docName}>
                                                {docName}
                                            </p>
                                            {docType && (
                                                <div className="mt-1.5">
                                                    <DocTypeBadge type={docType} />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action row — visible on hover or if selected */}
                                    <div className={clsx(
                                        'mt-2 pt-2 border-t border-white/5 flex items-center justify-end gap-0.5',
                                        isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                                        'transition-opacity duration-150'
                                    )}>
                                        {/* View */}
                                        <button
                                            onClick={e => { e.stopPropagation(); window.open(`${API_BASE}/files/${docName}`, '_blank'); }}
                                            className="p-1.5 rounded-md text-zinc-600 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                                            title="View PDF"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                        </button>
                                        {/* Summarize */}
                                        <button
                                            onClick={e => handleSummarize(docName, e)}
                                            className="p-1.5 rounded-md text-zinc-600 hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors"
                                            title="Summarize"
                                        >
                                            <Sparkles className="w-3.5 h-3.5" />
                                        </button>
                                        {/* Two-step delete */}
                                        {isPendingDel ? (
                                            <div ref={confirmRef} className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                                <span className="text-[10px] text-red-400 font-semibold">Sure?</span>
                                                <button onClick={() => confirmDelete(docName)} className="px-1.5 py-0.5 bg-red-500/15 text-red-400 border border-red-500/30 rounded text-[10px] font-bold hover:bg-red-500/25 transition-colors">Yes</button>
                                                <button onClick={e => { e.stopPropagation(); setPendingDelete(null); }} className="p-1 text-zinc-600 hover:text-zinc-400 transition-colors"><X className="w-3 h-3" /></button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={e => handleDeleteClick(docName, e)}
                                                className="p-1.5 rounded-md text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ── Upload button ────────────────────────────────── */}
                <div className="p-3 border-t border-zinc-800/60">
                    <label className={clsx(
                        'relative flex items-center justify-center gap-2 w-full py-2.5 rounded-xl cursor-pointer overflow-hidden transition-all duration-300 text-[12px] font-semibold',
                        uploading
                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-black glow-green shadow-lg shadow-green-900/30'
                    )}>
                        {/* Progress fill */}
                        {uploading && uploadProgress > 0 && (
                            <div
                                className="absolute inset-0 bg-green-500/20 transition-[width] duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                            {uploading ? (
                                <>
                                    <div className="w-3.5 h-3.5 border-2 border-zinc-500 border-t-zinc-300 rounded-full animate-spin" />
                                    {uploadProgress > 0 ? `Uploading ${uploadProgress}%` : 'Processing…'}
                                </>
                            ) : (
                                <>
                                    <Upload className="w-3.5 h-3.5" />
                                    Upload PDF
                                </>
                            )}
                        </span>
                        <input type="file" accept=".pdf" className="hidden" onChange={handleUpload} disabled={uploading} />
                    </label>
                </div>
            </aside>

            <SummaryModal
                isOpen={summaryModal.isOpen}
                onClose={() => setSummaryModal(prev => ({ ...prev, isOpen: false }))}
                docName={summaryModal.docName}
                summaryData={summaryModal.data}
                loading={summaryModal.loading}
            />
        </>
    );
}
