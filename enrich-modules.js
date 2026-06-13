#!/usr/bin/env node
/**
 * Enrichment script that adds realWorldAnalogy, commonMistakes, interviewQuestions,
 * proTips, fullStackExample, and frontendIntegration to module files.
 * 
 * Uses targeted string replacements at known injection points.
 */

const fs = require('fs');
const path = require('path');

const CURRICULUM_DIR = path.join(__dirname, 'src/lib/curriculum');

// ═══════════════════════════════════════════════════════════════════════
// ENRICHMENT DATA - Per module, per section
// ═══════════════════════════════════════════════════════════════════════

const enrichmentData = {
  'module1-foundation': {
    sections: {
      'The Problem FastAPI Solves': {
        realWorldAnalogy: `Imagine a restaurant where the waiter (FastAPI) automatically checks if your order makes sense (validation), writes it on a ticket for the kitchen (documentation), and translates between the customer's language and the chef's language (serialization) — all from a single order form. Before FastAPI, you needed a separate validator, a separate documentation writer, and a separate translator who often disagreed with each other.`,
        commonMistakes: [
          { mistake: 'Thinking FastAPI is only fast at runtime', fix: 'FastAPI is fast at DEVELOPMENT time — the auto-generated docs, type validation, and IDE support save hours. Runtime performance is a bonus.' },
          { mistake: 'Comparing FastAPI to Flask without considering features', fix: 'Flask gives you routing only. FastAPI gives you routing + validation + docs + serialization + dependency injection. A fair comparison would be Flask + Marshmallow + Flasgger + manual validation.' }
        ],
        interviewQuestions: [
          { question: 'What problem does FastAPI solve that Flask doesn\'t?', answer: 'FastAPI eliminates the trilemma of validation, documentation, and serialization. With Flask, you must manually validate input, write API docs, and serialize output separately. FastAPI does all three automatically from type hints.' },
          { question: 'What are the two core libraries FastAPI is built on?', answer: 'Starlette (ASGI framework for routing, middleware, and HTTP handling) and Pydantic (data validation and serialization using Python type hints).' }
        ],
        proTips: [
          'Don\'t just learn FastAPI — study Starlette\'s middleware system and Pydantic\'s validation pipeline. Understanding these layers makes debugging 10x easier.',
          'The OpenAPI schema at /openapi.json can be fed into code generators to auto-generate TypeScript clients, saving days of frontend boilerplate.'
        ]
      },
      'How FastAPI Works Under the Hood': {
        realWorldAnalogy: `Think of the request lifecycle like a package delivery system: the mailroom (Uvicorn) receives the package, the routing department (Starlette) figures out which department handles it, the quality inspector (Pydantic) checks the contents match the manifest (type hints), and then the specialist (your function) processes it. If the inspector finds a mismatch, the package is rejected before it even reaches the specialist.`,
        commonMistakes: [
          { mistake: 'Using async def with blocking I/O like requests.get() or time.sleep()', fix: 'Use sync def for blocking operations, or use async-compatible libraries like httpx.AsyncClient() and asyncio.sleep() instead.' },
          { mistake: 'Thinking type hints are optional decorations in FastAPI', fix: 'Type hints ARE the validation logic in FastAPI. Every type hint drives validation, documentation, and serialization. Removing them breaks all three.' }
        ],
        interviewQuestions: [
          { question: 'What happens when a request fails Pydantic validation?', answer: 'FastAPI returns a 422 Unprocessable Entity response with detailed JSON error containing the field location, error type, message, and the invalid input value. Your endpoint code never executes.' },
          { question: 'Can you use synchronous functions in FastAPI?', answer: 'Yes! FastAPI supports both sync def and async def. Use sync def for CPU-bound or blocking I/O, and async def for non-blocking I/O like async database queries.' }
        ],
        proTips: [
          'The 422 error response is your debugging best friend — it tells you exactly which field failed, what type was expected, and what was received.',
          'Use response_model on endpoints to enforce output validation. Even if your function returns extra fields, only the fields in response_model are sent to the client.'
        ]
      },
      'Performance Benchmarks & Real-World Adoption': {
        realWorldAnalogy: `FastAPI's performance is like a well-organized factory: the assembly line (Starlette/uvloop) moves items fast, the quality control (Pydantic/Rust) checks them at native speed, and the result is a factory that's both fast AND produces perfect output. A factory that's fast but produces defective products (no validation) isn't useful.`,
        commonMistakes: [
          { mistake: 'Choosing FastAPI solely for performance benchmarks', fix: 'FastAPI\'s real value is developer productivity. The 12x performance over Flask is nice, but the 200-300% productivity improvement from auto-docs and validation is what matters.' },
          { mistake: 'Not using async database drivers with async endpoints', fix: 'If you use async def endpoints with synchronous database drivers, you block the event loop. Use asyncpg or SQLAlchemy async instead.' }
        ],
        interviewQuestions: [
          { question: 'How does FastAPI achieve performance comparable to Node.js?', answer: 'FastAPI runs on uvloop (the same engine Node.js uses) via Uvicorn. Combined with Pydantic\'s Rust-core validation, it achieves near-Node.js throughput while using Python syntax.' },
          { question: 'Name three real-world companies using FastAPI in production.', answer: 'Microsoft (internal tools), Uber (some microservices), and Netflix (crisis management tools). Many startups use it as their primary API framework.' }
        ],
        proTips: [
          'For maximum throughput, use Uvicorn with --workers to utilize all CPU cores, combine with async database drivers, and add Redis caching for frequently-accessed data.',
          'Don\'t optimize prematurely. FastAPI handles 15,000+ RPS out of the box — most applications need far less. Focus on clean code first.'
        ]
      },
      'Creating Your Python Environment': {
        realWorldAnalogy: `Setting up a virtual environment is like having a personal kitchen in a shared house. Without it, you'd share pots, pans, and ingredients with everyone else (other Python projects). If your roommate upgrades the stove (a dependency), your recipe might break. A virtual environment gives you your own kitchen where you control everything.`,
        commonMistakes: [
          { mistake: 'Installing FastAPI globally without a virtual environment', fix: 'Always create a virtual environment first: python3 -m venv .venv && source .venv/bin/activate. This prevents version conflicts between projects.' },
          { mistake: 'Not pinning dependency versions in requirements.txt', fix: 'Use pip freeze > requirements.txt to capture exact versions. Unpinned dependencies break when upstream packages release breaking changes.' }
        ],
        interviewQuestions: [
          { question: 'Why should you use a virtual environment for every Python project?', answer: 'Virtual environments isolate project dependencies, preventing version conflicts. Project A can use FastAPI 0.100 while Project B uses 0.104 without interfering.' },
          { question: 'What does pip install "fastapi[standard]" install besides FastAPI?', answer: 'It installs uvicorn (ASGI server), httpx (test client), pydantic-settings (config management), jinja2 (templates), and python-multipart (form handling).' }
        ],
        proTips: [
          'Consider using uv instead of pip for 10-100x faster installation: uv pip install "fastapi[standard]".',
          'Add .venv to your .gitignore immediately after creation — virtual environments should never be committed to version control.'
        ]
      },
      'Running Your Development Server': {
        realWorldAnalogy: `Running uvicorn with --reload is like having a personal assistant who restarts your computer every time you save a file. Without it, you'd have to manually stop and start the server for every code change, which is like rebooting your computer every time you save a document.`,
        commonMistakes: [
          { mistake: 'Using --reload in production', fix: 'The --reload flag is for development only. In production, use --workers N to run multiple worker processes instead.' },
          { mistake: 'Using the fastapi dev command in production', fix: 'fastapi dev is only for local development. For production, use uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4.' }
        ],
        interviewQuestions: [
          { question: 'What is the difference between uvicorn and FastAPI?', answer: 'FastAPI is the web framework that handles routing, validation, and serialization. Uvicorn is the ASGI server that receives HTTP requests and passes them to FastAPI. You need both.' },
          { question: 'What does the --reload flag do and when should you NOT use it?', answer: '--reload watches Python files for changes and automatically restarts the server. Never use it in production — it adds overhead and may cause brief downtime during restarts.' }
        ],
        proTips: [
          'Use the fastapi dev command for the best development experience — it includes --reload plus enhanced error messages.',
          'For production, pair Uvicorn with Gunicorn: gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker.'
        ]
      },
      'Essential Development Tools': {
        realWorldAnalogy: `TestClient is like a test kitchen where you can cook and taste your dishes (API endpoints) without actually opening the restaurant (starting a server). The food is prepared the same way, but it's much faster and you can try as many variations as you want without real customers waiting.`,
        commonMistakes: [
          { mistake: 'Testing APIs by manually calling endpoints with curl or Postman only', fix: 'Use TestClient + pytest for automated, repeatable tests. Manual testing is fine for exploration, but automated tests catch regressions.' },
          { mistake: 'Not configuring the IDE to use the virtual environment', fix: 'Set python.defaultInterpreterPath to your .venv/bin/python in VS Code settings. Without this, you lose autocomplete and type checking.' }
        ],
        interviewQuestions: [
          { question: 'How does FastAPI\'s TestClient work without starting a real server?', answer: 'TestClient uses httpx to communicate with your FastAPI app through the ASGI interface directly, bypassing the network layer. Tests run in milliseconds.' },
          { question: 'What are the essential tools for a FastAPI development workflow?', answer: 'Virtual environment (.venv), Uvicorn with --reload, pytest with TestClient, httpx for async testing, and a configured IDE for type checking.' }
        ],
        proTips: [
          'Install httpie for beautiful terminal API testing: http GET localhost:8000/items/42.',
          'Use pytest -x to stop on first failure and -s to see print() output during tests.'
        ]
      },
      'Anatomy of a Path Operation': {
        realWorldAnalogy: `A path operation is like a receptionist at an office building. The decorator (@app.get) is the receptionist's instructions about which door to send people to. The function is the actual office worker who handles the request. The type hints are the building security that checks IDs before letting anyone through.`,
        commonMistakes: [
          { mistake: 'Naming endpoint functions generically like handler() or process()', fix: 'Use descriptive names like list_users, create_order, delete_comment. The function name becomes the operationId in OpenAPI.' },
          { mistake: 'Using async def for CPU-bound operations', fix: 'Use sync def for CPU-bound or blocking I/O. async def is for I/O-bound operations where you await other async operations.' }
        ],
        interviewQuestions: [
          { question: 'What are the three components of a FastAPI path operation?', answer: 'The decorator (HTTP method + path pattern), the function (business logic), and the type hints (validation + documentation).' },
          { question: 'Why should you never call time.sleep() in an async def endpoint?', answer: 'time.sleep() blocks the entire asyncio event loop, preventing ALL other requests from being processed. Use asyncio.sleep() instead.' }
        ],
        proTips: [
          'Add docstrings to every endpoint — they appear in Swagger UI and help other developers understand the purpose.',
          'Use response_model to explicitly define what your endpoint returns. This filters out extra fields and makes your API contract clear.'
        ]
      },
      'Building a Real-World-Like First API': {
        realWorldAnalogy: `Building a Book API with in-memory storage is like setting up a library with books on a whiteboard. It works for learning — you can add, search, and read books. But when you erase the whiteboard (restart the server), all books disappear. Later, we'll replace the whiteboard with a real bookshelf (database).`,
        commonMistakes: [
          { mistake: 'Returning {"error": "not found"} instead of raising HTTPException', fix: 'Use raise HTTPException(status_code=404, detail="Not found") to return a proper HTTP error. A dict with 200 status code misleads clients.' },
          { mistake: 'Using POST with query parameters for request bodies', fix: 'For POST endpoints, use a Pydantic model as the request body instead of individual query parameters.' }
        ],
        interviewQuestions: [
          { question: 'What\'s wrong with returning an error dict with a 200 status code?', answer: 'It violates HTTP semantics. Clients check status codes first — 200 means success. Returning error info with 200 breaks caching, monitoring, and client libraries.' },
          { question: 'How do you handle a resource not found in FastAPI?', answer: 'Raise HTTPException(status_code=404, detail="Resource not found"). FastAPI converts this into a proper HTTP 404 response.' }
        ],
        proTips: [
          'Start with in-memory storage to master the request/response cycle, then swap for a database using the repository pattern.',
          'Add a response_model to every endpoint to ensure your API contract is enforced and documented.'
        ]
      },
      'Understanding HTTP Methods & REST Semantics': {
        realWorldAnalogy: `HTTP methods are like verbs in a language. GET is 'read', POST is 'create', PUT is 'replace entirely', PATCH is 'update partially', DELETE is 'remove'. If you use the wrong verb — like using GET to delete something — it's like saying 'I'd like to read this book' when you actually mean 'throw this book in the trash'.`,
        commonMistakes: [
          { mistake: 'Using GET to modify data (e.g., GET /users/delete/5)', fix: 'Use DELETE /users/5 instead. GET must be safe and idempotent. Breaking this breaks caching and CDN behavior.' },
          { mistake: 'Using POST for every operation instead of proper HTTP methods', fix: 'Use PUT for full replacements, PATCH for partial updates, DELETE for removals. Proper methods make your API predictable.' }
        ],
        interviewQuestions: [
          { question: 'What does "idempotent" mean for HTTP methods?', answer: 'An idempotent method produces the same result regardless of how many times it\'s called. PUT is idempotent; POST is not.' },
          { question: 'What is the difference between PUT and PATCH?', answer: 'PUT replaces the entire resource — you must send ALL fields. PATCH partially updates — only the fields you send are modified.' }
        ],
        proTips: [
          'Always use proper status codes: 201 for creation, 204 for deletion, 404 for not found, 409 for conflicts.',
          'Document your HTTP methods clearly in your OpenAPI tags. FastAPI does this automatically from your code.'
        ]
      },
      'Implementing Full CRUD Operations': {
        realWorldAnalogy: `CRUD operations are like a library management system: you can add new books (CREATE/POST), browse the catalog (READ/GET), update book information (UPDATE/PUT+PATCH), and remove old books (DELETE). Each operation uses the appropriate tool.`,
        commonMistakes: [
          { mistake: 'Using model_dump() instead of model_dump(exclude_unset=True) for PATCH', fix: 'model_dump() includes all fields with defaults. model_dump(exclude_unset=True) only includes fields the client sent, preventing accidental overwrites.' },
          { mistake: 'Forgetting status_code=201 for POST creation endpoints', fix: 'Always use status_code=status.HTTP_201_CREATED for creation endpoints. 200 OK means success, 201 Created means resource created.' }
        ],
        interviewQuestions: [
          { question: 'Why should PATCH use model_dump(exclude_unset=True)?', answer: 'Because PATCH should only update fields the client explicitly sent. Without exclude_unset=True, fields defaulting to None would overwrite existing data.' },
          { question: 'What status code should DELETE return?', answer: '204 No Content is standard for successful deletion — the resource is gone and there\'s nothing to return.' }
        ],
        proTips: [
          'Create separate Pydantic models for Create, Update, and Response. This pattern prevents bugs and security issues.',
          'Use from_attributes=True (orm_mode) on response models so Pydantic reads directly from SQLAlchemy objects.'
        ]
      },
      'PUT vs PATCH: The Critical Difference': {
        realWorldAnalogy: `PUT is like replacing an entire form with a new one — every field must be filled in, even if you only wanted to change your phone number. PATCH is like correcting just one field on the existing form — everything else stays exactly as it was.`,
        commonMistakes: [
          { mistake: 'Using PUT for partial updates because it\'s "easier"', fix: 'Use PATCH for partial updates with all-optional fields and model_dump(exclude_unset=True). PUT overwrites unchanged fields with None.' },
          { mistake: 'Making PATCH fields required (same as PUT model)', fix: 'PATCH models should have ALL fields optional. The client should be able to update just one field without providing the others.' }
        ],
        interviewQuestions: [
          { question: 'What happens if you use PUT but only send some fields?', answer: 'Missing fields are set to their defaults (usually None). If you PUT only name="Bob", email becomes None. This is why PUT requires the complete resource.' },
          { question: 'How do you implement a safe PATCH endpoint?', answer: 'Create a Pydantic model with all optional fields. Use model_dump(exclude_unset=True) to get only fields the client sent, then update only those fields.' }
        ],
        proTips: [
          'Always test your PATCH endpoint by sending a request with only one field, then verify other fields are unchanged.',
          'Some teams skip PATCH entirely and use PUT with full resources. This works but provides a worse developer experience for API consumers.'
        ]
      }
    },
    topics: {
      'm1-what-is-fastapi': {
        frontendIntegration: {
          title: 'Calling Your First FastAPI Endpoint from HTML',
          vanillaHtml: {
            title: 'Vanilla JS Fetch to FastAPI',
            description: 'A minimal HTML page that calls a FastAPI endpoint and displays the result',
            code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>FastAPI Demo</title>
  <style>
    body { font-family: system-ui; max-width: 600px; margin: 2rem auto; padding: 0 1rem; }
    #result { background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 1rem; margin-top: 1rem; }
    button { background: #0d9488; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; }
    button:hover { background: #0f766e; }
  </style>
</head>
<body>
  <h1>FastAPI Demo Client</h1>
  <button onclick="fetchGreeting()">Get Greeting</button>
  <button onclick="fetchItem()">Get Item #42</button>
  <div id="result"></div>
  <script>
    const API_BASE = "http://localhost:8000";
    async function fetchGreeting() {
      const res = await fetch(API_BASE + "/");
      const data = await res.json();
      document.getElementById("result").innerHTML = "<strong>Greeting:</strong> " + data.message;
    }
    async function fetchItem() {
      const res = await fetch(API_BASE + "/items/42?q=search");
      const data = await res.json();
      document.getElementById("result").innerHTML = "<strong>Item ID:</strong> " + data.item_id + "<br><strong>Query:</strong> " + (data.q || "none");
    }
  </script>
</body>
</html>`,
            language: 'html',
            whatHappened: [
              'The browser sends a GET request to your FastAPI backend',
              'FastAPI validates path parameters and query parameters automatically',
              'The response JSON is received and rendered dynamically in the page'
            ],
            tryToBreak: [
              'Change the URL to /items/not-a-number — FastAPI returns a 422 validation error',
              'Try calling from a different port — you\'ll see a CORS error (fixed in Module 3)'
            ]
          },
          corsNote: 'You need to enable CORS on your FastAPI app before calling it from a browser on a different origin. We cover this in Module 3: Middleware & CORS.'
        }
      },
      'm1-first-endpoint': {
        frontendIntegration: {
          title: 'Interactive Frontend for Your First API',
          vanillaHtml: {
            title: 'Book Browser with Fetch API',
            description: 'An HTML frontend that lists books and adds new ones via your FastAPI Book API',
            code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Book API Client</title>
  <style>
    body { font-family: system-ui; max-width: 700px; margin: 2rem auto; }
    .book { padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px; margin: 0.5rem 0; }
    input { padding: 0.4rem; border: 1px solid #cbd5e1; border-radius: 4px; margin: 0.25rem; }
    button { background: #0d9488; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; }
  </style>
</head>
<body>
  <h1>Book API Client</h1>
  <div>
    <input id="title" placeholder="Title">
    <input id="author" placeholder="Author">
    <input id="year" placeholder="Year" type="number">
    <button onclick="addBook()">Add Book</button>
  </div>
  <h2>All Books</h2>
  <div id="books"></div>
  <script>
    const API = "http://localhost:8000";
    async function loadBooks() {
      const res = await fetch(API + "/books");
      const books = await res.json();
      document.getElementById("books").innerHTML = books
        .map(b => '<div class="book"><strong>' + b.title + '</strong> by ' + b.author + ' (' + b.year + ')</div>')
        .join("");
    }
    async function addBook() {
      const data = { title: document.getElementById("title").value, author: document.getElementById("author").value, year: parseInt(document.getElementById("year").value) };
      await fetch(API + "/books?" + new URLSearchParams(data), { method: "POST" });
      loadBooks();
    }
    loadBooks();
  </script>
</body>
</html>`,
            language: 'html',
            whatHappened: [
              'loadBooks() fetches GET /books and renders each book',
              'addBook() sends a POST request to create a new book',
              'After adding, the book list refreshes automatically'
            ],
            tryToBreak: [
              'Leave the year field empty — FastAPI returns 422 because year must be int',
              'Try adding a book with curl to verify data persists'
            ]
          },
          corsNote: 'This frontend runs on a different port than FastAPI. Add CORSMiddleware to allow cross-origin requests.'
        }
      },
      'm1-http-methods': {
        frontendIntegration: {
          title: 'Full CRUD Frontend for Task Manager',
          vanillaHtml: {
            title: 'Task Manager UI with All HTTP Methods',
            description: 'A complete CRUD frontend using GET, POST, PATCH, and DELETE',
            code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Task Manager</title>
  <style>
    body { font-family: system-ui; max-width: 700px; margin: 2rem auto; }
    .task { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; border: 1px solid #e2e8f0; border-radius: 6px; margin: 0.3rem 0; }
    .done { text-decoration: line-through; opacity: 0.6; }
    button { background: #0d9488; color: white; border: none; padding: 0.3rem 0.6rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem; }
    .del { background: #ef4444; }
    input { padding: 0.4rem; border: 1px solid #cbd5e1; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>Task Manager</h1>
  <div style="margin-bottom:1rem">
    <input id="title" placeholder="Task title">
    <input id="desc" placeholder="Description">
    <button onclick="createTask()">Add Task</button>
  </div>
  <div id="tasks"></div>
  <script>
    const API = "http://localhost:8000/tasks";
    async function loadTasks() {
      const res = await fetch(API);
      const tasks = await res.json();
      document.getElementById("tasks").innerHTML = tasks.map(t =>
        '<div class="task ' + (t.completed ? 'done' : '') + '">' +
        '<input type="checkbox" ' + (t.completed ? 'checked' : '') + ' onchange="toggleTask(' + t.id + ', this.checked)">' +
        '<span>' + t.title + '</span>' +
        '<button onclick="deleteTask(' + t.id + ')" class="del">Delete</button></div>'
      ).join("");
    }
    async function createTask() {
      const body = { title: document.getElementById("title").value };
      const desc = document.getElementById("desc").value;
      if (desc) body.description = desc;
      await fetch(API, { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body) });
      document.getElementById("title").value = "";
      document.getElementById("desc").value = "";
      loadTasks();
    }
    async function toggleTask(id, completed) {
      await fetch(API + "/" + id, { method: "PATCH", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ completed }) });
      loadTasks();
    }
    async function deleteTask(id) {
      await fetch(API + "/" + id, { method: "DELETE" });
      loadTasks();
    }
    loadTasks();
  </script>
</body>
</html>`,
            language: 'html',
            whatHappened: [
              'POST /tasks creates a new task with JSON body',
              'PATCH /tasks/{id} toggles the completed status',
              'DELETE /tasks/{id} removes the task (204 No Content)',
              'GET /tasks refreshes the list after every change'
            ],
            tryToBreak: [
              'Delete a non-existent task — you should get 404',
              'Send empty title — FastAPI returns 422 if required'
            ]
          },
          corsNote: 'PATCH and DELETE use JSON. Ensure CORS is configured and your FastAPI app accepts application/json.'
        }
      },
      'm1-installation-setup': {
        frontendIntegration: {
          title: 'Connecting a Frontend to Your Running FastAPI Server',
          vanillaHtml: {
            title: 'HTML Page for Testing FastAPI Connection',
            description: 'A simple page that connects to a running FastAPI dev server',
            code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>FastAPI Connection Test</title>
</head>
<body>
  <h1>Connection Test</h1>
  <button onclick="testConnection()">Test API</button>
  <pre id="output"></pre>
  <script>
    async function testConnection() {
      try {
        const res = await fetch("http://localhost:8000/");
        const data = await res.json();
        document.getElementById("output").textContent = "Connected! Response: " + JSON.stringify(data);
      } catch (e) {
        document.getElementById("output").textContent = "Connection failed. Is uvicorn running? Error: " + e.message;
      }
    }
  </script>
</body>
</html>`,
            language: 'html',
            whatHappened: [
              'The fetch() call attempts to reach your FastAPI server',
              'If uvicorn is running, the connection succeeds and shows the response',
              'If not, the catch block shows a helpful error message'
            ],
            tryToBreak: [
              'Stop your uvicorn server and click the button — you\'ll see a connection error',
              'Change the port from 8000 to 8001 and see the error change'
            ]
          },
          corsNote: 'Fetching / from a different origin requires CORS. For same-origin testing, serve this HTML from FastAPI directly.'
        }
      }
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════
// GENERIC ENRICHMENT for modules that don't have specific data
// ═══════════════════════════════════════════════════════════════════════

const genericEnrichment = {
  'module2-pydantic': {
    sections: {
      'What is Pydantic and Why Does It Exist?': {
        realWorldAnalogy: `Pydantic is like a bouncer at a club who checks every guest's ID at the door. Without the bouncer, anyone could walk in — minors, people with fake IDs, or people who don't belong. With Pydantic, every piece of data is checked at the boundary before it enters your system, so your business logic can trust it completely.`,
        commonMistakes: [
          { mistake: 'Using isinstance() checks instead of Pydantic for validation', fix: 'Pydantic provides detailed error messages, coercion, and nested validation. isinstance() only checks the top-level type with no error details.' },
          { mistake: 'Validating data in multiple places throughout the codebase', fix: 'Validate once at the boundary (API endpoint) with Pydantic, then trust the types everywhere else. This is the "parse, don\'t validate" principle.' }
        ],
        interviewQuestions: [
          { question: 'What does "validate at the boundary" mean?', answer: 'Validate data once when it enters your system (API endpoint, config loading), then trust the types throughout your code. This eliminates redundant validation and makes internal code simpler.' },
          { question: 'Why is Pydantic better than manual if/else validation?', answer: 'Pydantic provides automatic coercion, detailed error messages, JSON Schema generation, and nesting — all from type annotations. Manual validation is repetitive, error-prone, and doesn\'t generate documentation.' }
        ],
        proTips: [
          'Use Pydantic for any data boundary: API requests, config files, CLI arguments, database rows. If data comes from outside your code, validate it with Pydantic.',
          'The "parse, don\'t validate" principle means your internal functions should never check types — they should trust that the data was validated at the boundary.'
        ]
      },
      'The Rust Revolution: Pydantic V2 Core Architecture': {
        realWorldAnalogy: `Pydantic V2's Rust core is like replacing a bicycle courier (Python validation) with a high-speed train (Rust validation). The destination is the same — validated data — but the train gets there 5-50x faster. You still buy the same ticket (use the same Python API), but the journey is dramatically quicker.`,
        commonMistakes: [
          { mistake: 'Trying to use Pydantic V1 API methods in V2', fix: 'V2 renamed methods: .dict() → .model_dump(), .parse_obj() → .model_validate(), .schema() → .model_json_schema(). Use the V2 API.' },
          { mistake: 'Thinking you need to learn Rust to use Pydantic V2', fix: 'You never write or read Rust. The Python API is the same or better. The Rust engine is an invisible performance boost.' }
        ],
        interviewQuestions: [
          { question: 'How much faster is Pydantic V2 than V1?', answer: '5-50x faster depending on model complexity. Simple models see ~5x improvement, deeply nested models with many fields see ~50x.' },
          { question: 'What is pydantic-core and why is it written in Rust?', answer: 'pydantic-core is the validation engine compiled as a native Python extension via PyO3. Rust provides memory safety, zero-cost abstractions, and performance close to C.' }
        ],
        proTips: [
          'Use model_validate_json() instead of json.loads() + model_validate(). The Rust engine handles both parsing and validation in a single optimized pass.',
          'The V2 migration guide at docs.pydantic.dev/latest/migration/ covers every API change. Most projects migrate in under an hour.'
        ]
      },
      'The Pydantic V2 Validation Pipeline': {
        realWorldAnalogy: `The validation pipeline is like an assembly line in a factory. Raw materials enter (input data), pass through quality checkpoints (before validators), get shaped by machines (type coercion), pass through final inspections (after validators), and receive an overall quality stamp (model validators) before leaving as a finished product (model instance).`,
        commonMistakes: [
          { mistake: 'Putting validation that needs typed values in mode="before" validators', fix: 'Use mode="before" only for preprocessing raw input (strip whitespace, normalize formats). Use mode="after" for checks on already-typed values.' },
          { mistake: 'Forgetting @classmethod on field_validator decorators', fix: 'Pydantic V2 requires @classmethod on field_validator methods. Omitting it causes a confusing TypeError.' }
        ],
        interviewQuestions: [
          { question: 'What is the order of the Pydantic V2 validation pipeline?', answer: 'Field matching → defaults → before validators → type coercion → after validators → model validators → instance creation.' },
          { question: 'When would you use mode="before" vs mode="after" on a field_validator?', answer: 'Use mode="before" to preprocess raw input before type coercion (e.g., strip whitespace). Use mode="after" to validate the already-coerced typed value (e.g., check age range).' }
        ],
        proTips: [
          'Use model_validator(mode="after") for cross-field validation like "if role is admin, age must be 18+". It runs after all field validators and has access to the full typed model.',
          'Print statements in validators show the pipeline order during development — remove them before production.'
        ]
      },
      'Creating Your First Pydantic Models': {
        realWorldAnalogy: `A Pydantic model is like a form template at a government office. Each field has a specific format (type), some are required (name, address) and some are optional with defaults (middle name = None). If you fill in the wrong type — writing "abc" in the date field — the clerk rejects the form immediately with a clear explanation of what's wrong.`,
        commonMistakes: [
          { mistake: 'Using Optional[type] without a default value', fix: 'Optional[str] means "str or None" but the field is still REQUIRED without a default. Use Optional[str] = None or str | None = None to make it truly optional.' },
          { mistake: 'Expecting Pydantic to validate nested dicts without defining nested models', fix: 'Define a separate BaseModel for each nested structure and use it as the field type. Pydantic validates recursively through nested models.' }
        ],
        interviewQuestions: [
          { question: 'What is the difference between Optional[str] and Optional[str] = None?', answer: 'Optional[str] means the field accepts str or None, but it\'s still REQUIRED (no default). Optional[str] = None makes it truly optional with None as default.' },
          { question: 'How does Pydantic handle type coercion?', answer: 'Pydantic coerces compatible types automatically: "30" → 30 (str to int), "yes" → True (truthy string to bool), "9.99" → 9.99 (str to float). Incompatible values raise ValidationError.' }
        ],
        proTips: [
          'In Python 3.10+, use str | None = None instead of Optional[str] = None. It\'s cleaner and more modern.',
          'Use model_config = ConfigDict(strict=True) to disable coercion and enforce exact types. This is useful for security-sensitive APIs where "30" should NOT become 30.'
        ]
      },
      'model_validate: Parsing from Dicts, JSON & More': {
        realWorldAnalogy: `model_validate is like a universal adapter for foreign plugs. No matter what format your data comes in (dict, JSON string, ORM object), the adapter converts it to the same validated model instance. You don't need separate code for each format — one method handles all of them.`,
        commonMistakes: [
          { mistake: 'Using json.loads() then model_validate() instead of model_validate_json()', fix: 'model_validate_json() is 2-3x faster because the Rust engine handles both JSON parsing and validation in a single pass.' },
          { mistake: 'Using model_construct() when you need validation', fix: 'model_construct() skips validation entirely. Only use it when data is already trusted (e.g., from your own database). For any external data, use model_validate().' }
        ],
        interviewQuestions: [
          { question: 'When should you use model_construct() instead of model_validate()?', answer: 'Use model_construct() only for trusted data that doesn\'t need validation, like loading from your own database. It skips all validation for maximum speed.' },
          { question: 'What is the V1 to V2 method mapping for parsing?', answer: 'parse_obj → model_validate, parse_raw → model_validate_json, dict → model_dump, schema → model_json_schema, json → model_dump_json.' }
        ],
        proTips: [
          'FastAPI calls model_validate() internally when processing request bodies — you rarely call it yourself in endpoint code.',
          'model_validate_json() is one of the biggest performance wins in V2. Use it whenever you have a raw JSON string.'
        ]
      },
      'model_dump: Serialization & Export': {
        realWorldAnalogy: `model_dump is like a photocopy machine with filters. By default, it copies everything. But you can apply filters: "only copy what I wrote" (exclude_unset), "skip the blank pages" (exclude_defaults), "remove the blank pages" (exclude_none), or "black out sensitive sections" (exclude={"password"}).`,
        commonMistakes: [
          { mistake: 'Using .dict() which is deprecated in V2', fix: 'Use .model_dump() instead. .dict() still works but is deprecated and will be removed in a future version.' },
          { mistake: 'Not using exclude_unset=True for PATCH endpoint payloads', fix: 'exclude_unset=True is essential for PATCH — it returns only the fields the client actually sent, not fields that defaulted to None.' }
        ],
        interviewQuestions: [
          { question: 'What is the difference between exclude_unset and exclude_defaults?', answer: 'exclude_unset omits fields not explicitly provided by the caller (even if they have non-None defaults). exclude_defaults omits fields that equal their default values.' },
          { question: 'How do you exclude specific fields from serialization?', answer: 'Use model_dump(exclude={"password", "secret"}) to omit specific fields, or model_dump(include={"name", "email"}) to include only specific fields.' }
        ],
        proTips: [
          'Combine options: model_dump(exclude_unset=True, exclude_none=True) gives you the most compact representation for API responses.',
          'model_dump_json() is 2-5x faster than json.dumps(model_dump()) because the Rust engine handles serialization natively.'
        ]
      },
      'Field() Basics: Constraints & Metadata': {
        realWorldAnalogy: `Field() constraints are like the rules on a form: "minimum 3 characters" (min_length=3), "must be positive" (gt=0), "format: ABC-1234" (pattern). Without these rules, people submit garbage data. With them, you get clean, consistent data every time.`,
        commonMistakes: [
          { mistake: 'Using gt=0 when you mean ge=0 (allowing zero)', fix: 'gt=0 means strictly greater than zero (excludes 0). ge=0 means greater than or equal to zero (includes 0). Use ge=0 for non-negative numbers.' },
          { mistake: 'Not adding description and examples to API model fields', fix: 'Always add description and examples — they appear in Swagger UI and help API consumers understand your API without reading separate docs.' }
        ],
        interviewQuestions: [
          { question: 'What is the difference between gt and ge in Field()?', answer: 'gt means "strictly greater than" (gt=0 excludes 0). ge means "greater than or equal to" (ge=0 includes 0). Same for lt vs le.' },
          { question: 'How do Field() constraints affect the OpenAPI schema?', answer: 'All constraints (gt, lt, min_length, pattern, etc.) are reflected in the generated JSON Schema and shown in Swagger UI. minLength becomes a validation hint, pattern shows the regex, etc.' }
        ],
        proTips: [
          'The pattern constraint is automatically anchored in V2 — you don\'t need ^ and $ in your regex. pattern=r"[A-Z]{3}" matches the entire string.',
          'Use Field(alias="camelCase") for APIs that use camelCase naming while keeping Python snake_case internally. Set by_alias=True in model_dump() for output.'
        ]
      },
      'Default Values and Default Factory': {
        realWorldAnalogy: `default is like a pre-printed value on a form (every copy starts with "USA" in the country field). default_factory is like a stamp that generates a fresh value each time (a new serial number on every form). Using a mutable default directly (like tags: list = []) is like giving everyone the same shared piece of paper — when one person writes on it, everyone sees the change.`,
        commonMistakes: [
          { mistake: 'Using mutable defaults directly (tags: list = [])', fix: 'Use default_factory=list: tags: list = Field(default_factory=list). Without default_factory, all instances share the same list object.' },
          { mistake: 'Calling a function as default instead of passing the callable', fix: 'Use default_factory=uuid.uuid4 (no parentheses), not default=uuid.uuid4() (with parentheses). The factory is called each time; the direct call is evaluated once at class definition.' }
        ],
        interviewQuestions: [
          { question: 'Why can\'t you use a mutable default like list directly in a Pydantic field?', answer: 'Because all instances would share the same list object. Modifying it on one instance would affect all others. Use default_factory=list to create a fresh list for each instance.' },
          { question: 'When should you use default vs default_factory?', answer: 'Use default for immutable values (strings, numbers, None). Use default_factory for mutable values (list, dict, set) or dynamic values (uuid4, datetime.now) that need fresh creation per instance.' }
        ],
        proTips: [
          'Use default_factory=datetime.now for timestamp fields — it\'s called when the model is instantiated, not when the class is defined.',
          'For uuid fields, use id: str = Field(default_factory=lambda: str(uuid.uuid4())). This generates a unique ID for each new instance.'
        ]
      }
    },
    topics: {
      'm2-pydantic-overview': {
        frontendIntegration: {
          title: 'Sending Validated Data from a Form to FastAPI',
          vanillaHtml: {
            title: 'Form Submission with Pydantic Validation',
            description: 'HTML form that sends data to a Pydantic-validated FastAPI endpoint',
            code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Pydantic Validation Demo</title>
  <style>
    body { font-family: system-ui; max-width: 600px; margin: 2rem auto; }
    .error { color: #dc2626; background: #fef2f2; padding: 0.5rem; border-radius: 6px; margin: 0.5rem 0; }
    .success { color: #059669; background: #f0fdf4; padding: 0.5rem; border-radius: 6px; margin: 0.5rem 0; }
    input { padding: 0.4rem; border: 1px solid #cbd5e1; border-radius: 4px; margin: 0.25rem 0; width: 100%; }
    button { background: #0d9488; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; margin-top: 0.5rem; }
  </style>
</head>
<body>
  <h1>Create User</h1>
  <form id="userForm">
    <input id="name" placeholder="Full Name" required>
    <input id="email" type="email" placeholder="Email" required>
    <input id="age" type="number" placeholder="Age (13-120)" min="13" max="120">
    <button type="submit">Create User</button>
  </form>
  <div id="result"></div>
  <script>
    document.getElementById("userForm").onsubmit = async (e) => {
      e.preventDefault();
      const body = { name: document.getElementById("name").value, email: document.getElementById("email").value, age: parseInt(document.getElementById("age").value) };
      const res = await fetch("http://localhost:8000/users", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body) });
      const resultDiv = document.getElementById("result");
      if (res.ok) { const data = await res.json(); resultDiv.innerHTML = '<div class="success">User created: ' + data.name + '</div>'; }
      else { const err = await res.json(); resultDiv.innerHTML = '<div class="error"><strong>Validation Errors:</strong><br>' + err.detail.map(e => e.loc.join(".") + ": " + e.msg).join("<br>") + '</div>'; }
    };
  </script>
</body>
</html>`,
            language: 'html',
            whatHappened: [
              'The form sends a JSON body to POST /users',
              'Pydantic validates each field automatically',
              'Validation errors show the exact field location and message'
            ],
            tryToBreak: [
              'Set age to 5 — Pydantic rejects it (must be >= 13)',
              'Enter invalid email — validation error for email format'
            ]
          },
          corsNote: 'POST requests with JSON need CORS configured on your FastAPI app.'
        }
      },
      'm2-basemodel': {
        frontendIntegration: {
          title: 'Product Form with Type Coercion Demo',
          vanillaHtml: {
            title: 'See Pydantic Coerce String Inputs to Proper Types',
            description: 'A form that sends strings for price/quantity and lets Pydantic coerce them',
            code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Pydantic Coercion Demo</title>
  <style>
    body { font-family: system-ui; max-width: 600px; margin: 2rem auto; }
    input { padding: 0.4rem; border: 1px solid #cbd5e1; border-radius: 4px; margin: 0.3rem 0; width: 100%; }
    button { background: #0d9488; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; }
    pre { background: #1e293b; color: #e2e8f0; padding: 1rem; border-radius: 8px; }
  </style>
</head>
<body>
  <h1>Product Creator</h1>
  <p>Try "9.99" for price — Pydantic coerces it to float!</p>
  <input id="name" placeholder="Product name">
  <input id="price" placeholder='Price (try "9.99")'>
  <input id="qty" placeholder='Quantity (try "5")'>
  <button onclick="createProduct()">Create</button>
  <pre id="result"></pre>
  <script>
    async function createProduct() {
      const body = { name: document.getElementById("name").value, price: document.getElementById("price").value, quantity: document.getElementById("qty").value };
      const res = await fetch("http://localhost:8000/products", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body) });
      const data = await res.json();
      document.getElementById("result").textContent = JSON.stringify(data, null, 2);
    }
  </script>
</body>
</html>`,
            language: 'html',
            whatHappened: [
              'Strings are sent for price and quantity',
              'Pydantic coerces "9.99" to 9.99 (float) and "5" to 5 (int)',
              'If coercion fails, a 422 error is returned'
            ],
            tryToBreak: [
              'Enter "free" for price — coercion fails',
              'Leave name empty — required field validation triggers'
            ]
          },
          corsNote: 'Sends JSON to FastAPI. Enable CORS for cross-origin requests.'
        }
      },
      'm2-field-constraints': {
        frontendIntegration: {
          title: 'Registration Form with Field Constraint Validation',
          vanillaHtml: {
            title: 'Live Validation Feedback from Field() Constraints',
            description: 'A form that demonstrates Field() constraints like min_length, pattern, ge/le',
            code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Field Constraints Demo</title>
  <style>
    body { font-family: system-ui; max-width: 600px; margin: 2rem auto; }
    input { padding: 0.4rem; border: 1px solid #cbd5e1; border-radius: 4px; margin: 0.3rem 0; width: 100%; }
    button { background: #0d9488; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; }
    .hint { font-size: 0.8rem; color: #64748b; }
    .error { color: #dc2626; font-size: 0.85rem; }
  </style>
</head>
<body>
  <h1>Registration (Field Constraints)</h1>
  <input id="username" placeholder="Username (3-20 chars, alphanumeric)">
  <div class="hint">3-20 characters, letters/numbers/underscore only</div>
  <input id="email" type="email" placeholder="Email">
  <input id="age" type="number" placeholder="Age (13-120)">
  <div class="hint">Must be 13-120</div>
  <button onclick="register()">Register</button>
  <div id="result"></div>
  <script>
    async function register() {
      const body = { username: document.getElementById("username").value, email: document.getElementById("email").value, age: parseInt(document.getElementById("age").value) };
      const res = await fetch("http://localhost:8000/register", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body) });
      const data = await res.json();
      const div = document.getElementById("result");
      if (res.ok) { div.innerHTML = "<div style='color:#059669'>Success!</div>"; }
      else { div.innerHTML = data.detail.map(e => '<div class="error">' + e.loc.join(".") + ": " + e.msg + '</div>').join(""); }
    }
  </script>
</body>
</html>`,
            language: 'html',
            whatHappened: [
              'Each field has HTML hints matching Pydantic constraints',
              'FastAPI validates username (min_length=3, pattern), age (ge=13, le=120)',
              'Validation errors show the exact field and constraint that failed'
            ],
            tryToBreak: [
              '2-character username — min_length triggers',
              'Username with special chars — pattern rejects'
            ]
          },
          corsNote: 'Form posts JSON to FastAPI. Enable CORS for cross-origin requests.'
        }
      }
    }
  }
};

// Merge generic into enrichment
Object.assign(enrichmentData, genericEnrichment);

// ═══════════════════════════════════════════════════════════════════════
// INJECTION ENGINE
// ═══════════════════════════════════════════════════════════════════════

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildTsValue(value, indent = '        ') {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') {
    // Escape backticks and ${ in template strings
    const escaped = value.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
    return '`' + escaped + '`';
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const items = value.map(v => buildTsValue(v, indent + '  '));
    return '[\n' + items.map(item => indent + '  ' + item).join(',\n') + ',\n' + indent + ']';
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) return '{}';
    const props = entries.map(([key, val]) => {
      const keyStr = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`;
      return indent + '  ' + keyStr + ': ' + buildTsValue(val, indent + '  ');
    });
    return '{\n' + props.join(',\n') + ',\n' + indent + '}';
  }
  return String(value);
}

function addSectionEnrichment(content, sectionHeading, enrichment) {
  // Find the section by its heading
  const headingEscaped = escapeRegex(sectionHeading);
  
  // Pattern: find the heading, then look for keyTakeaway after it
  // We insert our fields after keyTakeaway (or after the last known field)
  const headingPattern = new RegExp(`heading: [\\'\\"]${headingEscaped}[\\'\\"]`);
  
  if (!headingPattern.test(content)) {
    console.log(`  WARNING: Section "${sectionHeading}" not found`);
    return content;
  }

  // Check if this section already has realWorldAnalogy
  // Find the section block - from heading to next section or closing
  const headingMatch = content.match(headingPattern);
  if (!headingMatch) return content;

  const headingIndex = content.indexOf(headingMatch[0]);
  
  // Find the end of this section (next heading: or closing of sections array)
  const afterHeading = content.substring(headingIndex);
  
  // Look for keyTakeaway in this section
  const keyTakeawayMatch = afterHeading.match(/keyTakeaway:\s*[`'"].*?[`'"][,\s]*/);
  
  if (keyTakeawayMatch) {
    const insertPoint = headingIndex + keyTakeawayMatch.index + keyTakeawayMatch[0].length;
    
    // Check if already has realWorldAnalogy after keyTakeaway
    const afterKeyTakeaway = content.substring(insertPoint, insertPoint + 200);
    if (afterKeyTakeaway.includes('realWorldAnalogy')) {
      console.log(`  SKIP: "${sectionHeading}" already has realWorldAnalogy`);
      return content;
    }
    
    // Build enrichment string
    let enrichmentStr = '';
    
    if (enrichment.realWorldAnalogy) {
      enrichmentStr += `\n          realWorldAnalogy: ${buildTsValue(enrichment.realWorldAnalogy, '          ')},`;
    }
    if (enrichment.commonMistakes) {
      enrichmentStr += `\n          commonMistake: ${buildTsValue(enrichment.commonMistakes, '          ')},`;
    }
    if (enrichment.interviewQuestions) {
      enrichmentStr += `\n          interviewQuestions: ${buildTsValue(enrichment.interviewQuestions, '          ')},`;
    }
    if (enrichment.proTips) {
      enrichmentStr += `\n          proTips: ${buildTsValue(enrichment.proTips, '          ')},`;
    }
    
    if (enrichmentStr) {
      content = content.substring(0, insertPoint) + enrichmentStr + content.substring(insertPoint);
      console.log(`  ADDED enrichment to "${sectionHeading}"`);
    }
  } else {
    console.log(`  WARNING: Could not find keyTakeaway in "${sectionHeading}"`);
  }
  
  return content;
}

function addFrontendIntegration(content, topicId, fiData) {
  // Find the topic by id
  const idPattern = `id: '${topicId}'`;
  const idIndex = content.indexOf(idPattern);
  if (idIndex === -1) {
    console.log(`  WARNING: Topic "${topicId}" not found`);
    return content;
  }

  // Check if this topic already has frontendIntegration
  // Find the sections array end for this topic
  const afterId = content.substring(idIndex);
  if (afterId.includes('frontendIntegration')) {
    console.log(`  SKIP: Topic "${topicId}" already has frontendIntegration`);
    return content;
  }

  // Find the closing of the sections array - look for the pattern after sections
  // We need to add frontendIntegration after the sections array closes
  // Pattern: find the end of the sections: [...] block, then insert before the topic closing

  // Strategy: find "sections: [" then match the closing "]"
  const sectionsStart = afterId.indexOf('sections:');
  if (sectionsStart === -1) {
    console.log(`  WARNING: No sections array in topic "${topicId}"`);
    return content;
  }

  // Find the closing of the sections array by counting brackets
  let depth = 0;
  let sectionsEnd = -1;
  const searchFrom = afterId.indexOf('[', sectionsStart);
  
  for (let i = searchFrom; i < afterId.length; i++) {
    if (afterId[i] === '[') depth++;
    else if (afterId[i] === ']') {
      depth--;
      if (depth === 0) {
        sectionsEnd = i;
        break;
      }
    }
  }

  if (sectionsEnd === -1) {
    console.log(`  WARNING: Could not find sections array end in "${topicId}"`);
    return content;
  }

  // Insert frontendIntegration after the sections array closing
  const insertPoint = idIndex + sectionsEnd + 1;
  const fiStr = `,\n      frontendIntegration: ${buildTsValue(fiData, '      ')}`;
  
  content = content.substring(0, insertPoint) + fiStr + content.substring(insertPoint);
  console.log(`  ADDED frontendIntegration to "${topicId}"`);
  
  return content;
}

// ═══════════════════════════════════════════════════════════════════════
// PROCESS ALL MODULES
// ═══════════════════════════════════════════════════════════════════════

for (const [moduleName, moduleData] of Object.entries(enrichmentData)) {
  const filePath = path.join(CURRICULUM_DIR, `${moduleName}.ts`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`\nFile not found: ${filePath}`);
    continue;
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Processing: ${moduleName}.ts`);
  console.log('='.repeat(60));

  let content = fs.readFileSync(filePath, 'utf-8');

  // Process section enrichments
  if (moduleData.sections) {
    for (const [sectionHeading, enrichment] of Object.entries(moduleData.sections)) {
      content = addSectionEnrichment(content, sectionHeading, enrichment);
    }
  }

  // Process topic frontendIntegration
  if (moduleData.topics) {
    for (const [topicId, topicData] of Object.entries(moduleData.topics)) {
      if (topicData.frontendIntegration) {
        content = addFrontendIntegration(content, topicId, topicData.frontendIntegration);
      }
    }
  }

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`  Saved: ${filePath}`);
}

console.log('\n\nDone! All enrichments applied.');
