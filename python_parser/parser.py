import pdfplumber
import pandas as pd
import re
import argparse
import json
import sys
import os
from abc import ABC, abstractmethod
from dataclasses import dataclass, asdict
from typing import List, Optional, Dict, Any
from dotenv import load_dotenv
import openai

@dataclass
class Transaction:
    date: str
    description: str
    amount: float
    balance: Optional[float] = None
    category: Optional[str] = None

class BankStatementParser(ABC):
    @abstractmethod
    def parse(self, pdf_path: str) -> List[Transaction]:
        pass

class GenericParser(BankStatementParser):
    """
    A generic parser that attempts to find tables in the PDF
    and map columns based on common headers.
    """
    def parse(self, pdf_path: str) -> List[Transaction]:
        transactions = []
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                tables = page.extract_tables()
                for table in tables:
                    if not table:
                        continue
                    
                    # Try to identify headers
                    headers = [str(h).lower() if h else '' for h in table[0]]
                    
                    date_idx = -1
                    desc_idx = -1
                    amount_idx = -1
                    balance_idx = -1
                    
                    # Simple heuristic to find columns
                    for i, header in enumerate(headers):
                        if 'date' in header:
                            date_idx = i
                        elif 'description' in header or 'details' in header or 'transaction' in header:
                            desc_idx = i
                        elif 'amount' in header or 'debit' in header or 'credit' in header:
                            # If we have separate debit/credit columns, this simple logic might need enhancement
                            # For now, assume a single amount column or take the first one found
                            if amount_idx == -1: 
                                amount_idx = i
                        elif 'balance' in header:
                            balance_idx = i

                    # If we found at least date and amount, try to parse rows
                    if date_idx != -1 and amount_idx != -1:
                        for row in table[1:]: # Skip header
                            try:
                                # Clean data
                                date_str = row[date_idx]
                                desc_str = row[desc_idx] if desc_idx != -1 else "No Description"
                                amount_str = row[amount_idx]
                                balance_str = row[balance_idx] if balance_idx != -1 else None
                                
                                if not date_str or not amount_str:
                                    continue

                                # Basic amount cleaning (remove currency symbols, commas)
                                amount_clean = str(amount_str).replace('$', '').replace(',', '').replace(' ', '')
                                
                                # Handle (100.00) as negative
                                if '(' in amount_clean and ')' in amount_clean:
                                    amount_clean = '-' + amount_clean.replace('(', '').replace(')', '')
                                
                                amount = float(amount_clean)
                                
                                balance = None
                                if balance_str:
                                    balance_clean = str(balance_str).replace('$', '').replace(',', '').replace(' ', '')
                                    try:
                                        balance = float(balance_clean)
                                    except ValueError:
                                        pass

                                transactions.append(Transaction(
                                    date=date_str,
                                    description=desc_str.replace('\n', ' '),
                                    amount=amount,
                                    balance=balance
                                ))
                            except (ValueError, IndexError):
                                continue
        return transactions

