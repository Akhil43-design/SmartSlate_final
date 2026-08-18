import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, LogOut, Settings, Award, Flame, Star, CheckCircle, Copy, Volume2, Shield, QrCode } from "lucide-react";
import { useState } from "react";
import { GlassCard, BigButton, tone, toneSoft } from "@/components/kit";
import { badges, subjects } from "@/lib/data";
import { getCurrentStudentRecord } from "@/lib/authService";

export const Route = createFileRoute("/student/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — SmartSlate" },
      { name: "description", content: "See your student profile, stars, badges, learning progress, and settings." },
      { property: "og:title", content: "My Profile — SmartSlate" },
      { property: "og:description", content: "Your stars, badges, and progress in one dedicated place." },
    ],
  }),
  component: Profile,
});

import { subscribeToAuthChanges } from "@/lib/firebaseAuth";
import { logoutFirebaseUser } from "@/firebase/auth";
import { getStudent, type FirestoreStudent } from "@/firebase/services/studentService";
import { useEffect } from "react";

function Profile() {
  const [student, setStudent] = useState<any>(() => getCurrentStudentRecord());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsub = subscribeToAuthChanges(async (user) => {
      if (user) {
        const profile = await getStudent(user.uid);
        if (profile) {
          setStudent({
            fullName: profile.name || (profile as any).fullName || "Student",
            grade: profile.grade ? `Grade ${profile.grade}` : "Grade 5",
            section: profile.section || "A",
            schoolName: profile.schoolName || "SmartSlate Primary",
            studentCode: profile.studentCode || `STU-${user.uid.slice(0, 5).toUpperCase()}`,
            avatar: profile.avatar || "🦊",
          });
        }
      }
    });
    return () => unsub();
  }, []);

  const currentStudent = student || {
    fullName: "Student",
    grade: "Grade 5",
    section: "A",
    schoolName: "SmartSlate Primary",
    studentCode: "STU-000",
    avatar: "🦊",
  };

  const copyCode = () => {
    navigator.clipboard.writeText(currentStudent.studentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-pop-in space-y-6 py-2">
      {/* 1. STUDENT IDENTITY CARD */}
      <GlassCard className="rounded-[2.5rem] p-7 text-center bg-card shadow-soft border-2 border-primary/20">
        <div className="relative mx-auto size-28">
          <span className="grid size-28 place-items-center rounded-full bg-orange/20 text-6xl shadow-xs">
            {currentStudent.avatar || "🦊"}
          </span>
          <span className="absolute bottom-0 right-0 grid size-8 place-items-center rounded-full bg-green text-white text-xs font-bold border-2 border-card">
            ✓
          </span>
        </div>

        <h1 className="mt-4 font-display text-4xl font-extrabold uppercase tracking-tight">
          {currentStudent.fullName}
        </h1>
        <p className="font-sans text-base font-bold text-muted-foreground">
          {currentStudent.grade} · Section {currentStudent.section} · {currentStudent.schoolName}
        </p>

        {/* UNIQUE STUDENT CODE FOR PARENT LINKING */}
        <div className="mt-4 inline-flex flex-col sm:flex-row items-center gap-2 rounded-2xl bg-primary/10 border-2 border-primary/30 px-5 py-2.5">
          <span className="font-display text-xs font-extrabold uppercase text-primary">
            Student Code:
          </span>
          <span className="font-display text-lg font-black tracking-wider text-foreground">
            {student.studentCode}
          </span>
          <button
            type="button"
            onClick={copyCode}
            className="flex items-center gap-1 text-xs font-extrabold uppercase text-primary hover:underline bg-card px-2.5 py-1 rounded-xl shadow-xs"
          >
            {copied ? <CheckCircle className="size-3.5 text-green" /> : <Copy className="size-3.5" />}
            <span>{copied ? "Copied!" : "Copy"}</span>
          </button>
        </div>
      </GlassCard>


      {/* 2. MY ACHIEVEMENTS (CENTRALIZED METRICS) */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight flex items-center gap-2">
          🏆 My Achievements
        </h2>

        {/* 3 STAT TILES */}
        <div className="grid gap-4 sm:grid-cols-3">
          <GlassCard className="rounded-[2.25rem] p-5 text-center bg-yellow/15 border-2 border-yellow/25">
            <span className="text-4xl">⭐</span>
            <h3 className="mt-2 font-display text-3xl font-extrabold text-foreground">{student.stars}</h3>
            <p className="font-display text-xs font-extrabold uppercase text-muted-foreground">Total Stars Earned</p>
          </GlassCard>

          <GlassCard className="rounded-[2.25rem] p-5 text-center bg-orange/15 border-2 border-orange/25">
            <span className="text-4xl">🔥</span>
            <h3 className="mt-2 font-display text-3xl font-extrabold text-foreground">{student.streak} Days</h3>
            <p className="font-display text-xs font-extrabold uppercase text-muted-foreground">Learning Streak</p>
          </GlassCard>

          <GlassCard className="rounded-[2.25rem] p-5 text-center bg-green/15 border-2 border-green/25">
            <span className="text-4xl">📊</span>
            <h3 className="mt-2 font-display text-3xl font-extrabold text-foreground">{student.progressPercent}%</h3>
            <p className="font-display text-xs font-extrabold uppercase text-muted-foreground">Overall School Progress</p>
          </GlassCard>
        </div>

        {/* UNLOCKED BADGES GRID */}
        <GlassCard className="rounded-[2.5rem] p-6 bg-card border-2 border-card">
          <h3 className="font-display text-lg font-extrabold uppercase mb-4 flex items-center gap-2">
            🏅 Unlocked Badges ({badges.length})
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {badges.map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-3 rounded-2xl p-3 bg-accent/60 transition-transform hover:scale-102"
              >
                <span className="text-3xl shrink-0">{b.emoji}</span>
                <div className="min-w-0">
                  <p className="font-display text-sm font-extrabold uppercase truncate">{b.title}</p>
                  <p className="font-sans text-xs font-semibold text-muted-foreground line-clamp-1">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* SUBJECT LEARNING PROGRESS */}
        <GlassCard className="rounded-[2.5rem] p-6 bg-card border-2 border-card">
          <h3 className="font-display text-lg font-extrabold uppercase mb-4 flex items-center gap-2">
            📚 Subject Progress
          </h3>
          <div className="space-y-4">
            {subjects.map((sub, idx) => {
              const pct = [85, 90, 80, 70, 95][idx] || 80;
              return (
                <div key={sub.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm font-bold">
                    <span className="flex items-center gap-2">
                      <span>{sub.emoji}</span>
                      <span>{sub.name}</span>
                    </span>
                    <span className="text-muted-foreground">{pct}%</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-accent overflow-hidden">
                    <div
                      className={`h-full rounded-full ${tone[sub.color]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </section>

      {/* 3. SETTINGS & PREFERENCES */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight flex items-center gap-2">
          ⚙️ Settings
        </h2>

        <GlassCard className="rounded-[2.25rem] p-6 bg-card border-2 border-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="size-5 text-primary" />
              <div>
                <p className="font-display text-sm font-extrabold uppercase">Sound Effects</p>
                <p className="font-sans text-xs font-semibold text-muted-foreground">Play gentle audio on button clicks</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`rounded-full px-4 py-1.5 font-display text-xs font-extrabold uppercase transition-colors ${
                soundEnabled ? "bg-green text-green-950" : "bg-accent text-muted-foreground"
              }`}
            >
              {soundEnabled ? "ON" : "OFF"}
            </button>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border/60">
            <div className="flex items-center gap-3">
              <Shield className="size-5 text-green" />
              <div>
                <p className="font-display text-sm font-extrabold uppercase">Parent & Teacher Lock</p>
                <p className="font-sans text-xs font-semibold text-muted-foreground">Safe browsing is always active</p>
              </div>
            </div>
            <span className="rounded-full bg-green/15 text-green-800 px-3 py-1 font-display text-xs font-extrabold uppercase">
              Active ✓
            </span>
          </div>
        </GlassCard>
      </section>

      {/* 4. LOG OUT / SWITCH PROFILE */}
      <div className="pt-2">
        <button
          onClick={async () => {
            if (typeof logoutFirebaseUser === "function") {
              await logoutFirebaseUser();
            }
            const host = (typeof window !== "undefined" && window.location.hostname) ? window.location.hostname : "localhost";
            const proto = (typeof window !== "undefined" && window.location.protocol) ? window.location.protocol : "http:";
            window.location.replace(`${proto}//${host}:3000`);
          }}
          className="soft-glass flex w-full items-center justify-center gap-2 rounded-[2rem] p-4 text-center font-display text-base font-extrabold uppercase text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
        >
          <LogOut className="size-5" /> Switch Student Profile / Sign Out
        </button>
      </div>
    </div>
  );
}

