import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Film, Sparkles, Play, ShoppingBag, Tv, Monitor, Mountain, Feather, Clapperboard, ChevronLeft } from "lucide-react";
import StreamingDiscovery from "@/components/streaming/StreamingDiscovery";
import SocialHub from "@/components/dashboard/SocialHub";

export default function EntertainmentUI() {
  const [activeTab, setActiveTab] = useState("entertainment");
  const [selectedStreamingService, setSelectedStreamingService] = useState(null);

  const tabs = [
    { id: "entertainment", label: "Entertainment" },
    { id: "streaming", label: "Streaming" },
    { id: "social", label: "Social Hub" },
  ];

  const services = [
    { name: "Netflix", icon: Film, color: "rgba(229, 9, 20, 0.5)", brandColor: "#E50914", topText: "Netflix", bottomText: "" },
    { name: "Disney+", icon: Sparkles, color: "rgba(17, 60, 207, 0.5)", brandColor: "#113CCF", topText: "Disney", bottomText: "+" },
    { name: "HBO Max", icon: Play, color: "rgba(185, 28, 255, 0.5)", brandColor: "#B91CFF", topText: "HBO", bottomText: "Max" },
    { name: "Prime Video", icon: ShoppingBag, color: "rgba(0, 168, 225, 0.5)", brandColor: "#00A8E1", topText: "Prime", bottomText: "Video" },
    { name: "Hulu", icon: Tv, color: "rgba(28, 231, 131, 0.5)", brandColor: "#1CE783", topText: "Hulu", bottomText: "" },
    { name: "Apple TV+", icon: Monitor, color: "rgba(100, 100, 100, 0.5)", brandColor: "#000000", topText: "Apple", bottomText: "TV+" },
    { name: "Paramount+", icon: Mountain, color: "rgba(0, 99, 235, 0.5)", brandColor: "#0063EB", topText: "Paramount", bottomText: "+" },
    { name: "Peacock", icon: Feather, color: "rgba(0, 0, 0, 0.5)", brandColor: "#000000", topText: "Peacock", bottomText: "" },
  ];

  const selectedService = services.find(s => s.name === selectedStreamingService);

  return (
    <div
      className="min-h-screen w-full p-8 text-white relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #0d1117 50%, #1a1f2e 75%, #0f1419 100%)' 
      }}
    >
      {/* Liquid Glass Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'rgba(255, 255, 255, 0.01)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      />
      {/* Ambient Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-400/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-slate-400/8 rounded-full blur-[120px]" />
      </div>
      {/* Header - Translucent */}
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-6">
          <h2 className="text-2xl font-bold text-white/60">User Interface</h2>
          <div className="h-8 w-px bg-white/10" />
          <div className="flex gap-3">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-6 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === t.id ? "text-white" : "text-white/50 hover:text-white/80"
                }`}
                style={
                  activeTab === t.id
                    ? {
                        background: "rgba(59, 130, 246, 0.10)",
                        border: "1px solid rgba(147, 197, 253, 0.15)",
                      }
                    : {
                        background: "transparent",
                        border: "1px solid transparent"
                      }
                }
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {activeTab === "entertainment" && (
              <div className="flex h-[calc(100vh-180px)]">
                {/* LEFT SIDE - Vertical App Icons */}
                <div className="flex flex-col gap-3 pr-6">
                  {services.map((service, idx) => {
                    const Icon = service.icon;
                    const isSelected = selectedStreamingService === service.name;
                    return (
                      <motion.div
                        key={service.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => setSelectedStreamingService(service.name)}
                        className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all p-1 ${
                          isSelected ? "scale-110 ring-2 ring-white/50" : "hover:scale-105"
                        }`}
                        style={{
                          background: `linear-gradient(135deg, ${service.color} 0%, rgba(147, 197, 253, 0.15) 100%)`,
                          backdropFilter: "blur(20px)",
                          WebkitBackdropFilter: "blur(20px)",
                          border: isSelected ? "1px solid rgba(255, 255, 255, 0.5)" : "1px solid rgba(255, 255, 255, 0.2)",
                          boxShadow: isSelected
                            ? `0 0 20px ${service.color}, inset 0 1px 0 rgba(255, 255, 255, 0.3)`
                            : "0 4px 16px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
                        }}
                      >
                        <span className="text-white/90 text-[9px] font-semibold">{service.topText}</span>
                        <Icon className="w-4 h-4 text-white/90 my-0.5" />
                        {service.bottomText && (
                          <span className="text-white/90 text-[9px] font-semibold">
                            {service.bottomText}
                          </span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {/* INVISIBLE DIVIDER */}
                <div className="w-px bg-white/5 mx-4" />

                {/* RIGHT SIDE - App Content Area */}
                <div className="flex-1 overflow-hidden">
                  <AnimatePresence mode="wait">
                    {!selectedStreamingService ? (
                      <motion.div
                        key="placeholder"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full flex items-center justify-center"
                      >
                        <div className="text-center">
                          <Clapperboard className="w-20 h-20 text-white/20 mx-auto mb-4" />
                          <p className="text-white/40 text-lg">Select a streaming service</p>
                          <p className="text-white/20 text-sm mt-2">Choose an app from the left to start watching</p>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key={selectedStreamingService}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="h-full rounded-2xl overflow-hidden relative"
                        style={{
                          background: `linear-gradient(135deg, ${selectedService?.color} 0%, rgba(0,0,0,0.9) 100%)`,
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                        }}
                      >
                        {/* App Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/10">
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => setSelectedStreamingService(null)}
                              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                            >
                              <ChevronLeft className="w-5 h-5 text-white/70" />
                            </button>
                            <div className="flex items-center gap-3">
                              {selectedService && <selectedService.icon className="w-8 h-8 text-white" />}
                              <h3 className="text-2xl font-bold text-white">{selectedStreamingService}</h3>
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedStreamingService(null)}
                            className="text-white/40 hover:text-white transition-colors"
                          >
                            <X className="w-6 h-6" />
                          </button>
                        </div>

                        {/* App Content */}
                        <div className="p-6 h-[calc(100%-88px)] overflow-y-auto">
                          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {/* Mock content cards */}
                            {[...Array(12)].map((_, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="aspect-video rounded-xl bg-white/10 hover:bg-white/15 transition-all cursor-pointer overflow-hidden group"
                              >
                                <div className="w-full h-full flex items-center justify-center relative">
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                  <Play className="w-12 h-12 text-white/30 group-hover:text-white/60 group-hover:scale-110 transition-all" />
                                  <div className="absolute bottom-3 left-3 right-3">
                                    <p className="text-white/80 text-sm font-medium truncate">Content {i + 1}</p>
                                    <p className="text-white/40 text-xs">Watch Now</p>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>

                          {/* Coming Soon Notice */}
                          <div className="mt-8 p-6 rounded-xl bg-white/5 border border-white/10 text-center">
                            <Clapperboard className="w-12 h-12 text-white/30 mx-auto mb-3" />
                            <p className="text-white/60">Full {selectedStreamingService} integration coming soon</p>
                            <p className="text-white/30 text-sm mt-1">Connect your account to access your library</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {activeTab === "streaming" && <StreamingDiscovery />}
            {activeTab === "social" && <SocialHub />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}