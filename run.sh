#!/bin/bash

# Set the port number
PORT=8009

# Check if a server is already running on this port and kill it
echo "Checking for existing server on port $PORT..."
EXISTING_PID=$(lsof -ti:$PORT 2>/dev/null)
if [ ! -z "$EXISTING_PID" ]; then
    echo "Found existing server with PID $EXISTING_PID, killing it..."
    kill $EXISTING_PID
    sleep 1
fi

# Start the Python HTTP server in the background
echo "Starting Python HTTP server on port $PORT..."
python3 -m http.server $PORT &

# Store the process ID so we can reference it later
SERVER_PID=$!

# Wait a moment for the server to start (this is probably not necessary however)
echo "Waiting for server to start..."
sleep 1

# Open the default browser to the HTML file
echo "Opening browser to http://localhost:$PORT/lingo.html"
xdg-open "http://localhost:$PORT/lingo.html"

echo "Server is running with PID $SERVER_PID"
echo "Press Ctrl+C to stop the server"

# Wait for the server process (keeps the script running)
wait $SERVER_PID
