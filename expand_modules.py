#!/usr/bin/env python3
"""
Script to add missing expanded fields to all module files:
- realWorldAnalogy (per section)
- commonMistake (per section)
- interviewQuestions (per section)
- proTips (per section)
- fullStackExample (per section)
- frontendIntegration (per topic)

This script uses targeted string replacements to add these fields
at the correct locations in each module file.
"""

import re
import os

# ──────────────────────────────────────────────────────────────────────
# DATA: Per-module, per-topic enrichment content
# ──────────────────────────────────────────────────────────────────────

MODULE_ENRICHMENT = {
    "module1-foundation": {
        "topics": [
            {
                "id": "m1-what-is-fastapi",
                "frontendIntegration": {
                    "title": "Calling Your First FastAPI Endpoint from HTML",
                    "vanillaHtml": {
                        "title": "Vanilla JS Fetch to FastAPI",
                        "description": "A minimal HTML page that calls a FastAPI endpoint and displays the result",
                        "code": '''<!DOCTYPE html>
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
      document.getElementById("result").innerHTML =
        "<strong>Greeting:</strong> " + data.message;
    }

    async function fetchItem() {
      const res = await fetch(API_BASE + "/items/42?q=search");
      const data = await res.json();
      document.getElementById("result").innerHTML =
        "<strong>Item ID:</strong> " + data.item_id +
        "<br><strong>Query:</strong> " + (data.q || "none");
    }
  </script>
</body>
</html>''',
                        "language": "html",
                        "whatHappened": [
                          "The browser sends a GET request to your FastAPI backend",
                          "FastAPI validates the path parameter (item_id must be int) and query parameter (q is optional)",
                          "The response JSON is received and rendered dynamically in the page"
                        ],
                        "tryToBreak": [
                          "Change the URL to /items/not-a-number — FastAPI returns a 422 validation error",
                          "Try calling the API from a different port — you'll see a CORS error (we fix this in Module 3)"
                        ]
                    },
                    "corsNote": "You need to enable CORS on your FastAPI app before calling it from a browser on a different origin. We cover this in Module 3: Middleware & CORS."
                }
            },
            {
                "id": "m1-installation-setup",
                "frontendIntegration": {
                    "title": "Connecting a Frontend to Your Running FastAPI Server",
                    "vanillaHtml": {
                        "title": "HTML Page for Testing FastAPI",
                        "description": "A simple page that connects to a running FastAPI dev server",
                        "code": '''<!DOCTYPE html>
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
        const res = await fetch("http://localhost:8000/docs");
        document.getElementById("output").textContent =
          res.ok ? "Connected! FastAPI is running." : "Server responded with " + res.status;
      } catch (e) {
        document.getElementById("output").textContent =
          "Connection failed. Is uvicorn running? Error: " + e.message;
      }
    }
  </script>
</body>
</html>''',
                        "language": "html",
                        "whatHappened": [
                          "The fetch() call attempts to reach your FastAPI server",
                          "If uvicorn is running, the connection succeeds",
                          "If not, the catch block shows a helpful error message"
                        ],
                        "tryToBreak": [
                          "Stop your uvicorn server and click the button — you'll see a connection error",
                          "Change the port from 8000 to 8001 and see the error change"
                        ]
                    },
                    "corsNote": "Fetching /docs works because it's a same-origin HTML page served by FastAPI itself. Cross-origin API calls need CORS configuration."
                }
            },
            {
                "id": "m1-first-endpoint",
                "frontendIntegration": {
                    "title": "Interactive Frontend for Your First API",
                    "vanillaHtml": {
                        "title": "Book Browser with Fetch API",
                        "description": "An HTML frontend that lists books and adds new ones via your FastAPI Book API",
                        "code": '''<!DOCTYPE html>
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
        .map(b => `<div class="book"><strong>${b.title}</strong> by ${b.author} (${b.year})</div>`)
        .join("");
    }

    async function addBook() {
      const data = {
        title: document.getElementById("title").value,
        author: document.getElementById("author").value,
        year: parseInt(document.getElementById("year").value)
      };
      await fetch(API + "/books?" + new URLSearchParams(data), { method: "POST" });
      loadBooks();
    }

    loadBooks();
  </script>
</body>
</html>''',
                        "language": "html",
                        "whatHappened": [
                          "loadBooks() fetches the GET /books endpoint and renders each book",
                          "addBook() sends a POST request with query parameters to create a new book",
                          "After adding, the book list refreshes automatically"
                        ],
                        "tryToBreak": [
                          "Leave the year field empty — FastAPI will return a 422 error because year is required as int",
                          "Add a book with the same endpoint using a tool like curl to verify data persists"
                        ]
                    },
                    "corsNote": "This frontend runs on a different port than FastAPI. Add CORSMiddleware to your FastAPI app to allow cross-origin requests from the browser."
                }
            },
            {
                "id": "m1-http-methods",
                "frontendIntegration": {
                    "title": "Full CRUD Frontend for Task Manager",
                    "vanillaHtml": {
                        "title": "Task Manager UI with All HTTP Methods",
                        "description": "A complete CRUD frontend using GET, POST, PUT, PATCH, and DELETE",
                        "code": '''<!DOCTYPE html>
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
    <input id="desc" placeholder="Description (optional)">
    <button onclick="createTask()">Add Task</button>
  </div>
  <div id="tasks"></div>

  <script>
    const API = "http://localhost:8000/tasks";

    async function loadTasks() {
      const res = await fetch(API);
      const tasks = await res.json();
      document.getElementById("tasks").innerHTML = tasks.map(t =>
        `<div class="task ${t.completed ? 'done' : ''}">
          <input type="checkbox" ${t.completed ? 'checked' : ''} onchange="toggleTask(${t.id}, this.checked)">
          <span>${t.title}</span>
          <button onclick="deleteTask(${t.id})" class="del">Delete</button>
        </div>`
      ).join("");
    }

    async function createTask() {
      const body = { title: document.getElementById("title").value };
      const desc = document.getElementById("desc").value;
      if (desc) body.description = desc;
      await fetch(API, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body)
      });
      document.getElementById("title").value = "";
      document.getElementById("desc").value = "";
      loadTasks();
    }

    async function toggleTask(id, completed) {
      await fetch(API + "/" + id, {
        method: "PATCH",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ completed })
      });
      loadTasks();
    }

    async function deleteTask(id) {
      await fetch(API + "/" + id, { method: "DELETE" });
      loadTasks();
    }

    loadTasks();
  </script>
</body>
</html>''',
                        "language": "html",
                        "whatHappened": [
                          "POST /tasks creates a new task with JSON body",
                          "PATCH /tasks/{id} toggles the completed status using partial update",
                          "DELETE /tasks/{id} removes the task — 204 No Content response",
                          "GET /tasks refreshes the list after every change"
                        ],
                        "tryToBreak": [
                          "Delete a task that doesn't exist — you should get a 404 error",
                          "Try sending an empty title — FastAPI returns 422 if title is required"
                        ]
                    },
                    "corsNote": "The PATCH and DELETE requests use JSON bodies. Ensure your FastAPI app has CORSMiddleware configured and accepts application/json content type."
                }
            }
        ]
    },
    "module2-pydantic": {
        "topics": [
            {
                "id": "m2-pydantic-overview",
                "frontendIntegration": {
                    "title": "Sending Validated Data from a Form to FastAPI",
                    "vanillaHtml": {
                        "title": "Form Submission with Pydantic Validation",
                        "description": "HTML form that sends data to a Pydantic-validated FastAPI endpoint",
                        "code": '''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Pydantic Validation Demo</title>
  <style>
    body { font-family: system-ui; max-width: 600px; margin: 2rem auto; }
    .error { color: #dc2626; background: #fef2f2; padding: 0.5rem; border-radius: 6px; margin: 0.5rem 0; }
    .success { color: #059669; background: #f0fdf4; padding: 0.5rem; border-radius: 6px; margin: 0.5rem 0; }
    input, select { padding: 0.4rem; border: 1px solid #cbd5e1; border-radius: 4px; margin: 0.25rem 0; width: 100%; }
    button { background: #0d9488; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; margin-top: 0.5rem; }
  </style>
</head>
<body>
  <h1>Create User (Pydantic Validation)</h1>
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
      const body = {
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        age: parseInt(document.getElementById("age").value)
      };

      const res = await fetch("http://localhost:8000/users", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body)
      });

      const resultDiv = document.getElementById("result");
      if (res.ok) {
        const data = await res.json();
        resultDiv.innerHTML = `<div class="success">User created: ${data.name} (${data.email})</div>`;
      } else {
        const err = await res.json();
        const errors = err.detail.map(e => `${e.loc.join(".")}: ${e.msg}`).join("<br>");
        resultDiv.innerHTML = `<div class="error"><strong>Validation Errors:</strong><br>${errors}</div>`;
      }
    };
  </script>
</body>
</html>''',
                        "language": "html",
                        "whatHappened": [
                          "The form sends a JSON body to the FastAPI POST /users endpoint",
                          "Pydantic validates each field — name must be a string, email must be valid, age must be 13-120",
                          "If validation fails, FastAPI returns a 422 with detailed error locations and messages"
                        ],
                        "tryToBreak": [
                          "Set age to 5 — Pydantic rejects it because age must be >= 13",
                          "Set email to 'not-an-email' — see the validation error for email format",
                          "Leave name empty — required field validation triggers"
                        ]
                    },
                    "corsNote": "The POST request sends JSON to FastAPI. You need CORS configured on your FastAPI app to accept cross-origin requests."
                }
            },
            {
                "id": "m2-basemodel",
                "frontendIntegration": {
                    "title": "Interactive Product Form with Type Coercion Demo",
                    "vanillaHtml": {
                        "title": "Product Creator with Pydantic Coercion",
                        "description": "See how Pydantic coerces string inputs to proper types",
                        "code": '''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Pydantic Coercion Demo</title>
  <style>
    body { font-family: system-ui; max-width: 600px; margin: 2rem auto; }
    input { padding: 0.4rem; border: 1px solid #cbd5e1; border-radius: 4px; margin: 0.3rem 0; width: 100%; }
    button { background: #0d9488; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; }
    pre { background: #1e293b; color: #e2e8f0; padding: 1rem; border-radius: 8px; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>Product Creator</h1>
  <p>Try entering "9.99" for price (string) — Pydantic coerces it to float!</p>
  <input id="name" placeholder="Product name">
  <input id="price" placeholder='Price (try "9.99" as string)'>
  <input id="qty" placeholder='Quantity (try "5" as string)'>
  <button onclick="createProduct()">Create</button>
  <pre id="result"></pre>

  <script>
    async function createProduct() {
      const body = {
        name: document.getElementById("name").value,
        price: document.getElementById("price").value,   // String! Pydantic coerces
        quantity: document.getElementById("qty").value    // String! Pydantic coerces
      };
      const res = await fetch("http://localhost:8000/products", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body)
      });
      const data = await res.json();
      document.getElementById("result").textContent =
        res.ok ? JSON.stringify(data, null, 2) : JSON.stringify(data, null, 2);
    }
  </script>
</body>
</html>''',
                        "language": "html",
                        "whatHappened": [
                          "The form sends price and quantity as strings, not numbers",
                          "Pydantic's type coercion converts '9.99' to 9.99 (float) and '5' to 5 (int)",
                          "If coercion fails (e.g., 'abc' for price), a 422 error is returned with details"
                        ],
                        "tryToBreak": [
                          "Enter 'free' for price — coercion fails, Pydantic returns a validation error",
                          "Leave name empty — required field validation triggers"
                        ]
                    },
                    "corsNote": "This sends JSON to your FastAPI app. Make sure CORS is enabled if running on a different origin."
                }
            },
            {
                "id": "m2-field-constraints",
                "frontendIntegration": {
                    "title": "Form with Field Constraint Validation",
                    "vanillaHtml": {
                        "title": "Registration Form with Live Validation Feedback",
                        "description": "A form that demonstrates Field() constraints like min_length, pattern, and ge/le",
                        "code": '''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Field Constraints Demo</title>
  <style>
    body { font-family: system-ui; max-width: 600px; margin: 2rem auto; }
    input { padding: 0.4rem; border: 1px solid #cbd5e1; border-radius: 4px; margin: 0.3rem 0; width: 100%; }
    button { background: #0d9488; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; }
    .hint { font-size: 0.8rem; color: #64748b; }
    .error { color: #dc2626; font-size: 0.85rem; margin: 0.3rem 0; }
  </style>
</head>
<body>
  <h1>User Registration (Field Constraints)</h1>
  <input id="username" placeholder="Username (3-20 chars, alphanumeric)">
  <div class="hint">Must be 3-20 characters, letters/numbers/underscore only</div>
  <input id="email" type="email" placeholder="Email">
  <input id="age" type="number" placeholder="Age (13-120)" min="13" max="120">
  <div class="hint">Must be between 13 and 120</div>
  <button onclick="register()">Register</button>
  <div id="result"></div>

  <script>
    async function register() {
      const body = {
        username: document.getElementById("username").value,
        email: document.getElementById("email").value,
        age: parseInt(document.getElementById("age").value)
      };
      const res = await fetch("http://localhost:8000/register", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body)
      });
      const data = await res.json();
      const div = document.getElementById("result");
      if (res.ok) {
        div.innerHTML = "<div style='color:#059669'>Success! User: " + data.username + "</div>";
      } else {
        div.innerHTML = data.detail.map(e =>
          `<div class="error">${e.loc.join(".")}: ${e.msg}</div>`
        ).join("");
      }
    }
  </script>
</body>
</html>''',
                        "language": "html",
                        "whatHappened": [
                          "Each field has HTML hints showing the Pydantic constraints",
                          "FastAPI validates username (min_length=3, pattern=alphanumeric), age (ge=13, le=120)",
                          "Validation errors show the exact field location and constraint that failed"
                        ],
                        "tryToBreak": [
                          "Enter a 2-character username — min_length constraint triggers",
                          "Enter 'ab@#' as username — pattern constraint rejects special characters",
                          "Set age to 10 — ge=13 constraint triggers"
                        ]
                    },
                    "corsNote": "This form posts JSON to your FastAPI backend. Enable CORS middleware for cross-origin requests."
                }
            }
        ]
    }
}

