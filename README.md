# 📖 SmartSlate — Unified Digital Learning Platform

> **Offline-First, Cloud-Synced Digital Education Ecosystem for K-12, Intermediate, & Higher Education.**

---

## ⚡ 1-Click Quick Start (Windows Laptop)

### Option A: Double-Click the Batch File
Simply double-click:
```
start_smartslate.bat
```
*(or run `run.bat`)*

### Option B: Run via Terminal
```bash
node smartslate-master.js
```

---

## 📡 Automatic Dynamic Wi-Fi & Mobile Access

SmartSlate includes **automatic local network detection**. Whenever you start the server:
1. It automatically inspects your active Wi-Fi or Local Area Network (LAN) connection.
2. Even if your IP address changes (e.g. moving between your home Wi-Fi, your friend's Wi-Fi, college network, or a mobile hotspot), SmartSlate will dynamically detect the new IP.
3. The terminal displays the exact live links for both your **Laptop** and your **Mobile Phone**.

### 📱 How to Open on Mobile / Tablet:
1. Connect your mobile phone to the **same Wi-Fi** network as your laptop (or connect your phone to your laptop's mobile hotspot).
2. Open Chrome, Safari, or Firefox on your phone.
3. Type the detected Wi-Fi IP address shown in the terminal (e.g., `http://<YOUR_IP>:3000`).

---

## 🏛️ Platform Architecture & Port Directory

| Port | Portal / Microservice | Description |
| :--- | :--- | :--- |
| **`3000`** | 🎓 **Main Learning Gateway** | Central unified student entry point, account registration & tier routing. |
| **`3001`** | 👨‍👩‍👧‍👦 **Parent & Teacher Portal** | Teacher classroom dashboard, assignment creator, grading & parent child-tracking. |
| **`3002`** | 🎒 **Elementary School (Classes 1–5)** | Gamified learning interface, interactive subjects, audio reader & drawing canvas. |
| **`3003`** | 🏫 **High School (Classes 6–10)** | SSC curriculum, digital notebooks, notes sync, exams & assignment submissions. |
| **`3004`** | 🧪 **Intermediate (Classes 11–12)** | MPC & BiPC syllabus, practice papers, formulas & focus-mode digital slate. |
| **`3005`** | 💻 **B.Tech / Higher Education** | Engineering branch modules, coding labs, research papers & semester notes. |

---

## 🔑 Demo Login Credentials

All tiers are pre-seeded with authentic demo profiles:

| Role | Email | Password | Code / Identifier |
| :--- | :--- | :--- | :--- |
| 👨‍🏫 **Teacher** | `teacher_math_hs@smartslate.test` | `SmartSlate@123` | `TCH-PRIYA-MATH-05` (Maths) |
| 👨‍👩‍👧 **Parent** | `parent_ramesh@smartslate.test` | `SmartSlate@123` | `PAR-RAMES-101` |
| 🎓 **Student** | `student_151@smartslate.test` | `SmartSlate@123` | `STU-MEGHB1A-11` |

---

## 💾 Database & Offline-Sync Architecture

SmartSlate is designed to work **100% offline** in rural classrooms and sync automatically when connected to Wi-Fi:

1. **Local SQLite Databases**:
   - Each portal maintains an optimized SQLite database with **WAL (Write-Ahead Logging)** mode and 30-second busy timeouts to ensure high-concurrency performance without database locks.
   - Idempotent schema migrations execute automatically on startup (`shared/db/migrate.js`).
2. **Cloud Sync (Firebase Firestore)**:
   - When internet connectivity is available, notes, tasks, assignments, and attendance sync bidirectionally with Firebase Firestore.
3. **Dynamic Host Routing**:
   - Client applications dynamically resolve their current hostname (`window.location.hostname`), guaranteeing smooth cross-portal navigation and logout redirects across local IPs and domains.

---

## 🛠️ Troubleshooting & Tips

### Mobile phone cannot open the links?
1. **Same Wi-Fi**: Verify both your laptop and phone are on the exact same Wi-Fi network (or mobile hotspot).
2. **Windows Private Network**:
   - Open Windows **Settings** > **Network & internet** > **Wi-Fi** > Click your connected network > Select **Private network**.
3. **Firewall Access**:
   - If Windows Defender Firewall asks for permission for `Node.js`, check **Private networks** and click **Allow access**.

### Database or Port Conflict?
- If a previous process is still holding a port, stop it via terminal:
  ```powershell
  taskkill /F /IM node.exe
  ```
  Then re-launch `start_smartslate.bat`.

---

## 📂 Repository Structure

```
SmartSlate_final/
├── start_smartslate.bat      # 1-Click Windows Launcher
├── run.bat                   # Launcher shortcut
├── smartslate-master.js      # Universal Node.js Master Orchestrator with dynamic IP
├── shared/                   # Shared SQLite schemas, migrations, and seed scripts
│   ├── db/
│   │   ├── database.js
│   │   ├── migrate.js        # Safe idempotent SQLite schema migrator
│   │   └── seed.js           # Safe upsert database seeder
├── student/                  # Main Learning Gateway (Port 3000)
├── parent-teacher/           # Teacher & Parent Web Portal (Port 3001)
├── 5thbelow/                 # Elementary School App (Port 3002, TanStack/Vite)
├── 6to10th/                  # High School App (Port 3003)
├── intermediate/             # Intermediate Classes 11–12 App (Port 3004)
├── btech/                    # B.Tech Engineering App (Port 3005)
└── android/                  # Native Android Companion App
```
