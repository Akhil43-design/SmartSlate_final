import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BigButton } from "@/components/kit";
import { announcements as seed } from "@/lib/data";

export const Route = createFileRoute("/teacher/announcements")({
  head: () => ({
    meta: [
      { title: "Announcements — SmartSlate Teacher" },
      { name: "description", content: "Publish short, friendly notes that appear on every student's class screen." },
      { property: "og:title", content: "Announcements — SmartSlate Teacher" },
      { property: "og:description", content: "Share class news with students and parents." },
    ],
  }),
  component: Announcements,
});

function Announcements() {
  const [items, setItems] = useState(seed);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-extrabold uppercase sm:text-4xl">📢 Announcements</h1>

      <form
        className="soft-glass grid gap-3 rounded-[2rem] p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          setItems((i) => [{ id: String(Date.now()), emoji: "📣", title, body }, ...i]);
          setTitle("");
          setBody("");
        }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="min-h-12 rounded-2xl bg-card px-4 font-semibold placeholder:text-muted-foreground"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Short message for the class"
          className="min-h-24 rounded-2xl bg-card p-4 font-semibold placeholder:text-muted-foreground"
        />
        <BigButton type="submit" color="purple" className="min-h-12 justify-self-start text-base">
          Publish
        </BigButton>
      </form>

      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((a) => (
          <li key={a.id} className="soft-glass rounded-[1.75rem] p-5">
            <p className="font-display text-xl font-extrabold">
              <span className="mr-2">{a.emoji}</span>
              {a.title}
            </p>
            <p className="font-semibold text-muted-foreground">{a.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
