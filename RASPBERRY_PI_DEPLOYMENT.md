# 🍇 SmartSlate — Raspberry Pi 2 W Deployment Guide

**Target Hardware**: Raspberry Pi 2 W  
**Operating System**: Raspberry Pi OS (Debian/Raspbian Bookworm / Bullseye)  
**Memory (RAM)**: 512 MB  
**Network Architecture**: SmartSlate Wi-Fi Hotspot (`10.42.0.1`)  

---

## 📌 System Specifications & Topology

| Parameter | Specification | Details |
|:---|:---|:---|
| **OS** | **Raspberry Pi OS** | Official Raspberry Pi OS only (Debian/Raspbian). Ubuntu, Kali, DietPi, Armbian, and Docker are **NOT** supported. |
| **Device** | **Raspberry Pi 2 W** | Quad-core 64-bit ARM Cortex-A53 CPU. |
| **RAM** | **512 MB** | Optimized Node.js processes (`--max-old-space-size=96`) with 512 MB swap buffer. |
| **Network** | **SmartSlate Wi-Fi** | Wi-Fi Access Point broadcasting SSID `SmartSlate-WiFi`. |
| **Pi Static IP** | **`10.42.0.1`** | Default gateway & local DNS address. |
| **Student Portal** | **Local Raspberry Pi Server** | Accessible at `http://10.42.0.1:3000` (Gateway), `:3002`, `:3003`, `:3004`, `:3005`. |
| **Parent Portal** | **Local Raspberry Pi Server** | Accessible at `http://10.42.0.1:3001` (`/parent/*`). |
| **Teacher Portal** | **Local Raspberry Pi Server** | Accessible at `http://10.42.0.1:3001` (`/teacher/*`). |
| **Firebase Sync** | **Cloud Firestore (`smartslate-bd117`)** | Automatic two-way sync occurs in the background whenever an active Internet connection is detected. |

---

## ⚡ Boot & Startup Architecture

```
                    Raspberry Pi OS Boots
                              │
                              ▼
            Wi-Fi Hotspot Starts (NetworkManager / hostapd)
                              │
                              ▼
                10.42.0.1 Becomes Available
                              │
                              ▼
             systemd Starts smartslate.service
                              │
                              ▼
        Student + Parent + Teacher Production Servers Start
                              │
                              ▼
             Classroom Tablets Connect to Wi-Fi
                              │
                              ▼
       Launchers Open Local SmartSlate Portals (10.42.0.1)
```

---

## 🛠️ Automated 1-Step Installation (`setup-smartslate-pi.sh`)

Transfer the project directory to `/home/pi/smartslate` on your Raspberry Pi OS device, then run:

```bash
cd /home/pi/smartslate
chmod +x setup-smartslate-pi.sh
./setup-smartslate-pi.sh
```

### What `setup-smartslate-pi.sh` Executes:
1. **Verifies Raspberry Pi OS**: Confirms `/etc/os-release` is Raspberry Pi OS (`ID=raspbian` or `NAME="Raspberry Pi OS"`). Blocks Ubuntu, Kali, DietPi, Armbian, and Docker.
2. **Verifies ARM Architecture**: Confirms `armv7l` or `aarch64` CPU.
3. **Checks Available RAM**: Validates 512 MB physical memory and configures swap space.
4. **Checks Storage**: Ensures at least 500 MB free disk space.
5. **Checks Node.js**: Verifies Node.js LTS (installs via official NodeSource if missing).
6. **Checks npm**: Verifies npm package manager.
7. **Installs Production Dependencies**: Runs `npm install --production`.
8. **Configures SmartSlate**: Seeds SQLite database (`shared/db/smartslate.db`) and sets up permissions.
9. **Configures systemd**: Writes `/etc/systemd/system/smartslate.service`.
10. **Enables Services**: Registers service for automatic start on boot.
11. **Starts Services**: Launches production master server (`smartslate-pi-master.js`).
12. **Tests Health Endpoints**: Tests `http://localhost:3000..3005/api/health`.
13. **Prints Local URLs**: Displays all portal links.

---

## 📡 Wi-Fi Hotspot Configuration (SSID: `SmartSlate-WiFi`)

To configure the Raspberry Pi 2 W as a standalone classroom Wi-Fi Access Point with static IP `10.42.0.1`:

```bash
# Create Hotspot using NetworkManager (Standard on Raspberry Pi OS Bookworm)
sudo nmcli con add type wifi ifname wlan0 mode ap con-name SmartSlateHotspot ssid "SmartSlate-WiFi"
sudo nmcli con modify SmartSlateHotspot 802-11-wireless.band bg
sudo nmcli con modify SmartSlateHotspot 802-11-wireless.channel 6
sudo nmcli con modify SmartSlateHotspot 802-11-wireless-security.key-mgmt wpa-psk
sudo nmcli con modify SmartSlateHotspot 802-11-wireless-security.psk "SmartSlate@123"
sudo nmcli con modify SmartSlateHotspot ipv4.method shared ipv4.address 10.42.0.1/24
sudo nmcli con up SmartSlateHotspot
```

---

## 🌐 Local Access URLs (Inside Classroom Hotspot)

| Portal / Education Tier | Local URL |
|:---|:---|
| 🎓 **Main Learning Gateway (Single Sign-On)** | `http://10.42.0.1:3000` |
| 👨‍👩‍👧‍👦 **Parent & Teacher Web Portal** | `http://10.42.0.1:3001` |
| 🎨 **Elementary School (Classes 1–5)** | `http://10.42.0.1:3002` |
| 📚 **High School (Classes 6–10)** | `http://10.42.0.1:3003` |
| 🔬 **Intermediate / Diploma (Classes 11–12)** | `http://10.42.0.1:3004` |
| ⚙️ **B.Tech / Higher Ed** | `http://10.42.0.1:3005` |

---

## 🔧 Service Management Commands

```bash
# View real-time service logs
sudo journalctl -u smartslate -f

# Check service status
sudo systemctl status smartslate

# Restart services
sudo systemctl restart smartslate

# Stop services
sudo systemctl stop smartslate
```
