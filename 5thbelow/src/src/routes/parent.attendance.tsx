import { createFileRoute } from "@tanstack/react-router";
import { GlassCard } from "@/components/kit";

export const Route = createFileRoute("/parent/attendance")({
  head: () => ({
    meta: [
      { title: "Attendance — SmartSlate Parent" },
      { name: "description", content: "See your child's daily attendance for the month at a glance." },
      { property: "og:title", content: "Attendance — SmartSlate Parent" },
      { property: "og:description", content: "A calendar view of present, late and absent days." },
    ],
  }),
  component: ParentAttendance,
});

const days = Array.from({ length: 24 }, (_, i) => (i % 9 === 4 ? "late" : i % 11 === 7 ? "absent" : "present"));

function ParentAttendance() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-extrabold uppercase sm:text-4xl">✅ Attendance</h1>
      <GlassCard className="rounded-[2rem]">
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
          {days.map((d, i) => (
            <span
              key={i}
              title={d}
              className={`grid aspect-square place-items-center rounded-2xl font-display text-sm font-extrabold ${
                d === "present" ? "bg-green" : d === "late" ? "bg-yellow" : "bg-orange"
              }`}
            >
              {i + 1}
            </span>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-3 font-display text-sm font-extrabold uppercase">
          <span className="rounded-full bg-green px-3 py-1">Present 22</span>
          <span className="rounded-full bg-yellow px-3 py-1">Late 1</span>
          <span className="rounded-full bg-orange px-3 py-1">Absent 1</span>
        </div>
      </GlassCard>
    </div>
  );
}
