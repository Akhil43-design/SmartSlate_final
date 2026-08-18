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
    throw error;
  }
}

let memoryStudentCache: { uid: string; data: FirestoreStudent } | null = null;

export function clearStudentCache(): void {
  memoryStudentCache = null;
}

export async function getStudent(uid: string, forceRefresh = false): Promise<FirestoreStudent | null> {
  if (!isFirebaseConfigured || !db) return null;
  if (!forceRefresh && memoryStudentCache && memoryStudentCache.uid === uid) {
    return memoryStudentCache.data;
  }

  console.log(`[PROFILE]\nReading:\nstudents/${uid}`);
  try {
    const ref = doc(db, "students", uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      console.warn(`[PROFILE] Document students/${uid} does not exist in Firestore.`);
      return null;
    }
    const data = snap.data() as FirestoreStudent;
    const firestoreUid = data.uid || uid;
    const profileName = data.name || (data as any).fullName || "Unknown";
    const uidMatch = firestoreUid === uid;

    console.log(`[PROFILE]\nFirestore UID:\n${firestoreUid}`);
    console.log(`[PROFILE]\nProfile name:\n${profileName}`);
    console.log(`[PROFILE]\nUID MATCH:\n${uidMatch}`);

    if (!uidMatch) {
      console.error("[PROFILE ERROR] UID Match Failed! Blocking profile load.");
      return null;
    }

    memoryStudentCache = { uid, data };
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem(`smartslate_student_cache_${uid}`, JSON.stringify(data));
      } catch (e) {}
    }
    return data;
  } catch (error) {
    console.warn("[SmartSlate Firestore] getStudent network error, attempting local cache fallback:", error);
    if (typeof localStorage !== "undefined") {
      try {
        const localData = localStorage.getItem(`smartslate_student_cache_${uid}`);
        if (localData) {
          const parsed = JSON.parse(localData) as FirestoreStudent;
          if (parsed && parsed.uid === uid) {
            console.log(`[PROFILE] Loaded from local cache: ${parsed.name}`);
            memoryStudentCache = { uid, data: parsed };
            return parsed;
          }
        }
      } catch (e) {}
    }
    if (memoryStudentCache && memoryStudentCache.uid === uid) {
      return memoryStudentCache.data;
    }
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
