// ============================================================================
// ASSIGNMENTS COLLECTION SERVICE (assignments/{id})
// ============================================================================

import { doc, setDoc, getDocs, collection, query, where, serverTimestamp } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../config";

export interface FirestoreAssignment {
  id: string;
  title: string;
  subject: string;
  grade: string;
  section: string;
  teacherId: string;
  dueDate: string;
  totalPoints: number;
}

export async function saveAssignment(assignment: FirestoreAssignment): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  try {
    const ref = doc(db, "assignments", assignment.id);
    await setDoc(ref, {
      ...assignment,
      createdAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error("[SmartSlate Firestore] saveAssignment error:", error);
  }
}

export async function getAssignmentsForClass(grade: string, section: string): Promise<FirestoreAssignment[]> {
  if (!isFirebaseConfigured || !db) return [];
  try {
    const q = query(
      collection(db, "assignments"),
      where("grade", "==", grade),
      where("section", "==", section)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data() as FirestoreAssignment);
  } catch (error) {
    console.error("[SmartSlate Firestore] getAssignments error:", error);
    return [];
  }
}
