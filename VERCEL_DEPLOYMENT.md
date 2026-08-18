# ☁️ SmartSlate — Vercel Deployment Guide for Parent & Teacher Web Portal

This document explains how to deploy the **SmartSlate Parent & Teacher Web Portal** (`parent-teacher/`) to Vercel for production hosting.

---

## 📋 Prerequisites
- Vercel account ([vercel.com](https://vercel.com/))
- GitHub / GitLab repository containing the SmartSlate project
- Firebase project credentials (`smartslate-app`)

---

## 🚀 Deployment Steps

### Step 1: Connect Repository to Vercel
1. Log in to [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** $\rightarrow$ **Project**.
3. Select your SmartSlate repository.

### Step 2: Configure Project Settings
In the Vercel project configuration screen:
- **Framework Preset**: `Other` / `Express`
- **Root Directory**: `parent-teacher`
- **Build Command**: `npm run build` (or leave default)
- **Output Directory**: `public`

### Step 3: Add Environment Variables
In the Vercel **Environment Variables** section, add:

| Environment Variable | Recommended Value |
| :--- | :--- |
| `PORT` | `3001` |
| `STUDENT_SERVER_URL` | `http://localhost:3000` (or your production student endpoint) |
| `FIREBASE_API_KEY` | Your Firebase Web API Key |
| `FIREBASE_AUTH_DOMAIN` | `smartslate-app.firebaseapp.com` |
| `FIREBASE_PROJECT_ID` | `smartslate-app` |
| `FIREBASE_STORAGE_BUCKET` | `smartslate-app.appspot.com` |
| `FIREBASE_MESSAGING_SENDER_ID` | Your Messaging Sender ID |
| `FIREBASE_APP_ID` | Your Firebase App ID |

### Step 4: Deploy & Verify
1. Click **Deploy**.
2. Once complete, copy your deployment URL (e.g., `https://smartslate-portal.vercel.app`).

### Step 5: Add Authorized Domain in Firebase
1. Go to Firebase Console $\rightarrow$ **Authentication** $\rightarrow$ **Settings** $\rightarrow$ **Authorized domains**.
2. Click **Add domain** and enter your Vercel deployment URL domain: `smartslate-portal.vercel.app`.

---

## 🧪 Production Testing Verification

1. Open `https://smartslate-portal.vercel.app`.
2. Sign in as **Teacher**: `teacher@smartslate.edu` / `password123`.
3. Verify that Teacher Dashboard loads classes, assignments, and attendance views.
4. Sign in as **Parent**: `parent@smartslate.edu` / `password123`.
5. Verify linked children (**Alex Rivera** & **Maya Rivera**) progress and grades.
