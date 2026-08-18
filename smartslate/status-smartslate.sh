#!/bin/bash
# ==============================================================================
# SmartSlate Master Status Check Script
# Displays live process status, PID, port, and real HTTP health verification
# ==============================================================================

set -u

BASE="/home/pi/smartslate"

if [ ! -d "$BASE" ]; then
    BASE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fi

LOGS_DIR="$BASE/logs"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BLUE}${BOLD}=================================================================================${NC}"
echo -e "${BLUE}${BOLD}📊 SMARTSLATE SYSTEM APPLIANCE STATUS — RASPBERRY PI 2 W${NC}"
echo -e "${BLUE}${BOLD}=================================================================================${NC}"
printf "%-26s %-8s %-10s %-18s %-25s\n" "SERVICE NAME" "PORT" "PID" "HTTP STATUS" "HOTSPOT URL"
echo "---------------------------------------------------------------------------------"

check_service_status() {
    local name=$1
    local port=$2
    local path=$3
    local display_name=$4
    local pid_file="$LOGS_DIR/${name}.pid"

    local pid="-"
    local is_running=false
    local http_status="STOPPED"

    if [ -f "$pid_file" ]; then
        pid=$(cat "$pid_file" 2>/dev/null || echo "-")
        if [ "$pid" != "-" ] && kill -0 "$pid" >/dev/null 2>&1; then
            is_running=true
        fi
    fi

    # Check HTTP response
    local code=""
    if command -v curl >/dev/null 2>&1; then
        code=$(curl -s -o /dev/null -w "%{http_code}" -m 2 "http://127.0.0.1:${port}${path}" 2>/dev/null || echo "")
    elif command -v wget >/dev/null 2>&1; then
        if wget -q --spider --timeout=2 "http://127.0.0.1:${port}${path}" >/dev/null 2>&1; then
            code="200"
        fi
    fi

    if [ "$code" = "200" ] || [ "$code" = "304" ]; then
        http_status="${GREEN}${BOLD}RUNNING (${code})${NC}"
    elif [ "$is_running" = true ]; then
        http_status="${YELLOW}STARTING / NO HTTP${NC}"
    else
        http_status="${RED}STOPPED${NC}"
    fi

    local url="http://10.42.0.1:${port}/"
    printf "%-26s :%-7s %-10s %-28b %-25s\n" "$display_name" "$port" "$pid" "$http_status" "$url"
}

check_service_status "main-gateway" "3000" "/" "Student Gateway Hub"
check_service_status "parent-teacher" "3001" "/api/health" "Parent & Teacher Portal"
check_service_status "elementary-5thbelow" "3002" "/health" "Elementary (Grades 1–5)"
check_service_status "highschool-6to10" "3003" "/api/health" "High School (Grades 6–10)"
check_service_status "intermediate" "3004" "/api/health" "Intermediate (+2/Diploma)"
check_service_status "btech-highered" "3005" "/api/health" "B.Tech / Higher Ed"

echo -e "${BLUE}${BOLD}=================================================================================${NC}"
echo -e "Wi-Fi Hotspot IP : ${BOLD}10.42.0.1${NC} | Architecture: ${BOLD}Offline-First Appliance${NC}"
echo -e "Systemd Service  : ${BOLD}sudo systemctl status smartslate.service${NC}"
echo -e "${BLUE}${BOLD}=================================================================================${NC}"
echo ""
