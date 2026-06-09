import { Module } from './types';

export const module1Foundation: Module = {
  id: 'module-1-foundation',
  title: 'FastAPI Foundation',
  icon: '🚀',
  description:
    'Build a rock-solid foundation in FastAPI — from zero to deploying your first production-ready API endpoints. You will understand the request lifecycle, master path and query parameters, handle errors gracefully, and structure projects that scale.',
  topics: [
    // ──────────────────────────────────────────────
    // TOPIC 1: What is FastAPI & Why It Matters
    // ──────────────────────────────────────────────
    {
      id: 'm1-what-is-fastapi',
      title: 'What is FastAPI & Why It Matters',
      icon: '💡',
      introduction:
        'FastAPI is a modern, high-performance web framework for building APIs with Python 3.8+ based on standard Python type hints. It combines the speed of Starlette and the validation power of Pydantic into a developer experience that is unmatched in the Python ecosystem.',
      sections: [
        {
          heading: 'The Problem FastAPI Solves',
          content: `Before FastAPI, Python developers faced a painful trade-off: choose a framework that was fast but lacked developer-friendly features (like Flask), or choose one that was feature-rich but slow (like Django). You had to manually validate incoming data, write boilerplate for serialization, maintain separate API documentation, and pray your types stayed in sync with your runtime behavior.

FastAPI eliminates this trade-off entirely. It was created by Sebastián Ramírez in 2018 with a singular vision: **what if your type hints were not just documentation, but the actual runtime logic?** When you write \`name: str\`, FastAPI doesn't just read it — it validates the incoming request against it, generates OpenAPI documentation from it, and provides automatic IDE autocomplete for it.

This is not a small improvement. This is a paradigm shift. You write your code once, and FastAPI generates your documentation, validates your inputs, serializes your outputs, and provides interactive testing UIs — all from the same type annotations. The result is that you ship faster, with fewer bugs, and with better documentation than you'd ever write manually.`,
          visualization: {
            type: 'comparison',
            title: 'Traditional vs FastAPI Development',
            description: 'How FastAPI eliminates the validation-documentation-serialization trilemma',
            columns: [
              {
                title: 'Traditional (Flask/Django)',
                items: [
                  'Manual request validation',
                  'Hand-written API docs',
                  'Manual serialization',
                  'Type hints are decorative',
                  'No interactive testing UI',
                  'Runtime errors from bad data',
                ],
              },
              {
                title: 'FastAPI',
                items: [
                  'Automatic validation via Pydantic',
                  'Auto-generated OpenAPI docs',
                  'Automatic serialization',
                  'Type hints drive everything',
                  'Built-in Swagger UI & ReDoc',
                  '422 errors before your code runs',
                ],
              },
            ],
          },
          tips: [
            'FastAPI is built on top of Starlette (for the ASGI layer) and Pydantic (for data validation) — understanding these will make you a power user.',
            'FastAPI is the 3rd most starred Python framework on GitHub, surpassing Flask and Django in growth rate.',
            'The name "FastAPI" refers to fast development speed, not just fast execution — though it is one of the fastest Python frameworks available.',
          ],
          keyTakeaway:
            'FastAPI turns your type hints into runtime validation, documentation, and serialization — write once, get everything.',
        },
        {
          heading: 'How FastAPI Works Under the Hood',
          content: `FastAPI sits on top of two powerful libraries: **Starlette** and **Pydantic**. Starlette handles the ASGI (Asynchronous Server Gateway Interface) layer — routing, middleware, WebSocket support, and HTTP request/response handling. Pydantic handles all data validation and serialization using Python type hints.

When a request arrives, FastAPI's request lifecycle works like this: the ASGI server (like Uvicorn) receives the HTTP request and passes it to Starlette, which matches the URL against registered routes. Once matched, FastAPI takes over: it reads the function signature of your path operation function, extracts type hints, and uses Pydantic to validate and parse the incoming data (path parameters, query parameters, request body). If validation fails, FastAPI returns a detailed 422 error before your function code even executes. If validation succeeds, your function receives clean, typed Python objects.

This architecture means FastAPI can achieve performance comparable to NodeJS and Go frameworks while maintaining Python's readability. The async/await support means you can handle thousands of concurrent connections efficiently, making it suitable for microservices, real-time applications, and high-throughput APIs.`,
          visualization: {
            type: 'flow',
            title: 'FastAPI Request Lifecycle',
            description: 'How a request flows through FastAPI from arrival to response',
            steps: [
              { label: 'Client sends HTTP request', detail: 'HTTP request arrives at Uvicorn ASGI server', highlight: false },
              { label: 'Starlette routes the request', detail: 'URL pattern matching against registered routes', highlight: false },
              { label: 'FastAPI reads function signature', detail: 'Extracts type hints from path operation function', highlight: true },
              { label: 'Pydantic validates & parses', detail: 'Path params, query params, request body validated against types', highlight: true },
              { label: 'Validation fails? → 422 Error', detail: 'Detailed error JSON returned, your code never runs', highlight: false },
              { label: 'Validation passes → Your function', detail: 'Receives clean, typed Python objects', highlight: true },
              { label: 'Response serialization', detail: 'Return value validated & serialized via response_model', highlight: false },
              { label: 'HTTP response sent to client', detail: 'JSON response with proper status code and headers', highlight: false },
            ],
          },
          codeExamples: [
            {
              title: 'A Minimal FastAPI Application',
              description: 'The simplest possible FastAPI app that demonstrates the framework\'s power',
              code: `from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello, World!"}

# Run with: uvicorn main:app --reload
# Visit http://127.0.0.1:8000/docs for interactive API docs`,
              language: 'python',
              output: `# Response when visiting /
{"message": "Hello, World!"}

# Visit /docs → Interactive Swagger UI
# Visit /redoc → Beautiful ReDoc documentation`,
            },
            {
              title: 'FastAPI with Type Hints Driving Everything',
              description: 'See how type hints automatically create validation, docs, and serialization',
              code: `from fastapi import FastAPI

app = FastAPI(title="My API", version="1.0.0")

@app.get("/items/{item_id}")
def get_item(item_id: int, q: str | None = None):
    """
    Retrieve an item by its ID.
    - item_id is validated as an integer automatically
    - q is an optional query parameter
    """
    result = {"item_id": item_id}
    if q:
        result["q"] = q
    return result

# What happens automatically:
# 1. item_id MUST be an integer → 422 if not
# 2. /docs shows the parameter types and descriptions
# 3. Response shape is documented in OpenAPI schema`,
              language: 'python',
              output: `# GET /items/42
{"item_id": 42}

# GET /items/42?q=search
{"item_id": 42, "q": "search"}

# GET /items/not-a-number
{
  "detail": [
    {
      "type": "int_parsing",
      "loc": ["path", "item_id"],
      "msg": "Input should be a valid integer",
      "input": "not-a-number"
    }
  ]
}`,
            },
          ],
          tips: [
            'The /docs endpoint (Swagger UI) and /redoc endpoint are available automatically — no configuration needed.',
            'FastAPI generates a full OpenAPI 3.1 schema at /openapi.json that you can use with any API tooling.',
            'Every type hint in your path operation function has a specific role: path params, query params, or request body.',
          ],
          keyTakeaway:
            'FastAPI is Starlette (ASGI) + Pydantic (validation) — type hints are the bridge that makes everything automatic.',
        },
        {
          heading: 'Performance Benchmarks & Real-World Adoption',
          content: `FastAPI is one of the fastest Python frameworks available, consistently ranking near the top in independent benchmarks. In the TechEmpower Framework Benchmarks, FastAPI performs comparably to Starlette (since it's built on it) and significantly outperforms Flask and Django. But raw throughput isn't the whole story — the real performance gain comes from developer productivity.

Because FastAPI eliminates boilerplate, auto-generates documentation, and catches errors at the validation layer (before your business logic runs), you spend less time writing, debugging, and documenting code. Teams report 200-300% productivity improvements when migrating from Flask or Django REST Framework.

Real-world adoption is massive: Microsoft uses FastAPI for internal tools, Uber uses it for some microservices, Netflix has adopted it for crisis management tools, and thousands of startups use it as their primary API framework. The Python community has embraced it because it finally delivers on the promise of "Python for APIs" without the performance penalty.`,
          codeExamples: [
            {
              title: 'Performance Comparison',
              description: 'Relative throughput comparison of Python web frameworks',
              code: `# Approximate requests/second (higher is better)
# Benchmark: JSON serialization, single-core

Framework          | RPS        | Relative
-------------------|------------|----------
FastAPI (async)    | ~15,000    | 1.0x
Starlette (async)  | ~16,500    | 1.1x
Flask              | ~1,200     | 0.08x
Django             | ~800       | 0.05x
Express.js (Node)  | ~14,000    | 0.93x
Go (net/http)      | ~47,000    | 3.1x

# Key insight: FastAPI is ~12x faster than Flask
# while providing far more features out of the box.`,
              language: 'text',
            },
          ],
          visualization: {
            type: 'architecture',
            title: 'FastAPI Ecosystem Stack',
            description: 'The layers that power a FastAPI application',
            layers: [
              { label: 'Your Application', items: ['Path Operations', 'Dependencies', 'Middleware'] },
              { label: 'FastAPI Framework', items: ['Type-driven routing', 'Auto-docs (Swagger/ReDoc)', 'Dependency Injection'] },
              { label: 'Pydantic V2', items: ['Data Validation', 'Serialization', 'Settings Management', 'Schema Generation'] },
              { label: 'Starlette', items: ['ASGI Routing', 'Middleware', 'WebSocket', 'HTTP Utilities'] },
              { label: 'ASGI Server', items: ['Uvicorn', 'Hypercorn', 'Daphne'] },
            ],
          },
          tips: [
            'For maximum performance, use async path operations and an async database driver like asyncpg or SQLAlchemy async.',
            'FastAPI\'s performance is tied to Uvicorn — use uvicorn with --workers to utilize multiple CPU cores.',
            'Don\'t prematurely optimize — FastAPI is fast enough for 99% of use cases out of the box.',
          ],
          keyTakeaway:
            'FastAPI delivers Flask-like simplicity with near-NodeJS performance — the best of both worlds for Python API development.',
        },
      ],
    },

    // ──────────────────────────────────────────────
    // TOPIC 2: Installation & Development Environment Setup
    // ──────────────────────────────────────────────
    {
      id: 'm1-installation-setup',
      title: 'Installation & Development Environment Setup',
      icon: '🔧',
      introduction:
        'Setting up your FastAPI development environment correctly from the start saves hours of debugging later. This topic walks you through creating an isolated Python environment, installing FastAPI with its dependencies, and configuring your development workflow for maximum productivity.',
      sections: [
        {
          heading: 'Creating Your Python Environment',
          content: `Python projects should ALWAYS use virtual environments. A virtual environment isolates your project's dependencies from the system Python and from other projects. Without it, you risk version conflicts (Project A needs FastAPI 0.100, Project B needs FastAPI 0.104) and system package corruption.

The modern Python approach uses \`python -m venv\` to create environments. This is built into Python 3.3+ and requires no external tools. For dependency management, we recommend \`pip\` with requirements files for beginners, and tools like \`poetry\` or \`uv\` for more advanced workflows.

The key principle is: **every project gets its own virtual environment, its own dependency list, and its own reproducible setup**. When you deploy to production, you want the exact same packages installed there as in development. This is why we pin versions in requirements.txt.`,
          codeExamples: [
            {
              title: 'Creating a Virtual Environment & Installing FastAPI',
              description: 'Step-by-step setup from scratch',
              code: `# 1. Create project directory
mkdir my-fastapi-project && cd my-fastapi-project

# 2. Create virtual environment
python3 -m venv .venv

# 3. Activate the virtual environment
# On macOS/Linux:
source .venv/bin/activate
# On Windows:
# .venv\\Scripts\\activate

# 4. Install FastAPI with all standard dependencies
pip install "fastapi[standard]"

# The [standard] extra installs:
# - uvicorn: ASGI server to run your app
# - httpx: For testing with TestClient
# - pydantic-settings: For settings/configuration management
# - jinja2: For HTML template rendering
# - python-multipart: For form data handling`,
              language: 'bash',
            },
            {
              title: 'requirements.txt — Pinning Dependencies',
              description: 'Always pin your dependencies for reproducible builds',
              code: `# requirements.txt
fastapi==0.115.0
uvicorn[standard]==0.30.0
pydantic==2.9.0
pydantic-settings==2.5.0
httpx==0.27.0
python-multipart==0.0.9

# Install everything:
pip install -r requirements.txt

# Freeze current environment:
pip freeze > requirements.txt`,
              language: 'text',
            },
          ],
          tips: [
            'Always activate your virtual environment before running your app — if you see (.venv) in your prompt, you\'re good.',
            'Use pip freeze > requirements.txt to capture exact versions for reproducible deployments.',
            'Consider using uv (pip install uv) for 10-100x faster package installation.',
          ],
          keyTakeaway:
            'Virtual environments are non-negotiable — every FastAPI project needs an isolated, version-pinned environment.',
        },
        {
          heading: 'Running Your Development Server',
          content: `FastAPI applications need an ASGI server to run. The most popular choice is **Uvicorn**, a lightning-fast ASGI server built on uvloop and httptools. Uvicorn handles the low-level HTTP protocol, decodes requests, and passes them to FastAPI for processing.

During development, you want two features: **auto-reload** (restart the server when code changes) and **detailed error pages** (see stack traces in the browser). Uvicorn provides both with the \`--reload\` flag. This watches your Python files for changes and automatically restarts the server.

The command \`uvicorn main:app --reload\` means: "Run the \`app\` object found in \`main.py\` using Uvicorn, and reload when files change." The \`app\` object is your FastAPI instance. If you named it differently (like \`application\` or \`api\`), adjust the command accordingly.

For production, you'll remove --reload and add --workers to use multiple CPU cores. But during development, --reload is essential for fast iteration.`,
          codeExamples: [
            {
              title: 'Starting the Development Server',
              description: 'Different ways to run your FastAPI app during development',
              code: `# Method 1: Command line (most common)
uvicorn main:app --reload

# Method 2: With additional options
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Method 3: Programmatic (inside your Python file)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

# Method 4: Using FastAPI CLI (FastAPI 0.100+)
fastapi dev main.py`,
              language: 'bash',
              output: `# Uvicorn output on startup:
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [12345] using WatchFiles
INFO:     Started server process [12346]
INFO:     Waiting for application startup.
INFO:     Application startup complete.

# After a code change:
INFO:     Detected file change, reloading...
INFO:     Started server process [12350]
INFO:     Waiting for application startup.
INFO:     Application startup complete.`,
            },
          ],
          visualization: {
            type: 'flow',
            title: 'Development Server Lifecycle',
            description: 'What happens when you run uvicorn with --reload',
            steps: [
              { label: 'uvicorn main:app --reload', detail: 'ASGI server starts, loads your FastAPI app', highlight: true },
              { label: 'File watcher initialized', detail: 'WatchFiles monitors your project directory for changes' },
              { label: 'Server ready on :8000', detail: 'Application startup complete, ready for requests' },
              { label: 'Code change detected', detail: 'A .py file is saved', highlight: true },
              { label: 'Graceful shutdown', detail: 'Current requests complete, then server stops' },
              { label: 'Server restarts', detail: 'New process loads updated code', highlight: true },
              { label: 'Ready again', detail: 'Back to accepting requests with new code' },
            ],
          },
          tips: [
            'Use --host 0.0.0.0 to make your server accessible from other devices on the same network.',
            'The fastapi dev command (FastAPI CLI) automatically enables --reload and shows enhanced error messages.',
            'If auto-reload isn\'t working, check that your virtual environment has watchfiles installed (included with uvicorn[standard]).',
          ],
          keyTakeaway:
            'Always use --reload during development for instant feedback — it watches your files and restarts automatically.',
        },
        {
          heading: 'Essential Development Tools',
          content: `Beyond the core FastAPI installation, several tools will dramatically improve your development experience. **HTTPie** or **curl** for quick API testing from the terminal, **httpx** for writing programmatic tests, and a good IDE configuration for type checking and auto-completion.

For IDE setup, VS Code with the Python extension and Pylance provides the best FastAPI development experience. Pylance understands FastAPI's type-driven architecture and provides intelligent autocomplete for path parameters, query parameters, and request body fields based on your type hints.

Testing is crucial from day one. FastAPI provides a \`TestClient\` built on httpx that lets you test your API without actually starting a server. This is incredibly fast and integrates seamlessly with pytest. The TestClient handles ASGI communication internally, so your tests run in milliseconds rather than seconds.`,
          codeExamples: [
            {
              title: 'Testing with TestClient',
              description: 'Write fast, reliable API tests without starting a real server',
              code: `# test_main.py
from fastapi.testclient import TestClient
from main import app  # Import your FastAPI app

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello, World!"}

def test_get_item():
    response = client.get("/items/42")
    assert response.status_code == 200
    assert response.json() == {"item_id": 42}

def test_item_id_must_be_integer():
    response = client.get("/items/not-a-number")
    assert response.status_code == 422  # Validation error

# Run tests with: pytest test_main.py -v`,
              language: 'python',
            },
            {
              title: 'VS Code Configuration for FastAPI',
              description: 'Optimal settings.json for FastAPI development',
              code: `// .vscode/settings.json
{
  "python.defaultInterpreterPath": "\${workspaceFolder}/.venv/bin/python",
  "python.analysis.typeCheckingMode": "basic",
  "python.analysis.autoImportCompletions": true,
  "python.linting.enabled": true,
  "python.linting.pyrightEnabled": true,
  "editor.formatOnSave": true,
  "[python]": {
    "editor.defaultFormatter": "charliermarsh.ruff"
  }
}`,
              language: 'json',
            },
          ],
          tips: [
            'Install httpie (pip install httpie) for beautiful terminal API testing: http GET localhost:8000/items/42',
            'Use pytest with the -x flag to stop on first failure and -s to see print statements during tests.',
            'Configure your IDE to use the virtual environment Python — this enables proper autocomplete and type checking.',
          ],
          keyTakeaway:
            'TestClient + pytest gives you sub-millisecond API testing without starting a real server — test from day one.',
        },
      ],
    },

    // ──────────────────────────────────────────────
    // TOPIC 3: Your First API Endpoint
    // ──────────────────────────────────────────────
    {
      id: 'm1-first-endpoint',
      title: 'Your First API Endpoint',
      icon: '🎯',
      introduction:
        'Writing your first API endpoint is a rite of passage. In this topic, you\'ll go beyond the "Hello World" example to understand exactly what happens when you define a path operation, how FastAPI processes it, and why the decorator pattern makes everything click together.',
      sections: [
        {
          heading: 'Anatomy of a Path Operation',
          content: `Every FastAPI endpoint is built from three components: a **decorator** that defines the HTTP method and path, a **function** that contains your business logic, and **type hints** that drive validation and documentation. Together, these form what FastAPI calls a "path operation."

The decorator \`@app.get("/")\` tells FastAPI three things: (1) this function handles GET requests, (2) it responds to the root path "/", and (3) the function below should be called when a request matches. FastAPI supports all standard HTTP methods: GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD, and TRACE.

The function name is important — FastAPI uses it to generate the operation ID in the OpenAPI schema, which affects code generation and API documentation. Choose descriptive names like \`list_users\`, \`create_order\`, or \`delete_comment\` rather than generic names like \`handler\` or \`process\`.

The return value is automatically serialized to JSON. You can return dicts, lists, Pydantic models, or even plain strings. FastAPI uses Python's \`jsonable_encoder\` internally to convert complex types into JSON-serializable formats.`,
          codeExamples: [
            {
              title: 'Complete Path Operation Anatomy',
              description: 'Breaking down every part of a FastAPI endpoint',
              code: `from fastapi import FastAPI

app = FastAPI()

@app.get("/greet/{name}")    # ← Decorator: HTTP method + path
async def greet_user(name: str):   # ← Function + type hints
    """Greet a user by name."""      # ← Docstring (shows in /docs)
    return {                          # ← Response (auto-serialized)
        "greeting": f"Hello, {name}!",
        "length": len(name)
    }

# Anatomy breakdown:
# @app.get         → HTTP method decorator
# "/greet/{name}"  → URL path with path parameter
# async def        → Async function (can also be sync)
# name: str        → Type hint = validation + docs
# return dict      → Auto-serialized to JSON`,
              language: 'python',
            },
            {
              title: 'Sync vs Async Endpoints',
              description: 'FastAPI supports both synchronous and asynchronous path operations',
              code: `from fastapi import FastAPI
import time

app = FastAPI()

# Sync endpoint — use for CPU-bound or simple operations
@app.get("/sync")
def sync_endpoint():
    return {"type": "synchronous"}

# Async endpoint — use for I/O-bound operations (database, HTTP calls)
@app.get("/async")
async def async_endpoint():
    return {"type": "asynchronous"}

# KEY RULE: If you use async, NEVER call blocking I/O inside it
# ❌ BAD: time.sleep(), requests.get(), synchronous DB calls
# ✅ GOOD: await asyncio.sleep(), httpx.AsyncClient(), async DB calls

# If you must use blocking code, use sync def (not async def)
@app.get("/blocking")
def blocking_endpoint():
    time.sleep(1)  # This is fine in sync def
    return {"slept": "1 second"}`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'flow',
            title: 'Path Operation Registration & Execution',
            description: 'How FastAPI registers your endpoint and handles incoming requests',
            steps: [
              { label: 'App startup', detail: 'FastAPI scans all decorated functions and registers routes', highlight: true },
              { label: 'OpenAPI schema generated', detail: 'Path, method, parameters, and response documented', highlight: false },
              { label: 'Request arrives at /greet/Alice', detail: 'GET request hits the server' },
              { label: 'Route matching', detail: 'FastAPI finds the @app.get("/greet/{name}") handler', highlight: true },
              { label: 'Parameter extraction', detail: 'name="Alice" extracted and validated as str' },
              { label: 'Function execution', detail: 'greet_user(name="Alice") runs' },
              { label: 'Response serialization', detail: 'Return dict converted to JSON' },
              { label: 'HTTP response sent', detail: '{"greeting": "Hello, Alice!", "length": 5}', highlight: false },
            ],
          },
          tips: [
            'Use async def for I/O-bound operations (database queries, HTTP requests) and sync def for CPU-bound operations.',
            'Never call blocking code (like requests.get or time.sleep) inside an async def — it blocks the entire event loop.',
            'Name your functions descriptively — they become the operationId in OpenAPI and affect generated client code.',
          ],
          keyTakeaway:
            'A path operation = decorator (method + path) + function (logic) + type hints (validation) — all three work together.',
        },
        {
          heading: 'Building a Real-World-Like First API',
          content: `Let's build something more realistic than "Hello World." We'll create a simple book API that supports listing books and adding new ones. This introduces you to in-memory data storage, request bodies, and multiple endpoints on the same app — the foundation of every real API.

In a production application, you'd use a database instead of an in-memory list. But starting with in-memory data lets you focus on FastAPI's request handling without database complexity. The pattern is the same: receive a request, validate it, process it, and return a response.

Notice how we use a Python list as our "database." Each book is a dictionary. When a POST request comes in, FastAPI validates the request body against our type hints, and if valid, we append the book to our list. The GET endpoint returns the entire list. This is the simplest possible CRUD pattern.`,
          codeExamples: [
            {
              title: 'A Simple Book API',
              description: 'Multiple endpoints with GET and POST, in-memory storage',
              code: `from fastapi import FastAPI
from typing import Optional

app = FastAPI(title="Book API", version="1.0.0")

# In-memory "database"
books_db: list[dict] = [
    {"id": 1, "title": "1984", "author": "George Orwell", "year": 1949},
    {"id": 2, "title": "Dune", "author": "Frank Herbert", "year": 1965},
]
next_id = 3

@app.get("/books")
def list_books(author: Optional[str] = None):
    """List all books, optionally filter by author."""
    if author:
        return [b for b in books_db if b["author"].lower() == author.lower()]
    return books_db

@app.get("/books/{book_id}")
def get_book(book_id: int):
    """Get a specific book by ID."""
    for book in books_db:
        if book["id"] == book_id:
            return book
    return {"error": "Book not found"}  # We'll improve this with HTTPException later

@app.post("/books")
def create_book(title: str, author: str, year: int):
    """Add a new book to the collection."""
    global next_id
    new_book = {"id": next_id, "title": title, "author": author, "year": year}
    books_db.append(new_book)
    next_id += 1
    return new_book`,
              language: 'python',
              output: `# GET /books
[
  {"id": 1, "title": "1984", "author": "George Orwell", "year": 1949},
  {"id": 2, "title": "Dune", "author": "Frank Herbert", "year": 1965}
]

# GET /books?author=George+Orwell
[{"id": 1, "title": "1984", "author": "George Orwell", "year": 1949}]

# POST /books?title=Brave+New+World&author=Aldous+Huxley&year=1932
{"id": 3, "title": "Brave New World", "author": "Aldous Huxley", "year": 1932}`,
            },
          ],
          tips: [
            'In-memory data resets when the server restarts — this is fine for learning, but use a database for production.',
            'Start with in-memory data to focus on FastAPI concepts, then add a database layer later.',
            'The Optional[str] = None pattern makes query parameters optional — required parameters have no default value.',
          ],
          keyTakeaway:
            'Build incrementally: start with in-memory storage, master the request/response cycle, then add persistence.',
        },
      ],
    },

    // ──────────────────────────────────────────────
    // TOPIC 4: Path Operations: GET, POST, PUT, PATCH, DELETE
    // ──────────────────────────────────────────────
    {
      id: 'm1-http-methods',
      title: 'Path Operations: GET, POST, PUT, PATCH, DELETE',
      icon: '📋',
      introduction:
        'HTTP methods define the action a client wants to perform on a resource. Understanding when and how to use each method is fundamental to building RESTful APIs. This topic covers the five most important methods, their semantics, and how FastAPI handles each one.',
      sections: [
        {
          heading: 'Understanding HTTP Methods & REST Semantics',
          content: `HTTP methods are verbs that tell the server what action to perform. Each method has specific semantics defined by the HTTP specification (RFC 9110). Following these semantics isn't just good practice — it's what makes your API predictable, cacheable, and interoperable with the vast ecosystem of HTTP tools.

**GET** retrieves a representation of a resource. It must be safe (no side effects) and idempotent (multiple identical requests produce the same result). Never use GET to modify data. **POST** creates a new resource or triggers a processing action. It's neither safe nor idempotent — each POST may create a new resource. **PUT** replaces a resource entirely at a known URL. It's idempotent — sending the same PUT twice results in the same state. **PATCH** partially updates a resource — only the fields you send are modified. **DELETE** removes a resource. It's idempotent — deleting the same resource twice should result in the same state (the resource is gone).

When clients use your API, they expect these semantics. If your GET endpoint modifies data, or your DELETE endpoint creates data, you break the contract that every HTTP tool, proxy, and cache relies on.`,
          visualization: {
            type: 'comparison',
            title: 'HTTP Methods at a Glance',
            description: 'Key properties of each HTTP method',
            columns: [
              {
                title: 'Method',
                items: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
              },
              {
                title: 'Safe?',
                items: ['✅ Yes', '❌ No', '❌ No', '❌ No', '❌ No'],
              },
              {
                title: 'Idempotent?',
                items: ['✅ Yes', '❌ No', '✅ Yes', '❌ No*', '✅ Yes'],
              },
              {
                title: 'Purpose',
                items: ['Read data', 'Create new', 'Replace entire', 'Partial update', 'Remove resource'],
              },
              {
                title: 'Has Body?',
                items: ['Usually no', '✅ Yes', '✅ Yes', '✅ Yes', 'Optional'],
              },
            ],
          },
          tips: [
            'Safe = no side effects on the server. Idempotent = same request repeated = same result.',
            'PATCH is technically not idempotent by spec, but in practice most implementations make it idempotent.',
            'PUT requires the client to send the COMPLETE resource — missing fields are set to null/defaults.',
          ],
          keyTakeaway:
            'HTTP methods are a contract — GET reads, POST creates, PUT replaces, PATCH updates partially, DELETE removes.',
        },
        {
          heading: 'Implementing Full CRUD Operations',
          content: `CRUD (Create, Read, Update, Delete) maps directly to HTTP methods: POST creates, GET reads, PUT/PATCH updates, DELETE removes. Let's build a complete CRUD API for managing tasks. This is the pattern you'll use in virtually every API you build.

The key design decisions are: (1) URL structure follows the resource pattern — \`/tasks\` for the collection, \`/tasks/{id}\` for a specific task, (2) HTTP methods map to operations — GET for reading, POST for creating, PUT for full replacement, PATCH for partial updates, DELETE for removal, and (3) status codes communicate the result — 201 for creation, 200 for success, 404 for not found, 204 for successful deletion with no body.

Notice how we use proper HTTP status codes with the \`status_code\` parameter and \`Response\` object. This isn't just convention — status codes are how HTTP clients (browsers, mobile apps, other APIs) understand the result of their request without parsing the response body.`,
          codeExamples: [
            {
              title: 'Complete CRUD Task API',
              description: 'Full implementation of all five HTTP methods',
              code: `from fastapi import FastAPI, HTTPException, status, Response
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="Task Manager API")

class Task(BaseModel):
    title: str
    description: Optional[str] = None
    completed: bool = False

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None

tasks_db: dict[int, dict] = {}
next_id = 1

# ── CREATE ──────────────────────────────────────
@app.post("/tasks", status_code=status.HTTP_201_CREATED)
def create_task(task: Task):
    global next_id
    task_dict = task.model_dump()
    task_dict["id"] = next_id
    tasks_db[next_id] = task_dict
    next_id += 1
    return task_dict

# ── READ (all) ─────────────────────────────────
@app.get("/tasks")
def list_tasks(completed: Optional[bool] = None):
    results = list(tasks_db.values())
    if completed is not None:
        results = [t for t in results if t["completed"] == completed]
    return results

# ── READ (one) ─────────────────────────────────
@app.get("/tasks/{task_id}")
def get_task(task_id: int):
    if task_id not in tasks_db:
        raise HTTPException(status_code=404, detail="Task not found")
    return tasks_db[task_id]

# ── UPDATE (full replacement) ──────────────────
@app.put("/tasks/{task_id}")
def replace_task(task_id: int, task: Task):
    if task_id not in tasks_db:
        raise HTTPException(status_code=404, detail="Task not found")
    task_dict = task.model_dump()
    task_dict["id"] = task_id
    tasks_db[task_id] = task_dict
    return task_dict

# ── UPDATE (partial) ───────────────────────────
@app.patch("/tasks/{task_id}")
def update_task(task_id: int, task_update: TaskUpdate):
    if task_id not in tasks_db:
        raise HTTPException(status_code=404, detail="Task not found")
    existing = tasks_db[task_id]
    update_data = task_update.model_dump(exclude_unset=True)
    existing.update(update_data)
    return existing

# ── DELETE ─────────────────────────────────────
@app.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, response: Response):
    if task_id not in tasks_db:
        raise HTTPException(status_code=404, detail="Task not found")
    del tasks_db[task_id]
    return None  # 204 = No Content`,
              language: 'python',
            },
          ],
          tips: [
            'Use status.HTTP_201_CREATED for POST endpoints that create resources — it\'s the standard HTTP convention.',
            'PATCH with model_dump(exclude_unset=True) only updates fields the client actually sent — not fields that default to None.',
            'Return 204 No Content for DELETE — the resource is gone, there\'s nothing to return in the body.',
          ],
          keyTakeaway:
            'CRUD maps to HTTP methods: POST=create, GET=read, PUT=replace, PATCH=update, DELETE=remove — with proper status codes.',
        },
        {
          heading: 'PUT vs PATCH: The Critical Difference',
          content: `The difference between PUT and PATCH is one of the most misunderstood aspects of REST APIs. **PUT replaces the entire resource** — you must send every field, and any missing fields are set to their defaults (usually null). **PATCH partially updates the resource** — only the fields you include in the request are modified; everything else stays unchanged.

Consider a user profile with name, email, and bio. If you use PUT to update just the bio, you must also send name and email, otherwise they'll be overwritten with null. With PATCH, you only send the bio field, and name and email remain unchanged.

The practical implication is significant: for PATCH, your Pydantic model should have all optional fields (so the client can send only what they want to change), and you should use \`model_dump(exclude_unset=True)\` to get only the fields that were actually sent in the request. This prevents accidentally overwriting fields with None when the client simply didn't include them.`,
          codeExamples: [
            {
              title: 'PUT vs PATCH Behavior Comparison',
              description: 'See how the same data behaves differently with PUT and PATCH',
              code: `# Existing resource:
# {"id": 1, "title": "Learn FastAPI", "description": "Study hard", "completed": false}

# ── PUT Request (Full Replacement) ─────────────
# Client sends ONLY the title:
PUT /tasks/1
{"title": "Master FastAPI"}

# Result: Other fields are LOST
# {"id": 1, "title": "Master FastAPI", "description": null, "completed": false}
# ⚠️ description was wiped out!

# ── PATCH Request (Partial Update) ─────────────
# Client sends ONLY the title:
PATCH /tasks/1
{"title": "Master FastAPI"}

# Result: Only title changes, everything else preserved
# {"id": 1, "title": "Master FastAPI", "description": "Study hard", "completed": false}
# ✅ description is preserved!`,
              language: 'python',
            },
            {
              title: 'Proper PATCH Implementation with exclude_unset',
              description: 'The key to correct partial updates',
              code: `from pydantic import BaseModel
from typing import Optional

# PUT model — all fields required (client must send everything)
class TaskPut(BaseModel):
    title: str
    description: str
    completed: bool

# PATCH model — all fields optional (client sends only what changes)
class TaskPatch(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None

@app.patch("/tasks/{task_id}")
def patch_task(task_id: int, update: TaskPatch):
    if task_id not in tasks_db:
        raise HTTPException(status_code=404, detail="Not found")

    existing = tasks_db[task_id]

    # ❌ BAD: model_dump() includes ALL fields, even None
    # existing.update(update.model_dump())
    # This would set fields to None even if the client didn't send them!

    # ✅ GOOD: model_dump(exclude_unset=True) only includes fields the client sent
    update_data = update.model_dump(exclude_unset=True)
    existing.update(update_data)

    return existing

# If client sends {"completed": true}:
# model_dump() → {"title": None, "description": None, "completed": True}
# model_dump(exclude_unset=True) → {"completed": True}  ← CORRECT!`,
              language: 'python',
            },
          ],
          tips: [
            'Always use model_dump(exclude_unset=True) for PATCH operations — model_dump() would overwrite unset fields with None.',
            'Create separate Pydantic models for PUT (all required) and PATCH (all optional) — don\'t try to use one model for both.',
            'Some APIs skip PATCH entirely and use PUT with partial data — this works but violates REST semantics.',
          ],
          keyTakeaway:
            'PUT replaces everything; PATCH updates only what you send — use exclude_unset=True to make PATCH work correctly.',
        },
      ],
    },

    // ──────────────────────────────────────────────
    // TOPIC 5: Path Parameters & Query Parameters
    // ──────────────────────────────────────────────
    {
      id: 'm1-parameters',
      title: 'Path Parameters & Query Parameters',
      icon: '🔍',
      introduction:
        'Parameters are how clients send data to your API through the URL. Path parameters identify specific resources (/users/42), while query parameters filter and modify responses (/users?role=admin&active=true). Mastering both is essential for building intuitive, RESTful APIs.',
      sections: [
        {
          heading: 'Path Parameters: Identifying Resources',
          content: `Path parameters are variable parts of the URL path, enclosed in curly braces like \`{item_id}\`. They're used to identify specific resources — think of them as the "noun" in your URL sentence. The URL \`/users/42/posts/7\` has two path parameters: \`user_id=42\` and \`post_id=7\`.

FastAPI extracts path parameters from the URL and passes them to your function as keyword arguments. The type hint on the parameter tells FastAPI how to validate and convert the value. If you declare \`item_id: int\`, FastAPI will attempt to convert the string from the URL to an integer. If the conversion fails, the client gets a clear 422 validation error.

Path parameters are always required — they're part of the URL structure. You can't have an optional path parameter. If a value is optional, it should be a query parameter instead. You can also add validation constraints to path parameters using FastAPI's \`Path\` object, which lets you set minimum/maximum values, regex patterns, and descriptive metadata for the API docs.`,
          codeExamples: [
            {
              title: 'Path Parameters with Validation',
              description: 'Using Path() for validation, constraints, and documentation',
              code: `from fastapi import FastAPI, Path
from typing import Annotated

app = FastAPI()

@app.get("/items/{item_id}")
def get_item(
    item_id: Annotated[int, Path(
        title="The ID of the item",
        description="A positive integer identifying the item",
        gt=0,          # Must be greater than 0
        le=1000000,    # Must be less than or equal to 1,000,000
    )]
):
    return {"item_id": item_id}

# Multiple path parameters
@app.get("/users/{user_id}/posts/{post_id}")
def get_user_post(
    user_id: Annotated[int, Path(gt=0, description="User ID")],
    post_id: Annotated[int, Path(gt=0, description="Post ID")],
):
    return {"user_id": user_id, "post_id": post_id}`,
              language: 'python',
              output: `# GET /items/42
{"item_id": 42}

# GET /items/0 → 422 (gt=0 means must be > 0)
# GET /items/-5 → 422 (must be > 0)
# GET /items/abc → 422 (not a valid integer)`,
            },
            {
              title: 'Path Parameter with String Constraints',
              description: 'Validating string path parameters with regex and length constraints',
              code: `from fastapi import FastAPI, Path
from typing import Annotated

app = FastAPI()

# String path parameter with length constraints
@app.get("/categories/{category_slug}")
def get_category(
    category_slug: Annotated[str, Path(
        min_length=2,
        max_length=50,
        pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$",  # slug format
        description="Category slug (lowercase, hyphens allowed)",
    )]
):
    return {"category": category_slug}

# Enum for fixed set of values
from enum import Enum

class ModelName(str, Enum):
    alexnet = "alexnet"
    resnet = "resnet"
    lenet = "lenet"

@app.get("/models/{model_name}")
def get_model(model_name: ModelName):
    return {"model_name": model_name, "message": f"Selected {model_name.value}"}`,
              language: 'python',
            },
          ],
          tips: [
            'Use Annotated[type, Path(...)] for path parameter validation — it keeps your function signature clean and readable.',
            'Path parameters are always strings in the URL — type hints (int, float, etc.) tell FastAPI to convert and validate them.',
            'Use Enum for path parameters that should only accept a fixed set of values — FastAPI shows a dropdown in /docs.',
          ],
          keyTakeaway:
            'Path parameters identify resources in the URL — validate them with Path() and type hints for safety and documentation.',
        },
        {
          heading: 'Query Parameters: Filtering & Modifying Responses',
          content: `Query parameters appear after the question mark in a URL: \`/items?skip=0&limit=10&sort=name\`. They're used for filtering, sorting, pagination, and any optional modifiers. Unlike path parameters, query parameters can be optional and can have default values.

In FastAPI, any function parameter that is NOT a path parameter and NOT declared as a body parameter is automatically treated as a query parameter. If the parameter has a default value, it's optional. If it has no default value, it's required. This elegant convention means you rarely need to explicitly declare something as a query parameter.

FastAPI's \`Query\` object provides validation and metadata for query parameters, similar to \`Path\` for path parameters. You can set default values, minimum/maximum values for numbers, length constraints for strings, and aliases (useful when the Python parameter name can't match the query string name, like \`q\` for a search query).`,
          codeExamples: [
            {
              title: 'Query Parameters with Validation',
              description: 'Pagination, filtering, and search using query parameters',
              code: `from fastapi import FastAPI, Query
from typing import Annotated, Optional

app = FastAPI()

@app.get("/items")
def list_items(
    q: Annotated[Optional[str], Query(
        max_length=50,
        min_length=1,
        description="Search query string",
    )] = None,
    skip: Annotated[int, Query(ge=0, description="Number of items to skip")] = 0,
    limit: Annotated[int, Query(ge=1, le=100, description="Max items to return")] = 10,
    sort_by: Annotated[str, Query(
        pattern=r"^(name|price|created_at)$",
        description="Field to sort by",
    )] = "name",
):
    return {
        "q": q,
        "skip": skip,
        "limit": limit,
        "sort_by": sort_by,
    }

# GET /items?skip=20&limit=5&sort_by=price&q=widget
# → {"q": "widget", "skip": 20, "limit": 5, "sort_by": "price"}`,
              language: 'python',
            },
            {
              title: 'Advanced Query Parameter Features',
              description: 'Aliases, deprecated parameters, and multiple values',
              code: `from fastapi import FastAPI, Query
from typing import Annotated, Optional

app = FastAPI()

# Alias: Python name differs from query string name
@app.get("/search")
def search(
    query: Annotated[Optional[str], Query(alias="q")] = None,
):
    return {"query": query}
# Use: /search?q=fastapi  (not /search?query=fastapi)

# Deprecated parameter: still works but marked as deprecated in docs
@app.get("/items")
def list_items(
    size: Annotated[int, Query(
        deprecated=True,
        description="Use 'limit' instead"
    )] = 10,
    limit: Annotated[int, Query(ge=1, le=100)] = 10,
):
    return {"limit": limit}

# Multiple values for same query parameter
@app.get("/tags")
def filter_by_tags(
    tags: Annotated[list[str], Query(
        description="Filter by multiple tags"
    )],
):
    return {"tags": tags}
# Use: /tags?tags=python&tags=fastapi&tags=web`,
              language: 'python',
              output: `# GET /tags?tags=python&tags=fastapi&tags=web
{"tags": ["python", "fastapi", "web"]}`,
            },
          ],
          visualization: {
            type: 'comparison',
            title: 'Path Params vs Query Params',
            description: 'When to use each type of parameter',
            columns: [
              { title: 'Property', items: ['Purpose', 'Location', 'Required?', 'Multiple values?', 'Example', 'Validation'] },
              { title: 'Path Params', items: ['Identify resource', 'In URL path', 'Always required', 'No', '/users/42', 'Path()'] },
              { title: 'Query Params', items: ['Filter/modify', 'After ?', 'Can be optional', 'Yes (lists)', '/users?role=admin', 'Query()'] },
            ],
          },
          tips: [
            'Query parameters with no default value are REQUIRED — add = None to make them optional.',
            'Use alias when your query parameter name isn\'t a valid Python identifier (like "user-name" or "q").',
            'For pagination, always set a maximum limit (le=100) to prevent clients from requesting millions of records.',
          ],
          keyTakeaway:
            'Path parameters identify resources (/users/42), query parameters modify responses (?role=admin) — use both together for powerful APIs.',
        },
      ],
    },

    // ──────────────────────────────────────────────
    // TOPIC 6: Request Body & Pydantic Integration
    // ──────────────────────────────────────────────
    {
      id: 'm1-request-body',
      title: 'Request Body & Pydantic Integration',
      icon: '📦',
      introduction:
        'The request body carries data from the client to your API, typically as JSON. FastAPI uses Pydantic models to validate, parse, and document request bodies automatically. This integration is the heart of what makes FastAPI so powerful — your Pydantic model is your validation, your documentation, and your data structure all in one.',
      sections: [
        {
          heading: 'Defining Request Bodies with Pydantic Models',
          content: `When a client sends a POST, PUT, or PATCH request, they typically include a request body containing the data to process. FastAPI uses Pydantic BaseModel classes to define the expected shape of this data. When the request arrives, FastAPI reads the body, validates it against your Pydantic model, and passes a fully typed Python object to your function.

The beauty of this approach is that your Pydantic model serves triple duty: (1) it validates the incoming data (wrong types, missing fields, constraint violations all produce clear 422 errors), (2) it documents the API (the OpenAPI schema shows exactly what fields are expected, their types, and constraints), and (3) it provides IDE autocomplete for the resulting object in your function.

Any function parameter with a Pydantic type (like \`item: Item\`) is automatically treated as a request body. You don't need to add any decorator or special annotation — FastAPI detects the type and handles everything. This is the "type-driven" philosophy that makes FastAPI so productive.`,
          codeExamples: [
            {
              title: 'Pydantic Model as Request Body',
              description: 'Define your data shape once, get validation + docs + types automatically',
              code: `from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

app = FastAPI()

class ItemCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Item name")
    description: Optional[str] = Field(None, max_length=500, description="Item description")
    price: float = Field(..., gt=0, description="Price in USD (must be positive)")
    tax: Optional[float] = Field(None, ge=0, description="Tax rate (0 or positive)")
    tags: list[str] = Field(default_factory=list, description="List of tags")

class ItemResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    price: float
    tax: Optional[float]
    tags: list[str]
    created_at: datetime

@app.post("/items", response_model=ItemResponse, status_code=201)
def create_item(item: ItemCreate):
    # item is already validated and typed!
    # IDE knows: item.name (str), item.price (float), etc.
    new_item = {
        "id": 1,
        **item.model_dump(),
        "created_at": datetime.now(),
    }
    return new_item`,
              language: 'python',
            },
            {
              title: 'Multiple Body Parameters',
              description: 'When you need more than one object in the request body',
              code: `from fastapi import FastAPI, Body
from pydantic import BaseModel
from typing import Annotated

app = FastAPI()

class Item(BaseModel):
    name: str
    price: float

class User(BaseModel):
    username: str
    email: str

# Multiple body parameters — FastAPI expects a JSON with keys
@app.put("/items/{item_id}")
def update_item(item_id: int, item: Item, user: User):
    return {"item_id": item_id, "item": item, "user": user}

# Expected request body:
# {
#   "item": {"name": "Widget", "price": 9.99},
#   "user": {"username": "john", "email": "john@example.com"}
# }

# Single body parameter with extra field using Body()
@app.post("/items")
def create_item(
    item: Item,
    importance: Annotated[int, Body(gt=0, le=5, description="Priority 1-5")],
):
    return {"item": item, "importance": importance}

# Expected request body:
# {
#   "item": {"name": "Widget", "price": 9.99},
#   "importance": 3
# }`,
              language: 'python',
            },
          ],
          tips: [
            'Create separate models for Create, Update, and Response — don\'t reuse the same model for all operations.',
            'Use Field(...) for required fields and Field(None) for optional ones — the ... means "no default, must be provided".',
            'Pydantic models in function parameters are automatically detected as request bodies — no decorator needed.',
          ],
          keyTakeaway:
            'A Pydantic model as a function parameter = automatic request body validation, parsing, and documentation.',
        },
        {
          heading: 'Form Data & File Uploads as Request Bodies',
          content: `Not all request bodies are JSON. HTML forms send data as \`application/x-www-form-urlencoded\` or \`multipart/form-data\`. FastAPI handles both through the \`Form\` and \`File\` classes. You cannot mix Form/File parameters with a JSON body in the same request — they use different content types.

Form data is common when building APIs that serve web frontends, mobile apps that upload images, or any situation where you need to send files alongside text data. The \`File\` class gives you access to the uploaded file's content, filename, and content type, while \`UploadFile\` provides a spooled file object that's more memory-efficient for large files.

The key distinction: \`File()\` reads the entire file into memory as bytes (fine for small files), while \`UploadFile\` uses a spooled temporary file that only loads into memory if it's small, otherwise writing to disk. For any file larger than a few MB, always use \`UploadFile\`.`,
          codeExamples: [
            {
              title: 'Form Data & File Uploads',
              description: 'Handling form submissions and file uploads',
              code: `from fastapi import FastAPI, File, UploadFile, Form
from typing import Annotated, Optional

app = FastAPI()

# Form data only
@app.post("/login")
def login(
    username: Annotated[str, Form(min_length=3)],
    password: Annotated[str, Form(min_length=8)],
    remember: Annotated[bool, Form()] = False,
):
    return {"username": username, "remember": remember}

# File upload (small files — loads into memory)
@app.post("/upload/small")
def upload_small(file: Annotated[bytes, File(description="A small file (< 2MB)")]):
    return {"file_size": len(file), "content_type": "bytes"}

# File upload (large files — spooled to disk)
@app.post("/upload/file")
async def upload_file(file: Annotated[UploadFile, File(description="Any size file")]):
    contents = await file.read()
    return {
        "filename": file.filename,
        "content_type": file.content_type,
        "size": len(contents),
    }

# Multiple files + form fields
@app.post("/upload/multiple")
async def upload_multiple(
    files: list[UploadFile],
    description: Annotated[str, Form()],
    category: Annotated[Optional[str], Form()] = None,
):
    return {
        "description": description,
        "category": category,
        "files": [
            {"name": f.filename, "size": f.size}
            for f in files
        ],
    }`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'data-flow',
            title: 'Request Body Types in FastAPI',
            description: 'How different content types map to FastAPI parameter types',
            steps: [
              { label: 'JSON body', detail: 'Pydantic BaseModel parameter → application/json', highlight: true },
              { label: 'Form fields', detail: 'Form() parameters → application/x-www-form-urlencoded' },
              { label: 'File upload (small)', detail: 'File() parameter → multipart/form-data (bytes)' },
              { label: 'File upload (large)', detail: 'UploadFile parameter → multipart/form-data (spooled)', highlight: true },
              { label: 'Mixed form + files', detail: 'Form() + UploadFile → multipart/form-data' },
            ],
          },
          tips: [
            'Always use UploadFile over bytes File for files larger than 2MB — it\'s memory-efficient.',
            'You cannot mix JSON body (Pydantic model) with Form/File parameters — they use different content types.',
            'Use list[UploadFile] to accept multiple files in a single request.',
          ],
          keyTakeaway:
            'JSON bodies use Pydantic models, form data uses Form(), file uploads use UploadFile — never mix JSON and form/file in one request.',
        },
      ],
    },

    // ──────────────────────────────────────────────
    // TOPIC 7: Response Models & Status Codes
    // ──────────────────────────────────────────────
    {
      id: 'm1-response-models',
      title: 'Response Models & Status Codes',
      icon: '📤',
      introduction:
        'Controlling what your API returns is just as important as what it receives. Response models filter and shape output data, while status codes communicate the result to clients. Together, they form the contract between your API and its consumers.',
      sections: [
        {
          heading: 'Response Models: Shaping Your API Output',
          content: `A response model is a Pydantic model that defines the shape of your API's response. When you set \`response_model\` on a path operation, FastAPI does three things: (1) it filters the output to only include fields present in the model (this is crucial for security — you can exclude sensitive fields like passwords), (2) it validates the output data against the model (catching bugs where your code returns unexpected data), and (3) it documents the response shape in the OpenAPI schema (so clients know exactly what to expect).

The most common use case is having separate models for input and output. Your CreateModel might include a password field, but your ResponseModel should never include it. By specifying response_model=ResponseModel, FastAPI automatically strips the password from the response even if your internal data includes it.

Response models also handle type conversion. If your function returns a dict but the response_model expects a Pydantic model, FastAPI will convert it. This means you can return dicts, ORM objects, or Pydantic models — FastAPI normalizes everything to match the response_model.`,
          codeExamples: [
            {
              title: 'Separate Input & Output Models',
              description: 'The most common pattern: hide sensitive fields from responses',
              code: `from fastapi import FastAPI
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

app = FastAPI()

# Input model — includes password
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str  # Sensitive!
    full_name: Optional[str] = None

# Output model — NO password
class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    full_name: Optional[str]
    is_active: bool = True
    created_at: datetime

# Internal database representation
users_db: dict[int, dict] = {}

@app.post("/users",
    response_model=UserResponse,     # ← Response is filtered!
    status_code=201,
)
def create_user(user: UserCreate):
    user_id = len(users_db) + 1
    user_dict = user.model_dump()
    user_dict.update({
        "id": user_id,
        "is_active": True,
        "created_at": datetime.now(),
    })
    users_db[user_id] = user_dict

    # Even though user_dict contains "password",
    # the response_model STRIPS it automatically!
    return user_dict`,
              language: 'python',
            },
            {
              title: 'Multiple Response Models by Status Code',
              description: 'Different response shapes for different outcomes',
              code: `from fastapi import FastAPI
from pydantic import BaseModel
from typing import Union

app = FastAPI()

class ItemResponse(BaseModel):
    id: int
    name: str
    price: float

class ItemNotFound(BaseModel):
    error: str
    item_id: int

@app.get(
    "/items/{item_id}",
    response_model=ItemResponse,
    responses={
        404: {"model": ItemNotFound, "description": "Item not found"},
    },
)
def get_item(item_id: int):
    if item_id not in items_db:
        # The 404 response is documented in OpenAPI
        raise HTTPException(status_code=404, detail=f"Item {item_id} not found")
    return items_db[item_id]`,
              language: 'python',
            },
          ],
          tips: [
            'Always use response_model to filter sensitive fields — never rely on remembering to delete them manually.',
            'response_model filters output BEFORE sending — fields not in the model are stripped even if present in the return value.',
            'Create separate response models for different endpoints rather than using one giant model with Optional fields.',
          ],
          keyTakeaway:
            'response_model filters output, validates responses, and generates docs — always use it to protect sensitive data.',
        },
        {
          heading: 'HTTP Status Codes: Speaking the Right Language',
          content: `HTTP status codes are three-digit numbers that communicate the result of a request. They're grouped into five categories: 1xx (informational), 2xx (success), 3xx (redirection), 4xx (client error), and 5xx (server error). Using the correct status code is essential for API usability.

The most important status codes for APIs are: **200 OK** (successful GET, PUT, PATCH), **201 Created** (successful POST that creates a resource), **204 No Content** (successful DELETE or PUT with no response body), **400 Bad Request** (malformed request syntax), **401 Unauthorized** (missing or invalid authentication), **403 Forbidden** (authenticated but not authorized), **404 Not Found** (resource doesn't exist), **422 Unprocessable Entity** (validation error, FastAPI uses this automatically), and **500 Internal Server Error** (something broke on the server).

FastAPI defaults to 200 for all responses. You change this with the \`status_code\` parameter on your path operation decorator. For error responses, use \`HTTPException\` (covered in the next topic) which lets you set any status code with a detail message.`,
          codeExamples: [
            {
              title: 'Status Codes in Practice',
              description: 'Using the right status code for each operation',
              code: `from fastapi import FastAPI, status, HTTPException
from pydantic import BaseModel

app = FastAPI()

class Item(BaseModel):
    name: str
    price: float

items_db: dict[int, dict] = {}

# 201 Created — for POST that creates a resource
@app.post("/items", status_code=status.HTTP_201_CREATED)
def create_item(item: Item):
    item_id = len(items_db) + 1
    items_db[item_id] = {"id": item_id, **item.model_dump()}
    return items_db[item_id]

# 200 OK — for successful GET
@app.get("/items/{item_id}", status_code=status.HTTP_200_OK)
def get_item(item_id: int):
    if item_id not in items_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item {item_id} not found"
        )
    return items_db[item_id]

# 204 No Content — for DELETE (nothing to return)
@app.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: int):
    if item_id not in items_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item {item_id} not found"
        )
    del items_db[item_id]
    return None`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'comparison',
            title: 'Essential HTTP Status Codes for APIs',
            description: 'The status codes you\'ll use most often',
            columns: [
              { title: 'Code', items: ['200', '201', '204', '400', '401', '403', '404', '422', '500'] },
              { title: 'Name', items: ['OK', 'Created', 'No Content', 'Bad Request', 'Unauthorized', 'Forbidden', 'Not Found', 'Unprocessable', 'Server Error'] },
              { title: 'Use When', items: ['Success', 'Resource created', 'Deleted successfully', 'Bad syntax', 'Not authenticated', 'Not authorized', 'Doesn\'t exist', 'Validation fail', 'Server bug'] },
            ],
          },
          tips: [
            'Use status.HTTP_* constants instead of magic numbers — they\'re self-documenting and IDE-friendly.',
            'FastAPI automatically returns 422 for validation errors — you don\'t need to handle those manually.',
            'Always return 201 for POST endpoints that create resources — clients rely on this to know creation succeeded.',
          ],
          keyTakeaway:
            'Status codes are your API\'s language — 200=OK, 201=Created, 204=Deleted, 404=Not Found, 422=Validation Error.',
        },
      ],
    },

    // ──────────────────────────────────────────────
    // TOPIC 8: Error Handling & HTTPException
    // ──────────────────────────────────────────────
    {
      id: 'm1-error-handling',
      title: 'Error Handling & HTTPException',
      icon: '⚠️',
      introduction:
        'Errors are inevitable — how your API handles them determines whether clients love or hate your service. FastAPI provides structured error handling through HTTPException for expected errors and exception handlers for unexpected ones. This topic teaches you to build APIs that fail gracefully and communicate clearly.',
      sections: [
        {
          heading: 'HTTPException: Structured Error Responses',
          content: `HTTPException is FastAPI's built-in mechanism for returning HTTP error responses. When you raise HTTPException, FastAPI intercepts it and converts it into a proper HTTP response with the specified status code and a JSON body containing the error detail. This is different from raising a regular Python exception, which would result in a 500 Internal Server Error.

The key insight is that HTTPException is for **expected errors** — things that can go wrong in normal operation, like a resource not being found, a user not being authorized, or a business rule being violated. These are not bugs; they're part of your API's contract with its clients.

The \`detail\` parameter is what the client sees in the error response. It can be a string, a dict, or a list — use whatever structure provides the most helpful information. For validation-style errors, you might return a dict with field-level details. For simple cases, a descriptive string is sufficient.`,
          codeExamples: [
            {
              title: 'Basic HTTPException Usage',
              description: 'Raising structured errors for common scenarios',
              code: `from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel

app = FastAPI()

class Item(BaseModel):
    name: str
    price: float

items_db: dict[int, dict] = {
    1: {"id": 1, "name": "Widget", "price": 9.99, "owner_id": 1},
}

@app.get("/items/{item_id}")
def get_item(item_id: int):
    if item_id not in items_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item with id {item_id} does not exist",
        )
    return items_db[item_id]

# Custom error detail with structured data
@app.delete("/items/{item_id}")
def delete_item(item_id: int, current_user_id: int = 1):
    if item_id not in items_db:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "not_found",
                "message": f"Item {item_id} not found",
                "item_id": item_id,
            },
        )
    if items_db[item_id]["owner_id"] != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own items",
        )
    del items_db[item_id]
    return {"message": "Item deleted"}`,
              language: 'python',
              output: `# GET /items/999
{
  "detail": "Item with id 999 does not exist"
}

# DELETE /items/1 (wrong owner)
{
  "detail": "You can only delete your own items"
}`,
            },
            {
              title: 'Adding Custom Headers to Error Responses',
              description: 'Useful for rate limiting, authentication challenges, and debugging',
              code: `from fastapi import FastAPI, HTTPException
from datetime import datetime

app = FastAPI()

@app.get("/rate-limited")
def rate_limited_endpoint(api_key: str):
    if not is_valid_api_key(api_key):
        raise HTTPException(
            status_code=401,
            detail="Invalid API key",
            headers={
                "WWW-Authenticate": "Bearer",
                "X-RateLimit-Remaining": "0",
            },
        )
    return {"data": "sensitive"}

def is_valid_api_key(key: str) -> bool:
    return key == "secret-key-123"

# The response will include:
# HTTP/1.1 401 Unauthorized
# WWW-Authenticate: Bearer
# X-RateLimit-Remaining: 0
# {"detail": "Invalid API key"}`,
              language: 'python',
            },
          ],
          tips: [
            'HTTPException is for EXPECTED errors (not found, unauthorized) — not for bugs (those should be 500s).',
            'Use structured detail (dict) when clients need machine-readable error info — strings for human-readable messages.',
            'Add WWW-Authenticate header to 401 responses — it tells clients what authentication method to use.',
          ],
          keyTakeaway:
            'HTTPException converts Python exceptions into structured HTTP error responses — use it for all expected failure cases.',
        },
        {
          heading: 'Custom Exception Handlers',
          content: `While HTTPException handles expected errors, your application will also encounter unexpected errors — database connection failures, external API timeouts, business rule violations. Custom exception handlers let you catch these and return structured responses instead of 500 errors with stack traces.

FastAPI allows you to register handlers for any exception type using \`@app.exception_handler()\`. When that exception is raised anywhere in your code (including in dependencies and Pydantic validators), FastAPI calls your handler instead of the default error handler. This is how you build consistent error responses across your entire API.

A common pattern is to create a custom exception hierarchy: a base AppError class, with specific subclasses like NotFoundError, UnauthorizedError, and BusinessRuleError. Each has a default status code and error code. Your exception handler then converts these into consistent JSON responses.`,
          codeExamples: [
            {
              title: 'Custom Exception Hierarchy & Handler',
              description: 'Building a consistent error response system',
              code: `from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

app = FastAPI()

# ── Custom Exception Hierarchy ──────────────────
class AppError(Exception):
    """Base exception for all application errors."""
    def __init__(self, status_code: int, error_code: str, message: str):
        self.status_code = status_code
        self.error_code = error_code
        self.message = message

class NotFoundError(AppError):
    def __init__(self, resource: str, resource_id: int):
        super().__init__(
            status_code=404,
            error_code="NOT_FOUND",
            message=f"{resource} with id {resource_id} not found",
        )

class BusinessRuleError(AppError):
    def __init__(self, message: str):
        super().__init__(
            status_code=422,
            error_code="BUSINESS_RULE_VIOLATION",
            message=message,
        )

# ── Register Exception Handler ──────────────────
@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error_code": exc.error_code,
            "message": exc.message,
            "path": str(request.url),
        },
    )

# ── Use in Endpoints ────────────────────────────
@app.get("/users/{user_id}")
def get_user(user_id: int):
    if user_id > 100:
        raise NotFoundError("User", user_id)
    return {"id": user_id, "name": "Alice"}

@app.post("/transfers")
def transfer_money(from_id: int, to_id: int, amount: float):
    if amount < 0:
        raise BusinessRuleError("Transfer amount must be positive")
    if from_id == to_id:
        raise BusinessRuleError("Cannot transfer to the same account")
    return {"status": "transferred", "amount": amount}`,
              language: 'python',
              output: `# GET /users/999
{
  "error_code": "NOT_FOUND",
  "message": "User with id 999 not found",
  "path": "http://localhost:8000/users/999"
}

# POST /transfers?from_id=1&to_id=1&amount=100
{
  "error_code": "BUSINESS_RULE_VIOLATION",
  "message": "Cannot transfer to the same account",
  "path": "http://localhost:8000/transfers"
}`,
            },
          ],
          visualization: {
            type: 'flow',
            title: 'Error Handling Flow',
            description: 'How errors flow through FastAPI from your code to the client',
            steps: [
              { label: 'Code raises exception', detail: 'HTTPException or custom exception' },
              { label: 'FastAPI intercepts', detail: 'Exception is caught before becoming 500', highlight: true },
              { label: 'Check exception handlers', detail: 'Any registered @app.exception_handler()?', highlight: true },
              { label: 'Handler found? → Custom response', detail: 'Your handler formats the error response' },
              { label: 'No handler? → Default response', detail: 'HTTPException → JSON, others → 500' },
              { label: 'Client receives error', detail: 'Structured JSON with status code and details' },
            ],
          },
          tips: [
            'Create a custom exception hierarchy for consistent error responses across your entire application.',
            'Always include an error_code (string) in addition to status code — clients can switch on error_code for i18n and logic.',
            'Override the validation error handler (RequestValidationError) to customize 422 responses from Pydantic.',
          ],
          keyTakeaway:
            'Custom exception handlers give you full control over error responses — build a consistent error format for your entire API.',
        },
      ],
    },

    // ──────────────────────────────────────────────
    // TOPIC 9: File Operations (Upload/Download)
    // ──────────────────────────────────────────────
    {
      id: 'm1-file-operations',
      title: 'File Operations (Upload/Download)',
      icon: '📁',
      introduction:
        'File handling is a core feature of many APIs — from profile picture uploads to report downloads. FastAPI provides powerful, intuitive tools for both uploading and serving files, with built-in support for streaming large files efficiently.',
      sections: [
        {
          heading: 'Uploading Files with UploadFile',
          content: `FastAPI provides two ways to handle file uploads: \`File()\` which loads the entire file into memory as bytes, and \`UploadFile\` which uses a spooled temporary file. For anything beyond small files, always use \`UploadFile\` — it only loads small files into memory and writes larger ones to a temporary file on disk, preventing memory exhaustion.

UploadFile has several useful attributes: \`filename\` (the original filename from the client), \`content_type\` (the MIME type), \`size\` (file size in bytes), and methods like \`read()\`, \`write()\`, \`seek()\`, and \`close()\`. These follow the standard Python file interface, making it easy to work with.

When accepting file uploads, always validate: (1) the file extension or content type, (2) the file size (to prevent denial-of-service attacks), and (3) the file content (for images, you might verify it's actually a valid image). Never trust the client-provided filename or content type without validation.`,
          codeExamples: [
            {
              title: 'File Upload with Validation',
              description: 'Secure file upload with type and size validation',
              code: `from fastapi import FastAPI, UploadFile, File, HTTPException
from typing import Annotated
import shutil
from pathlib import Path

app = FastAPI()

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

@app.post("/upload/avatar")
async def upload_avatar(
    file: Annotated[UploadFile, File(description="Profile avatar image")]
):
    # 1. Validate file extension
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type {suffix} not allowed. Allowed: {ALLOWED_EXTENSIONS}",
        )

    # 2. Validate file size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE // 1024 // 1024}MB",
        )

    # 3. Save the file (use a unique name to prevent conflicts)
    safe_filename = f"avatar_{hash(contents)}{suffix}"
    save_path = Path("uploads") / safe_filename
    save_path.parent.mkdir(exist_ok=True)

    with open(save_path, "wb") as f:
        f.write(contents)

    return {
        "filename": safe_filename,
        "content_type": file.content_type,
        "size": len(contents),
        "path": str(save_path),
    }`,
              language: 'python',
            },
            {
              title: 'Multiple File Uploads',
              description: 'Handling multiple files in a single request',
              code: `from fastapi import FastAPI, UploadFile, File
from typing import Annotated

app = FastAPI()

@app.post("/upload/documents")
async def upload_documents(
    files: Annotated[list[UploadFile], File(description="Multiple documents")],
    category: str = "general",
):
    results = []
    for file in files:
        contents = await file.read()
        results.append({
            "filename": file.filename,
            "size": len(contents),
            "content_type": file.content_type,
            "category": category,
        })
    return {
        "uploaded": len(results),
        "files": results,
    }

# Upload with curl:
# curl -X POST "http://localhost:8000/upload/documents" \\
#   -F "files=@report.pdf" \\
#   -F "files=@data.csv" \\
#   -F "files=@notes.txt" \\
#   -F "category=reports"`,
              language: 'python',
            },
          ],
          tips: [
            'Always validate file extensions AND content types — both can be spoofed by malicious clients.',
            'Use a unique filename (UUID, hash) when saving — never use the client-provided filename directly (path traversal attacks).',
            'Reset file position with await file.seek(0) if you read the file and need to read it again.',
          ],
          keyTakeaway:
            'UploadFile is memory-efficient for large files — always validate type, size, and content before saving.',
        },
        {
          heading: 'Serving Files for Download',
          content: `FastAPI provides \`FileResponse\` for serving files from disk and \`StreamingResponse\` for generating content on the fly. FileResponse is ideal for static files — you provide the file path and optional media type, and FastAPI handles range requests, ETags, and content-length headers automatically.

StreamingResponse is for cases where you don't have a complete file: generating reports on demand, proxying large files from another service, or creating CSV exports from database queries. Instead of loading the entire file into memory, you yield chunks as they're generated, keeping memory usage constant regardless of file size.

Both response types set the Content-Disposition header, which tells the browser whether to display the file inline or download it as an attachment. Setting \`filename\` in FileResponse or adding a Content-Disposition header in StreamingResponse triggers the browser's download behavior.`,
          codeExamples: [
            {
              title: 'File Download & Streaming',
              description: 'Serve static files and generate dynamic downloads',
              code: `from fastapi import FastAPI
from fastapi.responses import FileResponse, StreamingResponse
import csv
import io

app = FastAPI()

# ── Static File Download ────────────────────────
@app.get("/download/{filename}")
def download_file(filename: str):
    file_path = f"uploads/{filename}"
    return FileResponse(
        path=file_path,
        filename=filename,           # Suggests download name
        media_type="application/octet-stream",  # Forces download
    )

# ── Streaming CSV Export ────────────────────────
@app.get("/export/users.csv")
def export_users_csv():
    def generate_csv():
        output = io.StringIO()
        writer = csv.writer(output)
        # Header
        writer.writerow(["id", "name", "email"])
        yield output.getvalue()
        output.seek(0)
        output.truncate(0)
        # Data rows
        for user in get_all_users():
            writer.writerow([user["id"], user["name"], user["email"]])
            yield output.getvalue()
            output.seek(0)
            output.truncate(0)

    return StreamingResponse(
        generate_csv(),
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=users_export.csv"
        },
    )

def get_all_users():
    return [
        {"id": 1, "name": "Alice", "email": "alice@example.com"},
        {"id": 2, "name": "Bob", "email": "bob@example.com"},
        {"id": 3, "name": "Charlie", "email": "charlie@example.com"},
    ]`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'flow',
            title: 'File Upload → Process → Download Pipeline',
            description: 'The complete file handling lifecycle in a FastAPI application',
            steps: [
              { label: 'Client uploads file', detail: 'POST /upload with multipart/form-data' },
              { label: 'FastAPI receives as UploadFile', detail: 'Spooled to disk if large', highlight: true },
              { label: 'Validate type, size, content', detail: 'Extension check, size limit, content verification' },
              { label: 'Save with unique filename', detail: 'UUID-based name to prevent conflicts' },
              { label: 'Return file metadata', detail: 'Filename, path, size, content_type' },
              { label: 'Client requests download', detail: 'GET /download/filename' },
              { label: 'FastAPI serves via FileResponse', detail: 'Supports range requests, ETags', highlight: true },
            ],
          },
          tips: [
            'Use StreamingResponse for generated content (CSV exports, PDF reports) — it keeps memory constant.',
            'FileResponse automatically handles range requests, enabling resumable downloads and video seeking.',
            'Set Content-Disposition: attachment to force download; inline to display in browser.',
          ],
          keyTakeaway:
            'FileResponse serves static files efficiently; StreamingResponse generates dynamic content — both handle large files without memory issues.',
        },
      ],
    },

    // ──────────────────────────────────────────────
    // TOPIC 10: FastAPI Project Structure Best Practices
    // ──────────────────────────────────────────────
    {
      id: 'm1-project-structure',
      title: 'FastAPI Project Structure Best Practices',
      icon: '🏗️',
      introduction:
        'A well-structured project is the difference between a maintainable application and a tangled mess. This topic covers the proven patterns for organizing FastAPI projects that scale from a single file to a microservices architecture, with clean separation of concerns and testable code.',
      sections: [
        {
          heading: 'The Recommended Project Layout',
          content: `The most common mistake beginners make is putting everything in a single main.py file. While this works for tutorials, it breaks down quickly in real projects. You need a structure that separates concerns: routes, models, schemas, services, and configuration should each have their own home.

The recommended layout organizes code by feature and by layer. The "by layer" approach groups files by their role (routes, models, schemas), while "by feature" groups everything related to a feature together (user routes, user models, user schemas). For small to medium projects, the "by layer" approach is simpler. For large projects with many domains, "by feature" scales better.

Key principles: (1) **Routers** break your API into logical groups (users, items, auth), (2) **Schemas** (Pydantic models) define request/response shapes, (3) **Services** contain business logic, (4) **Models** (ORM models) define database tables, (5) **Dependencies** handle shared logic like authentication and database sessions.`,
          codeExamples: [
            {
              title: 'Recommended Project Structure',
              description: 'A scalable layout for production FastAPI applications',
              code: `my_project/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app creation & configuration
│   ├── dependencies.py      # Shared dependencies (auth, db sessions)
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── users.py         # User-related endpoints
│   │   ├── items.py         # Item-related endpoints
│   │   └── auth.py          # Authentication endpoints
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py          # User Pydantic models
│   │   ├── item.py          # Item Pydantic models
│   │   └── auth.py          # Auth Pydantic models
│   ├── services/
│   │   ├── __init__.py
│   │   ├── user_service.py  # User business logic
│   │   └── item_service.py  # Item business logic
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py          # User ORM/DB model
│   │   └── item.py          # Item ORM/DB model
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py        # Settings (pydantic-settings)
│   │   ├── security.py      # JWT, password hashing
│   │   └── database.py      # Database connection
│   └── utils/
│       ├── __init__.py
│       └── exceptions.py    # Custom exceptions
├── tests/
│   ├── conftest.py          # Shared fixtures
│   ├── test_users.py
│   └── test_items.py
├── alembic/                  # Database migrations
├── requirements.txt
├── .env                      # Environment variables
└── README.md`,
              language: 'text',
            },
            {
              title: 'main.py — App Assembly Point',
              description: 'How to wire everything together',
              code: `from fastapi import FastAPI
from app.core.config import settings
from app.routers import users, items, auth
from app.utils.exceptions import AppError, app_error_handler

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
)

# Register exception handlers
app.add_exception_handler(AppError, app_error_handler)

# Include routers with prefixes and tags
app.include_router(
    auth.router,
    prefix="/api/auth",
    tags=["Authentication"],
)
app.include_router(
    users.router,
    prefix="/api/users",
    tags=["Users"],
)
app.include_router(
    items.router,
    prefix="/api/items",
    tags=["Items"],
)

@app.get("/health")
def health_check():
    return {"status": "healthy", "version": settings.VERSION}`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'architecture',
            title: 'FastAPI Project Architecture',
            description: 'How the different layers interact in a well-structured project',
            layers: [
              { label: 'Routers (API Layer)', items: ['Receive requests', 'Validate input (schemas)', 'Call services', 'Return responses'] },
              { label: 'Schemas (Validation Layer)', items: ['Pydantic models', 'Request validation', 'Response filtering', 'OpenAPI docs'] },
              { label: 'Services (Business Layer)', items: ['Business logic', 'Data transformation', 'Authorization checks', 'Error raising'] },
              { label: 'Models (Data Layer)', items: ['ORM models', 'Database tables', 'Relationships', 'Constraints'] },
              { label: 'Core (Infrastructure)', items: ['Config/settings', 'Database session', 'Security/auth', 'Middleware'] },
            ],
          },
          tips: [
            'Start with the recommended structure from day one — refactoring a flat main.py into a proper structure is painful.',
            'Use APIRouter with prefixes to group related endpoints — each router file handles one domain.',
            'Keep business logic OUT of route handlers — put it in service functions that are easy to test.',
          ],
          keyTakeaway:
            'Separate your code into routers, schemas, services, models, and core — each layer has a single responsibility.',
        },
        {
          heading: 'Using APIRouter for Modular Routes',
          content: `APIRouter is FastAPI's way of breaking your API into modular, reusable pieces. Instead of defining all endpoints on the main \`app\`, you define them on separate routers and then include those routers in the app. This gives you several benefits: (1) each router can have its own prefix and tags, (2) routers can be in separate files for organization, (3) dependencies can be applied per-router, and (4) routers can be reused across multiple apps.

A common pattern is to create one router per domain: users, items, orders, auth, etc. Each router file contains all the endpoints for that domain. The main.py file then assembles everything by including each router with its prefix.

APIRouter also supports nested includes — you can have a router that includes other routers. This is useful for API versioning (v1 router includes user and item routers) and for creating reusable module packages.`,
          codeExamples: [
            {
              title: 'APIRouter in Action',
              description: 'Modular route organization with separate files',
              code: `# app/routers/users.py
from fastapi import APIRouter, Depends, HTTPException
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.services.user_service import UserService

router = APIRouter()

@router.post("/", response_model=UserResponse, status_code=201)
def create_user(user: UserCreate):
    return UserService.create(user)

@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int):
    user = UserService.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.patch("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user: UserUpdate):
    return UserService.update(user_id, user)

@router.delete("/{user_id}", status_code=204)
def delete_user(user_id: int):
    UserService.delete(user_id)
    return None

# ────────────────────────────────────────────────
# app/routers/items.py
from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def list_items(skip: int = 0, limit: int = 10):
    return {"skip": skip, "limit": limit}

@router.post("/")
def create_item():
    return {"created": True}`,
              language: 'python',
            },
            {
              title: 'Router with Shared Dependencies',
              description: 'Apply authentication and other dependencies to an entire router',
              code: `from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user, get_db_session

# All routes in this router require authentication
router = APIRouter(
    prefix="/api/protected",
    tags=["Protected"],
    dependencies=[Depends(get_current_user)],  # ← Applied to ALL routes
)

@router.get("/profile")
def get_profile(current_user=Depends(get_current_user)):
    # current_user is already authenticated via router dependency
    return {"username": current_user.username}

@router.put("/profile")
def update_profile(
    data: dict,
    current_user=Depends(get_current_user),
    db=Depends(get_db_session),
):
    # Both router-level AND route-level dependencies available
    return {"updated": True}

# Router-level dependencies run BEFORE route handlers,
# so authentication is guaranteed for every route in this router.`,
              language: 'python',
            },
          ],
          tips: [
            'Use APIRouter dependencies for cross-cutting concerns like auth — every route in the router inherits them.',
            'Prefix routers with /api/v1 to future-proof your API for versioning.',
            'Keep router files focused on HTTP concerns (request/response) — delegate business logic to service functions.',
          ],
          keyTakeaway:
            'APIRouter breaks your API into modular, reusable pieces — each router handles one domain with its own prefix and dependencies.',
        },
      ],
    },
  ],
};
