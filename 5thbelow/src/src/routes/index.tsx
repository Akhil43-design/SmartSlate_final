import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  Pencil,
  Target,
  School,
  Star,
  Save,
  WifiOff,
  CloudUpload,
  CheckCircle2,
  Cloud,
  Rocket,
  Sparkles,
} from "lucide-react";
import { BigButton, GlassCard, Script, toneSoft, tone, type Tone } from "@/components/kit";
import { Slatey } from "@/components/Slatey";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SmartSlate — Learn. Create. Explore." },
      {
        name: "description",
        content:
          "SmartSlate is a colourful digital notebook for kids: write notes, finish homework, practise quizzes — online or offline.",
      },
      { property: "og:title", content: "SmartSlate — Learn. Create. Explore." },
      {
        property: "og:description",
        content: "A friendly digital notebook for school. Write, save, learn anywhere.",
      },
    ],
  }),
  component: Landing,
});

const steps = [
  { emoji: "📖", icon: Pencil, title: "WRITE", text: "Create your notes", color: "blue" as Tone },
  { emoji: "💾", icon: Save, title: "SAVE", text: "Your work is saved", color: "green" as Tone },
  { emoji: "🌐", icon: WifiOff, title: "LEARN ANYWHERE", text: "Works without internet", color: "orange" as Tone },
  { emoji: "☁️", icon: CloudUpload, title: "SYNC", text: "Sync when you're online", color: "purple" as Tone },
];

const things = [
  { emoji: "📖", icon: BookOpen, title: "MY NOTES", text: "Write and draw", color: "blue" as Tone },
  { emoji: "✏️", icon: Pencil, title: "MY HOMEWORK", text: "See what I need to do", color: "orange" as Tone },
  { emoji: "🎯", icon: Target, title: "PRACTICE", text: "Test what I know", color: "green" as Tone },
  { emoji: "🏫", icon: School, title: "MY CLASS", text: "Learn with my class", color: "purple" as Tone },
  { emoji: "⭐", icon: Star, title: "MY PROGRESS", text: "See my stars", color: "pink" as Tone },
];

function Header() {
  return (
    <header className="mx-auto grid max-w-[1400px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-5 sm:px-8">
      <Link to="/" className="flex min-w-0 items-center gap-3">
        <Slatey size={44} />
        <span className="truncate font-display text-2xl font-extrabold tracking-tight">SmartSlate</span>
      </Link>
      <div className="flex shrink-0 items-center gap-3">
        <nav className="soft-glass hidden rounded-full px-5 py-2.5 lg:block">
          <ul className="flex items-center gap-5 font-display text-sm font-extrabold uppercase">
            <li><Link to="/student" className="transition-colors hover:text-primary">🎒 Student</Link></li>
            <li><Link to="/teacher" className="transition-colors hover:text-primary">👩‍🏫 Teacher</Link></li>
            <li><Link to="/parent" className="transition-colors hover:text-primary">👨‍👩‍👧 Parent</Link></li>
          </ul>
        </nav>
        <Link
          to="/login"
          className="rounded-2xl bg-card px-4 py-2.5 font-display text-sm font-extrabold uppercase border border-border shadow-xs hover:bg-accent transition-colors"
        >
          Log In
        </Link>
        <BigButton to="/register" color="blue" className="min-h-11 px-5 text-sm">
          Register →
        </BigButton>
      </div>

    </header>
  );
}

function HeroArt() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="soft-glass rounded-[2.5rem] p-6">
        <div className="rounded-3xl bg-card p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <span className="size-3 rounded-full bg-pink" />
            <span className="size-3 rounded-full bg-yellow" />
            <span className="size-3 rounded-full bg-green" />
          </div>
          <div className="mt-4 space-y-3">
            <div className="h-3 w-3/4 rounded-full bg-blue/30" />
            <div className="h-3 w-full rounded-full bg-muted" />
            <div className="h-3 w-2/3 rounded-full bg-muted" />
            <div className="flex gap-3 pt-2">
              <span className="grid size-14 place-items-center rounded-2xl bg-blue/20 text-2xl">🔢</span>
              <span className="grid size-14 place-items-center rounded-2xl bg-green/25 text-2xl">🔬</span>
              <span className="grid size-14 place-items-center rounded-2xl bg-pink/25 text-2xl">🎨</span>
            </div>
          </div>
        </div>
      </div>
      <Slatey size={132} className="absolute -bottom-10 -left-8 animate-float" mood="wave" />
      <span className="absolute -right-4 -top-6 animate-wiggle text-5xl">✏️</span>
      <span className="absolute -right-8 bottom-10 text-4xl">📚</span>
      <span className="absolute left-6 -top-10 text-4xl">☁️</span>
    </div>
  );
}

