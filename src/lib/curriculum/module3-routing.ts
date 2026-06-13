import { Module } from './types';

export const module3Routing: Module = {
  id: 'module-3-routing',
  title: 'Advanced Routing & API Design',
  icon: '🔀',
  description:
    'Master the architectural patterns that make FastAPI applications scalable, maintainable, and production-ready. From modular routing and dependency injection to middleware, background tasks, custom exceptions, file uploads, and API versioning — this module equips you with everything needed to design APIs that grow gracefully from prototype to production.',
  topics: [
    // ──────────────────────────────────────────────
    // TOPIC 1: APIRouter & Modular Routing
    // ──────────────────────────────────────────────
    {
      id: 'm3-api-router',
      title: 'APIRouter & Modular Routing',
      icon: '🗂️',
      introduction:
        'As your FastAPI application grows beyond a handful of endpoints, keeping everything in a single main.py file becomes unmanageable. APIRouter is FastAPI\'s answer to this problem — it lets you split your application into multiple router modules, each with its own prefix, tags, and dependencies. This is the foundational pattern for building scalable, team-friendly FastAPI projects.',
      sections: [
        {
          heading: 'Splitting Your App into Router Modules',
          content: `When you start a new FastAPI project, a single file works fine. But as you add endpoints for users, products, orders, analytics, and admin functions, that file balloons into hundreds or thousands of lines. The solution is APIRouter — a miniature FastAPI instance that you can mount onto your main app with a prefix and tags.

Each router module lives in its own file (or package), handles a specific domain, and can be developed independently by different team members. The pattern mirrors Flask\'s Blueprints or Django\'s apps, but with FastAPI\'s signature type-safety and auto-documentation. When you include a router with \`app.include_router(router, prefix="/users", tags=["users"])\`, every route in that router automatically gets the /users prefix and the "users" tag in your Swagger UI.

This separation of concerns is not just about file organization — it enables independent testing, per-domain dependency injection, and clearer API documentation. Your users router doesn\'t need to know about your products router, and vice versa.`,
          codeExamples: [
            {
              title: 'Creating a Router Module',
              description: 'Each domain gets its own router file with a dedicated prefix and tags',
              code: `# app/routers/users.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas import UserCreate, UserResponse
from app.models import User
from app.database import get_db

router = APIRouter(
    prefix="/users",
    tags=["users"],
    responses={404: {"description": "User not found"}},
)

@router.post("/", response_model=UserResponse, status_code=201)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = User(**user.model_dump())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/", response_model=list[UserResponse])
def list_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(User).offset(skip).limit(limit).all()`,
              language: 'python',
            },
            {
              title: 'Mounting Routers in the Main Application',
              description: 'The main.py file becomes a slim orchestrator that imports and mounts all routers',
              code: `# app/main.py
from fastapi import FastAPI
from app.routers import users, products, orders, auth

app = FastAPI(
    title="E-Commerce API",
    version="1.0.0",
    description="A full-featured e-commerce API",
)

# Mount each router with its own prefix
app.include_router(auth.router)          # /auth/*
app.include_router(users.router)         # /users/*
app.include_router(products.router)      # /products/*
app.include_router(orders.router)        # /orders/*

# You can also add router-level dependencies
app.include_router(
    users.router,
    prefix="/api/v2/users",   # Override the router's prefix
    tags=["users-v2"],        # Override tags
)

# Health check stays in main.py since it's app-level
@app.get("/health")
def health_check():
    return {"status": "healthy"}`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'architecture',
            title: 'Modular Router Architecture',
            description: 'How routers split a monolithic app into domain-specific modules',
            layers: [
              { label: 'FastAPI App (main.py)', items: ['include_router(users)', 'include_router(products)', 'include_router(orders)', 'include_router(auth)'] },
              { label: 'Router Modules', items: ['users.py → /users/*', 'products.py → /products/*', 'orders.py → /orders/*', 'auth.py → /auth/*'] },
              { label: 'Shared Dependencies', items: ['get_db (database session)', 'get_current_user (auth)', 'common_parameters (pagination)'] },
              { label: 'Database & Models', items: ['SQLAlchemy Models', 'Pydantic Schemas', 'Alembic Migrations'] },
            ],
          },
          tips: [
            'Each router should own one domain — if a router feels like it handles too many things, split it further.',
            'Use the prefix parameter on APIRouter() rather than repeating it in every @router.get() path — it keeps paths clean and consistent.',
            'Router-level responses={} lets you define default error responses (like 404) that apply to all routes in that router.',
          ],
          keyTakeaway:
            'APIRouter is the key to scaling FastAPI projects — split by domain, mount with prefixes, and keep your main.py clean.',
        
          realWorldAnalogy: `APIRouter is like dividing a large company into departments. The HR department handles employees, the Sales department handles products, and the Finance department handles orders. Each department has its own procedures (routes) and specialized staff (dependencies), but they all work under the same company roof (FastAPI app).`,
          commonMistake: [
            {
              mistake: `Putting all routes in main.py even as the app grows`,
              fix: `Split into router modules once you have more than 5-6 endpoints. Each domain (users, products, orders) gets its own file with APIRouter.`,
            },
            {
              mistake: `Forgetting to import and include routers in main.py`,
              fix: `Every router must be explicitly included with app.include_router(). Forgotten routers simply don't appear in your app.`,
            },
          ],
          interviewQuestions: [
            {
              question: `What is APIRouter and why do you need it?`,
              answer: `APIRouter is a miniature FastAPI instance that lets you split routes into separate modules. Each router has its own prefix, tags, and dependencies. You mount routers onto the main app with include_router().`,
            },
            {
              question: `How do router-level dependencies work?`,
              answer: `Dependencies specified in APIRouter(dependencies=[...]) run before every route in that router. This is perfect for authentication gates, database sessions, or logging that applies to an entire domain.`,
            },
          ],
          proTips: [
            `Use router-level dependencies for authentication gates — every route in an admin router can be protected without adding Depends() to each endpoint.`,
            `Define responses={404: {"description": "Not found"}} on your router to add default error documentation for all routes in that module.`,
          ],},
        {
          heading: 'Router Prefixes, Tags & Organization Patterns',
          content: `When you define an APIRouter, you can set a prefix that applies to all routes in that router, and tags that group those routes in the auto-generated documentation. But the real power comes from understanding how to layer prefixes, apply router-level dependencies, and organize your project structure for maximum clarity.

Prefixes can be defined at two levels: on the APIRouter itself and when including it in the app. The include_router prefix is prepended to the router\'s own prefix, so \`APIRouter(prefix="/users")\` included with \`prefix="/api/v1"\` results in routes at \`/api/v1/users/*\`. This lets you version your entire API by simply changing the include prefix.

Tags are more than documentation — they control how Swagger UI groups your endpoints. Well-chosen tags make your interactive docs navigable even with 50+ endpoints. The convention is one tag per router, but you can assign multiple tags to a single route if it spans domains.

For large projects, consider the package-per-router pattern: instead of a single users.py file, create a users/ package with \`\_\_init\_\_.py\`, routes.py, schemas.py, models.py, and services.py. This keeps related code together while maintaining separation of concerns.`,
          codeExamples: [
            {
              title: 'Layered Prefixes for API Versioning',
              description: 'How router-level and include-level prefixes compose together',
              code: `# app/routers/products.py
from fastapi import APIRouter

router = APIRouter(
    prefix="/products",     # Router-level prefix
    tags=["products"],
)

@router.get("/")           # Final path: /api/v1/products/
def list_products(): ...

@router.get("/{id}")       # Final path: /api/v1/products/{id}
def get_product(id: int): ...

# ─────────────────────────
# app/main.py — layering prefixes
from fastapi import FastAPI
from app.routers import products

app = FastAPI()

# V1 API — prefix stacks: /api/v1 + /products
app.include_router(products.router, prefix="/api/v1")

# V2 API — same router, different prefix
app.include_router(products.router, prefix="/api/v2")

# Admin API — different prefix entirely
app.include_router(products.router, prefix="/admin/api/products", tags=["admin"])`,
              language: 'python',
            },
            {
              title: 'Router-Level Dependencies',
              description: 'Apply authentication, database sessions, or any dependency to every route in a router',
              code: `# app/routers/admin.py
from fastapi import APIRouter, Depends, HTTPException

def require_admin(token: str = Header(...)):
    """Dependency that verifies admin access."""
    if not verify_admin_token(token):
        raise HTTPException(status_code=403, detail="Admin access required")
    return {"role": "admin"}

# This dependency applies to EVERY route in this router
router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(require_admin)],  # ← Router-level dependency!
)

@router.get("/dashboard")
def admin_dashboard():                    # No need to add Depends(require_admin)
    return {"message": "Welcome, admin"}

@router.delete("/users/{user_id}")
def delete_user(user_id: int):            # Already protected by router dependency
    return {"deleted": user_id}

# Per-route dependencies still work too
@router.get("/analytics", dependencies=[Depends(require_premium)])
def get_analytics():                      # Both require_admin AND require_premium run
    return {"data": "premium analytics"}`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'comparison',
            title: 'Router Organization Patterns',
            description: 'Different patterns for structuring router modules in a project',
            columns: [
              {
                title: 'Single File',
                items: ['main.py only', 'Quick to start', 'No imports needed', 'Hard to maintain at scale', 'Best for: prototypes & demos'],
              },
              {
                title: 'File-Per-Router',
                items: ['routers/users.py', 'routers/products.py', 'Clean separation', 'Easy to test', 'Best for: small-to-medium APIs'],
              },
              {
                title: 'Package-Per-Router',
                items: ['users/routes.py', 'users/schemas.py', 'users/models.py', 'Maximum modularity', 'Best for: large team projects'],
              },
            ],
          },
          tips: [
            'Router-level dependencies are evaluated before per-route dependencies, making them perfect for authentication gates.',
            'Tags should match your router names — this keeps Swagger UI organized and predictable.',
            'When using package-per-router, export the router from __init__.py so imports stay clean: from app.routers.users import router.',
          ],
          keyTakeaway:
            'Layer prefixes at both router and include level, use router-level dependencies for cross-cutting concerns, and match tags to domain names.',
        
          realWorldAnalogy: `Router prefixes are like floor numbers in a building. The ground floor (prefix /api/v1) has the same departments (routers) as the second floor (prefix /api/v2), but they serve different versions of the company. A visitor can choose which floor to visit depending on their needs.`,
          commonMistake: [
            {
              mistake: `Hard-coding version prefixes in every route path`,
              fix: `Use include_router(router, prefix="/api/v1") instead of putting /api/v1 in every @router.get() path. This makes version switching a one-line change.`,
            },
            {
              mistake: `Using inconsistent tag names across routers`,
              fix: `Define tags consistently in APIRouter(tags=["users"]) so Swagger UI groups endpoints properly. Inconsistent tags create a confusing API documentation experience.`,
            },
          ],
          interviewQuestions: [
            {
              question: `How do you version a FastAPI API?`,
              answer: `Use router prefixes with version segments: app.include_router(router, prefix="/api/v1"). For v2, mount the same or updated router with prefix="/api/v2". This keeps version management at the inclusion level.`,
            },
            {
              question: `What is the package-per-router pattern?`,
              answer: `Instead of a single users.py file, create a users/ package with routes.py, schemas.py, models.py, and services.py. This keeps all user-related code together and scales better for large teams.`,
            },
          ],
          proTips: [
            `Layer prefixes at both the router and include level: APIRouter(prefix="/users") + include_router(router, prefix="/api/v1") = /api/v1/users/*.`,
            `Use tags that match your router names and keep them consistent. Swagger UI groups endpoints by tags, so "users" and "user" would create separate groups.`,
          ],},
        {
          heading: 'Project Structure Best Practices',
          content: `A well-structured FastAPI project separates concerns cleanly: routers handle HTTP concerns, services contain business logic, repositories handle database queries, and schemas define data validation. This layered architecture makes your code testable, maintainable, and scalable.

The recommended project layout uses a flat router structure for small-to-medium projects and nested packages for larger ones. The key principle is that each layer only depends on the layer below it — routers call services, services call repositories, repositories call the database. Never let a router directly query the database in a production application, because it couples your HTTP layer to your persistence layer and makes testing painful.

Configuration should live in a dedicated module using pydantic-settings, which reads from environment variables with type validation. This ensures your app behaves consistently across development, staging, and production environments. Secrets never appear in code, and every config value has a sensible default and a type annotation.`,
          codeExamples: [
            {
              title: 'Production-Ready Project Structure',
              description: 'A scalable layout that separates concerns and supports team growth',
              code: `my-fastapi-project/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app creation, router mounting
│   ├── config.py            # Settings via pydantic-settings
│   ├── database.py          # Engine, Session, get_db dependency
│   ├── models/              # SQLAlchemy models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   └── product.py
│   ├── schemas/             # Pydantic schemas (request/response)
│   │   ├── __init__.py
│   │   ├── user.py
│   │   └── product.py
│   ├── routers/             # Route handlers (HTTP layer only)
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── users.py
│   │   └── products.py
│   ├── services/            # Business logic
│   │   ├── __init__.py
│   │   ├── user_service.py
│   │   └── product_service.py
│   ├── repositories/        # Database queries
│   │   ├── __init__.py
│   │   ├── user_repo.py
│   │   └── product_repo.py
│   └── dependencies/        # Shared FastAPI dependencies
│       ├── __init__.py
│       └── auth.py
├── alembic/                 # Database migrations
├── tests/                   # Test suite
├── pyproject.toml
└── requirements.txt`,
              language: 'text',
            },
            {
              title: 'Layered Architecture in Practice',
              description: 'How the router → service → repository pattern keeps code clean and testable',
              code: `# app/repositories/user_repo.py
from sqlalchemy.orm import Session
from app.models.user import User

class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: int) -> User | None:
        return self.db.query(User).filter(User.id == user_id).first()

    def get_by_email(self, email: str) -> User | None:
        return self.db.query(User).filter(User.email == email).first()

    def create(self, user_data: dict) -> User:
        user = User(**user_data)
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

# app/services/user_service.py
from app.repositories.user_repo import UserRepository
from app.schemas.user import UserCreate

class UserService:
    def __init__(self, db: Session):
        self.repo = UserRepository(db)

    def register_user(self, data: UserCreate) -> User:
        if self.repo.get_by_email(data.email):
            raise ValueError("Email already registered")
        return self.repo.create(data.model_dump())

# app/routers/users.py — HTTP layer only
router = APIRouter(prefix="/users", tags=["users"])

@router.post("/", response_model=UserResponse, status_code=201)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    service = UserService(db)
    try:
        return service.register_user(user)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))`,
              language: 'python',
            },
          ],
          tips: [
            'Keep routers thin — they should only handle HTTP concerns (parsing requests, returning responses). Business logic belongs in services.',
            'Repositories encapsulate database queries so you can swap SQLAlchemy for another ORM without touching business logic.',
            'Use pydantic-settings BaseSettings for configuration — it reads environment variables with full type validation.',
          ],
          keyTakeaway:
            'Structure matters at scale: routers for HTTP, services for logic, repositories for data, schemas for validation — each layer has one job.',
        
          realWorldAnalogy: `Project structure is like organizing a kitchen. Routers are the serving window (HTTP layer only — take orders, return plates). Services are the chefs (business logic — decide what to cook). Repositories are the pantry (data access — fetch ingredients). You never want the server window person directly rummaging through the pantry.`,
          commonMistake: [
            {
              mistake: `Putting database queries directly in route handlers`,
              fix: `Use the repository pattern: route → service → repository. This separates HTTP concerns from business logic and data access, making code testable and maintainable.`,
            },
            {
              mistake: `Not using pydantic-settings for configuration`,
              fix: `Create a BaseSettings class that reads from environment variables with type validation. This ensures consistent config across dev/staging/prod.`,
            },
          ],
          interviewQuestions: [
            {
              question: `Describe the layered architecture pattern for FastAPI.`,
              answer: `Routers handle HTTP (parse requests, return responses). Services contain business logic (validation, orchestration). Repositories handle data access (database queries). Each layer depends only on the layer below it.`,
            },
            {
              question: `Why should business logic not live in route handlers?`,
              answer: `Because it couples your business logic to HTTP concerns, making it impossible to test without HTTP, reuse in different contexts (CLI, background tasks), or swap implementations without touching your API layer.`,
            },
          ],
          proTips: [
            `Keep routers thin — they should only parse requests and return responses. If a route handler has more than 10 lines of logic, extract it into a service.`,
            `Use pydantic-settings BaseSettings with env_file=".env" for configuration. It validates types, provides defaults, and makes environment-specific settings trivial.`,
          ],},
      ],
      frontendIntegration: {
        title: `Frontend Calling Multiple Router Endpoints`,
        vanillaHtml: {
          title: `Multi-Domain API Client`,
          description: `An HTML page that calls endpoints from different router modules`,
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
          language: `html`,
          whatHappened: [
            `Each button calls a different router module endpoint`,
            `The /users endpoint comes from the users router`,
            `The /products endpoint comes from the products router`,
          ],
          tryToBreak: [
            `Try calling a non-existent router path like /orders/ — you should get 404`,
          ],
        },
        corsNote: `Different router modules share the same CORS policy. Configure CORSMiddleware once in main.py to cover all routers.`,
      },
    },

    // ──────────────────────────────────────────────
    // TOPIC 2: Dependency Injection System
    // ──────────────────────────────────────────────
    {
      id: 'm3-dependency-injection',
      title: 'Dependency Injection System',
      icon: '💉',
      introduction:
        'FastAPI\'s dependency injection system is arguably its most powerful feature. It lets you declare what your endpoint needs — database sessions, authenticated users, pagination parameters — and FastAPI resolves and provides those dependencies automatically. Dependencies can nest (dependencies depending on other dependencies), use yield for resource cleanup, and be applied at the router level for cross-cutting concerns.',
      sections: [
        {
          heading: 'Understanding Depends() & Dependency Resolution',
          content: `At its core, dependency injection in FastAPI means: instead of creating resources inside your path operation function, you declare them as parameters and let FastAPI provide them. This is done with the \`Depends()\` class. When FastAPI sees \`db: Session = Depends(get_db)\`, it calls \`get_db()\`, takes the result, and passes it as the \`db\` argument to your function.

This pattern has three massive benefits. First, your function becomes testable — in tests, you can swap \`get_db\` with a test database provider using \`app.dependency_overrides\`. Second, your function becomes reusable — the same dependency can be shared across dozens of endpoints without code duplication. Third, your function becomes declarative — reading the signature tells you exactly what the endpoint needs, like a contract.

FastAPI resolves dependencies recursively. If \`get_current_user\` depends on \`oauth2_scheme\`, which depends on the request, FastAPI handles the entire chain. It even caches dependencies within a single request, so if multiple endpoints in the same request use \`Depends(get_db)\`, the database session is created only once.`,
          codeExamples: [
            {
              title: 'Basic Dependency Injection',
              description: 'The simplest pattern: a function that provides a value to your endpoint',
              code: `from fastapi import FastAPI, Depends, Query
from typing import Optional

app = FastAPI()

# A dependency function — just a regular function
def common_parameters(
    q: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
):
    """Provides common pagination and search parameters."""
    return {"q": q, "skip": skip, "limit": limit}

# Use the dependency in multiple endpoints
@app.get("/items/")
def list_items(params: dict = Depends(common_parameters)):
    # params = {"q": ..., "skip": 0, "limit": 100}
    return {"parameters": params}

@app.get("/users/")
def list_users(params: dict = Depends(common_parameters)):
    # Same dependency, same structure — no code duplication
    return {"parameters": params}`,
              language: 'python',
            },
            {
              title: 'Dependency Overrides for Testing',
              description: 'Swap real dependencies with test versions without changing any code',
              code: `# app/main.py
from fastapi import FastAPI, Depends
from app.database import get_db

app = FastAPI()

@app.get("/users/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404)
    return user

# ─────────────────────────
# tests/test_users.py
from fastapi.testclient import TestClient
from app.main import app, get_db
from test_database import TestSessionLocal

def override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()

# Swap the real get_db with our test version
app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def test_get_user():
    response = client.get("/users/1")
    assert response.status_code == 200

# Clean up after tests
def teardown_module():
    app.dependency_overrides.clear()`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'flow',
            title: 'Dependency Resolution Flow',
            description: 'How FastAPI resolves nested dependencies before calling your endpoint',
            steps: [
              { label: 'Request arrives', detail: 'Client sends HTTP request to endpoint', highlight: false },
              { label: 'FastAPI reads function signature', detail: 'Identifies all Depends() parameters', highlight: true },
              { label: 'Resolve dependency graph', detail: 'Recursively resolves each dependency and its sub-dependencies', highlight: true },
              { label: 'Cache within request', detail: 'Same dependency used multiple times = single execution per request', highlight: false },
              { label: 'Inject resolved values', detail: 'Pass resolved dependencies as arguments to your function', highlight: true },
              { label: 'Execute endpoint', detail: 'Your function runs with all dependencies provided', highlight: false },
              { label: 'Cleanup yield dependencies', detail: 'After response, yield dependencies run cleanup code', highlight: false },
            ],
          },
          tips: [
            'Dependencies are cached per request — if two parameters use Depends(get_db), the function runs only once.',
            'Use app.dependency_overrides for testing — it\'s the cleanest way to inject test databases and mock services.',
            'Dependencies can be callables (functions, classes) or instances of Depends() itself — all are resolved the same way.',
          ],
          keyTakeaway:
            'Depends() makes your endpoints declarative and testable — declare what you need, FastAPI provides it, and tests swap it.',
        
          realWorldAnalogy: `Dependency injection is like a restaurant where the chef declares "I need fresh tomatoes" (Depends(get_tomatoes)) and the kitchen automatically provides them. The chef doesn't need to know where the tomatoes come from (garden, store, or a test supplier). In tests, you swap the supplier to provide fake tomatoes.`,
          commonMistake: [
            {
              mistake: `Creating resources inside route handlers instead of using Depends()`,
              fix: `Declare resources as dependencies with Depends() so they can be swapped in tests and shared across endpoints without duplication.`,
            },
            {
              mistake: `Not using dependency_overrides for testing`,
              fix: `Use app.dependency_overrides[get_db] = test_get_db to swap real dependencies with test versions. This is the cleanest way to test with mock databases and services.`,
            },
          ],
          interviewQuestions: [
            {
              question: `What are the three benefits of FastAPI's dependency injection?`,
              answer: `Testability (swap dependencies in tests via dependency_overrides), reusability (share dependencies across endpoints), and declarativeness (function signatures declare what they need).`,
            },
            {
              question: `How does dependency caching work within a request?`,
              answer: `If multiple parameters in the same request use Depends(get_db), the dependency function runs only once and the result is cached for the entire request. This prevents duplicate database connections.`,
            },
          ],
          proTips: [
            `Dependencies are cached per request. If two parameters use Depends(get_db), the function runs only once. This is critical for expensive operations like database connections.`,
            `Use app.dependency_overrides for testing — it's the cleanest pattern for swapping real services with test doubles.`,
          ],},
        {
          heading: 'Yield Dependencies & Resource Cleanup',
          content: `Some resources need cleanup after your endpoint finishes — database connections must be closed, file handles released, and transactions committed or rolled back. FastAPI supports this with yield dependencies: the code before yield runs before your endpoint, and the code after yield runs after the response is sent.

The pattern is similar to Python\'s context managers. When FastAPI encounters a dependency that uses yield, it treats the pre-yield code as setup and the post-yield code as teardown. If your endpoint raises an exception, the teardown code still runs — FastAPI guarantees cleanup. This makes yield dependencies perfect for database sessions, where you need to commit on success and rollback on failure.

You can also have yield dependencies that depend on other yield dependencies, creating a chain of setup and teardown that executes in the correct order. The teardown order is always the reverse of the setup order, just like nested context managers.`,
          codeExamples: [
            {
              title: 'Database Session as a Yield Dependency',
              description: 'The most common yield dependency pattern — proper session lifecycle management',
              code: `from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session

app = FastAPI()

def get_db():
    """Yield dependency: creates a session, closes it after the request."""
    db = SessionLocal()
    try:
        yield db          # ← Pauses here; endpoint receives db
    finally:
        db.close()         # ← Runs after response is sent

@app.post("/users/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = User(**user.model_dump())
    db.add(db_user)
    db.commit()           # ← Explicit commit in the endpoint
    db.refresh(db_user)
    return db_user

# Even if the endpoint raises an exception, db.close() still runs!`,
              language: 'python',
            },
            {
              title: 'Advanced Yield Dependency with Transaction Management',
              description: 'Automatic commit/rollback pattern using yield dependencies',
              code: `from fastapi import FastAPI, Depends, Request
from sqlalchemy.orm import Session

def get_db_with_transaction():
    """
    Advanced pattern: auto-commit on success, auto-rollback on exception.
    Endpoints don't need to call db.commit() explicitly.
    """
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()      # ← Rollback if endpoint raised an exception
        raise
    else:
        db.commit()         # ← Commit only if endpoint succeeded
    finally:
        db.close()          # ← Always close the session

# Usage — no explicit commit needed
@app.post("/orders/")
def create_order(order: OrderCreate, db: Session = Depends(get_db_with_transaction)):
    db_order = Order(**order.model_dump())
    db.add(db_order)
    # No db.commit() needed! It commits automatically on success.
    # If anything goes wrong, it rolls back automatically.
    return db_order`,
              language: 'python',
            },
          ],
          tips: [
            'Always use try/finally in yield dependencies — even if the endpoint crashes, cleanup must happen.',
            'The auto-commit pattern is elegant but can be surprising to teammates — document it clearly or stick with explicit commits.',
            'Yield dependencies execute teardown in reverse order when nested — outer dependencies clean up last.',
          ],
          keyTakeaway:
            'Yield dependencies are FastAPI\'
          realWorldAnalogy: `Yield dependencies are like checking out a library book. The library gives you the book (yield), you read it (your endpoint runs), and when you're done, you return it (code after yield runs). Even if you spill coffee on the book and panic (exception), the library still makes you return it (finally block guarantees cleanup).`,
          commonMistake: [
            {
              mistake: `Forgetting try/finally in yield dependencies`,
              fix: `Always wrap yield in try/finally to guarantee cleanup. Without finally, an exception in the endpoint could leak database connections.`,
            },
            {
              mistake: `Calling db.commit() in both the endpoint and the yield dependency`,
              fix: `Choose one pattern: either explicit commits in endpoints with simple yield db + finally db.close(), or auto-commit in the yield dependency with no explicit commits in endpoints.`,
            },
          ],
          interviewQuestions: [
            {
              question: `What is a yield dependency and when do you need one?`,
              answer: `A yield dependency uses the yield keyword to provide a resource to your endpoint, then runs cleanup code after the response is sent. You need one for any resource that requires cleanup: database sessions, file handles, network connections.`,
            },
            {
              question: `What happens if an endpoint raises an exception — does the yield cleanup still run?`,
              answer: `Yes! FastAPI guarantees that the code after yield runs even if the endpoint raises an exception. This is similar to Python's context manager behavior.`,
            },
          ],
          proTips: [
            `The auto-commit/rollback pattern in yield dependencies is elegant but surprising — document it clearly so teammates understand why they don't need explicit commits.`,
            `Yield dependencies execute teardown in reverse order when nested. If A yields then B yields, B cleans up first, then A.`,
          ],s answer to context managers — setup before the request, guaranteed cleanup after.',
        },
        {
          heading: 'Dependency Chains & Class Dependencies',
          content: `Dependencies can depend on other dependencies, creating a resolution chain. When FastAPI processes a request, it builds a complete dependency graph, resolves it from the leaves up, and caches results within the request. This composable architecture lets you build sophisticated behavior from simple building blocks.

You can also use classes as dependencies. Any callable — function or class — works with Depends(). Class dependencies are useful when you need to maintain state or when the dependency has complex initialization logic. FastAPI instantiates the class and injects the instance. The class constructor parameters become sub-dependencies that FastAPI resolves automatically.

The power of dependency chains becomes apparent in real applications: get_current_user depends on decode_token, which depends on oauth2_scheme, which depends on the request. Each layer adds functionality, and FastAPI handles the entire resolution automatically. You never write glue code to wire these together.`,
          codeExamples: [
            {
              title: 'Dependency Chain: Auth → User → Permissions',
              description: 'How dependencies compose to build complex behavior from simple pieces',
              code: `from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer

app = FastAPI()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Level 1: Extract and decode the token
def decode_token(token: str = Depends(oauth2_scheme)):
    """Sub-dependency: decodes JWT token into payload."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Level 2: Get the current user from the decoded token
def get_current_user(payload: dict = Depends(decode_token)):
    """Depends on decode_token — gets user from database."""
    username = payload.get("sub")
    user = get_user_by_username(username)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# Level 3: Require specific role
def require_admin(user: User = Depends(get_current_user)):
    """Depends on get_current_user — adds role check."""
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# Endpoints declare only what they need
@app.get("/me")
def read_me(user: User = Depends(get_current_user)):
    return user                           # Just needs authentication

@app.delete("/users/{user_id}")
def delete_user(user_id: int, admin: User = Depends(require_admin)):
    return {"deleted": user_id}           # Needs admin role`,
              language: 'python',
            },
            {
              title: 'Class-Based Dependencies',
              description: 'Using classes as dependencies for stateful or complex logic',
              code: `from fastapi import FastAPI, Depends, Query

class PaginationParams:
    """A reusable class dependency for pagination."""
    def __init__(
        self,
        page: int = Query(1, ge=1, description="Page number"),
        per_page: int = Query(20, ge=1, le=100, description="Items per page"),
        sort_by: str = Query("created_at", description="Sort field"),
        sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    ):
        self.page = page
        self.per_page = per_page
        self.sort_by = sort_by
        self.sort_order = sort_order
        self.skip = (page - 1) * per_page

    @property
    def offset(self) -> int:
        return self.skip

    @property
    def limit(self) -> int:
        return self.per_page

app = FastAPI()

@app.get("/items")
def list_items(pagination: PaginationParams = Depends()):
    # FastAPI instantiates PaginationParams and injects it
    return {
        "page": pagination.page,
        "per_page": pagination.per_page,
        "offset": pagination.offset,
        "sort": f"{pagination.sort_by} {pagination.sort_order}",
    }

# Note: Depends() with no argument — FastAPI uses the class itself`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'data-flow',
            title: 'Nested Dependency Resolution',
            description: 'How FastAPI resolves a chain of dependencies from leaves to root',
            steps: [
              { label: 'Request arrives at DELETE /users/1', detail: 'Endpoint needs require_admin dependency', highlight: true },
              { label: 'require_admin → needs get_current_user', detail: 'Walking up the dependency tree', highlight: false },
              { label: 'get_current_user → needs decode_token', detail: 'Continue resolving sub-dependencies', highlight: false },
              { label: 'decode_token → needs oauth2_scheme', detail: 'Leaf dependency: extract token from header', highlight: true },
              { label: 'oauth2_scheme resolves → token string', detail: 'Base case: token extracted from Authorization header', highlight: false },
              { label: 'decode_token(token) → payload dict', detail: 'JWT decoded, payload returned', highlight: false },
              { label: 'get_current_user(payload) → User object', detail: 'User looked up in database', highlight: false },
              { label: 'require_admin(user) → admin User', detail: 'Role check passed, admin user returned', highlight: true },
              { label: 'Endpoint executes with admin User', detail: 'All dependencies resolved and injected', highlight: false },
            ],
          },
          tips: [
            'Use Depends() with no argument for class dependencies — FastAPI infers the class from the type hint.',
            'Class dependencies can have methods and properties, making them more powerful than simple function dependencies.',
            'Keep your dependency chain shallow — if you\'re 5 levels deep, consider simplifying the design.',
          ],
          keyTakeaway:
            'Dependencies compose: build complex behavior by stacking simple dependencies, and use classes when you need state or methods.',
        
          realWorldAnalogy: `Dependency chains are like a relay race. The first runner (oauth2_scheme) hands off the baton (token) to the second runner (decode_token), who hands it to the third (get_current_user), who hands it to the fourth (require_admin). Each runner only needs to know about the previous one, not the entire chain.`,
          commonMistake: [
            {
              mistake: `Creating monolithic dependency functions that do too many things`,
              fix: `Break complex dependencies into a chain: decode_token → get_current_user → require_role. Each function does one thing, and FastAPI resolves the chain automatically.`,
            },
            {
              mistake: `Not using class dependencies for complex stateful logic`,
              fix: `Class dependencies can have methods and computed properties. Use them when a dependency needs internal state or when the constructor parameters are sub-dependencies.`,
            },
          ],
          interviewQuestions: [
            {
              question: `How deep should a dependency chain be?`,
              answer: `Keep it shallow — 2-3 levels is ideal. If you're 5+ levels deep, consider simplifying the design. Deep chains are hard to debug and slow to resolve.`,
            },
            {
              question: `How do you use a class as a dependency?`,
              answer: `Use Depends() with no argument and type-hint the parameter as the class: pagination: PaginationParams = Depends(). FastAPI instantiates the class and injects the instance. Constructor parameters become sub-dependencies.`,
            },
          ],
          proTips: [
            `Use Security() instead of Depends() for security dependencies — it enables scope checking in FastAPI and marks the dependency as a security scheme in OpenAPI.`,
            `Class dependencies are perfect for pagination: they compute skip/limit from page/per_page and expose them as properties. One class, reusable across every list endpoint.`,
          ],},
      ],
    },

    // ──────────────────────────────────────────────
    // TOPIC 3: Middleware & CORS
    // ──────────────────────────────────────────────
    {
      id: 'm3-middleware-cors',
      title: 'Middleware & CORS',
      icon: '🛡️',
      simulation: 'MIDDLEWARE_CHAIN',
      introduction:
        'Middleware sits between the client and your route handler, intercepting every request and response. It\'s the right place for cross-cutting concerns like logging, timing, CORS headers, request ID generation, and rate limiting. Understanding middleware execution order and CORS mechanics is essential for building secure, well-behaved APIs.',
      sections: [
        {
          heading: 'Custom Middleware & Execution Order',
          content: `Middleware in FastAPI is a function that takes a request, passes it to the next handler (your route or the next middleware), receives the response, and can modify it before returning. Every middleware wraps around the entire application like an onion layer. The first middleware added is the outermost layer — it sees the request first and the response last.

This execution order matters enormously. If you add a logging middleware first and a timing middleware second, the timing middleware runs closer to your route handler. The request flows: logging → timing → route → timing processes response → logging processes response. The outermost middleware (added first) always has the broadest view.

You create custom middleware using the \`@app.middleware("http")\` decorator. The function receives the Request object and a \`call_next\` callable. You must call \`call_next(request)\` to pass the request to the next layer — forgetting this will silently swallow the request and return nothing. After calling call_next, you receive the Response object and can modify headers, log information, or even replace the response entirely.`,
          codeExamples: [
            {
              title: 'Request Timing & Logging Middleware',
              description: 'A practical middleware that measures request duration and logs details',
              code: `import time
import uuid
from fastapi import FastAPI, Request

app = FastAPI()

@app.middleware("http")
async def request_middleware(request: Request, call_next):
    # ── BEFORE the request ─────────────────────
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id  # Attach to request state
    start_time = time.time()

    print(f"[{request_id}] → {request.method} {request.url.path}")

    # ── PASS to next handler ────────────────────
    response = await call_next(request)

    # ── AFTER the response ──────────────────────
    process_time = (time.time() - start_time) * 1000  # milliseconds
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time-Ms"] = f"{process_time:.2f}"

    print(f"[{request_id}] ← {response.status_code} ({process_time:.1f}ms)")

    return response

@app.get("/items")
def list_items():
    return [{"id": 1, "name": "Widget"}]`,
              language: 'python',
            },
            {
              title: 'Error-Handling Middleware',
              description: 'Catch unhandled exceptions and return consistent error responses',
              code: `import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)
app = FastAPI()

@app.middleware("http")
async def error_handling_middleware(request: Request, call_next):
    try:
        response = await call_next(request)
        return response
    except Exception as exc:
        logger.exception(f"Unhandled exception on {request.method} {request.url}")
        return JSONResponse(
            status_code=500,
            content={
                "detail": "Internal server error",
                "error_type": type(exc).__name__,
                "path": str(request.url.path),
            },
        )

# This endpoint has a bug — the middleware catches it gracefully
@app.get("/broken")
def broken_endpoint():
    result = 1 / 0  # ZeroDivisionError
    return {"result": result}`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'flow',
            title: 'Middleware Execution Order (Onion Model)',
            description: 'How request and response flow through middleware layers',
            steps: [
              { label: 'Client sends request', detail: 'HTTP request enters the outermost middleware', highlight: false },
              { label: 'Middleware A (added first)', detail: 'Outermost layer: logging, request ID', highlight: true },
              { label: 'Middleware B (added second)', detail: 'Inner layer: timing, CORS headers', highlight: true },
              { label: 'Route handler executes', detail: 'Your endpoint function runs', highlight: true },
              { label: 'Middleware B processes response', detail: 'Adds timing headers', highlight: false },
              { label: 'Middleware A processes response', detail: 'Logs request details, adds request ID', highlight: false },
              { label: 'Response sent to client', detail: 'Fully processed response leaves the system', highlight: false },
            ],
          },
          tips: [
            'Middleware added first = outermost layer. It sees the request first and the response last.',
            'Always call call_next(request) — forgetting it means the request never reaches your route handler.',
            'Attach data to request.state (like request_id) to pass middleware data to your route handlers.',
          ],
          keyTakeaway:
            'Middleware wraps your app like an onion — first added is outermost. Always call call_next, and use request.state for shared data.',
        
          realWorldAnalogy: `Middleware is like a series of security checkpoints at an airport. First you go through the identity check (logging middleware), then the baggage scan (timing middleware), then the metal detector (auth middleware), and finally you board the plane (your route handler). On the way out, you pass through in reverse order — each checkpoint processes your departure.`,
          commonMistake: [
            {
              mistake: `Forgetting to call call_next(request) in middleware`,
              fix: `You MUST call await call_next(request) to pass the request to the next handler. Forgetting it silently swallows the request — your endpoint never runs.`,
            },
            {
              mistake: `Adding middleware in the wrong order`,
              fix: `Middleware added first is outermost — it sees requests first and responses last. Add logging middleware first (broadest view) and auth middleware last (closest to routes).`,
            },
          ],
          interviewQuestions: [
            {
              question: `What is the "onion model" of middleware execution?`,
              answer: `Middleware wraps around your app like onion layers. The first middleware added is outermost — it sees requests first and responses last. The request flows: outermost → innermost → route → innermost response → outermost response.`,
            },
            {
              question: `How do you share data between middleware and route handlers?`,
              answer: `Attach data to request.state (e.g., request.state.request_id = uuid). Route handlers can access this via the Request object.`,
            },
          ],
          proTips: [
            `Always add logging middleware first (outermost) so it captures the full request lifecycle including timing from all inner middleware.`,
            `Use request.state to pass data from middleware to route handlers. It's a simple object you can attach any property to.`,
          ],},
        {
          heading: 'CORS: Cross-Origin Resource Sharing',
          content: `CORS is a browser security mechanism that controls which origins (domains) can access your API. When a browser makes a cross-origin request (e.g., your React app at app.example.com calling api.example.com), it first sends a preflight OPTIONS request. Your server must respond with the correct CORS headers, or the browser blocks the actual request.

FastAPI\'s CORSMiddleware handles all of this automatically. You configure it with the origins that should be allowed, which HTTP methods and headers are permitted, and whether credentials (cookies, authorization headers) are included. The middleware intercepts OPTIONS requests and adds the appropriate Access-Control-* headers to all responses.

The most common mistake is setting \`allow_origins=["*"]\` with \`allow_credentials=True\`. This combination is explicitly forbidden by the CORS specification — browsers will reject it. In production, you should list your exact frontend origins. In development, you can use ["*"] without credentials, or list specific development URLs.

Another subtlety: CORS only affects browsers. Server-to-server requests, mobile apps, and CLI tools don\'t enforce CORS. It\'s a client-side (browser) security feature, not a server-side restriction.`,
          codeExamples: [
            {
              title: 'CORS Configuration for Production',
              description: 'Properly configured CORS with specific origins and credentials',
              code: `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Production CORS — list exact origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://myapp.com",
        "https://admin.myapp.com",
        "https://staging.myapp.com",
    ],
    allow_credentials=True,         # Allow cookies & auth headers
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
    max_age=3600,                   # Preflight cache: 1 hour
)

# Development CORS — more permissive
# allow_origins=["http://localhost:3000", "http://localhost:5173"]`,
              language: 'python',
            },
            {
              title: 'Dynamic CORS with Origin Validation',
              description: 'Validate origins dynamically for multi-tenant or wildcard subdomain setups',
              code: `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

def is_allowed_origin(origin: str) -> bool:
    """Validate origin against allowed patterns."""
    allowed_patterns = [
        "https://myapp.com",
        ".myapp.com",          # Any subdomain
        "http://localhost:",   # Local development
    ]
    return any(pattern in origin for pattern in allowed_patterns)

app.add_middleware(
    CORSMiddleware,
    allow_origins=is_allowed_origin,  # Function instead of list!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# This allows:
# https://tenant1.myapp.com  ✅
# https://admin.myapp.com    ✅
# http://localhost:3000      ✅
# https://evil.com           ❌`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'sequence',
            title: 'CORS Preflight Flow',
            description: 'How browsers handle cross-origin requests with preflight',
            steps: [
              { label: 'Browser: OPTIONS /api/data', detail: 'Preflight request with Access-Control-Request-Method', highlight: true },
              { label: 'Server: CORSMiddleware intercepts', detail: 'Checks origin against allow_origins list', highlight: true },
              { label: 'Server: Returns CORS headers', detail: 'Access-Control-Allow-Origin, Methods, Headers', highlight: false },
              { label: 'Browser: Checks response headers', detail: 'Verifies origin, method, and headers are allowed', highlight: true },
              { label: 'Browser: Sends actual request', detail: 'GET /api/data with Origin header', highlight: false },
              { label: 'Server: Processes & responds', detail: 'CORSMiddleware adds headers to response', highlight: false },
              { label: 'Browser: Receives response', detail: 'Data available to JavaScript', highlight: false },
            ],
          },
          tips: [
            'Never use allow_origins=["*"] with allow_credentials=True — browsers reject this combo per the CORS spec.',
            'CORS is enforced by browsers only — server-to-server and mobile app requests ignore CORS entirely.',
            'Use max_age=3600 to cache preflight responses — it reduces OPTIONS requests by 99% for repeat visitors.',
          ],
          keyTakeaway:
            'CORS is a browser security feature, not server-side security. Configure it precisely with real origins, and never combine wildcard origins with credentials.',
        
          realWorldAnalogy: `CORS is like a building receptionist who checks if visitors from other companies (origins) are allowed to enter. If your company (API) only allows visitors from your own office building (same origin), the receptionist turns away all external visitors. CORS configuration is the guest list that tells the receptionist which external companies are welcome.`,
          commonMistake: [
            {
              mistake: `Setting allow_origins=["*"] with allow_credentials=True`,
              fix: `This combination is forbidden by the CORS specification — browsers reject it. List specific origins when credentials are needed.`,
            },
            {
              mistake: `Thinking CORS is server-side security`,
              fix: `CORS is a browser-only security feature. Server-to-server requests, mobile apps, and CLI tools don't enforce CORS. Use proper authentication for real security.`,
            },
          ],
          interviewQuestions: [
            {
              question: `What is a CORS preflight request?`,
              answer: `Before sending certain cross-origin requests, the browser sends an OPTIONS request to check if the server allows the actual request. The server responds with Access-Control-* headers indicating allowed methods, headers, and origins.`,
            },
            {
              question: `Why can't you use allow_origins=["*"] with credentials?`,
              answer: `The CORS spec explicitly forbids this combination because it would allow any website to make authenticated requests to your API, which is a security vulnerability. You must list specific origins.`,
            },
          ],
          proTips: [
            `In development, use allow_origins=["*"] WITHOUT credentials. In production, list exact origins WITH credentials. This is the correct pattern.`,
            `CORS only affects browsers. Your mobile app, CLI tools, and server-to-server calls work fine without CORS headers.`,
          ],},
      ],
      frontendIntegration: {
        title: `Testing CORS from a Browser`,
        vanillaHtml: {
          title: `CORS Test Page`,
          description: `A page specifically designed to test if CORS is properly configured`,
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
          language: `html`,
          whatHappened: [
            `The fetch attempts a cross-origin request to FastAPI`,
            `If CORS is configured, the request succeeds`,
            `If not, the browser blocks it and shows a CORS error`,
          ],
          tryToBreak: [
            `Remove CORSMiddleware from your FastAPI app and click Test — you'll see the CORS error`,
            `Change the origin URL and observe how only allowed origins work`,
          ],
        },
        corsNote: `This IS the CORS test! If it fails, you need to add CORSMiddleware to your FastAPI app.`,
      },
    },

    // ──────────────────────────────────────────────
    // TOPIC 4: Background Tasks
    // ──────────────────────────────────────────────
    {
      id: 'm3-background-tasks',
      title: 'Background Tasks',
      icon: '⏳',
      introduction:
        'Not every operation needs to block the HTTP response. Sending confirmation emails, updating analytics, processing uploaded files, and invalidating caches can all happen after the client receives their response. FastAPI\'s BackgroundTasks provides a lightweight, built-in mechanism for exactly this — but knowing when to use it versus a full task queue like Celery is crucial for production systems.',
      sections: [
        {
          heading: 'Using BackgroundTasks Effectively',
          content: `FastAPI\'s BackgroundTasks is deceptively simple: you inject a BackgroundTasks object into your endpoint, call add_task with a function and its arguments, and FastAPI runs those functions after sending the response. The client gets an immediate answer while the work happens asynchronously behind the scenes.

The tasks run in the same process as your FastAPI application, using the same event loop. This means they\'re fast to start (no serialization or network overhead) but they share resources with your API. A slow background task can block the event loop and degrade API performance. For CPU-intensive work, use \`asyncio.get_event_loop().run_in_executor()\` to offload to a thread pool.

BackgroundTasks supports both sync and async functions. Async functions are awaited; sync functions are run in a thread pool. You can add multiple tasks to a single request, and they execute in the order they were added. If any task raises an exception, it\'s logged but doesn\'t affect other tasks or the already-sent response.`,
          codeExamples: [
            {
              title: 'Welcome Email & Analytics on Signup',
              description: 'Run non-critical operations after responding to the client',
              code: `from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel, EmailStr

app = FastAPI()

class UserSignup(BaseModel):
    email: EmailStr
    username: str

async def send_welcome_email(email: str, username: str):
    """Simulated email sending — takes 2 seconds."""
    await asyncio.sleep(2)
    print(f"Welcome email sent to {email}")

def log_analytics(username: str, event: str):
    """Log analytics event — runs in thread pool (sync)."""
    with open("analytics.log", "a") as f:
        f.write(f"{username}: {event}\\n")

@app.post("/signup", status_code=201)
async def signup(user: UserSignup, bg: BackgroundTasks):
    # 1. Save user to database (this is the critical part)
    create_user_in_db(user)

    # 2. Add background tasks (client doesn't wait for these)
    bg.add_task(send_welcome_email, user.email, user.username)
    bg.add_task(log_analytics, user.username, "user.signup")

    # 3. Respond immediately
    return {"message": f"Welcome, {user.username}!", "email_queued": True}`,
              language: 'python',
            },
            {
              title: 'Background Task with Database Dependency',
              description: 'Pass a database session to a background task safely',
              code: `from fastapi import FastAPI, BackgroundTasks, Depends
from sqlalchemy.orm import Session

app = FastAPI()

def process_file(file_id: int, db_session_factory):
    """
    Background task with its OWN database session.
    NEVER use the request-scoped session from Depends(get_db)
    in a background task — it will be closed!
    """
    db = db_session_factory()  # Create a fresh session
    try:
        file_record = db.query(File).filter(File.id == file_id).first()
        # ... process the file ...
        file_record.status = "processed"
        db.commit()
    finally:
        db.close()

@app.post("/upload")
async def upload_file(
    file: UploadFile,
    bg: BackgroundTasks,
    db: Session = Depends(get_db),
):
    # Save file metadata using the request-scoped session
    file_record = File(filename=file.filename, status="pending")
    db.add(file_record)
    db.commit()
    db.refresh(file_record)

    # Pass the SESSION FACTORY, not the session itself
    bg.add_task(process_file, file_record.id, SessionLocal)

    return {"id": file_record.id, "status": "processing"}`,
              language: 'python',
            },
          ],
          tips: [
            'NEVER pass a request-scoped database session (from Depends(get_db)) to a background task — it will be closed before the task runs.',
            'Background tasks run after the response is sent — if the server crashes, pending tasks are lost.',
            'For async tasks, FastAPI awaits them; for sync tasks, it runs them in a thread pool automatically.',
          ],
          keyTakeaway:
            'BackgroundTasks is perfect for fire-and-forget operations — but create fresh database sessions and never assume tasks survive crashes.',
        },
        {
          heading: 'BackgroundTasks vs Celery: When to Upgrade',
          content: `FastAPI\'s BackgroundTasks is great for simple scenarios, but it has hard limits: tasks don\'t survive server restarts, there\'s no retry mechanism, no task prioritization, no scheduling, and no way to monitor task progress. When you need any of these features, it\'s time to upgrade to a proper task queue like Celery with Redis or RabbitMQ.

The upgrade path is straightforward: Celery workers run as separate processes, communicating through a message broker (Redis or RabbitMQ). Your FastAPI app submits tasks to the broker, and workers pick them up asynchronously. This decouples task execution from your API — you can scale workers independently, retry failed tasks, and monitor everything through tools like Flower.

The decision criterion is simple: if a task must complete (like payment processing), use Celery. If a task is nice-to-have (like welcome emails), BackgroundTasks is fine. If a task is CPU-intensive and could block the event loop, use Celery. If you need scheduled/recurring tasks, Celery Beat handles that natively.`,
          codeExamples: [
            {
              title: 'Celery Setup with FastAPI',
              description: 'A production task queue that survives restarts and supports retries',
              code: `# celery_app.py
from celery import Celery

celery = Celery(
    "worker",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/1",
)

@celery.task(bind=True, max_retries=3, default_retry_delay=60)
def process_payment(self, order_id: int):
    """Celery task with automatic retries."""
    try:
        order = get_order(order_id)
        charge_credit_card(order)
        send_confirmation_email(order)
    except PaymentGatewayError as exc:
        # Retry up to 3 times with 60-second delay
        raise self.retry(exc=exc)

# ─────────────────────────
# app/routers/orders.py
from celery_app import process_payment

@router.post("/orders/{order_id}/pay")
async def pay_order(order_id: int):
    # Submit to Celery — returns immediately with task ID
    task = process_payment.delay(order_id)
    return {"task_id": task.id, "status": "processing"}

@router.get("/tasks/{task_id}")
async def get_task_status(task_id: str):
    from celery.result import AsyncResult
    task = AsyncResult(task_id)
    return {
        "task_id": task_id,
        "status": task.status,        # PENDING, STARTED, SUCCESS, FAILURE
        "result": task.result if task.ready() else None,
    }`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'comparison',
            title: 'BackgroundTasks vs Celery',
            description: 'Feature comparison to help you choose the right tool',
            columns: [
              {
                title: 'Feature',
                items: ['Survives restarts', 'Retry on failure', 'Task priority', 'Scheduled tasks', 'Task monitoring', 'Horizontal scaling', 'Setup complexity', 'Best for'],
              },
              {
                title: 'BackgroundTasks',
                items: ['❌ No', '❌ No', '❌ No', '❌ No', '❌ No', '❌ No', '✅ Zero setup', 'Simple fire-and-forget'],
              },
              {
                title: 'Celery + Redis',
                items: ['✅ Yes', '✅ Yes', '✅ Yes', '✅ Beat scheduler', '✅ Flower UI', '✅ Add workers', '⚠️ Moderate setup', 'Critical business tasks'],
              },
            ],
          },
          tips: [
            'Start with BackgroundTasks and upgrade to Celery when you need persistence, retries, or scheduling.',
            'Celery workers run as separate processes — they don\'t share memory with your FastAPI app, so import paths must be consistent.',
            'Use Redis as both the Celery broker and backend — it\'s simpler than RabbitMQ for most use cases.',
          ],
          keyTakeaway:
            'BackgroundTasks for simple fire-and-forget, Celery for critical tasks that must complete — the upgrade path is clean.',
        },
      ],
    },

    // ──────────────────────────────────────────────
    // TOPIC 5: Exception Handlers & Custom Exceptions
    // ──────────────────────────────────────────────
    {
      id: 'm3-exception-handlers',
      title: 'Exception Handlers & Custom Exceptions',
      icon: '🚨',
      introduction:
        'Production APIs need consistent, informative error responses. FastAPI\'s default 422 validation errors are great, but you need custom exception classes and handlers for business logic errors. This topic covers creating custom exception hierarchies, registering exception handlers, and building error response models that make debugging easy for API consumers.',
      sections: [
        {
          heading: 'Custom Exception Classes & Hierarchies',
          content: `FastAPI handles HTTPException natively, but your application has domain-specific errors that deserve their own types. A \`UserNotFoundError\` is more meaningful than a generic 404, and an \`InsufficientFundsError\` is clearer than a generic 400. Custom exceptions make your code self-documenting and enable targeted handling.

The pattern is to create a base exception class for your application, then subclass it for specific error types. Each exception carries an HTTP status code, an error code (for programmatic identification), and a human-readable message. This structure lets you catch broad categories (catch AppException) or specific errors (catch InsufficientFundsError) depending on the context.

When you raise these exceptions in your route handlers or services, they bubble up to FastAPI\'s exception handling layer. Without a custom handler, they\'d result in a 500 Internal Server Error. With a custom handler, they produce the exact JSON response you want.`,
          codeExamples: [
            {
              title: 'Custom Exception Hierarchy',
              description: 'A structured exception system for a production API',
              code: `from fastapi import HTTPException

class AppException(Exception):
    """Base exception for all application errors."""
    def __init__(self, status_code: int, error_code: str, message: str, details: dict | None = None):
        self.status_code = status_code
        self.error_code = error_code
        self.message = message
        self.details = details or {}
        super().__init__(message)

# ── Domain-specific exceptions ──────────────────
class NotFoundError(AppException):
    def __init__(self, resource: str, resource_id: int | str):
        super().__init__(
            status_code=404,
            error_code="NOT_FOUND",
            message=f"{resource} with id '{resource_id}' not found",
            details={"resource": resource, "id": str(resource_id)},
        )

class ConflictError(AppException):
    def __init__(self, resource: str, field: str, value: str):
        super().__init__(
            status_code=409,
            error_code="CONFLICT",
            message=f"{resource} with {field}='{value}' already exists",
            details={"resource": resource, "field": field, "value": value},
        )

class BusinessRuleError(AppException):
    def __init__(self, message: str, rule: str):
        super().__init__(
            status_code=422,
            error_code="BUSINESS_RULE_VIOLATION",
            message=message,
            details={"rule": rule},
        )

# Usage in services
class UserService:
    def register(self, email: str):
        if self.repo.get_by_email(email):
            raise ConflictError("User", "email", email)  # 409
        # ... create user ...`,
              language: 'python',
            },
            {
              title: 'Raising Custom Exceptions in Endpoints',
              description: 'Clean error handling in your route handlers and service layer',
              code: `from fastapi import APIRouter, Depends
from app.exceptions import NotFoundError, BusinessRuleError

router = APIRouter(prefix="/orders", tags=["orders"])

@router.post("/", response_model=OrderResponse, status_code=201)
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == order.product_id).first()
    if not product:
        raise NotFoundError("Product", order.product_id)  # 404

    if product.stock < order.quantity:
        raise BusinessRuleError(                         # 422
            message=f"Only {product.stock} units available",
            rule="ORDER_EXCEEDS_STOCK",
        )

    db_order = Order(product_id=product.id, quantity=order.quantity)
    db.add(db_order)
    db.commit()
    return db_order`,
              language: 'python',
            },
          ],
          tips: [
            'Create a base exception class and subclass it — this lets you catch all app errors or specific ones as needed.',
            'Include an error_code string in your exceptions — clients can match on it programmatically instead of parsing messages.',
            'Put details in a dict, not in the message string — it makes programmatic access easy and keeps messages human-readable.',
          ],
          keyTakeaway:
            'Custom exceptions make errors self-documenting — raise NotFoundError("User", 42) instead of HTTPException(404, "Not found").',
        },
        {
          heading: 'Exception Handlers & Error Response Models',
          content: `Exception handlers are functions that FastAPI calls when a specific exception type is raised. You register them with \`@app.exception_handler(SomeException)\`. The handler receives the request and the exception, and returns a Response — typically a JSONResponse with a structured error body.

The key to a great error response model is consistency. Every error should have the same structure: an error code for programmatic matching, a message for humans, and optional details for debugging. Include the request path and a correlation ID so that when users report errors, you can find the exact request in your logs.

You should also handle FastAPI\'s built-in RequestValidationError to customize the 422 response format. The default format is verbose and not always aligned with your application\'s error structure. By overriding it, you ensure all errors — whether from validation or business logic — have the same shape.`,
          codeExamples: [
            {
              title: 'Registering Exception Handlers',
              description: 'Convert custom exceptions into consistent JSON error responses',
              code: `from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.exceptions import AppException

app = FastAPI()

# ── Handle custom application exceptions ─────────
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.error_code,
                "message": exc.message,
                "details": exc.details,
                "path": str(request.url.path),
            }
        },
    )

# ── Handle validation errors (422) ───────────────
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for error in exc.errors():
        errors.append({
            "field": ".".join(str(loc) for loc in error["loc"]),
            "message": error["msg"],
            "type": error["type"],
        })
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Request validation failed",
                "details": {"errors": errors},
                "path": str(request.url.path),
            }
        },
    )

# ── Catch-all for unexpected errors ───────────────
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred",
                "details": {},
                "path": str(request.url.path),
            }
        },
    )`,
              language: 'python',
            },
            {
              title: 'Standardized Error Response Model',
              description: 'A Pydantic model that documents your error response in OpenAPI',
              code: `from pydantic import BaseModel
from typing import Optional

class ErrorDetail(BaseModel):
    field: Optional[str] = None
    message: str
    type: Optional[str] = None

class ErrorResponse(BaseModel):
    error: ErrorBody

class ErrorBody(BaseModel):
    code: str
    message: str
    details: dict = {}
    path: str

# Use in your endpoint definitions for OpenAPI docs
@router.get(
    "/users/{user_id}",
    response_model=UserResponse,
    responses={
        404: {"model": ErrorResponse, "description": "User not found"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
    },
)
def get_user(user_id: int):
    ...
    # The responses dict shows up in Swagger UI!`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'flow',
            title: 'Exception Handling Flow',
            description: 'How exceptions flow from your code to the client response',
            steps: [
              { label: 'Route handler raises exception', detail: 'AppException, HTTPException, or unexpected error', highlight: true },
              { label: 'FastAPI catches the exception', detail: 'Looks up registered exception handlers by type', highlight: true },
              { label: 'Handler matched?', detail: 'Check for exact type, then parent classes', highlight: false },
              { label: 'Custom handler executes', detail: 'Returns structured JSONResponse', highlight: true },
              { label: 'No handler → 500 error', detail: 'Unhandled exceptions become Internal Server Error', highlight: false },
              { label: 'Error response sent to client', detail: 'Consistent format: code, message, details, path', highlight: false },
            ],
          },
          tips: [
            'Register a catch-all Exception handler for production — unhandled exceptions should never leak stack traces to clients.',
            'Override RequestValidationError to make 422 responses match your error format — consistency builds trust.',
            'Use the responses parameter on route decorators to document error responses in your OpenAPI schema.',
          ],
          keyTakeaway:
            'Custom exception handlers give you consistent error responses across your entire API — register them for every exception type you use.',
        },
      ],
    },

    // ──────────────────────────────────────────────
    // TOPIC 6: Forms & File Uploads
    // ──────────────────────────────────────────────
    {
      id: 'm3-forms-uploads',
      title: 'Forms & File Uploads',
      icon: '📎',
      introduction:
        'Not all API requests send JSON. Forms and file uploads use multipart/form-data encoding, which requires different handling in FastAPI. This topic covers Form() parameters for HTML form data, UploadFile and File() for file uploads, and the patterns for handling both together in a single endpoint.',
      sections: [
        {
          heading: 'Form Data with Form()',
          content: `When a client submits an HTML form or sends application/x-www-form-urlencoded data, FastAPI uses the Form() parameter to extract values. Unlike JSON body parameters (which use Pydantic models), form parameters are declared individually, just like query parameters but with Form() instead of Query().

The key difference from JSON is that form data is flat — there are no nested objects or arrays. Each form field is a simple key-value pair. If you need structured data from a form, you must flatten it (e.g., user_name instead of user.name) or use a Pydantic model with Form() fields.

You can mix Form() parameters with other parameter types in the same endpoint. For example, an endpoint might accept a path parameter for the user ID, a query parameter for the return format, and form parameters for the data being updated. FastAPI resolves each parameter type from the correct location in the request.

For OAuth2 password flow, FastAPI uses form data internally — OAuth2PasswordRequestForm is a special Form-based dependency that the Swagger UI "Authorize" button uses.`,
          codeExamples: [
            {
              title: 'Handling Form Submissions',
              description: 'Accept form data from HTML forms or API clients',
              code: `from fastapi import FastAPI, Form
from pydantic import EmailStr

app = FastAPI()

@app.post("/contact")
async def submit_contact_form(
    name: str = Form(..., min_length=2, max_length=100),
    email: EmailStr = Form(...),
    subject: str = Form(..., max_length=200),
    message: str = Form(..., min_length=10, max_length=5000),
    priority: str = Form("normal", pattern="^(normal|high|urgent)$"),
):
    # All form fields are validated and typed
    return {
        "name": name,
        "email": email,
        "subject": subject,
        "priority": priority,
        "message_length": len(message),
    }`,
              language: 'python',
            },
            {
              title: 'Form Data as Pydantic Model',
              description: 'Use a model to group form fields when you have many of them',
              code: `from fastapi import FastAPI, Form, Depends
from pydantic import BaseModel, EmailStr

class ContactForm(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str

    @classmethod
    def as_form(
        cls,
        name: str = Form(...),
        email: EmailStr = Form(...),
        subject: str = Form(...),
        message: str = Form(...),
    ):
        return cls(name=name, email=email, subject=subject, message=message)

app = FastAPI()

@app.post("/contact")
async def submit_contact(form: ContactForm = Depends(ContactForm.as_form)):
    # form is a proper Pydantic model with validation
    return {"name": form.name, "email": form.email}`,
              language: 'python',
            },
          ],
          tips: [
            'Form() parameters work just like Query() but extract from the request body instead of the URL.',
            'You cannot mix Form() parameters and a JSON body (Pydantic model) in the same endpoint — they use different content types.',
            'Use the as_form pattern to group form fields into a Pydantic model for cleaner endpoint signatures.',
          ],
          keyTakeaway:
            'Form() extracts flat key-value pairs from form-encoded requests — use the as_form pattern for complex forms with validation.',
        },
        {
          heading: 'File Uploads with UploadFile & File()',
          content: `FastAPI provides two mechanisms for file uploads: \`File()\` for small files loaded entirely into memory, and \`UploadFile\` for files of any size that are streamed to disk. In practice, you should almost always use UploadFile because it handles large files gracefully and provides a file-like interface.

UploadFile has several advantages: it uses a spooled temporary file (kept in memory up to 2MB, then written to disk), it exposes a Python file-like interface with async methods (read, write, seek, close), and it includes metadata like the original filename and content type. You can access the underlying file with \`upload_file.file\` for synchronous operations.

For multiple file uploads, use \`list[UploadFile]\`. FastAPI handles the multipart parsing automatically. You can also mix file uploads with form data in the same endpoint — this is common for endpoints that accept a file plus metadata (like uploading an avatar with a caption).

Always validate uploaded files: check the file size, verify the content type matches the extension, and scan for malware in production. Never trust the client-provided filename or content type blindly.`,
          codeExamples: [
            {
              title: 'Single & Multiple File Uploads',
              description: 'Handle file uploads with proper validation and error handling',
              code: `from fastapi import FastAPI, UploadFile, File, HTTPException
from pathlib import Path
import shutil

app = FastAPI()

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE = 5 * 1024 * 1024  # 5MB

@app.post("/upload/avatar")
async def upload_avatar(file: UploadFile = File(...)):
    # Validate content type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, detail=f"Invalid file type: {file.content_type}")

    # Validate file size
    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(400, detail="File too large (max 5MB)")

    # Reset file position after reading
    await file.seek(0)

    # Save to disk with a safe filename
    safe_name = f"user_{uuid.uuid4().hex[:8]}{Path(file.filename).suffix}"
    file_path = Path("uploads/avatars") / safe_name

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"filename": safe_name, "size": len(contents), "type": file.content_type}

@app.post("/upload/gallery")
async def upload_gallery(files: list[UploadFile] = File(...)):
    """Upload multiple files at once."""
    results = []
    for file in files:
        contents = await file.read()
        results.append({
            "filename": file.filename,
            "size": len(contents),
            "type": file.content_type,
        })
        await file.seek(0)
    return {"uploaded": len(results), "files": results}`,
              language: 'python',
            },
            {
              title: 'Mixing File Uploads with Form Data',
              description: 'Upload a file with associated metadata in one request',
              code: `from fastapi import FastAPI, UploadFile, File, Form

app = FastAPI()

@app.post("/products/{product_id}/images")
async def add_product_image(
    product_id: int,
    file: UploadFile = File(..., description="Product image file"),
    alt_text: str = Form("", max_length=200, description="Image alt text"),
    is_primary: bool = Form(False, description="Set as primary product image"),
    sort_order: int = Form(0, ge=0, description="Display order"),
):
    # Both file and form fields are available
    contents = await file.read()

    # Save image and metadata to database
    image_record = save_product_image(
        product_id=product_id,
        file_data=contents,
        filename=file.filename,
        alt_text=alt_text,
        is_primary=is_primary,
        sort_order=sort_order,
    )

    return {
        "id": image_record.id,
        "product_id": product_id,
        "filename": file.filename,
        "alt_text": alt_text,
        "is_primary": is_primary,
    }`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'data-flow',
            title: 'Multipart Form Data Processing',
            description: 'How FastAPI processes a request containing both files and form fields',
            steps: [
              { label: 'Client sends multipart/form-data', detail: 'Content-Type: multipart/form-data with boundary', highlight: true },
              { label: 'FastAPI parses multipart boundaries', detail: 'Separates each part by boundary marker', highlight: false },
              { label: 'Form fields → Form() parameters', detail: 'Text fields extracted and validated as typed values', highlight: true },
              { label: 'File parts → UploadFile objects', detail: 'Files spooled to temp storage, metadata extracted', highlight: true },
              { label: 'All parameters injected into handler', detail: 'Form data and files available as function arguments', highlight: false },
              { label: 'Response returned', detail: 'UploadFile temp files cleaned up after response', highlight: false },
            ],
          },
          tips: [
            'Always use UploadFile over File() — it handles large files via spooling and provides async read/write.',
            'Validate file type AND content — check both the extension and the actual file bytes (magic numbers) for security.',
            'Read the file contents with await file.read() — never use file.file.read() directly in async endpoints.',
          ],
          keyTakeaway:
            'UploadFile streams files to disk gracefully — always validate type and size, and mix with Form() for metadata in the same request.',
        },
      ],
    },

    // ──────────────────────────────────────────────
    // TOPIC 7: API Versioning Strategies
    // ──────────────────────────────────────────────
    {
      id: 'm3-api-versioning',
      title: 'API Versioning Strategies',
      icon: '🔢',
      introduction:
        'APIs evolve. Fields get renamed, behaviors change, endpoints are deprecated. Without a versioning strategy, every change is a breaking change for your clients. This topic covers the three main versioning approaches — URL versioning, header versioning, and router-based versioning — and when to use each one.',
      sections: [
        {
          heading: 'URL Versioning & Header Versioning',
          content: `URL versioning is the most common and visible approach: your API lives at /api/v1/users, /api/v2/users, etc. It\'s explicit, cacheable, and easy to understand. Clients can see the version in their URLs, and CDNs can cache different versions separately. The downside is that it multiplies your route definitions — each version needs its own set of endpoints.

Header versioning uses a custom header (like API-Version: 2 or Accept: application/vnd.myapi.v2+json) to specify the version. The URL stays the same, which is cleaner for clients, but it\'s harder to test (you can\'t just paste a URL in a browser) and harder to cache (CDNs typically don\'t vary cache keys by custom headers).

In practice, URL versioning wins for public APIs because of its simplicity and debuggability. Header versioning works better for internal APIs where you control both client and server, or when you want to avoid URL proliferation.

The most important rule: version your API from day one. Even if you\'re at v1, having /api/v1/ in your URLs makes it trivial to introduce v2 later. If you don\'t version from the start, adding versioning later requires either breaking existing clients or maintaining unversioned URLs alongside versioned ones.`,
          codeExamples: [
            {
              title: 'URL-Based Versioning with Shared Logic',
              description: 'Multiple API versions sharing business logic but with different schemas',
              code: `from fastapi import FastAPI, APIRouter

app = FastAPI()

# ── V1 Schema ────────────────────────────────────
class UserResponseV1(BaseModel):
    id: int
    name: str          # V1 uses "name" (first + last combined)
    email: str

# ── V2 Schema ────────────────────────────────────
class UserResponseV2(BaseModel):
    id: int
    first_name: str    # V2 splits into first_name and last_name
    last_name: str
    email: str
    created_at: datetime  # V2 adds new field

# ── V1 Router ────────────────────────────────────
router_v1 = APIRouter(prefix="/api/v1")

@router_v1.get("/users/{user_id}", response_model=UserResponseV1)
def get_user_v1(user_id: int, db: Session = Depends(get_db)):
    user = get_user_from_db(db, user_id)
    return UserResponseV1(
        id=user.id,
        name=f"{user.first_name} {user.last_name}",  # Combine for V1
        email=user.email,
    )

# ── V2 Router ────────────────────────────────────
router_v2 = APIRouter(prefix="/api/v2")

@router_v2.get("/users/{user_id}", response_model=UserResponseV2)
def get_user_v2(user_id: int, db: Session = Depends(get_db)):
    user = get_user_from_db(db, user_id)
    return UserResponseV2.model_validate(user)  # Direct mapping

app.include_router(router_v1)
app.include_router(router_v2)`,
              language: 'python',
            },
            {
              title: 'Header-Based Versioning',
              description: 'Route to different handlers based on a custom header',
              code: `from fastapi import FastAPI, Request, Header
from fastapi.responses import JSONResponse

app = FastAPI()

async def handle_v1(request: Request):
    return {"version": "v1", "name": "Legacy User Format"}

async def handle_v2(request: Request):
    return {"version": "v2", "first_name": "New", "last_name": "Format"}

@app.get("/api/users/{user_id}")
async def get_user(
    request: Request,
    api_version: str = Header("v1", alias="API-Version"),
):
    """Route to the appropriate version handler based on header."""
    if api_version == "v2":
        return await handle_v2(request)
    return await handle_v1(request)

# Client request:
# GET /api/users/1
# API-Version: v2
# → {"version": "v2", "first_name": "New", "last_name": "Format"}`,
              language: 'python',
            },
          ],
          tips: [
            'Version from day one — /api/v1/ in your URLs makes future versioning trivial.',
            'URL versioning is the best default for public APIs — it\'s visible, cacheable, and easy to test.',
            'Keep old versions running for at least 6 months after deprecation to give clients time to migrate.',
          ],
          keyTakeaway:
            'URL versioning is the pragmatic choice for public APIs — version from day one and keep old versions alive during deprecation.',
        },
        {
          heading: 'Router-Based Versioning & Deprecation Strategy',
          content: `The cleanest way to implement URL versioning in FastAPI is router-based: each API version is a separate router module, and the main app includes them with version-specific prefixes. This keeps version code isolated, makes it easy to deprecate entire versions (just remove the include_router line), and allows each version to have its own dependencies and middleware.

For deprecation, FastAPI supports the deprecated=True parameter on route decorators. This marks the endpoint as deprecated in the OpenAPI schema, which shows up clearly in Swagger UI with a strikethrough style. You should also add a deprecation notice in the endpoint\'s summary or description, including the date the endpoint will be removed and a link to the replacement.

The transition strategy matters: when introducing v2, don\'t remove v1 immediately. Run both in parallel, log v1 usage, communicate the deprecation timeline to clients, and only remove v1 when usage drops to zero or after the deprecation period expires. This is how major APIs like Stripe and GitHub handle versioning.`,
          codeExamples: [
            {
              title: 'Router-Based Versioning Architecture',
              description: 'Each version is an isolated router module with clean separation',
              code: `# app/routers/v1/__init__.py
from fastapi import APIRouter
from .users import router as users_router
from .products import router as products_router

router_v1 = APIRouter(prefix="/api/v1")
router_v1.include_router(users_router)
router_v1.include_router(products_router)

# app/routers/v2/__init__.py
from fastapi import APIRouter
from .users import router as users_router
from .products import router as products_router

router_v2 = APIRouter(prefix="/api/v2")
router_v2.include_router(users_router)
router_v2.include_router(products_router)

# ─────────────────────────
# app/main.py
from app.routers.v1 import router_v1
from app.routers.v2 import router_v2

app = FastAPI()
app.include_router(router_v1)    # /api/v1/*
app.include_router(router_v2)    # /api/v2/*

# To deprecate v1: just remove the line above
# To add v3: create routers/v3/ and include it`,
              language: 'python',
            },
            {
              title: 'Deprecating Endpoints Gracefully',
              description: 'Mark endpoints as deprecated and guide users to the new version',
              code: `from fastapi import FastAPI

app = FastAPI()

@app.get(
    "/api/v1/users/{user_id}",
    deprecated=True,  # Shows strikethrough in Swagger UI
    summary="[DEPRECATED] Get user by ID",
    description="""
    **⚠️ DEPRECATED** — This endpoint will be removed on 2025-06-01.

    Use \`GET /api/v2/users/{user_id}\` instead.

    Migration guide:
    - Field \`name\` is now split into \`first_name\` and \`last_name\`
    - New field \`created_at\` is included in the response
    """,
    response_model=UserResponseV1,
)
def get_user_v1(user_id: int, db: Session = Depends(get_db)):
    # Still works, but clients should migrate
    user = get_user_from_db(db, user_id)
    return UserResponseV1(id=user.id, name=f"{user.first_name} {user.last_name}", email=user.email)

@app.get("/api/v2/users/{user_id}", response_model=UserResponseV2)
def get_user_v2(user_id: int, db: Session = Depends(get_db)):
    # The new, recommended endpoint
    return get_user_from_db(db, user_id)`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'comparison',
            title: 'Versioning Strategies Compared',
            description: 'Pros and cons of each API versioning approach',
            columns: [
              {
                title: 'URL Versioning',
                items: ['/api/v1/users', 'Explicit & visible', 'Easy to cache (CDN-friendly)', 'Easy to test (just a URL)', 'More route definitions', 'Best for: Public APIs'],
              },
              {
                title: 'Header Versioning',
                items: ['API-Version: v2 header', 'Clean URLs', 'Less visible to users', 'Harder to cache/test', 'Flexible routing', 'Best for: Internal APIs'],
              },
              {
                title: 'Router-Based',
                items: ['Separate router per version', 'Clean code separation', 'Easy to deprecate', 'Easy to add new versions', 'More files to maintain', 'Best for: Large projects'],
              },
            ],
          },
          tips: [
            'Use deprecated=True on route decorators — Swagger UI shows deprecated endpoints with visual warnings.',
            'Log which API version each request uses — this data tells you when it\'s safe to remove old versions.',
            'Keep deprecation periods long (6+ months) and communicate timelines clearly in your API documentation.',
          ],
          keyTakeaway:
            'Router-based versioning gives the cleanest code separation — each version is an isolated module that can be independently maintained and deprecated.',
        },
      ],
    },
  ],
};
