// ============================================================================
// SMARTSLATE — FIREBASE AUTHENTICATION MODULE
// Handles Email/Password sign up, login, logout, and session listening
// ============================================================================

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
  type UserCredential,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "./config";

export interface FirebaseAuthResult {
  success: boolean;
  user?: User;
  uid?: string;
  email?: string;
  error?: string;
}

// 1. REGISTER WITH EMAIL & PASSWORD
export async function registerFirebaseUser(email: string, password: string): Promise<FirebaseAuthResult> {
  if (!isFirebaseConfigured || !auth) {
    return {
      success: true,
      uid: `local-${Date.now()}`,
      email: email.trim().toLowerCase(),
    };
  }

  try {
    const cred: UserCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    return {
      success: true,
      user: cred.user,
      uid: cred.user.uid,
      email: cred.user.email || email,
    };
  } catch (error: any) {
    console.error("[SmartSlate Auth] Registration error:", error);
    const code = error.code || "";
    if (code === "auth/email-already-in-use" || error.message?.includes("email-already-in-use")) {
      throw new Error("This email is already registered. Please login instead.");
    }
    throw error;
  }
}

// 2. LOGIN WITH EMAIL & PASSWORD
export async function loginFirebaseUser(email: string, password: string): Promise<FirebaseAuthResult> {
  if (!isFirebaseConfigured || !auth) {
    return {
      success: true,
      uid: `local-${Date.now()}`,
      email: email.trim().toLowerCase(),
    };
  }

  try {
    const cred: UserCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
    return {
      success: true,
      user: cred.user,
      uid: cred.user.uid,
      email: cred.user.email || email,
    };
  } catch (error: any) {
    console.error("[SmartSlate Auth] Login error:", error);
    return {
      success: false,
      error: error.message || "Invalid credentials.",
    };
  }
}

import { clearStudentCache } from "./services/studentService";

const MAIN_GATEWAY_URL = "http://localhost:3000";

// 3. LOGOUT USER
export async function logoutFirebaseUser(): Promise<void> {
  clearStudentCache();
  if (isFirebaseConfigured && auth) {
    try {
      await signOut(auth);
    } catch (e) {
      console.error("[SmartSlate Auth] Logout error:", e);
    }
  }
  if (typeof window !== "undefined") {
    window.location.replace(MAIN_GATEWAY_URL);
  }
}

// 4. SUBSCRIBE TO AUTH STATE CHANGES
export function onFirebaseAuthStateChange(callback: (user: User | null) => void): () => void {
  if (isFirebaseConfigured && auth) {
    return onAuthStateChanged(auth, callback);
  }
  return () => {};
}

// 5. GET CURRENT USER UID
export function getCurrentAuthUid(): string | null {
  if (isFirebaseConfigured && auth && auth.currentUser) {
    return auth.currentUser.uid;
  }
  return null;
}
