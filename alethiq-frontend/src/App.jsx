import React, { useState, useRef, useEffect, useMemo, createContext, useContext, useCallback } from "react";
import { useStream } from "./hooks/useStream";
import { useTypewriter } from "./hooks/useTypewriter";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import remarkGfm from "remark-gfm"; 
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'; 
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'; 
import { 
  ArrowRight, ArrowUp, ArrowDown, Plus, 
  PanelLeftClose, PanelLeftOpen, LogIn, LogOut, User, X, MessageSquare, History, RefreshCw, Square,
  Paperclip, Image as ImageIcon, ScanEye, BookOpen, BarChart3, Menu, Lightbulb, Zap, Globe, Code,
  Layers 
} from "lucide-react";

// Widgets
import StatCard from "./components/widgets/StatCard";
import ImageGrid from "./components/widgets/ImageGrid";

// --- 0. GLOBAL STYLES ---
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&family=Playfair+Display:wght@400;500;600&display=swap');
    
    .font-serif { font-family: 'Playfair Display', serif; }
    .font-display { font-family: 'Inter', sans-serif; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
    
    /* Scrollbar */
    @media (min-width: 768px) {
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #555; }
    }
    
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
    
    /* Mobile Touch Fixes */
    input, textarea, button, select, a { -webkit-tap-highlight-color: transparent; }
  `}</style>
);

// --- 1. VISUAL: DARK AURORA BACKGROUND (Green/Teal - Mobile Optimized) ---
const AlethiqBackground = () => {
  return (
    <div className="fixed inset-0 w-full h-full -z-50 bg-[#09090b] overflow-hidden pointer-events-none">
      {/* 🟢 TOP RIGHT */}
      <div className="absolute top-[-5%] right-[-10%] w-[300px] md:w-[1000px] h-[300px] md:h-[1000px] rounded-full opacity-30 mix-blend-screen filter blur-[60px] md:blur-[100px] animate-pulse" 
           style={{ background: "radial-gradient(circle, rgba(45, 212, 191, 0.4) 0%, rgba(0,0,0,0) 70%)" }} />
      
      {/* 🟢 BOTTOM LEFT */}
      <div className="absolute bottom-[-5%] left-[-10%] w-[300px] md:w-[800px] h-[300px] md:h-[800px] rounded-full opacity-25 mix-blend-screen filter blur-[60px] md:blur-[100px]" 
           style={{ background: "radial-gradient(circle, rgba(52, 211, 153, 0.3) 0%, rgba(0,0,0,0) 70%)" }} />
      
      {/* 🟢 CENTER */}
      <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[100%] md:w-[1200px] h-[400px] md:h-[800px] rounded-full opacity-10 mix-blend-screen filter blur-[80px] md:blur-[120px]" 
           style={{ background: "radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, rgba(0,0,0,0) 70%)" }} />
           
      <div className="absolute inset-0 opacity-[0.06] mix-blend-overlay" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
    </div>
  );
};

// --- 2. CONVERSATION COMPONENT ---
const Conversation = ({ children, className }) => {
  const containerRef = useRef(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // Show button if user scrolls up significantly
      setShowScrollButton(scrollHeight - scrollTop - clientHeight > 300);
    };
    container.addEventListener('scroll', handleScroll);
    
    // Auto-scroll on mount/update if near bottom
    if (container.scrollHeight > container.clientHeight) {
        const { scrollTop, scrollHeight, clientHeight } = container;
        if (scrollHeight - scrollTop - clientHeight < 300) scrollToBottom();
    }
    
    return () => container.removeEventListener('scroll', handleScroll);
  }, [children, scrollToBottom]);

  useEffect(() => { scrollToBottom(); }, [children.length, scrollToBottom]); 

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      <div ref={containerRef} className={`flex-1 overflow-y-auto scroll-smooth w-full overflow-x-hidden ${className}`}>
        {children}
      </div>
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={scrollToBottom}
            // 🟢 Higher position on mobile to avoid search bar overlap
            className="absolute bottom-44 md:bottom-48 left-1/2 -translate-x-1/2 z-30 p-3 bg-[#1a1a1a] border border-white/10 rounded-full shadow-2xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all active:scale-95"
          >
            <ArrowDown size={20} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- 3. PERSONA COMPONENT ---
const Persona = () => {
  return (
    <div className="flex flex-col items-center justify-center mb-8 md:mb-10 w-full px-4">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="relative mb-8 px-5 py-2.5 bg-[#121212] border border-white/10 rounded-2xl shadow-xl backdrop-blur-md"
      >
        <span className="text-sm font-light text-gray-200 tracking-wide">How can I help you today?</span>
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#121212] border-b border-r border-white/10 transform rotate-45"></div>
      </motion.div>
      
      {/* Flashy Natural Orb */}
      <div className="relative group">
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[80%] h-[80%] bg-teal-500/20 rounded-full blur-[40px] opacity-60 group-hover:opacity-80 transition-opacity duration-1000" />
        <div className="relative w-24 h-24 rounded-full bg-gradient-to-b from-[#1a1a1a] to-black border border-white/10 flex items-center justify-center overflow-hidden transition-transform duration-700 ease-out group-hover:scale-105 shadow-[0_0_50px_-10px_rgba(20,184,166,0.3)]">
          <div className="absolute top-[-10%] left-[15%] w-[70%] h-[45%] bg-gradient-to-b from-white/15 to-transparent blur-[2px] rounded-full opacity-80" />
          <div className="absolute bottom-[-10%] left-[10%] w-[80%] h-[60%] rounded-full bg-teal-500/30 blur-xl animate-pulse" />
          <div className="absolute inset-0 opacity-20" style={{ background: 'conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(255,255,255,0.1) 180deg, transparent 360deg)' }} />
          <div className="absolute inset-0 rounded-full shadow-[inset_0_0_15px_rgba(0,0,0,0.9),_inset_0_1px_1px_rgba(255,255,255,0.15)]" />
        </div>
      </div>
    </div>
  );
};

// --- AUTH CONTEXT ---
const AuthContext = createContext();
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("alethiq_token"));
  const [loading, setLoading] = useState(true);
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
      if (!storedToken || storedToken === "null") { setLoading(false); return; }
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${storedToken}` } });
        if (res.ok) { setUser(await res.json()); setToken(storedToken); } else { logout(); }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    initAuth();
  }, []);

  const loginWithEmail = async (email, password, isSignUp, username) => {
    const endpoint = isSignUp ? "/api/auth/register" : "/api/auth/login";
    const body = isSignUp ? { username, email, password } : { username, password }; 
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) {
        const newToken = await res.text();
        localStorage.setItem("alethiq_token", newToken);
        setToken(newToken);
        const meRes = await fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${newToken}` } });
        if(meRes.ok) { setUser(await meRes.json()); return { success: true }; } 
        else { logout(); return { success: false }; }
      } else { alert("Auth failed: " + await res.text()); return { success: false }; }
    } catch (e) { return { success: false }; }
  };

  const logout = () => { localStorage.removeItem("alethiq_token"); setToken(null); setUser(null); };
  return <AuthContext.Provider value={{ user, token, loginWithEmail, logout, loading, API_BASE }}>{!loading && children}</AuthContext.Provider>;
};
export const useAuth = () => useContext(AuthContext);

// --- HELPER COMPONENTS ---
const SimpleSparkline = ({ data, color }) => {
  if (!data || data.length < 2) return null;
  const width = 300; const height = 60;
  const values = typeof data[0] === 'object' ? data.map(d => d.price) : data;
  const max = Math.max(...values); const min = Math.min(...values); const range = max - min || 1; 
  const points = values.map((price, index) => { const x = (index / (values.length - 1)) * width; const y = height - ((price - min) / range) * height; return `${x},${y}`; }).join(' ');
  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
      <defs><linearGradient id={`gradient-${color}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.3" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <path d={`M0,${height} L${points} L${width},${height} Z`} fill={`url(#gradient-${color})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
};

