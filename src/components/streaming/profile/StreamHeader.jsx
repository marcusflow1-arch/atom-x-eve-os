import React from "react";
import { Eye, Bell, Heart, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import LunarMotif from "@/components/shared/LunarMotif";

export default function StreamHeader({
  gameTitle = "Elder Scrolls Online",
  viewCount = 3421,
  onFollow,
  onSubscribe,
  onNotify,
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 md:p-8 mb-6">
      <div className="flex items-center justify-between">
        <div className="text-white/70 text-sm hidden md:block">Live Stream</div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-white/80 text-sm px-3 py-2 rounded-xl bg-white/5 border border-white/10">
            <Eye className="w-4 h-4" /> {viewCount.toLocaleString()}
          </div>
          <Button onClick={onFollow} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/15 rounded-xl h-9 px-4">
            <Heart className="w-4 h-4 mr-2" /> Follow
          </Button>
          <Button onClick={onSubscribe} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl h-9 px-4 border-0">
            <Zap className="w-4 h-4 mr-2" /> Subscribe
          </Button>
          <Button onClick={onNotify} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/15 rounded-xl h-9 px-3">
            <Bell className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center">
        <h3 className="text-white font-bold text-lg leading-tight mb-1 text-center">{gameTitle}</h3>
        <LunarMotif />
      </div>
    </div>
  );
}