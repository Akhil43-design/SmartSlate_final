# 🔥 SmartSlate — Firebase Backend Integration Guide

**Firebase Project**: `SmartSlate`  
**Firebase Project ID**: `smartslate-bd117`  

This project connects **three prototype applications** (Student, Teacher, and Parent) to **ONE shared Firebase backend**.

```
                          SMARTSLATE FIREBASE PROJECT
                          (Project ID: smartslate-bd117)
                                       │
                 ┌─────────────────────┼─────────────────────┐
                 │                     │                     │
          STUDENT APP             TEACHER APP           PARENT APP
                 │                     │                     │
                 └─────────────────────┼─────────────────────┘
                                       │
                         FIREBASE AUTH + CLOUD FIRESTORE
                                       │
         ┌─────────────────┬───────────┴───────────┬─────────────────┐
         │                 │                       │                 │
    users/{uid}   students/{studentId}   teachers/{teacherId}   parents/{parentId}
                               │                       │                 │
                               └─── classes/{classId} ─┴─────────────────┘
```

---

## 📍 Where to Put Your Firebase Environment Variables

Open the [.env](file:///c:/Users/new/Desktop/slatey-learns-play/.env) file located in the root directory of the project:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=smartslate-bd117.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=smartslate-bd117
VITE_FIREBASE_STORAGE_BUCKET=smartslate-bd117.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

> [!TIP]
> To get these values from the Firebase Console:
> 1. Open [Firebase Console](https://console.firebase.google.com/) > Project `SmartSlate` (`smartslate-bd117`).
> 2. Go to **Project Settings (⚙️)** > **General**.
> 3. Under **Your apps**, locate your registered **Web App**.
> 4. Copy the keys from `firebaseConfig` and paste them into your `.env` file.

---

## 🧱 Modular Architecture Created

1. **Core SDK Configuration**: [src/lib/firebase.ts](file:///c:/Users/new/Desktop/slatey-learns-play/src/lib/firebase.ts)
   - Initializes `initializeApp`, `getAuth`, and `getFirestore` with environment variables.
2. **Dedicated Authentication Module**: [src/lib/firebaseAuth.ts](file:///c:/Users/new/Desktop/slatey-learns-play/src/lib/firebaseAuth.ts)
   - `signUpWithEmail(email, password)`
   - `signInWithEmail(email, password)`
   - `signOutFirebaseUser()`
   - `subscribeToAuthChanges(callback)`
3. **Dedicated Cloud Firestore Service**: [src/lib/firestoreService.ts](file:///c:/Users/new/Desktop/slatey-learns-play/src/lib/firestoreService.ts)
   - `users/{uid}`
   - `students/{studentId}`
   - `teachers/{teacherId}`
   - `parents/{parentId}`
   - `classes/{classId}`
4. **Unified Role Service**: [src/lib/authService.ts](file:///c:/Users/new/Desktop/slatey-learns-play/src/lib/authService.ts)
   - Coordinates multi-role onboarding, Student Code generation, and linking.

---

## 🔒 Cloud Firestore Security Rules

Publish the rules in [firestore.rules](file:///c:/Users/new/Desktop/slatey-learns-play/firestore.rules) to your Firebase Console under **Firestore Database > Rules**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() { return request.auth != null; }
    function isOwner(userId) { return isAuthenticated() && request.auth.uid == userId; }
    function getUserData() { return get(/databases/$(database)/documents/users/$(request.auth.uid)).data; }
    function hasRole(role) { return isAuthenticated() && getUserData().role == role; }

    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId);
    }

    match /students/{studentId} {
      allow read: if isAuthenticated() && (
        isOwner(resource.data.userId) ||
        hasRole('teacher') ||
        (hasRole('parent') && request.auth.uid in resource.data.parentIds)
      );
      allow write: if isAuthenticated() && (
        isOwner(resource.data.userId) || hasRole('teacher')
      );
    }

    match /teachers/{teacherId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && (isOwner(resource.data.userId) || hasRole('teacher'));
    }

    match /parents/{parentId} {
      allow read, write: if isAuthenticated() && isOwner(resource.data.userId);
    }

    match /classes/{classId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && hasRole('teacher');
    }
  }
}
```
