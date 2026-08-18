// ============================================================================
// SMARTSLATE — SHARED AUTHENTICATION & FIRESTORE SERVICE
// Connects Student, Teacher, and Parent Apps to the Common Firestore Database
// ============================================================================

export type UserRole = "student" | "teacher" | "parent";

export interface UserRecord {
  uid: string;
  role: UserRole;
  email: string;
  displayName: string;
  profileId: string;
  createdAt: string;
}

export interface StudentRecord {
  id: string;
  userId: string;
  fullName: string;
  studentCode: string; // e.g. "STU-AARAV5A" or "STU-7F82K"
  dateOfBirth?: string;
  grade: string; // "Grade 5" or "5"
  section: string; // "A"
  schoolName: string;
  parentNames?: string;
  parentContact?: string;
  parentIds: string[]; // Linked parent user IDs
  teacherIds: string[]; // Assigned teacher user IDs
  classId: string; // "class-grade-5-a"
  stars: number;
  avatar: string;
  createdAt: string;
}

export interface TeacherRecord {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  schoolName: string;
  subjects: string[]; // e.g. ["Mathematics", "Science"]
  classes: string[]; // e.g. ["Grade 5-A"]
  assignedClassIds: string[];
  createdAt: string;
}

export interface ParentRecord {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  relationship: string; // "Mother" | "Father" | "Guardian"
  linkedStudentIds: string[]; // IDs of linked students
  linkedStudentCodes: string[]; // Codes of linked students
  createdAt: string;
}

export interface ClassRecord {
  id: string;
  name: string;
  grade: string;
  section: string;
  schoolName: string;
  teacherIds: string[];
  studentIds: string[];
}

import { registerFirebaseUser, loginFirebaseUser } from "@/firebase/auth";
import { saveUserProfile } from "@/firebase/services/userService";
import { createStudent } from "@/firebase/services/studentService";
import { createTeacher } from "@/firebase/services/teacherService";
import { createParent, linkChildToParent } from "@/firebase/services/parentService";


// STORAGE KEYS FOR SHARED DATABASE
const KEY_CURRENT_USER = "smartslate_current_user";
const KEY_USERS_DB = "smartslate_firestore_users";
const KEY_STUDENTS_DB = "smartslate_firestore_students";
const KEY_TEACHERS_DB = "smartslate_firestore_teachers";
const KEY_PARENTS_DB = "smartslate_firestore_parents";
const KEY_CLASSES_DB = "smartslate_firestore_classes";


