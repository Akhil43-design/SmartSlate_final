import { createFileRoute } from "@tanstack/react-router";
import { GlassCard } from "@/components/kit";

export const Route = createFileRoute("/parent/results")({
  head: () => ({
    meta: [
      { title: "Quiz Results — SmartSlate Parent" },
      { name: "description", content: "See how your child is doing in recent practice quizzes." },
      { property: "og:title", content: "Quiz Results — SmartSlate Parent" },
      { property: "og:description", content: "Friendly, visual quiz results by subject." },
    ],
  }),
  component: Results,
});

const results = [
  { title: "Counting to 10", subject: "Maths", score: 90, emoji: "🔢" },
  { title: "Animal Sounds", subject: "Science", score: 80, emoji: "🔬" },
  { title: "Rhyming Words", subject: "English", score: 86, emoji: "📚" },
];

function Results() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-extrabold uppercase sm:text-4xl">🎯 Quiz results</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        {results.map((r) => (
          <GlassCard key={r.title} className="rounded-[1.75rem]">
            <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
              <span className="grid size-12 place-items-center rounded-2xl bg-accent text-2xl">{r.emoji}</span>
              <span className="min-w-0">
                <span className="block truncate font-display text-lg font-extrabold">{r.title}</span>
                <span className="block text-sm font-semibold text-muted-foreground">{r.subject}</span>
              </span>
              <span className="rounded-full bg-green px-3 py-1 font-display text-sm font-extrabold">{r.score}%</span>
            </div>
            <div className="mt-3 h-4 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-green" style={{ width: `${r.score}%` }} />
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
