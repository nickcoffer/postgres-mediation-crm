web: python manage.py migrate && python manage.py ensure_admin && gunicorn mediation_crm.wsgi:application --bind 0.0.0.0:$PORT
