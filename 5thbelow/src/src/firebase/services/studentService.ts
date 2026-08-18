// ============================================================================
// STUDENTS COLLECTION SERVICE (students/{uid})
// ============================================================================

import { doc, setDoc, getDoc, getDocs, collection, query, where, serverTimestamp } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../config";

export interface FirestoreStudent {
  uid: string;
  name: string;
  grade: string;
  section: string;
  schoolName: string;
  studentCode: string;
  classId: string;
  parentIds: string[];
  teacherIds: string[];
  stars: number;
  avatar: string;
  createdAt: string;
}

export async function createStudent(student: FirestoreStudent): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  try {
    const ref = doc(db, "students", student.uid);
    await setDoc(ref, {
      ...student,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error("[SmartSlate Firestore] createStudent error:", error);
  }
}

export async function getStudent(uid: string): Promise<FirestoreStudent | null> {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const ref = doc(db, "students", uid);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as FirestoreStudent) : null;
  } catch (error) {
    console.error("[SmartSlate Firestore] getStudent error:", error);
    return null;
  }
}

export async function getStudentByCode(studentCode: string): Promise<FirestoreStudent | null> {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const q = query(
      collection(db, "students"),
      where("studentCode", "==", studentCode.trim().toUpperCase())
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs[0]!.data() as FirestoreStudent;
    }
    return null;
  } catch (error) {
    console.error("[SmartSlate Firestore] getStudentByCode error:", error);
    return null;
  }
}

export async function getStudentsByClass(classId: string): Promise<FirestoreStudent[]> {
  if (!isFirebaseConfigured || !db) return [];
  try {
    const q = query(collection(db, "students"), where("classId", "==", classId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data() as FirestoreStudent);
  } catch (error) {
    console.error("[SmartSlate Firestore] getStudentsByClass error:", error);
    return [];
  }
}
