import React, { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import InventoryPanel from "./InventoryPanel";
import { inventoryData, profileData } from "./mockData";

export default function InventoryEquipOverlay() {
  const [open, setOpen] = useState(false);
  const [slotId, setSlotId] = useState(null);

  const onClose = useCallback(() => {
    setOpen(false);
    setSlotId(null);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const detail = e?.detail || {};
      setSlotId(detail.slotId || null);
      setOpen(true);
    };
    window.addEventListener("openInventoryPanel", handler);
    return () => window.removeEventListener("openInventoryPanel", handler);
  }, []);

   // Global flag to suppress other inventory UIs while this overlay is open
   useEffect(() => {
     try { window.__inventoryOverlayOpen = open; } catch {}
     return () => { try { window.__inventoryOverlayOpen = false; } catch {} };
   }, [open]);

   const handleEquip = (item) => {
    // Broadcast equip event so grid/loadout systems can react
    window.dispatchEvent(
      new CustomEvent("equipItem", { detail: { slotId, item } })
    );
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Subtle Luna-matching backdrop (not too dark) */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(15,20,25,0.25) 0%, rgba(26,31,46,0.25) 50%, rgba(13,17,23,0.25) 100%)",
              backdropFilter: "blur(10px) saturate(140%)",
              WebkitBackdropFilter: "blur(10px) saturate(140%)",
            }}
          />

          {/* Panel container */}
          <motion.div
            initial={{ scale: 0.97, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.97, opacity: 0 }}
            transition={{ type: "spring", damping: 22, stiffness: 220 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-6xl h-[720px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
            style={{
              background:
                "linear-gradient(135deg, rgba(100,120,140,0.16) 0%, rgba(80,100,120,0.12) 100%)",
              backdropFilter: "blur(24px) saturate(150%)",
              WebkitBackdropFilter: "blur(24px) saturate(150%)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.45)",
            }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white/80 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Inventory Panel content */}
            <div className="absolute inset-0 p-5">
              <InventoryPanel
                inventory={inventoryData}
                capacity={profileData.inventoryCapacity}
                profile={profileData}
                onClose={onClose}
                onEquip={handleEquip}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}