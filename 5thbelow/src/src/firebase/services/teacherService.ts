// ============================================================================
// TEACHERS COLLECTION SERVICE (teachers/{uid})
// ============================================================================

import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../config";

export interface FirestoreTeacher {
  uid: string;
  name: string;
  email: string;
  schoolName: string;
  classIds: string[];
  subjects: string[];
  createdAt: string;
}

export async function createTeacher(teacher: FirestoreTeacher): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  try {
    const ref = doc(db, "teachers", teacher.uid);
    await setDoc(ref, {
      ...teacher,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error("[SmartSlate Firestore] createTeacher error:", error);
  }
}

export async function getTeacher(uid: string): Promise<FirestoreTeacher | null> {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const ref = doc(db, "teachers", uid);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as FirestoreTeacher) : null;
  } catch (error) {
    console.error("[SmartSlate Firestore] getTeacher error:", error);
    return null;
  }
}
