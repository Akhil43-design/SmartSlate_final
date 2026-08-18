import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const tone = {
  blue: "bg-blue text-primary-foreground",
  green: "bg-green text-foreground",
  yellow: "bg-yellow text-foreground",
  purple: "bg-purple text-primary-foreground",
  orange: "bg-orange text-foreground",
  pink: "bg-pink text-foreground",
  cyan: "bg-cyan text-foreground",
} as const;

export type Tone = keyof typeof tone;

export const toneSoft: Record<Tone, string> = {
  blue: "bg-blue/15 text-foreground",
  green: "bg-green/20 text-foreground",
  yellow: "bg-yellow/25 text-foreground",
  purple: "bg-purple/18 text-foreground",
  orange: "bg-orange/20 text-foreground",
  pink: "bg-pink/18 text-foreground",
  cyan: "bg-cyan/20 text-foreground",
};

export function GlassCard({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("soft-glass rounded-3xl p-5", className)} {...rest}>
      {children}
    </div>
  );
}

/** Big, friendly, tap-safe action tile. Icon first, few words. */
export function BigTile({
  icon: Icon,
  title,
  subtitle,
  color = "blue",
  to,
  onClick,
  className,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  color?: Tone;
  to?: string;
  onClick?: () => void;
  className?: string;
}) {
  const inner = (
    <>
      <span className={cn("grid size-16 shrink-0 place-items-center rounded-2xl sm:size-20", tone[color])}>
        <Icon className="size-8 sm:size-10" strokeWidth={2.4} />
      </span>
      <span className="min-w-0">
        <span className="block font-display text-xl font-extrabold uppercase tracking-tight sm:text-2xl">
          {title}
        </span>
        {subtitle ? <span className="block text-sm font-semibold text-muted-foreground sm:text-base">{subtitle}</span> : null}
      </span>
    </>
  );

  const cls = cn(
    "soft-glass flex min-h-[7rem] w-full items-center gap-4 rounded-[2rem] p-5 text-left transition-transform duration-200 hover:-translate-y-1 hover:shadow-pop focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40 active:scale-[0.98]",
    className,
  );

  if (to) {
    return (
      <Link to={to} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

export function BigButton({
  children,
  color = "blue",
  to,
  onClick,
  type = "button",
  className,
}: {
  children: React.ReactNode;
  color?: Tone | "ghost";
  to?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
}) {
  const cls = cn(
    "inline-flex min-h-14 items-center justify-center gap-2 rounded-full px-8 font-display text-lg font-extrabold uppercase tracking-wide shadow-soft transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-pop active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40 sm:text-xl",
    color === "ghost" ? "soft-glass text-foreground" : tone[color],
    className,
  );
  if (to) {
    return (
      <Link to={to} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

export function Script({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("accent-script text-primary", className)}>{children}</span>;
}

export function StarCount({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full bg-yellow/90 px-4 py-2 font-display text-lg font-extrabold text-foreground shadow-sm", className)}>
      ⭐ {value} Stars
    </span>
  );
}

export function StreakCount({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full bg-orange/20 px-4 py-2 font-display text-base font-extrabold text-orange-700", className)}>
      🔥 {value} Day Streak
    </span>
  );
}

export function BadgeChip({ title, emoji, color = "yellow", className }: { title: string; emoji: string; color?: Tone; className?: string }) {
  return (
    <div className={cn("soft-glass flex items-center gap-2 rounded-2xl px-4 py-2.5 font-display text-sm font-extrabold uppercase", toneSoft[color], className)}>
      <span className="text-xl">{emoji}</span>
      <span>{title}</span>
    </div>
  );
}

export function GradeBadge({ grade, className }: { grade: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1 font-display text-xs font-extrabold uppercase text-primary", className)}>
      🎓 {grade}
    </span>
  );
}

