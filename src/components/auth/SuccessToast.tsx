"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

export function SuccessToast({ message, onDone }: { message: string | null; onDone: () => void }) {
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(onDone, 4000);
    return () => clearTimeout(id);
  }, [message, onDone]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2.5 rounded-xl border border-ivy/30 bg-ink-soft px-4 py-3 text-sm text-[#ece9e1] shadow-xl"
        >
          <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-ivy" strokeWidth={2} />
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
