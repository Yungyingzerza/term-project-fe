# ChillChill – Frontend Application

## Overview

ChillChill is a short-form video platform that enables users to publish content, join communities, and collaborate inside shared organizations. This repository hosts the Next.js frontend that renders the client experience and connects to the REST API exposed by the sibling backend project [`term-project-be`](https://github.com/Yungyingzerza/term-project-be). The backend manages authentication, media processing through MinIO, messaging, and organizational features that power the application.

## Project Team

- วีระศักดิ์ ฮ้อยตะคุ 660615040
- สพล ธิติธนชิต 660615041
- พลพัฒน์ ชาญด้วยวิทย์ 660610873

## Technology Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, DaisyUI, Redux Toolkit, Axios, Bun runtime
- **Backend Services:** Express 5 (Bun), Mongoose, Multer, MinIO SDK, JSON Web Tokens, Nodemailer – delivered through [`term-project-be`](https://github.com/Yungyingzerza/term-project-be)
- **Storage & Messaging:** MongoDB (primary datastore), Redis (cache/session), MinIO (S3-compatible object storage)
- **Tooling & Operations:** Docker, Docker Compose, ESLint 9, Turbopack development server

## Repository Structure

```
term-project-fe/
├── Dockerfile
├── docker-compose.yaml        # Local orchestration (frontend + backend + infrastructure)
├── package.json
├── public/
└── src/
    ├── app/                   # App Router routes
    ├── components/            # UI modules and feature composites
    ├── hooks/                 # Client-side data fetching and state hooks
    ├── lib/                   # REST client helpers, utilities, loaders
    └── store/                 # Redux Toolkit store and slices
```

> The backend source lives in the companion repository `term-project-be/` and is referenced throughout this guide.

## Prerequisites

- Bun 1.x (Node.js 20+ can be used if you prefer npm or pnpm)
- Docker Desktop with Docker Compose
- Git

## Repository Setup

```bash
git clone https://github.com/Yungyingzerza/term-project-fe.git
git clone https://github.com/Yungyingzerza/term-project-be.git
```

Both repositories should reside side by side:

```
.
├── term-project-fe/
└── term-project-be/
```

## Environment Configuration

### Frontend (`term-project-fe/.env.local`)

| Variable                        | Example (development)      | Description                                             |
| ------------------------------- | -------------------------- | ------------------------------------------------------- |
| `NEXT_PUBLIC_BASE_API`          | `http://localhost:8000`    | Public REST API endpoint consumed by the browser        |
| `NEXT_PUBLIC_API_BASE_INTERNAL` | `http://term-backend:8000` | Internal API URL when running inside docker-compose     |
| `JWT_SECRET`                    | `secret`                   | Secret used by frontend middleware when decoding tokens |

> Copy `.env` to `.env.local` and adjust the values to match your environment.

### Backend (`term-project-be/.env`)

| Variable                                  | Example (development)                                               | Description                                        |
| ----------------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------- |
| `PORT`                                    | `8000`                                                              | Backend service port                               |
| `MONGO`                                   | `mongodb://root:password@mongo:27017/fullstack?authSource=admin`    | MongoDB connection string (docker-compose network) |
| `REDIS_URL`                               | `redis://redis:6379`                                                | Redis connection string                            |
| `MINIO_ENDPOINT`                          | `minio`                                                             | Hostname for the MinIO service                     |
| `REDIRECT_URI_AFTER_LOGIN`                | `http://localhost:3000`                                             | Callback target after LINE authentication          |
| `JWT_SECRET`, `REFRESH_TOKEN_HMAC_SECRET` | Secrets shared with the frontend                                    |
| `EMAIL`, `CUSTOM_EMAIL`, `EMAIL_PASSWORD` | Mailbox used for transactional email (can be mocked in development) |

## Installing Dependencies

```bash
cd term-project-be
bun install

cd ../term-project-fe
bun install       # or npm install / pnpm install
```

## Local Development Workflow

Run the three groups of services in separate terminals.

1. **Infrastructure services (MongoDB, Redis, MinIO)**

   ```bash
   cd term-project-fe
   docker compose up -d mongo redis minio
   ```

2. **Backend API**

   ```bash
   cd term-project-be
   bun run dev
   ```

3. **Frontend**
   ```bash
   cd term-project-fe
   bun dev        # or npm run dev
   ```

The frontend is available at [http://localhost:3000](http://localhost:3000) and the backend API at [http://localhost:8000](http://localhost:8000). Use `docker compose down` to stop the infrastructure services when finished.

## Data Seeding (Backend Only)

The frontend does not ship with seeders. Populate sample data by running the scripts in `term-project-be`.

1. Confirm MongoDB, Redis, and MinIO are running (see the infrastructure command above).
2. Create mock users:
   ```bash
   cd term-project-be
   bun run seeders/createMockUsers.ts
   ```
   This script reads `seeders/users.json` and persists the resulting identities to MongoDB, storing metadata in `seeders/usersWithIds.json`.
3. (Optional) Upload mock videos to enrich the feed:
   - Update `VIDEOS_DIR` in `seeders/uploadmock.ts` to point to a directory that contains `.mp4` assets.
   - Override the API endpoint as needed:
     ```bash
     cd term-project-be
     API_URL=http://localhost:8000 bun run seeders/uploadmock.ts
     ```
   - Uploaded post history is persisted to `seeders/uploadedVideos.json`.

## Docker-Based Deployment

### Build Images

```bash
# From the directory that contains both repositories
docker build -t term-frontend ./term-project-fe
docker build -t term-backend ./term-project-be
```

### Run the Full Stack with docker-compose

```bash
cd term-project-fe
docker compose up -d
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- MongoDB: localhost:27017 (credentials defined in docker-compose)
- Redis: localhost:6379
- MinIO: S3 API on port 9000; console available at http://localhost:9001 (`minioadmin/minioadmin` by default)

Rebuild images after code or environment changes:

```bash
docker compose build term-frontend term-backend
```

Shut everything down with:

```bash
docker compose down
```

## Common Scripts

- `bun dev` / `npm run dev` – Start the frontend development server (Turbopack)
- `bun run build` / `npm run build` – Produce the production bundle
- `bun start` / `npm run start` – Serve the production build (requires a prior build)
- `bun run lint` / `npm run lint` – Run ESLint checks

## Operational Notes

- The frontend layer has no dedicated seeders; all fixture data is provisioned through backend scripts.
- Keep `JWT_SECRET`, API URLs, and related environment variables synchronized between frontend and backend, especially when running inside docker-compose.
- If you extend the seeding scripts (e.g., adjusting `VIDEOS_DIR` or `API_URL` defaults), commit the configuration to keep the workflow reproducible for teammates.
