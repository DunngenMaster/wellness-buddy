#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🛑 Stopping Wellness Buddy Development Environment${NC}"
echo -e "${BLUE}================================================${NC}"

# Stop Flask proxy server
echo -e "${YELLOW}📡 Stopping Flask proxy server...${NC}"
pkill -f "python3 flask_proxy_server.py" 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Flask proxy server stopped${NC}"
else
    echo -e "${YELLOW}⚠️  Flask proxy server was not running${NC}"
fi

# Stop Expo development server
echo -e "${YELLOW}📱 Stopping Expo development server...${NC}"
pkill -f "expo start" 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Expo development server stopped${NC}"
else
    echo -e "${YELLOW}⚠️  Expo development server was not running${NC}"
fi

# Stop any remaining Node.js processes on ports 8081/8082
echo -e "${YELLOW}🔍 Cleaning up Node.js processes...${NC}"
lsof -ti:8081 | xargs kill -9 2>/dev/null
lsof -ti:8082 | xargs kill -9 2>/dev/null
lsof -ti:5001 | xargs kill -9 2>/dev/null

echo -e "${GREEN}✅ All development servers stopped${NC}"
echo -e "${BLUE}================================================${NC}" 