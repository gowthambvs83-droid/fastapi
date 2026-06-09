export interface Topic {
  id: string;
  title: string;
  content: string;
  code?: string;
  output?: string;
  tips?: string[];
}

export interface Module {
  id: string;
  title: string;
  icon: string;
  description: string;
  topics: Topic[];
}

export interface Project {
  id: string;
  title: string;
  type: "mini" | "major";
  icon: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  features: string[];
  content: string;
  code: string;
}

export const modules: Module[] = [
  {
    id: "foundation",
    title: "FastAPI Foundation",
    icon: "🚀",
    description: "Learn the basics — from installation to building your first API endpoints with path operations, parameters, and response models.",
    topics: [
      {
        id: "what-is-fastapi",
        title: "What is FastAPI?",
        content: `FastAPI is a modern, high-performance web framework for building APIs with Python 3.8+, based on standard Python type hints. It was created by Sebastián Ramírez and has rapidly become one of the most popular Python web frameworks.

**Why FastAPI?**
- **Fast**: One of the fastest Python frameworks, rivaling NodeJS and Go
- **Fast to code**: Development speed is significantly increased
- **Fewer bugs**: Type hints reduce human-induced errors by ~40%
- **Intuitive**: Great editor support with autocompletion everywhere
- **Easy**: Designed to be easy to use and learn
- **Short**: Minimize code duplication with multiple features from each parameter declaration
- **Robust**: Get production-ready code with automatic interactive documentation
- **Standards-based**: Based on open standards for APIs — OpenAPI and JSON Schema

FastAPI is built on top of **Starlette** (for the web layer) and **Pydantic** (for data validation). This means you get the best of both worlds: the raw speed of an ASGI framework and the safety of rigorous type checking.

Companies like **Microsoft, Uber, Netflix**, and thousands more use FastAPI in production.`,
        code: `# FastAPI performance comparison
# Framework          | Requests/sec
# FastAPI            | ~32,000
# Flask              | ~5,000
# Django             | ~3,000
# Express (Node)     | ~35,000

# Install FastAPI
pip install fastapi uvicorn[standard]`,
        tips: ["FastAPI is asynchronous by default but supports synchronous code too", "It's NOT named after 'fast' performance — it's about fast development speed", "FastAPI requires Python 3.8+ because of type hint features"]
      },
      {
        id: "first-api",
        title: "Your First API",
        content: `Let's build your first FastAPI application. This is the classic hello world example, but we'll also add a structured JSON response to show you how FastAPI handles serialization automatically.

Save this code in a file called \`main.py\`. The \`app\` object is the main entry point for your FastAPI application, and every path operation you define will be registered with this object.

The \`@app.get("/")\` decorator tells FastAPI that the function below should handle GET requests to the "/" path. FastAPI automatically converts the return value to JSON and sets the appropriate content-type header.

The \`--reload\` flag enables auto-reloading during development, so your server restarts automatically whenever you modify your code.`,
        code: `# main.py
from fastapi import FastAPI

app = FastAPI(title="My First API", version="1.0.0")

@app.get("/")
async def root():
    return {"message": "Welcome to FastAPI!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

@app.get("/items/{item_id}")
async def read_item(item_id: int):
    return {"item_id": item_id, "name": f"Item {item_id}"}`,
        output: `# Run the server
uvicorn main:app --reload

# Test in browser or curl:
# GET http://127.0.0.1:8000/
# {"message": "Welcome to FastAPI!"}

# GET http://127.0.0.1:8000/health
# {"status": "healthy", "version": "1.0.0"}

# GET http://127.0.0.1:8000/items/42
# {"item_id": 42, "name": "Item 42"}`,
        tips: ["Visit http://127.0.0.1:8000/docs for interactive Swagger UI", "Visit http://127.0.0.1:8000/redoc for ReDoc documentation", "The --reload flag should only be used in development, never in production"]
      },
      {
        id: "path-operations",
        title: "Path Operations: GET, POST, PUT, DELETE",
        content: `Path operations are the core building blocks of any REST API. FastAPI provides decorators for all standard HTTP methods. Each decorator maps a URL path and HTTP method to a Python function.

**HTTP Methods:**
- **GET** — Read/retrieve data (never modifies data)
- **POST** — Create new resources
- **PUT** — Update entire resource (replace)
- **PATCH** — Partial update of a resource
- **DELETE** — Remove a resource

FastAPI automatically converts the return value to JSON and validates both incoming requests and outgoing responses based on the type hints you provide.`,
        code: `from fastapi import FastAPI, HTTPException
from typing import Optional

app = FastAPI()

# In-memory database
items_db = {}

@app.post("/items/{item_id}", status_code=201)
async def create_item(item_id: int, name: str, price: float):
    if item_id in items_db:
        raise HTTPException(status_code=400, detail="Item already exists")
    items_db[item_id] = {"id": item_id, "name": name, "price": price}
    return items_db[item_id]

@app.get("/items/{item_id}")
async def read_item(item_id: int):
    if item_id not in items_db:
        raise HTTPException(status_code=404, detail="Item not found")
    return items_db[item_id]

@app.put("/items/{item_id}")
async def update_item(item_id: int, name: Optional[str] = None,
                      price: Optional[float] = None):
    if item_id not in items_db:
        raise HTTPException(status_code=404, detail="Item not found")
    if name is not None:
        items_db[item_id]["name"] = name
    if price is not None:
        items_db[item_id]["price"] = price
    return items_db[item_id]

@app.delete("/items/{item_id}")
async def delete_item(item_id: int):
    if item_id not in items_db:
        raise HTTPException(status_code=404, detail="Item not found")
    deleted = items_db.pop(item_id)
    return {"deleted": deleted}`,
        tips: ["Always return appropriate HTTP status codes (201 for created, 404 for not found)", "Use HTTPException for error responses — FastAPI handles the rest", "status_code parameter on the decorator sets the default success status code"]
      },
      {
        id: "path-query-params",
        title: "Path Parameters & Query Parameters",
        content: `**Path parameters** are part of the URL path itself (e.g., \`/users/42\`), while **query parameters** are appended after a question mark (e.g., \`/users?limit=10&offset=0\`).

FastAPI uses Python type hints to automatically parse, validate, and convert both types. You can also add validation constraints like minimum/maximum values, regex patterns, and string length constraints.

The \`Query\` and \`Path\` functions from FastAPI let you add validation, default values, descriptions, and examples that show up in the auto-generated documentation.`,
        code: `from fastapi import FastAPI, Query, Path

app = FastAPI()

@app.get("/users/{user_id}")
async def get_user(
    user_id: int = Path(..., gt=0, description="User ID must be positive"),
    detail: bool = Query(False, description="Include detailed user info"),
    role: str = Query(None, enum=["admin", "user", "moderator"]),
    limit: int = Query(10, ge=1, le=100, description="Max results"),
    offset: int = Query(0, ge=0),
):
    return {
        "user_id": user_id,
        "detail": detail,
        "role": role,
        "pagination": {"limit": limit, "offset": offset}
    }

# Test: GET /users/5?detail=true&role=admin&limit=20
# Response: {"user_id": 5, "detail": true, "role": "admin",
#            "pagination": {"limit": 20, "offset": 0}}`,
        tips: ["... (Ellipsis) means the parameter is required", "Query parameters with default values are optional", "Path parameters are always required because they're part of the URL"]
      },
      {
        id: "request-body",
        title: "Request Body & Response Model",
        content: `The request body is the data sent by the client to your API, typically as JSON. FastAPI uses Pydantic models to define the shape of request bodies and response payloads.

When you declare a Pydantic model as a parameter, FastAPI will:
1. Read the request body as JSON
2. Convert types automatically
3. Validate the data against your model
4. Return a 422 error if validation fails

The \`response_model\` parameter controls what data is included in the response, allowing you to filter out sensitive fields like passwords without creating separate models.`,
        code: `from fastapi import FastAPI
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

app = FastAPI()

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    created_at: datetime
    is_active: bool = True

@app.post("/users", response_model=UserResponse, status_code=201)
async def create_user(user: UserCreate):
    # Password is NOT in the response model, so it's filtered out!
    return {
        "id": 1,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "created_at": datetime.now(),
        "is_active": True
    }`,
        tips: ["response_model filters the response — perfect for removing passwords", "Field() provides validation constraints and documentation", "Optional[str] = None makes a field optional with None as default"]
      }
    ]
  },
  {
    id: "pydantic",
    title: "Pydantic & Data Validation",
    icon: "🛡️",
    description: "Master Pydantic V2 — the data validation engine powering FastAPI. Learn models, validators, nested schemas, and serialization.",
    topics: [
      {
        id: "pydantic-basics",
        title: "Pydantic V2 Basics",
        content: `Pydantic is the data validation engine that powers FastAPI. Version 2 of Pydantic is a complete rewrite in Rust that delivers **5-50x performance improvements** over V1 while maintaining a familiar API.

Every BaseModel subclass becomes a data validator, serializer, and documentation generator all at once. When FastAPI receives a request, it passes the raw data through your Pydantic models, which validate types, apply constraints, and transform data.

**Key V1 → V2 changes:**
- \`.parse_obj()\` → \`model_validate()\`
- \`.dict()\` → \`model_dump()\`
- \`@validator\` → \`@field_validator\`
- New \`model_config\` replaces \`class Config\``,
        code: `from pydantic import BaseModel, Field, ConfigDict
from typing import Optional

class Product(BaseModel):
    model_config = ConfigDict(
        str_strip_whitespace=True,
        str_min_length=1,
        json_schema_extra={
            "examples": [{"name": "Laptop", "price": 999.99}]
        }
    )

    name: str = Field(..., min_length=1, max_length=200)
    price: float = Field(..., gt=0)
    description: Optional[str] = None
    tags: list[str] = []

# Validate and auto-transform data
product = Product(name="  Wireless Mouse  ", price=29.99,
                  tags=["electronics"])
print(product.name)          # "Wireless Mouse" (stripped!)
print(product.model_dump())  # Full dict output
print(product.model_dump_json())  # JSON string`,
        tips: ["Pydantic V2 core is written in Rust — blazingly fast", "str_strip_whitespace auto-trims all string fields", "model_dump() replaces the old .dict() method"]
      },
      {
        id: "field-validation",
        title: "Field Validation & Constraints",
        content: `The \`Field\` function provides fine-grained control over validation rules. Fields marked with \`...\` as the first argument are required, while fields with a default value are optional.

You can constrain numbers with \`gt\`, \`ge\`, \`lt\`, \`le\`, strings with \`min_length\`/\`max_length\`/\`pattern\`, and much more. Each constraint generates a clear error message automatically and appears in the OpenAPI schema.`,
        code: `from pydantic import BaseModel, Field
from datetime import datetime, date
from decimal import Decimal

class Order(BaseModel):
    order_id: int = Field(..., gt=0, description="Must be positive")
    customer_name: str = Field(..., min_length=2, max_length=100)
    total_amount: Decimal = Field(..., gt=0, decimal_places=2)
    order_date: date
    items_count: int = Field(..., ge=1, le=1000)
    notes: str = Field(default="", max_length=500)
    created_at: datetime = Field(default_factory=datetime.now)

# This raises ValidationError with detailed errors
try:
    Order(order_id=-1, customer_name="A",
          total_amount=-10, order_date="invalid", items_count=0)
except Exception as e:
    print(e.error_count())  # 5 validation errors!`,
        tips: ["Use default_factory for mutable defaults like lists and dicts", "Field description appears in the Swagger UI documentation", "Decimal is preferred over float for monetary values"]
      },
      {
        id: "custom-validators",
        title: "Custom Validators",
        content: `Custom validation logic goes beyond simple type checking. Pydantic V2 provides two main decorators:

- **@field_validator** — validates individual fields
- **@model_validator** — cross-field validation (depends on multiple fields)

Both support different modes: \`'before'\` (runs before built-in validation), \`'after'\` (runs after), and \`'wrap'\` (wraps around).`,
        code: `from pydantic import BaseModel, field_validator, model_validator
import re

class UserRegistration(BaseModel):
    username: str
    password: str
    confirm_password: str
    age: int

    @field_validator('username')
    @classmethod
    def username_alphanumeric(cls, v):
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('Username must be alphanumeric')
        if len(v) < 3:
            raise ValueError('Username must be at least 3 characters')
        return v

    @field_validator('password')
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Must be at least 8 characters')
        if not any(c.isupper() for c in v):
            raise ValueError('Must contain uppercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Must contain a digit')
        return v

    @model_validator(mode='after')
    def passwords_match(self):
        if self.password != self.confirm_password:
            raise ValueError('Passwords do not match')
        return self`,
        tips: ["field_validator runs for a single field", "model_validator runs after all field validations pass", "Use mode='before' to transform data before type validation"]
      },
      {
        id: "nested-models",
        title: "Nested Models & Complex Types",
        content: `Real-world data is rarely flat. Pydantic supports deeply nested models, allowing you to model complex hierarchical data structures. You can compose models by embedding one BaseModel inside another, create lists of models, use Optional for nullable fields, and leverage Python's typing module for unions, literals, and forward references.`,
        code: `from pydantic import BaseModel
from typing import Optional, Literal

class Address(BaseModel):
    street: str
    city: str
    state: str
    zip_code: str
    country: str = "US"

class Company(BaseModel):
    name: str
    industry: Literal["tech", "finance", "healthcare", "other"]
    address: Address
    website: Optional[str] = None

class Employee(BaseModel):
    name: str
    email: str
    role: Literal["engineer", "manager", "designer", "executive"]
    company: Company
    manager: Optional["Employee"] = None  # Forward reference!

# Create deeply nested instance
emp = Employee(
    name="Jane Doe", email="jane@example.com", role="engineer",
    company=Company(
        name="TechCorp", industry="tech",
        address=Address(street="123 Main", city="SF",
                       state="CA", zip_code="94102")
    )
)
print(emp.company.address.city)  # 'SF'`,
        tips: ["Forward references (string type hints) allow self-referencing models", "Literal types restrict values to a specific set — great for enums", "FastAPI generates OpenAPI schemas for the entire nested hierarchy"]
      },
      {
        id: "serialization",
        title: "Serialization & Configuration",
        content: `Serialization converts Pydantic models to dictionaries, JSON, or other formats. Pydantic V2 provides powerful filtering options: exclude specific fields, include only certain fields, exclude unset fields, and exclude defaults.

The \`model_config\` attribute controls behavior globally — forbidding extra fields, allowing arbitrary types, enforcing strict mode, and more.`,
        code: `from pydantic import BaseModel, ConfigDict
from typing import Optional

class SecureUser(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    id: int
    username: str
    password_hash: str
    api_key: Optional[str] = None
    is_admin: bool = False

user = SecureUser(id=1, username="admin",
                  password_hash="abc123", is_admin=True)

# Exclude sensitive fields
safe = user.model_dump(exclude={"password_hash", "api_key"})
print(safe)  # {'id': 1, 'username': 'admin', 'is_admin': True}

# Export to JSON
json_str = user.model_dump_json(exclude={"password_hash"})

# Only include specific fields
minimal = user.model_dump(include={"id", "username"})`,
        tips: ["extra='forbid' rejects unknown fields — great for strict APIs", "exclude_unset=True only includes fields the user explicitly provided", "model_dump_json() is faster than json.dumps(model_dump())"]
      }
    ]
  },
  {
    id: "routing",
    title: "Advanced Routing & API Design",
    icon: "🔀",
    description: "Organize your APIs with routers, dependency injection, middleware, CORS, and background tasks.",
    topics: [
      {
        id: "api-router",
        title: "APIRouter & Modular Routing",
        content: `As your application grows, putting all routes in one file becomes unmanageable. FastAPI provides \`APIRouter\` to organize routes into separate modules, each with its own prefix and tags.

This pattern mirrors the Blueprint concept in Flask. APIRouter allows you to split your application into logical groups like users, products, and orders, each in its own file.`,
        code: `# routers/users.py
from fastapi import APIRouter

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/")
async def list_users():
    return [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]

@router.get("/{user_id}")
async def get_user(user_id: int):
    return {"id": user_id, "name": f"User{user_id}"}

# ─────────────────────────
# main.py
from fastapi import FastAPI
from routers.users import router as users_router
from routers.products import router as products_router

app = FastAPI()
app.include_router(users_router)
app.include_router(products_router)`,
        tips: ["Each router gets its own prefix — keeps URLs organized", "Tags group endpoints in the Swagger UI documentation", "Routers can have their own dependencies that apply to all their routes"]
      },
      {
        id: "dependency-injection",
        title: "Dependency Injection System",
        content: `FastAPI's dependency injection system is one of its most powerful features. It allows you to declare dependencies that FastAPI resolves before your path operation runs. Dependencies can fetch database connections, verify authentication, extract common parameters, and more.

Dependencies can themselves have dependencies, creating a clean composable architecture. Dependencies that yield values enable proper resource cleanup (like closing database connections).`,
        code: `from fastapi import FastAPI, Depends, HTTPException, Query
from typing import Optional

def common_parameters(
    q: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
):
    return {"q": q, "skip": skip, "limit": limit}

def get_db():
    db = DatabaseConnection()
    try:
        yield db
    finally:
        db.close()

def require_admin(token: str = Header(...)):
    if not verify_admin_token(token):
        raise HTTPException(status_code=403)
    return {"role": "admin"}

@app.get("/items")
async def list_items(params: dict = Depends(common_parameters)):
    return params

@app.delete("/items/{item_id}")
async def delete_item(item_id: int,
                      admin=Depends(require_admin),
                      db=Depends(get_db)):
    db.delete_item(item_id)
    return {"deleted": item_id}`,
        tips: ["Dependencies are resolved recursively — dependencies can have dependencies", "Use yield for cleanup logic (closing DB connections, releasing locks)", "Depends() creates a new instance each request — perfect for request-scoped resources"]
      },
      {
        id: "middleware",
        title: "Middleware & CORS",
        content: `Middleware runs before and after every request, implementing cross-cutting concerns like logging, timing, and CORS. CORS (Cross-Origin Resource Sharing) is essential when your frontend and backend are on different domains.

FastAPI's CORSMiddleware handles the complexity of CORS headers, preflight requests, and origin validation for you.`,
        code: `import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://myfrontend.com"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
    max_age=3600,
)

# Custom timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response`,
        tips: ["Never use allow_origins=['*'] with allow_credentials=True in production", "Middleware runs in order — first added = outermost layer", "CORS is a browser security feature, not a server restriction"]
      },
      {
        id: "background-tasks",
        title: "Background Tasks",
        content: `Background tasks run after returning a response to the client. Perfect for operations that don't need to block the response, like sending emails, logging analytics, or processing files.

For more complex background processing requiring persistence, retries, or scheduling, use a task queue like **Celery** with Redis or RabbitMQ.`,
        code: `from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel, EmailStr

app = FastAPI()

class UserSignup(BaseModel):
    email: EmailStr
    username: str

def send_welcome_email(email: str, username: str):
    print(f"Sending welcome email to {email}")

def log_signup(username: str):
    print(f"Logging signup for {username}")

@app.post("/signup")
async def signup(user: UserSignup, bg: BackgroundTasks):
    bg.add_task(send_welcome_email, user.email, user.username)
    bg.add_task(log_signup, user.username)
    return {"message": f"User {user.username} created!"}`,
        tips: ["BackgroundTasks is simple but doesn't survive server restarts", "For production: use Celery + Redis for persistent task queues", "Tasks run after the response is sent — client doesn't wait"]
      }
    ]
  },
  {
    id: "database",
    title: "Database Integration",
    icon: "🗄️",
    description: "Connect FastAPI to databases with SQLAlchemy, perform CRUD operations, run migrations with Alembic, and add Redis caching.",
    topics: [
      {
        id: "sqlalchemy-setup",
        title: "SQLAlchemy with FastAPI",
        content: `SQLAlchemy is the most popular ORM for Python. We use the ORM layer with declarative mapping. The recommended pattern is to create a database session as a FastAPI dependency, so each request gets its own session that's automatically closed after the response.`,
        code: `# database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

SQLALCHEMY_DATABASE_URL = "sqlite:///./app.db"
# PostgreSQL: "postgresql://user:password@localhost/dbname"

engine = create_engine(SQLALCHEMY_DATABASE_URL,
                       connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# models.py
from sqlalchemy import Column, Integer, String, Float, Boolean
from database import Base

class DBItem(Base):
    __tablename__ = "items"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    price = Column(Float, nullable=False)
    description = Column(String(1000))
    is_available = Column(Boolean, default=True)`,
        tips: ["get_db() uses yield for proper cleanup — session closes after request", "connect_args is SQLite-specific — remove it for PostgreSQL", "Always use index=True on frequently queried columns"]
      },
      {
        id: "crud-operations",
        title: "CRUD Operations",
        content: `CRUD (Create, Read, Update, Delete) operations form the backbone of most APIs. The key pattern is using separate Pydantic schemas for creation, updating, and reading, while SQLAlchemy models handle database interaction.`,
        code: `from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional, List

app = FastAPI()

class ItemCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    price: float = Field(..., gt=0)
    description: Optional[str] = None

class ItemUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    description: Optional[str] = None

class ItemResponse(BaseModel):
    id: int
    name: str
    price: float
    description: Optional[str]
    is_available: bool

@app.post("/items", response_model=ItemResponse, status_code=201)
def create_item(item: ItemCreate, db: Session = Depends(get_db)):
    db_item = DBItem(**item.model_dump())
    db.add(db_item); db.commit(); db.refresh(db_item)
    return db_item

@app.get("/items", response_model=List[ItemResponse])
def list_items(skip: int = 0, limit: int = 100, db=Depends(get_db)):
    return db.query(DBItem).offset(skip).limit(limit).all()

@app.put("/items/{item_id}", response_model=ItemResponse)
def update_item(item_id: int, item: ItemUpdate, db=Depends(get_db)):
    db_item = db.query(DBItem).filter(DBItem.id == item_id).first()
    if not db_item: raise HTTPException(status_code=404)
    for k, v in item.model_dump(exclude_unset=True).items():
        setattr(db_item, k, v)
    db.commit(); db.refresh(db_item)
    return db_item

@app.delete("/items/{item_id}")
def delete_item(item_id: int, db=Depends(get_db)):
    db_item = db.query(DBItem).filter(DBItem.id == item_id).first()
    if not db_item: raise HTTPException(status_code=404)
    db.delete(db_item); db.commit()
    return {"detail": "Deleted"}`,
        tips: ["exclude_unset=True in update — only updates fields the user actually sent", "Separate Create/Update/Response schemas = cleaner API contract", "Always use response_model to control what's returned"]
      },
      {
        id: "alembic-migrations",
        title: "Alembic Migrations",
        content: `Alembic is the database migration tool for SQLAlchemy. It tracks schema changes as migration scripts, allowing you to evolve your database in a controlled, repeatable manner across environments.`,
        code: `# Setup
pip install alembic
alembic init alembic

# In alembic/env.py:
# from database import Base
# target_metadata = Base.metadata

# Auto-generate migration from model changes
alembic revision --autogenerate -m "Add items table"

# Apply all migrations
alembic upgrade head

# Rollback one step
alembic downgrade -1

# Check current version
alembic current

# View migration history
alembic history`,
        tips: ["Always review auto-generated migrations before applying", "Never edit applied migrations — create a new one instead", "Use descriptive migration messages: 'Add user email column'"]
      },
      {
        id: "redis-caching",
        title: "Redis Caching",
        content: `Redis is an in-memory data store that excels as a caching layer. By caching frequently accessed data, you reduce database load and dramatically improve response times — from hundreds of milliseconds to single-digit milliseconds.`,
        code: `import redis, json
from fastapi import FastAPI, Depends, HTTPException

redis_client = redis.Redis(host="localhost", port=6379,
                           db=0, decode_responses=True)
app = FastAPI()

@app.get("/products/{product_id}")
async def get_product(product_id: int, db=Depends(get_db)):
    # Check cache first
    cache_key = f"product:{product_id}"
    cached = redis_client.get(cache_key)
    if cached:
        return {**json.loads(cached), "cached": True}

    # Cache miss — query database
    product = db.query(DBItem).filter(DBItem.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404)

    result = {"id": product.id, "name": product.name,
              "price": product.price}
    # Cache for 60 seconds
    redis_client.setex(cache_key, 60, json.dumps(result))
    return {**result, "cached": False}`,
        tips: ["Always set TTL (expiration) on cache entries to prevent stale data", "Invalidate cache when data changes (create/update/delete)", "Use different TTLs for different data types — lists change more often"]
      }
    ]
  },
  {
    id: "auth",
    title: "Authentication & Security",
    icon: "🔐",
    description: "Implement JWT authentication, OAuth2 flows, role-based access control, rate limiting, and security headers.",
    topics: [
      {
        id: "jwt-auth",
        title: "JWT Authentication",
        content: `JSON Web Tokens (JWT) are the standard mechanism for stateless authentication. A JWT contains claims (user ID, role, expiration) encoded as a signed JSON object. The server verifies authenticity without storing session state.

The typical flow: client sends credentials → server validates → returns JWT → client includes JWT in Authorization header for subsequent requests.`,
        code: `from datetime import datetime, timedelta
import jwt
from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer

SECRET_KEY = "your-secret-key-keep-it-safe"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
app = FastAPI()

def create_access_token(data: dict, expires_delta=None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401)
        return {"username": username}
    except jwt.PyJWTError:
        raise HTTPException(status_code=401)

@app.post("/token")
async def login(username: str, password: str):
    user = authenticate_user(username, password)
    if not user:
        raise HTTPException(status_code=401)
    token = create_access_token(data={"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}

@app.get("/users/me")
async def read_users_me(current_user=Depends(get_current_user)):
    return current_user`,
        tips: ["Never hardcode SECRET_KEY — use environment variables", "Set reasonable expiration times — shorter is more secure", "Use bcrypt or argon2 for password hashing — never store plain text"]
      },
      {
        id: "oauth2-flow",
        title: "OAuth2 Password Flow",
        content: `FastAPI provides built-in support for OAuth2 password bearer flow. The \`OAuth2PasswordBearer\` class extracts tokens from the Authorization header, and \`OAuth2PasswordRequestForm\` parses standard OAuth2 login form data.

Together, they enable the interactive "Authorize" button in Swagger UI for testing authenticated endpoints.`,
        code: `from fastapi import FastAPI, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

app = FastAPI()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid credentials")
    token = create_access_token(data={"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}

@app.get("/protected")
async def protected_route(token: str = Depends(oauth2_scheme)):
    user = verify_token(token)
    return {"message": f"Hello {user.username}!"}`,
        tips: ["OAuth2PasswordRequestForm uses form data, not JSON", "The Authorize button in /docs uses this flow automatically", "tokenUrl must match your login endpoint path"]
      },
      {
        id: "rbac",
        title: "Role-Based Access Control",
        content: `RBAC restricts API access based on user roles. Create dependency functions that check the user's role from the JWT token. This composable pattern scales well because each endpoint declares its requirements through dependency injection.`,
        code: `from fastapi import Depends, HTTPException, status

def require_role(*roles: str):
    def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user.get("role") not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires one of: {', '.join(roles)}"
            )
        return current_user
    return role_checker

@app.get("/admin/dashboard")
async def admin_dashboard(admin=Depends(require_role("admin"))):
    return {"message": "Admin dashboard"}

@app.get("/moderator/reports")
async def reports(mod=Depends(require_role("admin", "moderator"))):
    return {"message": "Reports"}`,
        tips: ["require_role() returns a function — it's a dependency factory", "Compose with get_current_user — authentication + authorization in one", "Add role claims to JWT payload during login"]
      },
      {
        id: "rate-limiting",
        title: "Rate Limiting & Security Headers",
        content: `Rate limiting protects your API from abuse. The slowapi library provides simple rate limiting for FastAPI. Security headers instruct browsers to enforce policies like XSS protection and clickjacking prevention.`,
        code: `from fastapi import FastAPI, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app = FastAPI()

@app.get("/api/data")
@limiter.limit("10/minute")
async def get_data(request: Request):
    return {"data": "sensitive information"}

@app.post("/login")
@limiter.limit("5/minute")  # Stricter for login
async def login(request: Request):
    return {"token": "..."}

# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = \
        "max-age=31536000; includeSubDomains"
    return response`,
        tips: ["Apply stricter limits on authentication endpoints", "Security headers should be on every production API", "Use Nginx rate limiting as a first line of defense"]
      }
    ]
  },
  {
    id: "testing",
    title: "Testing & Documentation",
    icon: "🧪",
    description: "Write tests with pytest, integration tests with database fixtures, and leverage auto-generated API documentation.",
    topics: [
      {
        id: "unit-testing",
        title: "Unit Testing with pytest",
        content: `FastAPI provides the \`TestClient\` class which allows you to make requests to your application without actually starting a server. Tests are fast, deterministic, and use the familiar requests library interface.`,
        code: `# test_main.py
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to FastAPI!"}

def test_create_item():
    response = client.post("/items/1?name=Widget&price=9.99")
    assert response.status_code == 200
    assert response.json()["name"] == "Widget"

def test_read_nonexistent_item():
    response = client.get("/items/999")
    assert response.status_code == 404

def test_validation_error():
    response = client.post("/users", json={
        "username": "ab", "email": "invalid", "password": "short"
    })
    assert response.status_code == 422

# Run: pytest test_main.py -v`,
        tips: ["TestClient doesn't start a real server — tests are instant", "Always test both success and error cases", "422 = validation error, check the detail field for specifics"]
      },
      {
        id: "integration-testing",
        title: "Integration Testing",
        content: `Integration tests verify that multiple components work together correctly. For database tests, use a separate test database and clean it between tests using pytest fixtures. The \`dependency_overrides\` pattern replaces real dependencies with test versions.`,
        code: `import pytest
from fastapi.testclient import TestClient

@pytest.fixture
def client(db_session):
    def override_get_db():
        try: yield db_session
        finally: db_session.close()
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()

def test_full_crud_flow(client):
    # Create
    resp = client.post("/items", json={"name": "Test", "price": 10.0})
    assert resp.status_code == 201
    item_id = resp.json()["id"]
    # Read
    resp = client.get(f"/items/{item_id}")
    assert resp.json()["name"] == "Test"
    # Update
    resp = client.put(f"/items/{item_id}", json={"name": "Updated"})
    assert resp.json()["name"] == "Updated"
    # Delete
    resp = client.delete(f"/items/{item_id}")
    assert resp.status_code == 200`,
        tips: ["dependency_overrides replaces real deps with test versions", "Always clean up the test database between tests", "Test the full lifecycle: create → read → update → delete"]
      },
      {
        id: "api-documentation",
        title: "Auto-Generated API Documentation",
        content: `FastAPI generates a complete OpenAPI 3.0 specification from your code. This powers two interactive documentation interfaces: **Swagger UI** at \`/docs\` and **ReDoc** at \`/redoc\`. Customize both with branding, descriptions, and examples.`,
        code: `from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(
    title="E-Commerce API",
    description="## Full-featured API\\nManage products, orders, users.",
    version="2.0.0",
    contact={"name": "API Support", "email": "support@example.com"},
    docs_url="/docs",
    redoc_url="/redoc",
)

class Product(BaseModel):
    name: str = Field(..., description="Product name",
                      examples=["Wireless Mouse"])
    price: float = Field(..., gt=0, description="Price in USD",
                         examples=[29.99])`,
        tips: ["Swagger UI has a 'Try it out' button for live testing", "Field descriptions and examples appear in the docs", "Customize docs_url and redoc_url or set to None to disable"]
      }
    ]
  },
  {
    id: "deployment",
    title: "Deployment & Production",
    icon: "🚢",
    description: "Project structure, environment config, Docker, error handling, WebSocket, logging — everything for production.",
    topics: [
      {
        id: "project-structure",
        title: "Production Project Structure",
        content: `A well-organized project structure is crucial for maintainability. This structure separates concerns into distinct modules with a clear dependency flow: routers → services → models/schemas.`,
        code: `project/
├── app/
│   ├── main.py              # FastAPI application
│   ├── core/
│   │   ├── config.py        # Settings (pydantic-settings)
│   │   ├── security.py      # JWT, password hashing
│   │   └── deps.py          # Shared dependencies
│   ├── models/              # SQLAlchemy models
│   │   ├── user.py
│   │   └── item.py
│   ├── schemas/             # Pydantic schemas
│   │   ├── user.py
│   │   └── item.py
│   ├── routers/             # API route handlers
│   │   ├── auth.py
│   │   ├── users.py
│   │   └── items.py
│   ├── services/            # Business logic
│   │   ├── user_service.py
│   │   └── item_service.py
│   └── database.py          # DB connection
├── alembic/                 # Database migrations
├── tests/
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── .env`,
        tips: ["routers handle HTTP, services handle business logic", "Never import routers in services — dependency flow is one-way", "Each module has a single responsibility"]
      },
      {
        id: "env-config",
        title: "Environment Configuration",
        content: `The pydantic-settings package manages configuration through environment variables and .env files with type-safe validation. Sensitive values should never be committed to source control.`,
        code: `# app/core/config.py
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    APP_NAME: str = "FastAPI App"
    DEBUG: bool = False
    DATABASE_URL: str = Field(..., description="DB connection string")
    SECRET_KEY: str = Field(..., description="JWT secret key")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REDIS_URL: str = "redis://localhost:6379"
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    model_config = {"env_file": ".env"}

settings = Settings()  # Reads from environment / .env

# Usage:
# from app.core.config import settings
# app = FastAPI(title=settings.APP_NAME)`,
        tips: ["pydantic-settings validates config on startup — fail fast", "Never commit .env to git — add it to .gitignore", "List all required settings in .env.example for new developers"]
      },
      {
        id: "docker",
        title: "Docker & Docker Compose",
        content: `Docker containers ensure consistent environments. Multi-stage builds minimize image size. Docker Compose orchestrates multiple containers (API, database, Redis) with a single command.`,
        code: `# Dockerfile
FROM python:3.11-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /usr/local/lib/python3.11/site-packages \\
     /usr/local/lib/python3.11/site-packages
COPY --from=builder /app /app
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# ──────────────────────
# docker-compose.yml
version: '3.8'
services:
  api:
    build: .
    ports: ["8000:8000"]
    env_file: .env
    depends_on: [db, redis]
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: app_db
      POSTGRES_USER: app_user
      POSTGRES_PASSWORD: secret
    volumes: ["pgdata:/var/lib/postgresql/data"]
  redis:
    image: redis:7-alpine
volumes:
  pgdata:`,
        tips: ["Multi-stage builds can reduce image size by 50%+", "Use .dockerignore to exclude unnecessary files", "Always pin image versions (postgres:15, not postgres:latest)"]
      },
      {
        id: "websocket",
        title: "WebSocket Real-time Communication",
        content: `WebSocket enables full-duplex communication between client and server. Perfect for chat apps, live notifications, real-time dashboards, and collaborative editing. FastAPI's WebSocket support works seamlessly alongside HTTP endpoints.`,
        code: `from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import List

app = FastAPI()

class ConnectionManager:
    def __init__(self):
        self.active: List[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        self.active.remove(ws)

    async def broadcast(self, message: str):
        for conn in self.active:
            await conn.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws/{client_id}")
async def chat(ws: WebSocket, client_id: int):
    await manager.connect(ws)
    try:
        while True:
            data = await ws.receive_text()
            await manager.broadcast(f"Client {client_id}: {data}")
    except WebSocketDisconnect:
        manager.disconnect(ws)
        await manager.broadcast(f"Client {client_id} left")`,
        tips: ["WebSocket is stateful — maintain connection state carefully", "Use Redis pub/sub for multi-instance WebSocket scaling", "Handle disconnections gracefully — clients may reconnect"]
      },
      {
        id: "error-handling",
        title: "Error Handling & Logging",
        content: `Graceful error handling and comprehensive logging are essential for production APIs. Custom exception handlers return structured error responses, while structured JSON logging integrates with monitoring services.`,
        code: `import logging, json, time
from fastapi import FastAPI, Request

app = FastAPI()
logger = logging.getLogger("api")

class AppException(Exception):
    def __init__(self, error: str, detail: str, status: int = 400):
        self.error = error; self.detail = detail; self.status = status

@app.exception_handler(AppException)
async def app_exception_handler(request, exc):
    return JSONResponse(status_code=exc.status,
        content={"error": exc.error, "detail": exc.detail})

@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    logger.info(json.dumps({
        "method": request.method, "path": str(request.url.path),
        "status": response.status_code,
        "duration_ms": round((time.time() - start) * 1000, 2)
    }))
    return response`,
        tips: ["Never expose stack traces to clients in production", "Use structured JSON logging for easy parsing by monitoring tools", "Log request duration to identify slow endpoints"]
      }
    ]
  }
];

