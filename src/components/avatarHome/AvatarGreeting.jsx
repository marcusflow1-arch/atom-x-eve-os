import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AvatarGreeting({ message, autoDismissMs = 2400, onDismiss }) {
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      onDismiss && onDismiss();
    }, autoDismissMs);
    return () => clearTimeout(t);
  }, [autoDismissMs, onDismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-4 py-3 inline-block"
        >
          <div className="text-white/80 text-sm">{message}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}