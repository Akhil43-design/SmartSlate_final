import { createFileRoute } from "@tanstack/react-router";
import { Calendar, CheckCircle2, Clock, XCircle, Award } from "lucide-react";
import { GlassCard, Script, StarCount } from "@/components/kit";
import { SlateyBubble } from "@/components/Slatey";
import { attendanceDays } from "@/lib/data";

export const Route = createFileRoute("/student/attendance")({
  head: () => ({
    meta: [
      { title: "🏫 My School Days — SmartSlate Attendance" },
      { name: "description", content: "Check your school attendance days, badges, and present record." },
      { property: "og:title", content: "🏫 My School Days — SmartSlate Attendance" },
      { property: "og:description", content: "Simple calendar showing your school days and present status." },
    ],
  }),
  component: AttendancePage,
});

export function AttendancePage() {
  const totalPresent = attendanceDays.filter((d) => d.status === "present").length;

  return (
    <div className="animate-pop-in space-y-8 py-4">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold uppercase sm:text-5xl tracking-tight flex items-center gap-3">
            🏫 My School Days
          </h1>
          <Script className="block text-2xl mt-0.5">Every school day is a new adventure!</Script>
        </div>

        <StarCount value={totalPresent * 10} className="shadow-soft" />
      </div>

      {/* SUMMARY BANNER */}
      <GlassCard className="rounded-[2.5rem] p-6 sm:p-8 bg-gradient-to-r from-green/20 via-card to-yellow/15 shadow-pop border-2 border-green/30">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div>
            <span className="inline-block rounded-full bg-green px-4 py-1.5 font-display text-sm font-extrabold uppercase text-foreground mb-2">
              ATTENDANCE STAR REWARD
            </span>
            <h2 className="font-display text-3xl font-extrabold uppercase">
              You've Been at School ⭐ {totalPresent} Days!
            </h2>
            <p className="font-sans text-base font-semibold text-muted-foreground mt-1">
              Perfect attendance unlocks the <strong>Streak Master 🔥</strong> badge!
            </p>
          </div>

          <div className="flex gap-3">
            <div className="soft-glass rounded-2xl p-4 text-center bg-card">
              <p className="font-display text-2xl font-extrabold text-green">{totalPresent}</p>
              <p className="text-xs font-bold text-muted-foreground uppercase">🟢 Present</p>
            </div>
            <div className="soft-glass rounded-2xl p-4 text-center bg-card">
              <p className="font-display text-2xl font-extrabold text-yellow">1</p>
              <p className="text-xs font-bold text-muted-foreground uppercase">🟡 Late</p>
            </div>
            <div className="soft-glass rounded-2xl p-4 text-center bg-card">
              <p className="font-display text-2xl font-extrabold text-red-500">1</p>
              <p className="text-xs font-bold text-muted-foreground uppercase">🔴 Absent</p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* ATTENDANCE CALENDAR GRID */}
      <section className="space-y-4">
        <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight flex items-center gap-2">
          📅 August School Log
        </h2>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {attendanceDays.map((item, idx) => {
            const isPresent = item.status === "present";
            const isLate = item.status === "late";

            return (
              <GlassCard
                key={idx}
                className={`rounded-[2rem] p-5 text-center transition-all ${
                  isPresent
                    ? "bg-green/15 border-2 border-green/30"
                    : isLate
                    ? "bg-yellow/20 border-2 border-yellow/30"
                    : "bg-red-500/10 border-2 border-red-500/20"
                }`}
              >
                <p className="font-display text-sm font-extrabold uppercase text-muted-foreground">{item.day}</p>
                <p className="font-display text-lg font-extrabold my-1">{item.date}</p>
                {isPresent ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green text-foreground px-3 py-1 font-display text-xs font-extrabold uppercase mt-2">
                    <CheckCircle2 className="size-3.5" /> Present
                  </span>
                ) : isLate ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-yellow text-foreground px-3 py-1 font-display text-xs font-extrabold uppercase mt-2">
                    <Clock className="size-3.5" /> Late
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-500 text-white px-3 py-1 font-display text-xs font-extrabold uppercase mt-2">
                    <XCircle className="size-3.5" /> Absent
                  </span>
                )}
              </GlassCard>
            );
          })}
        </div>
      </section>

      <SlateyBubble mood="happy">
        <span>Great job coming to school every day! Learning with your friends is fun! 🎒</span>
      </SlateyBubble>
    </div>
  );
}
