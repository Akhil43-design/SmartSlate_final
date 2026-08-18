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
  if (!isFirebaseConfigured || !db) {
    if (typeof localStorage !== "undefined") {
      try {
        const cached = localStorage.getItem(`smartslate_teacher_cache_${uid}`);
        if (cached) return JSON.parse(cached);
      } catch (e) {}
    }
    return null;
  }
  try {
    const ref = doc(db, "teachers", uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as FirestoreTeacher;
      if (typeof localStorage !== "undefined") {
        try {
          localStorage.setItem(`smartslate_teacher_cache_${uid}`, JSON.stringify(data));
        } catch (e) {}
      }
      return data;
    }
    return null;
  } catch (error) {
    console.warn("[SmartSlate Firestore] getTeacher error, trying local cache:", error);
    if (typeof localStorage !== "undefined") {
      try {
        const cached = localStorage.getItem(`smartslate_teacher_cache_${uid}`);
        if (cached) return JSON.parse(cached);
      } catch (e) {}
    }
    return null;
  }
}
