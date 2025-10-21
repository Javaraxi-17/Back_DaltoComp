# Back_Daltocomp

API en Express + Firebase (Auth + Firestore) para login y usuarios.

## Requisitos
- Node 18+
- Proyecto de Firebase con Auth Email/Password habilitado y Firestore

## Configuración
1. Crear `.env` basado en `.env.example`:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY` (reemplazar \n por \n en una sola línea o usar comillas con \n)
   - `FIREBASE_DATABASE_URL`
   - `FIREBASE_API_KEY` (API Web key de Firebase)
2. Instalar dependencias: `npm i`
3. Desarrollo: `npm run dev`

## Endpoints
Base: `http://localhost:4000`

Auth
- POST `/auth/register` { name, email, username, password }
- POST `/auth/login` { email, password } -> { idToken, refreshToken, expiresIn, uid }
- POST `/auth/refresh` { refreshToken }
- POST `/auth/logout` { uid }

Usuarios (requieren `Authorization: Bearer <idToken>`)
- GET `/users/me`
- PATCH `/users/me` { name?, username? }
- DELETE `/users/me`
- GET `/users/:id`


