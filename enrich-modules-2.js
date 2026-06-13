#!/usr/bin/env node
/**
 * Enrichment script Part 2 - Modules 3-7
 */

const fs = require('fs');
const path = require('path');
const CURRICULUM_DIR = path.join(__dirname, 'src/lib/curriculum');

function escapeRegex(str) { return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function buildTsValue(value, indent = '        ') {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') {
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
  const headingEscaped = escapeRegex(sectionHeading);
  const headingPattern = new RegExp(`heading: [\\'\\"]${headingEscaped}[\\'\\"]`);
  if (!headingPattern.test(content)) { console.log(`  WARNING: Section "${sectionHeading}" not found`); return content; }
  const headingMatch = content.match(headingPattern);
  if (!headingMatch) return content;
  const headingIndex = content.indexOf(headingMatch[0]);
  const afterHeading = content.substring(headingIndex);
  const keyTakeawayMatch = afterHeading.match(/keyTakeaway:\s*[`'"].*?[`'"][,\s]*/);
  if (keyTakeawayMatch) {
    const insertPoint = headingIndex + keyTakeawayMatch.index + keyTakeawayMatch[0].length;
    const afterKeyTakeaway = content.substring(insertPoint, insertPoint + 200);
    if (afterKeyTakeaway.includes('realWorldAnalogy')) { console.log(`  SKIP: "${sectionHeading}" already enriched`); return content; }
    let enrichmentStr = '';
    if (enrichment.realWorldAnalogy) enrichmentStr += `\n          realWorldAnalogy: ${buildTsValue(enrichment.realWorldAnalogy, '          ')},`;
    if (enrichment.commonMistakes) enrichmentStr += `\n          commonMistake: ${buildTsValue(enrichment.commonMistakes, '          ')},`;
    if (enrichment.interviewQuestions) enrichmentStr += `\n          interviewQuestions: ${buildTsValue(enrichment.interviewQuestions, '          ')},`;
    if (enrichment.proTips) enrichmentStr += `\n          proTips: ${buildTsValue(enrichment.proTips, '          ')},`;
    if (enrichmentStr) { content = content.substring(0, insertPoint) + enrichmentStr + content.substring(insertPoint); console.log(`  ADDED enrichment to "${sectionHeading}"`); }
  } else { console.log(`  WARNING: No keyTakeaway in "${sectionHeading}"`); }
  return content;
}

function addFrontendIntegration(content, topicId, fiData) {
  const idPattern = `id: '${topicId}'`;
  const idIndex = content.indexOf(idPattern);
  if (idIndex === -1) { console.log(`  WARNING: Topic "${topicId}" not found`); return content; }
  const afterId = content.substring(idIndex);
  if (afterId.includes('frontendIntegration')) { console.log(`  SKIP: Topic "${topicId}" already has frontendIntegration`); return content; }
  const sectionsStart = afterId.indexOf('sections:');
  if (sectionsStart === -1) return content;
  let depth = 0, sectionsEnd = -1;
  const searchFrom = afterId.indexOf('[', sectionsStart);
  for (let i = searchFrom; i < afterId.length; i++) {
    if (afterId[i] === '[') depth++;
    else if (afterId[i] === ']') { depth--; if (depth === 0) { sectionsEnd = i; break; } }
  }
  if (sectionsEnd === -1) return content;
  const insertPoint = idIndex + sectionsEnd + 1;
  const fiStr = `,\n      frontendIntegration: ${buildTsValue(fiData, '      ')}`;
  content = content.substring(0, insertPoint) + fiStr + content.substring(insertPoint);
  console.log(`  ADDED frontendIntegration to "${topicId}"`);
  return content;
}

// ═══════════════════════════════════════════════════════════════
// MODULE 3 - Advanced Routing & API Design
// ═══════════════════════════════════════════════════════════════

const module3Data = {
  sections: {
    'Splitting Your App into Router Modules': {
      realWorldAnalogy: 'APIRouter is like dividing a large company into departments. The HR department handles employees, the Sales department handles products, and the Finance department handles orders. Each department has its own procedures (routes) and specialized staff (dependencies), but they all work under the same company roof (FastAPI app).',
      commonMistakes: [
        { mistake: 'Putting all routes in main.py even as the app grows', fix: 'Split into router modules once you have more than 5-6 endpoints. Each domain (users, products, orders) gets its own file with APIRouter.' },
        { mistake: 'Forgetting to import and include routers in main.py', fix: 'Every router must be explicitly included with app.include_router(). Forgotten routers simply don\'t appear in your app.' }
      ],
      interviewQuestions: [
        { question: 'What is APIRouter and why do you need it?', answer: 'APIRouter is a miniature FastAPI instance that lets you split routes into separate modules. Each router has its own prefix, tags, and dependencies. You mount routers onto the main app with include_router().' },
        { question: 'How do router-level dependencies work?', answer: 'Dependencies specified in APIRouter(dependencies=[...]) run before every route in that router. This is perfect for authentication gates, database sessions, or logging that applies to an entire domain.' }
      ],
      proTips: [
        'Use router-level dependencies for authentication gates — every route in an admin router can be protected without adding Depends() to each endpoint.',
        'Define responses={404: {"description": "Not found"}} on your router to add default error documentation for all routes in that module.'
      ]
    },
    'Router Prefixes, Tags & Organization Patterns': {
      realWorldAnalogy: 'Router prefixes are like floor numbers in a building. The ground floor (prefix /api/v1) has the same departments (routers) as the second floor (prefix /api/v2), but they serve different versions of the company. A visitor can choose which floor to visit depending on their needs.',
      commonMistakes: [
        { mistake: 'Hard-coding version prefixes in every route path', fix: 'Use include_router(router, prefix="/api/v1") instead of putting /api/v1 in every @router.get() path. This makes version switching a one-line change.' },
        { mistake: 'Using inconsistent tag names across routers', fix: 'Define tags consistently in APIRouter(tags=["users"]) so Swagger UI groups endpoints properly. Inconsistent tags create a confusing API documentation experience.' }
      ],
      interviewQuestions: [
        { question: 'How do you version a FastAPI API?', answer: 'Use router prefixes with version segments: app.include_router(router, prefix="/api/v1"). For v2, mount the same or updated router with prefix="/api/v2". This keeps version management at the inclusion level.' },
        { question: 'What is the package-per-router pattern?', answer: 'Instead of a single users.py file, create a users/ package with routes.py, schemas.py, models.py, and services.py. This keeps all user-related code together and scales better for large teams.' }
      ],
      proTips: [
        'Layer prefixes at both the router and include level: APIRouter(prefix="/users") + include_router(router, prefix="/api/v1") = /api/v1/users/*.',
        'Use tags that match your router names and keep them consistent. Swagger UI groups endpoints by tags, so "users" and "user" would create separate groups.'
      ]
    },
    'Project Structure Best Practices': {
      realWorldAnalogy: 'Project structure is like organizing a kitchen. Routers are the serving window (HTTP layer only — take orders, return plates). Services are the chefs (business logic — decide what to cook). Repositories are the pantry (data access — fetch ingredients). You never want the server window person directly rummaging through the pantry.',
      commonMistakes: [
        { mistake: 'Putting database queries directly in route handlers', fix: 'Use the repository pattern: route → service → repository. This separates HTTP concerns from business logic and data access, making code testable and maintainable.' },
        { mistake: 'Not using pydantic-settings for configuration', fix: 'Create a BaseSettings class that reads from environment variables with type validation. This ensures consistent config across dev/staging/prod.' }
      ],
      interviewQuestions: [
        { question: 'Describe the layered architecture pattern for FastAPI.', answer: 'Routers handle HTTP (parse requests, return responses). Services contain business logic (validation, orchestration). Repositories handle data access (database queries). Each layer depends only on the layer below it.' },
        { question: 'Why should business logic not live in route handlers?', answer: 'Because it couples your business logic to HTTP concerns, making it impossible to test without HTTP, reuse in different contexts (CLI, background tasks), or swap implementations without touching your API layer.' }
      ],
      proTips: [
        'Keep routers thin — they should only parse requests and return responses. If a route handler has more than 10 lines of logic, extract it into a service.',
        'Use pydantic-settings BaseSettings with env_file=".env" for configuration. It validates types, provides defaults, and makes environment-specific settings trivial.'
      ]
    },
    'Understanding Depends() & Dependency Resolution': {
      realWorldAnalogy: 'Dependency injection is like a restaurant where the chef declares "I need fresh tomatoes" (Depends(get_tomatoes)) and the kitchen automatically provides them. The chef doesn\'t need to know where the tomatoes come from (garden, store, or a test supplier). In tests, you swap the supplier to provide fake tomatoes.',
      commonMistakes: [
        { mistake: 'Creating resources inside route handlers instead of using Depends()', fix: 'Declare resources as dependencies with Depends() so they can be swapped in tests and shared across endpoints without duplication.' },
        { mistake: 'Not using dependency_overrides for testing', fix: 'Use app.dependency_overrides[get_db] = test_get_db to swap real dependencies with test versions. This is the cleanest way to test with mock databases and services.' }
      ],
      interviewQuestions: [
        { question: 'What are the three benefits of FastAPI\'s dependency injection?', answer: 'Testability (swap dependencies in tests via dependency_overrides), reusability (share dependencies across endpoints), and declarativeness (function signatures declare what they need).' },
        { question: 'How does dependency caching work within a request?', answer: 'If multiple parameters in the same request use Depends(get_db), the dependency function runs only once and the result is cached for the entire request. This prevents duplicate database connections.' }
      ],
      proTips: [
        'Dependencies are cached per request. If two parameters use Depends(get_db), the function runs only once. This is critical for expensive operations like database connections.',
        'Use app.dependency_overrides for testing — it\'s the cleanest pattern for swapping real services with test doubles.'
      ]
    },
    'Yield Dependencies & Resource Cleanup': {
      realWorldAnalogy: 'Yield dependencies are like checking out a library book. The library gives you the book (yield), you read it (your endpoint runs), and when you\'re done, you return it (code after yield runs). Even if you spill coffee on the book and panic (exception), the library still makes you return it (finally block guarantees cleanup).',
      commonMistakes: [
        { mistake: 'Forgetting try/finally in yield dependencies', fix: 'Always wrap yield in try/finally to guarantee cleanup. Without finally, an exception in the endpoint could leak database connections.' },
        { mistake: 'Calling db.commit() in both the endpoint and the yield dependency', fix: 'Choose one pattern: either explicit commits in endpoints with simple yield db + finally db.close(), or auto-commit in the yield dependency with no explicit commits in endpoints.' }
      ],
      interviewQuestions: [
        { question: 'What is a yield dependency and when do you need one?', answer: 'A yield dependency uses the yield keyword to provide a resource to your endpoint, then runs cleanup code after the response is sent. You need one for any resource that requires cleanup: database sessions, file handles, network connections.' },
        { question: 'What happens if an endpoint raises an exception — does the yield cleanup still run?', answer: 'Yes! FastAPI guarantees that the code after yield runs even if the endpoint raises an exception. This is similar to Python\'s context manager behavior.' }
      ],
      proTips: [
        'The auto-commit/rollback pattern in yield dependencies is elegant but surprising — document it clearly so teammates understand why they don\'t need explicit commits.',
        'Yield dependencies execute teardown in reverse order when nested. If A yields then B yields, B cleans up first, then A.'
      ]
    },
    'Dependency Chains & Class Dependencies': {
      realWorldAnalogy: 'Dependency chains are like a relay race. The first runner (oauth2_scheme) hands off the baton (token) to the second runner (decode_token), who hands it to the third (get_current_user), who hands it to the fourth (require_admin). Each runner only needs to know about the previous one, not the entire chain.',
      commonMistakes: [
        { mistake: 'Creating monolithic dependency functions that do too many things', fix: 'Break complex dependencies into a chain: decode_token → get_current_user → require_role. Each function does one thing, and FastAPI resolves the chain automatically.' },
        { mistake: 'Not using class dependencies for complex stateful logic', fix: 'Class dependencies can have methods and computed properties. Use them when a dependency needs internal state or when the constructor parameters are sub-dependencies.' }
      ],
      interviewQuestions: [
        { question: 'How deep should a dependency chain be?', answer: 'Keep it shallow — 2-3 levels is ideal. If you\'re 5+ levels deep, consider simplifying the design. Deep chains are hard to debug and slow to resolve.' },
        { question: 'How do you use a class as a dependency?', answer: 'Use Depends() with no argument and type-hint the parameter as the class: pagination: PaginationParams = Depends(). FastAPI instantiates the class and injects the instance. Constructor parameters become sub-dependencies.' }
      ],
      proTips: [
        'Use Security() instead of Depends() for security dependencies — it enables scope checking in FastAPI and marks the dependency as a security scheme in OpenAPI.',
        'Class dependencies are perfect for pagination: they compute skip/limit from page/per_page and expose them as properties. One class, reusable across every list endpoint.'
      ]
    },
    'Custom Middleware & Execution Order': {
      realWorldAnalogy: 'Middleware is like a series of security checkpoints at an airport. First you go through the identity check (logging middleware), then the baggage scan (timing middleware), then the metal detector (auth middleware), and finally you board the plane (your route handler). On the way out, you pass through in reverse order — each checkpoint processes your departure.',
      commonMistakes: [
        { mistake: 'Forgetting to call call_next(request) in middleware', fix: 'You MUST call await call_next(request) to pass the request to the next handler. Forgetting it silently swallows the request — your endpoint never runs.' },
        { mistake: 'Adding middleware in the wrong order', fix: 'Middleware added first is outermost — it sees requests first and responses last. Add logging middleware first (broadest view) and auth middleware last (closest to routes).' }
      ],
      interviewQuestions: [
        { question: 'What is the "onion model" of middleware execution?', answer: 'Middleware wraps around your app like onion layers. The first middleware added is outermost — it sees requests first and responses last. The request flows: outermost → innermost → route → innermost response → outermost response.' },
        { question: 'How do you share data between middleware and route handlers?', answer: 'Attach data to request.state (e.g., request.state.request_id = uuid). Route handlers can access this via the Request object.' }
      ],
      proTips: [
        'Always add logging middleware first (outermost) so it captures the full request lifecycle including timing from all inner middleware.',
        'Use request.state to pass data from middleware to route handlers. It\'s a simple object you can attach any property to.'
      ]
    },
    'CORS: Cross-Origin Resource Sharing': {
      realWorldAnalogy: 'CORS is like a building receptionist who checks if visitors from other companies (origins) are allowed to enter. If your company (API) only allows visitors from your own office building (same origin), the receptionist turns away all external visitors. CORS configuration is the guest list that tells the receptionist which external companies are welcome.',
      commonMistakes: [
        { mistake: 'Setting allow_origins=["*"] with allow_credentials=True', fix: 'This combination is forbidden by the CORS specification — browsers reject it. List specific origins when credentials are needed.' },
        { mistake: 'Thinking CORS is server-side security', fix: 'CORS is a browser-only security feature. Server-to-server requests, mobile apps, and CLI tools don\'t enforce CORS. Use proper authentication for real security.' }
      ],
      interviewQuestions: [
        { question: 'What is a CORS preflight request?', answer: 'Before sending certain cross-origin requests, the browser sends an OPTIONS request to check if the server allows the actual request. The server responds with Access-Control-* headers indicating allowed methods, headers, and origins.' },
        { question: 'Why can\'t you use allow_origins=["*"] with credentials?', answer: 'The CORS spec explicitly forbids this combination because it would allow any website to make authenticated requests to your API, which is a security vulnerability. You must list specific origins.' }
      ],
      proTips: [
        'In development, use allow_origins=["*"] WITHOUT credentials. In production, list exact origins WITH credentials. This is the correct pattern.',
        'CORS only affects browsers. Your mobile app, CLI tools, and server-to-server calls work fine without CORS headers.'
      ]
    }
  },
  topics: {
    'm3-api-router': {
      frontendIntegration: {
        title: 'Frontend Calling Multiple Router Endpoints',
        vanillaHtml: {
          title: 'Multi-Domain API Client',
          description: 'An HTML page that calls endpoints from different router modules',
          code: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Multi-Router API Client</title>
<style>
  body { font-family: system-ui; max-width: 700px; margin: 2rem auto; }
  .section { border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; margin: 1rem 0; }
  .section h3 { margin-top: 0; color: #0d9488; }
  button { background: #0d9488; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 4px; cursor: pointer; margin: 0.2rem; }
  pre { background: #1e293b; color: #e2e8f0; padding: 0.75rem; border-radius: 6px; font-size: 0.8rem; overflow-x: auto; }
</style>
</head>
<body>
  <h1>Multi-Router API Client</h1>
  <div class="section">
    <h3>Users Router (/users)</h3>
    <button onclick="fetchUsers()">List Users</button>
    <pre id="users-result"></pre>
  </div>
  <div class="section">
    <h3>Products Router (/products)</h3>
    <button onclick="fetchProducts()">List Products</button>
    <pre id="products-result"></pre>
  </div>
  <script>
    const API = "http://localhost:8000";
    async function fetchUsers() {
      const res = await fetch(API + "/users/");
      document.getElementById("users-result").textContent = JSON.stringify(await res.json(), null, 2);
    }
    async function fetchProducts() {
      const res = await fetch(API + "/products/");
      document.getElementById("products-result").textContent = JSON.stringify(await res.json(), null, 2);
    }
  </script>
</body>
</html>`,
          language: 'html',
          whatHappened: ['Each button calls a different router module endpoint', 'The /users endpoint comes from the users router', 'The /products endpoint comes from the products router'],
          tryToBreak: ['Try calling a non-existent router path like /orders/ — you should get 404']
        },
        corsNote: 'Different router modules share the same CORS policy. Configure CORSMiddleware once in main.py to cover all routers.'
      }
    },
    'm3-middleware-cors': {
      frontendIntegration: {
        title: 'Testing CORS from a Browser',
        vanillaHtml: {
          title: 'CORS Test Page',
          description: 'A page specifically designed to test if CORS is properly configured',
          code: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>CORS Test</title>
<style>
  body { font-family: system-ui; max-width: 600px; margin: 2rem auto; }
  .ok { color: #059669; background: #f0fdf4; padding: 0.5rem; border-radius: 6px; }
  .fail { color: #dc2626; background: #fef2f2; padding: 0.5rem; border-radius: 6px; }
  button { background: #0d9488; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; }
</style>
</head>
<body>
  <h1>CORS Test</h1>
  <button onclick="testCORS()">Test CORS</button>
  <div id="result"></div>
  <script>
    async function testCORS() {
      try {
        const res = await fetch("http://localhost:8000/health");
        if (res.ok) {
          document.getElementById("result").innerHTML = '<div class="ok">CORS is working! Response: ' + JSON.stringify(await res.json()) + '</div>';
        } else {
          document.getElementById("result").innerHTML = '<div class="fail">Server responded with ' + res.status + '</div>';
        }
      } catch (e) {
        document.getElementById("result").innerHTML = '<div class="fail">CORS blocked! Error: ' + e.message + '<br>Make sure CORSMiddleware is configured in your FastAPI app.</div>';
      }
    }
  </script>
</body>
</html>`,
          language: 'html',
          whatHappened: ['The fetch attempts a cross-origin request to FastAPI', 'If CORS is configured, the request succeeds', 'If not, the browser blocks it and shows a CORS error'],
          tryToBreak: ['Remove CORSMiddleware from your FastAPI app and click Test — you\'ll see the CORS error', 'Change the origin URL and observe how only allowed origins work']
        },
        corsNote: 'This IS the CORS test! If it fails, you need to add CORSMiddleware to your FastAPI app.'
      }
    },
    'm3-dependency-injection': {
      frontendIntegration: {
        title: 'Frontend Using Paginated Endpoints with Dependencies',
        vanillaHtml: {
          title: 'Pagination Client Using Dependency-Driven API',
          description: 'A page that calls paginated endpoints powered by class dependencies',
          code: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Pagination Demo</title>
<style>
  body { font-family: system-ui; max-width: 700px; margin: 2rem auto; }
  button { background: #0d9488; color: white; border: none; padding: 0.3rem 0.6rem; border-radius: 4px; cursor: pointer; margin: 0.2rem; }
  .item { padding: 0.5rem; border: 1px solid #e2e8f0; border-radius: 6px; margin: 0.3rem 0; }
  .controls { margin: 1rem 0; display: flex; gap: 0.5rem; align-items: center; }
</style>
</head>
<body>
  <h1>Pagination Demo</h1>
  <div class="controls">
    <button onclick="loadPage(1)">First</button>
    <button onclick="loadPage(currentPage - 1)">Prev</button>
    <span id="pageInfo">Page 1</span>
    <button onclick="loadPage(currentPage + 1)">Next</button>
  </div>
  <div id="items"></div>
  <script>
    let currentPage = 1;
    const API = "http://localhost:8000";
    async function loadPage(page) {
      currentPage = page;
      const res = await fetch(API + "/items/?page=" + page + "&per_page=5");
      const items = await res.json();
      document.getElementById("items").innerHTML = items.map(i =>
        '<div class="item">' + i.name + ' - $' + i.price + '</div>'
      ).join("");
      document.getElementById("pageInfo").textContent = "Page " + page;
    }
    loadPage(1);
  </script>
</body>
</html>`,
          language: 'html',
          whatHappened: ['The pagination class dependency processes page and per_page parameters', 'The API returns paginated results', 'The frontend navigates between pages using query parameters'],
          tryToBreak: ['Try page=0 or page=-1 — the dependency validates ge=1 and returns 422']
        },
        corsNote: 'Pagination endpoints use GET requests which need CORS for cross-origin browser calls.'
      }
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// MODULE 4 - Database Integration
// ═══════════════════════════════════════════════════════════════

const module4Data = {
  sections: {
    'Engine, Session & DeclarativeBase': {
      realWorldAnalogy: 'The SQLAlchemy engine is like a water pump, sessions are like buckets, and the DeclarativeBase is like the plumbing blueprint. The pump (engine) provides water (connections) to the house, each person uses their own bucket (session) to carry water, and the blueprint (DeclarativeBase) shows where all the pipes go (table mappings).',
      commonMistakes: [
        { mistake: 'Sharing a single session across multiple requests', fix: 'Each request must get its own session via the get_db() yield dependency. Shared sessions cause data corruption and threading issues.' },
        { mistake: 'Using echo=True in production', fix: 'Set echo=False in production. echo=True logs every SQL statement, which is great for debugging but creates massive log files in production.' }
      ],
      interviewQuestions: [
        { question: 'What is the purpose of the SQLAlchemy Engine?', answer: 'The Engine manages the connection pool and dialect. It creates connections to the database, handles reconnection, and provides the low-level interface for SQL execution.' },
        { question: 'Why does SQLite need connect_args={"check_same_thread": False}?', answer: 'SQLite uses a single-file database that doesn\'t support concurrent writes from multiple threads. This flag allows FastAPI\'s async workers to share the connection across threads.' }
      ],
      proTips: [
        'Set pool_size and max_overflow on the engine for PostgreSQL to control connection pooling. Without it, you may exhaust database connections under load.',
        'Keep database.py separate from models/ — the Base class must be importable without circular dependencies.'
      ]
    },
    'The get_db Dependency & Session Lifecycle': {
      realWorldAnalogy: 'The get_db dependency is like a library card system. When you enter (request starts), you check out a card (session). You use it to borrow books (query data). When you leave (response sent), you return the card (session closed). Even if you trip on the way out (exception), the librarian makes sure you return the card (finally block).',
      commonMistakes: [
        { mistake: 'Forgetting db.refresh(obj) after db.commit()', fix: 'After committing, the database may have generated values (id, timestamps) that your Python object doesn\'t have yet. db.refresh() reloads the object from the database.' },
        { mistake: 'Using Base.metadata.create_all() in production instead of Alembic', fix: 'create_all() can\'t modify existing tables or handle migrations. Use Alembic for any schema changes in production.' }
      ],
      interviewQuestions: [
        { question: 'Why does get_db use yield instead of return?', answer: 'yield allows the session to be used by the endpoint and then cleaned up after the response is sent. The code after yield (db.close()) is guaranteed to run even if the endpoint raises an exception.' },
        { question: 'How do you override get_db for testing?', answer: 'Use app.dependency_overrides[get_db] = test_get_db. This swaps the production database session with a test session without changing any endpoint code.' }
      ],
      proTips: [
        'Always call db.refresh(obj) after db.commit() to get database-generated values like id, created_at, and updated_at.',
        'For test isolation, create a test database and override get_db before each test, then clean up after.'
      ]
    },
    'Full CRUD with Separate Schemas': {
      realWorldAnalogy: 'Separate schemas are like different forms for different purposes at a bank. The account opening form (Create) asks for your name and initial deposit but not your account number (the bank generates it). The account update form (Update) only has the fields you want to change. The account statement (Response) shows everything including the account number and balance — but never your password.',
      commonMistakes: [
        { mistake: 'Using the same Pydantic model for create, update, and response', fix: 'Use three separate schemas: CreateModel (required fields, no id), UpdateModel (all optional), ResponseModel (safe fields with id). This prevents bugs and security issues.' },
        { mistake: 'Including hashed_password in the response model', fix: 'Never include sensitive fields in ResponseModel. response_model is your last line of defense against leaking data to clients.' }
      ],
      interviewQuestions: [
        { question: 'Why do you need from_attributes=True on response models?', answer: 'It allows Pydantic to read data directly from SQLAlchemy ORM objects by treating object attributes as dict keys. Without it, you\'d need to manually convert ORM objects to dicts.' },
        { question: 'How does response_model filter response data?', answer: 'FastAPI serializes your return value through the response_model Pydantic class. Any field not in the model is excluded, even if the source object has it. This is how hashed_password is automatically stripped from user responses.' }
      ],
      proTips: [
        'model_dump(exclude_unset=True) is essential for PATCH — it gives you only the fields the client explicitly sent, not fields that defaulted to None.',
        'Set from_attributes=True (formerly orm_mode) on ALL response models so Pydantic can read from SQLAlchemy objects directly.'
      ]
    },
    'Advanced Query Patterns & Filtering': {
      realWorldAnalogy: 'Dynamic query building is like a smart librarian who asks you a series of questions: "Do you want fiction or non-fiction? What genre? Published after when?" and then constructs the perfect search query. Each filter is optional — if you don\'t answer a question, that filter is skipped.',
      commonMistakes: [
        { mistake: 'Using string interpolation for sort_by column names', fix: 'Never trust client input for column names. Validate against a whitelist: sort_by: str = Query("created_at", pattern="^(name|price|created_at)$").' },
        { mistake: 'Using offset/limit pagination on very large datasets', fix: 'Offset-based pagination degrades on large datasets (the database must scan and skip offset rows). Use cursor-based pagination with WHERE id < cursor for consistently fast results.' }
      ],
      interviewQuestions: [
        { question: 'What is the N+1 query problem?', answer: 'When you fetch a list of items and then lazily load a relationship for each item, you make 1 query for the list + N queries for the relationships. Use selectinload or joinedload to fix it.' },
        { question: 'When should you use cursor-based vs offset pagination?', answer: 'Cursor-based is always fast but doesn\'t support jumping to arbitrary pages. Offset supports page jumping but degrades on large datasets. Use cursor for infinite scroll, offset for traditional page numbers.' }
      ],
      proTips: [
        'Always validate sort_by against a whitelist of allowed column names — never trust client input for column names as it\'s a SQL injection risk.',
        'Use ilike() instead of like() for case-insensitive search — it handles Unicode properly.'
      ]
    },
    'One-to-Many & Many-to-Many Relationships': {
      realWorldAnalogy: 'One-to-many is like a teacher and students — one teacher has many students, but each student has one teacher. Many-to-many is like students and courses — each student takes many courses, and each course has many students. The enrollment table is like the registration form that connects them.',
      commonMistakes: [
        { mistake: 'Forgetting back_populates on relationship definitions', fix: 'Always use back_populates on both sides of a relationship to create bidirectional navigation. One-way relationships cause subtle bugs and incomplete data loading.' },
        { mistake: 'Not using cascade="all, delete-orphan" for parent-child relationships', fix: 'When children shouldn\'t exist without parents, add cascade="all, delete-orphan" to the parent\'s relationship. This automatically deletes children when the parent is deleted.' }
      ],
      interviewQuestions: [
        { question: 'What is the difference between ForeignKey and relationship()?', answer: 'ForeignKey is the database-level constraint (a column that references another table\'s primary key). relationship() is the Python-level navigation that lets you access related objects as attributes.' },
        { question: 'How do you model a many-to-many relationship in SQLAlchemy?', answer: 'Create a junction table with foreign keys to both sides, then use relationship(secondary=junction_table, back_populates="other_side") on both models.' }
      ],
      proTips: [
        'Always use back_populates for bidirectional relationships. Without it, accessing user.orders might work but order.user might not.',
        'For many-to-many with extra data in the junction table, use the association object pattern instead of a simple Table.'
      ]
    },
    'Eager vs Lazy Loading & N+1 Problem': {
      realWorldAnalogy: 'Lazy loading is like ordering a pizza and then calling the store separately for each topping — one call for pepperoni, one for mushrooms, one for olives. That\'s 4 calls total (1 pizza + 3 toppings = N+1). Eager loading is like ordering everything in one phone call — the store sends the fully-topped pizza in one delivery.',
      commonMistakes: [
        { mistake: 'Not checking for N+1 queries during development', fix: 'Enable SQL echo (echo=True on engine) during development to see every query. If you see the same query repeated N times, you have an N+1 problem.' },
        { mistake: 'Using joinedload for multiple relationships on the same query', fix: 'joinedload can produce duplicate rows when multiple relationships are loaded. Use selectinload for multiple relationships — it\'s more predictable.' }
      ],
      interviewQuestions: [
        { question: 'What is the N+1 problem and how do you fix it?', answer: 'N+1 occurs when you fetch N items with one query, then make N additional queries for related data. Fix with selectinload (second query with IN clause) or joinedload (single query with JOIN).' },
        { question: 'When should you use selectinload vs joinedload?', answer: 'selectinload issues a separate query and is safer for multiple relationships. joinedload uses a single JOIN but can produce duplicate rows with multiple relationships. Default to selectinload.' }
      ],
      proTips: [
        'Set lazy="selectin" on frequently-accessed relationships so you never forget to eager-load them. This makes the default behavior correct.',
        'Enable echo=True on your engine during development to see every SQL query. N+1 problems are obvious when you see 101 queries instead of 2.'
      ]
    },
    'Setting Up Alembic & Auto-Generating Migrations': {
      realWorldAnalogy: 'Alembic is like a version control system for your database schema. Just as Git tracks changes to your code, Alembic tracks changes to your tables. Each migration is a commit — you can go forward (upgrade) or backward (downgrade), and the history tells you exactly what changed and when.',
      commonMistakes: [
        { mistake: 'Forgetting to import all models in alembic/env.py', fix: 'Alembic can only detect changes for models it knows about. Import ALL your models in env.py, or autogenerate won\'t see them.' },
        { mistake: 'Not reviewing auto-generated migrations before applying', fix: 'Autogenerate can\'t detect column renames (it sees drop+add), data migrations, or some constraints. Always review before applying, especially in production.' }
      ],
      interviewQuestions: [
        { question: 'What does alembic revision --autogenerate do?', answer: 'It compares your SQLAlchemy model definitions against the actual database schema and generates a migration script with the DDL operations needed to bring the database up to date.' },
        { question: 'Why can\'t Alembic detect column renames?', answer: 'Alembic compares column names between models and database. A rename looks like a column was dropped and a new one was added. You must write rename migrations manually using op.alter_column().' }
      ],
      proTips: [
        'Always review auto-generated migrations — Alembic can\'t detect column renames, data migrations, or some constraints.',
        'Use descriptive migration messages: "Add user phone column" not "update models". This makes the migration history much more useful.'
      ]
    },
    'Production Migration Strategy': {
      realWorldAnalogy: 'Production migrations are like renovating a building while people are still working in it. You can\'t just knock down walls (drop columns) while people are using them. Instead, you add the new room first (add column), move people in gradually (deploy new code), then remove the old room (drop old column) once everyone has moved.',
      commonMistakes: [
        { mistake: 'Adding a NOT NULL column to a table with existing rows without a default', fix: 'Add the column as nullable first, populate it with data, then alter it to NOT NULL in a separate migration. This avoids locking the table.' },
        { mistake: 'Editing a migration that has already been applied', answer: 'Never edit applied migrations — create a new migration to fix issues. Edited migrations cause inconsistencies between environments.', fix: 'Create a new migration to fix issues. Edited migrations cause inconsistencies between environments.' }
      ],
      interviewQuestions: [
        { question: 'How do you rename a column without losing data?', answer: 'Write a manual migration using op.alter_column("table", "old_name", new_column_name="new_name"). Never rely on autogenerate for renames — it sees drop+add which loses data.' },
        { question: 'What is zero-downtime migration strategy?', answer: 'Make migrations compatible with both old and new code. Add columns before deploying new code, remove columns after all old code is retired. Deploy order: migration → code → cleanup migration → code cleanup.' }
      ],
      proTips: [
        'For zero-downtime deployments, your migration must be compatible with BOTH the old and new code versions. Add columns before deploying, remove columns after retiring old code.',
        'Always test migrations on a staging copy of production data before applying to production. Some migrations can lock tables for hours on large datasets.'
      ]
    }
  },
  topics: {
    'm4-crud-operations': {
      frontendIntegration: {
        title: 'Full CRUD Frontend with Database',
        vanillaHtml: {
          title: 'Product Manager with Database-Backed CRUD',
          description: 'A frontend that performs all CRUD operations against a database-backed FastAPI API',
          code: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Product Manager</title>
<style>
  body { font-family: system-ui; max-width: 700px; margin: 2rem auto; }
  .product { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; border: 1px solid #e2e8f0; border-radius: 6px; margin: 0.3rem 0; }
  button { background: #0d9488; color: white; border: none; padding: 0.3rem 0.6rem; border-radius: 4px; cursor: pointer; }
  .del { background: #ef4444; }
  input { padding: 0.4rem; border: 1px solid #cbd5e1; border-radius: 4px; margin: 0.2rem; }
</style>
</head>
<body>
  <h1>Product Manager (DB-Backed)</h1>
  <div style="margin-bottom:1rem">
    <input id="name" placeholder="Name">
    <input id="price" type="number" step="0.01" placeholder="Price">
    <input id="category" placeholder="Category">
    <button onclick="createProduct()">Add Product</button>
  </div>
  <div id="products"></div>
  <script>
    const API = "http://localhost:8000/products";
    async function loadProducts() {
      const res = await fetch(API);
      const products = await res.json();
      document.getElementById("products").innerHTML = products.map(p =>
        '<div class="product"><span>' + p.name + ' - $' + p.price + ' (' + p.category + ')</span>' +
        '<button onclick="deleteProduct(' + p.id + ')" class="del">Delete</button></div>'
      ).join("");
    }
    async function createProduct() {
      await fetch(API, { method: "POST", headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ name: document.getElementById("name").value, price: parseFloat(document.getElementById("price").value), category: document.getElementById("category").value }) });
      document.getElementById("name").value = "";
      document.getElementById("price").value = "";
      document.getElementById("category").value = "";
      loadProducts();
    }
    async function deleteProduct(id) {
      await fetch(API + "/" + id, { method: "DELETE" });
      loadProducts();
    }
    loadProducts();
  </script>
</body>
</html>`,
          language: 'html',
          whatHappened: ['POST creates a product in the database', 'GET lists all products from the database', 'DELETE removes a product by ID'],
          tryToBreak: ['Create a product with negative price — Field(gt=0) rejects it', 'Delete a non-existent ID — 404 returned']
        },
        corsNote: 'CRUD operations use POST and DELETE with JSON. Configure CORS to allow these methods.'
      }
    },
    'm4-sqlalchemy-setup': {
      frontendIntegration: {
        title: 'Frontend Connecting to a Database-Backed API',
        vanillaHtml: {
          title: 'User List from Database',
          description: 'A simple page that displays users stored in a database',
          code: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Users</title>
<style>
  body { font-family: system-ui; max-width: 600px; margin: 2rem auto; }
  .user { padding: 0.5rem; border: 1px solid #e2e8f0; border-radius: 6px; margin: 0.3rem 0; }
  button { background: #0d9488; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 4px; cursor: pointer; }
</style>
</head>
<body>
  <h1>Users from Database</h1>
  <button onclick="loadUsers()">Refresh</button>
  <div id="users"></div>
  <script>
    async function loadUsers() {
      const res = await fetch("http://localhost:8000/users/");
      const users = await res.json();
      document.getElementById("users").innerHTML = users.map(u =>
        '<div class="user"><strong>' + u.username + '</strong> (' + u.email + ') - ' + (u.is_active ? 'Active' : 'Inactive') + '</div>'
      ).join("");
    }
    loadUsers();
  </script>
</body>
</html>`,
          language: 'html',
          whatHappened: ['The API fetches users from the database via SQLAlchemy', 'Each user is rendered with their database fields', 'Clicking Refresh re-fetches the latest data'],
          tryToBreak: ['If the database is empty, the page shows nothing — try adding users via POST first']
        },
        corsNote: 'GET requests need CORS configured for cross-origin browser access.'
      }
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// MODULE 5 - Authentication & Security
// ═══════════════════════════════════════════════════════════════

const module5Data = {
  sections: {
    'Creating and Verifying JWT Tokens': {
      realWorldAnalogy: 'A JWT is like a hotel key card. When you check in (login), the front desk encodes your room number and expiration date onto the card (creates JWT). Each time you want to enter your room (make a request), you swipe the card (send the token). The door lock verifies the card signature and checks the expiration. If valid, you enter. If expired or tampered with, access is denied.',
      commonMistakes: [
        { mistake: 'Storing sensitive data like passwords inside JWT payloads', fix: 'JWTs are base64-encoded, not encrypted. Anyone who intercepts the token can read its contents. Never put passwords, SSNs, or secrets inside the payload.' },
        { mistake: 'Using a short, simple secret key', fix: 'Use a long, randomly-generated secret key (32+ characters) stored in an environment variable. Short keys can be brute-forced.' }
      ],
      interviewQuestions: [
        { question: 'What are the three parts of a JWT?', answer: 'Header (algorithm and type), Payload (claims like sub and exp), and Signature (cryptographic proof using the secret key). They\'re separated by dots and base64-encoded.' },
        { question: 'Can JWTs be encrypted?', answer: 'Standard JWTs (JWS) are signed but not encrypted — the payload is readable by anyone. For encryption, use JWE (JSON Web Encryption). Most APIs use JWS because signing prevents tampering, which is the primary concern.' }
      ],
      proTips: [
        'Always set an expiration (exp claim) on JWTs. Tokens without expiration never become invalid, which is a security risk if they\'re leaked.',
        'Use HS256 for symmetric signing (simplest) or RS256 for asymmetric (public/private key pair). RS256 is better for microservices where multiple services need to verify tokens.'
      ]
    },
    'OAuth2PasswordBearer and Token Flow': {
      realWorldAnalogy: 'OAuth2PasswordBearer is like a coat check at a restaurant. You give your coat (credentials) to the attendant, who gives you a numbered ticket (token). Every time you want to check on your coat, you show the ticket instead of your coat. The attendant knows which coat belongs to which ticket number.',
      commonMistakes: [
        { mistake: 'Sending credentials as JSON instead of form-data to the token endpoint', fix: 'OAuth2 requires application/x-www-form-urlencoded for the token endpoint. Use OAuth2PasswordRequestForm which automatically parses form-data.' },
        { mistake: 'Forgetting to return token_type: "bearer" in the token response', fix: 'The OAuth2 specification requires the token_type field. Without it, Swagger UI can\'t use the token for subsequent requests.' }
      ],
      interviewQuestions: [
        { question: 'Why does OAuth2 require form-data instead of JSON for the token endpoint?', answer: 'The OAuth2 specification (RFC 6749) mandates application/x-www-form-urlencoded for token requests. This is a historical decision from when OAuth2 was designed for browser-based flows.' },
        { question: 'What does OAuth2PasswordBearer actually do?', answer: 'It extracts the Bearer token from the Authorization header. It doesn\'t authenticate the user — that\'s your dependency function\'s job. It also adds the "Authorize" button to Swagger UI.' }
      ],
      proTips: [
        'The tokenUrl parameter enables Swagger UI\'s Authorize button. Make sure it matches your actual login endpoint path.',
        'Use the Token Pydantic model to enforce the correct response shape: {access_token: str, token_type: str}.'
      ]
    },
    'Token Refresh Strategy': {
      realWorldAnalogy: 'Refresh tokens are like a season pass at an amusement park. Your daily wristband (access token) expires at closing time, but your season pass (refresh token) lets you get a new wristband each visit without buying a new ticket. If you lose your season pass, you must buy a new one (re-login).',
      commonMistakes: [
        { mistake: 'Storing refresh tokens in localStorage (vulnerable to XSS)', fix: 'Store refresh tokens in HTTP-only, Secure cookies. localStorage is accessible to JavaScript, making it vulnerable to XSS attacks.' },
        { mistake: 'Not implementing refresh token rotation', fix: 'Issue a new refresh token every time one is used, and invalidate the old one. Without rotation, a stolen refresh token can be used indefinitely.' }
      ],
      interviewQuestions: [
        { question: 'What is refresh token rotation?', answer: 'Each time a refresh token is used, the server issues a new refresh token and invalidates the old one. This limits the window of opportunity if a refresh token is stolen — it can only be used once.' },
        { question: 'Where should you store refresh tokens on the client?', answer: 'In HTTP-only, Secure cookies. This protects against XSS (JavaScript can\'t read HTTP-only cookies) and ensures the cookie is only sent over HTTPS (Secure flag).' }
      ],
      proTips: [
        'Implement refresh token rotation — issue a new refresh token on every use and invalidate the old one. This prevents replay attacks.',
        'Track active refresh tokens in your database so you can revoke them on logout or security incidents.'
      ]
    },
    'OAuth2PasswordRequestForm and Form-Based Login': {
      realWorldAnalogy: 'OAuth2PasswordRequestForm is like a standardized job application form. Every company uses the same format — name, address, phone number — so applicants know exactly what to fill in. The OAuth2 spec standardizes the token request format so every OAuth2 client knows how to send credentials.',
      commonMistakes: [
        { mistake: 'Creating a custom login endpoint that accepts JSON instead of using OAuth2PasswordRequestForm', fix: 'Use OAuth2PasswordRequestForm as a dependency. It handles form-data parsing and makes Swagger UI\'s Authorize button work automatically.' },
        { mistake: 'Not adding the WWW-Authenticate: Bearer header to 401 responses', fix: 'Always include headers={"WWW-Authenticate": "Bearer"} in your 401 HTTPException. This tells the client to use Bearer token authentication.' }
      ],
      interviewQuestions: [
        { question: 'What is the difference between OAuth2PasswordRequestForm and OAuth2PasswordRequestFormStrict?', answer: 'The strict variant requires the grant_type field to be "password", which the OAuth2 spec mandates but many implementations skip. Use strict for full compliance.' },
        { question: 'Why does Swagger UI\'s Authorize button work with OAuth2PasswordBearer?', answer: 'FastAPI generates an OpenAPI security definition from your OAuth2PasswordBearer instance. Swagger UI reads this definition and creates the Authorize UI automatically.' }
      ],
      proTips: [
        'The OAuth2PasswordRequestForm makes Swagger UI\'s Authorize button work out of the box — always use it for token endpoints.',
        'Return the correct response shape: {"access_token": "...", "token_type": "bearer"}. Swagger UI expects this exact format.'
      ]
    },
    'Swagger Authorize Button Integration': {
      realWorldAnalogy: 'The Swagger Authorize button is like a VIP entrance to a club. Instead of fumbling with ID at the door every time, you show your VIP card once at the entrance (click Authorize), and then you can enter any room (endpoint) in the club without showing ID again.',
      commonMistakes: [
        { mistake: 'Not adding scopes to the OAuth2PasswordBearer configuration', fix: 'Define scopes in OAuth2PasswordBearer(scopes={...}) so they appear in Swagger UI\'s Authorize dialog. Scopes enable fine-grained permissions like read:items, write:items.' },
        { mistake: 'Using Depends() instead of Security() for security dependencies', fix: 'Use Security(get_current_user, scopes=["read:items"]) instead of Depends(get_current_user). Security() enables the scope-checking feature in FastAPI.' }
      ],
      interviewQuestions: [
        { question: 'What are OAuth2 scopes and how do they work in FastAPI?', answer: 'Scopes are fine-grained permissions like "read:items" or "admin:all". Define them in OAuth2PasswordBearer, include them in the JWT, and check them using SecurityScopes in your dependency.' },
        { question: 'How do you require a specific scope for an endpoint?', answer: 'Use Security(get_current_user, scopes=["read:items"]) as a dependency. FastAPI checks that the token includes the required scope and returns 403 if it doesn\'t.' }
      ],
      proTips: [
        'Add meaningful descriptions to your scopes — they appear as tooltips in the Swagger UI Authorize dialog.',
        'Use Security() instead of Depends() for security dependencies. It enables scope checking and marks the dependency as a security scheme in OpenAPI.'
      ]
    },
    'Hashing and Verifying Passwords with passlib': {
      realWorldAnalogy: 'Password hashing is like a meat grinder — you can turn a steak into ground beef in seconds, but you can never turn ground beef back into a steak. When a user registers, you grind their password (hash it) and store the ground beef. When they login, you grind the submitted password and compare it to the stored ground beef. If they match, the password is correct.',
      commonMistakes: [
        { mistake: 'Using SHA-256 or MD5 for password hashing', fix: 'Use bcrypt via passlib. SHA-256 and MD5 are designed to be fast (bad for passwords). Bcrypt is deliberately slow, making brute-force attacks impractical.' },
        { mistake: 'Not salting passwords', fix: 'Bcrypt automatically generates a unique salt for each hash. Never implement your own salting — use passlib\'s built-in salt generation.' }
      ],
      interviewQuestions: [
        { question: 'Why is bcrypt better than SHA-256 for passwords?', answer: 'Bcrypt is deliberately slow (adjustable cost factor), making brute-force attacks computationally expensive. SHA-256 is designed to be fast, which is great for data integrity but terrible for passwords.' },
        { question: 'What is the cost factor in bcrypt?', answer: 'The cost factor determines how many iterations to run. Each increment doubles computation time. Cost 12 takes ~250ms per hash — fast for single logins but slow enough to make cracking infeasible.' }
      ],
      proTips: [
        'Use bcrypt__rounds=12 as a good balance between security and performance. Each increment doubles computation time.',
        'Set deprecated="auto" in CryptContext to automatically upgrade hashes when users log in. This enables lazy migration from old hash algorithms.'
      ]
    },
    'Security Best Practices for Password Handling': {
      realWorldAnalogy: 'Password validation is like airport security for your application. You check that the passport photo matches (strength validation), you don\'t let people take photos of the security checkpoint (no logging), and you gradually upgrade the metal detectors (lazy hash migration) without shutting down the airport.',
      commonMistakes: [
        { mistake: 'Logging passwords during registration or login for debugging', fix: 'Never log passwords or hashes. Log only whether authentication succeeded or failed. Structured logging should explicitly exclude sensitive fields.' },
        { mistake: 'Not rate-limiting login attempts', fix: 'Password hashing alone isn\'t enough — limit login attempts per IP to 5-10 per minute. Without rate limiting, an attacker can try millions of password combinations.' }
      ],
      interviewQuestions: [
        { question: 'What is lazy password hash migration?', answer: 'When upgrading hash algorithms, you can\'t re-hash existing passwords (you don\'t have the plaintext). Instead, when a user with a deprecated hash logs in, verify against the old hash and immediately re-hash with the new algorithm. This gradually migrates all users over time.' },
        { question: 'How do you validate password strength in FastAPI?', answer: 'Use a Pydantic field_validator on the password field that checks minimum length, character types, and common patterns. Return 422 with specific feedback if the password is weak.' }
      ],
      proTips: [
        'Use zxcvbn-python for realistic password strength estimation instead of simple character-type checks. It detects common patterns like "Password123".',
        'Implement lazy migration: when a user with a deprecated hash logs in, verify against the old hash and immediately re-hash with bcrypt. This gradually migrates all users without forcing password resets.'
      ]
    }
  },
  topics: {
    'm5-jwt-auth': {
      frontendIntegration: {
        title: 'JWT Authentication Frontend Flow',
        vanillaHtml: {
          title: 'Login & Protected API Access',
          description: 'A complete login flow with JWT token storage and protected API calls',
          code: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>JWT Auth Demo</title>
<style>
  body { font-family: system-ui; max-width: 600px; margin: 2rem auto; }
  .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; margin: 1rem 0; }
  input { padding: 0.4rem; border: 1px solid #cbd5e1; border-radius: 4px; width: 100%; margin: 0.3rem 0; }
  button { background: #0d9488; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; margin: 0.3rem; }
  .logout { background: #ef4444; }
  pre { background: #1e293b; color: #e2e8f0; padding: 0.75rem; border-radius: 6px; font-size: 0.8rem; }
  .hidden { display: none; }
</style>
</head>
<body>
  <h1>JWT Auth Demo</h1>
  <div id="loginSection" class="card">
    <h3>Login</h3>
    <input id="username" placeholder="Username">
    <input id="password" type="password" placeholder="Password">
    <button onclick="login()">Login</button>
    <div id="loginError"></div>
  </div>
  <div id="protectedSection" class="card hidden">
    <h3>Protected Content</h3>
    <button onclick="fetchProfile()">Get Profile</button>
    <button onclick="logout()" class="logout">Logout</button>
    <pre id="profile"></pre>
  </div>
  <script>
    const API = "http://localhost:8000";
    function getToken() { return localStorage.getItem("access_token"); }
    function setToken(token) { localStorage.setItem("access_token", token); showProtected(); }
    function removeToken() { localStorage.removeItem("access_token"); showLogin(); }
    function showProtected() { document.getElementById("loginSection").classList.add("hidden"); document.getElementById("protectedSection").classList.remove("hidden"); }
    function showLogin() { document.getElementById("loginSection").classList.remove("hidden"); document.getElementById("protectedSection").classList.add("hidden"); }
    async function login() {
      const formData = new URLSearchParams();
      formData.append("username", document.getElementById("username").value);
      formData.append("password", document.getElementById("password").value);
      const res = await fetch(API + "/auth/token", { method: "POST", headers: {"Content-Type": "application/x-www-form-urlencoded"}, body: formData });
      if (res.ok) { const data = await res.json(); setToken(data.access_token); }
      else { document.getElementById("loginError").textContent = "Login failed!"; }
    }
    async function fetchProfile() {
      const res = await fetch(API + "/users/me", { headers: {"Authorization": "Bearer " + getToken()} });
      document.getElementById("profile").textContent = JSON.stringify(await res.json(), null, 2);
    }
    function logout() { removeToken(); }
    if (getToken()) showProtected(); else showLogin();
  </script>
</body>
</html>`,
          language: 'html',
          whatHappened: ['Login sends form-data to /auth/token and stores the JWT', 'Protected requests include Authorization: Bearer <token> header', 'Logout removes the token from localStorage'],
          tryToBreak: ['Manually corrupt the token in localStorage — API returns 401', 'Try accessing /users/me without logging in — 401 Unauthorized']
        },
        corsNote: 'The login request uses form-data (application/x-www-form-urlencoded). Ensure CORS allows this Content-Type.'
      }
    },
    'm5-password-hashing': {
      frontendIntegration: {
        title: 'Registration & Login with Secure Passwords',
        vanillaHtml: {
          title: 'User Registration with Password Strength Validation',
          description: 'A registration form that demonstrates secure password handling',
          code: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Secure Registration</title>
<style>
  body { font-family: system-ui; max-width: 500px; margin: 2rem auto; }
  input { padding: 0.4rem; border: 1px solid #cbd5e1; border-radius: 4px; width: 100%; margin: 0.3rem 0; }
  button { background: #0d9488; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; margin-top: 0.5rem; }
  .weak { color: #dc2626; } .medium { color: #f59e0b; } .strong { color: #059669; }
</style>
</head>
<body>
  <h1>Register</h1>
  <input id="username" placeholder="Username">
  <input id="email" type="email" placeholder="Email">
  <input id="password" type="password" placeholder="Password" oninput="checkStrength()">
  <div id="strength" class="weak">Enter a password</div>
  <input id="confirm" type="password" placeholder="Confirm Password">
  <button onclick="register()">Register</button>
  <div id="result"></div>
  <script>
    function checkStrength() {
      const pw = document.getElementById("password").value;
      const el = document.getElementById("strength");
      if (pw.length < 8) { el.className = "weak"; el.textContent = "Too short (min 8 chars)"; }
      else if (!/[A-Z]/.test(pw) || !/[0-9]/.test(pw)) { el.className = "medium"; el.textContent = "Add uppercase + number"; }
      else { el.className = "strong"; el.textContent = "Strong!"; }
    }
    async function register() {
      const pw = document.getElementById("password").value;
      const confirm = document.getElementById("confirm").value;
      if (pw !== confirm) { document.getElementById("result").textContent = "Passwords don't match!"; return; }
      const res = await fetch("http://localhost:8000/register", { method: "POST", headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ username: document.getElementById("username").value, email: document.getElementById("email").value, password: pw }) });
      document.getElementById("result").textContent = res.ok ? "Registered successfully!" : "Registration failed: " + (await res.json()).detail;
    }
  </script>
</body>
</html>`,
          language: 'html',
          whatHappened: ['Password strength is checked client-side for UX', 'The backend validates with Pydantic field_validator', 'Passwords are hashed with bcrypt before storage'],
          tryToBreak: ['Use a weak password like "123" — both client and server reject it', 'Use mismatched confirm password — client-side check catches it']
        },
        corsNote: 'Registration uses POST with JSON. Enable CORS on your FastAPI app.'
      }
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// MODULES 6 & 7 - Generic enrichment (testing and deployment)
// ═══════════════════════════════════════════════════════════════

const module6Data = {
  sections: {
    'Writing Your First FastAPI Tests': {
      realWorldAnalogy: 'TestClient is like a flight simulator for your API. You can take off, land, and encounter turbulence (test edge cases) without risking a real plane (production server). Every test is a simulated flight that verifies your API behaves correctly under specific conditions.',
      commonMistakes: [
        { mistake: 'Starting a real server to run tests', fix: 'Use TestClient(app) which communicates via ASGI directly. No server needed — tests run in milliseconds.' },
        { mistake: 'Not testing error responses (4xx, 5xx)', fix: 'Test both success and failure cases: valid inputs, invalid types, missing fields, non-existent resources. Error handling is where most bugs hide.' }
      ],
      interviewQuestions: [
        { question: 'How does TestClient differ from starting a real Uvicorn server for testing?', answer: 'TestClient uses httpx to call your FastAPI app through the ASGI interface directly, bypassing the network layer. This makes tests run in milliseconds instead of seconds, and you don\'t need to manage server startup/shutdown.' },
        { question: 'What is the testing pyramid for FastAPI applications?', answer: 'Unit tests (most) → Integration tests (medium) → End-to-end tests (few). Unit tests test individual functions, integration tests test endpoint + database, E2E tests test the full stack.' }
      ],
      proTips: [
        'Test both success AND failure cases. Test valid inputs, invalid types, missing fields, and edge cases. Error handling is where most bugs hide.',
        'Use pytest fixtures for database setup/teardown. This keeps tests isolated and repeatable.'
      ]
    },
    'Testing with Pydantic Validation': {
      realWorldAnalogy: 'Testing Pydantic validation is like stress-testing a building\'s security system. You try to enter with fake IDs (wrong types), expired passes (missing fields), and invalid credentials (constraint violations) to verify the security catches everything.',
      commonMistakes: [
        { mistake: 'Only testing the happy path (valid inputs)', fix: 'Test validation errors systematically: wrong types, missing required fields, constraint violations, boundary values, and edge cases.' },
        { mistake: 'Not testing nested model validation', fix: 'Test nested models by sending invalid data in nested objects. Validation should cascade through all levels.' }
      ],
      interviewQuestions: [
        { question: 'How do you test Pydantic validation errors?', answer: 'Send invalid data via TestClient and assert status_code == 422. Check the error details for correct field locations, error types, and messages.' },
        { question: 'What is the "parse, don\'t validate" testing strategy?', answer: 'Test that your Pydantic models accept valid data and produce the correct typed objects. Then test that invalid data is rejected with clear errors. Don\'t test Python\'s type system — test your business constraints.' }
      ],
      proTips: [
        'Create a helper function for checking 422 errors: assert_validation_error(response, field="age", error_type="int_parsing") to reduce boilerplate.',
        'Test boundary values: Field(ge=0) should accept 0 and reject -1. Field(max_length=100) should accept 100 chars and reject 101.'
      ]
    }
  },
  topics: {}
};

const module7Data = {
  sections: {
    'Docker Basics for FastAPI': {
      realWorldAnalogy: 'Docker is like a shipping container for your application. No matter what\'s inside (Python, Node.js, databases), the container has a standard shape that works on any ship (server). You build the container once, and it runs identically on your laptop, staging, and production.',
      commonMistakes: [
        { mistake: 'Not using multi-stage builds, resulting in huge images', fix: 'Use multi-stage builds: one stage to install dependencies, another to copy only the runtime files. This reduces image size from 1GB+ to ~200MB.' },
        { mistake: 'Running the container as root user', fix: 'Add a non-root user in the Dockerfile: RUN useradd -m appuser && USER appuser. Running as root is a security risk in production.' }
      ],
      interviewQuestions: [
        { question: 'What is a Docker multi-stage build?', answer: 'A Dockerfile with multiple FROM statements. Each stage can copy artifacts from previous stages. You use a builder stage to install dependencies, then copy only the runtime artifacts to a smaller final image.' },
        { question: 'Why should you not run containers as root?', answer: 'If an attacker escapes the container, they gain root access on the host. Running as a non-root user limits the damage. Always add USER appuser in your Dockerfile.' }
      ],
      proTips: [
        'Use python:3.12-slim as your base image instead of python:3.12. The slim variant is ~150MB smaller while having everything you need.',
        'Pin your base image version: python:3.12.1-slim instead of python:3.12-slim to ensure reproducible builds.'
      ]
    },
    'Docker Compose for Full-Stack Applications': {
      realWorldAnalogy: 'Docker Compose is like an orchestra conductor. Each instrument (service) plays its part — the API plays the melody, the database keeps the rhythm, Redis adds harmony. The conductor (docker-compose.yml) ensures they all start together, listen to each other, and play in tune.',
      commonMistakes: [
        { mistake: 'Not using depends_on correctly for service startup order', fix: 'Use depends_on with healthchecks: depends_on: db: condition: service_healthy. This ensures the database is actually ready, not just started.' },
        { mistake: 'Hardcoding database URLs instead of using environment variables', fix: 'Use environment variables in docker-compose.yml that reference service names as hostnames: DATABASE_URL: postgresql://db:5432/mydb.' }
      ],
      interviewQuestions: [
        { question: 'How do services communicate in Docker Compose?', answer: 'Services communicate using their service names as hostnames. The API service connects to the database using hostname "db", not "localhost". Docker\'s internal DNS resolves service names to container IPs.' },
        { question: 'What is the difference between depends_on and healthchecks?', answer: 'depends_on only waits for the container to start, not for the service to be ready. healthchecks verify the service is actually responding. Always use healthchecks for databases and message queues.' }
      ],
      proTips: [
        'Use healthchecks in docker-compose.yml to ensure databases are ready before the API starts. Without them, your API may crash on startup because the database isn\'t accepting connections yet.',
        'Use named volumes for database data: volumes: pgdata:. This persists data across container restarts.'
      ]
    },
    'Deploying to Cloud Platforms': {
      realWorldAnalogy: 'Cloud deployment is like moving from a home kitchen to a commercial restaurant. Your home kitchen (local dev) works fine for small meals, but a restaurant (cloud) handles hundreds of customers. The recipes (code) are the same, but the equipment (infrastructure) is scaled up with automated ordering (CI/CD), fire suppression (monitoring), and a kitchen manager (orchestration).',
      commonMistakes: [
        { mistake: 'Not setting proper environment variables in production', fix: 'Use platform-specific secret management (AWS Secrets Manager, GCP Secret Manager, or .env files in deployment). Never hardcode secrets in your code or Docker image.' },
        { mistake: 'Not configuring health check endpoints', fix: 'Add a /health endpoint that returns {"status": "ok"} and configure your cloud platform to use it. This enables automatic restarts if your app becomes unresponsive.' }
      ],
      interviewQuestions: [
        { question: 'What is the difference between PaaS and IaaS for FastAPI deployment?', answer: 'PaaS (Railway, Render, Heroku) manages infrastructure for you — just push code. IaaS (AWS EC2, GCP Compute) gives you full control but requires more setup. Start with PaaS, move to IaaS when you need custom infrastructure.' },
        { question: 'How do you handle secrets in production?', answer: 'Use environment variables injected by the platform (never in code). For sensitive values, use secret managers like AWS Secrets Manager or HashiCorp Vault. Docker secrets or Kubernetes secrets for containerized deployments.' }
      ],
      proTips: [
        'Add a /health endpoint to every FastAPI app. Cloud platforms use it for automatic health checks, and it\'s essential for zero-downtime deployments.',
        'Start with PaaS (Railway, Render) for simplicity, then move to Kubernetes when you need more control. Don\'t over-engineer early.'
      ]
    }
  },
  topics: {}
};

// ═══════════════════════════════════════════════════════════════
// PROCESS ALL MODULES
// ═══════════════════════════════════════════════════════════════

const allModules = {
  'module3-routing': module3Data,
  'module4-database': module4Data,
  'module5-auth': module5Data,
  'module6-testing': module6Data,
  'module7-deployment': module7Data,
};

for (const [moduleName, moduleData] of Object.entries(allModules)) {
  const filePath = path.join(CURRICULUM_DIR, `${moduleName}.ts`);
  if (!fs.existsSync(filePath)) { console.log(`\nFile not found: ${filePath}`); continue; }
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Processing: ${moduleName}.ts`);
  console.log('='.repeat(60));
  let content = fs.readFileSync(filePath, 'utf-8');
  if (moduleData.sections) {
    for (const [sectionHeading, enrichment] of Object.entries(moduleData.sections)) {
      content = addSectionEnrichment(content, sectionHeading, enrichment);
    }
  }
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

console.log('\n\nDone! All module enrichments applied.');
