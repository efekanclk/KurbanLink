# KurbanLink Backend

Django REST API backend for the KurbanLink project.

## Setup

### Prerequisites
- Python 3.8+
- pip

### Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate virtual environment (outside the repository):
```bash
# Create venv outside the repo or in backend/ (it's gitignored)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run migrations:
```bash
python manage.py migrate
```

5. Create a superuser (optional):
```bash
python manage.py createsuperuser
```

6. Run the development server:
```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000/`

## Project Structure

```
backend/
├── apps/                    # Django applications
│   ├── accounts/           # User authentication
│   ├── animals/            # Animal management
│   ├── butchers/          # Butcher profiles
│   ├── favorites/         # User favorites
│   ├── logs/              # Activity logging
│   ├── messages/          # Messaging system
│   ├── partnerships/      # Partnerships
│   ├── recommendations/   # Recommendations
│   ├── reports/           # Reporting
│   └── reviews/           # Reviews & ratings
├── config/                # Project configuration
│   ├── settings/          # Split settings
│   │   ├── base.py       # Common settings
│   │   ├── dev.py        # Development settings
│   │   └── prod.py       # Production settings
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
└── manage.py

Note: Virtual environment (venv/) is not included in the repository.
Each developer should create their own local virtual environment.
```

## Settings

The project uses split settings:
- **Development**: Uses `config.settings.dev` (default)
- **Production**: Set `DJANGO_SETTINGS_MODULE=config.settings.prod`

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Email is used for login instead of username.

## Development

Run Django management commands:
```bash
python manage.py <command>
```

Common commands:
- `runserver` - Start development server
- `makemigrations` - Create new migrations
- `migrate` - Apply migrations
- `createsuperuser` - Create admin user
- `shell` - Django shell
- `check` - Check for issues

## API Documentation

API documentation will be available at:
- Admin: http://localhost:8000/admin/
- API Root: http://localhost:8000/api/ (when configured)
