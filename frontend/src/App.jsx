import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Chat from './components/Chat';
import { Zap } from 'lucide-react';

function App() {
  const [selectedDocs, setSelectedDocs] = useState([]);

  return (
    <div className="flex flex-col h-screen bg-[#060608] text-zinc-100 overflow-hidden font-sans">

      {/* ── Premium header ────────────────────────────────────── */}
      <header className="relative flex-shrink-0 h-12 glass flex items-center justify-between px-5 z-30">
        {/* Gradient line along the bottom of the header */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500/40 to-transparent" />

        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center flex-shrink-0 glow-green-sm">
            <Zap className="w-3.5 h-3.5 text-black fill-black" />
          </div>
          <span className="font-semibold text-[13px] tracking-tight">
            <span className="text-gradient">Agentic</span>
            <span className="text-zinc-300"> Research Assistant</span>
          </span>
        </div>

        {/* Status pill */}
        <div className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border transition-all duration-500 ${selectedDocs.length > 0
            ? 'bg-green-500/10 border-green-500/30 text-green-400'
            : 'bg-zinc-900 border-zinc-800 text-zinc-500'
          }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${selectedDocs.length > 0 ? 'bg-green-400 animate-pulse' : 'bg-zinc-600'}`} />
          {selectedDocs.length > 0
            ? <><strong className="font-semibold">{selectedDocs.length}</strong> doc{selectedDocs.length !== 1 ? 's' : ''} in context</>
            : 'No context'}
        </div>
      </header>

      {/* ── Main ──────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar selectedDocs={selectedDocs} onSelectionChange={setSelectedDocs} />
        <Chat selectedDocs={selectedDocs} />
      </div>
    </div>
  );
}

export default App;
