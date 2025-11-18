#!/bin/bash

# Start Docker Desktop if it isn't already running
open -gj -a "Docker"

# Wait for Docker to be ready
sleep 5

# Navigate to the compose folder
cd "/Users/nickcoffer/Downloads/mediation-crm-starter-tailwind/local-app"

# Start CRM containers in the background
/usr/local/bin/docker compose up &

# Give the containers a moment to start
sleep 4

# Open the CRM in the default browser
open "http://localhost:3000"

# Keep the app alive so Docker logs continue to show (not required, but helpful)
wait
