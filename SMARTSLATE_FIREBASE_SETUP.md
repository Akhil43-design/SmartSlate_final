# 🔥 SmartSlate — Firebase Integration & Configuration Setup Guide

**Firebase Project ID**: `smartslate-bd117`  
**Web App ID**: `1:352727705984:web:dd0876229378cd82deb965`  
**Messaging Sender ID**: `352727705984`  
**Measurement ID**: `G-BJ6ET2BPNF`  
**Auth Domain**: `smartslate-bd117.firebaseapp.com`  
**Storage Bucket**: `smartslate-bd117.firebasestorage.app`  

---

## 1. Firebase Configuration & Modular SDK Setup

The Firebase Web SDK configuration is centralized in **[shared/firebase/firebaseConfig.js](file:///f:/smartSlate/shared/firebase/firebaseConfig.js)**:

```javascript
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY || "AIzaSyBOgNWBVqSYfMypeZS8NwRLOYpq7DY3-ls",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "smartslate-bd117.firebaseapp.com",
    projectId: process.env.FIREBASE_PROJECT_ID || "smartslate-bd117",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "smartslate-bd117.firebasestorage.app",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "352727705984",
    appId: process.env.FIREBASE_APP_ID || "1:352727705984:web:dd0876229378cd82deb965",
    measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-BJ6ET2BPNF"
};

module.exports = { firebaseConfig };
```

---

## 2. Firebase Authentication & Role Management

Authentication is handled via Firebase Email/Password & PIN auth. Roles are managed strictly via Firestore `users/{uid}` documents.

### Role Schemas:

#### Class Teacher Document (`users/{uid}`):
```json
{
  "name": "Ravi Kumar",
  "email": "teacher@smartslate.edu",
  "role": "teacher",
  "classIds": ["CLASS-10A"]
}
```

#### Parent Document (`users/{uid}`):
```json
{
  "name": "Suresh Kumar",
  "email": "parent@smartslate.edu",
  "role": "parent",
  "childrenIds": ["STU-101", "STU-102"]
}
```

#### Student Document (`users/{uid}`):
```json
{
  "name": "Akhil",
  "email": "student@smartslate.edu",
  "role": "student",
  "classId": "CLASS-10A",
  "studentId": "STU-101"
}
```

---

## 3. User & Link Creation Flow

1. **Teacher Creation**:
   - Registered in Auth $\rightarrow$ Firestore user document with `role: "teacher"` and `classIds: ["CLASS-10A"]`.
2. **Parent Creation**:
   - Registered in Auth $\rightarrow$ Firestore user document with `role: "parent"` and `childrenIds: ["STU-101", "STU-102"]`.
3. **Student Creation**:
   - Registered in Auth $\rightarrow$ Firestore user document with `role: "student"`, `classId: "CLASS-10A"`, `studentId: "STU-101"`.
4. **Parent $\rightarrow$ Student Link**:
   - Created in `parent_links/{parentUid_studentId}` with `status: "accepted"`.
5. **Teacher $\rightarrow$ Class Link**:
   - Assigned in `classes/{classId}` with `teacherId: "teacherUid"`.

---

## 4. Firestore Database Collections & Schema

The following standard collections are used in project `smartslate-bd117`:

- `users` — Authentication user profiles and roles.
- `students` — Enrolled student records.
- `teachers` — Class teacher records.
- `parents` — Linked parent records.
- `classes` — Academic class rosters (`10th Class — Section A`).
- `subjects` — Academic subject lists.
- `assignments` — Teacher-created homework tasks.
- `submissions` — Student assignment submissions.
- `exams` — MCQ & Written exams.
- `exam_results` — Published exam scores.
- `attendance` — Daily attendance logs (Present/Absent/Late).
- `announcements` — Class notices & circulars.
- `notifications` — Real-time alerts feed.
- `student_progress` — Overall academic progress & report cards.
- `shared_notes` — Explicitly shared notebook pages (private notes remain local in SQLite).

---

## 5. Firestore Security Rules

Deploy security rules from **[shared/firebase/firestore.rules](file:///f:/smartSlate/shared/firebase/firestore.rules)**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() { return request.auth != null; }
    function getUserData() { return get(/databases/$(database)/documents/users/$(request.auth.uid)).data; }
    function hasRole(role) { return isAuthenticated() && getUserData().role == role; }

    function isStudent() { return hasRole('student'); }
    function isTeacher() { return hasRole('teacher'); }
    function isParent() { return hasRole('parent'); }

    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if request.auth.uid == userId;
    }

    match /assignments/{assignmentId} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isTeacher();
    }

    match /submissions/{submissionId} {
      allow read: if isAuthenticated() && (
        request.auth.uid == resource.data.user_id || isTeacher() || isParent()
      );
      allow create, update: if isStudent() || isTeacher();
    }

    match /attendance/{attendanceId} {
      allow read: if isAuthenticated();
      allow write: if isTeacher();
    }
  }
}
```

---

## 6. Required Firestore Indexes

The compound indexes for querying assignments and submissions are defined in **[shared/firebase/firestore.indexes.json](file:///f:/smartSlate/shared/firebase/firestore.indexes.json)**:

```json
{
  "indexes": [
    {
      "collectionGroup": "assignments",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "classId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "submissions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "assignmentId", "order": "ASCENDING" },
        { "fieldPath": "submittedAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## 7. Environment Variables (.env)

Configure your production environment variables in `.env`:

```env
FIREBASE_API_KEY=AIzaSyBOgNWBVqSYfMypeZS8NwRLOYpq7DY3-ls
FIREBASE_AUTH_DOMAIN=smartslate-bd117.firebaseapp.com
FIREBASE_PROJECT_ID=smartslate-bd117
FIREBASE_STORAGE_BUCKET=smartslate-bd117.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=352727705984
FIREBASE_APP_ID=1:352727705984:web:dd0876229378cd82deb965
FIREBASE_MEASUREMENT_ID=G-BJ6ET2BPNF
SMARTSLATE_STUDENT_URL=http://localhost:3000
```

---

## 8. Deployment Strategy

### Local Development:
- Student Web Application: [http://localhost:3000](http://localhost:3000)
- Parent & Teacher Web Portal: [http://localhost:3001](http://localhost:3001)

### Vercel Production Deployment:
- Deploy `parent-teacher/` directory to Vercel. Add environment variables to Vercel Project Settings. Ensure `smartslate-bd117.firebaseapp.com` is added under **Firebase Console $\rightarrow$ Authentication $\rightarrow$ Authorized domains**.

### Raspberry Pi 2 W Deployment (Future):
- Student Web Application runs locally at `http://10.42.0.1:3000`. Private student notes save to `shared/db/smartslate.db` local SQLite, and shared metrics sync via `SyncService.js` to `smartslate-bd117`.

---

## 9. Verification & Troubleshooting

- **Test Connectivity**: Run `node scratch/test_firebase_bd117_sync.js` to test real-time reads and writes against `smartslate-bd117`.
- **403 Permission Errors**: Verify that Firestore Security Rules are deployed and `apiKey` query parameter is attached to REST requests.
