@echo off
echo ========================================
echo Uganda Property App - Backend Setup
echo ========================================

cd backend

echo Creating Django project...
django-admin startproject realestate .
python manage.py startapp users
python manage.py startapp properties
python manage.py startapp bookings
python manage.py startapp payments
python manage.py startapp favorites
python manage.py startapp reviews
python manage.py startapp feed

echo Creating folders...
mkdir media
mkdir media\properties
mkdir media\thumbnails
mkdir media\profiles
mkdir media\verifications
mkdir static
mkdir staticfiles
mkdir logs

echo Creating requirements.txt...
(
echo Django==4.2.7
echo djangorestframework==3.14.0
echo djangorestframework-simplejwt==5.3.0
echo django-cors-headers==4.3.1
echo psycopg2-binary==2.9.9
echo Pillow==10.1.0
echo redis==5.0.1
echo celery==5.3.4
echo django-storages==1.14.2
echo boto3==1.34.14
echo django-filter==23.5
echo drf-yasg==1.21.7
echo python-decouple==3.8
echo gunicorn==21.2.0
echo django-ffmpeg==1.0.5
echo djangorestframework-gis==1.0.0
echo django-ckeditor==6.7.0
echo django-import-export==3.3.6
echo django-debug-toolbar==4.2.0
echo sentry-sdk==1.39.1
echo whitenoise==6.6.0
echo django-allauth==0.57.0
echo phonenumbers==8.13.29
echo django-phonenumber-field==7.2.0
echo requests==2.31.0
echo stripe==7.7.0
echo flutterwave==1.2.0
) > requirements.txt

echo Installing dependencies...
pip install -r requirements.txt

echo.
echo Backend setup complete!
pause