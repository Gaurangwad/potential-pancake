import { cn } from "@/lib/cn";

/**
 * Ooze wordmark — a minimalist solid-black box with white, bold lowercase
 * "ooze". Deliberately stark; the brand is the box.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex select-none items-center", className)}>
      <span className="inline-flex items-center justify-center rounded-[5px] bg-black px-2.5 py-1 ring-1 ring-white/15">
        <span className="font-display text-lg font-700 lowercase leading-none tracking-tight text-white">
          ooze
        </span>
      </span>
    </span>
  );
}