const StockCard = ({ data }) => {
  const price = data.price || data.current_price;
  const symbol = data.symbol || data.entity || "STOCK";
  const currency = data.currency || "USD";
  const change = data.change || "0%";
  const history = data.history || data.graph_points || []; 
  const isPositive = change.includes('+') || (typeof change === 'number' && change > 0);
  const color = isPositive ? '#10b981' : '#ef4444'; 
  return (
    <div className="my-4 md:my-6 p-4 md:p-5 bg-[#121212] rounded-xl border border-white/5 shadow-sm w-full md:max-w-sm overflow-hidden relative group">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex justify-between items-start mb-4">
        <div><h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest font-mono">{symbol}</h3><div className="flex items-baseline gap-2 mt-1"><span className="text-2xl font-bold text-white tracking-tight">{currency === 'USD' ? '$' : ''}{price}</span><span className="text-sm font-medium flex items-center gap-1" style={{ color }}>{isPositive ? "▲" : "▼"}{change}</span></div></div>
      </div>
      {history.length > 0 && <div className="h-16 w-full mt-2"><SimpleSparkline data={history} color={color} /></div>}
      <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-white/5"><div><p className="text-[10px] text-zinc-500 uppercase">Mkt Cap</p><p className="text-xs text-zinc-300">{data.market_cap || data.marketCap || 'N/A'}</p></div><div className="text-right"><p className="text-[10px] text-zinc-500 uppercase">P/E Ratio</p><p className="text-xs text-zinc-300">{data.pe_ratio || data.peRatio || 'N/A'}</p></div></div>
    </div>
  );
};

