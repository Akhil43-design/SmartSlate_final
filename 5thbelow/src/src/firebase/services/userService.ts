// ============================================================================
// USERS COLLECTION SERVICE (users/{uid})
// ============================================================================

import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../config";

export interface FirestoreUserProfile {
  uid: string;
  name: string;
  email: string;
  role: "student" | "teacher" | "parent";
  createdAt: string;
}

export async function saveUserProfile(user: FirestoreUserProfile): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  try {
    const ref = doc(db, "users", user.uid);
    await setDoc(ref, {
      ...user,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error("[SmartSlate Firestore] saveUserProfile error:", error);
  }
}

export async function getUserProfile(uid: string): Promise<FirestoreUserProfile | null> {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as FirestoreUserProfile) : null;
  } catch (error) {
    console.error("[SmartSlate Firestore] getUserProfile error:", error);
    return null;
  }
}
