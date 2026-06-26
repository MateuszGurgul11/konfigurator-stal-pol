# Backend API — Konfigurator STAL-POL

FastAPI + Firebase Admin SDK. Jedyny punkt dostępu do Firestore.

## Wymagania

- Python 3.11+
- Klucz service account z Firebase Console

## Konfiguracja

1. Firebase Console → Project settings → Service accounts → **Generate new private key**
2. Zapisz plik jako `backend/serviceAccountKey.json` (jest w `.gitignore`)
3. Skopiuj konfigurację:

```bash
cp .env.example .env
```

## Uruchomienie

**Pierwsza konfiguracja:**

```bash
cd backend
./setup.sh
```

**Codzienne uruchomienie:**

```bash
cd backend
./run-dev.sh
```

Alternatywnie ręcznie:

```bash
cd backend
source .venv/bin/activate   # Windows: .venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

API: http://localhost:8000  
Dokumentacja: http://localhost:8000/docs  
Health check: http://localhost:8000/api/health

Frontend uruchamiasz osobno z katalogu głównego projektu: `npm run dev` (http://localhost:3000).

## Deploy na Render

Repozytorium: `https://github.com/MateuszGurgul11/konfigurator-stal-pol`

Plik [`render.yaml`](../render.yaml) w katalogu głównym uruchamia backend z `rootDir: backend`.

### Kroki

1. [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint** → połącz repo `konfigurator-stal-pol`.
2. Render utworzy usługę `konfigurator-stal-pol-api` (Docker, region Frankfurt).
3. W **Environment** uzupełnij zmienne z [`render.env.example`](../render.env.example):

```bash
cd backend
./scripts/print-render-env.sh
```

Skopiuj wypisany `FIREBASE_SERVICE_ACCOUNT_JSON` (jedna linia) do Render.

4. Ustaw `CORS_ORIGINS`, np.:
   ```
   https://konfigurator-stal-pol.vercel.app,http://localhost:3000,http://localhost:3001
   ```
5. Po deployu skopiuj URL API (np. `https://konfigurator-stal-pol-api.onrender.com`).
6. W Vercel ustaw `NEXT_PUBLIC_API_URL` na ten URL i zrób redeploy frontendu.

`FIREBASE_PROJECT_ID` i `PORT` są już zdefiniowane w `render.yaml`.

## Endpointy

| Metoda | Ścieżka | Auth |
|--------|---------|------|
| GET | `/api/health` | — |
| GET | `/api/catalog` | — |
| GET | `/api/admin/{collection}` | Bearer |
| POST | `/api/admin/{collection}` | Bearer |
| PUT | `/api/admin/{collection}/{id}` | Bearer |
| DELETE | `/api/admin/{collection}/{id}` | Bearer |
| POST | `/api/admin/seed` | Bearer |

Kolekcje: `posts`, `panels`, `spacerOptions`, `heights`, `colors`
