import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, type ReactNode } from 'react';
import { CloseIcon } from './Icons';

/** Accessible bottom sheet / dialog. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          data-nogesture
        >
          <div className="absolute inset-0 bg-night-950/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="relative max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] bg-sand-50 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-teal-900 shadow-2xl dark:bg-night-900 dark:text-teal-200 sm:rounded-[2rem]"
            initial={{ y: 40 }}
            animate={{ y: 0 }}
            exit={{ y: 40 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2 className="text-2xl font-semibold">{title}</h2>
              <button className="icon-btn -mr-2 -mt-2 shrink-0" onClick={onClose} aria-label="Close">
                <CloseIcon />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
