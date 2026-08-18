import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BigButton } from "@/components/kit";

export const Route = createFileRoute("/teacher/homework")({
  head: () => ({
    meta: [
      { title: "Homework — SmartSlate Teacher" },
      { name: "description", content: "Create and assign homework to your class in seconds." },
      { property: "og:title", content: "Homework — SmartSlate Teacher" },
      { property: "og:description", content: "Assign homework with a subject, title and due date." },
    ],
  }),
  component: TeacherHomework,
});

function TeacherHomework() {
  const [items, setItems] = useState([
    { subject: "Maths", title: "Addition Practice", due: "Tomorrow" },
    { subject: "English", title: "Read 1 Story", due: "Friday" },
  ]);
  const [form, setForm] = useState({ subject: "Maths", title: "", due: "Tomorrow" });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-extrabold uppercase sm:text-4xl">✏️ Homework</h1>

      <form
        className="soft-glass grid gap-3 rounded-[2rem] p-5 sm:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.title.trim()) return;
          setItems((i) => [{ ...form }, ...i]);
          setForm({ ...form, title: "" });
        }}
      >
        <select
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          className="min-h-12 rounded-2xl bg-card px-4 font-semibold"
        >
          {["Maths", "Science", "English", "Social", "Computer", "Art"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Homework title"
          className="min-h-12 rounded-2xl bg-card px-4 font-semibold placeholder:text-muted-foreground sm:col-span-2"
        />
        <BigButton type="submit" color="blue" className="min-h-12 text-base">Assign</BigButton>
      </form>

      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((i, idx) => (
          <li key={idx} className="soft-glass rounded-[1.75rem] p-5">
            <p className="font-display text-sm font-extrabold uppercase text-muted-foreground">{i.subject}</p>
            <p className="font-display text-xl font-extrabold">{i.title}</p>
            <p className="font-semibold text-muted-foreground">📅 {i.due}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
