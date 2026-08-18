#!/bin/bash
# ==============================================================================
# SmartSlate Master Raspberry Pi Appliance Startup Script
# Automatically starts all production SmartSlate servers bound to 0.0.0.0
# Accessible locally via Raspberry Pi Wi-Fi Hotspot: 10.42.0.1
# ==============================================================================

set -u

BASE="/home/pi/smartslate"

# Auto-detect base directory if running from another location
if [ ! -d "$BASE" ]; then
    BASE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fi

LOGS_DIR="$BASE/logs"
mkdir -p "$LOGS_DIR"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BLUE}${BOLD}=================================================================${NC}"
echo -e "${BLUE}${BOLD}🚀 SMARTSLATE MASTER APPLIANCE STARTUP — RASPBERRY PI 2 W${NC}"
echo -e "${BLUE}${BOLD}=================================================================${NC}"
echo -e "Base Directory : ${BOLD}$BASE${NC}"
echo -e "Logs Directory : ${BOLD}$LOGS_DIR${NC}"
echo -e "Host Binding   : ${BOLD}0.0.0.0 (All Interfaces)${NC}"
echo -e "Hotspot IP     : ${BOLD}10.42.0.1${NC}"
echo -e "Timestamp      : $(date)"
echo ""

# Helper to check if a port is in use and stop existing process if needed
clean_port() {
    local port=$1
    local name=$2
    if command -v fuser >/dev/null 2>&1; then
        fuser -k "${port}/tcp" >/dev/null 2>&1 || true
    fi
}

# Helper to start a service in background with PID tracking
start_service() {
    local step=$1
    local name=$2
    local port=$3
    local dir=$4
    local cmd=$5
    local pid_file="$LOGS_DIR/${name}.pid"
    local log_file="$LOGS_DIR/${name}.log"

    echo -e "${YELLOW}[${step}] Starting ${name} (Port ${port})...${NC}"

    clean_port "$port" "$name"

    cd "$dir" || {
        echo -e "${RED}❌ Failed to change directory to $dir${NC}"
        return 1
    }

    # Start production Node process
    export PORT="$port"
    export HOST="0.0.0.0"
    export NODE_ENV="production"

    eval "$cmd" > "$log_file" 2>&1 &
    local pid=$!
    echo "$pid" > "$pid_file"

    echo -e "    → PID: ${BOLD}$pid${NC} | Log: ${log_file}"
}

# Helper to probe HTTP Health endpoint
check_health() {
    local name=$1
    local port=$2
    local url=$3
    local retries=15
    local count=0

    echo -ne "    ⏳ Probing http://localhost:${port}${url} ... "
    while [ $count -lt $retries ]; do
        if command -v curl >/dev/null 2>&1; then
            if curl -s -f -m 2 "http://127.0.0.1:${port}${url}" >/dev/null 2>&1; then
                echo -e "${GREEN}${BOLD}ONLINE (200 OK)${NC}"
                return 0
            fi
        elif command -v wget >/dev/null 2>&1; then
            if wget -q --spider --timeout=2 "http://127.0.0.1:${port}${url}" >/dev/null 2>&1; then
                echo -e "${GREEN}${BOLD}ONLINE (200 OK)${NC}"
                return 0
            fi
        fi
        sleep 1
        count=$((count + 1))
    done
    echo -e "${RED}${BOLD}TIMED OUT (Check log)${NC}"
    return 1
}

# 1. Main Student Learning Gateway (Port 3000)
start_service "1/6" "main-gateway" "3000" "$BASE/student" "node server/server.js"

# 2. Parent & Teacher Web Portal (Port 3001)
start_service "2/6" "parent-teacher" "3001" "$BASE/parent-teacher" "node server/server.js"

# 3. Elementary School Classes 1–5 (Port 3002)
if [ -f "$BASE/5thbelow/server.cjs" ]; then
    start_service "3/6" "elementary-5thbelow" "3002" "$BASE/5thbelow" "node server.cjs"
else
    start_service "3/6" "elementary-5thbelow" "3002" "$BASE/5thbelow" "node server.js"
fi

# 4. High School Classes 6–10 (Port 3003)
start_service "4/6" "highschool-6to10" "3003" "$BASE/6to10th/student" "node server/server.js"

# 5. Intermediate & Junior College (Port 3004)
start_service "5/6" "intermediate" "3004" "$BASE/intermediate" "node server.js"

# 6. B.Tech / Higher Ed (Port 3005)
start_service "6/6" "btech-highered" "3005" "$BASE/btech" "node server.js"

echo ""
echo -e "${BLUE}${BOLD}=================================================================${NC}"
echo -e "${BLUE}${BOLD}🔍 PERFORMING ACTIVE HEALTH VERIFICATION${NC}"
echo -e "${BLUE}${BOLD}=================================================================${NC}"

check_health "Gateway Hub" "3000" "/"
check_health "Parent/Teacher" "3001" "/api/health"
check_health "Elementary 1-5" "3002" "/health"
check_health "High School" "3003" "/api/health"
check_health "Intermediate" "3004" "/api/health"
check_health "B.Tech" "3005" "/api/health"

echo ""
echo -e "${GREEN}${BOLD}=================================================================${NC}"
echo -e "${GREEN}${BOLD}🌐 SMARTSLATE LOCAL NETWORK ACCESS MAP (SSID: SmartSlate-Pi)${NC}"
echo -e "${GREEN}${BOLD}=================================================================${NC}"
echo -e "📱 ${BOLD}Student Launcher Tablet App${NC} : http://10.42.0.1:3000/"
echo -e "👨‍👩‍👧‍👦 ${BOLD}Parent & Teacher Mobile App${NC} : http://10.42.0.1:3001/"
echo -e "🧸 ${BOLD}Elementary Classes (1–5)${NC}   : http://10.42.0.1:3002/"
echo -e "🔬 ${BOLD}High School Classes (6–10)${NC} : http://10.42.0.1:3003/"
echo -e "📚 ${BOLD}Intermediate Classes (11–12)${NC}: http://10.42.0.1:3004/"
echo -e "💻 ${BOLD}B.Tech Higher Education${NC}    : http://10.42.0.1:3005/"
echo -e "${GREEN}${BOLD}=================================================================${NC}"
echo -e "💡 Use ${BOLD}./status-smartslate.sh${NC} to view live status."
echo -e "💡 Use ${BOLD}./stop-smartslate.sh${NC} to halt all services."
echo ""