const HeaderProfile = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  if (!user) return null;
  const displayName = user.username.split('_')[0];
  return (
    <div className="relative z-50">
        <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-3 p-1.5 pr-4 rounded-full bg-zinc-900/80 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all shadow-sm group">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#14b8a6] to-teal-200 flex items-center justify-center text-white text-[10px] font-bold shadow-inner group-hover:scale-105 transition-transform">
                {displayName?.[0]?.toUpperCase() || <User size={12}/>}
            </div>
            <span className="text-xs font-medium text-zinc-300">{displayName}</span>
        </button>
        <AnimatePresence>
            {isOpen && (<motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} className="absolute top-full right-0 mt-3 w-48 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl overflow-hidden"><button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-xs text-red-400 hover:bg-white/5 transition-colors"><LogOut size={14} /> Sign Out</button></motion.div>)}
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
  const handleSubmit = async (e) => { e.preventDefault(); const res = await loginWithEmail(email, password, isSignUp, username); if (res.success) onClose(); };
  return (
    <div className="w-full max-w-md p-6 md:p-8 bg-[#09090b] border border-white/10 rounded-3xl shadow-2xl relative mx-4">
      <button onClick={onClose} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"><X size={20} /></button>
      <div className="flex flex-col items-center gap-2 mb-8 text-center"><h1 className="text-2xl font-serif text-white">{isSignUp ? "Create account" : "Welcome back"}</h1><p className="text-zinc-500 text-sm font-display">{isSignUp ? "Join the Alethiq network" : "Sign in to your account"}</p></div>
      <a href={`${API_BASE}/oauth2/authorization/google`} className="w-full flex items-center justify-center gap-3 py-3 bg-white text-black rounded-xl font-semibold hover:bg-zinc-200 transition-all mb-4 text-sm"><img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="G" /> Continue with Google</a>
      <div className="flex items-center gap-4 mb-4 w-full"> <div className="h-px bg-white/10 flex-1" /> <span className="text-xs text-zinc-600 uppercase">Or with email</span> <div className="h-px bg-white/10 flex-1" /> </div>
      <form onSubmit={handleSubmit} className="space-y-4"><input type="text" placeholder={isSignUp ? "Username" : "Username or Email"} required className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-teal-500/50 transition-all" onChange={(e) => setUsername(e.target.value)} />{isSignUp && <input type="email" placeholder="Email Address" required className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-teal-500/50 transition-all" onChange={(e) => setEmail(e.target.value)} />}<input type="password" placeholder="Password" required className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-teal-500/50 transition-all" onChange={(e) => setPassword(e.target.value)} /><button type="submit" className="w-full py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-all mt-4">{isSignUp ? "Create Account" : "Sign In"}</button></form>
      <p className="text-center mt-8 text-sm text-zinc-500">{isSignUp ? "Already have an account?" : "Don't have an account?"} <button onClick={() => setIsSignUp(!isSignUp)} className="text-white hover:underline underline-offset-4">{isSignUp ? "Sign In" : "Sign Up"}</button></p>
    </div>
  );
};