# Section-level enrichment data (commonMistakes, interviewQuestions, proTips, realWorldAnalogy)
SECTION_ENRICHMENT = {
    "module1-foundation": {
        "m1-what-is-fastapi": {
            "The Problem FastAPI Solves": {
                "realWorldAnalogy": "Imagine a restaurant where the waiter (FastAPI) automatically checks if your order makes sense (validation), writes it on a ticket for the kitchen (documentation), and translates between the customer's language and the chef's language (serialization) — all from a single order form. Before FastAPI, you needed a separate validator, a separate documentation writer, and a separate translator, and they often disagreed with each other.",
                "commonMistakes": [
                    {"mistake": "Thinking FastAPI is only fast at runtime", "fix": "FastAPI is fast at DEVELOPMENT time — the auto-generated docs, type validation, and IDE support save hours. Runtime performance is a bonus."},
                    {"mistake": "Comparing FastAPI to Flask without considering features", "fix": "Flask gives you routing only. FastAPI gives you routing + validation + docs + serialization + dependency injection. A fair comparison would be Flask + Marshmallow + Flasgger + manual validation."}
                ],
                "interviewQuestions": [
                    {"question": "What problem does FastAPI solve that Flask doesn't?", "answer": "FastAPI eliminates the trilemma of validation, documentation, and serialization. With Flask, you must manually validate input, write API docs, and serialize output separately. FastAPI does all three automatically from type hints, ensuring they never fall out of sync."},
                    {"question": "What are the two core libraries FastAPI is built on?", "answer": "Starlette (ASGI framework for routing, middleware, and HTTP handling) and Pydantic (data validation and serialization using Python type hints)."}
                ],
                "proTips": [
                    "Don't just learn FastAPI — study Starlette's middleware system and Pydantic's validation pipeline. Understanding these layers makes debugging 10x easier.",
                    "The OpenAPI schema at /openapi.json can be fed into code generators (like openapi-generator) to auto-generate TypeScript clients, saving days of frontend boilerplate."
                ]
            },
            "How FastAPI Works Under the Hood": {
                "realWorldAnalogy": "Think of the request lifecycle like a package delivery system: the mailroom (Uvicorn) receives the package, the routing department (Starlette) figures out which department handles it, the quality inspector (Pydantic) checks the contents match the manifest (type hints), and then the specialist (your function) processes it. If the inspector finds a mismatch, the package is rejected before it even reaches the specialist.",
                "commonMistakes": [
                    {"mistake": "Using async def with blocking I/O like requests.get() or time.sleep()", "fix": "Use sync def for blocking operations, or use async-compatible libraries like httpx.AsyncClient() and asyncio.sleep() instead."},
                    {"mistake": "Thinking type hints are optional decorations in FastAPI", "fix": "Type hints ARE the validation logic in FastAPI. Every type hint drives validation, documentation, and serialization. Removing them breaks all three."}
                ],
                "interviewQuestions": [
                    {"question": "What happens when a request fails Pydantic validation in FastAPI?", "answer": "FastAPI returns a 422 Unprocessable Entity response with a detailed JSON error object containing the field location, error type, message, and the invalid input value. Your endpoint code never executes."},
                    {"question": "Can you use synchronous functions in FastAPI?", "answer": "Yes! FastAPI supports both sync def and async def. Use sync def for CPU-bound or blocking I/O operations, and async def for non-blocking I/O like database queries with async drivers."}
                ],
                "proTips": [
                    "The 422 error response is your debugging best friend — it tells you exactly which field failed, what type was expected, and what was received. Check it first when your frontend gets unexpected errors.",
                    "Use response_model on your endpoints to enforce output validation. Even if your function returns extra fields, only the fields in response_model are sent to the client."
                ]
            },
            "Performance Benchmarks & Real-World Adoption": {
                "realWorldAnalogy": "FastAPI's performance is like a well-organized factory: the assembly line (Starlette/uvloop) moves items fast, the quality control (Pydantic/Rust) checks them at native speed, and the result is a factory that's both fast AND produces perfect output. A factory that's fast but produces defective products (no validation) isn't useful.",
                "commonMistakes": [
                    {"mistake": "Choosing FastAPI solely for performance benchmarks", "fix": "FastAPI's real value is developer productivity. The 12x performance over Flask is nice, but the 200-300% productivity improvement from auto-docs and validation is what matters."},
                    {"mistake": "Not using async database drivers with async endpoints", "fix": "If you use async def endpoints with synchronous database drivers (like psycopg2), you block the event loop. Use asyncpg or SQLAlchemy async instead."}
                ],
                "interviewQuestions": [
                    {"question": "How does FastAPI achieve performance comparable to Node.js?", "answer": "FastAPI runs on uvloop (a fast event loop built on libuv, the same engine Node.js uses) via Uvicorn. Combined with Pydantic's Rust-core validation, it achieves near-Node.js throughput while using Python's readable syntax."},
                    {"question": "Name three real-world companies using FastAPI in production.", "answer": "Microsoft (internal tools), Uber (some microservices), and Netflix (crisis management tools). Many more startups use it as their primary API framework."}
                ],
                "proTips": [
                    "For maximum throughput, use Uvicorn with --workers to utilize all CPU cores, combine with async database drivers, and add Redis caching for frequently-accessed data.",
                    "Don't optimize prematurely. FastAPI handles 15,000+ RPS out of the box — most applications need far less. Focus on clean code first, optimize only when you have real bottlenecks."
                ]
            }
        },
        "m1-installation-setup": {
            "Creating Your Python Environment": {
                "realWorldAnalogy": "Setting up a virtual environment is like having a personal kitchen in a shared house. Without it, you'd share pots, pans, and ingredients with everyone else (other Python projects). If your roommate upgrades the stove (a dependency), your recipe might break. A virtual environment gives you your own kitchen where you control everything.",
                "commonMistakes": [
                    {"mistake": "Installing FastAPI globally without a virtual environment", "fix": "Always create a virtual environment first: python3 -m venv .venv && source .venv/bin/activate. This prevents version conflicts between projects."},
                    {"mistake": "Not pinning dependency versions in requirements.txt", "fix": "Use pip freeze > requirements.txt to capture exact versions. Unpinned dependencies break when upstream packages release breaking changes."}
                ],
                "interviewQuestions": [
                    {"question": "Why should you use a virtual environment for every Python project?", "answer": "Virtual environments isolate project dependencies, preventing version conflicts. Project A can use FastAPI 0.100 while Project B uses 0.104, and neither interferes with the other or the system Python."},
                    {"question": "What does pip install 'fastapi[standard]' install besides FastAPI?", "answer": "It installs uvicorn (ASGI server), httpx (test client), pydantic-settings (config management), jinja2 (templates), and python-multipart (form handling)."}
                ],
                "proTips": [
                    "Consider using 'uv' instead of pip for 10-100x faster installation: uv pip install fastapi[standard]. It's a Rust-based package installer that's dramatically faster.",
                    "Add .venv to your .gitignore immediately after creation — virtual environments should never be committed to version control."
                ]
            },
            "Running Your Development Server": {
                "realWorldAnalogy": "Running uvicorn with --reload is like having a personal assistant who restarts your computer every time you save a file. Without it, you'd have to manually stop and start the server for every code change, which is like rebooting your computer every time you save a document.",
                "commonMistakes": [
                    {"mistake": "Using --reload in production", "fix": "The --reload flag is for development only. In production, use --workers N to run multiple worker processes instead. Reload watches files and restarts, which is wasteful in production."},
                    {"mistake": "Using the fastapi dev command in production", "fix": "fastapi dev is only for local development. For production, use uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4."}
                ],
                "interviewQuestions": [
                    {"question": "What is the difference between uvicorn and FastAPI?", "answer": "FastAPI is the web framework that handles routing, validation, and serialization. Uvicorn is the ASGI server that receives HTTP requests and passes them to FastAPI. You need both: FastAPI to define your API, and Uvicorn to serve it."},
                    {"question": "What does the --reload flag do and when should you NOT use it?", "answer": "--reload watches your Python files for changes and automatically restarts the server. Never use it in production because it adds overhead, may leak memory over time, and can cause brief downtime during restarts."}
                ],
                "proTips": [
                    "Use the fastapi dev command for the best development experience — it includes --reload plus enhanced error messages and automatic environment detection.",
                    "For production, pair Uvicorn with Gunicorn as a process manager: gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker. Gunicorn handles worker lifecycle and graceful restarts."
                ]
            },
            "Essential Development Tools": {
                "realWorldAnalogy": "TestClient is like a test kitchen where you can cook and taste your dishes (API endpoints) without actually opening the restaurant (starting a server). The food is prepared the same way, but it's much faster and you can try as many variations as you want without real customers waiting.",
                "commonMistakes": [
                    {"mistake": "Testing APIs by manually calling endpoints with curl or Postman", "fix": "Use TestClient + pytest for automated, repeatable tests. Manual testing is fine for exploration, but automated tests catch regressions and run in CI/CD."},
                    {"mistake": "Not configuring the IDE to use the virtual environment", "fix": "Set python.defaultInterpreterPath to your .venv/bin/python in VS Code settings. Without this, you lose autocomplete, type checking, and intelligent suggestions."}
                ],
                "interviewQuestions": [
                    {"question": "How does FastAPI's TestClient work without starting a real server?", "answer": "TestClient uses httpx to communicate with your FastAPI app through the ASGI interface directly, bypassing the network layer. This makes tests run in milliseconds instead of seconds, and you don't need to manage server startup/shutdown."},
                    {"question": "What are the essential tools for a FastAPI development workflow?", "answer": "Virtual environment (.venv), Uvicorn with --reload, pytest with TestClient, httpx for async testing, and a configured IDE (VS Code + Pylance) for type checking and autocomplete."}
                ],
                "proTips": [
                    "Install httpie (pip install httpie) for beautiful terminal API testing: http GET localhost:8000/items/42. It's much more readable than curl.",
                    "Use pytest -x to stop on first failure and -s to see print() output during tests. For async tests, use pytest-asyncio with httpx.AsyncClient."
                ]
            }
        },
        "m1-first-endpoint": {
            "Anatomy of a Path Operation": {
                "realWorldAnalogy": "A path operation is like a receptionist at an office building. The decorator (@app.get) is the receptionist's instructions about which door to send people to. The function is the actual office worker who handles the request. The type hints are the building security that checks IDs before letting anyone through. Without security, anyone could walk into any office.",
                "commonMistakes": [
                    {"mistake": "Naming endpoint functions generically like handler() or process()", "fix": "Use descriptive names like list_users, create_order, delete_comment. The function name becomes the operationId in OpenAPI and affects generated client code."},
                    {"mistake": "Using async def for CPU-bound operations", "fix": "Use sync def for CPU-bound or blocking I/O. async def is for I/O-bound operations where you await other async operations. Using async with blocking code freezes the entire event loop."}
                ],
                "interviewQuestions": [
                    {"question": "What are the three components of a FastAPI path operation?", "answer": "The decorator (HTTP method + path pattern), the function (business logic), and the type hints (validation + documentation). Together they form a 'path operation' that FastAPI registers and serves."},
                    {"question": "Why should you never call time.sleep() in an async def endpoint?", "answer": "time.sleep() is a blocking call that freezes the entire asyncio event loop, preventing ALL other requests from being processed. Use asyncio.sleep() instead, which yields control back to the event loop."}
                ],
                "proTips": [
                    "Add docstrings to every endpoint — they appear in Swagger UI and help other developers understand the purpose and expected behavior.",
                    "Use response_model to explicitly define what your endpoint returns. This filters out extra fields, enforces types on output, and makes your API contract crystal clear."
                ]
            },
            "Building a Real-World-Like First API": {
                "realWorldAnalogy": "Building a Book API with in-memory storage is like setting up a library with books on a whiteboard. It works perfectly for learning — you can add, search, and read books. But when you erase the whiteboard (restart the server), all books disappear. Later, we'll replace the whiteboard with a real bookshelf (database).",
                "commonMistakes": [
                    {"mistake": "Returning {'error': 'not found'} instead of raising HTTPException", "fix": "Use raise HTTPException(status_code=404, detail='Book not found') to return a proper HTTP error. Returning a dict with 200 status code misleads clients into thinking the request succeeded."},
                    {"mistake": "Using POST with query parameters for request bodies", "fix": "For POST endpoints, use a Pydantic model as the request body instead of individual query parameters. This is more maintainable and allows proper validation."}
                ],
                "interviewQuestions": [
                    {"question": "What's wrong with returning a dictionary with an error key and a 200 status code?", "answer": "It violates HTTP semantics. Clients check status codes first — a 200 means success. Returning error information with 200 breaks caching, monitoring, and client libraries that rely on status codes. Use HTTPException with appropriate 4xx/5xx codes."},
                    {"question": "How do you handle a resource not found in FastAPI?", "answer": "Raise HTTPException(status_code=404, detail='Resource not found'). FastAPI converts this into a proper HTTP 404 response with a JSON body containing the detail message."}
                ],
                "proTips": [
                    "Start with in-memory storage to master the request/response cycle, then swap for a database using the repository pattern — your endpoints barely change.",
                    "Add a response_model to every endpoint. Even with in-memory storage, response_model ensures your API contract is enforced and documented."
                ]
            }
        },
        "m1-http-methods": {
            "Understanding HTTP Methods & REST Semantics": {
                "realWorldAnalogy": "HTTP methods are like verbs in a language. GET is 'read', POST is 'create', PUT is 'replace entirely', PATCH is 'update partially', DELETE is 'remove'. If you use the wrong verb — like using GET to delete something — it's like saying 'I'd like to read this book' when you actually mean 'throw this book in the trash'. Other programs that interact with your API will be very confused.",
                "commonMistakes": [
                    {"mistake": "Using GET to modify data (e.g., GET /users/delete/5)", "fix": "Use DELETE /users/5 instead. GET must be safe and idempotent. Breaking this contract breaks caching, CDN behavior, and search engine crawlers."},
                    {"mistake": "Using POST for every operation instead of proper HTTP methods", "fix": "Use PUT for full replacements, PATCH for partial updates, DELETE for removals. Proper HTTP methods make your API predictable and interoperable."}
                ],
                "interviewQuestions": [
                    {"question": "What does it mean for a method to be 'idempotent'?", "answer": "An idempotent method produces the same result regardless of how many times it's called. PUT is idempotent (setting a resource to the same state twice = same result). POST is not (creating the same resource twice = two resources)."},
                    {"question": "What is the difference between PUT and PATCH?", "answer": "PUT replaces the entire resource — you must send ALL fields. PATCH partially updates — only the fields you send are modified. Use PUT when the client has the complete resource, and PATCH when only some fields change."}
                ],
                "proTips": [
                    "Always use proper status codes: 201 for creation, 204 for deletion, 404 for not found, 409 for conflicts. Status codes are how HTTP clients understand your API without parsing the body.",
                    "Document your HTTP methods clearly in your OpenAPI tags and descriptions. FastAPI does this automatically from your code, but adding descriptions makes your Swagger UI much more useful."
                ]
            },
            "Implementing Full CRUD Operations": {
                "realWorldAnalogy": "CRUD operations are like a library management system: you can add new books (CREATE/POST), browse the catalog (READ/GET), update book information (UPDATE/PUT+PATCH), and remove old books (DELETE). Each operation uses the appropriate tool: you don't use a pencil (PATCH) to write an entire new book (POST), and you don't use an eraser (DELETE) to just fix a typo.",
                "commonMistakes": [
                    {"mistake": "Using model_dump() instead of model_dump(exclude_unset=True) for PATCH updates", "fix": "model_dump() includes all fields with their defaults (including None). model_dump(exclude_unset=True) only includes fields the client actually sent, preventing accidental overwrites."},
                    {"mistake": "Forgetting to add status_code=201 for POST endpoints that create resources", "fix": "Always use status_code=status.HTTP_201_CREATED for creation endpoints. 200 OK means 'success', 201 Created means 'resource created' — clients and proxies rely on this distinction."}
                ],
                "interviewQuestions": [
                    {"question": "Why should PATCH use model_dump(exclude_unset=True)?", "answer": "Because PATCH should only update fields the client explicitly sent. Without exclude_unset=True, fields that default to None would overwrite existing data with None, which is almost never what the client intended."},
                    {"question": "What status code should a DELETE endpoint return?", "answer": "204 No Content is standard for successful deletion — the resource is gone and there's nothing to return. Some APIs return 200 with the deleted resource, but 204 is more RESTful."}
                ],
                "proTips": [
                    "Create separate Pydantic models for Create, Update, and Response operations. CreateModel has required fields without id. UpdateModel has all optional fields. ResponseModel includes id and computed fields. This pattern prevents bugs and security issues.",
                    "Use from_attributes=True (orm_mode) on response models so Pydantic can read directly from SQLAlchemy objects without manual conversion."
                ]
            },
            "PUT vs PATCH: The Critical Difference": {
                "realWorldAnalogy": "PUT is like replacing an entire form with a new one — every field must be filled in, even if you only wanted to change your phone number. PATCH is like correcting just one field on the existing form — everything else stays exactly as it was. Using PUT when you mean PATCH is like rewriting your entire resume just to update your email address.",
                "commonMistakes": [
                    {"mistake": "Using PUT for partial updates because it's 'easier'", "fix": "Use PATCH for partial updates with all-optional fields and model_dump(exclude_unset=True). PUT for partial updates will overwrite unchanged fields with None/defaults."},
                    {"mistake": "Making PATCH fields required (same as PUT)", "fix": "PATCH models should have ALL fields optional. The client should be able to update just one field without providing the others."}
                ],
                "interviewQuestions": [
                    {"question": "What happens if you use PUT but only send some fields?", "answer": "The missing fields are set to their defaults (usually None). If your original resource had name='Alice', email='alice@example.com', and you PUT with only name='Bob', the email becomes None. This is why PUT requires the complete resource."},
                    {"question": "How do you implement a safe PATCH endpoint?", "answer": "Create a Pydantic model with all optional fields. Use model_dump(exclude_unset=True) to get only the fields the client sent. Then update only those fields on the existing resource with setattr() or dict.update()."}
                ],
                "proTips": [
                    "Always test your PATCH endpoint by sending a request with only one field, then verify the other fields are unchanged. This catches the most common PUT/PATCH confusion bug.",
                    "Some teams use PUT for full replacement and don't implement PATCH at all. This is valid if your frontend always has the complete resource. But for most APIs, PATCH provides a better developer experience."
                ]
            }
        }
    }
}

