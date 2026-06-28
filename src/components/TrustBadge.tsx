import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * Security is UI, not a footnote. Show this at every anxious moment —
 * upload, password entry, the reveal, payment.
 */
export function TrustBadge({ className, withLink = true }: { className?: string; withLink?: boolean }) {
  return (
    <div className={cn("inline-flex items-center gap-2 text-xs text-[#9a978f]", className)}>
      <ShieldCheck className="h-4 w-4 shrink-0 text-ivy" strokeWidth={2} />
      <span>
        Statements are processed in-session and{" "}
        <span className="text-[#cfccc3]">never stored</span>.
        {withLink && (
          <>
            {" "}
            <Link href="/privacy" className="text-ivy underline-offset-2 hover:underline">
              How it works
            </Link>
          </>
        )}
      </span>
    </div>
  );
}
