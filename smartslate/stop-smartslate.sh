#!/bin/bash
# ==============================================================================
# SmartSlate Master Raspberry Pi Appliance Shutdown Script
# Gracefully stops all SmartSlate services and frees ports 3000-3005
# ==============================================================================

set -u

BASE="/home/pi/smartslate"

if [ ! -d "$BASE" ]; then
    BASE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fi

LOGS_DIR="$BASE/logs"

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BLUE}${BOLD}=================================================================${NC}"
echo -e "${BLUE}${BOLD}🛑 STOPPING ALL SMARTSLATE APPLIANCE SERVICES${NC}"
echo -e "${BLUE}${BOLD}=================================================================${NC}"

stop_service() {
    local name=$1
    local port=$2
    local pid_file="$LOGS_DIR/${name}.pid"

    echo -ne "Stopping ${name} (Port ${port})... "

    if [ -f "$pid_file" ]; then
        local pid
        pid=$(cat "$pid_file")
        if kill -0 "$pid" >/dev/null 2>&1; then
            kill "$pid" >/dev/null 2>&1 || true
            sleep 1
            if kill -0 "$pid" >/dev/null 2>&1; then
                kill -9 "$pid" >/dev/null 2>&1 || true
            fi
            echo -e "${GREEN}STOPPED (PID: $pid)${NC}"
        else
            echo -e "${YELLOW}NOT RUNNING (Stale PID)${NC}"
        fi
        rm -f "$pid_file"
    else
        echo -e "${YELLOW}NO PID FILE${NC}"
    fi

    # Ensure port is clean
    if command -v fuser >/dev/null 2>&1; then
        fuser -k "${port}/tcp" >/dev/null 2>&1 || true
    fi
}

stop_service "main-gateway" "3000"
stop_service "parent-teacher" "3001"
stop_service "elementary-5thbelow" "3002"
stop_service "highschool-6to10" "3003"
stop_service "intermediate" "3004"
stop_service "btech-highered" "3005"

# Clean any remaining node processes for SmartSlate if needed
pkill -f "student/server/server.js" >/dev/null 2>&1 || true
pkill -f "parent-teacher/server/server.js" >/dev/null 2>&1 || true
pkill -f "5thbelow/server" >/dev/null 2>&1 || true
pkill -f "6to10th/student/server/server.js" >/dev/null 2>&1 || true
pkill -f "intermediate/server.js" >/dev/null 2>&1 || true
pkill -f "btech/server.js" >/dev/null 2>&1 || true

echo -e "${GREEN}${BOLD}=================================================================${NC}"
echo -e "${GREEN}${BOLD}✅ ALL SMARTSLATE SERVICES STOPPED SUCCESSFULLY${NC}"
echo -e "${GREEN}${BOLD}=================================================================${NC}"
echo ""
