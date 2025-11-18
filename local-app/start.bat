@echo off
cd /d %~dp0

echo Starting your Mediation CRM...
echo This window can stay open. Close it to stop the CRM.
echo.

if not exist data mkdir data
if not exist data\db.sqlite3 type nul > data\db.sqlite3

docker compose up
