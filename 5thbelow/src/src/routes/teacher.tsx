import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { BarChart3, Users, CheckSquare, Pencil, Target, Megaphone, TrendingUp } from "lucide-react";
import { Slatey } from "@/components/Slatey";

export const Route = createFileRoute("/teacher")({
  component: TeacherLayout,
});

export const teacherNav = [
  { to: "/teacher", label: "Dashboard", icon: BarChart3, emoji: "📊", exact: true },
  { to: "/teacher/attendance", label: "Attendance", icon: CheckSquare, emoji: "✅" },
  { to: "/teacher/homework", label: "Homework", icon: Pencil, emoji: "✏️" },
  { to: "/teacher/quizzes", label: "Quizzes", icon: Target, emoji: "🎯" },
  { to: "/teacher/announcements", label: "Announcements", icon: Megaphone, emoji: "📢" },
];

function TeacherLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="sky-bg min-h-screen">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-6 sm:px-8 lg:flex-row">
        <aside className="soft-glass h-fit rounded-[2rem] p-4 lg:w-64">
          <Link to="/" className="flex items-center gap-2 px-2 pb-4">
            <Slatey size={36} />
            <span className="font-display text-lg font-extrabold">SmartSlate</span>
          </Link>
          <p className="px-2 pb-2 font-display text-xs font-extrabold uppercase text-muted-foreground">Teacher</p>
          <ul className="flex flex-wrap gap-2 lg:flex-col">
            {teacherNav.map((n) => {
              const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
              return (
                <li key={n.to}>
                  <Link
                    to={n.to}
                    className={`flex min-h-12 items-center gap-2 rounded-2xl px-4 font-display text-sm font-bold transition-colors ${
                      active ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                    }`}
                  >
                    <n.icon className="size-5" />
                    {n.label}
                  </Link>
                </li>
              );
            })}
            <li>
              <Link
                to="/parent"
                className="flex min-h-12 items-center gap-2 rounded-2xl px-4 font-display text-sm font-bold hover:bg-accent"
              >
                <Users className="size-5" /> Parent view
              </Link>
            </li>
          </ul>
        </aside>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  emoji,
  icon: Icon = TrendingUp,
}: {
  label: string;
  value: string;
  emoji: string;
  icon?: typeof TrendingUp;
}) {
  return (
    <div className="soft-glass rounded-[1.75rem] p-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <p className="truncate font-display text-sm font-bold uppercase text-muted-foreground">{label}</p>
        <span className="text-2xl">{emoji}</span>
      </div>
      <p className="mt-2 flex items-center gap-2 font-display text-3xl font-extrabold">
        <Icon className="size-6 text-primary" /> {value}
      </p>
    </div>
  );
}
