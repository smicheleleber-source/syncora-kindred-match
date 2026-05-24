import { SOLO_LAWYER_DISCOUNT_PCT } from "@/lib/providers";

interface Props {
  variant?: "profile" | "portal";
  className?: string;
}

export function SoloLawyerBenefits({ variant = "profile", className = "" }: Props) {
  const isProfile = variant === "profile";
  return (
    <section
      className={
        "rounded-2xl border border-accent/40 bg-accent/5 p-5 md:p-6 " + className
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground ring-1 ring-accent/40">
          No paralegal
        </span>
        <h3 className="text-base font-semibold text-foreground">
          {isProfile
            ? "Solo practitioner — what you get"
            : "Matched with a solo lawyer? Here’s what you get."}
        </h3>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            Direct availability
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            You coordinate scheduling and case updates directly with the lawyer —
            no paralegal gatekeeper, no knowledge-transfer gaps.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-baseline justify-between">
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">
              Reduced rate
            </div>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              −{SOLO_LAWYER_DISCOUNT_PCT}%
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Flat {SOLO_LAWYER_DISCOUNT_PCT}% lower hourly rate — no paralegal
            overhead built into the bill.
          </p>
        </div>
      </div>
    </section>
  );
}