# 🍓 SmartSlate — Raspberry Pi 2 W Appliance Master Guide

This guide details the complete deployment, startup architecture, Wi-Fi hotspot configuration, and systemd automation for turning a **Raspberry Pi 2 W** into a dedicated **SmartSlate Offline Educational Appliance**.

---

## 🏗️ 1. Architecture & Port Mapping

When the Raspberry Pi boots, the **SmartSlate Master Service** binds to `0.0.0.0` (all interfaces) and launches all 6 tier applications on dedicated ports accessible across the local `10.42.0.1` subnet:

| Service / Tier | Local Port | Pi Hotspot URL | Production Path | Description |
| :--- | :---: | :--- | :--- | :--- |
| **Main Learning Gateway** | `:3000` | `http://10.42.0.1:3000/` | `/home/pi/smartslate/student` | Central Hub + Tier Selector |
| **Parent & Teacher Portal** | `:3001` | `http://10.42.0.1:3001/` | `/home/pi/smartslate/parent-teacher` | Parent Dashboard & Teacher Workspace |
| **Elementary (Classes 1–5)** | `:3002` | `http://10.42.0.1:3002/` | `/home/pi/smartslate/5thbelow` | Gamified Primary Learning & Phonics |
| **High School (Classes 6–10)**| `:3003` | `http://10.42.0.1:3003/` | `/home/pi/smartslate/6to10th/student` | Digital Notebook, Stylus & STEM Labs |
| **Intermediate (+2 / Diploma)**| `:3004` | `http://10.42.0.1:3004/` | `/home/pi/smartslate/intermediate` | MPC, BiPC, CEC & Vocational Labs |
| **B.Tech Higher Education** | `:3005` | `http://10.42.0.1:3005/` | `/home/pi/smartslate/btech` | CSE, ECE, EEE, Mechanical & Engineering |

---

## 🚀 2. Git Clone & Directory Setup

On your Raspberry Pi running Raspberry Pi OS (Debian Bullseye/Bookworm):

```bash
# 1. Update package index and install dependencies
sudo apt update && sudo apt install -y git curl wget psmisc sqlite3

# 2. Install Node.js 18 or 20 (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Clone the SmartSlate Repository to /home/pi/smartslate
cd /home/pi
git clone https://github.com/Akhil43-design/SmartSlate.git smartslate

# 4. Navigate to directory
cd /home/pi/smartslate

# 5. Install root and subfolder dependencies
npm install --production
cd parent-teacher && npm install --production && cd ..
cd student && npm install --production && cd ..
cd 6to10th/student && npm install --production && cd ../..
cd intermediate && npm install --production && cd ..
cd btech && npm install --production && cd ..
cd 5thbelow && npm install --production && cd ..

# 6. Make control scripts executable
chmod +x smartslate/*.sh
```

---

## 📡 3. Raspberry Pi Wi-Fi Hotspot Setup (IP: `10.42.0.1`)

Configure NetworkManager to broadcast the **`SmartSlate-Pi`** Wi-Fi Access Point on boot:

```bash
# Create Wi-Fi Hotspot connection
sudo nmcli con add type wifi ifname wlan0 mode ap con-name SmartSlateHotspot ssid SmartSlate-Pi
sudo nmcli con modify SmartSlateHotspot 802-11-wireless.band bg
sudo nmcli con modify SmartSlateHotspot 802-11-wireless.channel 6
sudo nmcli con modify SmartSlateHotspot 802-11-wireless-security.key-mgmt wpa-psk
sudo nmcli con modify SmartSlateHotspot 802-11-wireless-security.psk "smartslate123"
sudo nmcli con modify SmartSlateHotspot ipv4.method shared ipv4.addresses 10.42.0.1/24

# Set connection to start automatically
sudo nmcli con modify SmartSlateHotspot connection.autoconnect yes

# Start hotspot
sudo nmcli con up SmartSlateHotspot
```

---

## ⚙️ 4. Systemd Auto-Boot Service Setup

Configure SmartSlate to start automatically whenever the Raspberry Pi is turned on:

```bash
# 1. Copy service file to systemd directory
sudo cp /home/pi/smartslate/smartslate/smartslate.service /etc/systemd/system/smartslate.service

# 2. Reload systemd daemon
sudo systemctl daemon-reload

# 3. Enable service to start on every boot
sudo systemctl enable smartslate.service

# 4. Start the service immediately
sudo systemctl start smartslate.service

# 5. Check live status
sudo systemctl status smartslate.service
```

---

## 🛠️ 5. Manual Management Commands

| Action | Command | Description |
| :--- | :--- | :--- |
| **Start All Servers** | `cd /home/pi/smartslate && ./smartslate/start-smartslate.sh` | Launches all 6 servers and probes health |
| **Stop All Servers** | `cd /home/pi/smartslate && ./smartslate/stop-smartslate.sh` | Gracefully terminates all processes and frees ports |
| **Check Live Status** | `cd /home/pi/smartslate && ./smartslate/status-smartslate.sh` | Displays live PID, port, and HTTP 200 health table |
| **View Service Logs** | `tail -f /home/pi/smartslate/logs/*.log` | Live multi-tier server output stream |
| **Restart via Systemd**| `sudo systemctl restart smartslate.service` | Full appliance system restart |

---

## 📱 6. Android Launcher Applications

Two Android Launcher APKs are built for offline use:

### A. **`SmartSlateStudentLauncher.apk`**
- **Target URL**: `http://10.42.0.1:3000/` (Local Student Gateway)
- **Features**:
  - Fullscreen kiosk interface with touch and stylus digital ink support.
  - Offline Wi-Fi connection monitor (`SmartSlate-Pi` auto-reconnect).
  - No external cloud dependencies required for local learning, textbook reading, and exam taking.

### B. **`SmartSlateParentLauncher.apk`**
- **Target URL**: `http://10.42.0.1:3001/` (Local Parent & Teacher Portal)
- **Features**:
  - Roster management, exam and assignment creation, child monitoring, and grading.
  - Zero-latency local SQLite operations with background Firebase Cloud sync queue.

---

## 🔄 7. Offline & Online Cloud Sync Flow

```
[Student Tablet] / [Parent Mobile] / [Teacher Mobile]
                        │
                        ▼ (Connected to "SmartSlate-Pi" Wi-Fi)
            [Raspberry Pi 2 W : 10.42.0.1]
                        │
                        ├─► SQLite Unified Database (/shared/db/smartslate.db)
                        └─► Background Sync Queue (sync_queue table)
                                    │
                                    ▼ (When Internet is Available)
                        [Google Cloud Firestore]
```

- **Internet Offline**: All reading, note taking, exam submissions, assignment publishing, and grading work 100% locally on the Raspberry Pi without internet.
- **Internet Restored**: The background sync daemon automatically pushes pending exams, submissions, and evaluations to Cloud Firestore.

---

## 🔍 8. Verification & Reboot Test

To verify complete end-to-end boot functionality:

```bash
# Reboot the Raspberry Pi
sudo reboot
```

1. Wait 30 seconds for the Pi 2 W to boot.
2. Verify Wi-Fi SSID **`SmartSlate-Pi`** appears on your Tablet / Phone.
3. Connect device with password `smartslate123`.
4. Open the **SmartSlate Student Launcher** or **Parent Launcher** app.
5. The local application loads instantly without any manual commands!
