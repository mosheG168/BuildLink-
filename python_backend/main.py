import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Literal

from sentence_transformers import SentenceTransformer
import openai
import anthropic

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

hf_model = SentenceTransformer('all-MiniLM-L6-v2')
claude_client = anthropic.Anthropic(api_key=os.getenv('CLAUDE_API_KEY', ''))

class EmbedRequest(BaseModel):
    text: str
    provider: Literal['huggingface', 'openai', 'claude'] = 'huggingface'
    model: str = ''  

@app.post('/embed')
def embed(req: EmbedRequest):
    if req.provider == 'huggingface':
        model_name = req.model or 'all-MiniLM-L6-v2'
        model = SentenceTransformer(model_name)
        emb = model.encode(req.text).tolist()
        return {'embedding': emb, 'provider': 'huggingface', 'model': model_name}
    # elif req.provider == 'openai':
    #     openai.api_key = os.getenv('OPENAI_API_KEY', '')
    #     model_name = req.model or 'text-embedding-ada-002'
    #     try:
    #         resp = openai.Embedding.create(input=req.text, model=model_name)
    #         emb = resp['data'][0]['embedding']
    #         return {'embedding': emb, 'provider': 'openai', 'model': model_name}
    #     except Exception as e:
    #         raise HTTPException(status_code=500, detail=str(e))
    # elif req.provider == 'claude':
    #     model_name = req.model or 'claude-3-sonnet-20240229'
    #     try:
    #         resp = claude_client.embeddings.create(input=req.text, model=model_name)
    #         emb = resp['embedding']
    #         return {'embedding': emb, 'provider': 'claude', 'model': model_name}
    #     except Exception as e:
    #         raise HTTPException(status_code=500, detail=str(e))
    else:
        raise HTTPException(status_code=400, detail='Unknown provider')
