# Docker Setup for the project.

This directory contains all necessary files to run the complete BuildLink application stack using Docker Compose.

## Prerequisites

- Docker
- Docker Compose

## Services

- Frontend (React + Vite) - Port 80
- Backend (Node.js) - Port 4000
- Python Backend (FastAPI) - Port 8000
- MongoDB - Port 27017

## Quick Start

1. From this directory, run:

```bash
docker-compose up -d
```

2. Wait for all services to start, then visit:

- Frontend: http://localhost
- Backend API: http://localhost/api
- Python Backend: http://localhost:8000
- MongoDB: localhost:27017

## Environment Variables

- Backend: See `backend.env`
- Frontend: See `frontend.env`

## Development vs Production

This setup is configured for production use. For development:

1. Add volume mounts in docker-compose.yml for live reload
2. Enable source maps and development mode
3. Use nodemon for backend

## Logs & Troubleshooting

View logs:

```bash
docker-compose logs -f [service_name]
```

Rebuild specific service:

```bash
docker-compose up -d --build [service_name]
```

Reset everything:

```bash
docker-compose down -v
docker-compose up -d
```
