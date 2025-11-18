#!/bin/bash
echo "========================================"
echo "  MEDIATION CRM - SETUP (MAC)"
echo "========================================"
echo ""
echo "This will set up your CRM. It may take 2-3 minutes."
echo "A lot of text will scroll by - this is normal!"
echo ""
read -p "Press ENTER to continue..."

echo ""
echo "[1/4] Setting up backend..."
cd backend
pip3 install -r requirements.txt
python3 manage.py migrate
python3 manage.py collectstatic --noinput

echo ""
echo "[2/4] Creating default account..."
echo "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.filter(username='admin').exists() or User.objects.create_superuser('admin', '', 'admin')" | python3 manage.py shell
cd ..

echo ""
echo "[3/4] Setting up frontend..."
cd frontend
npm install
cd ..

echo ""
echo "[4/4] Setup complete!"
echo ""
echo "========================================"
echo "  SETUP FINISHED!"
echo "========================================"
echo ""
echo "Next step: Double-click START-CRM.command to launch your CRM"
echo "Your CRM will open automatically - no login needed!"
echo ""
read -p "Press ENTER to close..."
