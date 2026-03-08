import React, { useState, useRef, useEffect } from 'react';
import {
    Bot, User, BookOpen, Trash2, ArrowUp,
    Zap, FileText, AlertCircle, X, Layers, Search
} from 'lucide-react';
import Markdown from 'react-markdown';
import client from '../api/client';
import clsx from 'clsx';

export default function Chat({ selectedDocs }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const scrollRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    const handleSubmit = async (e, override) => {
        if (e) e.preventDefault();
        const text = override || input;
        if (!text.trim() || loading) return;
        setError(null);

        let endpoint = '/documents/ask-selected';
        let payload = { question: text, documents: selectedDocs };

        if (selectedDocs.length === 0) {
            // Use ask_all instead of blocking
            endpoint = '/documents/ask_all';
            payload = { question: text };
        }

        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: text }]);
        setLoading(true);

        try {
            const res = await client.post(endpoint, payload);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: res.data.answer,
                sources: res.data.sources || [],
            }]);
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.detail || 'Could not reach the server. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setMessages([]);
        setError(null);
        inputRef.current?.focus();
    };

    const suggestions = [
        { icon: <FileText className="w-4 h-4 text-purple-400" />, label: 'Summarize this document', prompt: 'Summarize the selected documents.' },
        { icon: <AlertCircle className="w-4 h-4 text-orange-400" />, label: 'Identify key risks', prompt: 'What are the key risks mentioned in these documents?' },
        { icon: <Zap className="w-4 h-4 text-yellow-400" />, label: 'Explain the methodology', prompt: 'Explain the methodology described.' },
        { icon: <Search className="w-4 h-4 text-blue-400" />, label: 'Find main conclusions', prompt: 'What are the main conclusions or findings?' },
        { icon: <Layers className="w-4 h-4 text-teal-400" />, label: 'List all key entities', prompt: 'List all key people, organizations, or concepts mentioned.' },
    ];

    return (
        <div className="flex-1 flex flex-col h-full bg-[#060608] relative overflow-hidden">

            {/* ── Ambient background orbs (visible only on welcome screen) ── */}
            {messages.length === 0 && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
                    <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-green-600/8 rounded-full blur-3xl animate-orb" />
                    <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-emerald-500/6 rounded-full blur-3xl animate-orb" style={{ animationDelay: '-4s' }} />
                    <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-teal-600/5 rounded-full blur-3xl animate-orb" style={{ animationDelay: '-8s' }} />
                </div>
            )}

            {/* ── Header bar ─────────────────────────────────────────── */}
            <div className="flex-shrink-0 h-12 flex items-center justify-between px-5 border-b border-zinc-800/60">
                {/* Context chips */}
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[11px] text-zinc-600 flex-shrink-0">Context:</span>
                    {selectedDocs.length > 0 ? (
                        <div className="flex gap-1.5 overflow-hidden">
                            {selectedDocs.slice(0, 2).map(doc => (
                                <span key={doc}
                                    className="bg-zinc-800 text-zinc-300 text-[10px] px-2 py-0.5 rounded-full truncate max-w-[130px] border border-zinc-700/60">
                                    {doc}
                                </span>
                            ))}
                            {selectedDocs.length > 2 && (
                                <span className="bg-zinc-800 text-zinc-500 text-[10px] px-2 py-0.5 rounded-full border border-zinc-700/60">
                                    +{selectedDocs.length - 2}
                                </span>
                            )}
                        </div>
                    ) : (
                        <span className="text-[11px] text-zinc-700 italic">No documents selected</span>
                    )}
                </div>

                {/* Clear button */}
                {messages.length > 0 && (
                    <button onClick={handleClear}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] text-zinc-500 hover:text-red-400 hover:bg-red-500/8 border border-transparent hover:border-red-500/20 transition-all"
                        title="Clear chat">
                        <Trash2 className="w-3.5 h-3.5" /> Clear
                    </button>
                )}
            </div>

            {/* ── Error banner ───────────────────────────────────────── */}
            {error && (
                <div className="mx-5 mt-3 flex items-start gap-2.5 bg-red-500/8 border border-red-500/25 rounded-xl px-4 py-2.5 text-[12px] text-red-400">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span className="flex-1">{error}</span>
                    <button onClick={() => setError(null)} className="opacity-60 hover:opacity-100 transition-opacity"><X className="w-3.5 h-3.5" /></button>
                </div>
            )}

            {/* ── Scroll area ────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-5 xl:px-0 pb-36" ref={scrollRef}>

                {/* ── Welcome screen ──────────────────────────────── */}
                {messages.length === 0 && (
                    <div className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-full py-20 text-center">

                        {/* Glowing icon */}
                        <div className="relative mb-7">
                            <div className="absolute inset-0 w-16 h-16 bg-green-500/20 rounded-2xl blur-xl" />
                            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/60 flex items-center justify-center shadow-2xl shadow-black">
                                <Bot className="w-7 h-7 text-green-400" />
                            </div>
                        </div>

                        <h1 className="text-3xl font-bold tracking-tight mb-2">
                            <span className="text-white">Ask anything about your </span>
                            <span className="text-gradient">documents</span>
                        </h1>
                        <p className="text-zinc-500 text-[13px] max-w-sm mb-10 leading-relaxed">
                            Select one or more PDFs from the sidebar, then ask questions, extract insights, or generate summaries.
                        </p>

                        {/* Suggestion cards — 2 cols × 2 rows + 1 wide */}
                        <div className="w-full grid grid-cols-2 gap-3">
                            {suggestions.slice(0, 4).map((s, i) => (
                                <button key={i} onClick={() => handleSubmit(null, s.prompt)}
                                    className="group flex items-start gap-3 p-4 bg-zinc-900/70 hover:bg-zinc-800/80
                                               border border-zinc-800 hover:border-zinc-700
                                               rounded-xl text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/40">
                                    <div className="w-8 h-8 rounded-lg bg-zinc-800 group-hover:bg-zinc-700 flex items-center justify-center flex-shrink-0 transition-colors">
                                        {s.icon}
                                    </div>
                                    <span className="text-zinc-400 group-hover:text-zinc-200 text-[12px] font-medium leading-snug mt-0.5 transition-colors">
                                        {s.label}
                                    </span>
                                </button>
                            ))}
                            {/* 5th card — full width */}
                            <button onClick={() => handleSubmit(null, suggestions[4].prompt)}
                                className="group col-span-2 flex items-center gap-3 p-4 bg-zinc-900/70 hover:bg-zinc-800/80
                                           border border-zinc-800 hover:border-zinc-700
                                           rounded-xl text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/40">
                                <div className="w-8 h-8 rounded-lg bg-zinc-800 group-hover:bg-zinc-700 flex items-center justify-center flex-shrink-0 transition-colors">
                                    {suggestions[4].icon}
                                </div>
                                <span className="text-zinc-400 group-hover:text-zinc-200 text-[12px] font-medium transition-colors">
                                    {suggestions[4].label}
                                </span>
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Message stream ──────────────────────────────── */}
                {messages.length > 0 && (
                    <div className="max-w-2xl mx-auto space-y-6 pt-6">
                        {messages.map((msg, i) => (
                            <div key={i} className={clsx('flex gap-3 animate-msg', msg.role === 'user' ? 'justify-end' : 'justify-start')}>

                                {/* Bot avatar */}
                                {msg.role === 'assistant' && (
                                    <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md">
                                        <Bot className="w-3.5 h-3.5 text-green-400" />
                                    </div>
                                )}

                                {/* Bubble */}
                                <div className={clsx('max-w-[80%]', msg.role === 'user' ? 'items-end' : 'items-start')}>
                                    <div className={clsx(
                                        'px-4 py-3 rounded-2xl text-[13px] leading-relaxed',
                                        msg.role === 'user'
                                            ? 'bg-zinc-800 border border-zinc-700/60 text-zinc-100 rounded-tr-sm'
                                            : 'text-zinc-300'
                                    )}>
                                        {msg.role === 'assistant' ? (
                                            <div className="prose prose-invert prose-sm max-w-none
                                                prose-p:text-zinc-300 prose-p:leading-relaxed prose-p:my-1.5
                                                prose-headings:text-zinc-100 prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1
                                                prose-strong:text-zinc-100 prose-strong:font-semibold
                                                prose-em:text-zinc-400
                                                prose-code:text-emerald-400 prose-code:bg-zinc-800/80 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[11px] prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
                                                prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-700/60 prose-pre:rounded-xl prose-pre:my-3
                                                prose-ul:my-2 prose-li:my-0.5 prose-li:text-zinc-300
                                                prose-ol:my-2
                                                prose-blockquote:border-green-500/40 prose-blockquote:text-zinc-400 prose-blockquote:bg-zinc-900/50 prose-blockquote:rounded-r-lg prose-blockquote:py-1
                                                prose-hr:border-zinc-700
                                                prose-a:text-green-400 prose-a:no-underline hover:prose-a:underline">
                                                <Markdown>{msg.content}</Markdown>
                                            </div>
                                        ) : (
                                            <p className="whitespace-pre-wrap">{msg.content}</p>
                                        )}
                                    </div>

                                    {/* Source citations */}
                                    {msg.sources && msg.sources.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            <span className="flex items-center gap-1 text-[10px] text-zinc-600 mr-1">
                                                <BookOpen className="w-3 h-3" /> Sources:
                                            </span>
                                            {msg.sources.slice(0, 4).map((src, idx) => (
                                                <span key={idx}
                                                    className="inline-flex items-center gap-1 bg-zinc-900 border border-zinc-800 text-zinc-500 text-[10px] px-2 py-0.5 rounded-full hover:text-zinc-300 hover:border-zinc-700 transition-colors"
                                                    title={`${src.document} — ${src.title}`}>
                                                    <span className="text-zinc-600 font-mono">#{src.section_id?.replace('sec_', '')}</span>
                                                    {src.title && <span className="truncate max-w-[80px]">{src.title}</span>}
                                                    <span className="text-zinc-700">·{src.score?.toFixed(1)}</span>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* User avatar */}
                                {msg.role === 'user' && (
                                    <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md shadow-green-900/30">
                                        <User className="w-3.5 h-3.5 text-black" />
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Typing indicator */}
                        {loading && (
                            <div className="flex gap-3 animate-msg">
                                <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0 animate-pulse-ring">
                                    <Bot className="w-3.5 h-3.5 text-green-400" />
                                </div>
                                <div className="flex items-center gap-1.5 px-4 py-3 bg-zinc-900/40 rounded-2xl rounded-tl-sm">
                                    <div className="typing-dot" />
                                    <div className="typing-dot" />
                                    <div className="typing-dot" />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Floating input bar ─────────────────────────────────── */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#060608] via-[#060608]/95 to-transparent pt-10">
                <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
                    <div className="relative flex items-end gap-2">
                        <div className="flex-1 relative">
                            <textarea
                                ref={inputRef}
                                rows={1}
                                value={input}
                                onChange={e => {
                                    setInput(e.target.value);
                                    // auto-resize
                                    e.target.style.height = 'auto';
                                    e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px';
                                }}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmit(e);
                                    }
                                }}
                                placeholder={selectedDocs.length > 0 ? 'Ask a question… (Enter to send, Shift+Enter for new line)' : 'Select a document to start…'}
                                disabled={loading}
                                className="w-full bg-zinc-900 border border-zinc-700/70 text-[13px] text-zinc-100 rounded-2xl py-3.5 pl-4 pr-4 resize-none
                                           focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-600/50
                                           placeholder:text-zinc-600 transition-all shadow-xl shadow-black/50
                                           disabled:opacity-60 leading-relaxed overflow-hidden"
                                style={{ minHeight: '50px', maxHeight: '140px' }}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!input.trim() || loading}
                            className="flex-shrink-0 w-10 h-10 rounded-xl bg-green-500 hover:bg-green-400 text-black flex items-center justify-center
                                       shadow-lg shadow-green-900/40 transition-all duration-200
                                       disabled:opacity-30 disabled:shadow-none disabled:cursor-not-allowed
                                       active:scale-95"
                        >
                            <ArrowUp className="w-4 h-4" />
                        </button>
                    </div>

                    <p className="text-center text-[10px] text-zinc-700 mt-2">
                        Agentic Research Assistant · Answers grounded in your documents only
                    </p>
                </form>
            </div>
        </div>
    );
}
