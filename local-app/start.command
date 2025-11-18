#!/bin/bash
cd "$(dirname "$0")"

mkdir -p data
if [ ! -f data/db.sqlite3 ]; then
  touch data/db.sqlite3
fi

echo "Starting your Mediation CRM..."
echo "This window can stay open. Close it to stop the CRM."
echo

docker compose up
