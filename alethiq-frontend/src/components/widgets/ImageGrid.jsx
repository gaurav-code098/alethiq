import React from "react";
import { ImageIcon, ExternalLink } from "lucide-react";

const ImageGrid = ({ images }) => {
  if (!images || !Array.isArray(images) || images.length === 0) return null;

  // Filter out broken or placeholder images if possible (basic check)
  const validImages = images.filter(img => img && img.length > 10);

  if (validImages.length === 0) return null;

  return (
    <div className="my-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* Horizontal Scroll Container */}
      <div className="flex overflow-x-auto gap-3 pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide snap-x items-center">
        {validImages.slice(0, 5).map((img, idx) => (
          <div 
            key={idx} 
            className="relative flex-none h-32 md:h-40 aspect-[16/9] rounded-lg overflow-hidden border border-white/10 bg-[#111] snap-center cursor-pointer group shadow-sm"
            onClick={() => window.open(img, '_blank')}
          >
            <img 
              src={img} 
              alt={`Context ${idx}`} 
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 ease-out"
              onError={(e) => { e.target.parentElement.style.display = 'none'; }}
            />
            
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
               <ExternalLink size={16} className="text-white" />
            </div>
          </div>
        ))}
        
        {/* "More" indicator if many images */}
        {validImages.length > 5 && (
            <div className="flex-none h-32 md:h-40 w-12 flex items-center justify-center text-xs text-zinc-600 border-l border-white/5">
                +{validImages.length - 5}
            </div>
        )}
      </div>
    </div>
  );
};

export default ImageGrid;