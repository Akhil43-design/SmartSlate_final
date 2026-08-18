# 🛡️ SmartSlate System Architecture & Firebase Integration Summary

**Project**: SmartSlate (Team ELEVATE)  
**Core Purpose**: Lightweight digital learning platform replacing physical school bags via classroom tablets (offline-first) linked with a local Raspberry Pi server & Cloud Firestore backend.

---

## 📂 1. Summary of Files Created & Modified

### **Shared Core Infrastructure**
- [`firestore.rules`](file:///f:/smartSlate/firestore.rules): Production-ready Firebase Security Rules enforcing role-based permissions for all 15 Firestore collections (`users`, `students`, `teachers`, `parents`, `subjects`, `assignments`, `submissions`, `tests`, `results`, `attendance`, `notes`, `feedback`, `teacherStudentLinks`, `parentStudentLinks`, `syncQueue`).
- [`firebaseAuthService.js`](file:///f:/smartSlate/shared/services/firebaseAuthService.js): Unified Firebase Web Auth and Cloud Firestore service providing client & node methods for student registration, teacher registration, parent registration, and parent-child link validation.
- [`firebaseConfig.js`](file:///f:/smartSlate/shared/firebase/firebaseConfig.js): Exported central Firebase configuration (`smartslate-bd117`).

### **Student Web Application (`student/`)**
- [`student/public/index.html`](file:///f:/smartSlate/student/public/index.html): Added Firebase v10 Compat Web SDK (`firebase-app-compat`, `firebase-auth-compat`, `firebase-firestore-compat`) and `firebaseAuthService.js`.
- [`student/server/server.js`](file:///f:/smartSlate/student/server/server.js): Mounted `/shared` static assets path for client accessibility.
- [`student/public/js/views/authView.js`](file:///f:/smartSlate/student/public/js/views/authView.js): Enhanced Student Registration modal capturing **Student Information**, **Parent/Guardian Info**, and **Academic Details** (Education Level: Primary, Secondary, Inter/Diploma, B.Tech, Class Teacher dropdown). Integrates Firebase Auth + Cloud Firestore + local SQLite signup.
- [`student/public/js/app.js`](file:///f:/smartSlate/student/public/js/app.js): Implemented Firebase `onAuthStateChanged` session observer and the **4-Tier Automatic Dashboard Router** (`routeStudentToDashboard()`).
- [`student/public/js/views/studentView.js`](file:///f:/smartSlate/student/public/js/views/studentView.js): Added **"My Teachers by Subject"** tab mapping assigned subject teachers to teacher Firebase UIDs (`teacherIds[]`).

### **Parent & Teacher Web Portal (`parent-teacher/`)**
- [`parent-teacher/public/index.html`](file:///f:/smartSlate/parent-teacher/public/index.html): Added Firebase Web SDK and `/shared/services/firebaseAuthService.js`.
- [`parent-teacher/server/server.js`](file:///f:/smartSlate/parent-teacher/server/server.js): Mounted `/shared` static path for portal views.
- [`parent-teacher/public/js/views/authView.js`](file:///f:/smartSlate/parent-teacher/public/js/views/authView.js): Implemented role-based registration for **Teachers** (School, Level, Classes, Sections, Subjects) and **Parents** (Parent info, Relationship) into Cloud Firestore.
- [`parent-teacher/public/js/app.js`](file:///f:/smartSlate/parent-teacher/public/js/app.js): Implemented protected role routes (`/teacher/*`, `/parent/*`, `/login`, `/register`) preventing unauthorized access across roles.
- [`parent-teacher/public/js/views/parentView.js`](file:///f:/smartSlate/parent-teacher/public/js/views/parentView.js): Integrated **Connect Child via Student ID** with real-time validation against Firestore `students` and creation of `parentStudentLinks`.

---

## 🗄️ 2. Cloud Firestore Schema (15 Collections)

```
Cloud Firestore (smartslate-bd117)
│
├── users/{uid}                 ──▶ Core Auth Profiles (uid, name, email, role, createdAt)
├── students/{studentId}        ──▶ Student Data (uid, studentId, class, educationLevel, parentInfo, teacherIds[])
├── teachers/{uid}              ──▶ Teacher Data (uid, name, subjects[], classes[], sections[])
├── parents/{uid}               ──▶ Parent Data (uid, name, phone, childStudentIds[])
├── subjects/{subjectId}        ──▶ Subject Metadata & Assigned Teachers
├── assignments/{assignmentId}  ──▶ Class Homework & Assignments
├── submissions/{submissionId}  ──▶ Digital Notebook Homework Answers & Grades
├── tests/{testId}              ──▶ MCQ & Written Exam Papers
├── results/{resultId}          ──▶ Exam Results & Percentage Breakdown
├── attendance/{attendanceId}  ──▶ Daily Student Attendance Records (Present/Absent/Late)
├── notes/{noteId}              ──▶ Digital Notebook Pages (Base64 Canvas / Text)
├── feedback/{feedbackId}       ──▶ Teacher Feedback & Academic Comments
├── teacherStudentLinks/{id}    ──▶ Mapped Relationships between Teachers & Students
├── parentStudentLinks/{id}     ──▶ Verified Relationships between Parents & Linked Children
└── syncQueue/{syncId}          ──▶ Offline Raspberry Pi Sync Items
```

---

## 🔄 3. Authentication & Persistent Session Flow

```
                      STUDENT OPENS TABLET APP
                                 │
                   Is User Authenticated? (Firebase Auth)
                      /                     \
                    YES                      NO
                     │                        │
       onAuthStateChanged() Fired          Show PIN / Auth Screen
                     │                        │
          Read Profile & Class           User Registers / Logins
                     │                        │
        Automatic 4-Tier Router        setPersistence(LOCAL)
                     │                        │
              Open Dashboard            Store Firestore Profile
```

- **Persistence**: Auth persistence is explicitly set to `LOCAL` (`setPersistence(auth, browserLocalPersistence)`). When the tablet is closed or restarted, `onAuthStateChanged()` automatically restores the user session without requiring credential re-entry.

---

## 🎯 4. Student 4-Tier Automatic Dashboard Selection Logic

| Education Level / Class | Tier Name | Route / Mode | Features Loaded |
|:--- |:--- |:--- |:--- |
| **Class 1 – 5** | Primary Dashboard | `primary` | Big visual bookshelf, simplified stylus tools, gold star badges |
| **Class 6 – 10** | Secondary Dashboard | `secondary` | Standard multi-page notebook, subject tabs, homework submit |
| **Intermediate / Diploma** | Inter & Diploma Dashboard | `intermediate_diploma` | Formula guides, advanced notebook rules, subject teacher cards |
| **B.Tech / Higher Ed** | B.Tech Dashboard | `btech` | Lecture notes, code snippet viewer, project assignments |

---

## 👨‍👩‍👦 5. Parent-Child Linking Logic

1. **Parent Inputs Code**: Parent enters Student ID (e.g. `STU-101`) in Parent Portal.
2. **Validation**: `firebaseAuthService.linkParentToChild()` checks `students` collection for document existence.
3. **Link Creation**: Creates document in `parentStudentLinks` (`link_{parentId}_{studentId}`).
4. **Access Control**: Parent is granted read access *only* to linked children's marks, attendance, assignment submissions, and teacher feedback.

---

## 📡 6. Offline-First Raspberry Pi Architecture

```
            STUDENT TABLET
                 │
            Local Wi-Fi
                 │
           RASPBERRY PI 2 W (Local Server: http://10.42.0.1:3000)
                 │
            SQLite Database (shared/db/smartslate.db)
                 │
         Internet Connected?
           /             \
         NO               YES
         │                 │
  Save Offline Local    Sync Queue Flushed (syncService.js)
                           │
                     Cloud Firestore
                           │
                  Teacher / Parent Portal
```

---

## 🛠️ 7. Verification Results

- **Student Server Health**: `http://localhost:3000/api/health` $\rightarrow$ `200 OK`
- **Parent/Teacher Portal Health**: `http://localhost:3001/api/health` $\rightarrow$ `200 OK`
- **Firebase Configuration**: `smartslate-bd117` connected.
- **Security Rules**: Deployed in `firestore.rules`.
