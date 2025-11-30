# BuildLink

BuildLink is a full-stack platform that connects contractors and subcontractors in the construction industry.

It provides job posting, matching, and collaboration tools, powered by semantic search and text embeddings (HuggingFace, OpenAI, Claude) to intelligently recommend professionals and project teams.

---

## Features

- 🔐 **Auth & Roles** – JWT-based authentication with role-based access.
- 🏗️ **Job Posts & Requests** – Contractors post jobs, subcontractors apply, withdraw, and track status.
- 📊 **Job Lifecycle** – Pending → Accepted → In Progress → Completed/Cancelled.
- 👷 **Contractor & Sub Profiles** – Structured profiles with skills, coverage areas, documents, and portfolio.
- 💬 **Comments & Notifications** – Threaded comments, replies, and in-app notifications.
- 🧠 **Semantic Matching** – Embedding service for smart matching via HuggingFace / OpenAI / Claude.
- 🐳 **Dockerized Stack** – One command to run the entire system (frontend + backend + Python + MongoDB).

---

## Tech Stack

**Frontend**

- React + Vite
- Material UI (MUI)
- React Query

**Backend API (Node.js)**

- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- Seed / maintenance scripts (job generator, re-embedding)

**Embeddings Service (Python)**

- FastAPI
- Uvicorn
- Sentence Transformers (e.g. `all-MiniLM-L6-v2`)
- Optional: OpenAI / Anthropic APIs (via environment variables)

**Infrastructure**

- MongoDB 6+
- Docker & Docker Compose (optional but recommended)

---

## Repository Structure (high level)

```text
backend/         # Node.js API (jobs, users, profiles, requests, notifications, etc.)
frontend/        # React + Vite frontend (MUI)
python_backend/  # FastAPI embeddings service
docker/          # Docker Compose and env templates (if present)


** Run with Docker (recommended)**
From the project root: `cd docker_full_setup && docker compose up -d --build` then open `http://localhost` in your browser.

** Run locally (classic dev mode)**
Start MongoDB, then in `/backend` run `npm install && nodemon`, in `/frontend` run `npm install && npm run dev`, and in `/python_backend` run `pip install -r requirements.txt && uvicorn main:app --reload --port 8000`.



## Prerequisites

For local (non-Docker) runs:

    Node.js 18+ and npm

    Python 3.10+ (for the embeddings service)

    MongoDB 6+ (local install or via Docker)

## For Docker runs:

    Docker

    Docker Compose


## Start the Python Embeddings Service:
    cd python_backend

    # (Optional) Create and activate a venv
    python -m venv .venv
    # Windows:
    #   .\.venv\Scripts\activate
    # macOS / Linux:
    #   source .venv/bin/activate

    # Install dependencies
    pip install -r requirements.txt

    # Configure provider/API keys via environment variables or .env
    # e.g. HUGGINGFACE_API_TOKEN / OPENAI_API_KEY / ANTHROPIC_API_KEY if used

    # Run the FastAPI service
    uvicorn app:app --host 127.0.0.1 --port 8000 --reload


 ## Configure the Node.js Backend:
      cd backend

# Install dependencies
npm install


# MongoDB connection
MONGO_URI=mongodb://localhost:27017/buildlink

# Python embedding service URL
PY_EMBED_URL=http://localhost:8000/embed

# (Examples – adjust to your actual setup)
JWT_SECRET=change_me
CLIENT_URL=http://localhost:5173
PORT=4000

# Optional seed defaults
SEED_USER_EMAIL=seed@buildlink.local


# Development
npm run dev

cd frontend

# Install dependencies
npm install

VITE_API_URL=http://localhost:4000


## Generate Sample Jobs
cd backend

# Generate 100 jobs with embeddings
node scripts/generate_jobs.js 100

# Generate 50 jobs without embeddings
node scripts/generate_jobs.js 50 --no-embed


Troubleshooting

Cannot connect to MongoDB

Make sure MongoDB container or local mongod is running.

Verify MONGO_URI in backend/.env.

Embedding request failed

Confirm Python backend is running on http://localhost:8000.

Confirm PY_EMBED_URL in backend/.env matches.

As a fallback, you can run scripts with --no-embed to skip embeddings.

Module not found / dependency issues

Run npm install in both backend/ and frontend/.

Run pip install -r requirements.txt in python_backend/.
```
