// ============================================================================
// SMARTSLATE — DEDICATED CLOUD FIRESTORE SERVICE
// Manages Firestore collections: users, students, teachers, parents, classes
// ============================================================================

import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import type {
  UserRecord,
  StudentRecord,
  TeacherRecord,
  ParentRecord,
  ClassRecord,
} from "./authService";

// -------------------------------------------------------------
// 1. USERS COLLECTION (users/{uid})
// -------------------------------------------------------------
export async function saveUserDoc(user: UserRecord): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  try {
    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, {
      ...user,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error("[SmartSlate Firestore] Error saving user doc:", error);
  }
}

export async function getUserDoc(uid: string): Promise<UserRecord | null> {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserRecord;
    }
    return null;
  } catch (error) {
    console.error("[SmartSlate Firestore] Error reading user doc:", error);
    return null;
  }
}

// -------------------------------------------------------------
// 2. STUDENTS COLLECTION (students/{studentId})
// -------------------------------------------------------------
export async function saveStudentDoc(student: StudentRecord): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  try {
    const studentRef = doc(db, "students", student.id);
    await setDoc(studentRef, {
      ...student,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error("[SmartSlate Firestore] Error saving student doc:", error);
  }
}

export async function getStudentDoc(studentId: string): Promise<StudentRecord | null> {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const studentRef = doc(db, "students", studentId);
    const snap = await getDoc(studentRef);
    if (snap.exists()) {
      return snap.data() as StudentRecord;
    }
    return null;
  } catch (error) {
    console.error("[SmartSlate Firestore] Error reading student doc:", error);
    return null;
  }
}

export async function getStudentByCodeDoc(studentCode: string): Promise<StudentRecord | null> {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const q = query(
      collection(db, "students"),
      where("studentCode", "==", studentCode.trim().toUpperCase())
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs[0]!.data() as StudentRecord;
    }
    return null;
  } catch (error) {
    console.error("[SmartSlate Firestore] Error querying student code:", error);
    return null;
  }
}

export async function getStudentsByClassDoc(classId: string): Promise<StudentRecord[]> {
  if (!isFirebaseConfigured || !db) return [];
  try {
    const q = query(collection(db, "students"), where("classId", "==", classId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data() as StudentRecord);
  } catch (error) {
    console.error("[SmartSlate Firestore] Error querying class students:", error);
    return [];
  }
}

// -------------------------------------------------------------
// 3. TEACHERS COLLECTION (teachers/{teacherId})
// -------------------------------------------------------------
export async function saveTeacherDoc(teacher: TeacherRecord): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  try {
    const teacherRef = doc(db, "teachers", teacher.id);
    await setDoc(teacherRef, {
      ...teacher,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error("[SmartSlate Firestore] Error saving teacher doc:", error);
  }
}

export async function getTeacherDoc(teacherId: string): Promise<TeacherRecord | null> {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const teacherRef = doc(db, "teachers", teacherId);
    const snap = await getDoc(teacherRef);
    if (snap.exists()) {
      return snap.data() as TeacherRecord;
    }
    return null;
  } catch (error) {
    console.error("[SmartSlate Firestore] Error reading teacher doc:", error);
    return null;
  }
}

// -------------------------------------------------------------
// 4. PARENTS COLLECTION (parents/{parentId})
// -------------------------------------------------------------
export async function saveParentDoc(parent: ParentRecord): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  try {
    const parentRef = doc(db, "parents", parent.id);
    await setDoc(parentRef, {
      ...parent,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error("[SmartSlate Firestore] Error saving parent doc:", error);
  }
}

export async function getParentDoc(parentId: string): Promise<ParentRecord | null> {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const parentRef = doc(db, "parents", parentId);
    const snap = await getDoc(parentRef);
    if (snap.exists()) {
      return snap.data() as ParentRecord;
    }
    return null;
  } catch (error) {
    console.error("[SmartSlate Firestore] Error reading parent doc:", error);
    return null;
  }
}

export async function linkStudentToParentDoc(
  parentId: string,
  studentId: string,
  studentCode: string,
  parentUserId: string
): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  try {
    const parentRef = doc(db, "parents", parentId);
    await updateDoc(parentRef, {
      linkedStudentIds: arrayUnion(studentId),
      linkedStudentCodes: arrayUnion(studentCode),
      updatedAt: serverTimestamp(),
    });

    const studentRef = doc(db, "students", studentId);
    await updateDoc(studentRef, {
      parentIds: arrayUnion(parentUserId),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("[SmartSlate Firestore] Error linking student and parent:", error);
  }
}

// -------------------------------------------------------------
// 5. CLASSES COLLECTION (classes/{classId})
// -------------------------------------------------------------
export async function saveClassDoc(classRec: ClassRecord): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  try {
    const classRef = doc(db, "classes", classRec.id);
    await setDoc(classRef, {
      ...classRec,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error("[SmartSlate Firestore] Error saving class doc:", error);
  }
}