export const projects: Project[] = [
  {
    id: "url-shortener",
    title: "URL Shortener API",
    type: "mini",
    icon: "🔗",
    description: "Build a fully functional URL shortener with short code generation, click tracking, and redirect handling.",
    difficulty: "Beginner",
    features: ["Generate short codes", "Redirect to original URLs", "Click tracking & stats", "SQLite database", "Proper HTTP status codes"],
    content: `This project covers the complete CRUD lifecycle, path parameter handling, database operations with SQLAlchemy, response model design, and error handling. The URL shortener also demonstrates the difference between returning JSON data and returning a redirect response.`,
    code: `# url_shortener/main.py
import string, random
from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel, HttpUrl
from sqlalchemy import Column, String, Integer, DateTime
from datetime import datetime

app = FastAPI(title="URL Shortener")

class URL(Base):
    __tablename__ = "urls"
    short_code = Column(String(10), primary_key=True)
    original_url = Column(String(2048), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    clicks = Column(Integer, default=0)

class URLRequest(BaseModel):
    url: HttpUrl

class URLResponse(BaseModel):
    short_code: str
    original_url: str
    short_url: str
    clicks: int

def generate_short_code(length: int = 6) -> str:
    chars = string.ascii_letters + string.digits
    return ''.join(random.choices(chars, k=length))

@app.post("/shorten", response_model=URLResponse, status_code=201)
def create_short_url(request: URLRequest, db: Session = Depends(get_db)):
    code = generate_short_code()
    while db.query(URL).filter(URL.short_code == code).first():
        code = generate_short_code()
    url_obj = URL(short_code=code, original_url=str(request.url))
    db.add(url_obj); db.commit(); db.refresh(url_obj)
    return URLResponse(short_code=code, original_url=str(request.url),
                       short_url=f"http://localhost:8000/{code}", clicks=0)

@app.get("/{short_code}")
def redirect_url(short_code: str, db: Session = Depends(get_db)):
    url_obj = db.query(URL).filter(URL.short_code == short_code).first()
    if not url_obj:
        raise HTTPException(status_code=404, detail="URL not found")
    url_obj.clicks += 1
    db.commit()
    return RedirectResponse(url=url_obj.original_url)

@app.get("/stats/{short_code}", response_model=URLResponse)
def url_stats(short_code: str, db: Session = Depends(get_db)):
    url_obj = db.query(URL).filter(URL.short_code == short_code).first()
    if not url_obj:
        raise HTTPException(status_code=404)
    return URLResponse(short_code=url_obj.short_code,
        original_url=url_obj.original_url,
        short_url=f"http://localhost:8000/{url_obj.short_code}",
        clicks=url_obj.clicks)`
  },
  {
    id: "blog-api",
    title: "Blog API with Authentication",
    type: "mini",
    icon: "📝",
    description: "Build a blog API with user registration, JWT authentication, and full CRUD operations with ownership-based authorization.",
    difficulty: "Intermediate",
    features: ["User registration & login", "JWT token authentication", "Create, read, update, delete posts", "Ownership-based authorization", "OAuth2PasswordRequestForm"],
    content: `This project demonstrates how to combine authentication, database operations, and authorization in a realistic application. Users can create accounts, log in, create and edit their own posts, and read all posts. The API enforces that users can only edit or delete their own posts.`,
    code: `# blog/main.py (key endpoints)
from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm

app = FastAPI(title="Blog API")

@app.post("/auth/register", status_code=201)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username taken")
    hashed_pw = hash_password(user.password)
    db_user = User(username=user.username, email=user.email,
                   hashed_password=hashed_pw)
    db.add(db_user); db.commit()
    return {"message": "User created"}

@app.post("/auth/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends(),
                db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401)
    token = create_access_token({"sub": user.username, "user_id": user.id})
    return {"access_token": token, "token_type": "bearer"}

@app.post("/posts", response_model=PostResponse, status_code=201)
async def create_post(post: PostCreate,
                      current_user: User = Depends(get_current_user),
                      db: Session = Depends(get_db)):
    db_post = Post(title=post.title, content=post.content,
                   author_id=current_user.id)
    db.add(db_post); db.commit(); db.refresh(db_post)
    return db_post

@app.put("/posts/{post_id}", response_model=PostResponse)
async def update_post(post_id: int, post: PostUpdate,
                      current_user: User = Depends(get_current_user),
                      db: Session = Depends(get_db)):
    db_post = db.query(Post).filter(Post.id == post_id).first()
    if not db_post: raise HTTPException(status_code=404)
    if db_post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your post")
    for k, v in post.model_dump(exclude_unset=True).items():
        setattr(db_post, k, v)
    db.commit(); db.refresh(db_post)
    return db_post`
  },
  {
    id: "chat-websocket",
    title: "Real-time Chat with WebSocket",
    type: "mini",
    icon: "💬",
    description: "Build a real-time chat application with multi-room support, broadcasting, and typing indicators using FastAPI's WebSocket.",
    difficulty: "Intermediate",
    features: ["Multi-room chat", "Broadcast messages", "Connection management", "Typing indicators", "Room & user listing"],
    content: `This project teaches WebSocket connection management, broadcasting, and disconnection handling. The chat server supports multiple rooms, private messages, and real-time typing indicators — fundamental patterns for any real-time application.`,
    code: `# chat/main.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import Dict, List
import json

app = FastAPI(title="Real-time Chat")

class ChatRoom:
    def __init__(self, name: str):
        self.name = name
        self.connections: Dict[str, WebSocket] = {}

    async def broadcast(self, message: dict, exclude: str = None):
        for username, ws in self.connections.items():
            if username != exclude:
                await ws.send_json(message)

class ChatManager:
    def __init__(self):
        self.rooms: Dict[str, ChatRoom] = {}

    def get_room(self, name: str) -> ChatRoom:
        if name not in self.rooms:
            self.rooms[name] = ChatRoom(name)
        return self.rooms[name]

manager = ChatManager()

@app.websocket("/ws/{room_name}/{username}")
async def chat(ws: WebSocket, room_name: str, username: str):
    await ws.accept()
    room = manager.get_room(room_name)
    room.connections[username] = ws
    await room.broadcast({"type": "join", "username": username})
    try:
        while True:
            data = json.loads(await ws.receive_text())
            await room.broadcast({
                "type": "message", "username": username,
                "content": data.get("content", "")
            })
    except WebSocketDisconnect:
        del room.connections[username]
        await room.broadcast({"type": "leave", "username": username})

@app.get("/rooms")
async def list_rooms():
    return {"rooms": list(manager.rooms.keys())}`
  },
  {
    id: "ecommerce-api",
    title: "E-Commerce API",
    type: "major",
    icon: "🛒",
    description: "A comprehensive e-commerce API with product catalog, shopping cart, order processing, admin dashboard, and Redis caching.",
    difficulty: "Advanced",
    features: ["Product CRUD with caching", "Shopping cart system", "Order lifecycle management", "JWT auth with RBAC", "Redis caching", "Background task emails", "Docker Compose stack", "Alembic migrations", "Full test suite"],
    content: `This project incorporates every concept from this tutorial into a production-grade application. It includes user management with JWT authentication and role-based access control, a product catalog with search and filtering, a shopping cart system, order processing with status tracking, and an admin dashboard. The architecture uses a clean layered pattern: routers → services → models/schemas.`,
    code: `# ecommerce/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import auth, products, cart, orders, admin

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Full-featured E-Commerce API",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(products.router, prefix="/api/products", tags=["Products"])
app.include_router(cart.router, prefix="/api/cart", tags=["Cart"])
app.include_router(orders.router, prefix="/api/orders", tags=["Orders"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])

# Product service with caching
class ProductService:
    def __init__(self, db: Session):
        self.db = db

    async def list_products(self, skip=0, limit=20, category=None):
        cache_key = f"products:{skip}:{limit}:{category}"
        cached = get_cache(cache_key)
        if cached: return cached
        query = self.db.query(Product)
        if category: query = query.filter(Product.category == category)
        products = query.offset(skip).limit(limit).all()
        result = [ProductResponse.model_validate(p).model_dump() for p in products]
        set_cache(cache_key, result, expire=60)
        return result

# Order service with status tracking
class OrderService:
    async def create_order(self, user_id: int, items: list, bg: BackgroundTasks):
        total = sum(item.price * item.quantity for item in items)
        order = Order(user_id=user_id, total=total, status=OrderStatus.PENDING)
        self.db.add(order); self.db.commit()
        bg.add_task(send_order_confirmation, order.id, user_id)
        return order`
  },
  {
    id: "task-manager",
    title: "Task Management System",
    type: "major",
    icon: "📋",
    description: "A Trello-like task management system with Kanban boards, real-time WebSocket notifications, team collaboration, and file attachments.",
    difficulty: "Advanced",
    features: ["Workspace & project management", "Kanban boards with drag-and-drop", "Real-time WebSocket notifications", "Comment threads with @mentions", "Activity feed & audit log", "File attachments", "Search & filter", "Redis pub/sub for scaling"],
    content: `This project combines everything: FastAPI fundamentals, Pydantic validation, SQLAlchemy, JWT authentication with RBAC, WebSocket for real-time updates, Redis for caching and pub/sub, and Docker for deployment. The system supports workspaces, projects, task boards with columns, and real-time collaboration.`,
    code: `# taskmanager/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, workspaces, projects, tasks, ws_router

app = FastAPI(title="Task Manager API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"],
                   allow_credentials=True, allow_methods=["*"],
                   allow_headers=["*"])

app.include_router(auth.router, prefix="/api/auth")
app.include_router(workspaces.router, prefix="/api/workspaces")
app.include_router(projects.router, prefix="/api/projects")
app.include_router(tasks.router, prefix="/api/tasks")
app.include_router(ws_router.router, prefix="/ws")

# WebSocket manager with Redis pub/sub
class ConnectionManager:
    def __init__(self):
        self.rooms: Dict[int, List[WebSocket]] = {}

    async def connect(self, ws: WebSocket, workspace_id: int):
        await ws.accept()
        self.rooms.setdefault(workspace_id, []).append(ws)

    async def broadcast(self, workspace_id: int, message: dict):
        for ws in self.rooms.get(workspace_id, []):
            await ws.send_json(message)

manager = ConnectionManager()

@ws_router.websocket("/workspace/{workspace_id}")
async def workspace_ws(ws: WebSocket, workspace_id: int, token: str):
    user = await verify_token_ws(token)
    if not user:
        await ws.close(code=4001); return
    await manager.connect(ws, workspace_id)
    try:
        while True:
            data = await ws.receive_json()
            if data.get("type") == "heartbeat":
                await ws.send_json({"type": "heartbeat_ack"})
    except WebSocketDisconnect:
        manager.disconnect(workspace_id, ws)

# After any task change, broadcast:
# await manager.broadcast(workspace_id, {
#     "type": "task_updated", "task_id": task.id,
#     "changes": {"status": "done"}, "updated_by": user.username
# })`
  }
];

export const totalTopics = modules.reduce((acc, m) => acc + m.topics.length, 0) + projects.length;