class OpenAIParser(BankStatementParser):
    """
    Uses OpenAI's GPT models to intelligently extract transactions from PDF text.
    Requires OPENAI_API_KEY environment variable.
    """
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            # We don't raise here to allow instantiation, but parse will fail if key is missing
            pass
        else:
            self.client = openai.OpenAI(api_key=self.api_key)

    def parse(self, pdf_path: str) -> List[Transaction]:
        if not hasattr(self, 'client'):
             raise ValueError("OpenAI API key is required for OpenAIParser. Set OPENAI_API_KEY env var.")

        text_content = ""
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    text_content += text + "\n"
        
        if not text_content.strip():
            raise ValueError("No text content extracted from PDF. It might be an image-based PDF.")

        # Construct prompt
        prompt = f"""
        Extract all bank transactions from the following bank statement text.
        Return the result as a JSON object with a key "transactions" which is a list of objects.
        Each transaction object must have:
        - "date": string (YYYY-MM-DD format)
        - "description": string
        - "amount": number (negative for expenses/withdrawals, positive for income/deposits). 
          Note: "Cr" usually means Credit (Deposit/Income) and "Dr" or no suffix usually means Debit (Expense/Withdrawal).
          Check the balance column if available to verify the sign of the amount.
        - "balance": number (optional, null if not found)
        - "category": string (infer a category based on description, e.g., "Groceries", "Utilities", "Transfer", "Income")

        Text content:
        {text_content[:20000]} 
        """

        try:
            model = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo-1106")
            # Fallback for non-standard model names in env
            if "4.1" in model: model = "gpt-4o-mini"

            response = self.client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that extracts structured data from bank statements. Output valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0
            )
            
            content = response.choices[0].message.content
            if not content:
                return []
            
            try:
                data = json.loads(content)
            except json.JSONDecodeError as e:
                print("Failed to parse JSON response from OpenAI.")
                print("Raw content snippet:", content[:500] + "..." if len(content) > 500 else content)
                # Try to find the last valid JSON closing
                if "}" in content:
                     # Very naive retry or just fail
                     pass
                raise e
            
            transactions_data = data.get("transactions", [])
            
            transactions = []
            for t in transactions_data:
                transactions.append(Transaction(
                    date=t.get("date", ""),
                    description=t.get("description", ""),
                    amount=float(t.get("amount", 0)),
                    balance=float(t.get("balance")) if t.get("balance") is not None else None,
                    category=t.get("category")
                ))
            return transactions

        except Exception as e:
            print(f"Error calling OpenAI: {e}")
            raise e

class ChaseParser(BankStatementParser):
    """
    Example of a specific parser for Chase bank statements.
    (This is a mock implementation to demonstrate structure)
    """
    def parse(self, pdf_path: str) -> List[Transaction]:
        # Specific logic for Chase PDFs would go here
        # For now, fallback to generic
        print("Using Chase parser (mock) - falling back to generic logic for demo")
        return GenericParser().parse(pdf_path)

def get_parser(bank_name: str) -> BankStatementParser:
    parsers = {
        'chase': ChaseParser(),
        'generic': GenericParser(),
        'openai': OpenAIParser()
    }
    return parsers.get(bank_name.lower(), GenericParser())

def main():
    load_dotenv()
    parser = argparse.ArgumentParser(description='Convert PDF Bank Statement to CSV/JSON')
    parser.add_argument('input_file', help='Path to the PDF bank statement')
    parser.add_argument('--format', choices=['csv', 'json'], default='csv', help='Output format')
    parser.add_argument('--bank', default='generic', help='Bank format to use (generic, chase, openai)')
    parser.add_argument('--output', help='Output file path')
    parser.add_argument('--api-key', help='OpenAI API Key (optional, can use env var)')

    args = parser.parse_args()

    if not os.path.exists(args.input_file):
        print(f"Error: File {args.input_file} not found.")
        sys.exit(1)

    print(f"Parsing {args.input_file} using {args.bank} parser...")
    
    if args.bank == 'openai':
        bank_parser = OpenAIParser(api_key=args.api_key)
    else:
        bank_parser = get_parser(args.bank)

    try:
        transactions = bank_parser.parse(args.input_file)
    except Exception as e:
        print(f"Error parsing PDF: {e}")
        sys.exit(1)

    if not transactions:
        print("No transactions found. The parser might not match the PDF format.")
        sys.exit(0)

    print(f"Found {len(transactions)} transactions.")

    # Convert to DataFrame for easy export
    df = pd.DataFrame([asdict(t) for t in transactions])

    output_path = args.output
    if not output_path:
        base_name = os.path.splitext(args.input_file)[0]
        output_path = f"{base_name}.{args.format}"

    if args.format == 'csv':
        df.to_csv(output_path, index=False)
        print(f"Saved to {output_path}")
    elif args.format == 'json':
        df.to_json(output_path, orient='records', date_format='iso', indent=2)
        print(f"Saved to {output_path}")

if __name__ == "__main__":
    main()
