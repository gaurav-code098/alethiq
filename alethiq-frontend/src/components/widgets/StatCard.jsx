import React from "react";
import { Activity, Calendar, DollarSign, Hash, TrendingUp, Layers } from "lucide-react";

const getIcon = (key) => {
  const k = key.toLowerCase();
  if (k.includes("date") || k.includes("founded")) return <Calendar size={14} />;
  if (k.includes("valuation") || k.includes("price") || k.includes("cap")) return <DollarSign size={14} />;
  if (k.includes("rank") || k.includes("#")) return <Hash size={14} />;
  return <TrendingUp size={14} />;
};

const StatCard = ({ title, data }) => {
  if (!data) return null;

  return (
    <div className="my-8 w-full relative group font-sans">
      {/* Subtle Glow - reduced intensity */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500/10 to-purple-500/10 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
      
      <div className="relative bg-[#0c0c0e] border border-white/10 rounded-xl overflow-hidden">
        {/* Minimal Header */}
        <div className="px-4 py-3 border-b border-white/5 bg-white/[0.01] flex items-center gap-2">
           <Layers size={14} className="text-teal-500/70" />
           <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">
              {title || "Data Overview"}
           </span>
        </div>

        {/* Adaptive Grid: Fits 2 cols on mobile, 3 on desktop */}
        <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(data).map(([key, value], idx) => (
            <div key={idx} className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-zinc-500">
                {getIcon(key)}
                <span className="text-[10px] uppercase tracking-wider font-semibold opacity-70">{key}</span>
              </div>
              <span className="text-sm text-zinc-200 font-medium truncate pl-5 border-l border-white/10">
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatCard;