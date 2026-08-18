import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BigButton } from "@/components/kit";

export const Route = createFileRoute("/teacher/quizzes")({
  head: () => ({
    meta: [
      { title: "Quizzes — SmartSlate Teacher" },
      { name: "description", content: "Build short picture quizzes your students can finish in minutes." },
      { property: "og:title", content: "Quizzes — SmartSlate Teacher" },
      { property: "og:description", content: "Create simple, friendly quizzes for young learners." },
    ],
  }),
  component: Quizzes,
});

function Quizzes() {
  const [quizzes, setQuizzes] = useState([
    { title: "Counting to 10", questions: 5, subject: "Maths" },
    { title: "Animal Sounds", questions: 4, subject: "Science" },
  ]);
  const [title, setTitle] = useState("");

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-extrabold uppercase sm:text-4xl">🎯 Quizzes</h1>

      <form
        className="soft-glass grid gap-3 rounded-[2rem] p-5 sm:grid-cols-[minmax(0,1fr)_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          setQuizzes((q) => [{ title, questions: 5, subject: "Maths" }, ...q]);
          setTitle("");
        }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Quiz name"
          className="min-h-12 rounded-2xl bg-card px-4 font-semibold placeholder:text-muted-foreground"
        />
        <BigButton type="submit" color="green" className="min-h-12 text-base">Create</BigButton>
      </form>

      <ul className="grid gap-3 sm:grid-cols-2">
        {quizzes.map((q, i) => (
          <li key={i} className="soft-glass rounded-[1.75rem] p-5">
            <p className="font-display text-sm font-extrabold uppercase text-muted-foreground">{q.subject}</p>
            <p className="font-display text-xl font-extrabold">{q.title}</p>
            <p className="font-semibold text-muted-foreground">{q.questions} questions</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