function Landing() {
  return (
    <div className="sky-bg min-h-screen">
      <Header />

      {/* SECTION 1 — HERO */}
      <section className="mx-auto max-w-[1400px] px-4 pb-16 pt-6 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="relative animate-pop-in">
            <Script className="absolute -top-8 left-1 text-3xl sm:text-4xl">your learning adventure</Script>
            <h1 className="font-display text-5xl font-extrabold uppercase leading-[0.95] sm:text-6xl lg:text-7xl">
              Learn.
              <br />
              Create.
              <br />
              <span className="text-primary">Explore.</span>
            </h1>
            <p className="mt-6 max-w-md font-sans text-lg font-bold uppercase text-muted-foreground">
              SmartSlate is your digital notebook for school.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <BigButton to="/login" color="blue">🚀 Let's start!</BigButton>
              <BigButton to="/student" color="ghost">See how it works</BigButton>
            </div>
            <ul className="mt-8 flex flex-wrap gap-3">
              {[
                { e: "📖", t: "EASY NOTES", c: "blue" as Tone },
                { e: "☁️", t: "SAVES SAFELY", c: "green" as Tone },
                { e: "⭐", t: "LEARN & PLAY", c: "yellow" as Tone },
              ].map((f) => (
                <li
                  key={f.t}
                  className={`soft-glass flex items-center gap-2 rounded-full px-5 py-3 font-display text-sm font-extrabold uppercase ${toneSoft[f.c]}`}
                >
                  <span className="text-xl">{f.e}</span> {f.t}
                </li>
              ))}
            </ul>
          </div>
          <HeroArt />
        </div>
      </section>

      {/* SECTION 2 — HOW IT WORKS */}
      <section className="mx-auto max-w-[1400px] px-4 py-16 sm:px-8">
        <h2 className="text-center font-display text-4xl font-extrabold uppercase sm:text-5xl">
          Learning is easy!
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <GlassCard key={s.title} className="rounded-[2rem] p-6 text-center transition-transform hover:-translate-y-1">
              <span className={`mx-auto grid size-20 place-items-center rounded-3xl text-4xl ${toneSoft[s.color]}`}>
                {s.emoji}
              </span>
              <h3 className="mt-4 font-display text-xl font-extrabold uppercase">{s.title}</h3>
              <p className="mt-1 text-base font-semibold text-muted-foreground">{s.text}</p>
              <span className={`mt-4 inline-grid size-9 place-items-center rounded-full font-display font-extrabold ${tone[s.color]}`}>
                {i + 1}
              </span>
            </GlassCard>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-3xl sm:text-4xl" aria-hidden="true">
          <span>📖</span><span className="text-primary">→</span>
          <span>💾</span><span className="text-primary">→</span>
          <span>🌐</span><span className="text-primary">→</span>
          <span>☁️</span><span className="text-primary">→</span>
          <span>✅</span>
        </div>
      </section>

      {/* SECTION 3 — EXPLORE */}
      <section className="mx-auto max-w-[1400px] px-4 py-16 sm:px-8">
        <h2 className="text-center font-display text-4xl font-extrabold uppercase sm:text-5xl">
          What can I do?
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {things.map((t) => (
            <GlassCard
              key={t.title}
              className={`rounded-[2rem] p-7 transition-transform duration-200 hover:-translate-y-2 hover:shadow-pop ${toneSoft[t.color]}`}
            >
              <div className="flex items-center gap-4">
                <span className={`grid size-20 shrink-0 place-items-center rounded-3xl ${tone[t.color]}`}>
                  <t.icon className="size-10" strokeWidth={2.4} />
                </span>
                <span className="text-5xl">{t.emoji}</span>
              </div>
              <h3 className="mt-5 font-display text-2xl font-extrabold uppercase">{t.title}</h3>
              <p className="mt-1 text-base font-semibold text-muted-foreground">{t.text}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* SECTION 4 — FINAL CTA */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-8">
        <div className="soft-glass mx-auto max-w-[1200px] rounded-[3rem] px-6 py-14 text-center">
          <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
          <Script className="block text-4xl sm:text-5xl">Let's go!</Script>
          <h2 className="mt-3 font-display text-4xl font-extrabold uppercase sm:text-6xl">Ready to learn?</h2>
          <p className="mx-auto mt-4 max-w-xl font-sans text-base font-bold uppercase text-muted-foreground sm:text-lg">
            Open your notebook and start your next learning adventure.
          </p>
          <div className="mt-8 flex justify-center">
            <BigButton to="/login" color="green">🚀 Let's start!</BigButton>
          </div>
          <div className="mt-10 flex items-end justify-center gap-4">
            <Slatey size={130} mood="wave" className="animate-float" />
            <span className="mb-6 text-4xl">🎉</span>
          </div>
          <div className="pointer-events-none mt-6 flex justify-center gap-4 text-2xl opacity-70" aria-hidden="true">
            <Sparkles className="size-7 text-yellow" />
            <Star className="size-7 text-pink" />
            <Cloud className="size-7 text-blue" />
            <Rocket className="size-7 text-green" />
            <CheckCircle2 className="size-7 text-purple" />
          </div>
        </div>
      </section>

      <footer className="px-4 pb-10 text-center font-display text-sm font-bold uppercase text-muted-foreground">
        SmartSlate · <Link to="/teacher" className="hover:text-primary">Teachers</Link> ·{" "}
        <Link to="/parent" className="hover:text-primary">Parents</Link>
      </footer>
    </div>
  );
}
