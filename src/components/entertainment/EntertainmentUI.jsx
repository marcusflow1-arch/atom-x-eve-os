import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Film, Sparkles, Play, ShoppingBag, Tv, Monitor, Mountain, Feather, Clapperboard } from "lucide-react";
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
    { name: "Netflix", icon: Film, color: "rgba(229, 9, 20, 0.3)", topText: "Netflix", bottomText: "" },
    { name: "Disney+", icon: Sparkles, color: "rgba(17, 60, 207, 0.3)", topText: "Disney", bottomText: "+" },
    { name: "HBO Max", icon: Play, color: "rgba(185, 28, 255, 0.3)", topText: "HBO", bottomText: "Max" },
    { name: "Prime Video", icon: ShoppingBag, color: "rgba(0, 168, 225, 0.3)", topText: "Prime", bottomText: "Video" },
    { name: "Hulu", icon: Tv, color: "rgba(28, 231, 131, 0.3)", topText: "Hulu", bottomText: "" },
    { name: "Apple TV+", icon: Monitor, color: "rgba(0, 0, 0, 0.5)", topText: "Apple", bottomText: "TV+" },
    { name: "Paramount+", icon: Mountain, color: "rgba(0, 99, 235, 0.3)", topText: "Paramount", bottomText: "+" },
    { name: "Peacock", icon: Feather, color: "rgba(0, 0, 0, 0.4)", topText: "Peacock", bottomText: "" },
  ];

  return (
    <div
      className="min-h-screen w-full p-8 text-white"
      style={{
        background:
          "linear-gradient(135deg, rgba(147, 197, 253, 0.15) 0%, rgba(191, 219, 254, 0.1) 50%, rgba(147, 197, 253, 0.05) 100%)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-6">
          <h2 className="text-3xl font-bold text-white/90 drop-shadow-lg">User Interface</h2>
          <div className="h-8 w-px bg-white/20" />
          <div className="flex gap-3">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === t.id ? "text-white" : "text-white/60 hover:text-white"
                }`}
                style={
                  activeTab === t.id
                    ? {
                        background: "rgba(59, 130, 246, 0.3)",
                        backdropFilter: "blur(20px)",
                        WebkitBackdropFilter: "blur(20px)",
                        border: "1px solid rgba(147, 197, 253, 0.3)",
                      }
                    : {}
                }
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full overflow-y-auto"
          >
            {activeTab === "entertainment" && (
              <AnimatePresence mode="wait">
                {!selectedStreamingService ? (
                  <motion.div
                    key="service-grid"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-wrap gap-4"
                  >
                    {services.map((service, idx) => {
                      const Icon = service.icon;
                      return (
                        <motion.div
                          key={service.name}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          onClick={() => setSelectedStreamingService(service.name)}
                          className="w-20 h-20 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:scale-110 transition-transform p-1"
                          style={{
                            background: `linear-gradient(135deg, ${service.color} 0%, rgba(147, 197, 253, 0.15) 100%)`,
                            backdropFilter: "blur(20px)",
                            WebkitBackdropFilter: "blur(20px)",
                            border: "1px solid rgba(255, 255, 255, 0.3)",
                            boxShadow:
                              "0 4px 16px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
                          }}
                        >
                          <span className="text-white/90 text-[10px] font-semibold">{service.topText}</span>
                          <Icon className="w-5 h-5 text-white/90 my-0.5" />
                          {service.bottomText && (
                            <span className="text-white/90 text-[10px] font-semibold">
                              {service.bottomText}
                            </span>
                          )}
                        </motion.div>
                      );
                    })}
                  </motion.div>
                ) : (
                  <motion.div
                    key="streaming-app"
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="fixed inset-0 flex items-center justify-center bg-black z-[100]"
                  >
                    <button
                      onClick={() => setSelectedStreamingService(null)}
                      className="fixed top-8 right-8 text-white/60 hover:text-white transition-colors"
                    >
                      <X className="w-8 h-8" />
                    </button>
                    <div className="text-center">
                      <Clapperboard className="w-16 h-16 text-white/40 mx-auto mb-4" />
                      <p className="text-white/60 text-lg">{selectedStreamingService} app will load here</p>
                      <p className="text-white/40 text-sm mt-2">Streaming interface coming soon</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {activeTab === "streaming" && <StreamingDiscovery />}
            {activeTab === "social" && <SocialHub />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}