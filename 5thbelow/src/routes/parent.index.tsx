import { createFileRoute } from "@tanstack/react-router";
import { Plus, ShieldCheck, CheckCircle2, User, Key, ArrowRight, X } from "lucide-react";
import { useState } from "react";
import { GlassCard, BigButton } from "@/components/kit";
import { Slatey } from "@/components/Slatey";
import { getLinkedStudentsForParent, linkStudentToParent, getCurrentUser, type StudentRecord } from "@/lib/authService";

export const Route = createFileRoute("/parent/")({
  head: () => ({
    meta: [
      { title: "Parent Portal — SmartSlate" },
      { name: "description", content: "See your linked child's stars, homework, quiz results and attendance in one view." },
      { property: "og:title", content: "Parent Portal — SmartSlate" },
      { property: "og:description", content: "A secure, linked snapshot of your child's learning." },
    ],
  }),
  component: ParentHome,
});

function ParentHome() {
  const parentUser = getCurrentUser();
  const [linkedStudents, setLinkedStudents] = useState<StudentRecord[]>(() => getLinkedStudentsForParent());
  const [selectedStudentIndex, setSelectedStudentIndex] = useState(0);

  // Link Child Modal State
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [inputCode, setInputCode] = useState("");
  const [linkResult, setLinkResult] = useState<string | null>(null);

  const activeChild = linkedStudents[selectedStudentIndex] || linkedStudents[0];

  const handleLinkChild = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim() || !parentUser) return;
    const res = linkStudentToParent(parentUser.uid, inputCode);
    setLinkResult(res.message);
    if (res.success && res.student) {
      setLinkedStudents(getLinkedStudentsForParent(parentUser.uid));
      setTimeout(() => {
        setShowLinkModal(false);
        setLinkResult(null);
        setInputCode("");
      }, 1500);
    }
  };

  const cards = [
    { label: "Stars Collected", value: `${activeChild?.stars || 120}`, emoji: "⭐", bar: 85, color: "bg-yellow" },
    { label: "Homework Progress", value: "3 / 4", emoji: "📚", bar: 75, color: "bg-blue" },
    { label: "Quiz Accuracy", value: "92%", emoji: "🎯", bar: 92, color: "bg-green" },
    { label: "Class Attendance", value: "22 / 24", emoji: "✅", bar: 95, color: "bg-purple" },
  ];

  return (
    <div className="space-y-6 animate-pop-in">
      {/* 1. PARENT WELCOME & CHILD SWITCHER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-900 px-3 py-0.5 font-display text-xs font-extrabold uppercase mb-1">
            <ShieldCheck className="size-3.5 text-emerald-700" /> Secure Parent Portal
          </span>
          <h1 className="font-display text-3xl font-extrabold uppercase sm:text-4xl tracking-tight">
            👨‍👩‍👧 Welcome, {parentUser?.displayName || "Anjali Sharma"}!
          </h1>
          <p className="text-sm font-semibold text-muted-foreground mt-0.5">
            Viewing real-time updates for your linked child
          </p>
        </div>

        <BigButton color="green" onClick={() => setShowLinkModal(true)} className="min-h-12 px-5 text-sm shadow-soft">
          <Plus className="size-4" /> Link Another Child 🔑
        </BigButton>
      </div>

      {/* 2. LINKED CHILD CARD */}
      {activeChild ? (
        <GlassCard className="rounded-[2.5rem] p-6 bg-card border-2 border-emerald-200 shadow-soft">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
            <div className="flex items-center gap-4">
              <span className="grid size-16 place-items-center rounded-2xl bg-orange/20 text-4xl shadow-xs">
                {activeChild.avatar || "🦊"}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-2xl font-extrabold uppercase text-foreground">
                    {activeChild.fullName}
                  </h2>
                  <span className="rounded-full bg-emerald-100 text-emerald-900 px-2.5 py-0.5 text-xs font-extrabold font-mono">
                    {activeChild.studentCode}
                  </span>
                </div>
                <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                  {activeChild.grade} · Section {activeChild.section} · {activeChild.schoolName}
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-green/15 text-green-900 px-3.5 py-1 text-xs font-extrabold uppercase">
              <CheckCircle2 className="size-4 text-green" /> Authenticated Child
            </span>
          </div>

          {/* 4 STAT TILES */}
          <div className="grid gap-4 sm:grid-cols-2 mt-5">
            {cards.map((c) => (
              <div key={c.label} className="rounded-2xl bg-accent/60 p-4 border border-border">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-display text-xs font-extrabold uppercase text-muted-foreground">{c.label}</p>
                  <span className="text-xl">{c.emoji}</span>
                </div>
                <p className="mt-1 font-display text-2xl font-extrabold">{c.value}</p>
                <div className="mt-2.5 h-3 w-full overflow-hidden rounded-full bg-muted">
                  <div className={`h-full rounded-full ${c.color}`} style={{ width: `${c.bar}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* NOTICE */}
          <div className="mt-5 flex items-center gap-3 rounded-2xl bg-yellow/20 p-4 border border-yellow/30">
            <span className="text-2xl">📢</span>
            <p className="text-xs font-bold text-yellow-950">
              <strong>Teacher Note from Ms. Priya Sharma:</strong> {activeChild.fullName} completed all math notebook exercises with full stars today! 🌟
            </p>
          </div>
        </GlassCard>
      ) : (
        <div className="text-center p-8 rounded-[2.5rem] bg-card border-2 border-dashed border-muted">
          <p className="font-display text-base font-bold text-muted-foreground">
            No child currently linked. Click the button above to enter a Student Code.
          </p>
        </div>
      )}

      {/* 3. LINK CHILD MODAL */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-[2.5rem] bg-card p-6 shadow-pop animate-pop-in">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="font-display text-xl font-extrabold uppercase flex items-center gap-2">
                🔑 Link Student via Code
              </h2>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="grid size-9 place-items-center rounded-full bg-accent hover:bg-accent/80"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleLinkChild} className="mt-4 space-y-4">
              <div>
                <label className="block font-display text-xs font-extrabold uppercase text-foreground mb-1">
                  Child's Student Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. STU-AARAV5A or STU-ANANYA5A"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  className="w-full rounded-xl bg-accent px-4 py-3 font-display text-lg font-extrabold uppercase tracking-wider outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] font-semibold text-muted-foreground mt-1.5">
                  🛡️ This code is available on your child's SmartSlate profile screen.
                </p>
              </div>

              {linkResult && (
                <div className="p-3 rounded-xl bg-accent font-display text-xs font-extrabold text-center">
                  {linkResult}
                </div>
              )}

              <div className="pt-2">
                <BigButton color="green" type="submit" className="w-full min-h-12 text-sm">
                  Verify & Link Child → 🎒
                </BigButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
