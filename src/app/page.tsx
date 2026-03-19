'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { UIMessage } from 'ai';
import dynamic from 'next/dynamic';
import { Send, Brain, Bot, Loader2, User, Trash2, Database, X } from 'lucide-react';

const GraphVisualizer = dynamic<{ username: string }>(() => import('@/components/GraphVisualizer'), { ssr: false });

function MessageText({ message }: { message: UIMessage }) {
  const textPart = (message.parts as Array<{ type: string; text?: string }>)
    .find(p => p.type === 'text');
  return <>{textPart?.text ?? ''}</>;
}

function ChatUI({ username }: { username: string }) {
  const sessionId = username.trim().toLowerCase().replace(/\s+/g, '_');
  const [inputText, setInputText] = useState('');
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () => new DefaultChatTransport({
      api: '/api/chat',
      body: { username, sessionId },
    }),
    [username, sessionId],
  );

  const { messages, sendMessage, status, setMessages } = useChat({
    transport,
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Load chat history from disk on mount
  useEffect(() => {
    fetch(`/api/history?sessionId=${sessionId}&username=${username}`)
      .then(r => r.json())
      .then(history => { if (history.length > 0) setMessages(history); })
      .catch(() => {})
      .finally(() => setHistoryLoaded(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text || isLoading) return;
    sendMessage({ text });
    setInputText('');
  };

  const handleReset = async () => {
    if (!confirm(`Wipe all memory for "${username}"? This cannot be undone.`)) return;
    setResetting(true);
    try {
      const res = await fetch('/api/system/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      if (res.ok) {
        setMessages([]);
        showToast('Memory wiped.');
      }
    } finally {
      setResetting(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await fetch('/api/system/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      if (res.ok) showToast('Dummy data injected.');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white overflow-hidden">
      {/* Header */}
      <header className="px-5 py-3 border-b border-white/5 flex items-center gap-3 bg-zinc-900/50 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
          <Brain size={14} className="text-violet-400" />
        </div>
        <span className="text-sm font-semibold text-white">GraphChat</span>

        <div className="flex items-center gap-1.5 text-xs text-zinc-500 ml-1">
          <User size={11} />
          <span>{username}</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowGraph(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-white/5 rounded-lg transition-colors"
          >
            <Brain size={12} />
            View Graph
          </button>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-white/5 rounded-lg transition-colors disabled:opacity-40"
          >
            {seeding ? <Loader2 size={12} className="animate-spin" /> : <Database size={12} />}
            Seed Data
          </button>
          <button
            onClick={handleReset}
            disabled={resetting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors disabled:opacity-40"
          >
            {resetting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
            Reset Memory
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {!historyLoaded && (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={18} className="text-zinc-600 animate-spin" />
          </div>
        )}
        {historyLoaded && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 opacity-60">
            <Brain size={32} className="text-zinc-600" />
            <p className="text-zinc-500 text-sm max-w-xs">
              Ask me anything. Entities from your messages build up the knowledge graph over time.
            </p>
          </div>
        )}
        {historyLoaded && messages.map(m => (
          <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold mt-0.5 ${
              m.role === 'user'
                ? 'bg-violet-500/30 border border-violet-500/40 text-violet-300'
                : 'bg-zinc-700 border border-white/10 text-zinc-300'
            }`}>
              {m.role === 'user' ? <span>{username.charAt(0).toUpperCase()}</span> : <Bot size={14} />}
            </div>
            <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              m.role === 'user'
                ? 'bg-violet-600/30 border border-violet-500/20 text-white rounded-tr-sm'
                : 'bg-zinc-800/80 border border-white/5 text-zinc-200 rounded-tl-sm'
            }`}>
              <MessageText message={m} />
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center bg-zinc-700 border border-white/10 mt-0.5">
              <Bot size={14} className="text-zinc-300" />
            </div>
            <div className="bg-zinc-800/80 border border-white/5 rounded-2xl rounded-tl-sm px-4 py-2.5">
              <Loader2 size={14} className="text-zinc-500 animate-spin" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-white/5 bg-zinc-900/30 shrink-0">
        <div className="flex gap-3 items-end">
          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Type a message..."
            rows={1}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-1 bg-zinc-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/40 leading-relaxed"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !inputText.trim()}
            className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-[10px] text-zinc-700 mt-2 text-center">
          Shift+Enter for newline · Enter to send
        </p>
      </div>

      {/* Graph Modal */}
      {showGraph && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Brain size={16} className="text-violet-400" />
                <span className="text-sm font-semibold text-white">Knowledge Graph</span>
                <span className="text-xs text-zinc-500">— {username}</span>
              </div>
              <button
                onClick={() => setShowGraph(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4">
              <GraphVisualizer username={username} />
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-zinc-800 border border-white/10 text-sm text-zinc-200 px-4 py-2.5 rounded-xl shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [userName, setUserName] = useState('');
  const [nameInput, setNameInput] = useState('');

  if (userName) return <ChatUI username={userName} />;

  return (
    <div className="fixed inset-0 bg-zinc-950 flex items-center justify-center">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
            <Brain size={20} className="text-violet-400" />
          </div>
          <div>
            <h1 className="text-white font-semibold text-lg leading-tight">GraphChat</h1>
            <p className="text-zinc-500 text-xs">Memory-powered AI assistant</p>
          </div>
        </div>
        <p className="text-zinc-400 text-sm mb-4">Enter your name to start chatting.</p>
        <form
          onSubmit={e => {
            e.preventDefault();
            if (nameInput.trim()) setUserName(nameInput.trim());
          }}
          className="space-y-3"
        >
          <input
            autoFocus
            type="text"
            placeholder="Your name..."
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            className="w-full bg-zinc-800 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
          <button
            type="submit"
            disabled={!nameInput.trim()}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-sm font-medium rounded-lg py-2.5 transition-colors"
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  );
}
