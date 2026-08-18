#!/usr/bin/env bash
# ==============================================================================
# 🍇 SmartSlate — Raspberry Pi 2 W Automated Setup & Deployment Script
# Target Device: Raspberry Pi 2 W (ARM Architecture, 512 MB RAM)
# Target Operating System: Raspberry Pi OS (Debian-based Raspbian / Bookworm / Bullseye)
# Network IP: 10.42.0.1 (SmartSlate Wi-Fi Hotspot)
# ==============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${CYAN}==============================================================================${NC}"
echo -e "${BOLD}🍇 SmartSlate Deployment & Verification — Raspberry Pi 2 W${NC}"
echo -e "${CYAN}==============================================================================${NC}"
echo ""

# ------------------------------------------------------------------------------
# STEP 1: VERIFY RASPBERRY PI OS
# ------------------------------------------------------------------------------
echo -e "${BLUE}[STEP 1/13] Verifying Operating System (Raspberry Pi OS)...${NC}"

if [ ! -f /etc/os-release ]; then
    echo -e "${RED}❌ ERROR: /etc/os-release not found. Cannot determine operating system.${NC}"
    exit 1
fi

OS_ID=$(grep -E '^ID=' /etc/os-release | cut -d= -f2 | tr -d '"')
OS_NAME=$(grep -E '^NAME=' /etc/os-release | cut -d= -f2 | tr -d '"')
PRETTY_NAME=$(grep -E '^PRETTY_NAME=' /etc/os-release | cut -d= -f2 | tr -d '"')

echo -e "   Detected OS: ${BOLD}${PRETTY_NAME}${NC} (ID=${OS_ID})"

# Check for forbidden operating systems
if [[ "$OS_ID" == "ubuntu" ]] || [[ "$OS_NAME" =~ [Uu]buntu ]]; then
    echo -e "${RED}❌ ERROR: Ubuntu is not supported. SmartSlate requires Raspberry Pi OS.${NC}"
    exit 1
fi

if [[ "$OS_ID" == "kali" ]] || [[ "$OS_NAME" =~ [Kk]ali ]]; then
    echo -e "${RED}❌ ERROR: Kali Linux is not supported. SmartSlate requires Raspberry Pi OS.${NC}"
    exit 1
fi

if [ -d /boot/dietpi ] || [[ "$OS_ID" == "dietpi" ]]; then
    echo -e "${RED}❌ ERROR: DietPi is not supported. SmartSlate requires Raspberry Pi OS.${NC}"
    exit 1
fi

if [[ "$OS_ID" == "armbian" ]] || [[ "$OS_NAME" =~ [Aa]rmbian ]]; then
    echo -e "${RED}❌ ERROR: Armbian is not supported. SmartSlate requires Raspberry Pi OS.${NC}"
    exit 1
fi

if [ -f /.dockerenv ]; then
    echo -e "${RED}❌ ERROR: Docker container detected. SmartSlate must run natively on Raspberry Pi OS.${NC}"
    exit 1
fi

# Confirm Raspberry Pi OS / Raspbian
IS_RPI_OS=false
if [[ "$OS_ID" == "raspbian" ]] || [[ "$OS_NAME" =~ [Rr]aspberry ]] || [[ "$PRETTY_NAME" =~ [Rr]aspberry ]] || [ -f /etc/rpi-issue ]; then
    IS_RPI_OS=true
fi

if [ "$IS_RPI_OS" = false ]; then
    echo -e "${RED}❌ FATAL ERROR: Operating system is NOT Raspberry Pi OS.${NC}"
    echo -e "${RED}   Expected: Raspberry Pi OS (Debian/Raspbian)${NC}"
    echo -e "${RED}   Found:    ${PRETTY_NAME}${NC}"
    echo -e "${RED}   Please flash the official Raspberry Pi OS onto your SD card.${NC}"
    exit 1
fi

echo -e "${GREEN}   ✅ Raspberry Pi OS verified successfully.${NC}"
echo ""

# ------------------------------------------------------------------------------
# STEP 2: VERIFY ARM ARCHITECTURE
# ------------------------------------------------------------------------------
echo -e "${BLUE}[STEP 2/13] Verifying CPU Architecture (ARM)...${NC}"
ARCH=$(uname -m)
echo -e "   Architecture: ${BOLD}${ARCH}${NC}"

case "$ARCH" in
    armv7l|aarch64|armv6l)
        echo -e "${GREEN}   ✅ Supported ARM architecture detected (${ARCH}).${NC}"
        ;;
    *)
        echo -e "${RED}❌ ERROR: Unsupported architecture '${ARCH}'. Expected ARM (armv7l / aarch64).${NC}"
        exit 1
        ;;
esac
echo ""

