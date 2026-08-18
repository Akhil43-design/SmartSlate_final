import { createFileRoute } from "@tanstack/react-router";
import { GlassCard } from "@/components/kit";
import { homework } from "@/lib/data";

export const Route = createFileRoute("/parent/progress")({
  head: () => ({
    meta: [
      { title: "Homework Progress — SmartSlate Parent" },
      { name: "description", content: "Follow which homework is finished and what is still due this week." },
      { property: "og:title", content: "Homework Progress — SmartSlate Parent" },
      { property: "og:description", content: "Homework status at a glance." },
    ],
  }),
  component: Progress,
});

function Progress() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-extrabold uppercase sm:text-4xl">📚 Homework</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        {homework.map((h) => (
          <GlassCard key={h.id} className="rounded-[1.75rem]">
            <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
              <span className="grid size-12 place-items-center rounded-2xl bg-accent text-2xl">{h.emoji}</span>
              <span className="min-w-0">
                <span className="block truncate font-display text-lg font-extrabold">{h.title}</span>
                <span className="block text-sm font-semibold text-muted-foreground">{h.subject} · {h.due}</span>
              </span>
              <span
                className={`rounded-full px-3 py-1 font-display text-xs font-extrabold uppercase ${
                  h.done ? "bg-green" : "bg-yellow"
                }`}
              >
                {h.done ? "✅ Done" : "Pending"}
              </span>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