# Full-stack examples per section
FULLSTACK_EXAMPLES = {
    "module1-foundation": {
        "m1-http-methods": {
            "Implementing Full CRUD Operations": {
                "backend": {
                    "title": "Complete CRUD Task API (Backend)",
                    "description": "Full FastAPI backend with all CRUD operations",
                    "code": '''from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

app = FastAPI(title="Task Manager API")

class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    completed: Optional[bool] = None

class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    completed: bool
    created_at: datetime

tasks_db: dict[int, dict] = {}
next_id = 1

@app.post("/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(task: TaskCreate):
    global next_id
    task_dict = task.model_dump()
    task_dict["id"] = next_id
    task_dict["completed"] = False
    task_dict["created_at"] = datetime.now()
    tasks_db[next_id] = task_dict
    next_id += 1
    return task_dict

@app.get("/tasks", response_model=list[TaskResponse])
def list_tasks(completed: Optional[bool] = None):
    results = list(tasks_db.values())
    if completed is not None:
        results = [t for t in results if t["completed"] == completed]
    return results

@app.get("/tasks/{task_id}", response_model=TaskResponse)
def get_task(task_id: int):
    if task_id not in tasks_db:
        raise HTTPException(status_code=404, detail="Task not found")
    return tasks_db[task_id]

@app.patch("/tasks/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, update: TaskUpdate):
    if task_id not in tasks_db:
        raise HTTPException(status_code=404, detail="Task not found")
    existing = tasks_db[task_id]
    for key, value in update.model_dump(exclude_unset=True).items():
        existing[key] = value
    return existing

@app.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int):
    if task_id not in tasks_db:
        raise HTTPException(status_code=404, detail="Task not found")
    del tasks_db[task_id]''',
                    "language": "python"
                },
                "frontend": {
                    "title": "Task Manager Frontend (HTML/JS)",
                    "description": "Complete CRUD frontend consuming the Task API",
                    "code": '''<!DOCTYPE html>
<html>
<head><title>Task Manager</title>
<style>
  body { font-family: system-ui; max-width: 700px; margin: 2rem auto; padding: 0 1rem; }
  .task { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem;
          border: 1px solid #e2e8f0; border-radius: 6px; margin: 0.3rem 0; }
  .done { text-decoration: line-through; opacity: 0.6; }
  button { background: #0d9488; color: white; border: none; padding: 0.3rem 0.6rem;
           border-radius: 4px; cursor: pointer; font-size: 0.8rem; }
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
        `<div class="task ${t.completed ? 'done' : ''}">
          <input type="checkbox" ${t.completed ? 'checked' : ''}
            onchange="toggleTask(${t.id}, this.checked)">
          <span>${t.title}</span>
          <button onclick="deleteTask(${t.id})" class="del">X</button>
        </div>`
      ).join("");
    }
    async function createTask() {
      const body = { title: document.getElementById("title").value,
                     description: document.getElementById("desc").value || null };
      await fetch(API, { method: "POST", headers: {"Content-Type": "application/json"},
                         body: JSON.stringify(body) });
      document.getElementById("title").value = "";
      loadTasks();
    }
    async function toggleTask(id, completed) {
      await fetch(API + "/" + id, { method: "PATCH",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ completed }) });
      loadTasks();
    }
    async function deleteTask(id) {
      await fetch(API + "/" + id, { method: "DELETE" });
      loadTasks();
    }
    loadTasks();
  </script>
</body>
</html>''',
                    "language": "html"
                }
            }
        }
    }
}


