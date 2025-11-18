#!/bin/bash
cd "$(dirname "$0")"

echo "Starting Mediation Manager..."
echo ""

# Start backend
cd backend
python3 manage.py runserver 8001 &
BACKEND_PID=$!
echo "Backend started (PID: $BACKEND_PID)"

# Wait a moment for backend to start
sleep 3

# Start frontend
cd ../frontend
npm run dev &
FRONTEND_PID=$!
echo "Frontend started (PID: $FRONTEND_PID)"

echo ""
echo "✅ Mediation Manager is running!"
echo "   Backend: http://127.0.0.1:8001"
echo "   Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user to press Ctrl+C
wait
