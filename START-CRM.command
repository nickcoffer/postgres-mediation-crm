#!/bin/bash

echo "========================================"
echo "  MEDIATION CRM - STARTING..."
echo "========================================"
echo ""
echo "Starting backend and frontend..."
echo "Two terminal windows will open - DO NOT CLOSE THEM while using the CRM"
echo "Your browser will open automatically in a few seconds"
echo ""

# Get the directory where this script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Start backend in new terminal
osascript <<EOF
tell application "Terminal"
    do script "cd '$DIR/backend' && python3 manage.py runserver"
end tell
EOF

sleep 3

# Start frontend in new terminal
osascript <<EOF
tell application "Terminal"
    do script "cd '$DIR/frontend' && npm run dev"
end tell
EOF

sleep 5

# Open browser
open http://localhost:3000

echo ""
echo "========================================"
echo "  CRM IS RUNNING!"
echo "========================================"
echo ""
echo "Your CRM is now open in your browser at http://localhost:3000"
echo ""
echo "IMPORTANT: Do NOT close the two terminal windows that opened"
echo "           Close them only when you're finished using the CRM"
echo ""
echo "You can close THIS window now."
echo ""
read -p "Press ENTER to close..."
