# MongoDB Setup (Backend)

The backend uses **MongoDB Atlas** for auth and admin data: users, clients, and demo entries.

## Connection

- Set `MONGODB_URI` in the environment or in a `.env` file in the `backend` folder.
- Copy `backend/.env.example` to `backend/.env` and set your URI.
- Example: `MONGODB_URI=mongodb+srv://USER:PASSWORD@HOST.mongodb.net/?appName=Pump`
- **Do not commit** `.env` (it is in `backend/.gitignore`).

## Database and collections

- **Database:** `pump_pdm`
- **Collections:**
  - **`admins`** – admin login only. When the backend runs, it creates one master admin if missing: **Email:** `ranjith.c96me@gmail.com` **Password:** `12345678`
  - `users` – client login (demo-registered users)
  - `clients` – client records (company, contact, plan, number of pumps)
  - `demo_entries` – demo signup requests

## API endpoints (MongoDB-backed)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Body: `{ "email", "password" }` → `{ ok, role, user }` |
| POST | `/api/auth/register-demo` | Body: `{ name, companyName, email, password, numberOfPumps?, phone? }` → `{ ok, user, clientId, demoId }` |
| GET | `/api/admin/clients` | List all clients |
| GET | `/api/admin/clients/<id>` | One client by id |
| GET | `/api/admin/demo-entries` | List all demo entries |

If `MONGODB_URI` is not set, auth falls back to in-memory (admin only); admin list endpoints return empty arrays.

## Install and run

```bash
cd backend
pip install -r requirements.txt
# Set MONGODB_URI in .env (see .env.example)
python app.py
# or: gunicorn -w 1 -b 0.0.0.0:5000 app:app
```

Health check: `GET /api/health` includes `"mongodb": "connected"` or `"disconnected"`.
