# SmartSlate — Child OS & Digital Learning Platform

SmartSlate is a warm, playful, child-friendly digital learning operating system built for Students, Teachers, and Parents. It features responsive 3D notebook bookshelf rendering, digital stylus slate canvas, time-limited strict exam lockdown mode, direct student-teacher messaging with file & notebook sharing, color-coded teacher student tables, parent report cards, dual-channel alerting, and a 42-icon child OS visual theme.

---

## 🎨 Child OS Visual Theme & Rotating Accents

SmartSlate builds on a warm paper background surface (`--paper-bg-primary: #F7F6F3`) with glassmorphic cards and a cheerful multi-color accent system:

| Accent Token | Hex | Role |
|---|---|---|
| `--accent-coral` | `#FF6B6B` | Exams, active highlights, urgent indicators |
| `--accent-green` | `#2ECC71` | Success states, attendance present, high scores |
| `--accent-blue` | `#4D96FF` | Primary action buttons, notebook accents |
| `--accent-purple` | `#9B51E0` | Report cards, student badges, progress indicators |
| `--accent-yellow` | `#FFD93D` | Warnings, study tips, assignment highlights |

---

## 🔑 Demo Lock Screen Accounts & PIN-Only Authentication

On first launch, SmartSlate displays the dynamic Lock Screen account selector. Select any tile and enter PIN `1234`:

| Avatar | Name | Role | Email | PIN (4-Digit) | Student Code |
|---|---|---|---|---|---|
| 👨‍🎓 | **Alex Rivera** | Student | `student@smartslate.local` | `1234` | `STU-101` |
| 👩‍🎓 | **Maya Patel** | Student | `maya@smartslate.local` | `1234` | `STU-102` |
| 👩‍🏫 | **Prof. Sarah Lin** | Teacher | `teacher@smartslate.local` | `1234` | N/A |
| 👨‍👩‍👦 | **Robert Rivera** | Parent | `parent@smartslate.local` | `1234` | N/A (Linked to STU-101) |

---

## 🚀 1. Local Development Run Guide

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v8.0.0 or higher)

### Steps
1. Clone or navigate to the repository directory:
   ```bash
   cd SmartSlate
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Initialize & Seed Demo Database:
   ```bash
   npm run seed
   ```
4. Start the Application Server:
   ```bash
   npm start
   ```
5. Open browser at `http://localhost:3000`.

---

## 🍓 2. Raspberry Pi 2W Deployment Guide

### A. Raspberry Pi OS Setup & Node.js Installation
1. Flash **Raspberry Pi OS Lite (64-bit)** or **Raspberry Pi OS Desktop** onto a microSD card using Raspberry Pi Imager.
2. Connect Pi to Wi-Fi or local network and log in via SSH:
   ```bash
   ssh pi@smartslate.local
   ```
3. Install Node.js 18 LTS:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs git build-essential
   ```
4. Copy/clone SmartSlate onto the Pi into `/home/pi/smartSlate`.

### B. Persistent Background Service (PM2 / Systemd)
To keep SmartSlate running continuously across system reboots:
```bash
sudo npm install -g pm2
cd /home/pi/smartSlate
npm install
npm run seed
pm2 start server/server.js --name "smartslate"
pm2 save
pm2 startup
```

### C. Host Local Wi-Fi Access Point (Standalone Tablet Operation)
If using the Pi without an external Wi-Fi router so tablets connect directly to the Pi's Wi-Fi network:
1. Install `hostapd` and `dnsmasq`:
   ```bash
   sudo apt-get install -y hostapd dnsmasq
   ```
2. Configure static IP `192.168.4.1` on `wlan0` in `/etc/dhcpcd.conf`.
3. Configure `dnsmasq` to assign IPs `192.168.4.10` to `192.168.4.50`.
4. Configure `hostapd` with SSID `SmartSlate-Wifi` and passphrase `learningfun`.
5. Enable and start services:
   ```bash
   sudo systemctl unmask hostapd
   sudo systemctl enable hostapd dnsmasq
   sudo systemctl start hostapd dnsmasq
   ```

### D. Set Local mDNS Address (`smartslate.local`)
Enable Avahi mDNS so tablets can type `http://smartslate.local:3000`:
```bash
sudo apt-get install -y avahi-daemon
sudo systemctl enable avahi-daemon
sudo systemctl start avahi-daemon
```

### E. Configure Chromium Full-Screen Touchscreen Kiosk Mode
On startup, launch Chromium full screen pointing to SmartSlate:
1. Install Chromium & X11 utilities:
   ```bash
   sudo apt-get install -y chromium-browser unclutter xdotool
   ```
2. Create kiosk autostart script `~/.config/autostart/kiosk.desktop`:
   ```ini
   [Desktop Entry]
   Type=Application
   Name=SmartSlate Kiosk
   Exec=chromium-browser --noerrdialogs --disable-infobars --kiosk --touch-events=enabled --check-for-update-interval=31536000 http://localhost:3000
   X-GNOME-Autostart-enabled=true
   ```
3. Reboot Pi (`sudo reboot`). Chromium will open full-screen in kiosk mode automatically.

---

## 🛠️ 3. Troubleshooting Guide

| Issue | Solution |
|---|---|
| **Pi running slow / UI sluggish** | All animations are capped at <400ms. Ensure Hardware Acceleration is enabled in Chromium (`--enable-gpu-rasterization`). |
| **Tablet cannot find `smartslate.local`** | Ensure Avahi daemon is running (`sudo systemctl status avahi-daemon`). Alternatively use Pi's IP address (`http://192.168.4.1:3000`). |
| **Touchscreen input inverted or not registering** | Add `dtoverlay=rpi-ft5406` to `/boot/config.txt` and set `--touch-events=enabled` in Chromium kiosk flags. |
| **PIN code rejected** | Default PIN for all demo users is `1234`. Use "Create New Account" tile to register a custom account. |
