# BrenKeeper

BrenKeeper is an AI-powered bookkeeping demo that ingests bank statements, converts them into structured data, and produces cash flow statements with AI assistance. The stack includes a Node.js/Express backend, a React + Vite frontend styled with Tailwind CSS, and containerization with Docker Compose.

## Prerequisites

- Docker Desktop (or Docker Engine + Docker Compose v2)
- An OpenAI API key with access to the Responses API

## Project Structure

```
.
├── backend            # Express API for ingestion, transformation, and AI summaries
├── frontend           # React UI for uploads and the assistant chat
├── docker-compose.yml # Orchestrates the frontend and backend services
└── README.md
```

## Configuration

Environment templates are split for local development and EC2 production.

1. **Root env files**

   - Local: copy `.env.local.example` to `.env.local`
   - EC2: copy `.env.ec2.example` to `.env.ec2`

   Fill in the OpenAI key and adjust `PUBLIC_DOMAIN`, `EC2_HOST`, and `ACME_EMAIL` as needed.

2. **Backend env files**

   - Local: copy `backend/.env.local.example` to `backend/.env.local`
   - EC2: copy `backend/.env.ec2.example` to `backend/.env.ec2`

   Ensure the `FRONTEND_ORIGIN` list includes every host that should interact with the API.

3. **Frontend env files**

   - Local: copy `frontend/.env.local.example` to `frontend/.env.local`
   - EC2: copy `frontend/.env.ec2.example` to `frontend/.env.ec2`

   For local overrides you can point `VITE_API_BASE_URL` at `http://localhost:8080`.

## Running with Docker

```bash
# From the repository root
bash scripts/deploy-local.sh
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8080

To stop the stack:

```bash
bash.exe -lc "docker compose down"
```

### Production deployment with Caddy

The Docker Compose stack now includes a `caddy` service that terminates TLS for `www.brenkeeper.co.za` and proxies traffic to the frontend and backend containers. Ensure the domain's DNS A record (and optional `www` CNAME) points to your EC2 instance (`54.234.215.198`) so Caddy can obtain certificates from Let's Encrypt.

1. Confirm the `.env.ec2`, `backend/.env.ec2`, and `frontend/.env.ec2` files are present on the server with production values.
2. (Optional) set `ACME_EMAIL` in `.env.ec2` so Let's Encrypt can send renewal notices.
3. On the EC2 host run:

   ```bash
   bash scripts/deploy-ec2.sh
   ```

   The script checks prerequisites and launches the stack using Docker Compose with automatic (re)builds.

The Caddyfile lives at `deploy/Caddyfile`. Adjust route rules as needed if the API routes change.

## Local Development without Docker

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend expects the backend at `http://localhost:8080`. Update `frontend/.env.local` if you run the API elsewhere.

## Demo Credentials

- Username: `brenda`
- Password: `admin123$`

## Key Features

- Upload CSV or XLSX bank statements
- Automatic conversion between CSV and XLSX for download
- Rapid transaction table preview
- AI-generated cash flow summaries
- Embedded AI bookkeeping assistant chat

## Licensing

This project is provided for demonstration purposes. Review and update dependencies and licensing before production use.
