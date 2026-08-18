import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search, Plus, BookOpen, Sparkles, Check } from "lucide-react";
import { useState } from "react";
import { BigButton, GlassCard, Script, tone, toneSoft } from "@/components/kit";
import { SlateyBubble } from "@/components/Slatey";
import { exploreArticles } from "@/lib/data";

export const Route = createFileRoute("/student/explore")({
  head: () => ({
    meta: [
      { title: "🔍 Study Explorer — SmartSlate Discover" },
      { name: "description", content: "Explore bite-sized lessons and add fun topics to your SmartSlate notebooks." },
      { property: "og:title", content: "🔍 Study Explorer — SmartSlate Discover" },
      { property: "og:description", content: "Search fun school topics and add them directly to your digital notes." },
    ],
  }),
  component: ExplorePage,
});

function ExplorePage() {
  const [query, setQuery] = useState("");
  const [addedIds, setAddedIds] = useState<string[]>([]);
  const navigate = useNavigate();

  const filtered = exploreArticles.filter(
    (a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.summary.toLowerCase().includes(query.toLowerCase()) ||
      a.subject.toLowerCase().includes(query.toLowerCase())
  );

  const handleAddToNotes = (id: string) => {
    setAddedIds((prev) => [...prev, id]);
  };

  return (
    <div className="animate-pop-in space-y-6 py-4">
      {/* HEADER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold uppercase sm:text-5xl tracking-tight flex items-center gap-3">
            🔍 Study Explorer
          </h1>
          <Script className="block text-2xl mt-0.5">Search & discover awesome facts!</Script>
        </div>

        {/* SEARCH INPUT */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search topics (e.g. Plants, Moon)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-full border-2 border-border bg-card py-3 pl-12 pr-4 font-sans text-base font-bold outline-none shadow-xs focus:border-primary"
          />
        </div>
      </div>

      {/* ARTICLES GRID */}
      <div className="grid gap-6 sm:grid-cols-2">
        {filtered.map((art) => {
          const isAdded = addedIds.includes(art.id);

          return (
            <GlassCard
              key={art.id}
              className="rounded-[2.5rem] p-6 flex flex-col justify-between border-2 border-card transition-all hover:-translate-y-1 hover:shadow-pop"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <span className="grid size-16 place-items-center rounded-3xl bg-blue/15 text-4xl shadow-soft">
                    {art.emoji}
                  </span>
                  <span className="rounded-full bg-primary/15 px-3 py-1 font-display text-xs font-extrabold uppercase text-primary">
                    {art.subject}
                  </span>
                </div>

                <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight">{art.title}</h2>
                <p className="mt-2 font-sans text-base font-semibold text-muted-foreground leading-relaxed">
                  {art.summary}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {art.tags.map((t) => (
                    <span key={t} className="rounded-full bg-accent px-3 py-1 text-xs font-extrabold text-foreground">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              {/* ACTION FOOTER */}
              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between gap-3">
                {isAdded ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green px-4 py-2 font-display text-sm font-extrabold uppercase text-foreground">
                    <Check className="size-4" /> Added to Notebook! ⭐ +5 Stars
                  </span>
                ) : (
                  <BigButton
                    color="blue"
                    className="min-h-12 px-6 text-sm shadow-soft"
                    onClick={() => handleAddToNotes(art.id)}
                  >
                    <Plus className="size-4" /> Add to My Notes 📝
                  </BigButton>
                )}
              </div>
            </GlassCard>
          );
        })}
      </div>

      <SlateyBubble mood="happy">
        <span>Click "Add to My Notes" to save any fun fact straight to your SmartSlate notebook! 💡</span>
      </SlateyBubble>
    </div>
  );
}
