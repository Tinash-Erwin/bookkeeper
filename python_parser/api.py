from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import tempfile
from typing import Optional
from parser import get_parser, OpenAIParser, Transaction
from dataclasses import asdict
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Bank Statement Parser API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/parse")
async def parse_statement(
    file: UploadFile = File(...),
    bank: str = Form("generic"),
    api_key: Optional[str] = Form(None)
):
    # Create a temporary file to save the uploaded PDF
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
        shutil.copyfileobj(file.file, temp_file)
        temp_path = temp_file.name

    try:
        # Determine which parser to use
        if bank == "openai":
            # Use provided key or env var
            key = api_key or os.getenv("OPENAI_API_KEY")
            if not key:
                raise HTTPException(status_code=400, detail="OpenAI API key required for 'openai' bank parser")
            parser = OpenAIParser(api_key=key)
        else:
            parser = get_parser(bank)

        # Parse the file
        transactions = parser.parse(temp_path)
        
        # Convert to list of dicts
        return [asdict(t) for t in transactions]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up
        if os.path.exists(temp_path):
            os.unlink(temp_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
