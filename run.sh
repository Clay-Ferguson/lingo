#!/bin/bash

# Set the port number
PORT=8009

# Function to check if server is responding
check_server() {
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "http://localhost:$PORT/lingo.html" >/dev/null 2>&1; then
            return 0
        fi
        sleep 0.5
        attempt=$((attempt + 1))
    done
    return 1
}

echo "Starting Lingo application..."

# Check if required commands are available
if ! command -v python3 >/dev/null 2>&1; then
    echo "ERROR: python3 is not installed or not in PATH"
    exit 1
fi

if ! command -v xdg-open >/dev/null 2>&1; then
    echo "ERROR: xdg-open is not available"
    exit 1
fi

# Check if a server is already running on this port and kill it
echo "Checking for existing server on port $PORT..."
EXISTING_PID=$(lsof -ti:$PORT 2>/dev/null)
if [ ! -z "$EXISTING_PID" ]; then
    echo "Found existing server with PID $EXISTING_PID, killing it..."
    if ! kill $EXISTING_PID; then
        echo "ERROR: Failed to kill existing server process"
        exit 1
    fi
    sleep 1
fi

# Start the Python HTTP server in the background
echo "Starting Python HTTP server on port $PORT..."
python3 -m http.server $PORT >/dev/null 2>&1 &

# Store the process ID so we can reference it later
SERVER_PID=$!

# Check if the server process started successfully
if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo "ERROR: Failed to start Python HTTP server"
    exit 1
fi

# Wait for server to be ready and responding
echo "Waiting for server to be ready..."
if ! check_server; then
    echo "ERROR: Server started but is not responding to requests"
    echo "Killing server process..."
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

# Open the default browser to the HTML file
echo "Opening browser to http://localhost:$PORT/lingo.html"
if ! xdg-open "http://localhost:$PORT/lingo.html"; then
    echo "ERROR: Failed to open browser"
    echo "Server is running but browser failed to launch"
    echo "You can manually open: http://localhost:$PORT/lingo.html"
fi

echo "SUCCESS: Lingo started successfully. Server running with PID $SERVER_PID"

# Wait for the server process (keeps the script running)
wait $SERVER_PID
