import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Swords } from 'lucide-react';
import { getClassesForWeapon, WEAPON_TYPES } from './advancedClassRegistry';
import { selectAdvancedClass, deselectAdvancedClass, canSwitchAdvancedClass } from './advancedClassStore';
import AdvancedClassCard from './AdvancedClassCard';

const WEAPON_LABELS = {
  [WEAPON_TYPES.SWORD]:    { label: 'Sword',          icon: '⚔️' },
  [WEAPON_TYPES.RANGED]:   { label: 'Bow / Archery',  icon: '🏹' },
  [WEAPON_TYPES.GUARDIAN]: { label: 'Guardian',       icon: '🛡️' },
};

export default function AdvancedClassSelector({ weaponType, selectedClassId, unlockedClasses }) {
  const [pendingClassId, setPendingClassId] = useState(null);
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', msg }

  const classes = getClassesForWeapon(weaponType);
  const weaponMeta = WEAPON_LABELS[weaponType] || { label: weaponType, icon: '⚔️' };

  const confirmSwitch = (classId) => {
    const check = canSwitchAdvancedClass();
    if (!check.allowed) {
      setFeedback({ type: 'error', msg: check.reason });
      setTimeout(() => setFeedback(null), 3000);
      setPendingClassId(null);
      return;
    }

    if (classId === selectedClassId) {
      // Deselect
      deselectAdvancedClass(weaponType);
      setFeedback({ type: 'success', msg: 'Advanced class deactivated.' });
    } else {
      const result = selectAdvancedClass(classId);
      if (result.success) {
        setFeedback({ type: 'success', msg: `${classes.find(c => c.class_id === classId)?.display_name} activated!` });
      } else {
        setFeedback({ type: 'error', msg: result.reason });
      }
    }
    setTimeout(() => setFeedback(null), 2500);
    setPendingClassId(null);
  };

  const handleCardClick = (classId) => {
    const isUnlocked = unlockedClasses.includes(classId);
    if (!isUnlocked) {
      setFeedback({ type: 'error', msg: 'This class is not yet unlocked.' });
      setTimeout(() => setFeedback(null), 2000);
      return;
    }
    if (classId === selectedClassId) {
      // Confirm deselect
      setPendingClassId(classId);
    } else {
      setPendingClassId(classId);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Weapon type header */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{weaponMeta.icon}</span>
        <span className="text-xs tracking-[0.35em] uppercase text-white/60 font-semibold">
          {weaponMeta.label} Advanced Classes
        </span>
      </div>

      {/* Feedback bar */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-xs"
            style={{
              background: feedback.type === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
              border: `1px solid ${feedback.type === 'success' ? 'rgba(16,185,129,0.30)' : 'rgba(239,68,68,0.30)'}`,
              color: feedback.type === 'success' ? '#6ee7b7' : '#fca5a5',
            }}
          >
            {feedback.type === 'success'
              ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
              : <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            }
            {feedback.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm dialog */}
      <AnimatePresence>
        {pendingClassId && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="p-3 rounded-lg"
            style={{ background: 'rgba(15,20,28,0.9)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Swords className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-white/80">
                {pendingClassId === selectedClassId
                  ? `Deactivate ${classes.find(c => c.class_id === pendingClassId)?.display_name}?`
                  : `Switch to ${classes.find(c => c.class_id === pendingClassId)?.display_name}?`
                }
              </span>
            </div>
            <p className="text-[10px] text-white/45 mb-3">
              Class passives and abilities will update immediately. You can switch again outside of combat.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => confirmSwitch(pendingClassId)}
                className="flex-1 py-1.5 text-[10px] tracking-[0.2em] uppercase font-semibold rounded transition-all"
                style={{ background: 'rgba(59,130,246,0.25)', border: '1px solid rgba(96,165,250,0.4)', color: '#93c5fd' }}
              >
                Confirm
              </button>
              <button
                onClick={() => setPendingClassId(null)}
                className="flex-1 py-1.5 text-[10px] tracking-[0.2em] uppercase rounded transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.45)' }}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Class grid */}
      <div className="grid grid-cols-2 gap-3">
        {classes.map((cls) => (
          <AdvancedClassCard
            key={cls.class_id}
            classDef={cls}
            isSelected={selectedClassId === cls.class_id}
            isUnlocked={unlockedClasses.includes(cls.class_id)}
            onClick={() => handleCardClick(cls.class_id)}
          />
        ))}
      </div>
    </div>
  );
}