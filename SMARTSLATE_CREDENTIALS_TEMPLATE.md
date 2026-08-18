# 🔐 SmartSlate — Credentials & Environment Variables Template

> [!IMPORTANT]
> **DO NOT** commit real private API keys, service account credentials, or passwords into git repositories or public folders. Use this template to configure your local `.env` and Vercel environment variables securely.

---

## 🔑 Required Frontend Environment Variables

Place these variables in `.env` or Vercel Dashboard for the Parent & Teacher Web Portal:

```env
# Server Port Configuration
PORT=3001

# Configurable Student Server Address
# Local Laptop Dev: http://localhost:3000
# Production Raspberry Pi: http://10.42.0.1:3000
STUDENT_SERVER_URL=http://localhost:3000

# Firebase Public Web Configuration (From Firebase Console -> Project Settings -> General)
FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY_HERE
FIREBASE_AUTH_DOMAIN=smartslate-app.firebaseapp.com
FIREBASE_PROJECT_ID=smartslate-app
FIREBASE_STORAGE_BUCKET=smartslate-app.appspot.com
FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID_HERE
FIREBASE_APP_ID=YOUR_FIREBASE_APP_ID_HERE
```

---

## 👥 Authentic Indian / Andhra Pradesh Demo Credentials

| Role | Name | Email | Password / PIN | Class / Details |
| :--- | :--- | :--- | :--- | :--- |
| **Class Teacher** | `Ravi Kumar` | `teacher@smartslate.edu` | `password123` / `3333` | 10th Class — Section A |
| **Parent** | `Suresh Kumar` | `parent@smartslate.edu` | `password123` / `4444` | Parent of Akhil & Sai Teja |
| **Student 1** | `Akhil` | `student@smartslate.edu` | `1111` | Student Code: STU-101 |
| **Student 2** | `Sai Teja` | `maya@smartslate.edu` | `2222` | Student Code: STU-102 |

---

## 📍 Where Credentials Belong

1. **Local Development**:
   - File: `.env` in workspace root `f:\smartSlate\.env`.
2. **Parent/Teacher Web App Configuration**:
   - File: `shared/firebase/firebaseConfig.js`.
3. **Vercel Production Deployment**:
   - Settings $\rightarrow$ Environment Variables in Vercel Dashboard.
