import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BookOpen, Pencil, Users, Clock, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { BigButton, GlassCard, tone } from "@/components/kit";
import { SlateyBubble } from "@/components/Slatey";
import { initialHomework, teacherInfo, type Subject } from "@/lib/data";
import { getAllBooks, saveCustomBook } from "@/lib/notebookStorage";
import { Bookshelf } from "@/components/DigitalBook";

export const Route = createFileRoute("/student/")({
  head: () => ({
    meta: [
      { title: "Home — SmartSlate Kids" },
      { name: "description", content: "Your digital school notebooks, assignments, and classroom." },
      { property: "og:title", content: "Home — SmartSlate Kids" },
      { property: "og:description", content: "Open your books, see your work, and read teacher news." },
    ],
  }),
  component: StudentHome,
});

export function StudentHome() {
  const [allBooks, setAllBooks] = useState<Subject[]>([]);
  const [openingSubject, setOpeningSubject] = useState<Subject | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBookName, setNewBookName] = useState("");
  const [newBookEmoji, setNewBookEmoji] = useState("📖");

  const navigate = useNavigate();

  useEffect(() => {
    setAllBooks(getAllBooks());
  }, []);

  const handleOpenBook = (subject: Subject) => {
    setOpeningSubject(subject);
    setTimeout(() => {
      navigate({ to: "/student/notes/$id", params: { id: subject.id } });
    }, 700);
  };

  const handleCreateBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookName.trim()) return;
    const newSub: Subject = {
      id: newBookName.toLowerCase().replace(/\s+/g, "-"),
      name: newBookName,
      desc: "My School Notebook",
      emoji: newBookEmoji,
      icon: BookOpen,
      color: "purple",
      notes: 3,
    };
    const updated = saveCustomBook(newSub);
    setAllBooks(updated);
    setNewBookName("");
    setShowCreateModal(false);
  };

  const pendingWork = initialHomework.filter((h) => h.status !== "Completed").slice(0, 2);

  return (
    <div className="animate-pop-in space-y-8 py-2">
      {/* 3D NOTEBOOK OPENING ANIMATION OVERLAY */}
      {openingSubject ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/60 p-4 backdrop-blur-sm animate-pop-in">
          <div className="text-center space-y-4">
            <div className="relative mx-auto size-48 sm:size-56 perspective-1000">
              <div
                className={`size-full rounded-[2rem] p-6 shadow-pop flex flex-col items-center justify-center transition-all duration-700 transform origin-left rotate-y-[-70deg] scale-105 ${tone[openingSubject.color]}`}
              >
                <span className="text-6xl sm:text-7xl animate-bounce">{openingSubject.emoji}</span>
                <p className="mt-3 font-display text-2xl font-extrabold uppercase text-center text-primary-foreground">
                  {openingSubject.name}
                </p>
              </div>
            </div>
            <p className="font-display text-3xl font-extrabold uppercase text-white tracking-wide animate-pulse">
              Opening {openingSubject.name} Notebook... 📖
            </p>
          </div>
        </div>
      ) : null}

      {/* CREATE NEW BOOK MODAL */}
      {showCreateModal ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/50 p-4 backdrop-blur-xs">
          <div className="soft-glass w-full max-w-md rounded-[2.5rem] bg-card p-6 shadow-pop animate-pop-in">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="font-display text-2xl font-extrabold uppercase">✨ Create New Book</h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="grid size-10 place-items-center rounded-full bg-accent hover:bg-accent/80"
              >
                <X className="size-6" />
              </button>
            </div>
            <form onSubmit={handleCreateBook} className="mt-4 space-y-4">
              <div>
                <label className="block font-display text-sm font-extrabold uppercase mb-1">Book Name</label>
                <input
                  type="text"
                  placeholder="e.g. History Notes..."
                  value={newBookName}
                  onChange={(e) => setNewBookName(e.target.value)}
                  className="w-full rounded-2xl border-2 border-border bg-background px-4 py-3 font-sans text-base font-bold outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block font-display text-sm font-extrabold uppercase mb-1">Pick Icon</label>
                <div className="flex gap-2">
                  {["📖", "🔢", "🔬", "🎨", "🚀", "🦕", "🌎", "💡"].map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setNewBookEmoji(em)}
                      className={`grid size-12 place-items-center rounded-2xl text-2xl transition-transform active:scale-90 ${
                        newBookEmoji === em ? "bg-primary text-primary-foreground scale-110" : "bg-accent"
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <BigButton color="ghost" onClick={() => setShowCreateModal(false)} className="min-h-12 px-6 text-base">
                  Cancel
                </BigButton>
                <BigButton color="green" type="submit" className="min-h-12 px-6 text-base">
                  Create Book 🚀
                </BigButton>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* 1. GREETING SECTION */}
      <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold uppercase sm:text-5xl tracking-tight">
            Hi, Aarav! 👋
          </h1>
          <p className="font-sans text-lg font-bold text-muted-foreground mt-1">
            What would you like to learn today?
          </p>
        </div>

        <SlateyBubble mood="happy" size={76} className="w-full sm:w-auto">
          <span>Ready for school! Pick your book from the shelf. 🎒</span>
        </SlateyBubble>
      </section>


      {/* 2. THREE LARGE PRIMARY ACTION BUTTONS */}
      <section className="grid gap-4 sm:grid-cols-3">
        <Link
          to="/student/notes"
          className="soft-glass group flex items-center gap-4 rounded-[2rem] p-5 bg-card transition-all duration-200 hover:-translate-y-1 hover:shadow-pop active:scale-98 border-2 border-primary/20"
        >
          <span className="grid size-16 place-items-center rounded-2xl bg-blue/15 text-3xl group-hover:scale-110 transition-transform">
            📚
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight text-foreground">
              My Books
            </h2>
            <p className="font-sans text-xs font-bold text-muted-foreground">Open notebooks & draw</p>
          </div>
        </Link>

        <Link
          to="/student/homework"
          className="soft-glass group flex items-center gap-4 rounded-[2rem] p-5 bg-card transition-all duration-200 hover:-translate-y-1 hover:shadow-pop active:scale-98 border-2 border-orange/20"
        >
          <span className="grid size-16 place-items-center rounded-2xl bg-orange/15 text-3xl group-hover:scale-110 transition-transform">
            ✏️
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight text-foreground">
              My Work
            </h2>
            <p className="font-sans text-xs font-bold text-muted-foreground">Check & finish homework</p>
          </div>
        </Link>

        <Link
          to="/student/class"
          className="soft-glass group flex items-center gap-4 rounded-[2rem] p-5 bg-card transition-all duration-200 hover:-translate-y-1 hover:shadow-pop active:scale-98 border-2 border-purple/20"
        >
          <span className="grid size-16 place-items-center rounded-2xl bg-purple/15 text-3xl group-hover:scale-110 transition-transform">
            👩‍🏫
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight text-foreground">
              My Teacher
            </h2>
            <p className="font-sans text-xs font-bold text-muted-foreground">Class news & messages</p>
          </div>
        </Link>
      </section>

      {/* 3. ALL BOOKS ON DIGITAL BOOKSHELF */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight flex items-center gap-2">
            📚 My Books
          </h2>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-4 py-2 font-display text-xs font-extrabold uppercase shadow-soft hover:bg-primary/90 active:scale-95"
          >
            <Plus className="size-4" /> New Book
          </button>
        </div>

        <Bookshelf books={allBooks} onOpenBook={handleOpenBook} />
      </section>

      {/* 4. MY WORK (PENDING / RECENT HOMEWORK) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight flex items-center gap-2">
            ✏️ Pending Work
          </h2>
          <Link to="/student/homework" className="font-display text-sm font-extrabold uppercase text-primary hover:underline">
            View All Work →
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {pendingWork.map((hw) => (
            <GlassCard
              key={hw.id}
              className="rounded-[2.25rem] p-5 flex flex-col justify-between border-2 border-card bg-card shadow-xs"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={`grid size-12 place-items-center rounded-2xl text-2xl ${tone[hw.color]}`}>
                    {hw.emoji}
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-extrabold uppercase">{hw.title}</h3>
                    <p className="font-sans text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      <Clock className="size-3.5 text-primary" /> {hw.due}
                    </p>
                  </div>
                </div>

                <span className={`rounded-full px-3 py-1 font-display text-xs font-extrabold uppercase ${
                  hw.status === "In Progress" ? "bg-blue/15 text-blue-800" : "bg-yellow/20 text-yellow-900"
                }`}>
                  {hw.status}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
                <span className="font-sans text-xs font-bold text-muted-foreground">{hw.subject}</span>
                <Link
                  to="/student/homework"
                  className="inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-4 py-1.5 font-display text-xs font-extrabold uppercase hover:bg-primary/90 active:scale-95"
                >
                  Open Work →
                </Link>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* 5. TEACHER ANNOUNCEMENT SNIPPET */}
      <section>
        <GlassCard className="rounded-[2.25rem] p-6 bg-gradient-to-r from-yellow/15 via-card to-yellow/10 border-2 border-yellow/25 shadow-soft">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="grid size-12 place-items-center rounded-2xl bg-yellow text-2xl shrink-0 shadow-xs">
                📢
              </span>
              <div>
                <span className="inline-block rounded-full bg-yellow/40 px-2.5 py-0.5 font-display text-[10px] font-extrabold uppercase text-yellow-900 mb-1">
                  NEW FROM {teacherInfo.name.toUpperCase()}
                </span>
                <h3 className="font-display text-xl font-extrabold uppercase text-foreground">
                  {teacherInfo.announcements[0]?.title}
                </h3>
                <p className="font-sans text-sm font-semibold text-muted-foreground mt-0.5">
                  "{teacherInfo.announcements[0]?.body}"
                </p>
              </div>
            </div>

            <Link
              to="/student/class"
              className="inline-flex items-center justify-center min-h-12 px-6 rounded-full bg-yellow font-display text-sm font-extrabold uppercase text-foreground shadow-xs hover:bg-yellow/90 shrink-0"
            >
              View Message →
            </Link>
          </div>
        </GlassCard>
      </section>
    </div>
  );
}




