import { createFileRoute } from "@tanstack/react-router";
import { Trophy, Star, Flame, Award, CheckCircle } from "lucide-react";
import { GlassCard, Script, StarCount, StreakCount, tone, toneSoft } from "@/components/kit";
import { Slatey, SlateyBubble } from "@/components/Slatey";
import { subjects, badges, kids } from "@/lib/data";

export const Route = createFileRoute("/student/progress")({
  head: () => ({
    meta: [
      { title: "🏆 My Progress — SmartSlate Achievements" },
      { name: "description", content: "Track your stars, badges, streak, and learning achievements." },
      { property: "og:title", content: "🏆 My Progress — SmartSlate Achievements" },
      { property: "og:description", content: "Visual progress dashboard with star ratings and unlocked badges." },
    ],
  }),
  component: ProgressPage,
});

function ProgressPage() {
  const student = kids[0]!;

  return (
    <div className="animate-pop-in space-y-8 py-4">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold uppercase sm:text-5xl tracking-tight flex items-center gap-3">
            🏆 My Progress & Badges
          </h1>
          <Script className="block text-2xl mt-0.5">Keep learning & collect badges!</Script>
        </div>

        <div className="flex items-center gap-2">
          <StarCount value={student.stars} className="shadow-soft" />
          <StreakCount value={student.streak} className="shadow-soft" />
        </div>
      </div>

      {/* OVERALL LEARNING PROGRESS CARD */}
      <GlassCard className="rounded-[2.5rem] p-6 sm:p-8 bg-gradient-to-r from-primary/10 via-card to-purple/15 shadow-pop border-2 border-primary/20">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <Slatey size={96} mood="happy" className="animate-float shrink-0" />
            <div>
              <span className="inline-block rounded-full bg-primary px-3.5 py-1 font-display text-xs font-extrabold uppercase text-primary-foreground mb-1">
                OVERALL LEVEL
              </span>
              <h2 className="font-display text-3xl font-extrabold uppercase">Grade 3 Star Scholar 🌟</h2>
              <p className="font-sans text-sm font-semibold text-muted-foreground">
                You have completed 80% of your weekly learning goals!
              </p>
            </div>
          </div>

          <div className="w-full sm:w-64 space-y-2 text-right">
            <div className="flex justify-between font-display text-base font-extrabold uppercase">
              <span>Progress</span>
              <span className="text-primary">80%</span>
            </div>
            <div className="h-6 w-full overflow-hidden rounded-full bg-muted/80 p-1 shadow-inner">
              <div className="h-full rounded-full bg-gradient-to-r from-primary via-green to-yellow transition-all duration-500" style={{ width: "80%" }} />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* SUBJECT STAR RATINGS */}
      <section className="space-y-4">
        <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight flex items-center gap-2">
          📚 Subject Mastery & Stars
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((sub) => (
            <GlassCard key={sub.id} className={`rounded-[2rem] p-5 flex flex-col justify-between ${toneSoft[sub.color]}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={`grid size-14 place-items-center rounded-2xl text-3xl ${tone[sub.color]}`}>
                    {sub.emoji}
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-extrabold uppercase">{sub.name}</h3>
                    <p className="text-xs font-semibold text-muted-foreground">{sub.notes} Notes Completed</p>
                  </div>
                </div>
                <span className="font-display text-sm font-extrabold text-foreground bg-card px-3 py-1 rounded-full shadow-xs">
                  ⭐ {sub.stars}
                </span>
              </div>

              {/* STAR RATING DISPLAY */}
              <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                <div className="flex text-yellow text-xl">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i}>{i < sub.rating ? "★" : "☆"}</span>
                  ))}
                </div>
                <span className="font-display text-xs font-extrabold uppercase text-muted-foreground">
                  Mastery Level {sub.rating}/5
                </span>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* BADGES WALL */}
      <section className="space-y-4">
        <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight flex items-center gap-2">
          🏅 My Unlocked Badges ({badges.length})
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {badges.map((b) => (
            <GlassCard key={b.id} className={`rounded-[2rem] p-5 text-center transition-transform hover:-translate-y-1 ${toneSoft[b.color]}`}>
              <span className="text-5xl inline-block mb-2">{b.emoji}</span>
              <h3 className="font-display text-xl font-extrabold uppercase tracking-tight">{b.title}</h3>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">{b.desc}</p>
              <div className="mt-3">
                <span className="inline-flex items-center gap-1 rounded-full bg-card px-3 py-1 font-display text-xs font-extrabold uppercase text-foreground shadow-xs">
                  <CheckCircle className="size-3.5 text-green" /> Unlocked
                </span>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* STREAK & MOTIVATION BUBBLE */}
      <SlateyBubble mood="happy">
        <span>You are on a 🔥 5-Day Learning Streak! Keep coming back every day to earn more badges!</span>
      </SlateyBubble>
    </div>
  );
}