// INITIAL PRE-SEEDED REALISTIC INDIAN DEMO DATA
const DEFAULT_STUDENTS: StudentRecord[] = [
  {
    id: "stu-aarav-5a",
    userId: "user-stu-aarav",
    fullName: "Aarav Sharma",
    studentCode: "STU-AARAV5A",
    dateOfBirth: "2015-05-12",
    grade: "Grade 5",
    section: "A",
    schoolName: "Delhi Public School, R.K. Puram",
    parentNames: "Anjali Sharma",
    parentContact: "+91 98765 43210",
    parentIds: ["user-parent-anjali"],
    teacherIds: ["user-teacher-priya"],
    classId: "class-grade-5-a",
    stars: 120,
    avatar: "🦊",
    createdAt: new Date().toISOString(),
  },
  {
    id: "stu-ananya-5a",
    userId: "user-stu-ananya",
    fullName: "Ananya Patel",
    studentCode: "STU-ANANYA5A",
    dateOfBirth: "2015-08-20",
    grade: "Grade 5",
    section: "A",
    schoolName: "Delhi Public School, R.K. Puram",
    parentNames: "Suresh Patel",
    parentContact: "+91 98765 43211",
    parentIds: [],
    teacherIds: ["user-teacher-priya"],
    classId: "class-grade-5-a",
    stars: 110,
    avatar: "🌸",
    createdAt: new Date().toISOString(),
  },
  {
    id: "stu-rahul-5a",
    userId: "user-stu-rahul",
    fullName: "Rahul Verma",
    studentCode: "STU-RAHUL5A",
    dateOfBirth: "2015-02-14",
    grade: "Grade 5",
    section: "A",
    schoolName: "Delhi Public School, R.K. Puram",
    parentNames: "Meena Verma",
    parentContact: "+91 98765 43212",
    parentIds: [],
    teacherIds: ["user-teacher-priya"],
    classId: "class-grade-5-a",
    stars: 95,
    avatar: "🐼",
    createdAt: new Date().toISOString(),
  },
  {
    id: "stu-sneha-5a",
    userId: "user-stu-sneha",
    fullName: "Sneha Reddy",
    studentCode: "STU-SNEHA5A",
    dateOfBirth: "2015-11-04",
    grade: "Grade 5",
    section: "A",
    schoolName: "Delhi Public School, R.K. Puram",
    parentNames: "Rajesh Reddy",
    parentContact: "+91 98765 43213",
    parentIds: [],
    teacherIds: ["user-teacher-priya"],
    classId: "class-grade-5-a",
    stars: 140,
    avatar: "🐧",
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_TEACHERS: TeacherRecord[] = [
  {
    id: "teacher-priya",
    userId: "user-teacher-priya",
    fullName: "Ms. Priya Sharma",
    email: "priya.sharma@smartslate.edu.in",
    schoolName: "Delhi Public School, R.K. Puram",
    subjects: ["Mathematics", "Science"],
    classes: ["Grade 5-A"],
    assignedClassIds: ["class-grade-5-a"],
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_PARENTS: ParentRecord[] = [
  {
    id: "parent-anjali",
    userId: "user-parent-anjali",
    fullName: "Anjali Sharma",
    email: "anjali.sharma@smartslate.edu.in",
    phone: "+91 98765 43210",
    relationship: "Mother",
    linkedStudentIds: ["stu-aarav-5a"],
    linkedStudentCodes: ["STU-AARAV5A"],
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_CLASSES: ClassRecord[] = [
  {
    id: "class-grade-5-a",
    name: "Grade 5-A",
    grade: "5",
    section: "A",
    schoolName: "Delhi Public School, R.K. Puram",
    teacherIds: ["user-teacher-priya"],
    studentIds: ["stu-aarav-5a", "stu-ananya-5a", "stu-rahul-5a", "stu-sneha-5a"],
  },
];

const DEFAULT_USERS: UserRecord[] = [
  {
    uid: "user-stu-aarav",
    role: "student",
    email: "aarav@smartslate.edu.in",
    displayName: "Aarav Sharma",
    profileId: "stu-aarav-5a",
    createdAt: new Date().toISOString(),
  },
  {
    uid: "user-teacher-priya",
    role: "teacher",
    email: "priya.sharma@smartslate.edu.in",
    displayName: "Ms. Priya Sharma",
    profileId: "teacher-priya",
    createdAt: new Date().toISOString(),
  },
  {
    uid: "user-parent-anjali",
    role: "parent",
    email: "anjali.sharma@smartslate.edu.in",
    displayName: "Anjali Sharma",
    profileId: "parent-anjali",
    createdAt: new Date().toISOString(),
  },
];

// Helper: Read/Write from local storage database
function getStorage<T>(key: string, defaultVal: T): T {
  try {
    if (typeof window === "undefined") return defaultVal;
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultVal));
      return defaultVal;
    }
    return JSON.parse(raw);
  } catch {
    return defaultVal;
  }
}

function setStorage<T>(key: string, val: T): void {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, JSON.stringify(val));
    }
  } catch (e) {
    console.error(`[SmartSlate DB] Error saving ${key}:`, e);
  }
}

// Generate random uppercase Student Code e.g. "STU-7F82K"
export function generateStudentCode(name: string, grade: string, section: string): string {
  const cleanName = name.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 5) || "STU";
  const num = Math.floor(1000 + Math.random() * 9000);
  return `STU-${cleanName}${grade.replace(/[^0-9]/g, "") || "5"}${section.toUpperCase() || "A"}-${num.toString().slice(-2)}`;
}

// -------------------------------------------------------------
// AUTHENTICATION & REGISTRATION API
// -------------------------------------------------------------

export function getCurrentUser(): UserRecord | null {
  return getStorage<UserRecord | null>(KEY_CURRENT_USER, DEFAULT_USERS[0]!);
}

export function setCurrentUser(user: UserRecord | null): void {
  setStorage(KEY_CURRENT_USER, user);
}

