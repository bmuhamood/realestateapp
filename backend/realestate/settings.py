# settings.py - PRODUCTION READY

import os
from pathlib import Path
from datetime import timedelta
import dj_database_url
import cloudinary
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY')
if not SECRET_KEY:
    raise ValueError("DJANGO_SECRET_KEY environment variable is required!")

DEBUG = os.environ.get('DEBUG', 'False') == 'True'
IS_RENDER = 'RENDER' in os.environ

ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    'realestateapp-sc4i.onrender.com',
    'metro-properties-web.onrender.com',
]

if not DEBUG:
    ALLOWED_HOSTS = [h for h in ALLOWED_HOSTS if h != '*']

INSTALLED_APPS = [
    'daphne',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'cloudinary_storage',          # MUST be before staticfiles
    'django.contrib.staticfiles',
    'cloudinary',

    # Third party
    'rest_framework',
    'corsheaders',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'django_filters',

    # Local apps
    'users',
    'properties',
    'bookings',
    'payments',
    'favorites',
    'reviews',
    'services',
    'channels',
    'chat',
    'dealroom',
    'complaints',

    # Allauth
    'django.contrib.sites',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
]

# ── Cloudinary ────────────────────────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME = os.environ.get('CLOUDINARY_CLOUD_NAME')
CLOUDINARY_API_KEY    = os.environ.get('CLOUDINARY_API_KEY')
CLOUDINARY_API_SECRET = os.environ.get('CLOUDINARY_API_SECRET')

if not all([CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET]):
    if DEBUG:
        print("⚠️  Warning: Cloudinary credentials not set. Images will not work.")
    else:
        raise ValueError(
            "Cloudinary credentials are required in production! "
            "Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET"
        )

cloudinary.config(
    cloud_name=CLOUDINARY_CLOUD_NAME,
    api_key=CLOUDINARY_API_KEY,
    api_secret=CLOUDINARY_API_SECRET,
    secure=True,
)

CLOUDINARY_STORAGE = {
    'CLOUD_NAME': CLOUDINARY_CLOUD_NAME,
    'API_KEY':    CLOUDINARY_API_KEY,
    'API_SECRET': CLOUDINARY_API_SECRET,
}

DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'

# ── Django Channels ───────────────────────────────────────────────────────────
ASGI_APPLICATION = 'realestate.asgi.application'

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    },
}

# ── Auth ──────────────────────────────────────────────────────────────────────
AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
]

SITE_ID = 1

SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'SCOPE': ['profile', 'email'],
        'AUTH_PARAMS': {'access_type': 'online'},
        'OAUTH_PKCE_ENABLED': True,
    }
}

# ── Middleware ────────────────────────────────────────────────────────────────
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'allauth.account.middleware.AccountMiddleware',
]

ROOT_URLCONF = 'realestate.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'realestate.wsgi.application'

