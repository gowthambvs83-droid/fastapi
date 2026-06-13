#!/usr/bin/env node
/**
 * Fix enrichment for modules 6-7 using correct section headings
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
// MODULE 6 - Testing
// ═══════════════════════════════════════════════════════════════
const module6Data = {
  sections: {
    'Testing Endpoints with TestClient': {
      realWorldAnalogy: 'TestClient is like a flight simulator for your API. You can take off, land, and encounter turbulence (edge cases) without risking a real plane (production server). Every test is a simulated flight that verifies your API behaves correctly under specific conditions.',
      commonMistakes: [
        { mistake: 'Starting a real Uvicorn server to run tests', fix: 'Use TestClient(app) which communicates via ASGI directly. No server needed — tests run in milliseconds.' },
        { mistake: 'Testing only the happy path (valid inputs)', fix: 'Test error responses too: invalid types, missing fields, non-existent resources. Error handling is where most bugs hide.' }
      ],
      interviewQuestions: [
        { question: 'How does TestClient work without starting a real server?', answer: 'TestClient uses httpx to call your FastAPI app through the ASGI interface directly, bypassing the network layer. This makes tests run in milliseconds instead of seconds.' },
        { question: 'What is the testing pyramid for FastAPI?', answer: 'Unit tests (most) → Integration tests (medium) → E2E tests (few). Unit tests test individual functions, integration tests test endpoint + database, E2E tests test the full stack.' }
      ],
      proTips: [
        'Test both success AND failure cases. Error handling is where most bugs hide.',
        'Use pytest fixtures for database setup/teardown. This keeps tests isolated and repeatable.'
      ]
    },
    'Testing Validation Errors and Response Shapes': {
      realWorldAnalogy: 'Testing validation is like quality control on an assembly line. You deliberately send defective products (invalid data) through the line to verify the inspection station (Pydantic) catches every type of defect and produces the correct rejection report (422 error).',
      commonMistakes: [
        { mistake: 'Only checking status code without verifying error details', fix: 'Always verify the error response body: check error type, location (loc), and message. This ensures your validation is specific, not just "something went wrong".' },
        { mistake: 'Not testing boundary values for Field constraints', fix: 'Test Field(ge=0) with -1, 0, and 1. Test Field(max_length=100) with 99, 100, and 101 characters. Boundary values catch off-by-one errors.' }
      ],
      interviewQuestions: [
        { question: 'How do you test Pydantic validation errors via TestClient?', answer: 'Send invalid data and assert status_code == 422. Check the response body for error details: error type, field location, and message.' },
        { question: 'What should you test in a 422 error response?', answer: 'Verify the error count, the field location (loc), the error type (e.g., "int_parsing"), and the error message. This ensures validation is specific and helpful.' }
      ],
      proTips: [
        'Create a helper: assert_validation_error(res, field="age", error_type="greater_than_equal") to reduce boilerplate across tests.',
        'Test boundary values: Field(ge=0) should accept 0 and reject -1. Field(max_length=100) should accept 100 chars and reject 101.'
      ]
    },
    'Test Databases and Fixture Patterns': {
      realWorldAnalogy: 'Test databases are like scratch paper for math homework. You write your calculations (tests) on scratch paper first, verify they\'re correct, then throw the paper away (teardown). You never do homework on the final exam paper (production database).',
      commonMistakes: [
        { mistake: 'Using the production database for testing', fix: 'Create a separate test database and override get_db to use it. Never run tests against production data — tests modify and delete data.' },
        { mistake: 'Not cleaning up test data between tests', fix: 'Use pytest fixtures with yield to create a fresh database state before each test and clean up after. Without cleanup, tests become order-dependent and flaky.' }
      ],
      interviewQuestions: [
        { question: 'How do you set up a test database for FastAPI integration tests?', answer: 'Override get_db with a test database session using app.dependency_overrides. Use pytest fixtures with yield to create tables before each test and drop them after.' },
        { question: 'What is the difference between unit tests and integration tests for FastAPI?', answer: 'Unit tests test individual functions (services, validators) in isolation. Integration tests test the full request/response cycle including database, serialization, and validation. Both are needed.' }
      ],
      proTips: [
        'Use SQLAlchemy\'s create_all/drop_all in fixtures to create fresh tables for each test. This ensures test isolation.',
        'For faster tests, use SQLite in-memory (:memory:) as the test database instead of PostgreSQL.'
      ]
    },
    'Dependency Overrides for Test Doubles': {
      realWorldAnalogy: 'Dependency overrides are like stunt doubles in movies. The real actor (production dependency) does the dramatic scenes, but for dangerous stunts (tests that need isolation), a trained stunt double (test dependency) takes their place. The camera (endpoint) can\'t tell the difference.',
      commonMistakes: [
        { mistake: 'Modifying the app directly instead of using dependency_overrides', fix: 'Use app.dependency_overrides[get_db] = test_get_db. This swaps dependencies cleanly without modifying your app code.' },
        { mistake: 'Forgetting to clear dependency_overrides after tests', fix: 'Call app.dependency_overrides.clear() in teardown to prevent test contamination between test modules.' }
      ],
      interviewQuestions: [
        { question: 'What is app.dependency_overrides and when do you use it?', answer: 'It\'s a dict that maps production dependencies to test replacements. FastAPI checks it before resolving dependencies, so overridden dependencies are used instead. Essential for swapping databases, auth, and external services in tests.' },
        { question: 'How do you test a protected endpoint without real authentication?', answer: 'Override get_current_user with a function that returns a mock user. This bypasses JWT validation while still testing the endpoint logic.' }
      ],
      proTips: [
        'Always clear dependency_overrides after tests: app.dependency_overrides.clear(). Forgetting this causes test contamination.',
        'Create a fixture that provides an authenticated TestClient to reduce boilerplate in protected endpoint tests.'
      ]
    },
    'Mocking Tokens and Authenticated TestClient': {
      realWorldAnalogy: 'Mocking authentication in tests is like having a VIP pass at a theme park. Instead of waiting in the regular line (going through the full login flow), you use the VIP entrance (mock auth) to skip straight to the ride (endpoint logic). You still experience the ride, just without the queue.',
      commonMistakes: [
        { mistake: 'Creating real JWTs in tests instead of mocking auth', fix: 'Override get_current_user to return a mock user directly. Creating real JWTs in every test is slow and couples tests to auth implementation.' },
        { mistake: 'Testing auth logic in every endpoint test', fix: 'Test auth logic separately (in auth-specific tests). For endpoint tests, override auth to focus on endpoint behavior.' }
      ],
      interviewQuestions: [
        { question: 'How do you create an authenticated TestClient for testing?', answer: 'Override get_current_user with a function returning a mock user, then create TestClient(app). For header-based testing, create a real JWT and add Authorization: Bearer <token> to requests.' },
        { question: 'Should you test with real or mocked authentication?', answer: 'Both. Use mocked auth for endpoint logic tests (faster, focused). Use real auth for integration tests that verify the full auth flow.' }
      ],
      proTips: [
        'Create a pytest fixture that returns an authenticated TestClient: auth_client = TestClient(app) with get_current_user overridden.',
        'Test the full auth flow (login → token → protected endpoint) in at least one integration test, even if you mock auth for unit tests.'
      ]
    },
    'Measuring Coverage with pytest-cov': {
      realWorldAnalogy: 'Code coverage is like a map showing which rooms in a building you\'ve visited. 100% coverage means you\'ve been in every room, but it doesn\'t mean you\'ve checked every drawer. You might have 100% coverage and still miss bugs in edge cases that your tests don\'t exercise.',
      commonMistakes: [
        { mistake: 'Chasing 100% coverage at the expense of test quality', fix: 'Coverage measures which code runs, not whether tests are meaningful. Aim for 80-90% coverage with meaningful assertions rather than 100% with shallow tests.' },
        { mistake: 'Not excluding test files from coverage reports', fix: 'Use --cov=app --cov-report=term-missing to focus on your app code, not tests. Add omit patterns in .coveragerc for migration files and config.' }
      ],
      interviewQuestions: [
        { question: 'What does code coverage measure?', answer: 'It measures the percentage of code lines executed during tests. 80%+ coverage is good, but coverage doesn\'t guarantee correctness — it only shows what code ran, not whether assertions are meaningful.' },
        { question: 'What is branch coverage vs line coverage?', answer: 'Line coverage measures whether each line executed. Branch coverage measures whether each if/else branch was taken. Branch coverage is stricter — you can have 100% line coverage but miss else branches.' }
      ],
      proTips: [
        'Use pytest --cov=app --cov-report=html to generate an HTML coverage report. It highlights uncovered lines visually.',
        'Aim for 80-90% coverage. 100% is often not worth the effort, and coverage doesn\'t guarantee test quality.'
      ]
    }
  },
  topics: {
    'm6-testclient': {
      frontendIntegration: {
        title: 'Testing Your API from the Browser',
        vanillaHtml: {
          title: 'Interactive API Test Page',
          description: 'A browser-based page for manually testing your API endpoints (complements automated tests)',
          code: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>API Test Page</title>
<style>
  body { font-family: system-ui; max-width: 700px; margin: 2rem auto; }
  .test { border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; margin: 0.5rem 0; }
  button { background: #0d9488; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 4px; cursor: pointer; }
  .pass { border-color: #22c55e; } .fail { border-color: #ef4444; }
  pre { background: #1e293b; color: #e2e8f0; padding: 0.5rem; border-radius: 4px; font-size: 0.75rem; }
</style>
</head>
<body>
  <h1>API Test Suite</h1>
  <button onclick="runAll()">Run All Tests</button>
  <div id="results"></div>
  <script>
    const API = "http://localhost:8000";
    const tests = [
      { name: "GET / returns 200", fn: async () => { const r = await fetch(API + "/"); return r.ok; } },
      { name: "GET /items/42 returns item_id 42", fn: async () => { const r = await fetch(API + "/items/42"); const d = await r.json(); return d.item_id === 42; } },
      { name: "GET /items/not-a-number returns 422", fn: async () => { const r = await fetch(API + "/items/abc"); return r.status === 422; } },
    ];
    async function runAll() {
      const el = document.getElementById("results");
      el.innerHTML = "";
      for (const t of tests) {
        try { const pass = await t.fn(); el.innerHTML += '<div class="test ' + (pass ? "pass" : "fail") + '">' + t.name + ": " + (pass ? "PASS" : "FAIL") + "</div>"; }
        catch (e) { el.innerHTML += '<div class="test fail">' + t.name + ": ERROR - " + e.message + "</div>"; }
      }
    }
  </script>
</body>
</html>`,
          language: 'html',
          whatHappened: ['Each test calls an API endpoint and checks the response', 'Pass/fail is determined by the assertion logic', 'This complements automated pytest tests for manual exploration'],
          tryToBreak: ['Stop the API server and run tests — all should fail with network errors']
        },
        corsNote: 'The test page makes cross-origin requests. Enable CORS for this to work.'
      }
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// MODULE 7 - Deployment
// ═══════════════════════════════════════════════════════════════
const module7Data = {
  sections: {
    'Dockerizing Your FastAPI App': {
      realWorldAnalogy: 'Docker is like a shipping container for your application. No matter what\'s inside (Python, Node.js, databases), the container has a standard shape that works on any ship (server). You build the container once, and it runs identically on your laptop, staging, and production.',
      commonMistakes: [
        { mistake: 'Not using multi-stage builds, resulting in huge images', fix: 'Use multi-stage builds: one stage to install dependencies, another to copy only the runtime files. This reduces image size from 1GB+ to ~200MB.' },
        { mistake: 'Running the container as root user', fix: 'Add a non-root user: RUN useradd -m appuser && USER appuser. Running as root is a security risk in production.' }
      ],
      interviewQuestions: [
        { question: 'What is a Docker multi-stage build?', answer: 'A Dockerfile with multiple FROM statements. Each stage can copy artifacts from previous stages. You use a builder stage to install dependencies, then copy only runtime artifacts to a smaller final image.' },
        { question: 'Why should you not run containers as root?', answer: 'If an attacker escapes the container, they gain root access on the host. Running as a non-root user limits the damage.' }
      ],
      proTips: [
        'Use python:3.12-slim as your base image — it\'s ~150MB smaller than the full image.',
        'Pin your base image version: python:3.12.1-slim for reproducible builds.'
      ]
    },
    'Multi-Stage Docker Builds': {
      realWorldAnalogy: 'Multi-stage builds are like moving houses. The first stage (builder) is the packing phase where you gather everything. The second stage (runtime) is the unpacking phase where you only bring what you need. You don\'t bring packing materials and boxes to the new house — just your belongings.',
      commonMistakes: [
        { mistake: 'Copying the entire project directory into the final image', fix: 'In the final stage, copy only what\'s needed: app code, installed packages, and static files. Don\'t copy tests, .git, or development tools.' },
        { mistake: 'Not using .dockerignore to exclude unnecessary files', fix: 'Create a .dockerignore file excluding .git, __pycache__, .venv, tests, and .env. This reduces build context size and prevents secrets from leaking into images.' }
      ],
      interviewQuestions: [
        { question: 'How much smaller is a multi-stage build compared to a single-stage build?', answer: 'A single-stage build using python:3.12 can be 1GB+. A multi-stage build using python:3.12-slim with only runtime dependencies can be ~150-250MB. The difference is dramatic.' },
        { question: 'What files should be in .dockerignore?', answer: '.git, __pycache__, .venv, .env, tests/, *.pyc, .pytest_cache, .mypy_cache, README.md. This reduces build context size and prevents secrets from leaking.' }
      ],
      proTips: [
        'Use COPY --from=builder to copy only the installed packages from the builder stage. This keeps the final image lean.',
        'Always create a .dockerignore file. Without it, Docker sends your entire project directory as build context, which is slow and may include secrets.'
      ]
    },
    'Docker Compose with Database & Redis': {
      realWorldAnalogy: 'Docker Compose is like an orchestra conductor. Each instrument (service) plays its part — the API plays the melody, the database keeps the rhythm, Redis adds harmony. The conductor ensures they all start together and listen to each other.',
      commonMistakes: [
        { mistake: 'Not using healthchecks for database readiness', fix: 'Add healthchecks to your database service: test: ["CMD-SHELL", "pg_isready -U postgres"]. Use depends_on with condition: service_healthy.' },
        { mistake: 'Using "localhost" as the database hostname inside containers', fix: 'Use the service name from docker-compose.yml as the hostname. Inside the API container, the database is at host "db", not "localhost".' }
      ],
      interviewQuestions: [
        { question: 'How do services communicate in Docker Compose?', answer: 'Services use their service names as hostnames. The API connects to the database using hostname "db" (the service name), not "localhost". Docker\'s internal DNS resolves this.' },
        { question: 'Why do you need healthchecks in addition to depends_on?', answer: 'depends_on only waits for the container to start, not for the service inside to be ready. A database container starts instantly but takes seconds to accept connections. Healthchecks verify actual readiness.' }
      ],
      proTips: [
        'Use healthchecks with depends_on: condition: service_healthy to ensure databases are ready before the API starts.',
        'Use named volumes for database data to persist it across container restarts: volumes: pgdata:.'
      ]
    },
    'WebSocket Endpoints in FastAPI': {
      realWorldAnalogy: 'WebSocket is like a phone call between your browser and the server. Unlike HTTP (walkie-talkie — one speaks, then the other), WebSocket keeps the line open so both sides can talk anytime. This is essential for chat apps, live feeds, and real-time collaboration.',
      commonMistakes: [
        { mistake: 'Not handling WebSocket disconnections gracefully', fix: 'Always wrap WebSocket handling in try/except and remove the client from any connection manager on disconnect. Unhandled disconnections leak connections.' },
        { mistake: 'Using WebSocket for everything when HTTP would suffice', fix: 'Use WebSocket only for real-time bidirectional communication. For one-way updates, consider Server-Sent Events (SSE). For request-response, use regular HTTP.' }
      ],
      interviewQuestions: [
        { question: 'When should you use WebSocket vs HTTP vs SSE?', answer: 'HTTP for request-response. SSE for server-to-client one-way updates (notifications, feeds). WebSocket for bidirectional real-time communication (chat, collaboration, gaming).' },
        { question: 'How does FastAPI handle WebSocket connections?', answer: 'Use the @app.websocket decorator. Accept the connection with await websocket.accept(), receive with await websocket.receive_text(), and send with await websocket.send_text(). Use a ConnectionManager to track active connections.' }
      ],
      proTips: [
        'Use a ConnectionManager class to track active WebSocket connections and broadcast messages. This pattern is essential for any real-time feature.',
        'Always handle disconnections in try/except — clients disconnect unexpectedly, and unhandled exceptions crash your server.'
      ]
    },
    'Structured Logging': {
      realWorldAnalogy: 'Structured logging is like having a detailed receipt for every action in your restaurant. Instead of "some food was cooked" (unstructured), you get "Table 5 ordered pasta at 7:32pm, cooked by Chef Mario, served in 12 minutes" (structured). When something goes wrong, you can find exactly what happened.',
      commonMistakes: [
        { mistake: 'Using print() statements instead of a proper logging framework', fix: 'Use Python\'s logging module with structlog or python-json-logger. print() doesn\'t support log levels, structured data, or centralized collection.' },
        { mistake: 'Logging sensitive data like passwords or tokens', fix: 'Never log request bodies that contain passwords, tokens, or personal data. Use log filtering or redaction to strip sensitive fields.' }
      ],
      interviewQuestions: [
        { question: 'What is structured logging and why is it better than unstructured?', answer: 'Structured logging outputs JSON objects with consistent fields (timestamp, level, message, request_id). This makes logs machine-parseable, enabling powerful searching, filtering, and alerting in tools like ELK or Datadog.' },
        { question: 'What fields should every log entry contain?', answer: 'timestamp, level, message, request_id (for tracing), and service_name. Optional: user_id, duration_ms, status_code. Consistent fields enable reliable log analysis.' }
      ],
      proTips: [
        'Include a request_id in every log entry to trace a request across multiple services. Generate it in middleware and attach to request.state.',
        'Use structlog for JSON-structured logs in development and production. It integrates with Python\'s logging module and supports human-readable output in dev.'
      ]
    },
    'Production Error Handling': {
      realWorldAnalogy: 'Production error handling is like a hospital\'s emergency system. Minor injuries (400 errors) get triaged quickly. Serious conditions (500 errors) trigger the full emergency response (alerts, on-call). The system never crashes — it degrades gracefully and always tells someone what happened.',
      commonMistakes: [
        { mistake: 'Returning raw exception messages to clients in production', fix: 'Use custom exception handlers that return generic error messages to clients while logging the full stack trace internally. Never expose internal implementation details.' },
        { mistake: 'Not using FastAPI\'s exception_handler for global error handling', fix: 'Register @app.exception_handler(Exception) to catch all unhandled exceptions and return consistent error responses.' }
      ],
      interviewQuestions: [
        { question: 'How do you handle unhandled exceptions globally in FastAPI?', answer: 'Register @app.exception_handler(Exception) to catch all exceptions. Return a generic 500 error to the client and log the full stack trace for debugging.' },
        { question: 'What information should you include in error responses?', answer: 'For 4xx: include what went wrong and how to fix it. For 5xx: include a reference ID (for support lookup) and a generic message. NEVER include stack traces, SQL queries, or internal details in 5xx responses.' }
      ],
      proTips: [
        'Always include a request_id in error responses so users can report it and you can find the corresponding log entry.',
        'Never return stack traces in production error responses. They expose internal implementation details that help attackers.'
      ]
    },
    'CI/CD with GitHub Actions': {
      realWorldAnalogy: 'CI/CD is like an automated quality control line in a factory. Every time a worker submits a design (push to Git), the machines automatically test it (run tests), check for defects (lint), and if everything passes, ship it to stores (deploy). No human intervention needed.',
      commonMistakes: [
        { mistake: 'Not running tests in CI before deploying', fix: 'Add a test job to your CI pipeline that runs before deployment. If tests fail, deployment is blocked. This prevents broken code from reaching production.' },
        { mistake: 'Storing secrets directly in workflow files', fix: 'Use GitHub Secrets for sensitive values (database URLs, API keys, SSH keys). Reference them as ${{ secrets.SECRET_NAME }} in your workflow.' }
      ],
      interviewQuestions: [
        { question: 'What is the difference between CI and CD?', answer: 'CI (Continuous Integration) automatically tests and validates code changes. CD (Continuous Deployment) automatically deploys validated changes to production. CI catches bugs; CD delivers fixes.' },
        { question: 'How do you store secrets in GitHub Actions?', answer: 'Use GitHub Secrets (Settings → Secrets → Actions). Reference them in workflows as ${{ secrets.SECRET_NAME }}. They\'re encrypted and never exposed in logs.' }
      ],
      proTips: [
        'Add linting (ruff check) and type checking (mypy) to your CI pipeline alongside tests. This catches issues before they become bugs.',
        'Use GitHub Secrets for all sensitive values. Never hardcode API keys, database URLs, or SSH keys in workflow files.'
      ]
    },
    'Health Checks & Graceful Shutdown': {
      realWorldAnalogy: 'Health checks are like a heartbeat monitor for your application. If the heart stops (app becomes unresponsive), the monitor alerts the doctor (orchestration system) who restarts the patient (container). Graceful shutdown is like a nurse slowly reducing medication — the patient finishes current treatment (in-flight requests) before going to sleep.',
      commonMistakes: [
        { mistake: 'Not adding a /health endpoint', fix: 'Add @app.get("/health") that checks database connectivity and returns {"status": "healthy"}. Cloud platforms use this for automatic restarts.' },
        { mistake: 'Ignoring SIGTERM for graceful shutdown', fix: 'Handle shutdown signals to complete in-flight requests before stopping. FastAPI with Uvicorn supports graceful shutdown via lifespan events.' }
      ],
      interviewQuestions: [
        { question: 'What should a health check endpoint verify?', answer: 'At minimum: the app is responding. For production: also check database connectivity, external service availability, and disk space. A deep health check catches issues that a simple ping wouldn\'t.' },
        { question: 'What is graceful shutdown and why does it matter?', answer: 'Graceful shutdown completes in-flight requests before stopping the server. Without it, deploying a new version kills active connections, causing 502 errors for users mid-request.' }
      ],
      proTips: [
        'Include database connectivity in your health check — if the database is down, the app should report unhealthy even if it can respond to HTTP.',
        'Use FastAPI\'s lifespan events to handle startup/shutdown logic. This is the modern replacement for on_event("startup"/"shutdown").'
      ]
    }
  },
  topics: {
    'm7-docker': {
      frontendIntegration: {
        title: 'Frontend for Containerized API',
        vanillaHtml: {
          title: 'Docker-Deployed API Test Client',
          description: 'A frontend designed to work with a containerized FastAPI deployment',
          code: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Container API Client</title>
<style>
  body { font-family: system-ui; max-width: 600px; margin: 2rem auto; }
  .status { padding: 1rem; border-radius: 8px; margin: 0.5rem 0; }
  .healthy { background: #f0fdf4; border: 1px solid #86efac; }
  .unhealthy { background: #fef2f2; border: 1px solid #fca5a5; }
  button { background: #0d9488; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; margin: 0.3rem; }
  pre { background: #1e293b; color: #e2e8f0; padding: 0.75rem; border-radius: 6px; font-size: 0.8rem; }
</style>
</head>
<body>
  <h1>Container API Client</h1>
  <button onclick="checkHealth()">Health Check</button>
  <button onclick="testAPI()">Test API</button>
  <div id="status"></div>
  <pre id="output"></pre>
  <script>
    async function checkHealth() {
      try {
        const res = await fetch("http://localhost:8000/health");
        const data = await res.json();
        document.getElementById("status").innerHTML = '<div class="status healthy">Healthy: ' + JSON.stringify(data) + '</div>';
      } catch (e) {
        document.getElementById("status").innerHTML = '<div class="status unhealthy">Unhealthy: Cannot reach API. Is the container running?</div>';
      }
    }
    async function testAPI() {
      const res = await fetch("http://localhost:8000/");
      document.getElementById("output").textContent = JSON.stringify(await res.json(), null, 2);
    }
    checkHealth();
  </script>
</body>
</html>`,
          language: 'html',
          whatHappened: ['The health check verifies the containerized API is responsive', 'If the container is down, a clear error message is shown', 'The API test confirms the endpoint works correctly'],
          tryToBreak: ['Stop the Docker container and click Health Check — it should show unhealthy']
        },
        corsNote: 'Container APIs need CORS configured just like local development APIs.'
      }
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// PROCESS
// ═══════════════════════════════════════════════════════════════
for (const [moduleName, moduleData] of Object.entries({ 'module6-testing': module6Data, 'module7-deployment': module7Data })) {
  const filePath = path.join(CURRICULUM_DIR, `${moduleName}.ts`);
  if (!fs.existsSync(filePath)) { console.log(`File not found: ${filePath}`); continue; }
  console.log(`\n${'='.repeat(60)}\nProcessing: ${moduleName}.ts\n${'='.repeat(60)}`);
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

console.log('\nDone! Modules 6-7 enriched.');
