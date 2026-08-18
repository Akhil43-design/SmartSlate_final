// ============================================================================
// NOTES COLLECTION SERVICE (students/{studentUid}/notes/{noteId})
// Synchronizes digital slate notebook state to Firestore under student UID subcollection
// ============================================================================

import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db, auth, isFirebaseConfigured } from "../config";
import type { NotebookData } from "@/lib/notebookStorage";

export async function syncNoteToFirestore(subjectId: string, data: NotebookData, studentUid?: string): Promise<void> {
  if (!isFirebaseConfigured || !db) return;

  const currentAuthUid = auth?.currentUser?.uid || null;
  const uid = studentUid || currentAuthUid;
  const noteDocId = uid ? `${uid}_${subjectId}` : `${subjectId}`;
  const firestorePath = uid ? `students/${uid}/notes/${noteDocId}` : `notes/${noteDocId}`;
  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

  console.log(`[NOTE DEBUG] auth.currentUser.uid = ${currentAuthUid}, noteId = ${noteDocId}, collection/path = ${firestorePath}, operation = setDoc, online status = ${isOnline}`);

  if (!uid) {
    console.error(`[SmartSlate Firestore] NOTE PERMISSION DENIED: No authenticated student UID available for path '${firestorePath}'.`);
    return;
  }

  try {
    const ref = doc(db, "students", uid, "notes", noteDocId);
    await setDoc(ref, {
      noteDocId,
      subjectId,
      studentUid: uid,
      pages: data.pages,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    console.log(`[SmartSlate Firestore] NOTE FIRESTORE WRITE SUCCESS: Document saved to '${firestorePath}'`);
  } catch (error: any) {
    if (error?.code === "permission-denied" || error?.message?.includes("permissions")) {
      console.error(`[SmartSlate Firestore] NOTE PERMISSION DENIED: Path '${firestorePath}' rejected by Firestore security rules.`, error);
    } else if (typeof navigator !== "undefined" && !navigator.onLine) {
      console.warn(`[SmartSlate Firestore] OFFLINE — queued locally for path '${firestorePath}'`, error);
    } else {
      console.warn(`[SmartSlate Firestore] Note sync notice for path '${firestorePath}':`, error);
    }
  }
}

export async function getNoteFromFirestore(subjectId: string, studentUid?: string): Promise<NotebookData | null> {
  if (!isFirebaseConfigured || !db) return null;

  const currentAuthUid = auth?.currentUser?.uid || null;
  const uid = studentUid || currentAuthUid;
  const noteDocId = uid ? `${uid}_${subjectId}` : `${subjectId}`;
  const firestorePath = uid ? `students/${uid}/notes/${noteDocId}` : `notes/${noteDocId}`;
  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

  console.log(`[NOTE DEBUG] auth.currentUser.uid = ${currentAuthUid}, noteId = ${noteDocId}, collection/path = ${firestorePath}, operation = getDoc, online status = ${isOnline}`);

  if (!uid) return null;

  try {
    const ref = doc(db, "students", uid, "notes", noteDocId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      return {
        subjectId: data.subjectId,
        pages: data.pages || [],
      };
    }
    return null;
  } catch (error: any) {
    if (error?.code === "permission-denied" || error?.message?.includes("permissions")) {
      console.error(`[SmartSlate Firestore] NOTE PERMISSION DENIED (READ): Path '${firestorePath}' rejected by Firestore security rules.`, error);
    } else {
      console.warn(`[SmartSlate Firestore] Note fetch notice for path '${firestorePath}':`, error);
    }
    return null;
  }
}