# ── Database ──────────────────────────────────────────────────────────────────
if os.environ.get('DATABASE_URL'):
    DATABASES = {
        'default': dj_database_url.config(
            default=os.environ.get('DATABASE_URL'),
            conn_max_age=600,
            conn_health_checks=True,
        )
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

AUTH_USER_MODEL = 'users.User'

# ── Password validation ───────────────────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ── Internationalisation ──────────────────────────────────────────────────────
LANGUAGE_CODE = 'en-us'
TIME_ZONE     = 'Africa/Kampala'
USE_I18N      = True
USE_TZ        = True

# ── Static files ──────────────────────────────────────────────────────────────
STATIC_URL  = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static'] if (BASE_DIR / 'static').exists() else []

# CompressedStaticFilesStorage — compresses but does NOT enforce manifest.
# This avoids "Missing staticfiles manifest entry" crashes on Render.
STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'

# ── Media files (Cloudinary handles this) ─────────────────────────────────────
MEDIA_URL  = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ── CORS ──────────────────────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = [
    "https://metro-properties-web.onrender.com",
    "https://realestate-frontend.onrender.com",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:8080",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8080",
]

CSRF_TRUSTED_ORIGINS = [
    'https://metro-properties-web.onrender.com',
    'https://realestateapp-sc4i.onrender.com',
    'https://realestate-frontend.onrender.com',
]

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_METHODS = [
    'DELETE', 'GET', 'OPTIONS', 'PATCH', 'POST', 'PUT',
]

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# ── REST Framework ────────────────────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ),
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# ── JWT ───────────────────────────────────────────────────────────────────────
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME':  timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS':  True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# ── Allauth ───────────────────────────────────────────────────────────────────
ACCOUNT_EMAIL_VERIFICATION      = 'optional'
ACCOUNT_EMAIL_REQUIRED          = True
ACCOUNT_USERNAME_REQUIRED       = True
ACCOUNT_AUTHENTICATION_METHOD   = 'username_email'
ACCOUNT_UNIQUE_EMAIL            = True
LOGIN_REDIRECT_URL              = '/'
ACCOUNT_LOGOUT_REDIRECT_URL     = '/'

# ── Email ─────────────────────────────────────────────────────────────────────
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Uncomment and configure for production email sending:
# if not DEBUG:
#     EMAIL_BACKEND      = 'django.core.mail.backends.smtp.EmailBackend'
#     EMAIL_HOST         = os.environ.get('EMAIL_HOST')
#     EMAIL_PORT         = int(os.environ.get('EMAIL_PORT', 587))
#     EMAIL_USE_TLS      = True
#     EMAIL_HOST_USER    = os.environ.get('EMAIL_HOST_USER')
#     EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD')

# ── Logging ───────────────────────────────────────────────────────────────────
# On Render the filesystem is ephemeral — never write log files in production.
# Console-only logging works perfectly with Render's log dashboard.

if DEBUG and not IS_RENDER:
    # Local development: log to both console and file
    LOGS_DIR = BASE_DIR / 'logs'
    LOGS_DIR.mkdir(exist_ok=True)
    _handlers = {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'file': {
            'class': 'logging.FileHandler',
            'filename': str(LOGS_DIR / 'django.log'),
            'formatter': 'verbose',
        },
    }
    _handler_names = ['console', 'file']
else:
    # Production / Render: console only
    _handlers = {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    }
    _handler_names = ['console']

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {asctime} {message}',
            'style': '{',
        },
    },
    'handlers': _handlers,
    'loggers': {
        'django': {
            'handlers': _handler_names,
            'level': 'INFO' if DEBUG else 'WARNING',
            'propagate': True,
        },
        'django.request': {
            'handlers': _handler_names,
            'level': 'ERROR',
            'propagate': False,
        },
    },
}

# ── Security (Production only) ────────────────────────────────────────────────
if not DEBUG:
    # IMPORTANT: NEVER set SECURE_SSL_REDIRECT = True on Render.
    # Render's load balancer terminates SSL and forwards requests as HTTP internally.
    # Setting this True causes an infinite redirect loop (too many redirects error).
    SECURE_SSL_REDIRECT = False

    # This tells Django to trust Render's X-Forwarded-Proto header instead,
    # so request.is_secure() returns True correctly for HTTPS requests.
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

    SESSION_COOKIE_SECURE    = True
    CSRF_COOKIE_SECURE       = True
    SECURE_BROWSER_XSS_FILTER   = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS          = 'DENY'

    # HSTS — start at 1 hour, raise to 1 year only after confirming HTTPS is stable
    SECURE_HSTS_SECONDS            = 3600   # 1 hour — change to 31536000 when ready
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD            = False  # only True when permanently on HTTPS

    SESSION_COOKIE_HTTPONLY = True
    CSRF_COOKIE_HTTPONLY    = True

    DATA_UPLOAD_MAX_NUMBER_FIELDS = 10000