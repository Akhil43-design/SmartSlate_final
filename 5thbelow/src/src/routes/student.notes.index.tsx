import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, BookOpen, X } from "lucide-react";
import { useEffect, useState } from "react";
import { BigButton, tone } from "@/components/kit";
import { type Subject } from "@/lib/data";
import { getAllBooks, saveCustomBook } from "@/lib/notebookStorage";
import { Bookshelf } from "@/components/DigitalBook";

export const Route = createFileRoute("/student/notes/")({
  head: () => ({
    meta: [
      { title: "My Books — SmartSlate" },
      { name: "description", content: "Open your digital school notebooks and start writing or drawing." },
      { property: "og:title", content: "My Books — SmartSlate" },
      { property: "og:description", content: "Colourful digital school notebooks for every subject." },
    ],
  }),
  component: Notes,
});

function Notes() {
  const [subList, setSubList] = useState<Subject[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBookName, setNewBookName] = useState("");
  const [newBookEmoji, setNewBookEmoji] = useState("📖");
  const [openingSubject, setOpeningSubject] = useState<Subject | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    setSubList(getAllBooks());
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
    setSubList(updated);
    setNewBookName("");
    setShowCreateModal(false);
  };

  return (
    <div className="animate-pop-in space-y-6 py-2">
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

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold uppercase tracking-tight sm:text-5xl">
            📚 My Books
          </h1>
          <p className="font-sans text-base font-bold text-muted-foreground mt-1">
            Pick a school notebook from your digital shelf to start writing and drawing.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 font-display text-sm font-extrabold uppercase shadow-soft hover:bg-primary/90 active:scale-95 transition-all"
        >
          <Plus className="size-5" /> Create New Book ✨
        </button>
      </div>

      {/* DIGITAL BOOKSHELF */}
      <div className="rounded-[2.5rem] bg-card/60 p-4 sm:p-6 border-2 border-border shadow-soft">
        <Bookshelf books={subList} onOpenBook={handleOpenBook} />
      </div>

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
                  placeholder="e.g. Science Journal..."
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
    </div>
  );
}



