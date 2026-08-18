import { createFileRoute } from "@tanstack/react-router";
import { GlassCard } from "@/components/kit";
import { Slatey } from "@/components/Slatey";

export const Route = createFileRoute("/parent/alerts")({
  head: () => ({
    meta: [
      { title: "Alerts — SmartSlate Parent" },
      { name: "description", content: "Important reminders from your child's teacher and school." },
      { property: "og:title", content: "Alerts — SmartSlate Parent" },
      { property: "og:description", content: "Stay on top of school reminders and updates." },
    ],
  }),
  component: Alerts,
});

const alerts = [
  { emoji: "📅", title: "Parent meeting", body: "Saturday at 10:00 AM.", tone: "bg-blue/20" },
  { emoji: "🎨", title: "Bring colours", body: "Drawing day is on Monday.", tone: "bg-pink/20" },
  { emoji: "⚠️", title: "Homework pending", body: "1 homework is still not finished.", tone: "bg-yellow/30" },
];

function Alerts() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-extrabold uppercase sm:text-4xl">🔔 Alerts</h1>
      <div className="space-y-3">
        {alerts.map((a) => (
          <GlassCard key={a.title} className={`rounded-[1.75rem] ${a.tone}`}>
            <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
              <span className="grid size-12 place-items-center rounded-2xl bg-card text-2xl">{a.emoji}</span>
              <span className="min-w-0">
                <span className="block truncate font-display text-lg font-extrabold">{a.title}</span>
                <span className="block text-sm font-semibold text-muted-foreground">{a.body}</span>
              </span>
            </div>
          </GlassCard>
        ))}
      </div>
      <div className="soft-glass flex items-center gap-4 rounded-[2rem] p-5">
        <Slatey size={72} />
        <p className="font-display text-lg font-extrabold uppercase">All caught up! 🎉</p>
      </div>
    </div>
  );
}
