@echo off
echo ============================================
echo Uganda Property App - Simple Setup
echo ============================================
echo.

echo Current directory: %cd%
echo.

echo Step 1: Creating Python virtual environment...
if not exist properties (
    python -m venv properties
    echo Virtual environment created!
) else (
    echo Virtual environment already exists!
)
echo.

echo Step 2: Activating virtual environment...
call properties\Scripts\activate
echo Virtual environment activated!
echo.

echo Step 3: Upgrading pip...
python -m pip install --upgrade pip
echo.

echo Step 4: Installing Django and basic dependencies (without PostgreSQL)...
pip install django==4.2.7
pip install djangorestframework==3.14.0
pip install djangorestframework-simplejwt==5.3.0
pip install django-cors-headers==4.3.1
pip install pillow==10.1.0
pip install python-decouple==3.8
pip install django-filter==23.5
echo Dependencies installed!
echo.

echo Step 5: Verifying Django installation...
django-admin --version
echo.

echo Step 6: Creating Django project...
if not exist backend\manage.py (
    cd backend
    django-admin startproject realestate .
    echo Django project created!
    cd ..
) else (
    echo Django project already exists!
)
echo.

echo Step 7: Creating Django apps...
cd backend
if not exist users (
    python manage.py startapp users
    echo Created users app
)
if not exist properties (
    python manage.py startapp properties
    echo Created properties app
)
if not exist bookings (
    python manage.py startapp bookings
    echo Created bookings app
)
if not exist payments (
    python manage.py startapp payments
    echo Created payments app
)
if not exist favorites (
    python manage.py startapp favorites
    echo Created favorites app
)
if not exist reviews (
    python manage.py startapp reviews
    echo Created reviews app
)
echo.

echo Step 8: Creating basic folders...
mkdir media 2>nul
mkdir static 2>nul
mkdir templates 2>nul
echo.

echo Step 9: Running initial migrations (using SQLite)...
python manage.py migrate
echo.

echo Step 10: Creating superuser...
python manage.py createsuperuser
echo.

echo ============================================
echo Setup Complete!
echo ============================================
echo.
echo To start the development server:
echo   cd D:\uganda-property-app\backend
echo   python manage.py runserver
echo.
echo Then open: http://localhost:8000/admin
echo.
pause