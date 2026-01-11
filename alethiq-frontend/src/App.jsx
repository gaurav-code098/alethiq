import React, { useState, useRef, useEffect, useMemo, createContext, useContext } from "react";
import { useStream } from "./hooks/useStream";
import { useTypewriter } from "./hooks/useTypewriter";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import remarkGfm from "remark-gfm"; 
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'; 
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'; 
import { 
  Search, ArrowRight, Layers, Plus, Sparkles, 
  BrainCircuit, Copy, Check, PanelLeftClose, PanelLeftOpen, 
  LogIn, LogOut, User, X, MessageSquare, History, RefreshCw, Square
} from "lucide-react";

// Widgets
import StatCard from "./components/widgets/StatCard";
import ImageGrid from "./components/widgets/ImageGrid";

// --- AUTH CONTEXT ---
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("alethiq_token"));
  const [loading, setLoading] = useState(true);

  // 🔴 JAVA BACKEND (Render)
  const API_BASE = "https://alethiq.onrender.com";

  useEffect(() => {
    const initAuth = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = urlParams.get("token");

      if (tokenFromUrl) {
          localStorage.setItem("alethiq_token", tokenFromUrl);
          setToken(tokenFromUrl);
          window.history.replaceState({}, document.title, "/");
      }

      const storedToken = tokenFromUrl || localStorage.getItem("alethiq_token");
       
      if (!storedToken || storedToken === "null") {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${storedToken}` }
        });
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          setToken(storedToken);
        } else {
          logout();
        }
      } catch (e) {
        console.error("Auth check failed", e);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const loginWithEmail = async (email, password, isSignUp, username) => {
    const endpoint = isSignUp ? "/api/auth/register" : "/api/auth/login";
    const body = isSignUp ? { username, email, password } : { username, password }; 

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        const newToken = await res.text();
        localStorage.setItem("alethiq_token", newToken);
        setToken(newToken);
        const meRes = await fetch(`${API_BASE}/api/auth/me`, {
            headers: { Authorization: `Bearer ${newToken}` }
        });
        if(meRes.ok) setUser(await meRes.json());
        else setUser({ username: username, email: email || "" });
        return { success: true };
      } else { 
        const msg = await res.text();
        alert("Auth failed: " + msg); 
        return { success: false };
      }
    } catch (e) { 
      return { success: false };
    }
  };

  const logout = () => {
    localStorage.removeItem("alethiq_token");
    setToken(null);
    setUser(null);
  };
   
  return (
    <AuthContext.Provider value={{ user, token, loginWithEmail, logout, loading, API_BASE }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

// --- HELPER COMPONENTS ---

const HeaderProfile = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;
  const displayName = user.username.split('_')[0];

  return (
    <div className="absolute top-6 right-6 z-50">
        <button 
            onClick={() => setIsOpen(!isOpen)}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all group shadow-2xl"
        >
            <div className="w-8 h-8 rounded-full bg-teal-900/30 flex items-center justify-center border border-teal-500/20 text-teal-400 text-sm font-bold">
                {displayName?.[0]?.toUpperCase() || <User size={14}/>}
            </div>
        </button>
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute top-full right-0 mt-3 w-56 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl"
                >
                    <div className="px-5 py-4 border-b border-white/5">
                        <p className="text-sm text-white font-medium">{displayName}</p>
                        <p className="text-xs text-zinc-500 mt-0.5 truncate">{user.email}</p>
                    </div>
                    <button 
                        onClick={logout} 
                        className="w-full flex items-center gap-3 px-5 py-3 text-xs text-red-400/80 hover:text-red-400 hover:bg-red-500/5 transition-colors"
                    >
                        <LogOut size={14} /> Sign Out
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
};

const AuthCard = ({ onClose }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { loginWithEmail, API_BASE } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await loginWithEmail(email, password, isSignUp, username);
    if (res.success) onClose();
  };

  return (
    <div className="w-full max-w-md p-8 bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl relative">
      <button onClick={onClose} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"><X size={20} /></button>
      <div className="flex flex-col items-center gap-2 mb-8 text-center">
        <h1 className="text-2xl font-semibold text-white">{isSignUp ? "Create account" : "Welcome back"}</h1>
        <p className="text-zinc-500 text-sm">{isSignUp ? "Join the Alethiq network" : "Sign in to your account"}</p>
      </div>
      <a href={`${API_BASE}/oauth2/authorization/google`} className="w-full flex items-center justify-center gap-3 py-3 bg-white text-black rounded-xl font-semibold hover:bg-zinc-200 transition-all mb-4 text-sm">
        <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="G" /> Continue with Google
      </a>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" placeholder={isSignUp ? "Username" : "Username or Email"} required className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-white outline-none" onChange={(e) => setUsername(e.target.value)} />
        {isSignUp && <input type="email" placeholder="Email Address" required className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-white outline-none" onChange={(e) => setEmail(e.target.value)} />}
        <input type="password" placeholder="Password" required className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-white outline-none" onChange={(e) => setPassword(e.target.value)} />
        <button type="submit" className="w-full py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-all mt-4">{isSignUp ? "Create Account" : "Sign In"}</button>
      </form>
      <p className="text-center mt-8 text-sm text-zinc-500">{isSignUp ? "Already have an account?" : "Don't have an account?"} <button onClick={() => setIsSignUp(!isSignUp)} className="text-white hover:underline underline-offset-4">{isSignUp ? "Sign In" : "Sign Up"}</button></p>
    </div>
  );
};

// --- MARKDOWN & UI COMPONENTS ---

const MarkdownComponents = { 
  h1: ({node, ...props}) => <h1 className="text-2xl md:text-3xl font-normal text-white mt-8 mb-4 tracking-tight font-display" {...props} />, 
  h2: ({node, ...props}) => <h2 className="text-lg md:text-xl font-normal text-zinc-200 mt-6 mb-3 tracking-wide flex items-center gap-2" {...props}><div className="w-1 h-5 bg-teal-500/50 rounded-full" />{props.children}</h2>, 
  p: ({node, children, ...props}) => <p className="text-zinc-300 leading-7 mb-4 text-[15px] md:text-[16px] font-normal tracking-wide">{children}</p>, 
  a: ({node, ...props}) => <a className="text-teal-400 hover:text-teal-300 underline decoration-teal-500/30 underline-offset-4 transition-colors" {...props} />, 
  ul: ({node, ...props}) => <ul className="space-y-2 mb-6 text-zinc-300 pl-2" {...props} />, 
  li: ({node, ...props}) => <li className="flex gap-3 items-start"><span className="mt-2 w-1.5 h-1.5 rounded-full bg-teal-500/50 flex-shrink-0" /><span className="flex-1 leading-7">{props.children}</span></li>, 
  code: ({node, inline, className, children, ...props}) => { const match = /language-(\w+)/.exec(className || ''); return !inline && match ? ( <div className="rounded-xl overflow-hidden my-6 border border-white/10 shadow-2xl bg-[#1e1e1e] text-sm md:text-base"> <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" customStyle={{ margin: 0, padding: '1.25rem', background: 'transparent' }} wrapLongLines={true} {...props}>{String(children).replace(/\n$/, '')}</SyntaxHighlighter> </div> ) : <code className="bg-white/10 text-teal-300 rounded px-1.5 py-0.5 text-xs md:text-sm font-mono border border-white/5" {...props}>{children}</code>; } 
};

const AnswerSection = ({ data, isTyping, status }) => { 
  const [copied, setCopied] = useState(false); 
  const contentParts = useMemo(() => {
    if (!data) return [];
    const parts = data.split(/:::stat-card\s*(\{.*?\})\s*:::/gs);
    const mappedParts = [];
    let cardCount = 0; 
    parts.forEach((part, index) => {
        if (index % 2 === 0) { if (part.trim()) mappedParts.push({ type: 'text', content: part }); } 
        else {
            try {
                const widgetData = JSON.parse(part);
                if (cardCount < 1) { mappedParts.push({ type: 'stat-card', data: widgetData }); cardCount++; }
            } catch (e) {}
        }
    });
    return mappedParts;
  }, [data]);

  const handleCopy = async () => { await navigator.clipboard.writeText(data.replace(/:::.*?:::/gs, '')); setCopied(true); setTimeout(() => setCopied(false), 2000); }; 
   
  return ( 
    <div className="relative group/answer"> 
      <div className="flex items-center gap-3 mb-4 md:mb-6 min-h-[24px]"> {isTyping ? ( <> <BrainCircuit className="w-4 h-4 md:w-5 md:h-5 text-teal-400 animate-pulse" /> <span className="text-xs md:text-sm font-mono tracking-widest uppercase text-teal-400/90 animate-pulse">{status || "Processing"}</span> </> ) : <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-zinc-700" />} </div> 
      <div className="prose prose-invert max-w-none prose-p:text-zinc-300"> 
        {contentParts.map((part, idx) => ( 
            <React.Fragment key={idx}> 
                {part.type === 'text' && <ReactMarkdown components={MarkdownComponents} remarkPlugins={[remarkGfm]}>{part.content}</ReactMarkdown>} 
                {part.type === 'stat-card' && ( <div className="my-6 animate-in fade-in slide-in-from-bottom-6 duration-700"> <StatCard title="Key Insight" data={part.data} /> </div> )} 
            </React.Fragment> 
        ))} 
      </div> 
      {!isTyping && data && ( <div className="mt-8 pt-4 border-t border-white/5 flex justify-end opacity-0 group-hover/answer:opacity-100 transition-opacity duration-300"> <button onClick={handleCopy} className="flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-teal-400 transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg border border-white/5"> {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? "Copied" : "Copy"} </button> </div> )} 
    </div> 
  ); 
};

const ContentBlock = ({ data, sources, images, isTyping, status, onRelatedClick }) => { 
  const [cleanAnswer, relatedQuestions] = useMemo(() => { if (!data) return ["", []]; const parts = data.split("|||"); return [parts[0], parts.slice(1).map(q => q.trim()).filter(q => q.length > 5)]; }, [data]); 
  const displayData = isTyping ? useTypewriter(cleanAnswer, 0.5) : cleanAnswer; 
  return ( 
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out mb-24 md:mb-32"> 
      {!isTyping && images && images.length > 0 && <ImageGrid images={images} />} 
      {sources && sources.length > 0 && <SourcesGrid sources={sources} />} 
      <AnswerSection data={displayData} isTyping={isTyping} status={status} /> 
      {!isTyping && relatedQuestions.length > 0 && ( <div className="mt-8 pt-8 border-t border-white/[0.05]"> <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-600 mb-6 flex items-center gap-2"><Layers className="w-3 h-3" /> Explore Further</h3> <div className="flex flex-col gap-2"> {relatedQuestions.map((q, i) => ( <motion.button key={i} onClick={() => onRelatedClick(q)} whileHover={{ x: 4, backgroundColor: "rgba(255, 255, 255, 0.03)" }} className="group flex items-center justify-between w-full p-4 text-left rounded-xl border border-white/5 bg-white/[0.01] hover:border-white/10 transition-all"> <span className="text-zinc-400 group-hover:text-zinc-200 font-light text-sm tracking-wide line-clamp-1">{q}</span> <ArrowRight className="w-3 h-3 text-zinc-700 group-hover:text-teal-400 transition-colors opacity-0 group-hover:opacity-100" /> </motion.button> ))} </div> </div> )} 
    </div> 
  ); 
};

const SearchForm = ({ fixed = false, query, setQuery, handleSearch, isStreaming, stopStream, hasHistory, isSidebarOpen }) => {
    return (
        <div className={`w-full transition-all duration-300 ${fixed ? `fixed bottom-6 left-0 flex justify-center z-40 px-4 ${isSidebarOpen ? 'md:pl-[260px]' : 'md:pl-0'}` : ""}`}>
            <div className={`w-full max-w-3xl transition-all relative group`}>
                <form onSubmit={(e) => { e.preventDefault(); handleSearch(query); }} className={`relative flex items-center rounded-3xl transition-all duration-300 ${fixed ? "bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 p-2 shadow-2xl" : "bg-white/[0.03] border border-white/5 hover:border-white/10 hover:bg-white/[0.05] px-5 py-3 shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)]"}`}>
                    <div className={`flex items-center w-full ${fixed ? "pl-3" : ""}`}>
                        {!fixed && <Search className="w-4 h-4 text-zinc-500 mr-4 opacity-50" />}
                        <input className={`w-full bg-transparent text-zinc-200 outline-none font-light placeholder:text-zinc-600/70 tracking-wide ${fixed ? "text-base h-10" : "text-sm md:text-base h-8"}`} placeholder={fixed ? "Ask a follow-up..." : "What do you want to discover?"} value={query} onChange={(e) => setQuery(e.target.value)} autoFocus={!hasHistory} />
                        <div className="ml-1 flex items-center justify-center pl-3">
                            {isStreaming ? ( <button type="button" onClick={stopStream} className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300"> <Square size={12} fill="currentColor" /> </button> ) : ( <button type="submit" disabled={!query.trim()} className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-600 hover:text-zinc-200 hover:bg-white/10 transition-all duration-300 disabled:opacity-0 disabled:hover:bg-transparent"> <ArrowRight size={16} /> </button> )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- MAIN APP ---
function App() {
  const [query, setQuery] = useState("");
  const [chatHistory, setChatHistory] = useState([]); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true); 
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [threads, setThreads] = useState([]);
  const messagesEndRef = useRef(null);
  const mainScrollRef = useRef(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  
  // 🟢 1. NEW STATE: Track the question being asked
  const [lastQuery, setLastQuery] = useState("");
   
  const { user, token, API_BASE } = useAuth();
  const { data, sources, images, status, isStreaming, streamData, stopStream } = useStream();

  const SUGGESTIONS_URL = "https://gaurav-code098-alethiq.hf.space";

  useEffect(() => {
    const checkMobile = () => { const mobile = window.innerWidth < 768; setIsMobile(mobile); setIsSidebarOpen(!mobile); };
    checkMobile(); window.addEventListener('resize', checkMobile); return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchHistory = () => {
    if (user && user.username && token) {
      fetch(`${API_BASE}/api/chat/user/${user.username}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setThreads(data.reverse()); else setThreads([]); })
      .catch(err => console.error("History fetch error:", err));
    }
  };

  useEffect(() => { fetchHistory(); }, [user, token, API_BASE]);

  const handleLoadThread = (thread) => {
    setChatHistory([]); 
    const formattedMessages = thread.messages.map(msg => ({
      type: msg.role === "USER" ? "user" : "ai",
      content: msg.content
    }));
    setChatHistory(formattedMessages);
    if(isMobile) setIsSidebarOpen(false);
  };

  useEffect(() => {
    const fetchSuggestions = async () => {
        try {
            const res = await fetch(`${SUGGESTIONS_URL}/get-suggestions?t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                setSuggestions(data);
            } else { throw new Error("Failed to fetch suggestions"); }
        } catch (e) {
            const fallback = ["James Webb Telescope", "Generative UI Design", "Terraforming Mars", "6G Networks"];
            setSuggestions(fallback.sort(() => 0.5 - Math.random()).slice(0, 4));
        } finally { setLoadingSuggestions(false); }
    };
    fetchSuggestions();
  }, []); 

  // 🟢 2. NEW FUNCTION: Save to Java Backend
  const saveToHistory = async (userQ, aiA) => {
    if (!user || !token) return;
    try {
        // NOTE: Ensure your Java Backend has an endpoint that matches this logic!
        // If you don't have '/save', we can try using '/new' logic if needed, 
        // but adding a simple save endpoint to Java is best.
        await fetch(`${API_BASE}/api/chat/save-conversation`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ username: user.username, query: userQ, answer: aiA, sources: sources || [] })
        });
        fetchHistory(); // Refresh Sidebar
    } catch (e) { console.error("Failed to save history:", e); }
  };

  const handleScroll = (e) => {
      const { scrollTop, scrollHeight, clientHeight } = e.target;
      if (scrollHeight - scrollTop - clientHeight > 50) setAutoScroll(false);
      else setAutoScroll(true);
  };

  useEffect(() => {
    if (isStreaming && autoScroll && messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: "auto" }); 
  }, [data, isStreaming, autoScroll]);

  const handleSearch = (searchQuery) => {
    if (!searchQuery?.trim()) return;
    const currentHistory = [...chatHistory];
    
    setChatHistory(prev => [...prev, { type: 'user', content: searchQuery }]);
    setQuery(""); 
    setLastQuery(searchQuery); // 🟢 3. Remember the query
    setAutoScroll(true); 
    
    streamData(searchQuery, "fast", currentHistory);
  };

  const handleNewChat = () => { setChatHistory([]); setQuery(""); stopStream(); };

  // 🟢 4. TRIGGER SAVE WHEN STREAM ENDS
  const prevStreaming = useRef(false);
  useEffect(() => {
    // If stream just stopped AND we have data...
    if (prevStreaming.current && !isStreaming && data) {
        setChatHistory(prev => [...prev, { type: 'ai', content: data, sources, images }]);
        
        // Save to Java
        if (user && lastQuery) {
            saveToHistory(lastQuery, data);
        }
    }
    prevStreaming.current = isStreaming;
  }, [isStreaming, data, sources, images, user, token, API_BASE]);

  const hasHistory = chatHistory.length > 0;

  return (
    <div className="min-h-screen w-full bg-[#020202] text-zinc-100 flex overflow-hidden relative antialiased selection:bg-teal-500/20 selection:text-teal-200">
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-lg p-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
                <AuthCard onClose={() => setShowAuthModal(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.div animate={{ width: isSidebarOpen ? 260 : 0, opacity: isSidebarOpen ? 1 : 0 }} className={`fixed md:relative top-0 left-0 h-screen bg-[#050505] border-r border-white/5 z-50 flex flex-col overflow-hidden`}>
           <div className="w-[260px] flex flex-col h-full p-4">
              <div className="flex justify-between items-center mb-10 px-2 mt-2">
                 <div className="font-display text-lg tracking-tight flex items-center gap-2 text-zinc-100"><div className="w-2 h-2 rounded-full bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.5)]" />Alethiq</div>
                 <button onClick={() => setIsSidebarOpen(false)} className="text-zinc-600 hover:text-white transition-colors"><PanelLeftClose size={16} /></button>
              </div>
              
              <button onClick={handleNewChat} className="flex items-center gap-3 w-full bg-white/5 hover:bg-white/10 text-white rounded-xl px-4 py-3 transition-all border border-white/5 group mb-8">
                <Plus size={16} className="text-zinc-400 group-hover:text-white" /><span className="text-sm font-medium tracking-wide">New Thread</span>
              </button>

              <div className="flex-1 overflow-y-auto px-2 space-y-1">
                {user && (
                    <div className="flex items-center justify-between px-2 mb-3">
                        <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.2em]">History</span>
                        <button onClick={fetchHistory} className="text-zinc-600 hover:text-white transition-colors"><RefreshCw size={10} /></button>
                    </div>
                )}
                {!user ? (
                   <button onClick={() => setShowAuthModal(true)} className="flex items-center gap-3 w-full bg-teal-900/10 hover:bg-teal-900/20 text-teal-400 rounded-xl px-4 py-3 border border-teal-500/10 transition-all text-sm font-medium"> <LogIn size={16} /> <span className="opacity-80">Sign In / Sign Up</span> </button>
                ) : (
                    threads.length > 0 ? (
                        threads.map((thread) => {
                            let cleanTitle = thread.title;
                            try { const parsed = JSON.parse(thread.title); if (parsed.query) cleanTitle = parsed.query; } catch (e) { }
                            return (
                                <button key={thread.id} onClick={() => handleLoadThread(thread)} className="w-full text-left p-3 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-zinc-200 transition-colors text-xs truncate flex items-center gap-3 group"> <MessageSquare size={14} className="text-zinc-700 group-hover:text-zinc-400 transition-colors" /> <span className="truncate">{cleanTitle || "Untitled Chat"}</span> </button>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center pt-24 opacity-30"> <History className="w-6 h-6 text-zinc-500 mb-3" /> <p className="text-zinc-500 text-[10px] text-center font-mono">NO HISTORY</p> </div>
                    )
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-white/5 text-[10px] text-zinc-700 text-center font-mono tracking-[0.2em] opacity-50">v2.0</div>
           </div>
        </motion.div>

        <div ref={mainScrollRef} onScroll={handleScroll} className="flex-1 flex flex-col h-screen relative w-full overflow-y-auto scroll-smooth bg-[#020202]">
           <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-30 pointer-events-none">
                <div className="pointer-events-auto">
                    {!isSidebarOpen && ( <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-transparent text-zinc-600 hover:text-white transition-colors"><PanelLeftOpen size={20} /></button> )}
                </div>
                <div className="pointer-events-auto">
                    {!user && !isSidebarOpen && ( <button onClick={() => setShowAuthModal(true)} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs text-zinc-300 hover:text-white hover:bg-white/10 transition-all font-mono tracking-wide"><LogIn size={12} /> ACCESS</button> )}
                    {user && <HeaderProfile />}
                </div>
           </div>

           {!hasHistory && (
             <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.01] rounded-full blur-[120px] pointer-events-none" />
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, ease: "easeOut" }} className="w-full max-w-3xl flex flex-col items-center text-center z-10">
                    <div className="mb-12 flex flex-col items-center">
                      <motion.h1 initial={{ letterSpacing: "0.1em", opacity: 0, y: 20 }} animate={{ letterSpacing: "0.2em", opacity: 1, y: 0 }} transition={{ duration: 1, ease: "easeOut" }} className="text-6xl md:text-8xl font-light tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-400 to-zinc-800 font-sans mb-6 select-none"> ALETHIQ </motion.h1>
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 1 }} className="text-[10px] md:text-xs text-zinc-600 font-mono tracking-[0.4em] uppercase"> Intelligence  Search Engine </motion.p>
                    </div>
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 0.6 }} className="w-full mb-12"> <SearchForm fixed={false} query={query} setQuery={setQuery} handleSearch={handleSearch} isStreaming={isStreaming} stopStream={stopStream} hasHistory={hasHistory} isSidebarOpen={isSidebarOpen} /> </motion.div>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 1 }} className="flex flex-wrap justify-center gap-3"> {loadingSuggestions ? [...Array(4)].map((_, i) => <div key={i} className="h-6 w-24 bg-white/5 animate-pulse rounded-full" />) : suggestions.map((s, i) => ( <button key={i} onClick={() => handleSearch(s)} className="text-[10px] text-zinc-500 hover:text-zinc-300 border border-white/5 hover:border-white/20 px-3 py-1.5 rounded-full transition-all uppercase tracking-wider font-mono hover:bg-white/[0.02]"> {s} </button> )) } </motion.div>
                </motion.div>
             </div>
           )}

           {hasHistory && (
             <div className="w-full max-w-3xl mx-auto px-4 md:px-6 pt-32 pb-48">
               <div className="space-y-20">
                 {chatHistory.map((msg, idx) => (
                   <div key={idx} className="group">
                       {msg.type === 'user' ? ( <h2 className="text-2xl md:text-4xl font-light text-white/90 tracking-tight mb-8 leading-snug">{msg.content}</h2> ) : ( <ContentBlock data={msg.content} sources={msg.sources} images={msg.images} isTyping={false} onRelatedClick={handleSearch} /> )}
                   </div>
                 ))}
                 {isStreaming && <ContentBlock data={data} sources={sources} images={images} isTyping={true} status={status} onRelatedClick={handleSearch} />}
                 <div ref={messagesEndRef} className="h-4" />
               </div>
               <SearchForm fixed={true} query={query} setQuery={setQuery} handleSearch={handleSearch} isStreaming={isStreaming} stopStream={stopStream} hasHistory={hasHistory} isSidebarOpen={isSidebarOpen} />
             </div>
           )}
        </div>
      </div>
  );
}

const RootApp = () => ( <AuthProvider> <App /> </AuthProvider> );

export default RootApp;
