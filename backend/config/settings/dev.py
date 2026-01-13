"""
Development settings for KurbanLink backend.
"""

from .base import *

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-1lj$l1)%i0pxmmomq7bf6^c1l#n#b-_*rrpp$6e8bkj^ul3@5p'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1']


# Database
# https://docs.djangoproject.com/en/6.0/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}


# CORS settings (if needed for frontend development)
# Uncomment and install django-cors-headers when needed
# INSTALLED_APPS += ['corsheaders']
# MIDDLEWARE.insert(2, 'corsheaders.middleware.CorsMiddleware')
# CORS_ALLOWED_ORIGINS = [
#     "http://localhost:3000",
#     "http://127.0.0.1:3000",
# ]
