# Bank Statement Parser

This tool converts PDF bank statements into CSV or JSON formats. It uses a flexible parsing strategy to handle different layouts.

## Setup

1.  **Install Python**: Ensure you have Python 3.8+ installed.
2.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

## Usage

Run the script from the command line:

```bash
python parser.py <path_to_pdf> [options]
```

### Options

*   `input_file`: Path to the PDF file (required).
*   `--format`: Output format, either `csv` or `json` (default: `csv`).
*   `--bank`: Specify the bank format (e.g., `generic`, `chase`). Default is `generic`.
*   `--output`: Custom output file path. If not provided, it saves in the same directory as the input.

### Examples

**Convert to CSV (default):**
```bash
python parser.py my_statement.pdf
```

**Convert to JSON:**
```bash
python parser.py my_statement.pdf --format json
```

**Specify a Bank Format:**
```bash
python parser.py my_statement.pdf --bank chase
```

**Use OpenAI (AI-powered parsing):**
This is useful for complex or varied layouts. Requires an OpenAI API Key.

1.  Create a `.env` file in this directory:
    ```
    OPENAI_API_KEY=sk-...
    ```
2.  Run with `--bank openai`:
    ```bash
    python parser.py my_statement.pdf --bank openai
    ```
    Or pass the key directly:
    ```bash
    python parser.py my_statement.pdf --bank openai --api-key sk-...
    ```

## Extending

To add support for a new bank:

1.  Open `parser.py`.
2.  Create a new class inheriting from `BankStatementParser`.
3.  Implement the `parse` method with logic specific to that bank's PDF layout.
4.  Register the new parser in the `get_parser` function.
