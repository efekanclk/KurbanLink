# AI Rules – KurbanLink Project

This file defines strict development rules for the AI assistant.
The AI must follow these rules when generating or modifying code.

---

## General

- This project uses a **Django backend** and a **React frontend**.
- The backend is **API-only**. No server-side rendered templates.
- SQLite is used for **local development only**.
- The project is expected to be deployed to a server in later stages.
- Code must be written with **production-readiness in mind**, even if not deployed yet.
- Code clarity and maintainability are more important than short-term speed.

---

## Backend (Django)

- Django REST Framework MUST be used for all APIs.
- Function-based views MUST NOT be used.
- Only Class-Based Views or ViewSets are allowed.
- A **custom User model is mandatory**.
- Authentication is **email-based**. Username is NOT used.
- JWT authentication is required.
- Email verification must be supported (even if mocked initially).
- Business logic MUST NOT be written directly inside views.
- Domain logic should be placed in services or dedicated modules when appropriate.
- Models, serializers, and views should not grow excessively large.

---

## Project Structure

- Backend apps MUST be placed under an `apps/` directory.
- Each domain should have its own Django app.
- Settings MUST be split into base, development, and production configurations.
- Environment-based configuration is preferred over hardcoded values.

---

## Code Quality

- Python code SHOULD use type hints.
- New functions SHOULD include docstrings.
- Avoid premature optimization.
- Avoid overengineering.
- Write code that can be easily refactored for production deployment.

---

## What NOT to Do

- Do NOT assume the project is already deployed.
- Do NOT add infrastructure-specific code unless explicitly requested.
- Do NOT introduce frontend code unless explicitly instructed.
- Do NOT generate features outside the current task scope.
