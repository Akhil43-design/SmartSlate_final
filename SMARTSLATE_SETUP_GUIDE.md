# 📚 SmartSlate — Master Setup & Configuration Guide

Welcome to the comprehensive setup and configuration guide for **SmartSlate**. This guide contains step-by-step instructions for configuring Firebase, Firestore, Authentication, Environment Variables, Local Testing, Vercel Deployment, and Raspberry Pi Deployment.

---

## 📑 Table of Contents
1. [Firebase Console & Project Setup](#1-firebase-console--project-setup)
2. [Firebase Authentication Setup](#2-firebase-authentication-setup)
3. [Cloud Firestore Database & Index Setup](#3-cloud-firestore-database--index-setup)
4. [Firestore Security Rules](#4-firestore-security-rules)
5. [Environment Variables & Configuration (.env)](#5-environment-variables--configuration-env)
6. [Creating & Assigning User Roles](#6-creating--assigning-user-roles)
7. [Linking Relationships (Teacher, Parent, Student, Class)](#7-linking-relationships)
8. [Local Development & Testing (Laptop)](#8-local-development--testing-laptop)
9. [Configuring Student Server URL (Localhost vs Raspberry Pi)](#9-configuring-student-server-url)
10. [Parent & Teacher Website Vercel Deployment](#10-parent--teacher-website-vercel-deployment)
11. [Raspberry Pi 2 W Deployment Overview](#11-raspberry-pi-2-w-deployment-overview)
12. [End-to-End Testing Verification Checklist](#12-end-to-end-testing-verification-checklist)
13. [Troubleshooting Guide](#13-troubleshooting-guide)

---

## 1. Firebase Console & Project Setup

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** or select your existing project: `smartslate-app`.
3. Disable Google Analytics (optional for initial deployment) and click **Create Project**.
4. In the Project Overview dashboard, click **Add app** and choose **Web** (`</>`).
5. Register app with nickname: `SmartSlate Web Portal`.
6. Copy the `firebaseConfig` object containing:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`
7. Paste these values into [shared/firebase/firebaseConfig.js](file:///f:/smartSlate/shared/firebase/firebaseConfig.js) and your `.env` file.

---

## 2. Firebase Authentication Setup

1. In the Firebase Console left menu, navigate to **Build** $\rightarrow$ **Authentication**.
2. Click **Get Started**.
3. Under **Sign-in method**, select **Email/Password**.
4. Enable **Email/Password** and click **Save**.
5. Go to **Settings** $\rightarrow$ **Authorized domains** and add:
   - `localhost`
   - `127.0.0.1`
   - `<YOUR_VERCEL_APP_NAME>.vercel.app`

---

## 3. Cloud Firestore Database & Index Setup

1. In the Firebase Console left menu, navigate to **Build** $\rightarrow$ **Firestore Database**.
2. Click **Create database**.
3. Select database location (e.g., `asia-south1` or `us-central`).
4. Select **Start in production mode** and click **Create**.

### Collections Required:
- `users`: User profiles with `role` (`student`, `teacher`, `parent`, `admin`).
- `students`: Student profiles with `studentCode` and `classId`.
- `teachers`: Teacher profiles with `teacherId`.
- `parents`: Parent profiles with linked `studentIds` array.
- `classes`: Class details with `teacherId` and `studentIds`.
- `assignments`: Published assignments.
- `submissions`: Student homework submissions.
- `attendance`: Class attendance logs (`${classId}_${studentId}_${date}`).
- `announcements`: Class announcements.
- `notifications`: Notifications feed.
- `student_progress`: Academic metrics.

---

## 4. Firestore Security Rules

Deploy the security rules from [shared/firebase/firestore.rules](file:///f:/smartSlate/shared/firebase/firestore.rules) to Firebase:

1. In Firebase Console, go to **Firestore Database** $\rightarrow$ **Rules**.
2. Replace all content with the following rule set and click **Publish**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }
    
    function isRole(role) {
      return isAuthenticated() && getUserData().role == role;
    }

    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && (request.auth.uid == userId || isRole('admin'));
    }

    match /classes/{classId} {
      allow read: if isAuthenticated();
      allow write: if isRole('teacher') || isRole('admin');
    }

    match /students/{studentId} {
      allow read: if isAuthenticated();
      allow write: if isRole('teacher') || isRole('admin');
    }

    match /parents/{parentId} {
      allow read: if isAuthenticated();
      allow write: if request.auth.uid == parentId || isRole('admin');
    }

    match /assignments/{assignmentId} {
      allow read: if isAuthenticated();
      allow write: if isRole('teacher') || isRole('admin');
    }

    match /submissions/{submissionId} {
      allow read: if isAuthenticated();
      allow create, update: if isRole('student') || isRole('teacher') || isRole('admin');
    }

    match /attendance/{attendanceId} {
      allow read: if isAuthenticated();
      allow write: if isRole('teacher') || isRole('admin');
    }

    match /announcements/{announcementId} {
      allow read: if isAuthenticated();
      allow write: if isRole('teacher') || isRole('admin');
    }

    match /notifications/{notificationId} {
      allow read, write: if isAuthenticated();
    }

    match /student_progress/{studentId} {
      allow read: if isAuthenticated();
      allow write: if isRole('teacher') || isRole('admin');
    }
  }
}
```

---

## 5. Environment Variables & Configuration (.env)

Copy [.env.example](file:///f:/smartSlate/.env.example) to `.env` in the project root:

```env
PORT=3001
STUDENT_SERVER_URL=http://localhost:3000

FIREBASE_API_KEY=AIzaSyYourActualApiKeyHere
FIREBASE_AUTH_DOMAIN=smartslate-app.firebaseapp.com
FIREBASE_PROJECT_ID=smartslate-app
FIREBASE_STORAGE_BUCKET=smartslate-app.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789012
FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

---

## 6. Creating & Assigning User Roles

User roles are assigned via Firebase Authentication and saved in `users/{uid}`:

- **Teacher Account**:
  - Email: `teacher@smartslate.edu`
  - Password: `password123`
  - Document `users/teacher_demo_uid`:
    ```json
    {
      "name": "Prof. Sarah Lin",
      "email": "teacher@smartslate.edu",
      "role": "teacher",
      "phone": "+91 98765 43210"
    }
    ```

- **Parent Account**:
  - Email: `parent@smartslate.edu`
  - Password: `password123`
  - Document `users/parent_demo_uid`:
    ```json
    {
      "name": "Robert Rivera",
      "email": "parent@smartslate.edu",
      "role": "parent",
      "phone": "+91 98765 12345"
    }
    ```

---

## 7. Linking Relationships

- **Parent $\rightarrow$ Children Link**:
  Document `parents/parent_demo_uid`:
  ```json
  {
    "userId": "parent_demo_uid",
    "name": "Robert Rivera",
    "email": "parent@smartslate.edu",
    "studentIds": ["s1", "s2"]
  }
  ```

- **Teacher $\rightarrow$ Class Link**:
  Document `classes/c101`:
  ```json
  {
    "id": "c101",
    "name": "Grade 5 Alpha",
    "class_code": "CLASS-5A",
    "teacherId": "teacher_demo_uid",
    "studentIds": ["s1", "s2"]
  }
  ```

---

## 8. Local Development & Testing (Laptop)

Run both local servers concurrently during development:

1. **Start Student Server (Port 3000)**:
   ```bash
   node student/server/server.js
   ```
   Access Student Website at: `http://localhost:3000`

2. **Start Parent & Teacher Portal (Port 3001)**:
   ```bash
   node parent-teacher/server/server.js
   ```
   Access Portal Website at: `http://localhost:3001`

---

## 9. Configuring Student Server URL

- **Laptop Development**:
  Set environment variable in `.env`:
  `STUDENT_SERVER_URL=http://localhost:3000`

- **Raspberry Pi Production**:
  Set environment variable in `.env`:
  `STUDENT_SERVER_URL=http://10.42.0.1:3000`

---

## 10. Parent & Teacher Website Vercel Deployment

See [VERCEL_DEPLOYMENT.md](file:///f:/smartSlate/VERCEL_DEPLOYMENT.md) for full steps:
1. Push project repository to GitHub.
2. Import repository into Vercel.
3. Set **Root Directory** to `parent-teacher`.
4. Add Environment Variables (`FIREBASE_API_KEY`, `FIREBASE_PROJECT_ID`, etc.).
5. Click **Deploy**.

---

## 11. Raspberry Pi 2 W Deployment Overview

See [RASPBERRY_PI_DEPLOYMENT.md](file:///f:/smartSlate/RASPBERRY_PI_DEPLOYMENT.md) for full steps:
1. Transfer `student/` and `shared/` directories to Raspberry Pi.
2. Run `npm install --production`.
3. Configure PM2 process manager:
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```
4. Access kiosk at `http://10.42.0.1:3000`.

---

## 12. End-to-End Testing Verification Checklist

- [x] **Test 1**: Teacher Login on Portal (`http://localhost:3001`).
- [x] **Test 2**: Teacher creates assignment "Science Report".
- [x] **Test 3**: Verification that assignment appears on Student Website (`http://localhost:3000`).
- [x] **Test 4**: Student submits assignment on Student Website.
- [x] **Test 5**: Teacher sees submission on Portal and grades `95/100`.
- [x] **Test 6**: Parent logs in to Portal and sees child grade (`95/100`) and attendance status.
- [x] **Test 7**: Teacher creates announcement $\rightarrow$ appears on Parent & Student portals.

---

## 13. Troubleshooting Guide

- **Error: `Firebase: Error (auth/invalid-api-key)`**:
  - Verify that `FIREBASE_API_KEY` in `.env` or `firebaseConfig.js` matches your Firebase Console project settings.
- **Error: `SQLITE_CONSTRAINT: FOREIGN KEY constraint failed`**:
  - Run `node shared/db/seed.js` to clean re-seed the SQLite database with valid foreign key IDs.
- **Student website does not update when Teacher posts assignment**:
  - Check that `STUDENT_SERVER_URL` in `.env` points to `http://localhost:3000` during local development.
