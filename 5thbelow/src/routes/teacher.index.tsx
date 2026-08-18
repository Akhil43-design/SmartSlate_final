import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, CheckSquare, Pencil, Target, Plus, School, Award, Sparkles } from "lucide-react";
import { useState } from "react";
import { StatCard } from "./teacher";
import { GlassCard, BigButton } from "@/components/kit";
import { getStudentsForTeacher, getCurrentUser } from "@/lib/authService";
import { teacherInfo } from "@/lib/data";

export const Route = createFileRoute("/teacher/")({
  head: () => ({
    meta: [
      { title: "Teacher Dashboard — SmartSlate" },
      { name: "description", content: "Track students, attendance, homework and quiz activity at a glance." },
      { property: "og:title", content: "Teacher Dashboard — SmartSlate" },
      { property: "og:description", content: "A clear overview of your class in SmartSlate." },
    ],
  }),
  component: TeacherHome,
});

function TeacherHome() {
  const teacherUser = getCurrentUser();
  const students = getStudentsForTeacher();

  return (
    <div className="space-y-6 animate-pop-in">
      {/* 1. TEACHER WELCOME HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="inline-block rounded-full bg-purple-100 text-purple-900 px-3 py-0.5 font-display text-xs font-extrabold uppercase mb-1">
            Teacher Portal · Grade 5-A
          </span>
          <h1 className="font-display text-3xl font-extrabold uppercase sm:text-4xl tracking-tight">
            📊 Welcome, {teacherUser?.displayName || "Ms. Priya Sharma"}!
          </h1>
          <p className="text-sm font-semibold text-muted-foreground mt-0.5">
            Delhi Public School, R.K. Puram · Mathematics & Science
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/teacher/homework"
            className="flex items-center gap-1.5 rounded-2xl bg-purple-600 text-white px-4 py-2.5 font-display text-xs font-extrabold uppercase shadow-soft hover:bg-purple-700 transition-colors"
          >
            <Plus className="size-4" /> Create Task
          </Link>
        </div>
      </div>

      {/* 2. STATS TILES */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Enrolled Students" value={String(students.length)} emoji="👧" icon={Users} />
        <StatCard label="Present Today" value={String(Math.max(1, students.length - 1))} emoji="✅" icon={CheckSquare} />
        <StatCard label="Homework Due" value="3" emoji="✏️" icon={Pencil} />
        <StatCard label="Live Quizzes" value="2" emoji="🎯" icon={Target} />
      </div>

      {/* 3. ENROLLED STUDENTS LIST (FROM SHARED FIRESTORE) */}
      <section className="soft-glass rounded-[2rem] p-6 bg-card border-2 border-purple-100 shadow-soft">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h2 className="font-display text-xl font-extrabold uppercase">
              👧 Students in Grade 5-A ({students.length})
            </h2>
            <p className="text-xs font-semibold text-muted-foreground">Connected via shared Firestore database</p>
          </div>
          <span className="rounded-full bg-accent px-3 py-1 font-display text-xs font-extrabold uppercase">
            Section A
          </span>
        </div>

        <ul className="mt-4 divide-y divide-border/60">
          {students.map((s) => (
            <li key={s.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 py-3.5 hover:bg-accent/40 rounded-xl px-2 transition-colors">
              <span className="grid size-12 place-items-center rounded-2xl bg-orange/15 text-2xl shadow-xs">
                {s.avatar || "🦊"}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display text-base font-extrabold text-foreground">{s.fullName}</span>
                  <span className="font-mono text-[11px] font-bold bg-muted px-2 py-0.5 rounded text-muted-foreground">
                    {s.studentCode}
                  </span>
                </div>
                <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                  {s.grade} · {s.schoolName}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-yellow/40 text-yellow-950 px-3 py-1 font-display text-xs font-extrabold flex items-center gap-1">
                  ⭐ {s.stars || 100}
                </span>
                <span className="rounded-full bg-green/20 text-green-900 px-2.5 py-1 font-display text-xs font-extrabold">
                  Active 📱
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* 4. CLASS ANNOUNCEMENTS */}
      <section className="soft-glass rounded-[2rem] p-6 bg-card border-2 border-yellow/20 shadow-soft">
        <h2 className="font-display text-xl font-extrabold uppercase mb-3 flex items-center gap-2">
          📢 Teacher Announcements
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {teacherInfo.announcements.map((a) => (
            <div key={a.id} className="rounded-2xl bg-accent/70 p-4 border border-border">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{a.emoji}</span>
                <span className="font-display text-sm font-extrabold uppercase">{a.title}</span>
              </div>
              <p className="text-xs font-semibold text-muted-foreground">{a.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