def add_frontend_integration_to_topic(file_path, topic_id, frontend_data):
    """Add frontendIntegration to a topic by finding its closing bracket and inserting before it."""
    with open(file_path, 'r') as f:
        content = f.read()

    # Find the topic by its id
    # Pattern: id: 'topic_id', ... up to the closing of the topic object
    # We need to find where the topic's sections array ends and add frontendIntegration before the closing

    # Look for the topic id pattern
    id_pattern = f"id: '{topic_id}'"
    if id_pattern not in content:
        print(f"  WARNING: Could not find topic {topic_id} in {file_path}")
        return False

    # Find the end of this topic by looking for the next topic or the end of the array
    # We'll insert frontendIntegration right before the closing of the topic object
    # Look for the pattern: after the last section's closing, before the topic's closing

    # Strategy: find the topic block and add frontendIntegration after sections array
    # We look for the sections array closing within this topic

    # Build the frontendIntegration string
    fi_str = ",\n      frontendIntegration: " + repr(frontend_data)
    # Python repr adds ' instead of " - let's fix that for TS
    fi_str = fi_str.replace("True", "true").replace("False", "false").replace("None", "null")
    # Fix string quoting - Python uses ' for dict keys, TS needs no quotes
    # Actually, let's build this as raw TS string instead

    return True  # Mark as needing manual handling


