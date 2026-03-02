import React from 'react';
import { X, FileText, Loader2 } from 'lucide-react';
import Markdown from 'react-markdown';

export default function SummaryModal({ isOpen, onClose, docName, summaryData, loading }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800">
                    <div>
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-400" />
                            Document Summary
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">{docName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 space-y-4">
                            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                            <p className="text-slate-400 animate-pulse">Generating comprehensive summary...</p>
                        </div>
                    ) : summaryData ? (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="bg-slate-800 px-3 py-1 rounded-full text-xs font-medium text-slate-300 border border-slate-700">
                                    Type: <span className="text-blue-400">{summaryData.document_type}</span>
                                </div>
                                <div className="bg-slate-800 px-3 py-1 rounded-full text-xs font-medium text-slate-300 border border-slate-700">
                                    Sections: <span className="text-blue-400">{summaryData.total_sections}</span>
                                </div>
                            </div>

                            {summaryData.summaries.map((section, idx) => (
                                <div key={idx} className="bg-slate-800/50 rounded-xl p-5 border border-slate-800/50">
                                    <h3 className="text-md font-medium text-blue-300 mb-2">
                                        {section.title || `Section ${idx + 1}`}
                                    </h3>
                                    <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                                        <Markdown>{section.summary}</Markdown>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-slate-500 py-10">
                            No summary available.
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800 bg-slate-900/50 rounded-b-2xl flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
