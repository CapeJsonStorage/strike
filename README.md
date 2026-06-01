# STRIKE — CAPE Production Asset Management

A full-stack production asset management tool for producers and designers.

## Stack

- **Backend**: Node.js + Express + PostgreSQL
- **Frontend**: React (Vite), served by Express in production
- **Auth**: Session-based with bcrypt
- **Files**: multer, stored in `server/uploads/`
- **Deployment**: Railway

## Quick Start (Local)

### 1. Prerequisites

- Node.js 18+
- PostgreSQL running locally

### 2. Setup

```bash
cd STRIKE

# Copy env file
cp .env.example .env
# Edit .env with your DATABASE_URL and SESSION_SECRET

# Install root dependencies
npm install

# Install client dependencies
npm --prefix client install
```

### 3. Create the database

```bash
createdb strike
```

### 4. Run dev server

```bash
npm run dev
```

- API server: http://localhost:3001
- React dev server: http://localhost:5173

### 5. Seed the first user

```bash
curl -X POST http://localhost:3001/api/seed
```

Login: `admin@strike.com` / `strike123`

## Project Structure

```
STRIKE/
├── server/
│   ├── index.js          Express app + schema init
│   ├── db.js             PostgreSQL pool
│   ├── schema.sql        Database tables
│   └── routes/
│       ├── auth.js
│       ├── projects.js
│       ├── assets.js
│       ├── specifications.js
│       └── uploads.js
└── client/
    └── src/
        ├── pages/        Dashboard, Overview, Assets, Specifications, Premier
        └── components/   Sidebar, StatusBadge, FileUploadZone, ColorTag
```

## Deploying to Railway

1. Push to GitHub
2. Create a new Railway project
3. Add a PostgreSQL plugin
4. Set env vars: `DATABASE_URL` (auto-set by plugin), `SESSION_SECRET`, `NODE_ENV=production`
5. Railway will run `npm start` → builds React then starts Express

## Status Flow

```
Producer Input → For Revision → For Client Revision → Approved
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/login | Login |
| POST | /api/auth/logout | Logout |
| GET | /api/auth/me | Current user |
| GET | /api/projects | List projects |
| POST | /api/projects | Create project |
| GET | /api/projects/:id | Get project |
| PUT | /api/projects/:id | Update project |
| DELETE | /api/projects/:id | Soft delete (trash) |
| GET | /api/projects/:id/assets | List assets |
| POST | /api/projects/:id/assets | Create asset |
| DELETE | /api/assets/:id | Delete asset |
| GET | /api/assets/:id/specifications | Get specs |
| POST | /api/assets/:id/specifications | Create spec |
| PUT | /api/specifications/:id | Update spec |
| PUT | /api/specifications/:id/status | Advance status |
| POST | /api/specifications/:id/files | Upload file |
| GET | /api/specifications/:id/files | List files |
| DELETE | /api/files/:id | Delete file |
| GET | /api/health | Health check |
| POST | /api/seed | Create test user |
