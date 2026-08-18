import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Clock, CheckCircle2, BookOpen, X, Send, Sparkles, AlertCircle } from "lucide-react";
import { BigButton, GlassCard, tone, toneSoft } from "@/components/kit";
import { initialHomework, type HomeworkItem } from "@/lib/data";

export const Route = createFileRoute("/student/homework")({
  head: () => ({
    meta: [
      { title: "My Work — SmartSlate" },
      { name: "description", content: "School assignments, pending work, and submitted tasks." },
      { property: "og:title", content: "My Work — SmartSlate" },
      { property: "og:description", content: "Check your homework tasks and submit your solutions." },
    ],
  }),
  component: HomeworkPage,
});

function HomeworkPage() {
  const [items, setItems] = useState<HomeworkItem[]>(() => {
    try {
      const saved = localStorage.getItem("smartslate-homework");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return initialHomework;
  });

  const [activeTab, setActiveTab] = useState<"All" | "To Do" | "In Progress" | "Completed">("All");
  const [selectedTask, setSelectedTask] = useState<HomeworkItem | null>(null);
  const [studentAnswer, setStudentAnswer] = useState("");
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("smartslate-homework", JSON.stringify(items));
    } catch (e) {
      console.error(e);
    }
  }, [items]);

  const handleOpenTask = (item: HomeworkItem) => {
    setSelectedTask(item);
    setStudentAnswer(item.submission || "");

    // If task was "To Do", moving to "In Progress" when opened
    if (item.status === "To Do") {
      setItems((prev) =>
        prev.map((hw) => (hw.id === item.id ? { ...hw, status: "In Progress" } : hw))
      );
    }
  };

  const handleSaveDraft = () => {
    if (!selectedTask) return;
    setItems((prev) =>
      prev.map((hw) =>
        hw.id === selectedTask.id
          ? { ...hw, status: "In Progress", submission: studentAnswer }
          : hw
      )
    );
    setSelectedTask(null);
  };

  const handleSubmitWork = () => {
    if (!selectedTask) return;
    setItems((prev) =>
      prev.map((hw) =>
        hw.id === selectedTask.id
          ? { ...hw, status: "Completed", submission: studentAnswer || "Submitted on SmartSlate" }
          : hw
      )
    );
    setSelectedTask(null);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const filteredItems = items.filter((i) => (activeTab === "All" ? true : i.status === activeTab));

  const counts = {
    toDo: items.filter((i) => i.status === "To Do").length,
    inProgress: items.filter((i) => i.status === "In Progress").length,
    completed: items.filter((i) => i.status === "Completed").length,
  };

  return (
    <div className="animate-pop-in space-y-6 py-2">
      {/* HEADER SECTION */}
      <div>
        <h1 className="font-display text-4xl font-extrabold uppercase sm:text-5xl tracking-tight">
          ✏️ My Work
        </h1>
        <p className="font-sans text-base font-bold text-muted-foreground mt-1">
          Open your assignments, complete your work, and submit to your teacher
        </p>
      </div>

      {/* SUCCESS SUBMISSION TOAST */}
      {showSuccessToast ? (
        <div className="rounded-2xl bg-green/20 border-2 border-green/40 p-4 font-display text-base font-extrabold text-green-900 flex items-center gap-3 animate-pop-in">
          <CheckCircle2 className="size-6 text-green" />
          <span>🎉 Assignment Submitted Successfully to Ms. Priya!</span>
        </div>
      ) : null}

      {/* STATUS CATEGORY TABS */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { label: "All", emoji: "📋", count: items.length },
          { label: "To Do", emoji: "🟡", count: counts.toDo },
          { label: "In Progress", emoji: "🔵", count: counts.inProgress },
          { label: "Completed", emoji: "🟢", count: counts.completed },
        ].map((tab) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => setActiveTab(tab.label as any)}
            className={`soft-glass flex items-center gap-2 rounded-full px-5 py-2.5 font-display text-sm font-extrabold uppercase transition-all ${
              activeTab === tab.label
                ? "bg-primary text-primary-foreground shadow-soft scale-105"
                : "bg-card hover:bg-accent text-muted-foreground"
            }`}
          >
            <span>{tab.emoji}</span>
            <span>{tab.label}</span>
            <span className="rounded-full bg-card/50 px-2 py-0.5 text-xs font-bold">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ASSIGNMENTS GRID */}
      <div className="grid gap-5 sm:grid-cols-2">
        {filteredItems.map((h) => {
          const isDone = h.status === "Completed";
          const isInProgress = h.status === "In Progress";

          return (
            <GlassCard
              key={h.id}
              className={`rounded-[2.25rem] p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-pop flex flex-col justify-between border-2 border-card bg-card`}
            >
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className={`grid size-14 shrink-0 place-items-center rounded-2xl text-3xl ${tone[h.color]}`}>
                    {h.emoji}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 font-display text-xs font-extrabold uppercase ${
                      isDone
                        ? "bg-green/15 text-green-800"
                        : isInProgress
                        ? "bg-blue/15 text-blue-800"
                        : "bg-yellow/20 text-yellow-900"
                    }`}
                  >
                    {isDone ? "🟢 Completed" : isInProgress ? "🔵 In Progress" : "🟡 To Do"}
                  </span>
                </div>

                <h3 className="mt-4 font-display text-2xl font-extrabold uppercase tracking-tight">{h.title}</h3>
                <p className="mt-1 font-sans text-xs font-bold text-muted-foreground uppercase">{h.subject}</p>
                <p className="mt-2 font-sans text-sm font-semibold text-foreground/80 line-clamp-2">{h.description}</p>
                <p className="mt-2 font-sans text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Clock className="size-3.5 text-primary" /> {h.due}
                </p>
              </div>

              {/* CARD FOOTER ACTIONS */}
              <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-between gap-3">
                {isDone ? (
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold text-green-700">✓ Submitted</span>
                    <button
                      type="button"
                      onClick={() => handleOpenTask(h)}
                      className="rounded-full bg-accent px-4 py-1.5 font-display text-xs font-extrabold uppercase hover:bg-accent/80"
                    >
                      Review Work 📄
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold text-muted-foreground">{h.due}</span>
                    <BigButton
                      color={isInProgress ? "blue" : "blue"}
                      className="min-h-11 px-6 text-sm shadow-soft"
                      onClick={() => handleOpenTask(h)}
                    >
                      {isInProgress ? "Continue ✏️" : "Open 🚀"}
                    </BigButton>
                  </div>
                )}
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* INTERACTIVE ASSIGNMENT DETAILS MODAL */}
      {selectedTask ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/50 p-4 backdrop-blur-xs">
          <div className="soft-glass w-full max-w-xl rounded-[2.5rem] bg-card p-6 sm:p-7 shadow-pop animate-pop-in max-h-[90vh] overflow-y-auto">
            {/* MODAL HEADER */}
            <div className="flex items-start justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-3">
                <span className={`grid size-12 place-items-center rounded-2xl text-2xl ${tone[selectedTask.color]}`}>
                  {selectedTask.emoji}
                </span>
                <div>
                  <span className="text-xs font-extrabold uppercase text-muted-foreground">{selectedTask.subject}</span>
                  <h2 className="font-display text-2xl font-extrabold uppercase">{selectedTask.title}</h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="grid size-10 place-items-center rounded-full bg-accent hover:bg-accent/80"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* ASSIGNMENT INSTRUCTIONS & QUESTIONS */}
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl bg-accent/60 p-4">
                <p className="font-display text-xs font-extrabold uppercase text-muted-foreground mb-1">
                  📋 Instructions
                </p>
                <p className="font-sans text-sm font-bold">{selectedTask.description}</p>
              </div>

              {selectedTask.questions && selectedTask.questions.length > 0 ? (
                <div className="space-y-2">
                  <p className="font-display text-xs font-extrabold uppercase text-muted-foreground">
                    ❓ Questions to Answer
                  </p>
                  <ul className="space-y-1.5 pl-2">
                    {selectedTask.questions.map((q, idx) => (
                      <li key={idx} className="font-sans text-sm font-bold text-foreground">
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {/* STUDENT ANSWER TEXTAREA */}
              <div>
                <label className="block font-display text-xs font-extrabold uppercase text-muted-foreground mb-1">
                  ✏️ Write Your Answer / Solution:
                </label>
                <textarea
                  rows={4}
                  value={studentAnswer}
                  onChange={(e) => setStudentAnswer(e.target.value)}
                  placeholder="Type your answers here or write them in your notebook..."
                  className="w-full rounded-2xl border-2 border-border bg-background p-4 font-sans text-sm font-bold outline-none focus:border-primary"
                />
              </div>

              {/* OPTIONAL NOTEBOOK LINK */}
              <div className="flex items-center justify-between rounded-2xl bg-blue/10 p-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="size-5 text-primary" />
                  <span className="font-sans text-xs font-bold">Need your drawing notebook?</span>
                </div>
                <Link
                  to="/student/notes/$id"
                  params={{ id: selectedTask.subject.toLowerCase().includes("math") ? "maths" : selectedTask.subject.toLowerCase().includes("science") ? "science" : "english" }}
                  className="rounded-full bg-primary text-primary-foreground px-3 py-1 font-display text-xs font-extrabold uppercase"
                >
                  Open Notebook 📖
                </Link>
              </div>

              {/* ACTION BUTTONS: SAVE DRAFT OR SUBMIT */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
                <BigButton color="ghost" onClick={() => setSelectedTask(null)} className="w-full sm:w-auto min-h-12 px-5 text-sm">
                  Close
                </BigButton>
                <BigButton color="blue" onClick={handleSaveDraft} className="w-full sm:w-auto min-h-12 px-5 text-sm">
                  Save Draft 💾
                </BigButton>
                <BigButton color="green" onClick={handleSubmitWork} className="w-full sm:w-auto min-h-12 px-6 text-sm">
                  <Send className="size-4" /> Submit Work ✅
                </BigButton>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}


