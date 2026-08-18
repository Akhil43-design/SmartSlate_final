import { cn } from "@/lib/utils";

type SlateyProps = {
  className?: string;
  mood?: "happy" | "wave" | "wow" | "sleep";
  size?: number;
};

/** Slatey — the friendly SmartSlate mascot (a cheerful little slate/tablet). */
export function Slatey({ className, mood = "happy", size = 120 }: SlateyProps) {
  const eye = mood === "sleep" ? "M 30 46 q 8 6 16 0" : null;
  return (
    <svg
      viewBox="0 0 120 130"
      width={size}
      height={(size * 130) / 120}
      className={cn("drop-shadow-[0_10px_20px_rgba(79,124,255,0.25)]", className)}
      role="img"
      aria-label="Slatey the SmartSlate mascot"
    >
      {/* arms */}
      <circle cx="12" cy="72" r="9" className="fill-yellow" />
      <circle cx="108" cy={mood === "wave" ? 40 : 72} r="9" className="fill-yellow" />
      {/* body */}
      <rect x="14" y="16" width="92" height="86" rx="24" className="fill-primary" />
      <rect x="22" y="24" width="76" height="70" rx="18" className="fill-card" />
      {/* face */}
      {eye ? (
        <>
          <path d={eye} className="stroke-foreground" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M 66 46 q 8 6 16 0" className="stroke-foreground" strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="46" cy={mood === "wow" ? 48 : 50} r={mood === "wow" ? 9 : 7} className="fill-foreground" />
          <circle cx="76" cy={mood === "wow" ? 48 : 50} r={mood === "wow" ? 9 : 7} className="fill-foreground" />
          <circle cx="48.5" cy="47.5" r="2.5" className="fill-card" />
          <circle cx="78.5" cy="47.5" r="2.5" className="fill-card" />
        </>
      )}
      <circle cx="34" cy="64" r="6" className="fill-pink opacity-70" />
      <circle cx="88" cy="64" r="6" className="fill-pink opacity-70" />
      {mood === "wow" ? (
        <ellipse cx="61" cy="70" rx="9" ry="11" className="fill-foreground" />
      ) : (
        <path
          d="M 44 66 q 17 18 34 0"
          className="stroke-foreground"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
        />
      )}
      {/* legs */}
      <rect x="34" y="100" width="14" height="20" rx="7" className="fill-primary" />
      <rect x="72" y="100" width="14" height="20" rx="7" className="fill-primary" />
      {/* pencil antenna */}
      <rect x="57" y="2" width="6" height="16" rx="3" className="fill-orange" />
      <circle cx="60" cy="4" r="5" className="fill-green" />
    </svg>
  );
}

export function SlateyBubble({
  children,
  mood = "happy",
  size = 96,
  className,
}: {
  children: React.ReactNode;
  mood?: SlateyProps["mood"];
  size?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <Slatey mood={mood} size={size} className="shrink-0 animate-float" />
      <div className="soft-glass min-w-0 rounded-3xl px-5 py-4 text-base font-bold sm:text-lg">{children}</div>
    </div>
  );
}
