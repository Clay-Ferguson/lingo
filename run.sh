#!/bin/bash

# Start the Python HTTP server in the background
echo "Starting Python HTTP server on port 8009..."
python3 -m http.server 8009 &

# Store the process ID so we can reference it later
SERVER_PID=$!

# Wait a moment for the server to start
echo "Waiting for server to start..."
sleep 2

# Open the default browser to the HTML file
echo "Opening browser to http://localhost:8009/lingo.html"
xdg-open "http://localhost:8009/lingo.html"

echo "Server is running with PID $SERVER_PID"
echo "Press Ctrl+C to stop the server"

# Wait for the server process (keeps the script running)
wait $SERVER_PID