// REGISTER STUDENT
export async function registerStudent(data: {
  fullName: string;
  dateOfBirth?: string;
  grade: string;
  section: string;
  schoolName: string;
  parentNames?: string;
  parentContact?: string;
  email?: string;
  password?: string;
}): Promise<{ user: UserRecord; student: StudentRecord }> {
  const users = getStorage<UserRecord[]>(KEY_USERS_DB, DEFAULT_USERS);
  const students = getStorage<StudentRecord[]>(KEY_STUDENTS_DB, DEFAULT_STUDENTS);

  const email = data.email?.trim() || `${data.fullName.toLowerCase().replace(/\s+/g, ".")}@smartslate.edu.in`;
  const password = data.password || "SmartSlate123!";

  // 1. Create in Firebase Authentication
  const authRes = await registerFirebaseUser(email, password);
  if (!authRes.success || !authRes.uid) {
    throw new Error(authRes.error || "Failed to create Firebase Auth user.");
  }
  const uid = authRes.uid;
  const studentId = uid;
  const studentCode = generateStudentCode(data.fullName, data.grade, data.section);

  console.log('[SmartSlate Firestore] Diagnostic Write Details:', {
    projectId: 'smartslate-bd117',
    collection: 'students',
    documentId: uid,
    uidMatch: uid === authRes.uid
  });

  const newStudent: StudentRecord = {
    id: studentId,
    userId: uid,
    fullName: data.fullName.trim(),
    studentCode,
    dateOfBirth: data.dateOfBirth,
    grade: data.grade,
    section: data.section.toUpperCase(),
    schoolName: data.schoolName.trim(),
    parentNames: data.parentNames?.trim(),
    parentContact: data.parentContact?.trim(),
    parentIds: [],
    teacherIds: ["user-teacher-priya"],
    classId: `class-grade-${data.grade.replace(/[^0-9]/g, "") || "5"}-${data.section.toLowerCase() || "a"}`,
    stars: 50,
    avatar: "🦊",
    createdAt: new Date().toISOString(),
  };

  const newUser: UserRecord = {
    uid,
    role: "student",
    email,
    displayName: data.fullName.trim(),
    profileId: studentId,
    createdAt: new Date().toISOString(),
  };

  // 2. Save to Cloud Firestore (students/{uid})
  try {
    await createStudent({
      uid,
      name: data.fullName.trim(),
      grade: data.grade,
      section: data.section.toUpperCase(),
      schoolName: data.schoolName.trim(),
      studentCode,
      classId: newStudent.classId,
      parentIds: [],
      teacherIds: ["user-teacher-priya"],
      stars: 50,
      avatar: "🦊",
      createdAt: newStudent.createdAt,
    });
  } catch (err: any) {
    console.error("[SmartSlate Firestore] Profile creation failed:", err);
    throw new Error("Account authentication was created, but your student profile could not be saved. Please try again.");
  }

  // 3. Local sync
  setStorage(KEY_USERS_DB, [...users, newUser]);
  setStorage(KEY_STUDENTS_DB, [...students, newStudent]);
  setCurrentUser(newUser);

  return { user: newUser, student: newStudent };
}

// REGISTER TEACHER
export async function registerTeacher(data: {
  fullName: string;
  email: string;
  password?: string;
  schoolName: string;
  subjects: string[];
  classes: string[];
}): Promise<{ user: UserRecord; teacher: TeacherRecord }> {
  const users = getStorage<UserRecord[]>(KEY_USERS_DB, DEFAULT_USERS);
  const teachers = getStorage<TeacherRecord[]>(KEY_TEACHERS_DB, DEFAULT_TEACHERS);

  const email = data.email.trim().toLowerCase();
  const password = data.password || "SmartSlateTeacher123!";

  // 1. Create in Firebase Authentication
  const authRes = await registerFirebaseUser(email, password);
  const uid = authRes.uid || `user-teacher-${Date.now()}`;
  const teacherId = uid;

  const newTeacher: TeacherRecord = {
    id: teacherId,
    userId: uid,
    fullName: data.fullName.trim(),
    email,
    schoolName: data.schoolName.trim(),
    subjects: data.subjects.length > 0 ? data.subjects : ["Mathematics"],
    classes: data.classes.length > 0 ? data.classes : ["Grade 5-A"],
    assignedClassIds: ["class-grade-5-a"],
    createdAt: new Date().toISOString(),
  };

  const newUser: UserRecord = {
    uid,
    role: "teacher",
    email,
    displayName: data.fullName.trim(),
    profileId: teacherId,
    createdAt: new Date().toISOString(),
  };

  // 2. Save to Cloud Firestore
  await saveUserProfile({
    uid,
    name: data.fullName.trim(),
    email,
    role: "teacher",
    createdAt: newUser.createdAt,
  });
  await createTeacher({
    uid,
    name: data.fullName.trim(),
    email,
    schoolName: data.schoolName.trim(),
    classIds: ["class-grade-5-a"],
    subjects: newTeacher.subjects,
    createdAt: newTeacher.createdAt,
  });

  // 3. Local sync
  setStorage(KEY_USERS_DB, [...users, newUser]);
  setStorage(KEY_TEACHERS_DB, [...teachers, newTeacher]);
  setCurrentUser(newUser);

  return { user: newUser, teacher: newTeacher };
}

