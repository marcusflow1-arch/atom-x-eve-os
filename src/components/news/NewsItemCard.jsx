import React from "react";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, ImageOff, ChevronRight } from "lucide-react";

export default function NewsItemCard({ item, onClick }) {
  const hasImage = Boolean(item.image);

  return (
    <div
      onClick={() => onClick?.(item)}
      className={`group relative w-full rounded-xl border border-white/15 ${
        hasImage ? "p-0" : "p-4"
      } bg-white/[0.06] hover:bg-white/[0.08] transition-all cursor-pointer overflow-hidden`}
      style={{ backdropFilter: "blur(14px) saturate(140%)", WebkitBackdropFilter: "blur(14px) saturate(140%)" }}
    >
      {/* With image: large card */}
      {hasImage ? (
        <div className="flex flex-col md:flex-row">
          <div className="md:w-64 relative">
            <img src={item.image} alt={item.title} className="w-full h-40 md:h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
          </div>
          <div className="flex-1 p-4 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <Badge className="bg-white/10 text-white border border-white/20">
                {item.category || "Update"}
              </Badge>
              <span className="text-xs text-white/60 flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5" />
                {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </div>
            <h3 className="text-white font-semibold text-lg leading-tight mb-1 pr-6">{item.title}</h3>
            {item.subtitle && <p className="text-white/70 text-sm mb-2">{item.subtitle}</p>}
            <p className="text-slate-300 text-sm line-clamp-2">{item.summary}</p>
          </div>
        </div>
      ) : (
        // No image: compact pill card
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/15 grid place-items-center text-white/70">
            <ImageOff className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <Badge className="bg-white/10 text-white border border-white/20">
                {item.category || "Update"}
              </Badge>
              <span className="text-[11px] text-white/60 flex items-center gap-1">
                <CalendarDays className="w-3 h-3" />
                {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <p className="text-white text-sm truncate">{item.title}</p>
              <ChevronRight className="w-4 h-4 text-white/40" />
            </div>
            <p className="text-white/60 text-xs truncate">{item.summary}</p>
          </div>
        </div>
      )}
    </div>
  );
}