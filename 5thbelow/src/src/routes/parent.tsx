import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Star, BookOpen, Target, CheckSquare, Bell } from "lucide-react";
import { Slatey } from "@/components/Slatey";

export const Route = createFileRoute("/parent")({
  component: ParentLayout,
});

const parentNav = [
  { to: "/parent", label: "Overview", icon: Star, exact: true },
  { to: "/parent/progress", label: "Homework", icon: BookOpen },
  { to: "/parent/results", label: "Results", icon: Target },
  { to: "/parent/attendance", label: "Attendance", icon: CheckSquare },
  { to: "/parent/alerts", label: "Alerts", icon: Bell },
];

function ParentLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="sky-bg min-h-screen">
      <div className="mx-auto max-w-[1100px] px-4 py-6 sm:px-8">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <Slatey size={40} />
            <span className="truncate font-display text-xl font-extrabold">SmartSlate · Parent</span>
          </Link>
          <span className="shrink-0 rounded-full bg-accent px-4 py-2 font-display text-sm font-extrabold uppercase">
            👧 Aanya
          </span>
        </header>

        <nav className="soft-glass mt-5 flex flex-wrap gap-2 rounded-[1.75rem] p-2">
          {parentNav.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex min-h-12 items-center gap-2 rounded-2xl px-4 font-display text-sm font-extrabold uppercase transition-colors ${
                  active ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                }`}
              >
                <n.icon className="size-5" />
                {n.label}
              </Link>
            );
          })}
        </nav>

        <main className="mt-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
