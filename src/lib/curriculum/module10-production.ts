import { Module } from './types';

export const module10Production: Module = {
  id: 'module-10-production',
  title: 'Building Complete Production Apps',
  icon: '🏭',
  description:
    'Put everything together to build production-grade FastAPI applications. From task queues and background jobs to monitoring, observability, and CI/CD pipelines — this module transforms your knowledge into deployable, maintainable systems.',
  topics: [
    {
      id: 'm10-background-tasks',
      title: 'Background Tasks & Job Queues',
      icon: '⚡',
      introduction:
        'Not everything needs to happen in the request-response cycle. Sending emails, processing images, generating reports, and syncing with external services can all be done in the background. FastAPI provides built-in BackgroundTasks for simple cases and integrates with Celery for distributed job processing. This topic covers both approaches and when to use each.',
      sections: [
        {
          heading: 'FastAPI BackgroundTasks',
          content: `FastAPI includes a simple but powerful BackgroundTasks system that lets you defer work until after the response is sent. When you add a task to BackgroundTasks, FastAPI sends the HTTP response immediately and then executes the background function. This means the client does not wait for the background work to complete.

BackgroundTasks is perfect for operations that are not critical to the response but still need to happen. Common examples include sending welcome emails after user registration, logging analytics events, invalidating cache entries, and triggering webhooks. The key constraint is that these operations must be able to tolerate failure — if the server crashes after sending the response but before the background task runs, the task is lost.

To use BackgroundTasks, add a parameter of type BackgroundTasks to your route handler. FastAPI automatically injects it. Then call tasks.add_task(function, *args, **kwargs) to schedule work. You can add multiple tasks, and they run in order after the response is sent.

For sync functions, FastAPI runs them in a thread pool so they do not block the event loop. For async functions, FastAPI awaits them directly. This means you should use async background tasks when you need to perform async I/O (like sending an email via an async SMTP client) and sync background tasks for CPU-bound work or blocking I/O.

The important limitation of BackgroundTasks is that tasks only run on the same server process that handled the request. If you have multiple Uvicorn workers, a task scheduled on worker 1 runs on worker 1. This is fine for simple applications but breaks down when you need guaranteed delivery, retries, or distributed processing across multiple servers.`,
          codeExamples: [
            {
              title: 'BackgroundTasks for Email Sending',
              description: 'Send a welcome email after user registration without blocking the response',
              code: `from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel, EmailStr

app = FastAPI()

class UserCreate(BaseModel):
    username: str
    email: EmailStr

async def send_welcome_email(username: str, email: str):
    """Simulated async email sender."""
    import asyncio
    await asyncio.sleep(2)  # Simulate SMTP delay
    print(f"Welcome email sent to {username} <{email}>")

def log_registration(username: str):
    """Simulated sync logger."""
    import time
    time.sleep(0.5)
    print(f"Registration logged: {username}")

@app.post("/users", status_code=201)
async def create_user(user: UserCreate, tasks: BackgroundTasks):
    # Schedule background work — runs AFTER response is sent
    tasks.add_task(send_welcome_email, user.username, user.email)
    tasks.add_task(log_registration, user.username)

    # Response is sent immediately — client does not wait for email
    return {
        "id": 1,
        "username": user.username,
        "email": user.email,
        "message": "User created. Welcome email will be sent shortly.",
    }`,
              language: 'python',
            },
            {
              title: 'BackgroundTasks with Database',
              description: 'Update database records in the background',
              code: `from fastapi import FastAPI, BackgroundTasks, Depends
from sqlalchemy.ext.asyncio import AsyncSession

app = FastAPI()

async def update_last_login(user_id: int, db_session_factory):
    """Update user's last login timestamp in the background."""
    async with db_session_factory() as db:
        from sqlalchemy import update
        from app.features.users.models import User
        await db.execute(
            update(User)
            .where(User.id == user_id)
            .values(last_login=datetime.utcnow())
        )
        await db.commit()

@app.post("/auth/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    tasks: BackgroundTasks = Depends(),
):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401)

    # Schedule DB update in the background — login feels instant
    tasks.add_task(update_last_login, user.id, AsyncSessionLocal)

    return {"access_token": create_token(user), "token_type": "bearer"}`,
              language: 'python',
            },
            {
              title: 'When NOT to Use BackgroundTasks',
              description: 'Limitations and when to upgrade to Celery',
              code: `# ❌ BAD: Using BackgroundTasks for critical operations
@app.post("/payments")
async def process_payment(payment: PaymentCreate, tasks: BackgroundTasks):
    tasks.add_task(charge_credit_card, payment)  # If server crashes, payment lost!
    return {"status": "processing"}  # Client has no way to check status

# ❌ BAD: Using BackgroundTasks for long-running operations
@app.post("/reports")
async def generate_report(tasks: BackgroundTasks):
    tasks.add_task(generate_large_report)  # Takes 10 minutes — ties up worker
    return {"status": "started"}  # No progress tracking, no cancellation

# ✅ GOOD: Use BackgroundTasks for fire-and-forget operations
@app.post("/users")
async def create_user(user: UserCreate, tasks: BackgroundTasks):
    tasks.add_task(send_welcome_email, user.email)  # OK if email is delayed
    tasks.add_task(invalidate_cache, "users")        # OK if cache is stale briefly
    return create_user_record(user)                   # Core work is done synchronously

# When to upgrade to Celery:
# 1. You need guaranteed delivery (no lost tasks)
# 2. Tasks take longer than a few seconds
# 3. You need retries on failure
# 4. You need progress tracking
# 5. You need to distribute work across multiple servers`,
              language: 'python',
            },
            {
              title: 'Testing Background Tasks',
              description: 'How to verify background tasks were scheduled',
              code: `from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_user_sends_email():
    response = client.post("/users", json={
        "username": "testuser",
        "email": "test@example.com",
    })
    assert response.status_code == 201

    # With TestClient, background tasks run automatically after the response
    # Verify the email was sent (check your mock/fixture)
    # Alternatively, use dependency_overrides to replace send_welcome_email
    # with a mock that tracks calls

# For more control, test the background function directly
async def test_send_welcome_email():
    # Test the function independently
    await send_welcome_email("alice", "alice@test.com")
    # Assert email was sent (mock the SMTP client)`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'flow',
            title: 'BackgroundTasks Execution Flow',
            description: 'How background tasks execute after the response',
            steps: [
              { label: 'Request arrives', detail: 'POST /users with registration data', highlight: false },
              { label: 'Handler processes', detail: 'Create user record in database', highlight: true },
              { label: 'Task scheduled', detail: 'tasks.add_task(send_email, ...)', highlight: false },
              { label: 'Response sent', detail: '201 Created returned immediately', highlight: true },
              { label: 'Background task runs', detail: 'send_welcome_email() executes', highlight: true },
              { label: 'Task complete', detail: 'Email sent (or error logged)', highlight: false },
            ],
          },
          tips: [
            'BackgroundTasks are best for fire-and-forget operations. If the task MUST succeed, use Celery with retries instead.',
            'Use async background tasks for async I/O (email, HTTP calls) and sync background tasks for CPU-bound work (image processing).',
            'Keep background tasks short — they tie up the Uvicorn worker until complete. Long tasks should use Celery.',
          ],
          warning: 'BackgroundTasks are lost if the server crashes or restarts. Never use them for critical operations like payment processing, order fulfillment, or data migrations. Use Celery with a persistent message broker for guaranteed delivery.',
          keyTakeaway: 'FastAPI BackgroundTasks defer work until after the response is sent. Use them for fire-and-forget operations like emails and logging. For guaranteed delivery and long-running tasks, use Celery.',
          realWorldAnalogy: 'BackgroundTasks are like a restaurant server who takes your order, brings your food, and then cleans the table after you leave. The cleanup (background task) happens after the main service (response) is complete. If the restaurant closes unexpectedly before cleanup, the table stays dirty — just like a lost background task.',
          commonMistakes: [
            { mistake: 'Using BackgroundTasks for critical operations that must succeed', fix: 'Use Celery with a persistent message broker (Redis/RabbitMQ) for critical tasks. Celery guarantees delivery, supports retries, and survives server restarts.' },
            { mistake: 'Running long background tasks that tie up Uvicorn workers', fix: 'Background tasks should complete in under 30 seconds. For longer tasks, use Celery workers that run independently from the API server.' },
          ],
          interviewQuestions: [
            { question: 'What are the limitations of FastAPI BackgroundTasks?', answer: 'Three key limitations: (1) Tasks are lost if the server crashes — no persistence or guaranteed delivery. (2) Tasks run on the same server process — not distributed. (3) Long tasks tie up Uvicorn workers — no separate worker pool.' },
            { question: 'When should you use Celery instead of BackgroundTasks?', answer: 'Use Celery when: tasks must not be lost (payments, orders), tasks take more than a few seconds (report generation, image processing), you need retries on failure, you need progress tracking, or you need to distribute work across multiple servers.' },
          ],
          proTips: [
            'Combine BackgroundTasks with a short-lived Redis flag for simple progress tracking. Set a key when the task starts, delete it when done. The client can poll a status endpoint.',
            'For production, always use Celery with Redis as the broker. It gives you retries, scheduled tasks, worker monitoring, and task persistence for minimal additional complexity.',
          ],
          frontendIntegration: {
            title: 'Task Submission Interface',
            vanillaHtml: {
              title: 'Background Task Demo',
              description: 'A frontend that submits background tasks and checks status',
              code: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Background Tasks</title>
<style>
  body { font-family: system-ui; max-width: 600px; margin: 2rem auto; background: #0f172a; color: #e2e8f0; }
  .card { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 1rem; margin: 0.5rem 0; }
  button { background: #0d9488; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; }
  .status { font-family: monospace; font-size: 0.85rem; color: #2dd4bf; }
</style>
</head>
<body>
  <h1>Background Task Demo</h1>
  <div class="card">
    <p>Submit a user registration. The welcome email is sent in the background.</p>
    <input id="username" placeholder="Username" style="background:#0f172a;border:1px solid #334155;color:#e2e8f0;padding:0.4rem;border-radius:4px;">
    <input id="email" placeholder="Email" style="background:#0f172a;border:1px solid #334155;color:#e2e8f0;padding:0.4rem;border-radius:4px;">
    <button onclick="register()">Register</button>
    <div class="status" id="result"></div>
  </div>
  <script>
    async function register() {
      const username = document.getElementById("username").value;
      const email = document.getElementById("email").value;
      document.getElementById("result").textContent = "Registering...";
      const res = await fetch("http://localhost:8000/users", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({username, email})
      });
      const data = await res.json();
      document.getElementById("result").textContent = "Registered! " + data.message;
    }
  </script>
</body>
</html>`,
              language: 'html',
              whatHappened: [
                'The registration response is returned immediately',
                'The welcome email is sent in the background after the response',
                'The user does not wait for the email to be sent',
              ],
              tryToBreak: [
                'Try registering with an invalid email format',
                'Shut down the server immediately after registration — the background email task will be lost',
              ],
            },
            corsNote: 'Configure CORSMiddleware with your frontend origin for cross-origin requests.',
          },
        },
        {
          heading: 'Celery & Redis Task Queue',
          content: `Celery is the industry-standard distributed task queue for Python. It decouples task submission from task execution: your FastAPI application submits tasks to a message broker (Redis or RabbitMQ), and separate Celery worker processes pick up and execute those tasks. This architecture provides guaranteed delivery, automatic retries, scheduled execution, and horizontal scaling.

The core Celery concepts are: the broker (Redis or RabbitMQ) holds tasks in queues, the worker processes execute tasks, and the backend (Redis or database) stores task results. Your FastAPI app creates a Celery instance, defines tasks as Python functions decorated with @celery.task, and calls them with .delay() or .apply_async().

Celery workers run independently from your FastAPI application. You can scale workers independently — add more workers during peak hours, reduce them during off-peak. Workers can be specialized: a high-priority worker for email sending, a CPU-heavy worker for image processing. This separation of concerns means your API stays fast regardless of how much background work needs to be done.

For production deployments, use Redis as both broker and backend. Redis is fast, reliable, and supports persistence. RabbitMQ is an alternative broker with more advanced routing features but adds operational complexity. Start with Redis and switch to RabbitMQ only if you need its advanced features.`,
          codeExamples: [
            {
              title: 'Celery Configuration with FastAPI',
              description: 'Setting up Celery with Redis broker',
              code: `# app/core/celery_app.py
from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "worker",
    broker=settings.CELERY_BROKER_URL,  # redis://localhost:6379/0
    backend=settings.CELERY_RESULT_BACKEND,  # redis://localhost:6379/1
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_default_queue="default",
    task_routes={
        "app.tasks.emails.*": {"queue": "emails"},
        "app.tasks.reports.*": {"queue": "reports"},
    },
)`,
              language: 'python',
            },
            {
              title: 'Defining Celery Tasks',
              description: 'Creating tasks with retries and error handling',
              code: `# app/tasks/emails.py
from app.core.celery_app import celery_app
import smtplib

@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def send_email_task(self, to: str, subject: str, body: str):
    """Send an email with automatic retries on failure."""
    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login("noreply@myapp.com", "app-password")
            server.sendmail("noreply@myapp.com", to, f"Subject: {subject}\\n\\n{body}")
    except (smtplib.SMTPException, ConnectionError) as exc:
        # Retry up to 3 times with 60-second delay
        raise self.retry(exc=exc)

# app/tasks/reports.py
@celery_app.task(bind=True)
def generate_report_task(self, report_type: str, params: dict):
    """Generate a report with progress tracking."""
    self.update_state(state="PROGRESS", meta={"progress": 0})
    # Step 1: Fetch data
    self.update_state(state="PROGRESS", meta={"progress": 33})
    data = fetch_report_data(report_type, params)
    # Step 2: Process
    self.update_state(state="PROGRESS", meta={"progress": 66})
    report = process_report(data)
    # Step 3: Save
    self.update_state(state="PROGRESS", meta={"progress": 100})
    return {"report_id": report.id, "url": report.url}`,
              language: 'python',
            },
            {
              title: 'Submitting Celery Tasks from FastAPI',
              description: 'How to submit and track Celery tasks',
              code: `# app/features/reports/router.py
from fastapi import APIRouter
from app.tasks.reports import generate_report_task

router = APIRouter(prefix="/reports", tags=["reports"])

@router.post("/generate")
async def request_report(report_type: str, params: dict = None):
    """Submit a report generation task."""
    task = generate_report_task.delay(report_type, params or {})
    return {
        "task_id": task.id,
        "status": "submitted",
        "check_status": f"/reports/status/{task.id}",
    }

@router.get("/status/{task_id}")
async def get_task_status(task_id: str):
    """Check the status of a report generation task."""
    from app.core.celery_app import celery_app
    task = celery_app.AsyncResult(task_id)

    if task.state == "PENDING":
        return {"state": "PENDING", "progress": 0}
    elif task.state == "PROGRESS":
        return {"state": "PROGRESS", "progress": task.info.get("progress", 0)}
    elif task.state == "SUCCESS":
        return {"state": "SUCCESS", "result": task.result}
    else:  # FAILURE
        return {"state": "FAILURE", "error": str(task.info)}`,
              language: 'python',
            },
            {
              title: 'Running Celery Workers',
              description: 'Starting workers and monitoring with Flower',
              code: `# Start FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Start Celery worker (default queue)
celery -A app.core.celery_app worker --loglevel=info --concurrency=4

# Start Celery worker (email queue only)
celery -A app.core.celery_app worker --loglevel=info -Q emails --concurrency=2

# Start Celery beat scheduler (for periodic tasks)
celery -A app.core.celery_app beat --loglevel=info

# Start Flower monitoring dashboard
celery -A app.core.celery_app flower --port=5555

# Docker Compose setup
# services:
#   api:
#     build: .
#     command: uvicorn app.main:app --host 0.0.0.0
#   worker:
#     build: .
#     command: celery -A app.core.celery_app worker --loglevel=info
#   beat:
#     build: .
#     command: celery -A app.core.celery_app beat --loglevel=info
#   redis:
#     image: redis:7-alpine
#   flower:
#     build: .
#     command: celery -A app.core.celery_app flower`,
              language: 'text',
            },
          ],
          visualization: {
            type: 'architecture',
            title: 'Celery Distributed Task Queue Architecture',
            description: 'How FastAPI, Redis, and Celery workers interact',
            layers: [
              { label: 'FastAPI App', items: ['Submit tasks', 'Check status', 'API endpoints'] },
              { label: 'Redis Broker', items: ['Task queue', 'Result backend', 'Priority queues'] },
              { label: 'Celery Workers', items: ['Email worker', 'Report worker', 'Default worker'] },
              { label: 'External Services', items: ['SMTP server', 'Storage (S3)', 'Database'] },
            ],
          },
          tips: [
            'Use task_acks_late=True so tasks are only marked as done after successful execution. This prevents lost tasks if a worker crashes mid-execution.',
            'Set worker_prefetch_multiplier=1 for long-running tasks so workers do not grab more tasks than they can handle.',
            'Use Flower for monitoring Celery workers in production — it shows task history, worker status, and real-time metrics.',
          ],
          warning: 'Celery workers must have access to the same code as your FastAPI app. If you deploy FastAPI in a Docker container, use the same image for Celery workers. Code mismatches cause silent deserialization errors.',
          keyTakeaway: 'Celery provides guaranteed delivery, retries, progress tracking, and distributed execution for background tasks. Use it for any operation that must not be lost, takes more than a few seconds, or needs to be distributed across servers.',
          realWorldAnalogy: 'Celery is like a delivery service. You drop off a package at the depot (submit a task to Redis), and drivers (workers) pick up packages and deliver them. If a driver gets a flat tire (worker crashes), the package goes back to the depot for redelivery (retry). You can track your package (check task status) and have specialized drivers for fragile items (task routing).',
          commonMistakes: [
            { mistake: 'Using the same Redis database for broker and application cache', fix: 'Use different Redis database numbers: db=0 for broker, db=1 for result backend, db=2 for application cache. This prevents key collisions and allows independent configuration.' },
            { mistake: 'Not handling task failures gracefully in the API', fix: 'Always check task state before returning results. Handle PENDING (task not started), PROGRESS (still running), SUCCESS (completed), and FAILURE (failed) states explicitly.' },
          ],
          interviewQuestions: [
            { question: 'How does Celery ensure tasks are not lost if a worker crashes?', answer: 'With task_acks_late=True, tasks are only acknowledged after successful execution. If a worker crashes mid-execution, the task is re-queued and picked up by another worker. Combined with a persistent broker (Redis with AOF), this provides at-least-once delivery.' },
            { question: 'How do you track the progress of a long-running Celery task?', answer: 'Use self.update_state(state="PROGRESS", meta={"progress": N}) inside the task to report progress. The API can then check the task state and return progress information to the client for a progress bar.' },
          ],
          proTips: [
            'Define task routes to send email tasks to an email-specific queue and report tasks to a report-specific queue. This lets you scale workers independently and prioritize email delivery over report generation.',
            'Use Celery beat for scheduled tasks (daily reports, cleanup jobs) instead of cron. Beat integrates with the same task infrastructure and provides better monitoring and error handling.',
          ],
          frontendIntegration: {
            title: 'Task Progress Tracker',
            vanillaHtml: {
              title: 'Report Generation with Progress',
              description: 'A frontend that submits a report task and shows real-time progress',
              code: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Task Progress</title>
<style>
  body { font-family: system-ui; max-width: 600px; margin: 2rem auto; background: #0f172a; color: #e2e8f0; }
  .card { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 1rem; margin: 0.5rem 0; }
  .progress-bar { width: 100%; height: 20px; background: #334155; border-radius: 10px; overflow: hidden; }
  .progress-fill { height: 100%; background: #0d9488; transition: width 0.5s; border-radius: 10px; }
  button { background: #0d9488; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; }
</style>
</head>
<body>
  <h1>Report Generator</h1>
  <button onclick="generateReport()">Generate Report</button>
  <div class="card" id="status" style="display:none;">
    <div>Status: <span id="state">PENDING</span></div>
    <div class="progress-bar"><div class="progress-fill" id="progress" style="width:0%"></div></div>
  </div>
  <script>
    async function generateReport() {
      const res = await fetch("http://localhost:8000/reports/generate?report_type=monthly", {method: "POST"});
      const data = await res.json();
      document.getElementById("status").style.display = "block";
      pollStatus(data.task_id);
    }
    async function pollStatus(taskId) {
      const res = await fetch("http://localhost:8000/reports/status/" + taskId);
      const data = await res.json();
      document.getElementById("state").textContent = data.state;
      const progress = data.progress || (data.state === "SUCCESS" ? 100 : 0);
      document.getElementById("progress").style.width = progress + "%";
      if (data.state !== "SUCCESS" && data.state !== "FAILURE") {
        setTimeout(() => pollStatus(taskId), 1000);
      }
    }
  </script>
</body>
</html>`,
              language: 'html',
              whatHappened: [
                'The frontend submits a report generation task via POST',
                'It polls the status endpoint every second',
                'The progress bar updates in real-time as the task progresses',
              ],
              tryToBreak: [
                'Stop the Celery worker — the task stays in PENDING forever',
                'Trigger a task failure — the progress bar shows FAILURE state',
              ],
            },
            corsNote: 'Configure CORSMiddleware for cross-origin requests from your frontend.',
          },
        },
      ],
    },
    {
      id: 'm10-monitoring',
      title: 'Monitoring & Observability',
      icon: '📊',
      introduction:
        'You cannot improve what you cannot measure. Production FastAPI applications need structured logging for debugging, health checks for load balancers, metrics for capacity planning, and distributed tracing for performance analysis. This topic covers the three pillars of observability — logs, metrics, and traces — and how to implement them in FastAPI.',
      sections: [
        {
          heading: 'Structured Logging',
          content: `Structured logging outputs log entries as JSON objects instead of plain text. This is essential for production systems because JSON logs can be parsed, filtered, and aggregated by tools like ELK Stack (Elasticsearch, Logstash, Kibana), Datadog, or Grafana Loki. Unstructured text logs require regex parsing, which is fragile and slow.

A structured log entry contains a timestamp, log level, message, and contextual fields. For a FastAPI application, the most important contextual fields are: request_id (for tracing), method (GET/POST), path (/api/v1/users), status_code (200/404/500), duration_ms (response time), and client_ip. These fields let you answer questions like "How many 500 errors occurred in the last hour?" or "What is the P95 latency for POST /orders?" with a single log query.

Python's built-in logging module supports structured logging via the extra parameter. You pass a dictionary of contextual fields, and a JSON formatter serializes them. For FastAPI, the best approach is to add a logging middleware that creates a request-scoped logger with the request ID, then uses it throughout the request lifecycle via contextvars.

Correlation IDs tie log entries together across services. When Service A calls Service B, it passes its request_id via the X-Request-ID header. Service B includes this ID in all its log entries, allowing you to trace a single user request across multiple services in your log aggregation tool.`,
          codeExamples: [
            {
              title: 'Structured JSON Logging Setup',
              description: 'Production-ready structured logging configuration',
              code: `# app/core/logging.py
import logging
import json
import sys
from datetime import datetime, timezone

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        # Add any extra fields
        if hasattr(record, "request_id"):
            log_entry["request_id"] = record.request_id
        if hasattr(record, "method"):
            log_entry["method"] = record.method
        if hasattr(record, "path"):
            log_entry["path"] = record.path
        if hasattr(record, "status_code"):
            log_entry["status_code"] = record.status_code
        if hasattr(record, "duration_ms"):
            log_entry["duration_ms"] = record.duration_ms

        if record.exc_info and record.exc_info[0] is not None:
            log_entry["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_entry)

def setup_logging():
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JSONFormatter())
    logger = logging.getLogger("app")
    logger.setLevel(logging.INFO)
    logger.addHandler(handler)
    return logger`,
              language: 'python',
            },
            {
              title: 'Request Logging Middleware',
              description: 'Middleware that logs every request with structured data',
              code: `# app/core/middleware.py
import time
import uuid
from contextvars import ContextVar
from fastapi import Request
from app.core.logging import setup_logging

logger = setup_logging()
request_id_var: ContextVar[str] = ContextVar("request_id", default="unknown")

async def logging_middleware(request: Request, call_next):
    # Generate or extract correlation ID
    req_id = request.headers.get("X-Request-ID", str(uuid.uuid4())[:8])
    request_id_var.set(req_id)
    start = time.time()

    logger.info(
        "request_started",
        extra={
            "request_id": req_id,
            "method": request.method,
            "path": request.url.path,
        },
    )

    try:
        response = await call_next(request)
        duration_ms = (time.time() - start) * 1000
        logger.info(
            "request_completed",
            extra={
                "request_id": req_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration_ms": round(duration_ms, 2),
            },
        )
        response.headers["X-Request-ID"] = req_id
        return response
    except Exception as exc:
        duration_ms = (time.time() - start) * 1000
        logger.error(
            "request_failed",
            extra={
                "request_id": req_id,
                "method": request.method,
                "path": request.url.path,
                "duration_ms": round(duration_ms, 2),
                "error": str(exc),
            },
        )
        raise`,
              language: 'python',
            },
            {
              title: 'Health Check Endpoints',
              description: 'Readiness and liveness probes for Kubernetes',
              code: `# app/routes/health.py
from fastapi import APIRouter, Depends
from sqlalchemy import text
from app.core.database import get_db
import redis

router = APIRouter(tags=["health"])

@router.get("/health")
async def health():
    """Liveness probe — is the app running?"""
    return {"status": "alive"}

@router.get("/health/ready")
async def readiness(db=Depends(get_db)):
    """Readiness probe — is the app ready to serve traffic?"""
    checks = {"database": False, "redis": False}

    # Check database connectivity
    try:
        result = await db.execute(text("SELECT 1"))
        checks["database"] = result.scalar() == 1
    except Exception:
        pass

    # Check Redis connectivity
    try:
        r = redis.Redis(host="localhost", port=6379)
        checks["redis"] = r.ping()
    except Exception:
        pass

    all_healthy = all(checks.values())
    return {
        "status": "ready" if all_healthy else "degraded",
        "checks": checks,
    }`,
              language: 'python',
            },
            {
              title: 'Prometheus Metrics Integration',
              description: 'Expose application metrics for Grafana dashboards',
              code: `# app/core/metrics.py
from prometheus_client import Counter, Histogram, generate_latest
from fastapi import APIRouter, Response

# Define metrics
REQUEST_COUNT = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "endpoint", "status_code"],
)

REQUEST_LATENCY = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency in seconds",
    ["method", "endpoint"],
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0],
)

router = APIRouter()

@router.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint."""
    return Response(
        content=generate_latest(),
        media_type="text/plain",
    )

# Usage in middleware:
# REQUEST_COUNT.labels(method, endpoint, status_code).inc()
# REQUEST_LATENCY.labels(method, endpoint).observe(duration)`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'architecture',
            title: 'Observability Stack',
            description: 'The three pillars of observability for FastAPI',
            layers: [
              { label: 'FastAPI App', items: ['Structured logging', 'Health checks', 'Prometheus metrics', 'OpenTelemetry'] },
              { label: 'Collection', items: ['Log aggregator', 'Prometheus server', 'Jaeger/Zipkin'] },
              { label: 'Visualization', items: ['Grafana dashboards', 'Kibana search', 'Jaeger traces'] },
            ],
          },
          tips: [
            'Always include a request_id in your logs. This single field enables tracing a request across all your services.',
            'Use health/ready endpoints for Kubernetes liveness and readiness probes. Liveness checks if the app is running; readiness checks if it can serve traffic (database connected, Redis available).',
            'Start with structured logging and health checks. Add Prometheus metrics and Grafana dashboards as your application grows.',
          ],
          warning: 'Never log sensitive data (passwords, tokens, personal information) in production. Use log filtering or explicitly exclude sensitive fields before logging.',
          keyTakeaway: 'Structured logging (JSON), health checks, Prometheus metrics, and distributed tracing are the four pillars of FastAPI observability. Start with logging and health checks, add metrics as you scale.',
          realWorldAnalogy: 'Observability is like a hospital monitoring system. Logs are the patient chart (what happened), metrics are the vital signs monitor (current state), and traces are the X-ray images (internal details). A doctor (developer) needs all three to diagnose and treat effectively.',
          commonMistakes: [
            { mistake: 'Using print() or unstructured logging in production', fix: 'Use Python logging with a JSON formatter. Unstructured logs cannot be searched or aggregated effectively. Every log entry should be parseable JSON with consistent field names.' },
            { mistake: 'Not setting up health checks for load balancers', fix: 'Implement /health (liveness) and /health/ready (readiness) endpoints. Load balancers and Kubernetes use these to route traffic only to healthy instances.' },
          ],
          interviewQuestions: [
            { question: 'What are the three pillars of observability?', answer: 'Logs (what happened), metrics (numeric measurements over time), and traces (request flow across services). Together they give you complete visibility into your application behavior.' },
            { question: 'What is the difference between liveness and readiness probes?', answer: 'Liveness checks if the application is running (should it be restarted?). Readiness checks if it can serve traffic (should load balancers send requests to it?). An app can be alive but not ready (e.g., database is down).' },
          ],
          proTips: [
            'Add P50/P95/P99 latency percentiles to your Grafana dashboards. Average latency hides outliers — P99 shows the experience of your slowest 1% of users.',
            'Use OpenTelemetry for distributed tracing. The opentelemetry-instrumentation-fastapi package auto-instruments your app with zero code changes, generating traces that flow across service boundaries.',
          ],
          frontendIntegration: {
            title: 'Health Dashboard',
            vanillaHtml: {
              title: 'API Health Monitor',
              description: 'A frontend that displays the API health status',
              code: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Health Dashboard</title>
<style>
  body { font-family: system-ui; max-width: 600px; margin: 2rem auto; background: #0f172a; color: #e2e8f0; }
  .status { padding: 1rem; border-radius: 8px; margin: 0.5rem 0; }
  .healthy { background: #065f46; border: 1px solid #10b981; }
  .degraded { background: #713f12; border: 1px solid #f59e0b; }
  .down { background: #7f1d1d; border: 1px solid #ef4444; }
  .check { display: flex; justify-content: space-between; padding: 0.3rem 0; }
  .dot { width: 12px; height: 12px; border-radius: 50%; }
  .green { background: #10b981; }
  .red { background: #ef4444; }
</style>
</head>
<body>
  <h1>API Health Dashboard</h1>
  <div id="health"></div>
  <script>
    async function checkHealth() {
      try {
        const res = await fetch("http://localhost:8000/health/ready");
        const data = await res.json();
        const cls = data.status === "ready" ? "healthy" : "degraded";
        document.getElementById("health").innerHTML =
          '<div class="status ' + cls + '"><h3>Status: ' + data.status + '</h3>' +
          Object.entries(data.checks).map(([k, v]) =>
            '<div class="check"><span>' + k + '</span><div class="dot ' + (v ? 'green' : 'red') + '"></div></div>'
          ).join("") + '</div>';
      } catch { document.getElementById("health").innerHTML = '<div class="status down"><h3>API DOWN</h3></div>'; }
    }
    checkHealth();
    setInterval(checkHealth, 5000);
  </script>
</body>
</html>`,
              language: 'html',
              whatHappened: [
                'The dashboard polls the health endpoint every 5 seconds',
                'Each dependency (database, Redis) shows a green or red dot',
                'The overall status shows ready, degraded, or down',
              ],
              tryToBreak: [
                'Stop the database — the health check should show degraded',
                'Stop the API server — the dashboard shows API DOWN',
              ],
            },
            corsNote: 'Configure CORSMiddleware for cross-origin health checks.',
          },
        },
      ],
    },
    {
      id: 'm10-cicd',
      title: 'CI/CD & Automated Deployment',
      icon: '🔄',
      introduction:
        'Manual deployments are error-prone, slow, and stressful. CI/CD pipelines automate the build, test, and deployment process, ensuring every code change is validated before reaching production. This topic covers GitHub Actions for FastAPI, Docker multi-stage builds, and deployment strategies that minimize downtime and risk.',
      sections: [
        {
          heading: 'Docker Multi-Stage Builds',
          description: 'Optimized Docker images for FastAPI',
          content: `Docker is the standard way to package FastAPI applications for deployment. A well-crafted Dockerfile uses multi-stage builds to create small, secure production images that contain only the runtime dependencies — no build tools, no development dependencies, no unnecessary files.

A multi-stage build has two phases. The builder stage installs all dependencies (including build tools like gcc for compiling C extensions) and runs any build steps. The production stage starts from a clean Python slim image and copies only the installed packages and application code from the builder stage. The result is an image that is typically 5-10x smaller than a single-stage build.

Security is equally important. Production images should run as a non-root user, use specific base image tags (not :latest), and include only the minimum required packages. Every extra package is a potential attack surface. Use docker scan or Trivy to check your images for known vulnerabilities.

Layer caching is critical for fast builds. Docker caches each layer (instruction in the Dockerfile) and only rebuilds layers that change. By installing dependencies before copying application code, you ensure that dependency installation is cached even when your code changes. This reduces build times from minutes to seconds during development.`,
          codeExamples: [
            {
              title: 'Production Dockerfile with Multi-Stage Build',
              description: 'An optimized Dockerfile for FastAPI applications',
              code: `# Stage 1: Builder — install dependencies
FROM python:3.12-slim AS builder

WORKDIR /build

# Install build dependencies (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Stage 2: Production — minimal runtime image
FROM python:3.12-slim

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy application code
COPY . .

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \\
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# Run with Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]`,
              language: 'dockerfile',
            },
            {
              title: 'Docker Compose for Development',
              description: 'Full development environment with database and Redis',
              code: `# docker-compose.yml
version: "3.9"

services:
  api:
    build: .
    ports:
      - "8000:8000"
    env_file: .env
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    volumes:
      - ./app:/app/app  # Hot reload in development

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: devpassword
      POSTGRES_DB: app_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app"]
      interval: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  worker:
    build: .
    command: celery -A app.core.celery_app worker --loglevel=info
    env_file: .env
    depends_on:
      - redis

volumes:
  postgres_data:`,
              language: 'yaml',
            },
            {
              title: 'GitHub Actions CI/CD Pipeline',
              description: 'Automated test, build, and deploy pipeline',
              code: `# .github/workflows/deploy.yml
name: FastAPI CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - name: Install dependencies
        run: pip install -r requirements.txt
      - name: Run tests
        env:
          DATABASE_URL: postgresql+asyncpg://test:test@localhost:5432/test_db
          SECRET_KEY: test-secret-key
        run: pytest --cov=app --cov-report=xml
      - name: Upload coverage
        uses: codecov/codecov-action@v4

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to production
        run: echo "Deploy step — customize for your hosting"`,
              language: 'yaml',
            },
            {
              title: '.dockerignore for Optimized Builds',
              description: 'Exclude unnecessary files from the Docker build context',
              code: `# .dockerignore
.git
.github
.venv
__pycache__
*.pyc
*.pyo
.pytest_cache
.mypy_cache
.ruff_cache
.env
.env.*
*.md
!README.md
docker-compose*.yml
Dockerfile
.dockerignore
node_modules
.next
.alembic/versions/__pycache__

# This file reduces the build context sent to Docker,
# speeding up builds and preventing secret leaks`,
              language: 'text',
            },
          ],
          visualization: {
            type: 'flow',
            title: 'CI/CD Pipeline Flow',
            description: 'From code push to production deployment',
            steps: [
              { label: 'Developer pushes code', detail: 'git push origin main', highlight: false },
              { label: 'GitHub Actions triggers', detail: 'CI/CD pipeline starts', highlight: true },
              { label: 'Install dependencies', detail: 'pip install -r requirements.txt', highlight: false },
              { label: 'Run tests', detail: 'pytest --cov=app', highlight: true },
              { label: 'Build Docker image', detail: 'docker build -t app:latest .', highlight: false },
              { label: 'Push to registry', detail: 'docker push registry/app:latest', highlight: false },
              { label: 'Deploy to production', detail: 'kubectl rollout or docker-compose up', highlight: true },
              { label: 'Health check passes', detail: '/health/ready returns 200', highlight: false },
            ],
          },
          tips: [
            'Use multi-stage Docker builds to keep production images small. The builder stage has all build tools; the production stage has only runtime dependencies.',
            'Pin your base image version (python:3.12-slim, not python:latest) to prevent unexpected breaking changes.',
            'Always run containers as non-root users. This is a security best practice required by most production environments.',
          ],
          warning: 'Never include .env files in your Docker image. Use environment variables at runtime (docker run --env-file or Kubernetes ConfigMap/Secrets) to inject configuration.',
          keyTakeaway: 'Multi-stage Docker builds create small, secure production images. GitHub Actions automates testing and deployment. Always run as non-root and never include secrets in images.',
          realWorldAnalogy: 'A CI/CD pipeline is like a car assembly line. Raw materials (code) enter, get tested (unit tests), assembled (Docker build), quality-checked (integration tests), and shipped to dealers (deployed to production). Each step is automated and repeatable, ensuring consistent quality.',
          commonMistakes: [
            { mistake: 'Using a single-stage Dockerfile with all build tools in production', fix: 'Use multi-stage builds. The builder stage installs everything; the production stage copies only what is needed. This reduces image size by 5-10x and eliminates attack surface from build tools.' },
            { mistake: 'Running Docker containers as root', fix: 'Add RUN useradd -r appuser and USER appuser to your Dockerfile. Running as root means a container escape gives the attacker root access on the host.' },
          ],
          interviewQuestions: [
            { question: 'What is a multi-stage Docker build and why is it important?', answer: 'A multi-stage build uses separate FROM statements to create builder and production stages. The builder installs all dependencies (including C compilers, dev headers), and the production stage copies only the compiled results. This creates images 5-10x smaller with fewer security vulnerabilities.' },
            { question: 'How do you ensure secrets are not leaked in Docker images?', answer: 'Use .dockerignore to exclude .env files, use multi-stage builds so build-time secrets are not in the final image, and inject secrets at runtime via environment variables or Docker secrets. Never COPY .env files into images.' },
          ],
          proTips: [
            'Add a HEALTHCHECK instruction to your Dockerfile. Container orchestrators (Kubernetes, Docker Swarm) use this to automatically restart unhealthy containers.',
            'Use BuildKit cache mounts for pip: RUN --mount=type=cache,target=/root/.cache/pip pip install -r requirements.txt. This caches downloaded packages across builds, reducing build times significantly.',
          ],
          frontendIntegration: {
            title: 'Deployment Pipeline Viewer',
            vanillaHtml: {
              title: 'CI/CD Status Dashboard',
              description: 'A frontend that shows the deployment pipeline status',
              code: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>CI/CD Dashboard</title>
<style>
  body { font-family: system-ui; max-width: 600px; margin: 2rem auto; background: #0f172a; color: #e2e8f0; }
  .pipeline { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 1rem; margin: 0.5rem 0; }
  .step { display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0; border-bottom: 1px solid #334155; }
  .step:last-child { border-bottom: none; }
  .icon { width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; }
  .pass { background: #065f46; color: #6ee7b7; }
  .fail { background: #7f1d1d; color: #fca5a5; }
  .running { background: #1e3a5f; color: #93c5fd; animation: pulse 1.5s infinite; }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
</style>
</head>
<body>
  <h1>CI/CD Pipeline</h1>
  <div class="pipeline" id="pipeline"></div>
  <script>
    const steps = [
      { name: "Checkout code", status: "pass" },
      { name: "Install dependencies", status: "pass" },
      { name: "Run unit tests", status: "pass" },
      { name: "Run integration tests", status: "running" },
      { name: "Build Docker image", status: "pending" },
      { name: "Push to registry", status: "pending" },
      { name: "Deploy to production", status: "pending" },
    ];
    document.getElementById("pipeline").innerHTML = steps.map(s =>
      '<div class="step"><div class="icon ' + s.status + '">' +
      (s.status === "pass" ? "✓" : s.status === "fail" ? "✗" : s.status === "running" ? "→" : "○") +
      '</div><span>' + s.name + '</span></div>'
    ).join("");
  </script>
</body>
</html>`,
              language: 'html',
              whatHappened: [
                'The dashboard shows the CI/CD pipeline steps',
                'Each step shows pass, running, or pending status',
                'The running step has a pulse animation',
              ],
              tryToBreak: [
                'Add a failing step — the pipeline should stop at that point',
                'Refresh the page to simulate a pipeline restart',
              ],
            },
            corsNote: 'In production, this dashboard would use the GitHub Actions API to fetch real pipeline status. CORS configuration would be needed for browser access.',
          },
        },
      ],
    },
    {
      id: 'm10-full-stack',
      title: 'Building a Complete Full-Stack Application',
      icon: '🌐',
      introduction:
        'This topic brings together everything you have learned into a complete, production-ready full-stack application. We will build an e-commerce API with products, orders, users, and payment processing — demonstrating how all the patterns, tools, and best practices come together in a real application.',
      sections: [
        {
          heading: 'E-Commerce API Architecture',
          content: `A production e-commerce API is a complex system that touches every aspect of FastAPI development. It requires user authentication and authorization, product catalog management, order processing with transactions, payment integration, and real-time order tracking. Building this system requires careful architecture decisions that balance simplicity with scalability.

The e-commerce domain has several bounded contexts. The Users context handles registration, authentication, and profile management. The Products context manages the catalog, inventory, and search. The Orders context handles order creation, payment, and fulfillment. Each context is a feature module with its own models, schemas, services, and tests.

Cross-cutting concerns connect these contexts. When an order is placed, the inventory must be decremented (Products context), a confirmation email must be sent (notification service), and the payment must be processed (payment service). These cross-context interactions should use domain events rather than direct service calls to maintain loose coupling.

The API exposes RESTful endpoints for each context. The frontend (single-page application) consumes these endpoints. For real-time features like order tracking, WebSocket endpoints push updates to the client. For background processing like email sending and report generation, Celery tasks handle the work asynchronously.

Database design follows the normalized relational model. Users have many orders, orders have many items, and items reference products. Inventory tracking uses optimistic locking to prevent overselling. The payment table stores transaction records with idempotency keys to prevent double-charging.`,
          codeExamples: [
            {
              title: 'E-Commerce Order Model',
              description: 'The core order model with relationships',
              code: `# app/features/orders/models.py
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING)
    total_amount = Column(Float, nullable=False)
    payment_intent_id = Column(String(255), nullable=True)
    idempotency_key = Column(String(255), unique=True, nullable=True)

    # Relationships
    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product")`,
              language: 'python',
            },
            {
              title: 'Order Service with Transaction',
              description: 'Business logic for creating orders with inventory management',
              code: `# app/features/orders/service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from .models import Order, OrderItem, OrderStatus
from .schemas import OrderCreate
from app.features.products.models import Product
from app.shared.exceptions import NotFoundError, ConflictError
import uuid

class OrderService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_order(self, user_id: int, order_in: OrderCreate) -> Order:
        # Generate idempotency key to prevent duplicate orders
        idempotency_key = str(uuid.uuid4())

        # Fetch products and check inventory
        total = 0.0
        items = []
        for item_in in order_in.items:
            result = await self.db.execute(
                select(Product).where(Product.id == item_in.product_id)
            )
            product = result.scalar_one_or_none()
            if not product:
                raise NotFoundError("Product", item_in.product_id)
            if product.stock < item_in.quantity:
                raise ConflictError("Product", "stock", str(product.stock))

            # Decrement inventory (optimistic locking)
            product.stock -= item_in.quantity

            items.append(OrderItem(
                product_id=product.id,
                quantity=item_in.quantity,
                unit_price=product.price,
            ))
            total += product.price * item_in.quantity

        # Create order
        order = Order(
            user_id=user_id,
            total_amount=total,
            idempotency_key=idempotency_key,
            items=items,
        )
        self.db.add(order)
        await self.db.flush()
        return order`,
              language: 'python',
            },
            {
              title: 'Order API Endpoints',
              description: 'RESTful endpoints for order management',
              code: `# app/features/orders/router.py
from fastapi import APIRouter, Depends, HTTPException
from .schemas import OrderCreate, OrderRead
from .service import OrderService
from .dependencies import get_order_service
from app.core.security import get_current_user

router = APIRouter(prefix="/orders", tags=["orders"])

@router.get("/", response_model=list[OrderRead])
async def list_orders(
    current_user=Depends(get_current_user),
    service: OrderService = Depends(get_order_service),
):
    return await service.list_user_orders(current_user["id"])

@router.post("/", response_model=OrderRead, status_code=201)
async def create_order(
    order_in: OrderCreate,
    current_user=Depends(get_current_user),
    service: OrderService = Depends(get_order_service),
):
    order = await service.create_order(current_user["id"], order_in)
    # Trigger background tasks: email confirmation, inventory sync
    from app.tasks.emails import send_order_confirmation
    send_order_confirmation.delay(order.id, current_user["id"])
    return order

@router.get("/{order_id}", response_model=OrderRead)
async def get_order(
    order_id: int,
    current_user=Depends(get_current_user),
    service: OrderService = Depends(get_order_service),
):
    order = await service.get_order(order_id)
    if not order or order.user_id != current_user["id"]:
        raise HTTPException(status_code=404)
    return order`,
              language: 'python',
            },
            {
              title: 'Project Directory Structure',
              description: 'Complete feature-based structure for the e-commerce API',
              code: `ecommerce-api/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app assembly
│   ├── core/
│   │   ├── config.py              # Settings (pydantic-settings)
│   │   ├── database.py            # Engine, session, Base
│   │   ├── security.py            # JWT, password hashing
│   │   ├── celery_app.py          # Celery configuration
│   │   └── dependencies.py        # Shared Depends()
│   ├── features/
│   │   ├── users/                 # User management
│   │   │   ├── router.py
│   │   │   ├── models.py
│   │   │   ├── schemas.py
│   │   │   ├── service.py
│   │   │   ├── repository.py
│   │   │   └── tests.py
│   │   ├── products/              # Product catalog
│   │   │   ├── router.py
│   │   │   ├── models.py
│   │   │   ├── schemas.py
│   │   │   ├── service.py
│   │   │   └── tests.py
│   │   └── orders/                # Order processing
│   │       ├── router.py
│   │       ├── models.py
│   │       ├── schemas.py
│   │       ├── service.py
│   │       └── tests.py
│   ├── tasks/                     # Celery tasks
│   │   ├── emails.py
│   │   └── reports.py
│   └── shared/                    # Cross-feature utilities
│       ├── pagination.py
│       └── exceptions.py
├── alembic/                       # Database migrations
├── tests/                         # Integration tests
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── .env.example
└── .github/workflows/deploy.yml`,
              language: 'text',
            },
          ],
          visualization: {
            type: 'architecture',
            title: 'E-Commerce API Architecture',
            description: 'The complete architecture of a production e-commerce API',
            layers: [
              { label: 'Client Layer', items: ['Web SPA', 'Mobile App', 'Third-party APIs'] },
              { label: 'API Gateway', items: ['FastAPI + CORS', 'Rate Limiting', 'Authentication'] },
              { label: 'Feature Modules', items: ['Users', 'Products', 'Orders', 'Payments'] },
              { label: 'Infrastructure', items: ['PostgreSQL', 'Redis', 'Celery Workers'] },
              { label: 'External', items: ['Stripe', 'SMTP', 'S3 Storage'] },
            ],
          },
          tips: [
            'Use idempotency keys for order creation to prevent duplicate orders when the client retries.',
            'Decrement inventory at order creation time with optimistic locking. Restock on order cancellation.',
            'Separate payment processing from order creation. Create the order first, then process payment via a background task.',
          ],
          warning: 'Never store credit card numbers in your database. Use Stripe or similar payment processors and store only payment intent IDs. PCI compliance is extremely burdensome — delegate to the experts.',
          keyTakeaway: 'A production e-commerce API combines feature modules, background tasks, database transactions, and external integrations into a cohesive system that handles real-world complexity.',
          realWorldAnalogy: 'Building an e-commerce API is like building a retail store. The Users module is the customer service desk, Products is the warehouse, Orders is the checkout counter, and Payments is the cash register. Each department works independently but coordinates through well-defined processes.',
          commonMistakes: [
            { mistake: 'Processing payments synchronously in the request handler', fix: 'Create the order first, then process payment asynchronously via Celery. This keeps the API responsive and handles payment gateway timeouts gracefully.' },
            { mistake: 'Not using idempotency keys for order creation', fix: 'Generate a unique idempotency key for each order attempt. If the client retries, the same key returns the existing order instead of creating a duplicate.' },
          ],
          interviewQuestions: [
            { question: 'How do you prevent duplicate orders when the client retries?', answer: 'Use idempotency keys. The client generates a unique key and sends it with each order request. The server checks if an order with that key already exists — if so, it returns the existing order instead of creating a duplicate.' },
            { question: 'How do you handle inventory overselling in a high-concurrency environment?', answer: 'Use optimistic locking with database-level constraints. Decrement stock within a transaction and check the resulting value. If stock goes negative, roll back the transaction. Alternatively, use SELECT FOR UPDATE to lock the row during the transaction.' },
          ],
          proTips: [
            'Implement a saga pattern for distributed transactions. If payment fails after inventory is decremented, trigger a compensating transaction to restock. This ensures eventual consistency across services.',
            'Add WebSocket endpoints for real-time order tracking. When the order status changes (paid, shipped, delivered), push the update to the client via WebSocket instead of requiring polling.',
          ],
          frontendIntegration: {
            title: 'E-Commerce Interface',
            vanillaHtml: {
              title: 'Product Catalog & Order',
              description: 'A simple e-commerce frontend with product listing and order creation',
              code: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>E-Commerce</title>
<style>
  body { font-family: system-ui; max-width: 700px; margin: 2rem auto; background: #0f172a; color: #e2e8f0; }
  .product { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 1rem; margin: 0.5rem 0; display: flex; justify-content: space-between; }
  .cart { background: #1e293b; border: 1px solid #0d9488; border-radius: 8px; padding: 1rem; margin: 1rem 0; }
  button { background: #0d9488; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 4px; cursor: pointer; }
  .price { color: #2dd4bf; font-weight: bold; }
</style>
</head>
<body>
  <h1>Product Catalog</h1>
  <div id="products"></div>
  <div class="cart" id="cart" style="display:none;">
    <h3>Your Cart</h3>
    <div id="cart-items"></div>
    <div id="cart-total" style="font-weight:bold;margin-top:0.5rem;color:#2dd4bf;"></div>
    <button onclick="placeOrder()" style="margin-top:0.5rem;">Place Order</button>
  </div>
  <script>
    const API = "http://localhost:8000/api/v1";
    let cart = [];
    async function loadProducts() {
      const res = await fetch(API + "/products/");
      const products = await res.json();
      document.getElementById("products").innerHTML = products.map(p =>
        '<div class="product"><div><strong>' + p.name + '</strong><br><span class="price">$' + p.price.toFixed(2) + '</span></div>' +
        '<button onclick="addToCart(' + p.id + ',\\''+p.name+'\\',' + p.price + ')">Add</button></div>'
      ).join("");
    }
    function addToCart(id, name, price) {
      cart.push({product_id: id, name, price, quantity: 1});
      updateCart();
    }
    function updateCart() {
      if (cart.length === 0) { document.getElementById("cart").style.display = "none"; return; }
      document.getElementById("cart").style.display = "block";
      document.getElementById("cart-items").innerHTML = cart.map(i => '<div>' + i.name + ' x' + i.quantity + ' = $' + (i.price * i.quantity).toFixed(2) + '</div>').join("");
      document.getElementById("cart-total").textContent = "Total: $" + cart.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2);
    }
    async function placeOrder() {
      const res = await fetch(API + "/orders/", {
        method: "POST",
        headers: {"Content-Type": "application/json", "Authorization": "Bearer YOUR_TOKEN"},
        body: JSON.stringify({items: cart.map(i => ({product_id: i.product_id, quantity: i.quantity}))})
      });
      const data = await res.json();
      alert("Order #" + data.id + " placed! Status: " + data.status);
      cart = [];
      updateCart();
    }
    loadProducts();
  </script>
</body>
</html>`,
              language: 'html',
              whatHappened: [
                'Products are loaded from the API',
                'Items can be added to a cart',
                'Placing an order sends the cart data to the API',
              ],
              tryToBreak: [
                'Try ordering a product with zero stock',
                'Place an order without authentication (missing token)',
              ],
            },
            corsNote: 'Configure CORSMiddleware with your frontend origin. Include Authorization header in expose_headers for CORS.',
          },
        },
      ],
    },
  ],
};
