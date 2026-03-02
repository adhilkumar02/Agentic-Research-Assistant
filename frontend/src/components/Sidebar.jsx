import React, { useState, useEffect } from 'react';
import { Upload, FileText, Trash2, CheckSquare, Square, Search, Eye, Sparkles } from 'lucide-react';
import client from '../api/client';
import clsx from 'clsx';
import SummaryModal from './SummaryModal';

export default function Sidebar({ selectedDocs, onSelectionChange }) {
    const [documents, setDocuments] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [summaryModal, setSummaryModal] = useState({ isOpen: false, docName: null, data: null, loading: false });

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const res = await client.get('/documents/list');
            setDocuments(res.data.documents);
        } catch (err) {
            console.error("Failed to list documents", err);
        }
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            await client.post('/documents/upload', formData);
            await fetchDocuments();
        } catch (err) {
            console.error("Upload failed", err);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (filename, e) => {
        e.stopPropagation();
        if (!confirm(`Delete ${filename}?`)) return;
        try {
            await client.delete(`/documents/${filename}`);
            setDocuments(prev => prev.filter(d => (typeof d === 'string' ? d : d.name) !== filename));
            onSelectionChange(prev => prev.filter(d => d !== filename));
        } catch (err) {
            console.error("Delete failed", err);
        }
    };

    const handleSummarize = async (filename, e) => {
        e.stopPropagation();
        setSummaryModal({ isOpen: true, docName: filename, data: null, loading: true });

        try {
            const res = await client.get(`/documents/summaries/${filename}`);
            setSummaryModal({ isOpen: true, docName: filename, data: res.data, loading: false });
        } catch (err) {
            console.error("Summary failed", err);
            setSummaryModal(prev => ({ ...prev, loading: false })); // Keep open but stop loading
            alert("Failed to generate summary. backend might be busy.");
        }
    };

    const toggleSelection = (filename) => {
        onSelectionChange(prev =>
            prev.includes(filename)
                ? prev.filter(d => d !== filename)
                : [...prev, filename]
        );
    };

    const filteredDocuments = documents.filter(doc => {
        const name = typeof doc === 'string' ? doc : doc.name;
        return name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <>
            <div className="w-80 bg-[#0F0F10] border-r border-[#27272A] flex flex-col h-full z-20">
                {/* Header / Search */}
                <div className="p-5 pb-2">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-zinc-100" />
                        </div>
                        <span className="font-semibold text-zinc-100 text-lg">My Library</span>
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search documents..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#18181B] border border-[#27272A] text-zinc-200 text-sm rounded-xl py-3 pl-10 pr-4 placeholder:text-zinc-600 focus:outline-none focus:border-[#3F3F46] focus:bg-[#27272A] transition-all"
                        />
                    </div>
                </div>

                {/* Document List */}
                <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 custom-scrollbar">
                    {documents.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-zinc-600 text-sm">No documents found.</p>
                        </div>
                    ) : filteredDocuments.map(doc => {
                        const docName = typeof doc === 'string' ? doc : doc.name;
                        const isSelected = selectedDocs.includes(docName);

                        return (
                            <div
                                key={docName}
                                onClick={() => toggleSelection(docName)}
                                className={clsx(
                                    "group relative p-3 rounded-xl border cursor-pointer transition-all duration-200",
                                    isSelected
                                        ? "bg-[#27272A] border-[#3F3F46]"  // Selected state: Dark grey
                                        : "bg-transparent border-transparent hover:bg-[#18181B] hover:border-[#27272A]"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={clsx(
                                        "w-4 h-4 flex items-center justify-center rounded transition-colors",
                                        isSelected ? "text-[#22C55E]" : "text-zinc-700 group-hover:text-zinc-500" // Green Checkbox
                                    )}>
                                        {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                    </div>
                                    <span className={clsx(
                                        "truncate text-sm font-medium flex-1",
                                        isSelected ? "text-zinc-100" : "text-zinc-400 group-hover:text-zinc-300"
                                    )} title={docName}>
                                        {docName}
                                    </span>
                                </div>

                                {/* Actions (View, Summarize, Delete) */}
                                <div className={clsx(
                                    "flex justify-end gap-1 mt-2 pt-2 border-t border-white/5",
                                    isSelected || filteredDocuments.length < 5 ? "opacity-100" : "opacity-0 group-hover:opacity-100", // Sticky visibility if selected
                                    "transition-opacity duration-200"
                                )}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); window.open(`http://localhost:8000/files/${docName}`, '_blank'); }}
                                        className="p-1.5 text-zinc-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-md"
                                        title="View"
                                    >
                                        <Eye className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={(e) => handleSummarize(docName, e)}
                                        className="p-1.5 text-zinc-500 hover:text-yellow-400 hover:bg-yellow-400/10 rounded-md"
                                        title="Summarize"
                                    >
                                        <Sparkles className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={(e) => handleDelete(docName, e)}
                                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-md"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer / Upload Button */}
                <div className="p-4 border-t border-[#27272A] bg-[#0F0F10]">
                    <label className={clsx(
                        "flex items-center justify-center gap-2 w-full py-3 rounded-xl cursor-pointer transition-all duration-200",
                        uploading
                            ? "bg-[#27272A] text-zinc-500 cursor-not-allowed"
                            : "bg-[#22C55E] hover:bg-[#16A34A] text-black font-semibold hover:shadow-lg hover:shadow-green-500/20"
                    )}>
                        {uploading ? (
                            <div className="w-5 h-5 border-2 border-zinc-500 border-t-zinc-300 rounded-full animate-spin" />
                        ) : (
                            <Upload className="w-5 h-5" />
                        )}
                        <span>{uploading ? 'Uploading...' : 'Upload New PDF'}</span>
                        <input
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            onChange={handleUpload}
                            disabled={uploading}
                        />
                    </label>
                </div>
            </div>

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
