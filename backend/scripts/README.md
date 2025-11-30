# Job Generator Script

A utility script to populate the BuildLink database with sample job posts, including embeddings for semantic search functionality.

## (Maintenance) Re-Embed Posts & Profiles

If you change your embedding model/provider or want to refresh vectors:

### Re-Embed all Posts

`````bash
# From backend/
node scripts/reembed_posts.js
# Optional flags:
#   --limit=500       re-embed only first N posts
#   --provider=hf     provider override (hf|openai|anthropic) if your service supports it
#   --concurrency=4   parallel requests to the Python service

````bash
# From backend directory
node scripts/reembed_posts.js          # only posts without vectors
node scripts/reembed_posts.js --all    # force re-embed all posts

# From backend directory (Recomputes profile.profileEmbedding for all profiles or only those marked openForWork.)
node scripts/reembed_profiles.js         # all profiles
node scripts/reembed_profiles.js --open  # only open-for-work profiles

## Re-Embed all Contractor Profiles
  # From backend/
node scripts/reembed_profiles.js
# Optional flags are the same as for posts

Ensure the Python service is running before re-embedding:
# From python_backend/
  uvicorn app:app --host 127.0.0.1 --port 8000 --reload

## Quick Start

```powershell
# From backend directory
cd path\to\your\cloned\repo\backend

# Generate 100 jobs with embeddings
node scripts\generate_jobs.js 100

# Generate 50 jobs without embeddings
node scripts\generate_jobs.js 50 --no-embed
`````

## Prerequisites

- Node.js installed
- MongoDB running (local or via Docker)
- Python backend running for embeddings (optional)
- Backend dependencies installed (`npm install` in backend directory)

## Environment Setup

Create/modify `.env` file in the backend directory:

```env
# MongoDB connection (required)
MONGO_URI=mongodb://localhost:27017/buildlink


# Python embedding service (optional)
PY_EMBED_URL=http://localhost:8000/embed

# Custom seed user (optional)
SEED_USER_EMAIL=seed@buildlink.local
```

## Features

The script generates:

- Varied job titles from construction/trade industry
- Realistic salary ranges ($30k-$150k)
- Multiple locations across Israel
- Common job requirements
- Random posting dates (last 60 days)
- Embedding vectors for semantic search
- A seed user if none exists

## Generated Data Examples

```javascript
{
  title: "Carpenter Needed - Urgent",
  location: "Tel Aviv",
  salary: "$45k-$65k",
  content: "We are looking for a reliable worker to join our team for ongoing projects.",
  requirements: "3+ years experience; Valid trade license",
  publisher: (linked to seed user),
  embedding: [...], // vector if embeddings enabled
  date: (random date within last 60 days)
}
```

## Command Line Options

- First argument: Number of jobs to generate (default: 100)

  ```powershell
  node scripts\generate_jobs.js 50  # generate 50 jobs
  ```

- `--no-embed` flag: Skip embedding generation
  ```powershell
  node scripts\generate_jobs.js 100 --no-embed
  ```

## Sample Output

```
✅ Connected to MongoDB
🔹 Created seed user: seed@buildlink.local
Preparing to insert 100 jobs (embeddings: true)
Inserted 10/100...
Inserted 20/100...
...
✅ Inserted 100 jobs. Sample id: 6573f1234c567d8901234567
```

## Troubleshooting

### MongoDB Connection Issues

- Verify MongoDB is running:

  ```powershell
  # If using Docker
  docker ps | findstr mongo

  # Test connection
  Test-NetConnection -ComputerName localhost -Port 27017
  ```

- Check MONGO_URI in .env file

### Embedding Service Issues

- Verify Python backend is running at http://localhost:8000
- Try the --no-embed flag to skip embeddings
- Check PY_EMBED_URL in .env matches your setup

### Common Problems

1. "Cannot connect to MongoDB":
   - Check if MongoDB is running
   - Verify connection string in .env
2. "Embedding request failed":
   - Ensure Python backend is running
   - Use --no-embed flag if not needed
3. "Module not found":
   - Run `npm install` in backend directory

## Notes

- Safe to run multiple times - adds new posts, doesn't modify existing
- Creates seed user only if no users exist
- Maintains referential integrity
- All generated data is fictional
