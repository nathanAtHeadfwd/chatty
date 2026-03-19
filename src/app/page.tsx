'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { UIMessage } from 'ai';
import { Send, Brain, Bot, ChevronRight, Loader2, User } from 'lucide-react';

interface GraphNode {
  id: string;
  label: string;
  content: string;
  neighbors: string[];
}

function NodeCard({ node }: { node: GraphNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/5 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors text-left"
      >
        <ChevronRight
          size={12}
          className={`text-zinc-500 transition-transform shrink-0 ${open ? 'rotate-90' : ''}`}
        />
        <span className="text-xs text-zinc-300 font-mono truncate">{node.label}</span>
        {node.neighbors.length > 0 && (
          <span className="ml-auto text-[10px] text-zinc-600 shrink-0">{node.neighbors.length}</span>
        )}
      </button>
      {open && (
        <div className="px-3 pb-2 pt-1 text-xs text-zinc-400 border-t border-white/5 space-y-1">
          {node.content && <p className="leading-relaxed line-clamp-4">{node.content}</p>}
          {node.neighbors.length > 0 && (
            <p className="text-zinc-600">
              {node.neighbors.map((n, i) => (
                <span key={i} className="text-zinc-500 font-mono">
                  {n}{i < node.neighbors.length - 1 ? ', ' : ''}
                </span>
              ))}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function MessageText({ message }: { message: UIMessage }) {
  const textPart = (message.parts as Array<{ type: string; text?: string }>)
    .find(p => p.type === 'text');
  return <>{textPart?.text ?? ''}</>;
}

function ChatUI({ userName }: { userName: string }) {
  const sessionId = userName.trim().toLowerCase().replace(/\s+/g, '_');
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [inputText, setInputText] = useState('');
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: '/api/chat', body: { sessionId } }),
    [sessionId],
  );

  const { messages, sendMessage, status, setMessages } = useChat({
    transport,
    onFinish: () => fetchNodes(),
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  const fetchNodes = async () => {
    try {
      const res = await fetch('/api/nodes');
      if (res.ok) setNodes(await res.json());
    } catch { /* vault may be empty */ }
  };

  useEffect(() => {
    fetchNodes();
    fetch(`/api/history?sessionId=${sessionId}`)
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

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-white/5 flex flex-col bg-zinc-900/50">
        <div className="px-4 py-4 border-b border-white/5 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
            <Brain size={14} className="text-violet-400" />
          </div>
          <span className="text-sm font-semibold text-white">Knowledge Graph</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {nodes.length === 0 ? (
            <div className="text-center pt-8 px-2">
              <p className="text-zinc-600 text-xs leading-relaxed">
                No nodes yet. Start chatting — entities will appear here automatically.
              </p>
            </div>
          ) : (
            nodes.map(node => <NodeCard key={node.id} node={node} />)
          )}
        </div>
        <div className="px-4 py-3 border-t border-white/5">
          <p className="text-[10px] text-zinc-600 font-mono">
            {nodes.length} node{nodes.length !== 1 ? 's' : ''}
          </p>
        </div>
      </aside>

      {/* Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="px-6 py-3.5 border-b border-white/5 flex items-center justify-between bg-zinc-900/30">
          <h2 className="text-sm font-medium text-zinc-300">Chat</h2>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <User size={12} />
            <span>{userName}</span>
          </div>
        </header>

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
                Ask me anything. I&apos;ll remember key entities and build a knowledge graph over time.
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
                {m.role === 'user' ? <span>{userName.charAt(0).toUpperCase()}</span> : <Bot size={14} />}
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

        <div className="px-6 py-4 border-t border-white/5 bg-zinc-900/30">
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
      </div>
    </div>
  );
}

export default function Home() {
  const [userName, setUserName] = useState('');
  const [nameInput, setNameInput] = useState('');

  if (userName) return <ChatUI userName={userName} />;

  return (
    <div className="fixed inset-0 bg-zinc-950 flex items-center justify-center z-50">
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