// REGISTER PARENT & LINK STUDENT CODE
export async function registerParent(data: {
  fullName: string;
  email: string;
  phone: string;
  relationship: string;
  studentCode: string; // The child's code e.g. "STU-AARAV5A"
  password?: string;
}): Promise<{ user: UserRecord; parent: ParentRecord; linkedStudent: StudentRecord | null }> {
  const users = getStorage<UserRecord[]>(KEY_USERS_DB, DEFAULT_USERS);
  const parents = getStorage<ParentRecord[]>(KEY_PARENTS_DB, DEFAULT_PARENTS);
  const students = getStorage<StudentRecord[]>(KEY_STUDENTS_DB, DEFAULT_STUDENTS);

  const email = data.email.trim().toLowerCase();
  const password = data.password || "SmartSlateParent123!";

  // 1. Create in Firebase Authentication
  const authRes = await registerFirebaseUser(email, password);
  const uid = authRes.uid || `user-parent-${Date.now()}`;
  const parentId = uid;

  // Validate student code
  const code = data.studentCode.trim().toUpperCase();
  const matchedStudent = students.find((s) => s.studentCode.toUpperCase() === code) || null;

  const linkedStudentIds = matchedStudent ? [matchedStudent.id] : [];
  const linkedStudentCodes = matchedStudent ? [matchedStudent.studentCode] : (code ? [code] : []);

  const newParent: ParentRecord = {
    id: parentId,
    userId: uid,
    fullName: data.fullName.trim(),
    email,
    phone: data.phone.trim(),
    relationship: data.relationship || "Mother",
    linkedStudentIds,
    linkedStudentCodes,
    createdAt: new Date().toISOString(),
  };

  const newUser: UserRecord = {
    uid,
    role: "parent",
    email,
    displayName: data.fullName.trim(),
    profileId: parentId,
    createdAt: new Date().toISOString(),
  };

  // 2. Save to Cloud Firestore & Link
  await saveUserProfile({
    uid,
    name: data.fullName.trim(),
    email,
    role: "parent",
    createdAt: newUser.createdAt,
  });
  await createParent({
    uid,
    name: data.fullName.trim(),
    email,
    phone: data.phone.trim(),
    relationship: data.relationship || "Mother",
    studentIds: linkedStudentIds,
    studentCodes: linkedStudentCodes,
    createdAt: newParent.createdAt,
  });

  if (matchedStudent) {
    await linkChildToParent(uid, matchedStudent.userId, matchedStudent.studentCode);
    const updatedStudents = students.map((s) =>
      s.id === matchedStudent.id ? { ...s, parentIds: [...(s.parentIds || []), uid] } : s
    );
    setStorage(KEY_STUDENTS_DB, updatedStudents);
  }

  // 3. Local sync
  setStorage(KEY_USERS_DB, [...users, newUser]);
  setStorage(KEY_PARENTS_DB, [...parents, newParent]);
  setCurrentUser(newUser);

  return { user: newUser, parent: newParent, linkedStudent: matchedStudent };
}

// LOGIN USER BY EMAIL / ROLE
export async function loginUser(emailOrCode: string, password?: string): Promise<UserRecord | null> {
  const users = getStorage<UserRecord[]>(KEY_USERS_DB, DEFAULT_USERS);
  const students = getStorage<StudentRecord[]>(KEY_STUDENTS_DB, DEFAULT_STUDENTS);

  const query = emailOrCode.trim().toLowerCase();

  // Try live Firebase Auth if email contains @
  if (query.includes("@") && password) {
    await loginFirebaseUser(query, password);
  }

  // Try matching user by email
  let matchedUser = users.find((u) => u.email.toLowerCase() === query);

  // If not found, try matching student by code
  if (!matchedUser) {
    const matchedStudent = students.find((s) => s.studentCode.toLowerCase() === query);
    if (matchedStudent) {
      matchedUser = users.find((u) => u.uid === matchedStudent.userId);
    }
  }

  if (matchedUser) {
    setCurrentUser(matchedUser);
    return matchedUser;
  }

  // Fallback demo user
  const fallback = DEFAULT_USERS[0]!;
  setCurrentUser(fallback);
  return fallback;
}



