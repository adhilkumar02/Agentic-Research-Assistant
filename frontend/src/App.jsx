import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Chat from './components/Chat';

function App() {
  const [selectedDocs, setSelectedDocs] = useState([]);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar
        selectedDocs={selectedDocs}
        onSelectionChange={setSelectedDocs}
      />
      <Chat
        selectedDocs={selectedDocs}
      />
    </div>
  );
}

export default App;
