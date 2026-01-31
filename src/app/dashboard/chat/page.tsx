'use client';

import { useState, useRef, useEffect } from 'react';
import {
    Send,
    Bot,
    User,
    Loader2,
    Zap,
    ShieldCheck,
    Search,
    Sparkles,
    Terminal,
    ChevronRight,
    Database
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    status?: string;
    agents?: string[];
    routing?: any;
}

const AGENT_ICONS: Record<string, any> = {
    ANALYST: <Search className="w-3.5 h-3.5" />,
    AUDITOR: <ShieldCheck className="w-3.5 h-3.5" />,
    RESEARCH: <Sparkles className="w-3.5 h-3.5" />,
    OPTIMIZER: <Zap className="w-3.5 h-3.5" />,
    PLANNER: <Terminal className="w-3.5 h-3.5" />,
    MEMORY: <Database className="w-3.5 h-3.5" />,
};

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentStatus, setCurrentStatus] = useState<string | null>(null);
    const [activeAgents, setActiveAgents] = useState<string[]>([]);

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, currentStatus]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);
        setCurrentStatus('Initializing swarm...');
        setActiveAgents([]);

        try {
            const response = await fetch('/api/agent/chat/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMsg],
                    propertyId: '00000000-0000-0000-0000-000000000000', // Mock or selected property
                }),
            });

            if (!response.body) throw new Error('No response body');
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            let assistantMsgContent = '';
            const assistantMsgId = (Date.now() + 1).toString();

            // Placeholder for the assistant message
            setMessages(prev => [...prev, {
                id: assistantMsgId,
                role: 'assistant',
                content: '',
            }]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n\n');

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    const jsonStr = line.replace('data: ', '');
                    try {
                        const data = JSON.parse(jsonStr);

                        if (data.type === 'status') {
                            setCurrentStatus(data.message);
                        } else if (data.type === 'routing') {
                            const agentsToRun = [data.data.primaryAgent, ...(data.data.secondaryAgents || [])];
                            setActiveAgents(agentsToRun);
                            setCurrentStatus(`Orchestrated: ${agentsToRun.join(' → ')}`);
                        } else if (data.type === 'agent_result') {
                            const agentName = data.data.agent;
                            const output = data.data.output;

                            assistantMsgContent += `\n\n### ${agentName} Output\n${output}`;

                            setMessages(prev => prev.map(m =>
                                m.id === assistantMsgId ? { ...m, content: assistantMsgContent } : m
                            ));
                        } else if (data.type === 'error') {
                            assistantMsgContent += `\n\n**Error:** ${data.message}`;
                            setMessages(prev => prev.map(m =>
                                m.id === assistantMsgId ? { ...m, content: assistantMsgContent } : m
                            ));
                        }
                    } catch (e) {
                        console.error("Failed to parse SSE chunk", e);
                    }
                }
            }
        } catch (error: any) {
            console.error("Chat fetch error:", error);
        } finally {
            setIsLoading(false);
            setCurrentStatus(null);
            setActiveAgents([]);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50">
            {/* Messages Scroll Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 scroll-smooth"
            >
                <AnimatePresence>
                    {messages.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto"
                        >
                            <div className="w-16 h-16 rounded-3xl bg-blue-600/10 flex items-center justify-center mb-6">
                                <Bot className="w-8 h-8 text-blue-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">The AI Swarm is Ready</h2>
                            <p className="text-slate-500 mb-8 leading-relaxed">
                                Connect with your specialized SEO agents. Ask about traffic analytics, backlink strategy,
                                indexing issues, or content optimization. The OS consolidates every learning into permanent skills.
                            </p>
                            <div className="grid grid-cols-2 gap-3 w-full">
                                {['Audit site health', 'Content gap analysis', 'Strategy roadmap', 'Optimize meta tags'].map(suggestion => (
                                    <button
                                        key={suggestion}
                                        onClick={() => setInput(suggestion)}
                                        className="px-4 py-3 rounded-2xl bg-white border border-slate-200 text-sm font-medium text-slate-600 hover:border-blue-500 hover:text-blue-600 transition-all text-left"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                                "flex gap-4 max-w-4xl",
                                msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                            )}
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                                msg.role === 'user' ? "bg-slate-900" : "bg-blue-600"
                            )}>
                                {msg.role === 'user' ? (
                                    <User className="w-5 h-5 text-white" />
                                ) : (
                                    <Bot className="w-5 h-5 text-white" />
                                )}
                            </div>

                            <div className={cn(
                                "flex flex-col gap-2",
                                msg.role === 'user' ? "items-end" : "items-start"
                            )}>
                                <div className={cn(
                                    "p-5 rounded-3xl text-sm leading-relaxed shadow-sm",
                                    msg.role === 'user'
                                        ? "bg-slate-900 text-white rounded-tr-none"
                                        : "bg-white text-slate-800 border border-slate-200 rounded-tl-none prose prose-slate max-w-none"
                                )}>
                                    {msg.role === 'assistant' ? (
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {msg.content || '...'}
                                        </ReactMarkdown>
                                    ) : (
                                        msg.content
                                    )}
                                </div>

                                {msg.role === 'assistant' && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Swarm Action</span>
                                        <div className="h-[1px] w-4 bg-slate-200" />
                                        <div className="flex gap-1">
                                            {/* We could mark which agents specifically worked on this message if we stored it */}
                                            <div className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[9px] font-bold">Consolidated</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Streaming Status Indicator */}
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-4 space-y-4"
                    >
                        <div className="flex items-center gap-6 px-6 py-3 rounded-full bg-white border border-slate-100 shadow-xl shadow-slate-200/20">
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                                <span className="text-xs font-semibold text-slate-600">{currentStatus}</span>
                            </div>

                            <div className="h-4 w-[1px] bg-slate-200" />

                            <div className="flex gap-2">
                                {activeAgents.map(agent => (
                                    <div
                                        key={agent}
                                        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-50 text-blue-600 font-bold text-[9px] border border-blue-100/50"
                                    >
                                        {AGENT_ICONS[agent]}
                                        {agent}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white border-t border-slate-200">
                <form
                    onSubmit={handleSubmit}
                    className="max-w-4xl mx-auto relative group"
                >
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                        <Sparkles className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>

                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isLoading}
                        placeholder="Ask the swarm anything..."
                        className="w-full h-14 pl-14 pr-32 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 rounded-2xl text-sm transition-all outline-none"
                    />

                    <div className="absolute inset-y-2 right-2 flex gap-2">
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="h-10 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:bg-slate-400 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                        >
                            <Send className="w-3.5 h-3.5" />
                            <span>Send Query</span>
                        </button>
                    </div>
                </form>
                <p className="text-center text-[10px] text-slate-400 mt-4 tracking-tight">
                    AI SEO OS v1.0 • Multi-Agent Swarm • Real-time Institutional Memory Sync Enabled
                </p>
            </div>
        </div>
    );
}
