import { Module } from './types';

export const module8Simulations: Module = {
  id: 'module-8-simulations',
  title: 'Real-World Simulations',
  icon: '🎬',
  description:
    'Bring FastAPI concepts to life with interactive, animated simulations. Walk through HTTP request flows, JWT authentication lifecycles, database query pipelines, and middleware chain processing — seeing exactly what happens at each step, from request arrival to response delivery.',
  topics: [
    {
      id: 'm8-http-simulation',
      title: 'HTTP Request Flow Simulation',
      icon: '🌐',
      simulation: 'HTTP_REQUEST_FLOW',
      introduction:
        'Every HTTP request goes on a journey: from your browser, through DNS resolution, across the network, through load balancers, into FastAPI workers, through middleware chains, and finally to your route handler. Understanding this flow is essential for debugging slow responses, configuring middleware correctly, and designing APIs that scale. This topic uses an interactive simulation to show you exactly what happens at each step.',
      sections: [
        {
          heading: 'From Browser to Server: The Complete Journey',
          content: `When you type a URL into your browser and press Enter, a cascade of events occurs before your FastAPI handler even sees the request. The browser first checks its local cache for a matching response. If no cached response exists, it initiates DNS resolution to convert the hostname into an IP address. DNS resolution itself involves multiple steps: the browser checks its DNS cache, then the OS cache, then queries the configured DNS resolver, which may recursively query root servers, TLD servers, and authoritative nameservers.

Once the IP address is resolved, the browser establishes a TCP connection to the server. If the URL uses HTTPS (which it should in production), a TLS handshake occurs next, negotiating encryption parameters and verifying the server's certificate. Only after the secure connection is established does the browser send the actual HTTP request.

The request then passes through any intermediate infrastructure — CDNs, load balancers, reverse proxies — before reaching your ASGI server (Uvicorn). Uvicorn accepts the connection, parses the HTTP request, and passes it to FastAPI as an ASGI scope. FastAPI then matches the route, validates parameters, runs dependencies and middleware, and finally calls your handler function. The response follows the reverse path back to the browser.

Understanding this full journey helps you diagnose issues like slow DNS resolution (use DNS prefetching), TLS handshake failures (certificate problems), load balancer misconfiguration (wrong headers), and connection pool exhaustion (too many concurrent requests).`,
          codeExamples: [
            {
              title: 'Tracing the Request with Middleware',
              description: 'A middleware that logs every step of the request lifecycle',
              code: `import time
import uuid
from fastapi import FastAPI, Request

app = FastAPI()

@app.middleware("http")
async def request_tracer(request: Request, call_next):
    """Trace every step of the request lifecycle."""
    request_id = str(uuid.uuid4())[:8]
    start = time.time()

    # Log incoming request
    print(f"[{request_id}] >> {request.method} {request.url.path}")
    print(f"[{request_id}]    Client: {request.client.host if request.client else 'unknown'}")
    print(f"[{request_id}]    Headers: content-type={request.headers.get('content-type', 'N/A')}")

    # Measure time in middleware
    middleware_start = time.time()

    # Call the next middleware/handler
    response = await call_next(request)

    # Log response
    process_time = (time.time() - start) * 1000
    middleware_time = (middleware_start - start) * 1000

    print(f"[{request_id}] << {response.status_code} ({process_time:.1f}ms)")
    print(f"[{request_id}]    Middleware overhead: {middleware_time:.1f}ms")

    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time"] = f"{process_time:.1f}ms"
    return response

@app.get("/users")
def list_users():
    return [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]`,
              language: 'python',
              output: `[abc123] >> GET /users
[abc123]    Client: 127.0.0.1
[abc123]    Headers: content-type=N/A
[abc123] << 200 (12.3ms)
[abc123]    Middleware overhead: 0.1ms`,
            },
            {
              title: 'Simulating Network Latency',
              description: 'Add artificial delays to test how your frontend handles slow responses',
              code: `import asyncio
import random
from fastapi import FastAPI, Request

app = FastAPI()

@app.middleware("http")
async def simulate_latency(request: Request, call_next):
    """Simulate network latency for testing frontend behavior."""
    # Add 50-300ms random delay to simulate real network conditions
    delay = random.uniform(0.05, 0.3)
    await asyncio.sleep(delay)

    response = await call_next(request)
    response.headers["X-Simulated-Latency"] = f"{delay*1000:.0f}ms"
    return response

@app.get("/api/data")
async def get_data():
    return {"data": [1, 2, 3], "count": 3}`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'flow',
            title: 'Complete HTTP Request Journey',
            description: 'Every step from browser to FastAPI handler and back',
            steps: [
              { label: 'Browser initiates request', detail: 'User clicks link or submits form. Browser checks cache.', highlight: false },
              { label: 'DNS Resolution', detail: 'Convert hostname to IP address. Check browser/OS caches first.', timing: '1-50ms' },
              { label: 'TCP Connection', detail: 'Three-way handshake to establish connection with server.', timing: '1-100ms' },
              { label: 'TLS Handshake', detail: 'Negotiate encryption. Verify SSL certificate.', timing: '50-200ms' },
              { label: 'HTTP Request Sent', detail: 'Request headers and body transmitted to server.', timing: '1-10ms' },
              { label: 'Load Balancer Routes', detail: 'Nginx/HAProxy selects backend worker.', timing: '1-5ms', highlight: true },
              { label: 'Uvicorn Accepts', detail: 'ASGI server parses HTTP and creates scope.', timing: '1-5ms' },
              { label: 'Middleware Chain', detail: 'CORS, auth, logging middleware process request.', timing: '1-10ms', highlight: true },
              { label: 'Route Matching', detail: 'FastAPI matches URL pattern to handler.', timing: '<1ms' },
              { label: 'Validation & Dependencies', detail: 'Pydantic validates params, Depends() resolves.', timing: '1-20ms', highlight: true },
              { label: 'Handler Executes', detail: 'Your business logic runs, database queried.', timing: '5-500ms' },
              { label: 'Response Sent', detail: 'Response serialized and sent back through the chain.', timing: '1-10ms' },
            ],
          },
          tips: [
            'Use X-Request-ID headers to trace requests across multiple services and log aggregation tools.',
            'The total time from browser to response can be 100ms-2s+ depending on network conditions and server processing time.',
          ],
          keyTakeaway: 'An HTTP request passes through DNS, TCP, TLS, load balancers, middleware, and route matching before your handler runs — each step adds latency and potential failure points.',
          realWorldAnalogy: 'An HTTP request is like sending a letter through the postal system. You write the letter (request), address it (DNS resolution), the post office routes it (load balancer), the local postman delivers it (Uvicorn), the receptionist checks your ID (middleware/auth), and finally the right person reads it (handler). Each step can introduce delays or failures.',
          commonMistakes: [
            { mistake: 'Assuming localhost performance matches production', fix: 'Test with realistic network latency. Use middleware to simulate 100-300ms delays and verify your frontend handles slow responses gracefully with loading indicators.' },
            { mistake: 'Not setting timeout values for external API calls', fix: 'Always set timeout on httpx requests: httpx.AsyncClient(timeout=10.0). Without timeouts, a slow upstream service can block your entire API.' },
          ],
          interviewQuestions: [
            { question: 'What happens between the browser sending a request and FastAPI receiving it?', answer: 'DNS resolution, TCP connection (3-way handshake), TLS handshake (for HTTPS), possible CDN/cache checks, load balancer routing, and finally Uvicorn accepting the connection and parsing the HTTP request into an ASGI scope.' },
            { question: 'How do you trace a request across multiple microservices?', answer: 'Generate a unique request_id in the first service (or at the gateway), propagate it via X-Request-ID headers, and include it in all log entries. This allows log aggregation tools to show the full request path.' },
          ],
          proTips: [
            'Add X-Process-Time-Ms and X-Request-ID headers to every response — they are invaluable for debugging slow endpoints in production.',
            'Use DNS prefetching (<link rel="dns-prefetch">) in your frontend to resolve API hostnames before the user makes a request.',
          ],
        },
        {
          heading: 'Request Processing Inside FastAPI',
          content: `Once a request reaches FastAPI, it goes through a precise sequence of steps. Understanding this sequence is crucial for predicting behavior, debugging issues, and optimizing performance. The request processing pipeline consists of route matching, dependency resolution, parameter validation, handler execution, and response serialization.

First, FastAPI matches the incoming request's URL and HTTP method against registered routes. Route matching uses Starlette's routing system, which evaluates routes in registration order. The first matching route wins — this is why route order matters, especially when you have overlapping patterns like /items/{item_id} and /items/me.

After route matching, FastAPI examines the handler function's signature. It extracts all parameters and classifies them: path parameters (from the URL), query parameters (from the query string), request body (from the HTTP body), and dependencies (from Depends()). Each parameter is resolved independently, but dependencies are cached within a single request.

Parameter validation uses Pydantic under the hood. Path and query parameters are validated against their type hints. Request bodies are parsed as JSON and validated against the Pydantic model. If any validation fails, FastAPI returns a 422 error with detailed information about which field failed and why.

The handler function then executes with all validated, typed parameters. It can be sync or async — FastAPI handles both correctly. After the handler returns, FastAPI serializes the response through the response_model (if specified), applies any response headers, and sends the HTTP response back through the middleware chain.`,
          codeExamples: [
            {
              title: 'Step-by-Step Request Processing',
              description: 'A detailed look at each processing step with timing',
              code: `from fastapi import FastAPI, Depends, Request
from pydantic import BaseModel
import time

app = FastAPI()

class ItemCreate(BaseModel):
    name: str
    price: float

async def get_db():
    """Simulated database dependency."""
    start = time.time()
    yield {"connection": "active"}
    print(f"DB session closed after {(time.time()-start)*1000:.1f}ms")

@app.middleware("http")
async def timing_middleware(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    total = (time.time() - start) * 1000
    response.headers["X-Total-Time"] = f"{total:.1f}ms"
    return response

@app.post("/items")
async def create_item(item: ItemCreate, db=Depends(get_db)):
    """Each step in processing is traceable."""
    # Step 1: Route matched → POST /items
    # Step 2: Body parsed → ItemCreate validated
    # Step 3: Dependencies resolved → get_db() called
    # Step 4: Handler executes → business logic
    return {"id": 1, **item.model_dump()}`,
              language: 'python',
            },
            {
              title: 'Visualizing the Processing Pipeline',
              description: 'Debug endpoint that shows the processing state at each step',
              code: `from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

app = FastAPI()

processing_log = []

@app.middleware("http")
async def debug_pipeline(request: Request, call_next):
    processing_log.append(f"1. Middleware: {request.method} {request.url.path}")
    response = await call_next(request)
    processing_log.append(f"2. Middleware: Response {response.status_code}")
    return response

@app.get("/debug/pipeline")
async def debug_pipeline_endpoint():
    """See the processing pipeline in action."""
    return {
        "steps": processing_log[-10:],
        "info": "Each request goes through: Middleware → Route Match → Validation → Handler → Response"
    }`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'architecture',
            title: 'FastAPI Request Processing Pipeline',
            description: 'The internal processing steps within FastAPI',
            layers: [
              { label: 'Incoming Request', items: ['ASGI Scope', 'HTTP Method + Path', 'Headers + Body'] },
              { label: 'Middleware Chain', items: ['CORS Check', 'Auth Verification', 'Request Logging'] },
              { label: 'Route Matching', items: ['URL Pattern Match', 'Method Verification', 'Handler Selection'] },
              { label: 'Parameter Resolution', items: ['Path Params', 'Query Params', 'Request Body', 'Dependencies'] },
              { label: 'Handler Execution', items: ['Business Logic', 'Database Queries', 'External API Calls'] },
              { label: 'Response Pipeline', items: ['response_model Filter', 'Status Code', 'Headers + Cookies'] },
            ],
          },
          tips: [
            'Route order matters — /items/me must be registered BEFORE /items/{item_id} or "me" will be treated as an item_id.',
            'Dependencies are cached per request. If two parameters use Depends(get_db), the function runs only once.',
          ],
          keyTakeaway: 'FastAPI processes requests through: route matching → parameter classification → validation → dependency resolution → handler execution → response serialization.',
          realWorldAnalogy: 'FastAPI request processing is like a hospital admission system. The receptionist (middleware) checks your ID, the routing desk (route matching) directs you to the right department, the nurse (parameter validation) verifies your paperwork, the specialist (handler) treats you, and the billing department (response serialization) processes your discharge.',
          commonMistakes: [
            { mistake: 'Registering /items/{item_id} before /items/me', fix: 'Always register specific routes BEFORE parameterized routes. FastAPI matches routes in registration order, so /items/{item_id} will capture /items/me if registered first.' },
            { mistake: 'Not understanding that dependencies are cached per request', fix: 'If two parameters use Depends(get_db), the function runs once. This is by design for efficiency. If you need separate sessions, use different dependency functions.' },
          ],
          interviewQuestions: [
            { question: 'In what order does FastAPI process a request?', answer: 'Middleware (incoming) → Route matching → Parameter classification → Pydantic validation → Dependency injection → Handler execution → Response model filtering → Middleware (outgoing) → HTTP response.' },
            { question: 'Why does route registration order matter?', answer: 'FastAPI matches routes in registration order. The first matching route wins. If /items/{item_id} is registered before /items/me, "me" will be treated as an item_id string, not matched to the /me route.' },
          ],
          proTips: [
            'Use the debug endpoint pattern to trace request processing in development. Remove it before production.',
            'When debugging slow endpoints, add timing to each middleware separately to identify which one is the bottleneck.',
          ],
        },
        {
          heading: 'Building Your Own Request Tracing Middleware',
          content: `Request tracing is one of the most powerful debugging and monitoring tools you can add to your FastAPI application. A well-designed tracing middleware captures request metadata, measures processing time at each stage, propagates correlation IDs across services, and integrates with observability tools like Jaeger, Zipkin, or AWS X-Ray.

The key principle of request tracing is the correlation ID — a unique identifier assigned to each request that propagates through your entire system. When a request enters your API, the middleware generates or extracts a correlation ID (from X-Request-ID or X-Correlation-ID headers). This ID is attached to all log entries, passed to downstream service calls, and included in the response headers.

Beyond simple timing, production tracing middleware should capture the request method, path, query parameters (but NOT sensitive headers like Authorization), response status code, and processing time. This data feeds into dashboards that show P50, P95, and P99 latency percentiles, error rates by endpoint, and traffic patterns.

For distributed tracing across microservices, integrate with OpenTelemetry. The opentelemetry-instrumentation-fastapi package automatically instruments your FastAPI app, capturing traces and spans that flow across service boundaries. Combined with Jaeger or Zipkin for visualization, this gives you a complete picture of how requests travel through your entire architecture.`,
          codeExamples: [
            {
              title: 'Production Request Tracing Middleware',
              description: 'A comprehensive tracing middleware with correlation IDs and structured logging',
              code: `import time
import uuid
import logging
from fastapi import FastAPI, Request
from contextvars import ContextVar

# Context variable for request ID (accessible anywhere in the request)
request_id_var: ContextVar[str] = ContextVar("request_id", default="unknown")

logger = logging.getLogger("api.tracing")

app = FastAPI()

@app.middleware("http")
async def tracing_middleware(request: Request, call_next):
    # Generate or extract correlation ID
    req_id = request.headers.get("X-Request-ID", str(uuid.uuid4())[:8])
    request_id_var.set(req_id)

    start_time = time.time()
    client_ip = request.client.host if request.client else "unknown"

    logger.info(
        "request_started",
        extra={
            "request_id": req_id,
            "method": request.method,
            "path": request.url.path,
            "client_ip": client_ip,
        }
    )

    try:
        response = await call_next(request)
        process_time = (time.time() - start_time) * 1000

        logger.info(
            "request_completed",
            extra={
                "request_id": req_id,
                "status_code": response.status_code,
                "process_time_ms": round(process_time, 2),
            }
        )

        response.headers["X-Request-ID"] = req_id
        response.headers["X-Process-Time"] = f"{process_time:.2f}ms"
        return response

    except Exception as exc:
        process_time = (time.time() - start_time) * 1000
        logger.error(
            "request_failed",
            extra={
                "request_id": req_id,
                "error": str(exc),
                "process_time_ms": round(process_time, 2),
            }
        )
        raise`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'sequence',
            title: 'Request Tracing Flow',
            description: 'How tracing middleware captures data at each step',
            steps: [
              { label: 'Request arrives', detail: 'Extract or generate X-Request-ID', highlight: true },
              { label: 'Start timer', detail: 'Record start_time = time.time()', highlight: false },
              { label: 'Log request start', detail: 'Method, path, client IP, request ID', highlight: false },
              { label: 'Call next handler', detail: 'await call_next(request)', highlight: true },
              { label: 'Calculate duration', detail: 'process_time = now - start_time', highlight: false },
              { label: 'Log request complete', detail: 'Status code, duration, request ID', highlight: true },
              { label: 'Add response headers', detail: 'X-Request-ID, X-Process-Time', highlight: false },
              { label: 'Return response', detail: 'Response with tracing headers', highlight: false },
            ],
          },
          tips: [
            'Use contextvars (not global variables) to store request-scoped data like request IDs — they are safe for concurrent async requests.',
            'Never log sensitive headers like Authorization or Cookie in production tracing middleware.',
          ],
          keyTakeaway: 'Request tracing with correlation IDs is non-negotiable for production APIs — it enables debugging, monitoring, and performance analysis across your entire system.',
          realWorldAnalogy: 'Request tracing is like a tracking number for a package. When you ship a package, the tracking number lets you see every step of its journey — when it was picked up, which facility it passed through, and when it was delivered. Without tracking numbers, lost packages are impossible to find.',
          commonMistakes: [
            { mistake: 'Using global variables instead of contextvars for request-scoped data', fix: 'Use contextvars.ContextVar to store request IDs and other per-request data. Global variables are shared across all concurrent requests, causing data corruption in async applications.' },
            { mistake: 'Logging full request bodies including sensitive data', fix: 'Never log passwords, tokens, or personal data. Use log filtering or explicitly exclude sensitive fields. In production, log only metadata (method, path, status, timing).' },
          ],
          interviewQuestions: [
            { question: 'What is a correlation ID and why do you need one?', answer: 'A correlation ID is a unique identifier assigned to each request and propagated across all services. It allows you to trace a single request through multiple microservices, log entries, and database queries, making debugging distributed systems possible.' },
            { question: 'How do you propagate tracing context across microservice calls?', answer: 'Include the correlation ID in HTTP headers (X-Request-ID or traceparent for OpenTelemetry) when making downstream calls. The receiving service extracts the ID and uses it for its own logs and further calls.' },
          ],
          proTips: [
            'Integrate OpenTelemetry for production distributed tracing. The opentelemetry-instrumentation-fastapi package auto-instruments your app with zero code changes.',
            'Add P50/P95/P99 latency percentiles to your monitoring dashboard. Averages hide outliers — P99 shows the experience of your slowest 1% of users.',
          ],
          frontendIntegration: {
            title: 'Frontend with Request Tracing Display',
            vanillaHtml: {
              title: 'API Client with Tracing Info',
              description: 'A frontend that displays X-Request-ID and X-Process-Time from API responses',
              code: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Traced API Client</title>
<style>
  body { font-family: system-ui; max-width: 600px; margin: 2rem auto; }
  button { background: #0d9488; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; }
  .trace { background: #1e293b; color: #e2e8f0; padding: 1rem; border-radius: 8px; font-size: 0.8rem; margin: 0.5rem 0; }
  .badge { display: inline-block; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; margin: 0.2rem; }
  .id { background: #0d9488; color: white; }
  .time { background: #f59e0b; color: white; }
</style>
</head>
<body>
  <h1>Traced API Client</h1>
  <button onclick="fetchWithTracing()">Fetch Data</button>
  <div id="result"></div>
  <script>
    async function fetchWithTracing() {
      const res = await fetch("http://localhost:8000/users");
      const data = await res.json();
      const reqId = res.headers.get("X-Request-ID") || "N/A";
      const procTime = res.headers.get("X-Process-Time") || "N/A";
      document.getElementById("result").innerHTML =
        '<div class="trace">' +
        '<span class="badge id">Request ID: ' + reqId + '</span> ' +
        '<span class="badge time">Process Time: ' + procTime + '</span>' +
        '<pre>' + JSON.stringify(data, null, 2) + '</pre></div>';
    }
  </script>
</body>
</html>`,
              language: 'html',
              whatHappened: ['The API response includes X-Request-ID and X-Process-Time headers', 'The frontend displays these tracing headers alongside the data', 'Each request gets a unique ID for debugging'],
              tryToBreak: ['Make a request without tracing middleware — the headers will be missing']
            },
            corsNote: 'Cross-origin requests need CORS configured. The X-Request-ID and X-Process-Time headers must be exposed via expose_headers in CORSMiddleware.'
          },
        },
      ],
    },
    {
      id: 'm8-jwt-simulation',
      title: 'JWT Authentication Lifecycle',
      icon: '🔐',
      simulation: 'JWT_LIFECYCLE',
      introduction:
        'JWT authentication is a multi-step dance between client and server. From credential submission to token creation, from storage to transmission, from verification to refresh — every step has security implications. This topic uses an interactive simulation to walk you through the complete JWT lifecycle, showing exactly what happens at each stage.',
      sections: [
        {
          heading: 'The Complete JWT Journey: From Login to Verification',
          content: `The JWT authentication lifecycle begins when a user submits their credentials (username and password) to the login endpoint. The server verifies these credentials against the database — comparing the submitted password's bcrypt hash against the stored hash. If the credentials are valid, the server creates a JWT containing claims about the user (typically sub for subject/user ID, role for authorization, and exp for expiration).

The JWT is created by base64-encoding the header and payload, then signing them with a secret key using the HS256 algorithm. The signature ensures that any tampering with the token is detectable. The resulting token looks like: eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyXzQyIn0.signature. Each segment is base64-encoded and separated by dots.

The client receives the token and stores it — typically in memory for single-page applications or HTTP-only cookies for traditional web apps. On every subsequent API request, the client includes the token in the Authorization header as a Bearer token. The server's dependency (like get_current_user) extracts the token, verifies the signature using the same secret key, checks the expiration claim, and extracts the user identity.

If the token is valid, the request proceeds with the authenticated user's identity available to the handler. If the token is expired, the client must obtain a new one via the refresh token flow. If the token is invalid (wrong signature, tampered payload), the server returns 401 Unauthorized.`,
          codeExamples: [
            {
              title: 'Complete JWT Lifecycle Implementation',
              description: 'From login to protected endpoint, every step of the JWT flow',
              code: `from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import jwt, JWTError
from passlib.context import CryptContext

app = FastAPI()

SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# Fake user database
users_db = {
    "admin": {
        "username": "admin",
        "hashed_password": pwd_context.hash("secret123"),
        "role": "admin"
    }
}

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    return {"username": username, "role": payload.get("role", "user")}

@app.post("/auth/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = users_db.get(form_data.username)
    if not user or not pwd_context.verify(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": user["username"], "role": user["role"]})
    return {"access_token": token, "token_type": "bearer"}

@app.get("/users/me")
async def read_users_me(current_user=Depends(get_current_user)):
    return current_user`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'sequence',
            title: 'JWT Authentication Sequence',
            description: 'The complete sequence from login to authenticated request',
            steps: [
              { label: 'Client submits credentials', detail: 'POST /auth/login with username + password', highlight: true },
              { label: 'Server verifies password', detail: 'bcrypt.compare(submitted, stored_hash)', highlight: false },
              { label: 'Server creates JWT', detail: 'jwt.encode({sub, role, exp}, SECRET_KEY)', highlight: true },
              { label: 'Client stores token', detail: 'localStorage or HTTP-only cookie', highlight: false },
              { label: 'Client sends Bearer token', detail: 'Authorization: Bearer <token>', highlight: true },
              { label: 'Server verifies signature', detail: 'jwt.decode(token, SECRET_KEY)', highlight: true },
              { label: 'Server checks expiration', detail: 'exp claim compared to current time', highlight: false },
              { label: 'Server extracts user identity', detail: 'sub claim → user lookup', highlight: false },
              { label: 'Request processed', detail: 'Handler receives authenticated user', highlight: false },
            ],
          },
          tips: [
            'Always use HTTPS in production — JWTs sent over HTTP can be intercepted.',
            'Set reasonable expiration times: 15-30 minutes for access tokens, 7-30 days for refresh tokens.',
          ],
          keyTakeaway: 'The JWT lifecycle is: login → verify credentials → create token → store client-side → send with requests → verify signature and expiration → process authenticated request.',
          realWorldAnalogy: 'JWT authentication is like a hotel key card system. You check in at the front desk (login), show your ID (credentials), receive a key card (JWT), and use it to access your room (protected endpoints). The card has an expiration date (exp claim), and if you lose it, someone else could access your room — so keep it secure.',
          commonMistakes: [
            { mistake: 'Storing JWTs in localStorage (vulnerable to XSS)', fix: 'For web apps, store access tokens in memory and refresh tokens in HTTP-only Secure cookies. localStorage is accessible to any JavaScript, making XSS attacks devastating.' },
            { mistake: 'Not validating the algorithm during JWT decode', fix: 'Always specify algorithms=[ALGORITHM] in jwt.decode(). The "none" algorithm attack exploits servers that accept unsigned tokens by not validating the algorithm.' },
          ],
          interviewQuestions: [
            { question: 'What is the "none" algorithm attack on JWTs?', answer: 'An attacker modifies the JWT header to specify alg: "none" and removes the signature. If the server doesn\'t validate the algorithm, it accepts the unsigned token as valid. Always specify algorithms=[ALGORITHM] in jwt.decode() to prevent this.' },
            { question: 'How do you invalidate a JWT before it expires?', answer: 'JWTs are stateless — the server doesn\'t track them. To invalidate: (1) use short expiration times, (2) maintain a token blacklist in Redis, (3) use refresh token rotation, or (4) change the SECRET_KEY (invalidates ALL tokens).' },
          ],
          proTips: [
            'Use refresh token rotation: issue a new refresh token on every use and invalidate the old one. This limits the window if a refresh token is stolen.',
            'For high-security applications, consider RS256 (asymmetric) instead of HS256. The private key signs tokens; the public key verifies them. Microservices only need the public key.',
          ],
        },
        {
          heading: 'Token Refresh & Rotation Deep Dive',
          content: `Token refresh is the mechanism that balances security (short-lived access tokens) with usability (not forcing users to re-login every 15 minutes). When an access token expires, the client sends a refresh token to a dedicated endpoint and receives a new access token without user interaction. This is the standard OAuth2 pattern used by every major API provider.

Refresh token rotation takes security a step further. Each time a refresh token is used, the server issues BOTH a new access token AND a new refresh token, while invalidating the old refresh token. This means each refresh token can only be used once. If an attacker steals a refresh token and uses it, the legitimate user's next refresh attempt will fail (because the token was already used), immediately alerting both parties to the breach.

Implementing rotation requires server-side tracking. You need a database or Redis store that maps refresh tokens to users. When a refresh token is used, you: (1) verify it exists in the store, (2) check it hasn't been revoked, (3) delete the old token, (4) issue a new token pair, (5) store the new refresh token. If step 1 fails (token not found), it means the token was already used — a potential security breach. You should revoke ALL of that user's refresh tokens and optionally alert the user.

The client-side implementation is critical. The frontend must handle 401 responses, attempt a silent refresh, retry the original request with the new token, and redirect to login only if the refresh also fails. This creates a seamless user experience where tokens are refreshed transparently.`,
          codeExamples: [
            {
              title: 'Refresh Token Rotation Implementation',
              description: 'Complete rotation with breach detection',
              code: `from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
import redis

app = FastAPI()
r = redis.Redis(host="localhost", port=6379, db=0, decode_responses=True)

SECRET_KEY = "your-secret-key"

def create_token_pair(user_id: str, role: str) -> dict:
    access = jwt.encode(
        {"sub": user_id, "role": role, "type": "access",
         "exp": datetime.now(timezone.utc) + timedelta(minutes=15)},
        SECRET_KEY, algorithm="HS256"
    )
    refresh = jwt.encode(
        {"sub": user_id, "type": "refresh",
         "exp": datetime.now(timezone.utc) + timedelta(days=7)},
        SECRET_KEY, algorithm="HS256"
    )
    # Store refresh token in Redis with 7-day TTL
    r.setex(f"refresh:{refresh}", 7*24*3600, user_id)
    return {"access_token": access, "refresh_token": refresh, "token_type": "bearer"}

@app.post("/auth/refresh")
async def refresh_token(refresh_token: str):
    # Check if token exists in Redis
    stored_user = r.get(f"refresh:{refresh_token}")
    if not stored_user:
        # Token already used or invalid → potential breach!
        # Revoke ALL user tokens
        raise HTTPException(status_code=401, detail="Token reuse detected. All sessions revoked.")

    # Delete the used refresh token (rotation)
    r.delete(f"refresh:{refresh_token}")

    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=["HS256"])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Not a refresh token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    return create_token_pair(payload["sub"], payload.get("role", "user"))`,
              language: 'python',
            },
          ],
          tips: [
            'Use Redis for refresh token storage — it provides automatic expiration via TTL and atomic operations.',
            'Detect token reuse as a security breach indicator and revoke all user sessions immediately.',
          ],
          keyTakeaway: 'Refresh token rotation issues a new token pair on every refresh, making stolen tokens usable only once. Detecting token reuse is a strong breach indicator.',
          realWorldAnalogy: 'Refresh token rotation is like a hotel that rekeys your room every time you visit the front desk. Your old key card stops working, and you get a new one. If someone stole your old card and tried to use it, the front desk would know something is wrong because the card was already exchanged.',
          commonMistakes: [
            { mistake: 'Allowing refresh tokens to be used multiple times', fix: 'Implement rotation: delete the old refresh token and issue a new one on every use. Without rotation, a stolen refresh token can be used indefinitely.' },
            { mistake: 'Not detecting token reuse as a security breach', fix: 'If a refresh token is used twice (second use fails lookup), revoke ALL of that user\'s tokens and alert them. Token reuse means someone else has their refresh token.' },
          ],
          interviewQuestions: [
            { question: 'What is refresh token rotation and why is it important?', answer: 'Rotation means each refresh token can only be used once — the server issues a new pair and invalidates the old one. This limits the damage of token theft because the stolen token becomes useless after one use.' },
            { question: 'How do you detect that a refresh token has been stolen?', answer: 'If a user tries to use a refresh token that was already used (deleted during rotation), it means someone else used it first. This is a clear breach indicator — revoke all sessions and notify the user.' },
          ],
          proTips: [
            'Store refresh tokens in Redis with TTL matching the expiration. Redis handles cleanup automatically and provides sub-millisecond lookups.',
            'On breach detection (token reuse), revoke all user sessions and send a security alert email. This is what major providers like Google and GitHub do.',
          ],
        },
        {
          heading: 'Building a Production Auth System',
          content: `A production authentication system goes far beyond simple JWT creation and verification. It must handle user registration with password hashing, login with rate limiting, token lifecycle management, session revocation, password reset flows, and role-based access control. Each component must be secure, tested, and monitored.

The architecture starts with a User model in your database that stores hashed passwords (never plain text), email, role, and status flags (is_active, is_verified). Registration validates input, hashes the password with bcrypt, and stores the user. Login verifies credentials, creates a token pair, and logs the event for audit trails.

Rate limiting on the login endpoint is critical. Without it, an attacker can brute-force passwords by trying thousands of combinations per second. Implement per-IP rate limiting (e.g., 5 attempts per minute) and per-user lockout (e.g., 5 failed attempts locks the account for 15 minutes). Use Redis for distributed rate limiting across multiple server instances.

Role-based access control (RBAC) adds authorization on top of authentication. Instead of every authenticated user having the same access, RBAC assigns roles (admin, editor, viewer) that determine which endpoints they can access. Implement this as a dependency chain: get_current_user → require_role("admin"). The JWT includes the role claim, so the dependency can check it without database lookups.`,
          codeExamples: [
            {
              title: 'Production Auth with Rate Limiting & RBAC',
              description: 'A complete production authentication system',
              code: `from fastapi import FastAPI, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, field_validator
import redis

app = FastAPI()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
r = redis.Redis(host="localhost", port=6379, db=0, decode_responses=True)

class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be 8+ characters")
        return v

def check_rate_limit(request: Request):
    """Rate limit: 5 login attempts per IP per minute."""
    ip = request.client.host if request.client else "unknown"
    key = f"rate_limit:{ip}"
    attempts = r.incr(key)
    if attempts == 1:
        r.expire(key, 60)
    if attempts > 5:
        raise HTTPException(status_code=429, detail="Too many attempts. Try again in 1 minute.")

@app.post("/register", status_code=201)
async def register(user: UserRegister):
    hashed = pwd_context.hash(user.password)
    # Store user in database with hashed password
    return {"message": "User created", "username": user.username}

@app.post("/auth/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), request: Request = None):
    check_rate_limit(request)  # Rate limit before checking credentials
    # Verify credentials against database...
    return {"access_token": "token_here", "token_type": "bearer"}`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'architecture',
            title: 'Production Auth Architecture',
            description: 'The components of a complete authentication system',
            layers: [
              { label: 'Client', items: ['Login Form', 'Token Storage', 'Auto-Refresh Logic'] },
              { label: 'API Gateway', items: ['Rate Limiter (Redis)', 'CORS Policy', 'Request Logging'] },
              { label: 'Auth Service', items: ['Credential Verification', 'JWT Creation', 'Refresh Rotation'] },
              { label: 'Data Layer', items: ['User Database', 'Token Store (Redis)', 'Audit Logs'] },
            ],
          },
          tips: [
            'Implement rate limiting on ALL auth endpoints, not just login. Registration, password reset, and token refresh are also attack vectors.',
            'Log all auth events (login, logout, failed attempts) for security auditing.',
          ],
          keyTakeaway: 'Production auth = registration + login + rate limiting + JWT lifecycle + RBAC + audit logging. Every component must be secure and monitored.',
          realWorldAnalogy: 'A production auth system is like airport security. Registration is getting your passport (identity verification). Login is the security checkpoint (credential check). Rate limiting is the queue management (preventing overcrowding). JWT is your boarding pass (time-limited access). RBAC is your ticket class (economy vs business lounges).',
          commonMistakes: [
            { mistake: 'Not rate-limiting the registration endpoint', fix: 'Limit registrations per IP (e.g., 3 per hour) to prevent automated account creation. Also add CAPTCHA for suspicious patterns.' },
            { mistake: 'Storing plain text passwords "temporarily" during development', fix: 'NEVER store plain text passwords, even in development. Use bcrypt from day one. A leaked development database with plain text passwords is a security disaster.' },
          ],
          interviewQuestions: [
            { question: 'How do you implement distributed rate limiting for a FastAPI application?', answer: 'Use Redis with INCR and EXPIRE commands. Each login attempt increments a counter keyed by IP. If the counter exceeds the limit, return 429. Redis is atomic and shared across all server instances.' },
            { question: 'What security measures should a production auth system have?', answer: 'Password hashing (bcrypt), rate limiting, refresh token rotation, RBAC, audit logging, HTTPS enforcement, CORS configuration, input validation, and session revocation capability.' },
          ],
          proTips: [
            'Use Redis for both rate limiting and refresh token storage — it provides atomic operations, automatic TTL expiration, and sub-millisecond performance.',
            'Implement a security audit log that records every auth event: login (success/failure), token refresh, password change, and session revocation.',
          ],
          frontendIntegration: {
            title: 'Complete Login Flow Frontend',
            vanillaHtml: {
              title: 'JWT Login with Auto-Refresh',
              description: 'A frontend that handles login, token storage, and automatic refresh on 401',
              code: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>JWT Auth</title>
<style>
  body { font-family: system-ui; max-width: 500px; margin: 2rem auto; }
  input { padding: 0.4rem; border: 1px solid #cbd5e1; border-radius: 4px; width: 100%; margin: 0.3rem 0; }
  button { background: #0d9488; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; }
  .ok { color: #059669; } .err { color: #dc2626; }
</style>
</head>
<body>
  <h1>Login</h1>
  <input id="user" placeholder="Username">
  <input id="pass" type="password" placeholder="Password">
  <button onclick="login()">Login</button>
  <button onclick="fetchProtected()">Get Profile</button>
  <button onclick="logout()">Logout</button>
  <pre id="out"></pre>
  <script>
    const API = "http://localhost:8000";
    async function login() {
      const fd = new URLSearchParams();
      fd.append("username", document.getElementById("user").value);
      fd.append("password", document.getElementById("pass").value);
      const res = await fetch(API + "/auth/login", { method: "POST", headers: {"Content-Type": "application/x-www-form-urlencoded"}, body: fd });
      if (res.ok) { const d = await res.json(); localStorage.setItem("token", d.access_token); document.getElementById("out").textContent = "Logged in!"; }
      else { document.getElementById("out").textContent = "Login failed!"; }
    }
    async function fetchProtected() {
      const token = localStorage.getItem("token");
      if (!token) { document.getElementById("out").textContent = "Not logged in!"; return; }
      const res = await fetch(API + "/users/me", { headers: {"Authorization": "Bearer " + token} });
      document.getElementById("out").textContent = res.ok ? JSON.stringify(await res.json(), null, 2) : "Unauthorized! Token may be expired.";
    }
    function logout() { localStorage.removeItem("token"); document.getElementById("out").textContent = "Logged out."; }
  </script>
</body>
</html>`,
              language: 'html',
              whatHappened: ['Login sends form-data and stores the JWT token', 'Protected requests include the Bearer token', 'Logout removes the token from localStorage'],
              tryToBreak: ['Wait for the token to expire, then try fetching — you should get 401']
            },
            corsNote: 'Login uses form-data (application/x-www-form-urlencoded). Ensure CORS allows this Content-Type and exposes Authorization headers.'
          },
        },
      ],
    },
    {
      id: 'm8-database-simulation',
      title: 'Database Query Pipeline',
      icon: '🗄️',
      simulation: 'DATABASE_QUERY',
      introduction:
        'Every database query in a FastAPI application travels through multiple layers: from your route handler, through SQLAlchemy ORM, into the connection pool, to the database server, through the query planner, and back with results. Understanding this pipeline helps you optimize queries, configure connection pools, and avoid the dreaded N+1 problem.',
      sections: [
        {
          heading: 'From Endpoint to Database and Back',
          content: `When your FastAPI endpoint makes a database query, the request flows through several layers before reaching the actual database server. Understanding each layer helps you diagnose slow queries, configure connection pools correctly, and optimize the entire data access pipeline.

The journey starts when your handler calls a SQLAlchemy query method like db.query(User).filter(User.active == True).all(). SQLAlchemy translates this Python expression into a SQL statement (SELECT * FROM users WHERE active = true) using its query compilation system. This compilation step is fast but not free — complex queries with many joins and subqueries take longer to compile.

Next, SQLAlchemy requests a database connection from the connection pool. If a connection is available (idle in the pool), it is returned immediately. If all connections are in use and the pool hasn't reached its maximum, a new connection is created. If the pool is full, the request waits until a connection is returned. This is why proper pool sizing is critical — too small and requests queue up, too large and you waste database resources.

The SQL statement is then sent to the database server over the network. The database server's query planner analyzes the statement and creates an execution plan, choosing between index scans, sequential scans, and join strategies. The plan is executed, rows are fetched, and results are sent back over the network. SQLAlchemy converts the raw rows into Python objects (ORM hydration), which are then validated and serialized by Pydantic for the API response.`,
          codeExamples: [
            {
              title: 'Instrumenting the Query Pipeline',
              description: 'Measure time at each stage of the database query pipeline',
              code: `import time
import logging
from fastapi import FastAPI, Depends, Request
from sqlalchemy.orm import Session
from contextlib import contextmanager

logger = logging.getLogger("api.queries")

@contextmanager
def query_timer(label: str):
    """Context manager to time database operations."""
    start = time.time()
    try:
        yield
    finally:
        elapsed = (time.time() - start) * 1000
        logger.info(f"{label}: {elapsed:.1f}ms")

@app.get("/users")
def list_users(db: Session = Depends(get_db)):
    with query_timer("Total endpoint"):
        with query_timer("Query execution"):
            users = db.query(User).filter(User.is_active == True).all()

        with query_timer("Serialization"):
            return [UserResponse.model_validate(u) for u in users]`,
              language: 'python',
              output: `INFO:api.queries:Query execution: 15.3ms
INFO:api.queries:Serialization: 2.1ms
INFO:api.queries:Total endpoint: 18.2ms`,
            },
          ],
          visualization: {
            type: 'flow',
            title: 'Database Query Pipeline',
            description: 'Each stage from endpoint to database and back',
            steps: [
              { label: 'Handler calls query', detail: 'db.query(User).filter(...).all()', timing: '0ms', highlight: true },
              { label: 'SQLAlchemy compiles SQL', detail: 'ORM expression → SQL string', timing: '0.5ms' },
              { label: 'Connection pool checkout', detail: 'Get connection from pool (or create new)', timing: '1ms' },
              { label: 'Network round-trip', detail: 'SQL sent to DB server over network', timing: '2ms' },
              { label: 'Query planner', detail: 'Database chooses execution strategy', timing: '2ms', highlight: true },
              { label: 'Query execution', detail: 'Index scan, fetch rows', timing: '10ms' },
              { label: 'Network return', detail: 'Result rows sent back', timing: '2ms' },
              { label: 'ORM hydration', detail: 'Raw rows → Python objects', timing: '3ms' },
              { label: 'Pydantic serialization', detail: 'Objects → validated response', timing: '2ms', highlight: true },
            ],
          },
          tips: [
            'The query planner is your friend — use EXPLAIN ANALYZE to see the execution plan for slow queries.',
            'Connection pool sizing: start with pool_size=5, max_overflow=10 for most applications.',
          ],
          keyTakeaway: 'A database query passes through: ORM compilation → connection pool → network → query planner → execution → network → ORM hydration → serialization. Each stage contributes to total latency.',
          realWorldAnalogy: 'The database query pipeline is like ordering food at a restaurant. You tell the waiter your order (handler calls query), the waiter writes it up (SQLAlchemy compiles SQL), the kitchen checks if a cook is available (connection pool), the cook reads the recipe (query planner), prepares the dish (execution), and the waiter brings it to your table (serialization).',
          commonMistakes: [
            { mistake: 'Setting pool_size too low for high-traffic applications', fix: 'Monitor pool usage with SQLAlchemy pool events. If requests are waiting for connections, increase pool_size or max_overflow. Use pool_pre_ping=True to detect stale connections.' },
            { mistake: 'Not using EXPLAIN ANALYZE to understand query performance', fix: 'Run EXPLAIN ANALYZE on slow queries in your database client. Look for sequential scans on large tables (should use index scans) and unnecessary sorts (add indexes).' },
          ],
          interviewQuestions: [
            { question: 'What happens when SQLAlchemy executes db.query(User).all()?', answer: 'SQLAlchemy compiles the ORM expression into a SQL string, acquires a connection from the pool, sends the SQL to the database, receives the result rows, hydrates them into User ORM objects, and returns the connection to the pool.' },
            { question: 'How do you diagnose a slow database query?', answer: '1) Add timing to the query execution, 2) Use EXPLAIN ANALYZE to see the execution plan, 3) Check for missing indexes (sequential scans), 4) Verify the connection pool isn\'t exhausted, 5) Look for N+1 query patterns.' },
          ],
          proTips: [
            'Use SQLAlchemy events to log slow queries automatically: listen for after_cursor_execute and log queries that take more than 100ms.',
            'Set pool_pre_ping=True on your engine to detect stale connections before they cause errors in production.',
          ],
        },
        {
          heading: 'Connection Pooling & Query Optimization',
          content: `Connection pooling is one of the most impactful performance optimizations for database-backed APIs. Creating a new database connection is expensive — it involves TCP handshake, authentication, and session initialization, typically taking 10-50ms. In a high-traffic API handling hundreds of requests per second, creating a new connection for every request would overwhelm the database server.

SQLAlchemy's connection pool solves this by maintaining a set of reusable connections. When a request needs a database connection, it checks out an existing one from the pool. When the request finishes, the connection is returned to the pool for reuse. This eliminates connection creation overhead and limits the total number of connections to the database.

The key pool parameters are pool_size (number of permanent connections), max_overflow (additional connections allowed beyond pool_size), and pool_timeout (how long to wait for a connection). For a FastAPI application with 4 Uvicorn workers, a pool_size of 5 per worker means 20 total connections to the database. Adjust these based on your database's max_connections setting.

Query optimization goes hand-in-hand with connection pooling. Even with a perfectly sized pool, slow queries will block connections and reduce throughput. The most common optimization is adding indexes on columns used in WHERE, JOIN, and ORDER BY clauses. An index scan on a million-row table takes milliseconds; a sequential scan takes seconds. Other optimizations include selecting only needed columns (not SELECT *), using EXISTS instead of COUNT for existence checks, and batching INSERT statements.`,
          codeExamples: [
            {
              title: 'Monitoring Connection Pool Usage',
              description: 'Track pool checkout time and connection usage',
              code: `from sqlalchemy import event, create_engine
import time

engine = create_engine(
    "postgresql://user:pass@localhost/mydb",
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
    pool_pre_ping=True,  # Detect stale connections
)

checkout_times = []

@event.listens_for(engine, "before_cursor_execute")
def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    context._query_start_time = time.time()

@event.listens_for(engine, "after_cursor_execute")
def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    elapsed = (time.time() - context._query_start_time) * 1000
    if elapsed > 100:  # Log slow queries (>100ms)
        print(f"SLOW QUERY ({elapsed:.0f}ms): {statement[:100]}...")`,
              language: 'python',
            },
          ],
          tips: [
            'Set pool_pre_ping=True to detect and replace stale connections before they cause errors.',
            'Log slow queries automatically using SQLAlchemy events — queries over 100ms deserve investigation.',
          ],
          keyTakeaway: 'Connection pooling reuses database connections to eliminate creation overhead. Pool sizing and query optimization work together — a well-sized pool with slow queries is still slow.',
          realWorldAnalogy: 'Connection pooling is like having a fleet of taxis waiting at a hotel. Instead of calling a new taxi for each guest (creating a connection), guests take an available taxi from the lineup (pool). When they arrive, the taxi returns to the hotel to wait for the next guest. The fleet size (pool_size) must match demand.',
          commonMistakes: [
            { mistake: 'Setting pool_size too high, exhausting database connections', fix: 'Calculate total connections: workers x pool_size + workers x max_overflow. This must be less than your database max_connections setting.' },
            { mistake: 'Not using pool_pre_ping to detect stale connections', fix: 'Always set pool_pre_ping=True. Without it, connections that go stale (database restart, network timeout) cause OperationalError in your handlers.' },
          ],
          interviewQuestions: [
            { question: 'How do you size a database connection pool?', answer: 'Formula: total_connections = workers x (pool_size + max_overflow). This must be less than your database max_connections. Start with pool_size=5, max_overflow=10 per worker, and monitor usage.' },
            { question: 'What is pool_pre_ping and why is it important?', answer: 'pool_pre_ping sends a lightweight test query before each checkout to verify the connection is alive. Without it, stale connections (from database restarts or network timeouts) cause errors in your handlers.' },
          ],
          proTips: [
            'Monitor your pool with engine.pool.status() — it shows checked-out, overflow, and invalid connections. Add this to a /debug/pool endpoint (development only).',
            'For serverless deployments (AWS Lambda, Cloud Functions), use NullPool to create fresh connections per invocation since instances are ephemeral.',
          ],
        },
        {
          heading: 'Building a Query Performance Dashboard',
          content: `A query performance dashboard gives you real-time visibility into how your database is performing. It tracks slow queries, connection pool utilization, query frequency, and latency percentiles. Building one is surprisingly straightforward with FastAPI, SQLAlchemy events, and a simple frontend.

The backend uses SQLAlchemy event listeners to capture every query's execution time and SQL statement. This data is stored in a circular buffer (or Redis for distributed systems) and exposed via a FastAPI endpoint. The frontend polls this endpoint and renders charts showing query performance over time.

Key metrics to track include: average query time, P95/P99 latency (the slowest 5% and 1% of queries), queries per second, slow query count (queries over a threshold), and connection pool utilization (active connections vs total). These metrics help you identify performance degradation before it affects users.

For production, integrate with proper monitoring tools like Prometheus + Grafana, Datadog, or New Relic. These tools provide alerting, historical analysis, and cross-service correlation that a custom dashboard can't match. However, building a simple custom dashboard is an excellent learning exercise and useful during development.`,
          codeExamples: [
            {
              title: 'Query Performance Metrics API',
              description: 'FastAPI endpoint that exposes query performance metrics',
              code: `from fastapi import FastAPI
from collections import deque
from threading import Lock
import time

app = FastAPI()

class QueryMetrics:
    def __init__(self, max_entries=1000):
        self.queries = deque(maxlen=max_entries)
        self.lock = Lock()

    def record(self, sql: str, duration_ms: float):
        with self.lock:
            self.queries.append({
                "sql": sql[:200],
                "duration_ms": round(duration_ms, 2),
                "timestamp": time.time()
            })

    def get_summary(self):
        with self.lock:
            if not self.queries:
                return {"total_queries": 0}
            durations = [q["duration_ms"] for q in self.queries]
            sorted_d = sorted(durations)
            return {
                "total_queries": len(durations),
                "avg_ms": round(sum(durations) / len(durations), 1),
                "p50_ms": sorted_d[len(sorted_d) // 2],
                "p95_ms": sorted_d[int(len(sorted_d) * 0.95)],
                "p99_ms": sorted_d[-1],
                "slow_queries": len([d for d in durations if d > 100]),
            }

metrics = QueryMetrics()

@app.get("/debug/query-metrics")
def get_query_metrics():
    return metrics.get_summary()`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'comparison',
            title: 'Query Performance Metrics',
          description: 'Key metrics to track for database query performance',
            columns: [
              { title: 'Metric', items: ['Average Query Time', 'P95 Latency', 'P99 Latency', 'Queries/Second', 'Slow Query Count', 'Pool Utilization'] },
              { title: 'Warning', items: ['> 50ms', '> 200ms', '> 500ms', '> Pool size', '> 5/min', '> 80%'] },
              { title: 'Critical', items: ['> 200ms', '> 1s', '> 5s', '> Max connections', '> 20/min', '> 95%'] },
              { title: 'Action', items: ['Add index', 'Optimize query', 'Cache results', 'Scale workers', 'Investigate N+1', 'Increase pool'] },
            ],
          },
          tips: [
            'Track P95 and P99 latency, not just averages. Averages hide the worst-case experience that affects real users.',
            'Set up alerts for slow query count exceeding threshold — it is often the first sign of a missing index or N+1 problem.',
          ],
          keyTakeaway: 'A query performance dashboard tracks execution time, latency percentiles, and pool utilization — giving you real-time visibility into database health.',
          realWorldAnalogy: 'A query performance dashboard is like a heart monitor for your database. Average query time is the resting heart rate, P99 latency is the peak heart rate during stress, and pool utilization is blood pressure. Any metric going into the red zone means the patient needs attention.',
          commonMistakes: [
            { mistake: 'Only tracking average query time', fix: 'Track P50, P95, and P99 latency. Averages hide outliers — a P99 of 5 seconds with an average of 50ms means 1% of your users have a terrible experience.' },
            { mistake: 'Not setting up alerts for slow query spikes', fix: 'Configure alerts when slow query count exceeds a threshold (e.g., > 10 per minute). A sudden spike in slow queries often indicates a missing index, N+1 problem, or database resource exhaustion.' },
          ],
          interviewQuestions: [
            { question: 'Why is P99 latency more important than average latency?', answer: 'P99 shows the experience of the slowest 1% of requests. An average of 50ms with P99 of 5s means most requests are fast but 1% of users wait 5 seconds. Average hides this terrible user experience.' },
            { question: 'How do you implement distributed query metrics across multiple server instances?', answer: 'Use Redis or a time-series database (Prometheus, InfluxDB) to aggregate metrics from all instances. Each server pushes its query data to the shared store, and the dashboard reads from the aggregated data.' },
          ],
          proTips: [
            'Integrate with Prometheus + Grafana for production monitoring. Prometheus scrapes metrics from your FastAPI app, and Grafana visualizes them with alerting.',
            'Add the /debug/query-metrics endpoint only in development or behind authentication. Exposing query details in production is a security risk.',
          ],
          frontendIntegration: {
            title: 'Simple Query Performance Viewer',
            vanillaHtml: {
              title: 'Database Query Metrics Dashboard',
              description: 'A frontend that displays query performance metrics from FastAPI',
              code: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Query Metrics</title>
<style>
  body { font-family: system-ui; max-width: 600px; margin: 2rem auto; }
  .metric { display: inline-block; padding: 1rem; border: 1px solid #e2e8f0; border-radius: 8px; margin: 0.3rem; text-align: center; min-width: 120px; }
  .metric .value { font-size: 1.5rem; font-weight: bold; color: #0d9488; }
  .metric .label { font-size: 0.75rem; color: #64748b; }
  button { background: #0d9488; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; margin: 0.5rem 0; }
</style>
</head>
<body>
  <h1>Query Metrics</h1>
  <button onclick="refresh()">Refresh</button>
  <div id="metrics"></div>
  <script>
    async function refresh() {
      const res = await fetch("http://localhost:8000/debug/query-metrics");
      const m = await res.json();
      document.getElementById("metrics").innerHTML =
        '<div class="metric"><div class="value">' + m.total_queries + '</div><div class="label">Total Queries</div></div>' +
        '<div class="metric"><div class="value">' + m.avg_ms + 'ms</div><div class="label">Average</div></div>' +
        '<div class="metric"><div class="value">' + m.p95_ms + 'ms</div><div class="label">P95</div></div>' +
        '<div class="metric"><div class="value">' + m.p99_ms + 'ms</div><div class="label">P99</div></div>' +
        '<div class="metric"><div class="value">' + m.slow_queries + '</div><div class="label">Slow Queries</div></div>';
    }
    refresh();
    setInterval(refresh, 5000);
  </script>
</body>
</html>`,
              language: 'html',
              whatHappened: ['Metrics are fetched from the /debug/query-metrics endpoint', 'The dashboard auto-refreshes every 5 seconds', 'Key metrics (avg, P95, P99) are displayed clearly'],
              tryToBreak: ['Stop the API server — metrics will fail to load']
            },
            corsNote: 'The metrics endpoint needs CORS configured for cross-origin access from the dashboard page.'
          },
        },
      ],
    },
  ],
};
