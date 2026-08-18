import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Home, BookOpen, Pencil, User, Users, WifiOff, CloudUpload } from "lucide-react";
import { useEffect, useState } from "react";
import { Slatey } from "@/components/Slatey";
import { BigButton } from "@/components/kit";

export const Route = createFileRoute("/student")({
  component: StudentLayout,
});

/** 
 * PRIMARY BOTTOM NAVIGATION — Strictly 5 Core Destinations:
 * 1. 🏠 Home
 * 2. 📚 Books
 * 3. ✏️ My Work
 * 4. 👩‍🏫 Teacher
 * 5. 👤 Profile
 */
const bottomNav = [
  { to: "/student", label: "Home", icon: Home, exact: true, emoji: "🏠" },
  { to: "/student/notes", label: "Books", icon: BookOpen, emoji: "📚" },
  { to: "/student/homework", label: "My Work", icon: Pencil, emoji: "✏️" },
  { to: "/student/class", label: "Teacher", icon: Users, emoji: "👩‍🏫" },
  { to: "/student/profile", label: "Profile", icon: User, emoji: "👤" },
];

function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    setOffline(!navigator.onLine);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (!offline || dismissed) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4">
      <div className="soft-glass w-full max-w-md rounded-[2.5rem] bg-card p-7 text-center shadow-pop animate-pop-in">
        <Slatey size={100} mood="wow" className="mx-auto" />
        <h2 className="mt-3 font-display text-2xl font-extrabold uppercase">No Internet 😮</h2>
        <p className="mt-2 text-base font-bold text-muted-foreground">Don't worry! Your notebook pages and work are saved right here.</p>
        <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-green/20 text-green-800 px-4 py-1.5 font-display text-sm font-extrabold uppercase">
          📱 Saved on your slate
        </p>
        <div className="mt-6">
          <BigButton color="blue" onClick={() => setDismissed(true)}>Okay, Thanks! 🚀</BigButton>
        </div>
      </div>
    </div>
  );
}

import { subscribeToAuthChanges } from "@/lib/firebaseAuth";
import { getStudent } from "@/firebase/services/studentService";

function StudentLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [online, setOnline] = useState(true);
  const [studentName, setStudentName] = useState<string>("Student");

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);

    const unsub = subscribeToAuthChanges(async (user) => {
      if (user) {
        console.log(`[AUTH] 5thbelow session restored: ${user.uid} (${user.email})`);
        const stu = await getStudent(user.uid);
        if (stu && stu.name) {
          setStudentName(stu.name);
          console.log(`[PROFILE] 5thbelow loaded student profile: ${stu.name}`);
        } else if (user.displayName || user.email) {
          setStudentName(user.displayName || user.email.split("@")[0] || "Student");
        }
      } else {
        console.log("[AUTH] 5thbelow: No authenticated user");
      }
    });

    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
      unsub();
    };
  }, []);

  return (
    <div className="sky-bg min-h-screen pb-32">
      <OfflineBanner />

      {/* TOP HEADER: Clean, minimal brand logo & student badge (No Stars) */}
      <header className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-4 sm:px-8">
        <Link to="/student" className="flex items-center gap-3">
          <Slatey size={38} mood="happy" />
          <span className="font-display text-2xl font-extrabold tracking-tight text-foreground">
            SmartSlate
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-display text-xs font-extrabold uppercase ${
              online ? "bg-green/15 text-green-800" : "bg-yellow/30 text-yellow-900"
            }`}
          >
            {online ? <CloudUpload className="size-3.5 text-green" /> : <WifiOff className="size-3.5 text-orange" />}
            {online ? "Synced" : "Offline"}
          </span>

          <Link
            to="/student/profile"
            className="soft-glass flex items-center gap-2 rounded-full px-3 py-1.5 transition-transform active:scale-95 hover:bg-accent"
          >
            <span className="grid size-7 place-items-center rounded-full bg-orange/25 text-sm">🦊</span>
            <span className="font-display text-sm font-extrabold">{studentName}</span>
          </Link>
        </div>
      </header>


      {/* MAIN ROUTE CONTENT */}
      <main className="mx-auto max-w-[1200px] px-4 sm:px-8">
        <Outlet />
      </main>

      {/* FIXED BOTTOM NAVIGATION BAR — 5 TABS */}
      <nav className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 pointer-events-none">
        <ul className="soft-glass pointer-events-auto mx-auto flex max-w-lg items-center justify-between rounded-[2.25rem] bg-card/95 p-2 shadow-pop border-2 border-white/80 backdrop-blur-md">
          {bottomNav.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            return (
              <li key={n.to} className="flex-1">
                <Link
                  to={n.to}
                  className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1 font-display text-xs font-extrabold uppercase transition-all duration-200 ${
                    active
                      ? "bg-primary text-primary-foreground shadow-soft scale-105"
                      : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
                  }`}
                >
                  <n.icon className="size-5 sm:size-6" strokeWidth={2.4} />
                  <span className="text-[11px] sm:text-xs tracking-tight">{n.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}


