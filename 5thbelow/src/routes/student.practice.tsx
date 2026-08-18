import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Trophy, ArrowRight, RotateCcw } from "lucide-react";
import { BigButton, GlassCard, Script, StarCount } from "@/components/kit";
import { Slatey, SlateyBubble } from "@/components/Slatey";
import { quiz } from "@/lib/data";

export const Route = createFileRoute("/student/practice")({
  head: () => ({
    meta: [
      { title: "🎯 SmartSlate Challenges — Quizzes & Puzzles" },
      { name: "description", content: "Fun picture challenges with star rewards and instant friendly feedback." },
      { property: "og:title", content: "🎯 SmartSlate Challenges — Quizzes & Puzzles" },
      { property: "og:description", content: "Answer picture questions and earn stars." },
    ],
  }),
  component: PracticePage,
});

function PracticePage() {
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [stars, setStars] = useState(0);

  const q = quiz[step];

  if (!q) {
    return (
      <div className="animate-pop-in space-y-6 py-10 text-center max-w-xl mx-auto">
        <Slatey size={150} mood="wow" className="mx-auto animate-float" />
        <div className="soft-glass rounded-[2.5rem] p-8 bg-card shadow-pop">
          <span className="inline-block rounded-full bg-yellow px-4 py-1.5 font-display text-sm font-extrabold uppercase text-foreground mb-2">
            🏆 CHALLENGE COMPLETE!
          </span>
          <h1 className="font-display text-4xl font-extrabold uppercase sm:text-5xl">🎉 Amazing Job!</h1>
          <p className="mt-3 font-display text-2xl font-extrabold text-primary">
            You collected ⭐ {stars * 10} Bonus Stars!
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <BigButton
              color="green"
              className="w-full sm:w-auto"
              onClick={() => {
                setStep(0);
                setPicked(null);
                setStars(0);
              }}
            >
              <RotateCcw className="size-5" /> Play Again
            </BigButton>
            <BigButton to="/student" color="blue" className="w-full sm:w-auto">
              Continue Learning →
            </BigButton>
          </div>
        </div>
      </div>
    );
  }

  const correct = picked === q.answer;

  return (
    <div className="animate-pop-in space-y-6 py-4">
      {/* HEADER BAR */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl font-extrabold uppercase sm:text-5xl tracking-tight">
            🎯 Math & Science Challenge
          </h1>
          <Script className="block text-2xl mt-0.5">Question {step + 1} of {quiz.length}</Script>
        </div>

        <StarCount value={stars * 10} className="shadow-soft" />
      </div>

      {/* QUESTION CARD */}
      <GlassCard className="rounded-[2.5rem] p-8 text-center bg-card shadow-pop border-2 border-primary/15">
        <div className="inline-block rounded-full bg-primary/15 px-4 py-1 font-display text-xs font-extrabold uppercase text-primary mb-3">
          {q.subject || "Puzzle"}
        </div>
        <h2 className="font-display text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-foreground">
          {q.q}
        </h2>
        <p className="mt-6 text-5xl sm:text-7xl leading-relaxed select-none">{q.visual}</p>

        {/* OPTIONS GRID */}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          {q.options.map((o) => {
            const state =
              picked === null
                ? "bg-card hover:bg-primary/10 shadow-soft hover:-translate-y-1"
                : o === q.answer
                ? "bg-green text-foreground scale-105 shadow-pop"
                : o === picked
                ? "bg-orange text-foreground opacity-80"
                : "opacity-40";

            return (
              <button
                key={o}
                type="button"
                disabled={picked !== null}
                onClick={() => {
                  setPicked(o);
                  if (o === q.answer) setStars((s) => s + 1);
                }}
                className={`soft-glass min-h-20 min-w-32 rounded-[2rem] px-8 py-4 font-display text-3xl font-extrabold transition-all duration-200 active:scale-95 border-2 border-border ${state}`}
              >
                {o}
              </button>
            );
          })}
        </div>
      </GlassCard>

      {/* FEEDBACK BUBBLE AND NEXT BUTTON */}
      {picked !== null ? (
        <div className="space-y-4 animate-pop-in">
          <SlateyBubble mood={correct ? "happy" : "wow"}>
            {correct ? "🎉 Great job! You earned ⭐ +10 Stars!" : "Good try! 💪 Let's see the next puzzle."}
          </SlateyBubble>

          <div className="text-right">
            <BigButton
              color="blue"
              className="min-h-16 px-10 text-xl shadow-pop"
              onClick={() => {
                setStep((s) => s + 1);
                setPicked(null);
              }}
            >
              NEXT QUESTION 🚀
            </BigButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}

