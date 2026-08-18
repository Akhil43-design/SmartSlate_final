// ============================================================================
// SMARTSLATE — SHARED FIREBASE WEB SDK INITIALIZATION
// Firebase Project: SmartSlate (Project ID: smartslate-bd117)
// Shared across Student, Teacher, and Parent Prototypes
// ============================================================================

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Read environment variables (Vite prefix: VITE_FIREBASE_*)
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBOgNWBVqSYfMypeZS8NwRLOYpq7DY3-ls",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "smartslate-bd117.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "smartslate-bd117",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "smartslate-bd117.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "352727705984",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:352727705984:web:dd0876229378cd82deb965",
};

// Check if valid Firebase credentials are provided in .env
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey.length > 10 &&
  !firebaseConfig.apiKey.includes("YOUR_")
);

// Initialize Firebase App instance safely (Singleton pattern)
let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

try {
  if (isFirebaseConfigured) {
    appInstance = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    authInstance = getAuth(appInstance);
    dbInstance = getFirestore(appInstance);
    console.log("[SmartSlate] Firebase successfully initialized for project:", firebaseConfig.projectId);
  } else {
    console.info("[SmartSlate] Firebase API key not yet detected in .env. Operating in synchronized local Firestore mode for project: smartslate-bd117.");
  }
} catch (error) {
  console.warn("[SmartSlate] Firebase initialization notice:", error);
}

export const app = appInstance;
export const auth = authInstance;
export const db = dbInstance;