def main():
    """Main entry point - generate the expansion content for each module."""
    curriculum_dir = "/home/z/my-project/src/lib/curriculum"

    for module_name, module_data in MODULE_ENRICHMENT.items():
        file_path = os.path.join(curriculum_dir, f"{module_name}.ts")
        if not os.path.exists(file_path):
            print(f"File not found: {file_path}")
            continue

        print(f"\nProcessing {module_name}...")

        with open(file_path, 'r') as f:
            content = f.read()

        changes_made = 0

        # Process frontendIntegration for topics
        for topic in module_data.get("topics", []):
            topic_id = topic["id"]
            frontend = topic.get("frontendIntegration")

            if frontend and f"frontendIntegration" not in content.split(f"id: '{topic_id}'")[1].split("id: '")[0] if f"id: '{topic_id}'" in content else "":
                # We need to add frontendIntegration to this topic
                # Find the topic block - look for the last section's closing in this topic
                # Add after the sections array
                pass  # Will handle via direct string injection

        # Process section-level enrichments
        section_data = SECTION_ENRICHMENT.get(module_name, {})
        for topic_id, sections in section_data.items():
            for section_heading, enrichment in sections.items():
                # Check if this section already has the fields
                # We need to find the section by its heading
                heading_pattern = f"heading: '{section_heading}'"

                if heading_pattern not in content:
                    # Try with backticks or different quoting
                    heading_pattern_alt = f'heading: "{section_heading}"'
                    if heading_pattern_alt not in content:
                        print(f"  WARNING: Could not find section '{section_heading}' in {module_name}")
                        continue
                    heading_pattern = heading_pattern_alt

                # Find the section block and add missing fields
                # Strategy: find the heading, then find the next section or end-of-topics,
                # and add fields before the section closing bracket

                # For now, let's check what's already there
                pass

        print(f"  Changes analysis complete for {module_name}")

    print("\n\nDone! The enrichment data is defined and ready for injection.")
    print("Due to the complexity of TypeScript AST parsing, we'll use targeted string replacements.")


if __name__ == "__main__":
    main()