// 🟢 MARKDOWN COMPONENTS (Fixed Overflow)
const MarkdownComponents = { 
  h1: ({node, ...props}) => <h1 className="text-2xl md:text-3xl lg:text-4xl font-serif text-gray-100 mt-8 mb-4 break-words" {...props} />, 
  h2: ({node, ...props}) => <h2 className="text-lg md:text-xl lg:text-2xl font-serif text-zinc-200 mt-6 mb-3 flex items-center gap-2 break-words" {...props}><div className="w-1 h-5 md:h-6 bg-teal-500 rounded-full" />{props.children}</h2>, 
  h3: ({node, ...props}) => <h3 className="text-base md:text-lg lg:text-xl font-display font-semibold text-zinc-200 mt-5 mb-2 break-words" {...props} />,
  // 🟢 Fixed Paragraphs: break-words & w-full prevents overflow
  p: ({node, children, ...props}) => <p className="text-zinc-300 leading-relaxed mb-4 text-[15px] md:text-[16px] font-display break-words w-full" {...props}>{children}</p>, 
  // 🟢 Links must break all
  a: ({node, ...props}) => <a className="text-teal-400 hover:text-teal-300 underline decoration-teal-500/30 underline-offset-4 transition-colors break-all" {...props} />, 
  ul: ({node, ...props}) => <ul className="space-y-2 mb-6 text-zinc-300 pl-4 list-disc marker:text-teal-500 break-words" {...props} />, 
  li: ({node, ...props}) => <li className="pl-1 leading-relaxed break-words">{props.children}</li>, 
  
  // 🟢 Table: Strict Container
  table: ({node, ...props}) => (
    <div className="my-8 w-full max-w-[85vw] md:max-w-full overflow-hidden border border-white/10 rounded-xl bg-[#121212] shadow-md">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm" {...props} />
      </div>
    </div>
  ),
  thead: ({node, ...props}) => <thead className="bg-white/[0.03] border-b border-white/10 text-zinc-400 font-semibold" {...props} />, 
  tbody: ({node, ...props}) => <tbody className="divide-y divide-white/5" {...props} />, 
  th: ({node, ...props}) => <th className="px-4 py-3 text-[11px] uppercase tracking-wider whitespace-nowrap text-teal-500/80" {...props} />, 
  tr: ({node, ...props}) => <tr className="group hover:bg-white/[0.02] transition-colors" {...props} />, 
  td: ({node, ...props}) => <td className="px-4 py-3 text-zinc-300 font-light border-r border-white/5 last:border-r-0" {...props} />, 

  // 🟢 Code Block: Max width constraint for mobile
  code: ({node, inline, className, children, ...props}) => { 
      const match = /language-(\w+)/.exec(className || ''); 
      return !inline && match ? ( 
          <div className="rounded-xl overflow-hidden my-6 border border-white/10 shadow-lg bg-[#1e1e1e] text-sm md:text-base w-full max-w-[85vw] md:max-w-full overflow-x-auto"> 
              <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" customStyle={{ margin: 0, padding: '1.25rem', background: 'transparent' }} wrapLongLines={false} {...props}>
                  {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter> 
          </div> 
      ) : (
          <code className="bg-white/10 text-teal-300 rounded px-1.5 py-0.5 text-xs md:text-sm font-mono border border-white/5 break-all" {...props}>{children}</code>
      ); 
  } 
};

// 🟢 SOURCES GRID (Edge-to-Edge)
const SourcesGrid = ({ sources }) => { 
  if (!sources || sources.length === 0) return null; 
  return ( 
    // Negative margin on mobile (-mx-4) to bleed to screen edge
    <div className="z-20 border-b border-white/5 py-3 md:py-4 mb-6 -mx-4 px-4 sm:px-6 lg:px-8 w-[calc(100%+2rem)] md:w-auto overflow-hidden">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 px-1">
        {sources.map((source, idx) => ( 
          <a key={idx} href={source.url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 w-60 md:w-64 group flex flex-col justify-between p-3 h-24 bg-[#121212] hover:bg-[#1a1a1a] border border-white/10 hover:border-teal-500/30 rounded-xl transition-all shadow-sm overflow-hidden cursor-pointer active:scale-95 md:active:scale-100"> 
            <div className="flex justify-between items-start"> 
              <div className="text-[10px] font-mono text-zinc-500 truncate max-w-[80%] uppercase tracking-wider group-hover:text-teal-400 transition-colors"> {new URL(source.url).hostname.replace('www.', '')} </div> 
              <div className="p-1 rounded-full bg-white/5 group-hover:bg-teal-500/10 transition-colors"> <img src={`https://www.google.com/s2/favicons?domain=${source.url}`} alt="" className="w-3 h-3 grayscale group-hover:grayscale-0 transition-all" onError={(e) => e.target.style.display='none'} /> </div> 
            </div> 
            <div className="text-xs font-medium text-zinc-300 group-hover:text-white line-clamp-2 leading-relaxed transition-colors"> {source.title || "Source Reference"} </div> 
          </a> 
        ))} 
      </div>
    </div>
  ); 
};

// 🟢 CONTENT BLOCK
const ContentBlock = ({ data, sources, images, isTyping, status, onRelatedClick }) => { 
  const [cleanAnswer, relatedQuestions] = useMemo(() => { if (!data) return ["", []]; const parts = data.split("|||"); return [parts[0], parts.slice(1).map(q => q.trim()).filter(q => q.length > 5)]; }, [data]); 
  const displayData = isTyping ? useTypewriter(cleanAnswer, 0.5) : cleanAnswer; 
  
  const contentParts = useMemo(() => {
    if (!displayData) return [];
    const parts = displayData.split(/:::stat-card\s*(\{.*?\})\s*:::/gs);
    const mappedParts = [];
    parts.forEach((part, index) => {
        if (index % 2 === 0) { if (part.trim()) mappedParts.push({ type: 'text', content: part }); } 
        else {
            try {
                const widgetData = JSON.parse(part);
                const isFinancial = widgetData.history || widgetData.graph_points;
                mappedParts.push({ type: isFinancial ? 'stock-card' : 'stat-card', data: widgetData });
            } catch (e) {}
        }
    });
    return mappedParts;
  }, [displayData]);

  return (
    <div className="w-full max-w-[900px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 relative max-w-full">
      
      {/* 1. SOURCES */}
      {sources && sources.length > 0 && <SourcesGrid sources={sources} />}

      {/* 2. MAIN ANSWER */}
      <div className="flex flex-col gap-4 md:gap-6 px-1 md:px-2 min-w-0">
        {isTyping && (
            <div className="flex items-center gap-2 mb-2 text-xs font-medium text-teal-400 uppercase tracking-wider">
                <span className="animate-pulse">{status || "Thinking"}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce"></span>
            </div>
        )}

        <div className="prose prose-lg prose-zinc dark:prose-invert max-w-none w-full break-words">
            {contentParts.map((part, idx) => (
                <React.Fragment key={idx}>
                    {part.type === 'text' && <ReactMarkdown components={MarkdownComponents} remarkPlugins={[remarkGfm]}>{part.content}</ReactMarkdown>}
                    {part.type === 'stat-card' && <div className="my-6 w-full"><StatCard title="Key Insight" data={part.data} /></div>}
                    {part.type === 'stock-card' && <div className="my-6 w-full"><StockCard data={part.data} /></div>}
                </React.Fragment>
            ))}
        </div>

        {!isTyping && images && images.length > 0 && <ImageGrid images={images} />}

        {/* 3. RELATED QUESTIONS */}
        {!isTyping && relatedQuestions.length > 0 && (
            <div className="mt-8 md:mt-10 pt-6 border-t border-white/5">
                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Layers size={12}/> Explore Further</h4>
                <div className="flex flex-col gap-2">
                    {relatedQuestions.slice(0, 5).map((q, i) => (
                        <button key={i} onClick={() => onRelatedClick(q)} className="w-full flex items-center justify-between p-3 md:p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-teal-500/20 transition-all group text-left active:scale-[0.99]">
                            <span className="text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors font-medium break-words pr-2">{q}</span>
                            <ArrowRight size={14} className="text-zinc-600 group-hover:text-teal-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0" />
                        </button>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

// SEARCH FORM
const SearchForm = ({ fixed = false, query, setQuery, handleSearch, isStreaming, stopStream, hasHistory, isSidebarOpen }) => {
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const [selectedImages, setSelectedImages] = useState([]);

    const handleInput = (e) => {
        setQuery(e.target.value);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    };

    useEffect(() => {
        if (query === "" && textareaRef.current) { textareaRef.current.style.height = 'auto'; }
    }, [query]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit(); }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            const readers = newFiles.map(file => new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(file);
            }));
            Promise.all(readers).then(base64Images => setSelectedImages(prev => [...prev, ...base64Images]));
        }
    };

    const removeImage = (index) => { setSelectedImages(prev => prev.filter((_, i) => i !== index)); };

    const onSubmit = () => {
        if (!query.trim() && selectedImages.length === 0) return;
        handleSearch(query, selectedImages); 
        setQuery("");
        setSelectedImages([]); 
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
    };

    return (
        <div className={`w-full transition-all duration-300 ${fixed ? "fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center bg-transparent pointer-events-none" : ""}`}>
            
            {fixed && (
                <div className="absolute bottom-0 inset-x-0 h-32 md:h-40 bg-gradient-to-t from-[#09090b] via-[#09090b]/95 to-transparent pointer-events-none"></div>
            )}

            <div className={`relative w-full pointer-events-auto ${fixed ? 'max-w-3xl px-4 pb-6 md:pb-8' : 'max-w-2xl px-4'}`}>
                
                {selectedImages.length > 0 && (
                    <div className="flex gap-2 mb-2 overflow-x-auto w-full px-1 scrollbar-hide">
                        {selectedImages.map((img, idx) => (
                            <div key={idx} className="relative flex-shrink-0 bg-[#18181b] p-2 rounded-xl border border-white/10">
                                <img src={img} alt={`Preview ${idx}`} className="h-14 w-14 object-cover rounded-lg" />
                                <button onClick={() => removeImage(idx)} className="absolute -top-2 -right-2 bg-zinc-800 text-zinc-400 hover:text-white rounded-full p-1 border border-white/10 shadow-lg"><X size={10} /></button>
                            </div>
                        ))}
                    </div>
                )}

                <div className={`relative flex flex-col bg-white dark:bg-[#121212] rounded-2xl border border-gray-200 dark:border-white/10 shadow-xl dark:shadow-black/50 overflow-hidden transition-all duration-300 group-focus-within:shadow-[0_0_20px_rgba(20,184,166,0.15)] focus-within:border-teal-500/50 ${fixed ? 'bg-opacity-90 backdrop-blur-xl' : ''}`}>
                    
                    <div className="flex items-start p-3 md:p-4">
                        {fixed && (
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-800 mr-3 mt-1 flex-shrink-0">
                                <Plus size={18} className="text-zinc-500" />
                            </div>
                        )}
                        <textarea 
                            ref={textareaRef}
                            rows={1}
                            className={`w-full bg-transparent border-0 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-0 resize-none py-2 leading-relaxed outline-none font-display ${fixed ? 'text-base' : 'text-lg'}`}
                            placeholder={fixed ? "Ask a follow-up..." : "What you looking for?"}
                            value={query} 
                            onChange={handleInput} 
                            onKeyDown={handleKeyDown}
                            autoFocus={!hasHistory}
                            style={{ minHeight: fixed ? '40px' : '56px' }}
                        />
                    </div>

                    <div className="flex items-center justify-between px-3 md:px-4 pb-3 pt-1">
                        <div className="flex items-center gap-2">
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" multiple />
                            <button type="button" onClick={() => fileInputRef.current.click()} className="p-1.5 rounded-lg text-gray-400 hover:text-teal-400 hover:bg-teal-500/10 transition-colors">
                                <Paperclip size={18} className="rotate-45" />
                            </button>
                        </div>

                        {isStreaming ? ( 
                            <button type="button" onClick={stopStream} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"><Square size={18} fill="currentColor" /></button> 
                        ) : ( 
                            <button 
                                type="button" 
                                onClick={onSubmit} 
                                disabled={!query.trim() && selectedImages.length === 0} 
                                className="p-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-500/20 transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                {fixed ? <ArrowUp size={18} /> : <ArrowRight size={20} />}
                            </button> 
                        )}
                    </div>
                    <div className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-teal-600 via-emerald-400 to-teal-600 w-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
                </div>
                
                {fixed && (
                    <div className="text-center mt-3">
                        <p className="text-[10px] text-zinc-600">Alethiq AI can make mistakes. Consider checking important information.</p>
                    </div>
                )}
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
  const [currentThreadId, setCurrentThreadId] = useState(null);
  const [lastQuery, setLastQuery] = useState("");
  const { user, token, API_BASE } = useAuth();
  const { data, sources, images, status, isStreaming, streamData, stopStream } = useStream();
  const SUGGESTIONS_URL = "https://gaurav-code098-alethiq.hf.space";

  const suggestionIcons = [Lightbulb, Zap, Code, Globe];

  useEffect(() => { const checkMobile = () => { const mobile = window.innerWidth < 768; setIsMobile(mobile); setIsSidebarOpen(!mobile); }; checkMobile(); window.addEventListener('resize', checkMobile); return () => window.removeEventListener('resize', checkMobile); }, []);
  const fetchHistory = () => { if (user && user.id && token) { fetch(`${API_BASE}/api/chat/user/${user.id}`, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json()).then(data => { if (Array.isArray(data)) setThreads(data.reverse()); else setThreads([]); }).catch(err => console.error("History fetch error:", err)); } };
  useEffect(() => { fetchHistory(); }, [user, token, API_BASE]);
  const saveToHistory = async (userQ, aiA) => { if (!token) return; try { const res = await fetch(`${API_BASE}/api/chat/save-conversation`, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }, body: JSON.stringify({ query: userQ, answer: aiA, conversationId: currentThreadId }) }); if (res.ok) { const data = await res.json(); if (data.conversationId) { setCurrentThreadId(data.conversationId); } fetchHistory(); } } catch (e) { console.error("Save failed:", e); } };
  const handleLoadThread = (thread) => { setChatHistory([]); setCurrentThreadId(thread.id); const formattedMessages = thread.messages.map(msg => ({ type: msg.role === "USER" ? "user" : "ai", content: msg.content })); setChatHistory(formattedMessages); if(isMobile) setIsSidebarOpen(false); };
  
  useEffect(() => { 
      const fetchSuggestions = async () => { 
          try { 
              const res = await fetch(`${SUGGESTIONS_URL}/get-suggestions`); 
              if (res.ok) { setSuggestions(await res.json()); } 
              else throw new Error(); 
          } catch (e) { 
              const fallback = ["Philosophy of Stoicism", "Edge Computing Use Cases", "Smart Agriculture & IoT", "Ancient Egyptian Mythology"].sort(() => 0.5 - Math.random()); 
              setSuggestions(fallback.slice(0, 4)); 
          } finally { setLoadingSuggestions(false); } 
      }; 
      fetchSuggestions(); 
  }, []); 

  const handleScroll = (e) => { const { scrollTop, scrollHeight, clientHeight } = e.target; if (scrollHeight - scrollTop - clientHeight > 50) setAutoScroll(false); else setAutoScroll(true); };
  useEffect(() => { if (isStreaming && autoScroll && messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: "auto" }); }, [data, isStreaming, autoScroll]);
  
  const handleSearch = (searchQuery, image = null) => { 
    if (!searchQuery?.trim() && !image) return; 
    const currentHistory = [...chatHistory]; 
    setChatHistory(prev => [...prev, { type: 'user', content: searchQuery, image: image }]); 
    setQuery(""); 
    setLastQuery(searchQuery); 
    setAutoScroll(true); 
    streamData(searchQuery, "fast", currentHistory, image); 
  };

  const handleNewChat = () => { setChatHistory([]); setQuery(""); setCurrentThreadId(null); stopStream(); };
  const prevStreaming = useRef(false);
  useEffect(() => { if (prevStreaming.current && !isStreaming && data) { setChatHistory(prev => [...prev, { type: 'ai', content: data, sources, images }]); if (user && lastQuery) { saveToHistory(lastQuery, data); } } prevStreaming.current = isStreaming; }, [isStreaming, data, sources, images, user, token, API_BASE, lastQuery]);
  const hasHistory = chatHistory.length > 0;

  return (
    // 🟢 1. STRICT OVERFLOW HIDDEN on BODY to prevent horizontal scrolling
    <div className="h-[100dvh] w-full bg-[#09090b] text-gray-300 flex overflow-hidden relative antialiased selection:bg-teal-500/30 selection:text-white font-display">
      <GlobalStyles />
      <AlethiqBackground />
      <AnimatePresence>{showAuthModal && (<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-lg p-4"><motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}><AuthCard onClose={() => setShowAuthModal(false)} /></motion.div></div>)}</AnimatePresence>
      
      {/* 🟢 MOBILE SIDEBAR OVERLAY */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="relative w-full h-full flex overflow-hidden">
        {/* Sidebar */}
        <motion.div animate={{ width: isSidebarOpen ? 260 : 0, opacity: isSidebarOpen ? 1 : 0 }} className={`fixed md:relative top-0 left-0 h-full bg-black/20 backdrop-blur-xl border-r border-white/5 z-50 flex flex-col overflow-hidden`}>
             <div className="w-[260px] flex flex-col h-full p-4">
                <div className="flex justify-between items-center mb-10 px-2 mt-2">
                   <div className="font-display text-lg tracking-tight flex items-center gap-2 text-zinc-100 font-semibold">
                      <div className="w-2 h-2 rounded-full bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.5)]" />Alethiq
                   </div>
                   <button onClick={() => setIsSidebarOpen(false)} className="text-zinc-500 hover:text-white transition-colors"><PanelLeftClose size={18} /></button>
                </div>
                <button onClick={handleNewChat} className="flex items-center gap-3 w-full bg-white/5 hover:bg-white/10 text-white rounded-xl px-4 py-3 transition-all border border-white/5 group mb-8"><Plus size={16} className="text-zinc-400 group-hover:text-white" /><span className="text-sm font-medium tracking-wide">New Thread</span></button>
                <div className="flex-1 overflow-y-auto px-2 space-y-1">
                  {user ? (<div className="flex items-center justify-between px-2 mb-3"><span className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.2em]">History</span><button onClick={fetchHistory} className="text-zinc-600 hover:text-white transition-colors"><RefreshCw size={10} /></button></div>) : <button onClick={() => setShowAuthModal(true)} className="flex items-center gap-3 w-full bg-teal-900/10 hover:bg-teal-900/20 text-teal-400 rounded-xl px-4 py-3 border border-teal-500/10 transition-all text-sm font-medium"><LogIn size={16} /> <span className="opacity-80">Sign In / Sign Up</span></button>}
                  {user && threads.length > 0 ? threads.map((thread) => { let cleanTitle = thread.title; try { const parsed = JSON.parse(thread.title); if (parsed.query) cleanTitle = parsed.query; } catch (e) { } return (<button key={thread.id} onClick={() => handleLoadThread(thread)} className="w-full text-left p-3 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-zinc-200 transition-colors text-xs truncate flex items-center gap-3 group"><MessageSquare size={14} className="text-zinc-700 group-hover:text-zinc-400 transition-colors" /><span className="truncate">{cleanTitle || "Untitled Chat"}</span></button>); }) : user && <div className="flex flex-col items-center justify-center pt-24 opacity-30"><History className="w-6 h-6 text-zinc-500 mb-3" /><p className="text-zinc-500 text-[10px] text-center font-mono">NO HISTORY</p></div>}
                </div>
             </div>
        </motion.div>

        {/* 🟢 WRAPPED MAIN CONTENT */}
        <div className="flex-1 h-full relative flex flex-col overflow-hidden w-full">
             
             <div className="absolute top-0 left-0 w-full p-4 md:p-6 flex justify-between items-start z-30 pointer-events-none">
                  <div className="pointer-events-auto">{!isSidebarOpen && <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-transparent text-zinc-500 hover:text-white transition-colors"><Menu size={20} /></button>}</div>
                  <div className="pointer-events-auto">{!user && !isSidebarOpen && <button onClick={() => setShowAuthModal(true)} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs text-zinc-300 hover:text-white hover:bg-white/10 transition-all font-mono tracking-wide"><LogIn size={12} /> ACCESS</button>}{user && <HeaderProfile />}</div>
             </div>

             <Conversation className="flex-1 w-full relative">
                 {/* 🅰️ HERO VIEW */}
                 {!hasHistory && (
                   <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-12 min-h-full">
                      <div className="w-full max-w-3xl flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                          <Persona />
                          <div className="w-full max-w-2xl mb-10">
                            {/* Static Search Form in Hero */}
                            <SearchForm fixed={false} query={query} setQuery={setQuery} handleSearch={handleSearch} isStreaming={isStreaming} stopStream={stopStream} hasHistory={hasHistory} isSidebarOpen={isSidebarOpen} />
                          </div>
                          <div className="flex flex-wrap justify-center gap-2 md:gap-3 w-full max-w-3xl px-2">
                             {suggestions.map((s, i) => {
                                 const Icon = suggestionIcons[i % suggestionIcons.length];
                                 return (
                                   <button key={i} onClick={() => handleSearch(s)} className="group flex items-center gap-2 px-3 md:px-4 py-2 rounded-full border border-white/5 bg-white/[0.02] hover:bg-white/10 hover:border-teal-500/30 transition-all duration-300">
                                     <Icon size={14} className="text-zinc-500 group-hover:text-teal-400 transition-colors" />
                                     <span className="text-[11px] md:text-xs font-medium text-zinc-400 group-hover:text-zinc-200">{s}</span>
                                   </button>
                                 )
                             })}
                          </div>
                      </div>
                   </div>
                 )}

                 {/* 🅱️ RESULT VIEW */}
                 {hasHistory && (
                   // 🟢 2. PADDING to pb-96 for mobile clearance
                   <div className="w-full max-w-5xl mx-auto pt-20 md:pt-24 pb-96 px-4 sm:px-6 lg:px-8">
                      {chatHistory.map((msg, idx) => (
                         <div key={idx} className="group mb-12 md:mb-16 border-b border-white/5 pb-12 md:pb-16 last:border-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                             {msg.type === 'user' ? (
                               <div className="w-full max-w-[900px] mx-auto mb-6 md:mb-10">
                                  <h2 className="text-2xl md:text-4xl font-serif text-white tracking-tight leading-tight break-words">{msg.content}</h2>
                               </div>
                             ) : (
                               <ContentBlock data={msg.content} sources={msg.sources} images={msg.images} isTyping={false} onRelatedClick={handleSearch} />
                             )}
                         </div>
                      ))}
                      {isStreaming && <ContentBlock data={data} sources={sources} images={images} isTyping={true} status={status} onRelatedClick={handleSearch} />}
                      <div ref={messagesEndRef} className="h-4" />
                   </div>
                 )}
             </Conversation>

             {/* FIXED SEARCH BAR AT BOTTOM */}
             {hasHistory && (
                <div className="absolute bottom-0 w-full z-50">
                    <SearchForm fixed={true} query={query} setQuery={setQuery} handleSearch={handleSearch} isStreaming={isStreaming} stopStream={stopStream} hasHistory={hasHistory} isSidebarOpen={isSidebarOpen} />
                </div>
             )}
        </div>
      </div>
    </div>
  );
}

const RootApp = () => (<AuthProvider><App /></AuthProvider>);
export default RootApp;
