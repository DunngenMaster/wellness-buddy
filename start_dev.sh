#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Wellness Buddy Development Environment${NC}"
echo -e "${BLUE}================================================${NC}"

# Function to cleanup background processes on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down development environment...${NC}"
    if [ ! -z "$FLASK_PID" ]; then
        echo -e "${YELLOW}📡 Stopping Flask proxy server (PID: $FLASK_PID)${NC}"
        kill $FLASK_PID 2>/dev/null
    fi
    if [ ! -z "$EXPO_PID" ]; then
        echo -e "${YELLOW}📱 Stopping Expo development server (PID: $EXPO_PID)${NC}"
        kill $EXPO_PID 2>/dev/null
    fi
    echo -e "${GREEN}✅ Development environment stopped${NC}"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check if required packages are installed
echo -e "${YELLOW}🔍 Checking dependencies...${NC}"

# Check if Flask is installed
if ! python3 -c "import flask" 2>/dev/null; then
    echo -e "${RED}❌ Flask not found. Installing...${NC}"
    pip3 install flask flask-cors requests
else
    echo -e "${GREEN}✅ Flask is installed${NC}"
fi

# Check if Node.js and npm are available
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js first.${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found. Please install npm first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All dependencies are available${NC}"

# Start Flask proxy server
echo -e "${YELLOW}📡 Starting Flask proxy server...${NC}"
python3 flask_proxy_server.py &
FLASK_PID=$!

# Wait a moment for Flask to start
sleep 3

# Check if Flask server started successfully
if curl -s http://localhost:5001/health > /dev/null; then
    echo -e "${GREEN}✅ Flask proxy server is running on http://localhost:5001${NC}"
else
    echo -e "${RED}❌ Flask proxy server failed to start${NC}"
    cleanup
fi

# Start Expo development server
echo -e "${YELLOW}📱 Starting Expo development server...${NC}"
npx expo start --web &
EXPO_PID=$!

# Wait a moment for Expo to start
sleep 5

# Check if Expo server started successfully
if curl -s http://localhost:8081 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Expo development server is running on http://localhost:8081${NC}"
else
    echo -e "${YELLOW}⚠️  Expo server might still be starting...${NC}"
fi

echo -e "\n${GREEN}🎉 Development environment is ready!${NC}"
echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}📱 React App:${NC} http://localhost:8081"
echo -e "${GREEN}📡 Flask Proxy:${NC} http://localhost:5001"
echo -e "${GREEN}🧪 Test API:${NC} http://localhost:5001/test-remote"
echo -e "${BLUE}================================================${NC}"
echo -e "${YELLOW}💡 Press Ctrl+C to stop all servers${NC}"
echo -e "${YELLOW}💡 Check browser console for API logs${NC}"

# Keep the script running
wait 