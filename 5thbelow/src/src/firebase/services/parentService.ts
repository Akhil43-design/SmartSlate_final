// ============================================================================
// PARENTS COLLECTION SERVICE (parents/{uid})
// ============================================================================

import { doc, setDoc, getDoc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../config";

export interface FirestoreParent {
  uid: string;
  name: string;
  email: string;
  phone: string;
  relationship: string;
  studentIds: string[];
  studentCodes: string[];
  createdAt: string;
}

export async function createParent(parent: FirestoreParent): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  try {
    const ref = doc(db, "parents", parent.uid);
    await setDoc(ref, {
      ...parent,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error("[SmartSlate Firestore] createParent error:", error);
  }
}

export async function getParent(uid: string): Promise<FirestoreParent | null> {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const ref = doc(db, "parents", uid);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as FirestoreParent) : null;
  } catch (error) {
    console.error("[SmartSlate Firestore] getParent error:", error);
    return null;
  }
}

export async function linkChildToParent(
  parentUid: string,
  studentUid: string,
  studentCode: string
): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  try {
    const parentRef = doc(db, "parents", parentUid);
    await updateDoc(parentRef, {
      studentIds: arrayUnion(studentUid),
      studentCodes: arrayUnion(studentCode),
      updatedAt: serverTimestamp(),
    });

    const studentRef = doc(db, "students", studentUid);
    await updateDoc(studentRef, {
      parentIds: arrayUnion(parentUid),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("[SmartSlate Firestore] linkChildToParent error:", error);
  }
}
