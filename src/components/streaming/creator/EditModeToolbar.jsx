import React from 'react';
import { motion } from 'framer-motion';
import { Save, X, Pencil, Loader2, Grid3x3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Floating toolbar that appears during Edit Mode.
 * Shows Save / Cancel with visual cues.
 */
export default function EditModeToolbar({ isEditMode, saving, onSave, onCancel, onEnterEdit }) {
  if (!isEditMode) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-24 right-8 z-50"
      >
        <Button
          onClick={onEnterEdit}
          className="rounded-full w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 text-white shadow-lg hover:shadow-cyan-500/20 transition-all hover:scale-110"
          size="icon"
          title="Edit Profile"
        >
          <Pencil className="w-5 h-5" />
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-24 right-8 z-50 flex items-center gap-3"
    >
      {/* Edit Mode Indicator */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 backdrop-blur-xl">
        <Grid3x3 className="w-4 h-4 text-cyan-400 animate-pulse" />
        <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Edit Mode</span>
      </div>

      {/* Cancel */}
      <Button
        onClick={onCancel}
        disabled={saving}
        className="rounded-full px-5 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 hover:text-red-200 backdrop-blur-xl transition-all"
        variant="ghost"
      >
        <X className="w-4 h-4 mr-2" />
        Cancel
      </Button>

      {/* Save */}
      <Button
        onClick={onSave}
        disabled={saving}
        className="rounded-full px-6 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 hover:text-white backdrop-blur-xl shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 transition-all"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Save className="w-4 h-4 mr-2" />
        )}
        {saving ? 'Saving...' : 'Save'}
      </Button>
    </motion.div>
  );
}