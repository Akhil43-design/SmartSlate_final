import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Mail, ArrowRight, Sparkles, UserPlus } from "lucide-react";
import { BigButton, GlassCard, tone } from "@/components/kit";
import { Slatey } from "@/components/Slatey";
import { loginUser, quickDemoLogin, type UserRole } from "@/lib/authService";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log In — SmartSlate" },
      { name: "description", content: "Log in to your SmartSlate account as Student, Teacher, or Parent." },
      { property: "og:title", content: "Log In — SmartSlate" },
      { property: "og:description", content: "Unified login for students, teachers, and parents." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [emailOrCode, setEmailOrCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrCode.trim()) return alert("Please enter your email or Student Code!");
    setLoading(true);
    try {
      const user = await loginUser(emailOrCode, password);
      if (user) {
        if (user.role === "student") navigate({ to: "/student" });
        else if (user.role === "teacher") navigate({ to: "/teacher" });
        else if (user.role === "parent") navigate({ to: "/parent" });
      }
    } catch (err: any) {
      alert("Login error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role: UserRole) => {
    const user = quickDemoLogin(role);
    if (user.role === "student") navigate({ to: "/student" });
    else if (user.role === "teacher") navigate({ to: "/teacher" });
    else if (user.role === "parent") navigate({ to: "/parent" });
  };

  return (
    <div className="sky-bg min-h-screen py-10 px-4 flex flex-col justify-center items-center">
      {/* BRAND LOGO */}
      <div className="text-center max-w-xl mb-6">
        <Link to="/" className="inline-flex items-center gap-3">
          <Slatey size={48} mood="happy" />
          <span className="font-display text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-foreground">
            SmartSlate
          </span>
        </Link>
        <p className="font-sans text-base font-bold text-muted-foreground mt-1">
          One unified login for Students, Teachers & Parents
        </p>
      </div>

      {/* LOGIN CARD */}
      <GlassCard className="w-full max-w-md rounded-[2.5rem] p-7 bg-card shadow-pop border-2 border-primary/20 animate-pop-in">
        <h1 className="font-display text-2xl font-extrabold uppercase text-center mb-5">
          👋 Welcome Back!
        </h1>

        <form onSubmit={handleLogin} className="space-y-4" suppressHydrationWarning>
          <div>
            <label className="block font-display text-xs font-extrabold uppercase text-foreground mb-1">
              Email or Student Code
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="e.g. aarav@smartslate.edu.in or STU-AARAV5A"
                value={emailOrCode}
                onChange={(e) => setEmailOrCode(e.target.value)}
                suppressHydrationWarning
                className="w-full rounded-xl bg-accent px-4 py-3 font-sans text-base font-bold outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block font-display text-xs font-extrabold uppercase text-foreground mb-1">
              Password (Optional for Demo)
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                suppressHydrationWarning
                className="w-full rounded-xl bg-accent px-4 py-3 font-sans text-base font-bold outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="pt-2">
            <BigButton
              color="blue"
              type="submit"
              disabled={loading}
              className="w-full min-h-14 text-base shadow-soft"
              suppressHydrationWarning
            >
              {loading ? "Logging in..." : "Log In to SmartSlate →"}
            </BigButton>
          </div>
        </form>

        {/* 1-CLICK QUICK DEMO PROFILES */}
        <div className="mt-8 pt-6 border-t border-border" suppressHydrationWarning>
          <p className="font-display text-xs font-extrabold uppercase text-muted-foreground text-center mb-3">
            ✨ Quick 1-Click Demo Profiles
          </p>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleDemoLogin("student")}
              suppressHydrationWarning
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-orange/10 hover:bg-orange/20 border border-orange/30 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-orange/25 text-xl">🦊</span>
                <div>
                  <span className="block font-display text-sm font-extrabold uppercase">Aarav Sharma</span>
                  <span className="block text-xs font-semibold text-muted-foreground">Student · Grade 5-A (STU-AARAV5A)</span>
                </div>
              </div>
              <span className="font-display text-xs font-extrabold uppercase text-orange-800 group-hover:translate-x-1 transition-transform">
                Open 🎒 →
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin("teacher")}
              suppressHydrationWarning
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-purple-200 text-xl">👩‍🏫</span>
                <div>
                  <span className="block font-display text-sm font-extrabold uppercase">Ms. Priya Sharma</span>
                  <span className="block text-xs font-semibold text-muted-foreground">Teacher · Grade 5-A & Mathematics</span>
                </div>
              </div>
              <span className="font-display text-xs font-extrabold uppercase text-purple-800 group-hover:translate-x-1 transition-transform">
                Open 👩‍🏫 →
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin("parent")}
              suppressHydrationWarning
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-emerald-200 text-xl">👨‍👩‍👧</span>
                <div>
                  <span className="block font-display text-sm font-extrabold uppercase">Anjali Sharma</span>
                  <span className="block text-xs font-semibold text-muted-foreground">Parent · Mother of Aarav</span>
                </div>
              </div>
              <span className="font-display text-xs font-extrabold uppercase text-emerald-800 group-hover:translate-x-1 transition-transform">
                Open 👨‍👩‍👧 →
              </span>
            </button>
          </div>
        </div>

        {/* REGISTER LINK */}
        <div className="mt-6 pt-4 border-t border-border text-center">
          <p className="font-sans text-sm font-semibold text-muted-foreground">
            Don't have a profile yet?{" "}
            <Link to="/register" className="font-display font-extrabold text-primary hover:underline">
              Create a Profile →
            </Link>
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