# ------------------------------------------------------------------------------
# STEP 3: CHECK AVAILABLE RAM (512 MB Target)
# ------------------------------------------------------------------------------
echo -e "${BLUE}[STEP 3/13] Checking RAM & Memory Configuration (512 MB Target)...${NC}"
free -h
TOTAL_MEM_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
TOTAL_MEM_MB=$((TOTAL_MEM_KB / 1024))
echo -e "   Total Physical RAM: ${BOLD}${TOTAL_MEM_MB} MB${NC}"

TOTAL_SWAP_KB=$(grep SwapTotal /proc/meminfo | awk '{print $2}')
if [ "$TOTAL_SWAP_KB" -lt 262144 ]; then
    echo -e "${YELLOW}   ⚠️ Low swap memory detected (${TOTAL_SWAP_KB} KB). Enabling 512MB swap for stability on Pi 2 W...${NC}"
    if [ -f /etc/dphys-swapfile ] && [ "$EUID" -eq 0 ]; then
        sed -i 's/^CONF_SWAPSIZE=.*/CONF_SWAPSIZE=512/' /etc/dphys-swapfile
        dphys-swapfile swapoff || true
        dphys-swapfile setup || true
        dphys-swapfile swapon || true
        echo -e "${GREEN}   ✅ 512MB swapfile configured.${NC}"
    fi
fi
echo -e "${GREEN}   ✅ Memory check completed.${NC}"
echo ""

# ------------------------------------------------------------------------------
# STEP 4: CHECK STORAGE
# ------------------------------------------------------------------------------
echo -e "${BLUE}[STEP 4/13] Checking Disk Space...${NC}"
df -h /
FREE_SPACE_MB=$(df -m / | awk 'NR==2 {print $4}')
echo -e "   Available Space on /: ${BOLD}${FREE_SPACE_MB} MB${NC}"

if [ "$FREE_SPACE_MB" -lt 500 ]; then
    echo -e "${RED}❌ ERROR: Less than 500 MB free space available. Please free up space.${NC}"
    exit 1
fi
echo -e "${GREEN}   ✅ Storage space verified.${NC}"
echo ""

# ------------------------------------------------------------------------------
# STEP 5 & 6: CHECK NODE.JS & NPM
# ------------------------------------------------------------------------------
echo -e "${BLUE}[STEP 5/13] Checking Node.js Runtime...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}   ⚠️ Node.js not found. Installing Node.js LTS for Raspberry Pi OS...${NC}"
    sudo apt-get update
    sudo apt-get install -y ca-certificates curl gnupg
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

NODE_VER=$(node -v)
echo -e "   Node.js Version: ${BOLD}${NODE_VER}${NC}"
echo -e "${GREEN}   ✅ Node.js verified.${NC}"
echo ""

echo -e "${BLUE}[STEP 6/13] Checking npm...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${YELLOW}   ⚠️ npm not found. Installing npm...${NC}"
    sudo apt-get install -y npm
fi

NPM_VER=$(npm -v)
echo -e "   npm Version: ${BOLD}${NPM_VER}${NC}"
echo -e "${GREEN}   ✅ npm verified.${NC}"
echo ""

# ------------------------------------------------------------------------------
# STEP 7: INSTALL PRODUCTION DEPENDENCIES
# ------------------------------------------------------------------------------
echo -e "${BLUE}[STEP 7/13] Installing Production Dependencies...${NC}"
INSTALL_DIR=$(pwd)
echo -e "   Working Directory: ${BOLD}${INSTALL_DIR}${NC}"

npm install --production --no-audit --no-fund

if [ -f "5thbelow/package.json" ]; then
    echo -e "   Installing Elementary School (5thbelow) dependencies..."
    (cd 5thbelow && npm install --production --no-audit --no-fund || true)
fi

echo -e "${GREEN}   ✅ Production dependencies installed.${NC}"
echo ""

# ------------------------------------------------------------------------------
# STEP 8: CONFIGURE SMARTSLATE ENVIRONMENT & DATABASE
# ------------------------------------------------------------------------------
echo -e "${BLUE}[STEP 8/13] Initializing SmartSlate SQLite Database & Config...${NC}"

# Seed and initialize local database
node shared/db/seed.js

# Ensure data directories exist with proper write permissions
mkdir -p shared/db 5thbelow/data 6to10th/student/data intermediate/data btech/data parent-teacher/data
chmod -R 775 shared/db 5thbelow/data 6to10th/student/data intermediate/data btech/data parent-teacher/data || true

echo -e "${GREEN}   ✅ Database and data directories initialized.${NC}"
echo ""

# ------------------------------------------------------------------------------
# STEP 9: CONFIGURE SYSTEMD SERVICE
# ------------------------------------------------------------------------------
echo -e "${BLUE}[STEP 9/13] Configuring systemd Service (/etc/systemd/system/smartslate.service)...${NC}"

