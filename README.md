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

1. Copy your OpenAI credentials into `backend/.env` or set them as environment variables. Example:

   ```bash
   OPENAI_API_KEY=your-key-here
   OPENAI_MODEL=gpt-4.1-mini
   PORT=8080
   FRONTEND_ORIGIN=http://localhost:5173
   ```

2. Optionally configure the frontend with `frontend/.env`:

   ```bash
   VITE_API_BASE_URL=http://localhost:8080
   ```

## Running with Docker

```bash
# From the repository root
bash.exe -lc "docker compose up --build"
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8080

To stop the stack:

```bash
bash.exe -lc "docker compose down"
```

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

The frontend expects the backend at `http://localhost:8080`. Update `frontend/.env` if you run the API elsewhere.

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
