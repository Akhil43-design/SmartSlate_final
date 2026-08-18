import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  User,
  GraduationCap,
  Users,
  Sparkles,
  CheckCircle,
  Copy,
  ArrowRight,
  ShieldCheck,
  School,
  Phone,
  Mail,
  Lock,
} from "lucide-react";
import { BigButton, GlassCard, tone } from "@/components/kit";
import { Slatey } from "@/components/Slatey";
import {
  registerStudent,
  registerTeacher,
  registerParent,
  type UserRole,
  type StudentRecord,
} from "@/lib/authService";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Join SmartSlate — Create Your Profile" },
      { name: "description", content: "Student, Teacher, and Parent registration for SmartSlate." },
      { property: "og:title", content: "Join SmartSlate — Create Your Profile" },
      { property: "og:description", content: "One connected school ecosystem for students, teachers, and parents." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole>("student");
  const [loading, setLoading] = useState(false);

  // Student Form State
  const [studentName, setStudentName] = useState("");
  const [studentGrade, setStudentGrade] = useState("Grade 5");
  const [studentSection, setStudentSection] = useState("A");
  const [studentSchool, setStudentSchool] = useState("Delhi Public School");
  const [parentName, setParentName] = useState("");
  const [parentContact, setParentContact] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPassword, setStudentPassword] = useState("");

  // Teacher Form State
  const [teacherName, setTeacherName] = useState("");
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teacherPassword, setTeacherPassword] = useState("");
  const [teacherSchool, setTeacherSchool] = useState("Delhi Public School");
  const [teacherSubjects, setTeacherSubjects] = useState<string[]>(["Mathematics", "Science"]);
  const [teacherClass, setTeacherClass] = useState("Grade 5-A");

  // Parent Form State
  const [parentFullName, setParentFullName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentRelationship, setParentRelationship] = useState("Mother");
  const [parentStudentCode, setParentStudentCode] = useState("");
  const [parentPassword, setParentPassword] = useState("");

  // Success Modal for Student Code
  const [createdStudent, setCreatedStudent] = useState<StudentRecord | null>(null);
  const [copied, setCopied] = useState(false);

  // 1. SUBMIT STUDENT FORM
  const handleSubmitStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) return alert("Please enter your name!");
    setLoading(true);
    try {
      const res = await registerStudent({
        fullName: studentName,
        grade: studentGrade,
        section: studentSection,
        schoolName: studentSchool,
        parentNames: parentName,
        parentContact: parentContact,
        email: studentEmail,
        password: studentPassword,
      });
      setCreatedStudent(res.student);
    } catch (err: any) {
      alert("Registration error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. SUBMIT TEACHER FORM
  const handleSubmitTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName.trim() || !teacherEmail.trim()) return alert("Please enter your name and email!");
    setLoading(true);
    try {
      await registerTeacher({
        fullName: teacherName,
        email: teacherEmail,
        password: teacherPassword,
        schoolName: teacherSchool,
        subjects: teacherSubjects,
        classes: [teacherClass],
      });
      navigate({ to: "/teacher" });
    } catch (err: any) {
      alert("Registration error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. SUBMIT PARENT FORM
  const handleSubmitParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentFullName.trim() || !parentEmail.trim()) return alert("Please enter your name and email!");
    if (!parentStudentCode.trim()) return alert("Please enter your child's Student Code (e.g. STU-AARAV5A)!");
    setLoading(true);
    try {
      const res = await registerParent({
        fullName: parentFullName,
        email: parentEmail,
        phone: parentPhone,
        relationship: parentRelationship,
        studentCode: parentStudentCode,
        password: parentPassword,
      });
      if (res.linkedStudent) {
        alert(`Linked successfully with ${res.linkedStudent.fullName} (${res.linkedStudent.grade}-${res.linkedStudent.section})! 🎉`);
      }
      navigate({ to: "/parent" });
    } catch (err: any) {
      alert("Registration error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="sky-bg min-h-screen py-10 px-4 flex flex-col justify-center items-center">
      {/* BRAND LOGO HEADER */}
      <div className="text-center max-w-xl mb-6">
        <Link to="/" className="inline-flex items-center gap-3">
          <Slatey size={48} mood="happy" />
          <span className="font-display text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-foreground">
            SmartSlate
          </span>
        </Link>
        <p className="font-sans text-base font-bold text-muted-foreground mt-2">
          Create your account for the shared SmartSlate school platform.
        </p>
      </div>

      {/* MAIN REGISTRATION CARD */}
      <GlassCard className="w-full max-w-xl rounded-[2.5rem] p-6 sm:p-8 bg-card shadow-pop border-2 border-primary/20 animate-pop-in">
        {/* ROLE SELECTOR TABS */}
        <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-accent mb-8">
          <button
            type="button"
            onClick={() => setRole("student")}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-3 rounded-xl font-display text-xs sm:text-sm font-extrabold uppercase transition-all ${
              role === "student"
                ? "bg-primary text-primary-foreground shadow-soft scale-102"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="text-lg">🎒</span>
            <span>Student</span>
          </button>

          <button
            type="button"
            onClick={() => setRole("teacher")}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-3 rounded-xl font-display text-xs sm:text-sm font-extrabold uppercase transition-all ${
              role === "teacher"
                ? "bg-purple-600 text-white shadow-soft scale-102"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="text-lg">👩‍🏫</span>
            <span>Teacher</span>
          </button>

          <button
            type="button"
            onClick={() => setRole("parent")}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-3 rounded-xl font-display text-xs sm:text-sm font-extrabold uppercase transition-all ${
              role === "parent"
                ? "bg-emerald-600 text-white shadow-soft scale-102"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="text-lg">👨‍👩‍👧</span>
            <span>Parent</span>
          </button>
        </div>

        {/* 1. STUDENT REGISTRATION FORM */}
        {role === "student" && (
          <form onSubmit={handleSubmitStudent} className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <span className="grid size-12 place-items-center rounded-2xl bg-orange/20 text-2xl">🦊</span>
              <div>
                <h2 className="font-display text-xl font-extrabold uppercase">Student Profile</h2>
                <p className="text-xs font-semibold text-muted-foreground">Made for young learners in Grades 1 to 5</p>
              </div>
            </div>

            <div>
              <label className="block font-display text-xs font-extrabold uppercase text-foreground mb-1">
                What's your Full Name? *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Aarav Sharma"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full rounded-xl bg-accent px-4 py-3 font-sans text-base font-bold outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-display text-xs font-extrabold uppercase text-foreground mb-1">
                  Class / Grade *
                </label>
                <select
                  value={studentGrade}
                  onChange={(e) => setStudentGrade(e.target.value)}
                  className="w-full rounded-xl bg-accent px-4 py-3 font-sans text-base font-bold outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Grade 1">Grade 1</option>
                  <option value="Grade 2">Grade 2</option>
                  <option value="Grade 3">Grade 3</option>
                  <option value="Grade 4">Grade 4</option>
                  <option value="Grade 5">Grade 5</option>
                </select>
              </div>

              <div>
                <label className="block font-display text-xs font-extrabold uppercase text-foreground mb-1">
                  Section *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. A, B, Alpha"
                  value={studentSection}
                  onChange={(e) => setStudentSection(e.target.value)}
                  className="w-full rounded-xl bg-accent px-4 py-3 font-sans text-base font-bold outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block font-display text-xs font-extrabold uppercase text-foreground mb-1">
                School Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Delhi Public School"
                value={studentSchool}
                onChange={(e) => setStudentSchool(e.target.value)}
                className="w-full rounded-xl bg-accent px-4 py-3 font-sans text-base font-bold outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
              <div>
                <label className="block font-display text-xs font-extrabold uppercase text-foreground mb-1">
                  Parent / Guardian Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Anjali Sharma"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  className="w-full rounded-xl bg-accent px-4 py-2.5 font-sans text-sm font-semibold outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-display text-xs font-extrabold uppercase text-foreground mb-1">
                  Parent Phone / Contact
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={parentContact}
                  onChange={(e) => setParentContact(e.target.value)}
                  className="w-full rounded-xl bg-accent px-4 py-2.5 font-sans text-sm font-semibold outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="pt-4">
              <BigButton
                color="blue"
                type="submit"
                disabled={loading}
                className="w-full min-h-14 text-base shadow-soft"
              >
                {loading ? "Creating Profile..." : "Create My Student Profile → 🚀"}
              </BigButton>
            </div>
          </form>
        )}

        {/* 2. TEACHER REGISTRATION FORM */}
        {role === "teacher" && (
          <form onSubmit={handleSubmitTeacher} className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <span className="grid size-12 place-items-center rounded-2xl bg-purple-100 text-2xl">👩‍🏫</span>
              <div>
                <h2 className="font-display text-xl font-extrabold uppercase">Teacher Profile</h2>
                <p className="text-xs font-semibold text-muted-foreground">Manage classes, attendance, assignments</p>
              </div>
            </div>

            <div>
              <label className="block font-display text-xs font-extrabold uppercase text-foreground mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ms. Priya Sharma"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full rounded-xl bg-accent px-4 py-3 font-sans text-base font-bold outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block font-display text-xs font-extrabold uppercase text-foreground mb-1">
                School Email *
              </label>
              <input
                type="email"
                required
                placeholder="e.g. priya.sharma@smartslate.edu.in"
                value={teacherEmail}
                onChange={(e) => setTeacherEmail(e.target.value)}
                className="w-full rounded-xl bg-accent px-4 py-3 font-sans text-base font-bold outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block font-display text-xs font-extrabold uppercase text-foreground mb-1">
                School Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Delhi Public School, R.K. Puram"
                value={teacherSchool}
                onChange={(e) => setTeacherSchool(e.target.value)}
                className="w-full rounded-xl bg-accent px-4 py-3 font-sans text-base font-bold outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-display text-xs font-extrabold uppercase text-foreground mb-1">
                  Subjects Taught
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mathematics, Science"
                  value={teacherSubjects.join(", ")}
                  onChange={(e) => setTeacherSubjects(e.target.value.split(",").map((s) => s.trim()))}
                  className="w-full rounded-xl bg-accent px-4 py-3 font-sans text-sm font-semibold outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-display text-xs font-extrabold uppercase text-foreground mb-1">
                  Class & Section
                </label>
                <input
                  type="text"
                  placeholder="e.g. Grade 5-A"
                  value={teacherClass}
                  onChange={(e) => setTeacherClass(e.target.value)}
                  className="w-full rounded-xl bg-accent px-4 py-3 font-sans text-sm font-semibold outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="pt-4">
              <BigButton
                color="purple"
                type="submit"
                disabled={loading}
                className="w-full min-h-14 text-base shadow-soft"
              >
                {loading ? "Creating Profile..." : "Create Teacher Profile → 👩‍🏫"}
              </BigButton>
            </div>
          </form>
        )}

        {/* 3. PARENT REGISTRATION FORM */}
        {role === "parent" && (
          <form onSubmit={handleSubmitParent} className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <span className="grid size-12 place-items-center rounded-2xl bg-emerald-100 text-2xl">👨‍👩‍👧</span>
              <div>
                <h2 className="font-display text-xl font-extrabold uppercase">Parent Profile</h2>
                <p className="text-xs font-semibold text-muted-foreground">Monitor your child's attendance & school work</p>
              </div>
            </div>

            <div>
              <label className="block font-display text-xs font-extrabold uppercase text-foreground mb-1">
                Parent / Guardian Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Anjali Sharma"
                value={parentFullName}
                onChange={(e) => setParentFullName(e.target.value)}
                className="w-full rounded-xl bg-accent px-4 py-3 font-sans text-base font-bold outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-display text-xs font-extrabold uppercase text-foreground mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. anjali@example.com"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  className="w-full rounded-xl bg-accent px-4 py-3 font-sans text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-display text-xs font-extrabold uppercase text-foreground mb-1">
                  Relationship *
                </label>
                <select
                  value={parentRelationship}
                  onChange={(e) => setParentRelationship(e.target.value)}
                  className="w-full rounded-xl bg-accent px-4 py-3 font-sans text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Mother">Mother</option>
                  <option value="Father">Father</option>
                  <option value="Guardian">Guardian</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-display text-xs font-extrabold uppercase text-foreground mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                placeholder="e.g. +91 98765 43210"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                className="w-full rounded-xl bg-accent px-4 py-3 font-sans text-base font-bold outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* STUDENT CODE LINKING FIELD */}
            <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200">
              <label className="block font-display text-xs font-extrabold uppercase text-emerald-900 mb-1">
                🔑 Enter Child's Student Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. STU-AARAV5A"
                value={parentStudentCode}
                onChange={(e) => setParentStudentCode(e.target.value.toUpperCase())}
                className="w-full rounded-xl bg-white px-4 py-3 font-display text-lg font-extrabold tracking-wider uppercase text-emerald-950 border border-emerald-300 outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[11px] font-semibold text-emerald-800 mt-1.5">
                🛡️ Enter the unique code from your child's SmartSlate profile to link their account securely. (Demo code: <strong>STU-AARAV5A</strong>)
              </p>
            </div>

            <div className="pt-4">
              <BigButton
                color="green"
                type="submit"
                disabled={loading}
                className="w-full min-h-14 text-base shadow-soft"
              >
                {loading ? "Linking Child..." : "Link Child & Create Profile → 👨‍👩‍👧"}
              </BigButton>
            </div>
          </form>
        )}

        {/* ALREADY REGISTERED FOOTER */}
        <div className="mt-6 pt-4 border-t border-border text-center">
          <p className="font-sans text-sm font-semibold text-muted-foreground">
            Already have a profile?{" "}
            <Link to="/login" className="font-display font-extrabold text-primary hover:underline">
              Log in here →
            </Link>
          </p>
        </div>
      </GlassCard>

      {/* STUDENT CODE CONFIRMATION MODAL */}
      {createdStudent && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-[2.5rem] bg-card p-7 text-center shadow-pop animate-pop-in">
            <Slatey size={80} mood="cheer" className="mx-auto" />
            <h2 className="mt-3 font-display text-2xl font-extrabold uppercase">
              🎉 Welcome, {createdStudent.fullName}!
            </h2>
            <p className="mt-1 text-sm font-bold text-muted-foreground">
              Your student profile has been created successfully.
            </p>

            {/* CODE BADGE */}
            <div className="mt-5 p-4 rounded-2xl bg-primary/10 border-2 border-primary/30">
              <p className="font-display text-xs font-extrabold uppercase text-primary mb-1">
                YOUR UNIQUE STUDENT CODE
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className="font-display text-2xl font-black tracking-wider text-foreground">
                  {createdStudent.studentCode}
                </span>
                <button
                  type="button"
                  onClick={() => copyCode(createdStudent.studentCode)}
                  className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-xs hover:bg-primary/90"
                  title="Copy Code"
                >
                  {copied ? <CheckCircle className="size-4" /> : <Copy className="size-4" />}
                </button>
              </div>
              <p className="text-[11px] font-semibold text-muted-foreground mt-2">
                Give this code to your parents so they can connect with your SmartSlate!
              </p>
            </div>

            <div className="mt-6">
              <BigButton
                color="green"
                onClick={() => navigate({ to: "/student" })}
                className="w-full min-h-12 text-base"
              >
                Open My SmartSlate Slate 🎒 →
              </BigButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
