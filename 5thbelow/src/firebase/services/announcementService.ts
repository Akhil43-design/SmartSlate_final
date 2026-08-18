// ============================================================================
// ANNOUNCEMENTS COLLECTION SERVICE (announcements/{id})
// ============================================================================

import { doc, setDoc, getDocs, collection, serverTimestamp } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../config";

export interface FirestoreAnnouncement {
  id: string;
  title: string;
  body: string;
  emoji: string;
  author: string;
  targetClassId?: string;
  createdAt?: string;
}

export async function saveAnnouncement(announcement: FirestoreAnnouncement): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  try {
    const ref = doc(db, "announcements", announcement.id);
    await setDoc(ref, {
      ...announcement,
      createdAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error("[SmartSlate Firestore] saveAnnouncement error:", error);
  }
}

export async function getAnnouncements(): Promise<FirestoreAnnouncement[]> {
  if (!isFirebaseConfigured || !db) return [];
  try {
    const snapshot = await getDocs(collection(db, "announcements"));
    return snapshot.docs.map((d) => d.data() as FirestoreAnnouncement);
  } catch (error) {
    console.error("[SmartSlate Firestore] getAnnouncements error:", error);
    return [];
  }
}
