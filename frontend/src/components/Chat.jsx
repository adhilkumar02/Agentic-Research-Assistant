import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, BookOpen, Trash2, ArrowRight, Zap, FileText, AlertCircle } from 'lucide-react';
import client from '../api/client';
import clsx from 'clsx';

export default function Chat({ selectedDocs }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    const handleSubmit = async (e, overrideInput) => {
        if (e) e.preventDefault();
        const textToSend = overrideInput || input;

        if (!textToSend.trim() || loading) return;

        if (selectedDocs.length === 0) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Please select at least one document from the sidebar to start chatting.' }]);
            return;
        }

        const userMsg = textToSend;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            const res = await client.post('/documents/ask-selected', {
                question: userMsg,
                documents: selectedDocs
            });

            const answer = res.data.answer;
            const sources = res.data.sources || [];

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: answer,
                sources: sources
            }]);
        } catch (err) {
            console.error("Chat error", err);
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error answering your question." }]);
        } finally {
            setLoading(false);
        }
    };

    const handleClearChat = () => {
        if (confirm("Clear conversation history?")) {
            setMessages([]);
        }
    };

    const suggestions = [
        { icon: <FileText className="w-4 h-4 text-purple-400" />, label: "Summarize selected documents", prompt: "Summarize the selected documents." },
        { icon: <AlertCircle className="w-4 h-4 text-orange-400" />, label: "Identify key risks", prompt: "What are the key risks mentioned in these documents?" },
        { icon: <Zap className="w-4 h-4 text-yellow-400" />, label: "Explain methodology", prompt: "Explain the methodology described." },
    ];

    return (
        <div className="flex-1 flex flex-col h-full bg-[#09090B] relative overflow-hidden">
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-6 z-10">
                <div className="flex items-center gap-2">
                    <span className="text-zinc-400 text-sm">Context:</span>
                    {selectedDocs.length > 0 ? (
                        <div className="flex gap-2">
                            {selectedDocs.slice(0, 2).map(doc => (
                                <span key={doc} className="bg-[#27272A] text-zinc-300 text-xs px-2 py-1 rounded-full truncate max-w-[150px] border border-zinc-800">
                                    {doc}
                                </span>
                            ))}
                            {selectedDocs.length > 2 && (
                                <span className="bg-[#27272A] text-zinc-500 text-xs px-2 py-1 rounded-full border border-zinc-800">
                                    +{selectedDocs.length - 2}
                                </span>
                            )}
                        </div>
                    ) : (
                        <span className="text-zinc-600 italic text-sm">No documents selected</span>
                    )}
                </div>
                {messages.length > 0 && (
                    <button
                        onClick={handleClearChat}
                        className="p-2 text-zinc-500 hover:text-red-400 hover:bg-white/5 rounded-full transition-colors"
                        title="Clear Chat"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-10 pb-32 custom-scrollbar" ref={scrollRef}>

                {/* Welcome Screen (Empty State) */}
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center -mt-20 animate-in fade-in duration-700">
                        <div className="w-16 h-16 bg-[#27272A] rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-black/50">
                            <Bot className="w-8 h-8 text-[#22C55E]" />
                        </div>
                        <h1 className="text-3xl font-semibold text-white mb-2 text-center">How can I help you today?</h1>
                        <p className="text-zinc-500 mb-10 text-center max-w-md">
                            Select documents from the library to ask questions, generate summaries, or analyze content.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
                            {suggestions.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSubmit(null, s.prompt)}
                                    className="flex flex-col gap-3 p-4 bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] rounded-xl text-left transition-all hover:-translate-y-1 hover:shadow-lg group"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-[#27272A] group-hover:bg-[#3F3F46] flex items-center justify-center transition-colors">
                                        {s.icon}
                                    </div>
                                    <span className="text-zinc-300 text-sm font-medium">{s.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Message Stream */}
                <div className="max-w-3xl mx-auto space-y-8 pt-10">
                    {messages.map((msg, i) => (
                        <div key={i} className={clsx(
                            "flex gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500",
                            msg.role === 'user' ? "justify-end" : "justify-start"
                        )}>
                            {msg.role === 'assistant' && (
                                <div className="w-8 h-8 rounded-full bg-[#27272A] border border-[#3F3F46] flex items-center justify-center flex-shrink-0 mt-1">
                                    <Bot className="w-4 h-4 text-[#22C55E]" />
                                </div>
                            )}

                            <div className={clsx(
                                "max-w-[85%] px-6 py-4 rounded-2xl shadow-sm",
                                msg.role === 'user'
                                    ? "bg-[#27272A] text-white" // User Bubble: Dark Grey
                                    : "text-zinc-300" // Assistant: Transparent/Text only usually, but let's give it subtle bg? No, let's keep it clean.
                            )}>
                                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                                {msg.sources && msg.sources.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-zinc-800">
                                        <div className="text-xs font-semibold text-zinc-500 mb-2 flex items-center gap-1">
                                            <BookOpen className="w-3 h-3" /> Sources
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {msg.sources.slice(0, 3).map((src, idx) => (
                                                <div key={idx} className="bg-[#18181B] border border-[#27272A] px-2 py-1 rounded text-xs text-zinc-400 hover:text-zinc-200 transition-colors">
                                                    {src.document} <span className="opacity-50">({src.score?.toFixed(2)})</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {msg.role === 'user' && (
                                <div className="w-8 h-8 rounded-full bg-[#22C55E] flex items-center justify-center flex-shrink-0 mt-1 shadow-lg shadow-green-900/20">
                                    <User className="w-4 h-4 text-black" />
                                </div>
                            )}
                        </div>
                    ))}

                    {loading && (
                        <div className="flex gap-5">
                            <div className="w-8 h-8 rounded-full bg-[#27272A] border border-[#3F3F46] flex items-center justify-center flex-shrink-0 mt-1">
                                <Bot className="w-4 h-4 text-[#22C55E]" />
                            </div>
                            <div className="flex gap-1 items-center h-10 px-4">
                                <div className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce"></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Input Area (Floating) */}
            <div className="absolute bottom-6 left-0 right-0 px-4">
                <div className="max-w-3xl mx-auto relative group">
                    <form onSubmit={(e) => handleSubmit(e)} className="relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={selectedDocs.length > 0 ? "Ask a question..." : "Select documents to start..."}
                            className="w-full bg-[#18181B] border border-[#27272A] text-white rounded-full py-4 pl-6 pr-14 focus:outline-none focus:border-[#3F3F46] focus:ring-1 focus:ring-[#3F3F46] shadow-2xl shadow-black/80 placeholder:text-zinc-600 transition-all"
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || loading}
                            className="absolute right-2 top-2 p-2 bg-[#22C55E] hover:bg-[#16A34A] text-black rounded-full transition-all disabled:opacity-0 disabled:scale-90"
                        >
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </form>
                    <div className="text-center mt-3">
                        <p className="text-[10px] text-zinc-600">Research Assistant can make mistakes. Check important info.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
