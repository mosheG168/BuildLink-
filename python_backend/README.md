# Embeddings Service

This Python backend provides an API to generate embeddings for input strings using multiple models:

- HuggingFace Transformers
- OpenAI
- Claude (Anthropic)

## Features

- Submit a string and receive its embeddings
- Select from multiple model providers

## Setup (in Windows)

1. Create a new python venv: python -m venv buildlink_env
2. Activate the new venv: ".\buildlink_env\Scripts\activate"
3. Install dependencies (see requirements.txt)
4. Configure API keys for OpenAI and Claude
5. Run the service: "python -m uvicorn main:app --reload"

## Endpoints

- `/embed` : POST a string and select model provider

## Models Supported

- HuggingFace: e.g., sentence-transformers/all-MiniLM-L6-v2
- Future:
  - OpenAI: e.g., text-embedding-ada-002
  - Claude: e.g., Claude 3 Sonnet

## Test using cmd

## Run: curl -X POST "http://127.0.0.1:8000/embed" -H "Content-Type: application/json" -d "{\"text\": \"hello world\", \"provider\": \"huggingface\"}"

See `main.py` for implementation details.
