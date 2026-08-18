import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/teacher/attendance")({
  head: () => ({
    meta: [
      { title: "Attendance — SmartSlate Teacher" },
      { name: "description", content: "Mark students present, absent or late in a single tap." },
      { property: "og:title", content: "Attendance — SmartSlate Teacher" },
      { property: "og:description", content: "Fast daily attendance for your class." },
    ],
  }),
  component: Attendance,
});

const roster = ["Aanya 🦊", "Vihaan 🐼", "Mira 🐝", "Kabir 🐸", "Ira 🐨", "Dev 🐧"];
const states = ["Present", "Absent", "Late"] as const;
const colors: Record<(typeof states)[number], string> = {
  Present: "bg-green",
  Absent: "bg-orange",
  Late: "bg-yellow",
};

function Attendance() {
  const [marks, setMarks] = useState<Record<string, (typeof states)[number]>>({});
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-extrabold uppercase sm:text-4xl">✅ Attendance</h1>
      <div className="soft-glass rounded-[2rem] p-5">
        <ul className="space-y-3">
          {roster.map((s) => (
            <li key={s} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <span className="truncate font-display text-lg font-extrabold">{s}</span>
              <span className="flex gap-2">
                {states.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setMarks((m) => ({ ...m, [s]: st }))}
                    className={`min-h-11 rounded-full px-4 font-display text-sm font-extrabold uppercase transition-transform active:scale-95 ${
                      marks[s] === st ? colors[st] : "bg-card shadow-soft"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
