#!/bin/bash

# Set the port number (should match run.sh)
PORT=8009

echo "Terminating Lingo application..."

# Find and kill any process using the Lingo port
echo "Looking for processes on port $PORT..."
PIDS=$(lsof -ti:$PORT 2>/dev/null)

if [ -z "$PIDS" ]; then
    echo "No processes found running on port $PORT"
    echo "Lingo application is not running."
    exit 0
fi

echo "Found process(es) with PID(s): $PIDS"

# Kill each process
for PID in $PIDS; do
    echo "Killing process $PID..."
    if kill $PID 2>/dev/null; then
        echo "Successfully sent TERM signal to process $PID"
    else
        echo "Failed to kill process $PID (may already be terminated)"
    fi
done

# Give processes a moment to terminate gracefully
sleep 2

# Check if any processes are still running and force kill if necessary
REMAINING_PIDS=$(lsof -ti:$PORT 2>/dev/null)
if [ ! -z "$REMAINING_PIDS" ]; then
    echo "Some processes still running, force killing..."
    for PID in $REMAINING_PIDS; do
        echo "Force killing process $PID..."
        kill -9 $PID 2>/dev/null
    done
    sleep 1
fi

# Final check
FINAL_CHECK=$(lsof -ti:$PORT 2>/dev/null)
if [ -z "$FINAL_CHECK" ]; then
    echo "SUCCESS: Lingo application terminated successfully"
    exit 0
else
    echo "ERROR: Some processes may still be running on port $PORT"
    exit 1
fi