// QUICK 1-CLICK DEMO LOGIN FOR TESTING
export function quickDemoLogin(role: UserRole): UserRecord {
  const users = getStorage<UserRecord[]>(KEY_USERS_DB, DEFAULT_USERS);
  const matched = users.find((u) => u.role === role) || DEFAULT_USERS.find((u) => u.role === role)!;
  setCurrentUser(matched);
  return matched;
}

// -------------------------------------------------------------
// FIRESTORE QUERIES FOR DASHBOARDS
// -------------------------------------------------------------

// Get strictly linked students for a parent
export function getLinkedStudentsForParent(parentUserId?: string): StudentRecord[] {
  const currentUser = getCurrentUser();
  const uid = parentUserId || currentUser?.uid;
  if (!uid) return [];

  const parents = getStorage<ParentRecord[]>(KEY_PARENTS_DB, DEFAULT_PARENTS);
  const students = getStorage<StudentRecord[]>(KEY_STUDENTS_DB, DEFAULT_STUDENTS);

  const parent = parents.find((p) => p.userId === uid || p.id === uid);
  if (!parent) return [DEFAULT_STUDENTS[0]!]; // Default linked child for demo

  return students.filter(
    (s) =>
      parent.linkedStudentIds.includes(s.id) ||
      parent.linkedStudentCodes.includes(s.studentCode) ||
      (s.parentIds && s.parentIds.includes(uid))
  );
}

// Link an additional child to parent via Student Code
export function linkStudentToParent(parentUserId: string, studentCode: string): { success: boolean; student?: StudentRecord; message: string } {
  const parents = getStorage<ParentRecord[]>(KEY_PARENTS_DB, DEFAULT_PARENTS);
  const students = getStorage<StudentRecord[]>(KEY_STUDENTS_DB, DEFAULT_STUDENTS);

  const code = studentCode.trim().toUpperCase();
  const student = students.find((s) => s.studentCode.toUpperCase() === code);

  if (!student) {
    return { success: false, message: `Student Code "${code}" not found. Please check with the school/child.` };
  }

  const parentIndex = parents.findIndex((p) => p.userId === parentUserId || p.id === parentUserId);
  if (parentIndex === -1) {
    return { success: false, message: "Parent profile not found." };
  }

  const parent = parents[parentIndex]!;
  if (parent.linkedStudentIds.includes(student.id)) {
    return { success: true, student, message: `${student.fullName} is already linked to your account.` };
  }

  const updatedParent = {
    ...parent,
    linkedStudentIds: [...parent.linkedStudentIds, student.id],
    linkedStudentCodes: [...parent.linkedStudentCodes, student.studentCode],
  };

  parents[parentIndex] = updatedParent;
  setStorage(KEY_PARENTS_DB, parents);

  // Two-way link
  const updatedStudents = students.map((s) =>
    s.id === student.id ? { ...s, parentIds: [...(s.parentIds || []), parentUserId] } : s
  );
  setStorage(KEY_STUDENTS_DB, updatedStudents);

  return { success: true, student, message: `Successfully linked ${student.fullName} (${student.grade}-${student.section})! 🎉` };
}

// Get all students for a teacher's class
export function getStudentsForTeacher(teacherUserId?: string): StudentRecord[] {
  const currentUser = getCurrentUser();
  const uid = teacherUserId || currentUser?.uid;
  const teachers = getStorage<TeacherRecord[]>(KEY_TEACHERS_DB, DEFAULT_TEACHERS);
  const students = getStorage<StudentRecord[]>(KEY_STUDENTS_DB, DEFAULT_STUDENTS);

  const teacher = teachers.find((t) => t.userId === uid || t.id === uid);
  if (!teacher) return students;

  return students.filter(
    (s) =>
      teacher.assignedClassIds.includes(s.classId) ||
      teacher.classes.some((c) => c.includes(s.grade) || c.includes(`${s.grade}-${s.section}`)) ||
      (s.teacherIds && s.teacherIds.includes(uid!))
  );
}

// Get current student's full profile record
export function getCurrentStudentRecord(): StudentRecord {
  const currentUser = getCurrentUser();
  const students = getStorage<StudentRecord[]>(KEY_STUDENTS_DB, DEFAULT_STUDENTS);
  if (!currentUser) return DEFAULT_STUDENTS[0]!;

  return (
    students.find((s) => s.userId === currentUser.uid || s.id === currentUser.profileId) ||
    DEFAULT_STUDENTS[0]!
  );
}
