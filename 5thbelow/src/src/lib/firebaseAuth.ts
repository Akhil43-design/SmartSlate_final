// ============================================================================
// SMARTSLATE — DEDICATED FIREBASE AUTHENTICATION MODULE
// Handles Email/Password sign-up, sign-in, session state, and sign-out
// ============================================================================

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
  type UserCredential,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "./firebase";

export interface AuthResult {
  success: boolean;
  user?: User;
  uid?: string;
  email?: string;
  error?: string;
}

// 1. SIGN UP WITH EMAIL & PASSWORD
export async function signUpWithEmail(email: string, password: string): Promise<AuthResult> {
  if (!isFirebaseConfigured || !auth) {
    // Local / Offline fallback user creation
    return {
      success: true,
      uid: `uid-${Date.now()}`,
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
    console.error("[SmartSlate Auth] Sign up error:", error);
    return {
      success: false,
      error: error.message || "Failed to create Firebase account.",
    };
  }
}

// 2. SIGN IN WITH EMAIL & PASSWORD
export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  if (!isFirebaseConfigured || !auth) {
    // Local / Offline fallback sign in
    return {
      success: true,
      uid: `uid-${Date.now()}`,
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
    console.error("[SmartSlate Auth] Sign in error:", error);
    return {
      success: false,
      error: error.message || "Invalid email or password.",
    };
  }
}

// 3. SIGN OUT
export async function signOutFirebaseUser(): Promise<void> {
  if (isFirebaseConfigured && auth) {
    try {
      await signOut(auth);
    } catch (e) {
      console.error("[SmartSlate Auth] Sign out error:", e);
    }
  }
}

// 4. LISTEN TO AUTH STATE CHANGES
export function subscribeToAuthChanges(callback: (user: User | null) => void): () => void {
  if (isFirebaseConfigured && auth) {
    return onAuthStateChanged(auth, callback);
  }
  return () => {};
}

// 5. GET CURRENT FIREBASE USER
export function getFirebaseCurrentUser(): User | null {
  if (isFirebaseConfigured && auth) {
    return auth.currentUser;
  }
  return null;
}
