import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare, Send, X, School, UserCheck } from "lucide-react";
import { useState } from "react";
import { BigButton, GlassCard } from "@/components/kit";
import { teacherInfo, classmates } from "@/lib/data";

export const Route = createFileRoute("/student/class")({
  head: () => ({
    meta: [
      { title: "My Teacher — SmartSlate" },
      { name: "description", content: "See your teacher, class announcements, classmates, and school messages." },
      { property: "og:title", content: "My Teacher — SmartSlate" },
      { property: "og:description", content: "Your class, your friends, and teacher updates." },
    ],
  }),
  component: MyClassPage,
});

function MyClassPage() {
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { id: "1", sender: "Ms. Priya Sharma (Teacher)", text: "Good morning class! Remember to bring 2 green leaves for Science class tomorrow.", isTeacher: true },
    { id: "2", sender: "Vihaan 🐼", text: "I finished my leaf drawing in my notebook!", isTeacher: false },
    { id: "3", sender: "Ananya 🌸", text: "See everyone in Sports Hour!", isTeacher: false },
  ]);
  const [newMsg, setNewMsg] = useState("");

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), sender: "Aarav (You) 🦊", text: newMsg, isTeacher: false },
    ]);
    setNewMsg("");
  };


  return (
    <div className="animate-pop-in space-y-6 py-2">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold uppercase sm:text-5xl tracking-tight">
            👩‍🏫 My Teacher
          </h1>
          <p className="font-sans text-base font-bold text-muted-foreground mt-1">
            Class 3 · Alpha Sunflowers
          </p>
        </div>

        <BigButton color="purple" onClick={() => setShowChatModal(true)} className="shrink-0 min-h-14 px-6 text-base shadow-soft">
          <MessageSquare className="size-5" /> Send Message 💬
        </BigButton>
      </div>

      {/* TEACHER CARD */}
      <GlassCard className="rounded-[2.5rem] p-6 sm:p-8 bg-card shadow-soft border-2 border-purple/20">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <span className="grid size-24 shrink-0 place-items-center rounded-full bg-purple/20 text-6xl shadow-xs">
              {teacherInfo.avatar}
            </span>
            <div>
              <span className="inline-block rounded-full bg-purple/15 px-3.5 py-1 font-display text-xs font-extrabold uppercase text-purple-900 mb-1">
                CLASS TEACHER
              </span>
              <h2 className="font-display text-3xl font-extrabold uppercase">{teacherInfo.name}</h2>
              <p className="font-sans text-base font-semibold text-muted-foreground">{teacherInfo.role}</p>
              <p className="font-sans text-xs font-bold text-primary mt-1">📧 {teacherInfo.email}</p>
            </div>
          </div>

          <BigButton color="blue" onClick={() => setShowChatModal(true)} className="min-h-12 px-7 text-base shadow-soft">
            Message Teacher 📩
          </BigButton>
        </div>
      </GlassCard>

      {/* ANNOUNCEMENTS WALL */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight flex items-center gap-2">
          📢 Teacher Announcements
        </h2>

        <div className="grid gap-4 sm:grid-cols-3">
          {teacherInfo.announcements.map((a) => (
            <GlassCard key={a.id} className="rounded-[2.25rem] p-6 bg-card border-2 border-yellow/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="grid size-12 place-items-center rounded-2xl bg-yellow text-2xl shadow-xs">
                    {a.emoji}
                  </span>
                  <span className="font-display text-xs font-extrabold uppercase text-muted-foreground">
                    {a.date}
                  </span>
                </div>
                <h3 className="font-display text-xl font-extrabold uppercase tracking-tight">{a.title}</h3>
                <p className="mt-2 font-sans text-sm font-semibold text-muted-foreground">{a.body}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-border/60 flex items-center gap-1.5 font-display text-xs font-extrabold uppercase text-muted-foreground">
                <UserCheck className="size-4 text-green" /> {teacherInfo.name}
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* CLASSMATES GRID */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight flex items-center gap-2">
          😊 Classmates ({classmates.length})
        </h2>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6">
          {classmates.map((c, i) => (
            <GlassCard
              key={i}
              className="rounded-[2rem] p-4 text-center transition-all hover:-translate-y-1 hover:shadow-pop bg-card"
            >
              <span className="text-4xl block mb-1">{c.emoji}</span>
              <span className="font-display text-sm font-extrabold uppercase truncate block">{c.name}</span>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* SAFE CLASS CHAT MODAL */}
      {showChatModal ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/50 p-4 backdrop-blur-xs">
          <div className="soft-glass w-full max-w-lg rounded-[2.5rem] bg-card p-6 shadow-pop animate-pop-in flex flex-col h-[75vh]">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="font-display text-2xl font-extrabold uppercase flex items-center gap-2">
                💬 Message Teacher & Class
              </h2>
              <button
                type="button"
                onClick={() => setShowChatModal(false)}
                className="grid size-10 place-items-center rounded-full bg-accent hover:bg-accent/80"
              >
                <X className="size-6" />
              </button>
            </div>

            {/* MESSAGES LIST */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
              {chatMessages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.isTeacher ? "items-start" : "items-end"}`}
                >
                  <span className="font-display text-xs font-extrabold uppercase text-muted-foreground mb-1 px-1">
                    {m.sender}
                  </span>
                  <div
                    className={`rounded-2xl px-4 py-3 max-w-[85%] font-sans text-sm font-semibold shadow-xs ${
                      m.isTeacher ? "bg-purple/20 text-foreground" : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            {/* INPUT FORM */}
            <form onSubmit={handleSendMessage} className="pt-3 border-t border-border flex items-center gap-2">
              <input
                type="text"
                placeholder="Type your message to teacher..."
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                className="flex-1 rounded-full border-2 border-border bg-background px-4 py-3 font-sans text-sm font-bold outline-none focus:border-primary"
              />
              <button
                type="submit"
                className="grid size-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-soft active:scale-95"
              >
                <Send className="size-5" />
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}


