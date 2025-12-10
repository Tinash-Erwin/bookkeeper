import os
import json
import io
from typing import List
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
import pdfplumber
import openai

app = FastAPI()

class Transaction(BaseModel):
    date: str
    description: str
    amount: float
    category: str = "Uncategorized"

class ParseResponse(BaseModel):
    transactions: List[Transaction]

@app.post("/parse", response_model=ParseResponse)
async def parse_statement(file: UploadFile = File(...)):
    # Accept PDF files
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    content = await file.read()
    
    try:
        text = ""
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
        
        if not text.strip():
             raise HTTPException(status_code=422, detail="Could not extract text from PDF. It might be an image scan.")

        transactions = await extract_transactions_with_openai(text)
        return {"transactions": transactions}
        
    except Exception as e:
        print(f"Error parsing PDF: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def extract_transactions_with_openai(text: str) -> List[Transaction]:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise Exception("OPENAI_API_KEY not set")
    
    client = openai.AsyncOpenAI(api_key=api_key)
    
    prompt = """
    Extract all financial transactions from the following bank statement text.
    Return a JSON object with a key "transactions" which is a list of objects.
    Each object must have:
    - "date": string in YYYY-MM-DD format
    - "description": string
    - "amount": number (negative for debits/expenses, positive for credits/income)
    - "category": string (guess a category based on description, e.g., Groceries, Rent, Salary, Utilities, Transfer, etc.)
    
    Ignore headers, footers, and summary lines. Only extract individual transactions.
    
    Text:
    """
    
    # Truncate text to avoid context limit if necessary, but gpt-4o-mini has 128k context.
    # However, let's be safe and take the first 50k chars which is plenty for a statement.
    truncated_text = text[:50000]

    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a financial data extraction assistant. You output valid JSON."},
            {"role": "user", "content": prompt + "\n\n" + truncated_text}
        ],
        response_format={"type": "json_object"}
    )
    
    content = response.choices[0].message.content
    if not content:
        return []
        
    data = json.loads(content)
    return data.get("transactions", [])