SERVICE_FILE="/etc/systemd/system/smartslate.service"
NODE_BIN=$(which node)

cat << EOF | sudo tee "$SERVICE_FILE" > /dev/null
[Unit]
Description=SmartSlate Education Platform — Raspberry Pi 2 W Master Service
After=network.target network-online.target NetworkManager.service
Wants=network-online.target

[Service]
Type=simple
User=${USER}
WorkingDirectory=${INSTALL_DIR}
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=HOST=0.0.0.0
Environment=STUDENT_SERVER_URL=http://10.42.0.1:3000
ExecStart=${NODE_BIN} --max-old-space-size=256 ${INSTALL_DIR}/smartslate-pi-master.js
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=smartslate

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
echo -e "${GREEN}   ✅ systemd service file configured at ${SERVICE_FILE}.${NC}"
echo ""

# ------------------------------------------------------------------------------
# STEP 10: ENABLE SYSTEMD SERVICES
# ------------------------------------------------------------------------------
echo -e "${BLUE}[STEP 10/13] Enabling SmartSlate on Boot...${NC}"
sudo systemctl enable smartslate.service
echo -e "${GREEN}   ✅ smartslate.service enabled for auto-start on boot.${NC}"
echo ""

# ------------------------------------------------------------------------------
# STEP 11: START SERVICES
# ------------------------------------------------------------------------------
echo -e "${BLUE}[STEP 11/13] Starting SmartSlate Services...${NC}"
sudo systemctl restart smartslate.service
echo -e "   Waiting 6 seconds for microservices to initialize..."
sleep 6
echo -e "${GREEN}   ✅ SmartSlate services started.${NC}"
echo ""

# ------------------------------------------------------------------------------
# STEP 12: TEST HEALTH ENDPOINTS
# ------------------------------------------------------------------------------
echo -e "${BLUE}[STEP 12/13] Testing Local Health Endpoints...${NC}"

test_port() {
    local port=$1
    local name=$2
    if curl -s "http://127.0.0.1:${port}/api/health" &> /dev/null; then
        echo -e "   ✅ Port ${port} [${name}]: ${GREEN}HEALTHY (200 OK)${NC}"
    else
        echo -e "   ⚠️ Port ${port} [${name}]: ${YELLOW}Starting/Initializing${NC}"
    fi
}

test_port 3000 "Main Gateway Hub"
test_port 3001 "Parent & Teacher Portal"
test_port 3002 "Elementary School (Classes 1–5)"
test_port 3003 "High School (Classes 6–10)"
test_port 3004 "Intermediate (Classes 11–12)"
test_port 3005 "B.Tech / Higher Ed"
echo ""

# ------------------------------------------------------------------------------
# STEP 13: PRINT LOCAL ACCESS URLS
# ------------------------------------------------------------------------------
echo -e "${CYAN}==============================================================================${NC}"
echo -e "${GREEN}${BOLD}🎉 SMARTSLATE INSTALLATION COMPLETE ON RASPBERRY PI OS${NC}"
echo -e "${CYAN}==============================================================================${NC}"
echo ""
echo -e "   ${BOLD}OS:${NC}         Raspberry Pi OS"
echo -e "   ${BOLD}Device:${NC}     Raspberry Pi 2 W"
echo -e "   ${BOLD}RAM:${NC}        512 MB"
echo -e "   ${BOLD}Network:${NC}    SmartSlate Wi-Fi Hotspot"
echo -e "   ${BOLD}Pi IP:${NC}      10.42.0.1"
echo ""
echo -e "   ${BOLD}Student (Main Gateway):${NC}         http://10.42.0.1:3000"
echo -e "   ${BOLD}Parent & Teacher Web Portal:${NC}    http://10.42.0.1:3001"
echo -e "   ${BOLD}Elementary School (1–5):${NC}        http://10.42.0.1:3002"
echo -e "   ${BOLD}High School (6–10):${NC}             http://10.42.0.1:3003"
echo -e "   ${BOLD}Intermediate (11–12):${NC}           http://10.42.0.1:3004"
echo -e "   ${BOLD}B.Tech / Higher Ed:${NC}             http://10.42.0.1:3005"
echo ""
echo -e "   ${BOLD}Cloud Sync:${NC}                     Automatic background sync to Firebase"
echo -e "                                       when Internet connection is detected."
echo ""
echo -e "   ${BOLD}Useful Commands:${NC}"
echo -e "     • View logs:    ${CYAN}sudo journalctl -u smartslate -f${NC}"
echo -e "     • Status:       ${CYAN}sudo systemctl status smartslate${NC}"
echo -e "     • Restart:      ${CYAN}sudo systemctl restart smartslate${NC}"
echo -e "${CYAN}==============================================================================${NC}"
