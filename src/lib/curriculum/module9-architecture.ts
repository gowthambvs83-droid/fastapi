import { Module } from './types';

export const module9Architecture: Module = {
  id: 'module-9-architecture',
  title: 'Project Configuration & Architecture',
  icon: '🏗️',
  description:
    'Master the art of structuring FastAPI projects for scalability and maintainability. Learn configuration management with pydantic-settings, environment-based setups, multi-app router architecture, and the design patterns that separate production code from prototypes.',
  topics: [
    {
      id: 'm9-project-structure',
      title: 'Production Project Structure',
      icon: '📁',
      introduction:
        'How you organize your FastAPI project determines how quickly you can add features, how easily new team members can contribute, and how painful deployments will be. This topic covers the two dominant architectural patterns — feature-based and layer-based — and shows you why feature-based is the industry standard for production FastAPI applications.',
      sections: [
        {
          heading: 'Feature-Based vs Layer-Based Architecture',
          content: `When building a FastAPI application that grows beyond a handful of endpoints, you face a critical structural decision: organize your code by technical layer (all routers together, all models together, all schemas together) or by feature domain (all user-related code together, all order-related code together). This decision has profound implications for maintainability, team collaboration, and deployment flexibility.

Layer-based architecture groups files by their technical role: a \`routers/\` directory containing all route handlers, a \`models/\` directory with all SQLAlchemy models, a \`schemas/\` directory with all Pydantic models, and a \`services/\` directory with business logic. This pattern works fine for small projects with 5-10 endpoints, but it breaks down rapidly as your application grows. When you need to change the user registration flow, you must open files in four different directories. When you want to remove the orders feature, you must carefully extract order-related code from every directory without breaking anything.

Feature-based architecture groups files by business domain: each feature has its own directory containing its router, models, schemas, services, and tests. Changing the user registration flow means editing files in a single directory. Removing the orders feature means deleting a single directory. Adding a new feature means creating a new directory without touching existing code. This is the pattern used by Django, Next.js, and most production FastAPI applications.

The key insight is that features are the axis of change in production applications. Teams are organized around features, deployments are scoped to features, and bugs are reported against features. Your code structure should reflect this reality, not the technical implementation details.`,
          codeExamples: [
            {
              title: 'Layer-Based Structure (Avoid for Large Projects)',
              description: 'The traditional structure that groups by technical role',
              code: `my_project/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── routers/           # All routes in one directory
│   │   ├── users.py
│   │   ├── products.py
│   │   ├── orders.py
│   │   └── auth.py
│   ├── models/            # All SQLAlchemy models together
│   │   ├── user.py
│   │   ├── product.py
│   │   └── order.py
│   ├── schemas/           # All Pydantic schemas together
│   │   ├── user.py
│   │   ├── product.py
│   │   └── order.py
│   ├── services/          # All business logic together
│   │   ├── user_service.py
│   │   ├── product_service.py
│   │   └── order_service.py
│   └── database.py
├── tests/
└── requirements.txt

# PROBLEM: Changing "users" requires opening 4+ directories
# PROBLEM: Removing a feature means editing many directories`,
              language: 'text',
            },
            {
              title: 'Feature-Based Structure (Recommended)',
              description: 'The modern structure that groups by business domain',
              code: `my_project/
├── app/
│   ├── __init__.py
│   ├── main.py              # Assembles all features
│   ├── core/                # Shared infrastructure
│   │   ├── config.py        # Settings & environment
│   │   ├── database.py      # Engine, session, Base
│   │   ├── security.py      # JWT, password hashing
│   │   └── dependencies.py  # Shared Depends()
│   ├── features/            # Each feature is self-contained
│   │   ├── users/
│   │   │   ├── router.py
│   │   │   ├── models.py
│   │   │   ├── schemas.py
│   │   │   ├── service.py
│   │   │   └── tests.py
│   │   ├── products/
│   │   │   ├── router.py
│   │   │   ├── models.py
│   │   │   ├── schemas.py
│   │   │   └── service.py
│   │   └── orders/
│   │       ├── router.py
│   │       ├── models.py
│   │       ├── schemas.py
│   │       └── service.py
│   └── shared/              # Cross-feature utilities
│       ├── pagination.py
│       └── exceptions.py
├── tests/
├── alembic/
└── requirements.txt`,
              language: 'text',
            },
            {
              title: 'Feature Router Pattern',
              description: 'Each feature exports a configured APIRouter',
              code: `# app/features/users/router.py
from fastapi import APIRouter, Depends, HTTPException
from app.core.database import get_db
from app.core.security import get_current_user
from .schemas import UserCreate, UserRead, UserUpdate
from .service import UserService

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/", response_model=list[UserRead])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List all users with pagination."""
    service = UserService(db)
    return await service.list_users(skip=skip, limit=limit)

@router.post("/", response_model=UserRead, status_code=201)
async def create_user(user_in: UserCreate, db=Depends(get_db)):
    """Create a new user."""
    service = UserService(db)
    return await service.create_user(user_in)

@router.get("/me", response_model=UserRead)
async def get_current_user_info(current_user=Depends(get_current_user)):
    """Get the authenticated user's profile."""
    return current_user

@router.get("/{user_id}", response_model=UserRead)
async def get_user(user_id: int, db=Depends(get_db)):
    """Get a user by ID."""
    service = UserService(db)
    user = await service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user`,
              language: 'python',
            },
            {
              title: 'Main App Assembling All Features',
              description: 'main.py imports and mounts all feature routers',
              code: `# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.features.users.router import router as users_router
from app.features.products.router import router as products_router
from app.features.orders.router import router as orders_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount feature routers
app.include_router(users_router, prefix="/api/v1")
app.include_router(products_router, prefix="/api/v1")
app.include_router(orders_router, prefix="/api/v1")

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "version": settings.VERSION}`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'comparison',
            title: 'Layer-Based vs Feature-Based Architecture',
            description: 'How code organization affects developer experience',
            columns: [
              {
                title: 'Layer-Based (Traditional)',
                items: [
                  'Groups by technical role (routers/, models/)',
                  'Changes span multiple directories',
                  'Feature removal is error-prone',
                  'Merge conflicts in shared files',
                  'Hard to onboard new developers',
                  'Works for small projects only',
                ],
              },
              {
                title: 'Feature-Based (Recommended)',
                items: [
                  'Groups by business domain (users/, orders/)',
                  'Changes isolated to one directory',
                  'Feature removal = delete directory',
                  'Fewer merge conflicts between teams',
                  'Easy to understand feature scope',
                  'Scales to large teams and projects',
                ],
              },
            ],
          },
          tips: [
            'Start with feature-based structure from day one — refactoring from layer-based to feature-based is painful and error-prone.',
            'Keep your core/ directory lean — only put truly shared infrastructure there, not feature-specific logic.',
            'Each feature should be able to function independently. If features have circular dependencies, your structure needs rethinking.',
          ],
          warning: 'Avoid the "shared models" trap — if two features need the same model, either put it in core/ (if truly shared) or have each feature import from the feature that owns the model. Never duplicate models across features.',
          keyTakeaway: 'Feature-based architecture groups code by business domain, not technical layer. This matches how teams work, how features change, and how code is deployed in production.',
          realWorldAnalogy: 'Layer-based architecture is like a hardware store organized by material: all wood in aisle 1, all metal in aisle 2, all plastic in aisle 3. Feature-based architecture is like a hardware store organized by project: the plumbing section has pipes, fittings, and tools together. When you need to fix a leak, you go to one section instead of walking across the entire store.',
          commonMistakes: [
            { mistake: 'Starting with layer-based and planning to refactor later', fix: 'Start with feature-based from the beginning. The "refactor later" approach never happens because the cost grows exponentially with each new endpoint added to the wrong structure.' },
            { mistake: 'Putting everything in core/ or shared/', fix: 'Core should only contain infrastructure that ALL features use (database, config, auth). Feature-specific utilities belong in their feature directory. If only two features use something, it belongs in one of them with the other importing from it.' },
          ],
          interviewQuestions: [
            { question: 'Why is feature-based architecture preferred over layer-based for production applications?', answer: 'Feature-based groups code by business domain, so changes are isolated to a single directory. This reduces merge conflicts, makes feature removal safe, and aligns with how teams are organized. Layer-based requires touching multiple directories for a single feature change.' },
            { question: 'What belongs in the core/ directory of a feature-based FastAPI project?', answer: 'Only truly shared infrastructure: database configuration, settings/config, security utilities (JWT, hashing), and shared dependencies. Feature-specific code should never be in core/.' },
          ],
          proTips: [
            'Use a cookiecutter template to generate new feature directories consistently. Every feature should have the same structure: router.py, models.py, schemas.py, service.py, tests.py.',
            'Add a README.md to each feature directory explaining its purpose, endpoints, and dependencies. Future you will thank present you.',
          ],
        },
        {
          heading: 'The Feature Module Pattern',
          content: `The feature module pattern is the backbone of scalable FastAPI applications. Each feature module is a self-contained unit that encapsulates everything needed for a specific business domain: its API routes, database models, request/response schemas, business logic, and tests. This pattern enforces the Single Responsibility Principle at the module level — each feature module is responsible for exactly one business domain.

A well-structured feature module has a clear dependency direction: the router depends on the service, the service depends on the models and schemas, and nothing depends upward. This creates a dependency graph that is easy to understand and test. The service layer encapsulates business logic, keeping the router thin and focused on HTTP concerns. The models define the database schema, and the schemas define the API contract — they should be separate to allow independent evolution.

The router is the public interface of the feature. It defines what endpoints exist, what HTTP methods they support, and what schemas they accept and return. Internally, it delegates to the service layer for all business logic. This separation means you can change the service implementation (e.g., switching from synchronous to asynchronous database calls) without changing the API contract.

The service layer is where business rules live. It orchestrates database queries, applies business validations, and transforms data between the schema and model layers. A good service method does one thing well: create a user, calculate an order total, or send a notification. Complex operations that span multiple steps should be composed from simpler service methods.`,
          codeExamples: [
            {
              title: 'Complete Feature Module: Models',
              description: 'SQLAlchemy models for the users feature',
              code: `# app/features/users/models.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    orders = relationship("Order", back_populates="user", lazy="selectin")`,
              language: 'python',
            },
            {
              title: 'Complete Feature Module: Schemas',
              description: 'Pydantic schemas for API validation',
              code: `# app/features/users/schemas.py
from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str
    full_name: str | None = None

    @field_validator("username")
    @classmethod
    def username_alphanumeric(cls, v):
        if not v.isalnum():
            raise ValueError("Username must be alphanumeric")
        return v

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

class UserUpdate(BaseModel):
    email: EmailStr | None = None
    full_name: str | None = None
    is_active: bool | None = None

class UserRead(BaseModel):
    id: int
    email: str
    username: str
    full_name: str | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}`,
              language: 'python',
            },
            {
              title: 'Complete Feature Module: Service',
              description: 'Business logic layer for the users feature',
              code: `# app/features/users/service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from .models import User
from .schemas import UserCreate, UserUpdate
from app.core.security import get_password_hash

class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user(self, user_id: int) -> User | None:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_user_by_email(self, email: str) -> User | None:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def list_users(self, skip: int = 0, limit: int = 100) -> list[User]:
        result = await self.db.execute(
            select(User).offset(skip).limit(limit).order_by(User.id)
        )
        return list(result.scalars().all())

    async def create_user(self, user_in: UserCreate) -> User:
        user = User(
            email=user_in.email,
            username=user_in.username,
            hashed_password=get_password_hash(user_in.password),
            full_name=user_in.full_name,
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def update_user(self, user_id: int, user_in: UserUpdate) -> User | None:
        user = await self.get_user(user_id)
        if not user:
            return None
        update_data = user_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)
        await self.db.commit()
        await self.db.refresh(user)
        return user`,
              language: 'python',
            },
            {
              title: 'Feature Module Tests',
              description: 'Tests co-located with the feature',
              code: `# app/features/users/tests.py
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_create_user():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post("/api/v1/users/", json={
            "email": "test@example.com",
            "username": "testuser",
            "password": "securepass123",
        })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "hashed_password" not in data  # Never exposed

@pytest.mark.asyncio
async def test_create_user_duplicate_email():
    async with AsyncClient(app=app, base_url="http://test") as client:
        user_data = {"email": "dup@example.com", "username": "user1", "password": "pass1234"}
        await client.post("/api/v1/users/", json=user_data)
        response = await client.post("/api/v1/users/", json={
            **user_data, "username": "user2"
        })
    assert response.status_code == 409`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'architecture',
            title: 'Feature Module Internal Architecture',
            description: 'How components interact within a feature module',
            layers: [
              { label: 'Router (API Layer)', items: ['HTTP Methods', 'Path Parameters', 'Response Models', 'Dependencies'] },
              { label: 'Service (Business Logic)', items: ['Validation Rules', 'Data Transform', 'Orchestration', 'Error Handling'] },
              { label: 'Schemas (API Contract)', items: ['UserCreate', 'UserRead', 'UserUpdate', 'Validators'] },
              { label: 'Models (Database)', items: ['Table Definition', 'Relationships', 'Indexes', 'Constraints'] },
            ],
          },
          tips: [
            'Keep routers thin — they should only handle HTTP concerns (status codes, headers, response models). Business logic belongs in the service layer.',
            'Schemas and models should be separate. Schemas define the API contract, models define the database schema. They evolve independently.',
            'Co-locate tests with features. When you delete a feature, its tests go with it.',
          ],
          warning: 'Never import from one feature service directly into another feature router. If features need to communicate, use dependency injection, shared schemas, or a shared service in core/.',
          keyTakeaway: 'A feature module encapsulates router + service + schemas + models + tests for one business domain, with a clear dependency direction from router → service → models/schemas.',
          realWorldAnalogy: 'A feature module is like a department in a company. The HR department has its own processes (router), policies (service), forms (schemas), and records (models). Other departments interact with HR through well-defined channels (API endpoints), not by rummaging through HR filing cabinets.',
          commonMistakes: [
            { mistake: 'Putting business logic in route handlers', fix: 'Route handlers should be 5-10 lines: parse input, call service, return result. If your handler has if/else chains, database queries, or complex calculations, that logic belongs in the service layer.' },
            { mistake: 'Using the same Pydantic model for request and response', fix: 'Separate input schemas (UserCreate) from output schemas (UserRead). The output should never expose hashed_password. The input should never accept id or created_at.' },
          ],
          interviewQuestions: [
            { question: 'Why should schemas and models be separate in a feature module?', answer: 'Schemas define the API contract (what the client sends/receives), while models define the database structure. They evolve independently — you might add a database column that should not be exposed in the API, or change an API response format without altering the database schema.' },
            { question: 'What is the role of the service layer in a FastAPI feature module?', answer: 'The service layer encapsulates business logic: validation rules, data transformations, orchestration of multiple database operations, and error handling. It sits between the router (HTTP concerns) and the models (database concerns), keeping both clean and testable.' },
          ],
          proTips: [
            'Generate feature modules with a script: python scripts/create_feature.py orders — this creates the directory, router, models, schemas, service, and tests with boilerplate code.',
            'Use dependency injection to pass the service to the router: async def get_service(db=Depends(get_db)) -> UserService: return UserService(db). This makes testing trivial — just override the dependency.',
          ],
        },
        {
          heading: 'Shared Utilities & Cross-Cutting Concerns',
          content: `Not everything fits neatly into a single feature module. Cross-cutting concerns like authentication, pagination, error handling, and logging span multiple features and need a home. The challenge is organizing these shared utilities so they are genuinely reusable without becoming a dumping ground for code that does not fit elsewhere.

The core/ directory should contain only infrastructure that is truly shared across ALL features. Database session management, configuration settings, security utilities (JWT creation/verification, password hashing), and shared dependency functions belong here. If a utility is only used by two features, it probably belongs in one of them with the other importing from it, not in core/.

The shared/ directory is for utilities that are used by multiple features but are not infrastructure. Custom exception classes, pagination helpers, response wrappers, and common validators belong here. The distinction between core/ and shared/ is that core/ provides the foundation (without it, the app cannot run), while shared/ provides convenience (without it, the app works but with duplicated code).

Middleware is a special cross-cutting concern. Authentication middleware, request logging, and CORS configuration are typically defined in main.py because they apply globally. Feature-specific middleware (like rate limiting only on the orders feature) should be defined within the feature and applied using the router\'s middleware parameter.

Error handling should follow a layered approach. Define a base set of custom exceptions in shared/exceptions.py. Each feature can extend these with domain-specific exceptions. A global exception handler in main.py catches all custom exceptions and returns consistent error responses. This ensures that every error, regardless of which feature raises it, has the same response format.`,
          codeExamples: [
            {
              title: 'Shared Pagination Utility',
              description: 'A reusable pagination system for all list endpoints',
              code: `# app/shared/pagination.py
from typing import TypeVar, Generic
from pydantic import BaseModel
from fastapi import Query

T = TypeVar("T")

class PaginationParams:
    """Reusable pagination parameters via Depends()."""
    def __init__(
        self,
        skip: int = Query(0, ge=0, description="Number of items to skip"),
        limit: int = Query(100, ge=1, le=500, description="Items per page"),
    ):
        self.skip = skip
        self.limit = limit

class PaginatedResponse(BaseModel, Generic[T]):
    """Standard paginated response wrapper."""
    items: list[T]
    total: int
    skip: int
    limit: int

    @property
    def has_next(self) -> bool:
        return self.skip + self.limit < self.total

    @property
    def has_prev(self) -> bool:
        return self.skip > 0

# Usage in any feature router:
# @router.get("/", response_model=PaginatedResponse[UserRead])
# async def list_users(pagination: PaginationParams = Depends(), ...):`,
              language: 'python',
            },
            {
              title: 'Custom Exception Hierarchy',
              description: 'Domain-specific exceptions with global handlers',
              code: `# app/shared/exceptions.py
from fastapi import Request
from fastapi.responses import JSONResponse

class AppException(Exception):
    """Base exception for all application errors."""
    def __init__(self, status_code: int, detail: str, error_code: str | None = None):
        self.status_code = status_code
        self.detail = detail
        self.error_code = error_code or f"ERR_{status_code}"

class NotFoundError(AppException):
    def __init__(self, resource: str, resource_id: int | str):
        super().__init__(
            status_code=404,
            detail=f"{resource} with id {resource_id} not found",
            error_code=f"{resource.upper()}_NOT_FOUND",
        )

class ConflictError(AppException):
    def __init__(self, resource: str, field: str, value: str):
        super().__init__(
            status_code=409,
            detail=f"{resource} with {field}='{value}' already exists",
            error_code=f"{resource.upper()}_CONFLICT",
        )

class ForbiddenError(AppException):
    def __init__(self, detail: str = "You don't have permission"):
        super().__init__(status_code=403, detail=detail, error_code="FORBIDDEN")

# Global exception handler in main.py
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.error_code,
            "detail": exc.detail,
            "path": str(request.url.path),
        },
    )`,
              language: 'python',
            },
            {
              title: 'Core Database Module',
              description: 'Shared database infrastructure used by all features',
              code: `# app/core/database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=3600,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass

async def get_db():
    """Dependency that provides a database session per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()`,
              language: 'python',
            },
            {
              title: 'Core Security Module',
              description: 'Shared authentication and authorization utilities',
              code: `# app/core/security.py
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(subject: str, role: str = "user") -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": subject, "role": role, "exp": expire},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    return {"id": int(user_id), "role": payload.get("role", "user")}`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'architecture',
            title: 'Project Dependency Graph',
            description: 'How modules depend on each other',
            layers: [
              { label: 'Main App', items: ['FastAPI instance', 'Middleware', 'Router assembly', 'Exception handlers'] },
              { label: 'Features (Independent)', items: ['users/', 'products/', 'orders/', 'auth/'] },
              { label: 'Shared', items: ['Pagination', 'Exceptions', 'Response wrappers', 'Validators'] },
              { label: 'Core', items: ['Database', 'Config', 'Security', 'Dependencies'] },
            ],
          },
          tips: [
            'The dependency graph should always point downward: main → features → shared → core. Never import upward (core should never import from features).',
            'If two features need to share data, use a shared schema in shared/ rather than importing schemas between features.',
            'Keep core/ minimal. Every addition to core/ should require a team review — it is the foundation everything depends on.',
          ],
          warning: 'Circular dependencies between features are a code architecture red flag. If Feature A imports from Feature B and Feature B imports from Feature A, extract the shared logic into shared/ or core/.',
          keyTakeaway: 'Shared utilities in core/ (infrastructure) and shared/ (convenience) prevent code duplication while keeping features independent. The dependency graph must always point downward.',
          realWorldAnalogy: 'Shared utilities are like public infrastructure in a city. Roads, water, and electricity (core/) are used by every building. Parks and libraries (shared/) are used by many but not all residents. Each building (feature) has its own interior design but connects to the same infrastructure.',
          commonMistakes: [
            { mistake: 'Putting feature-specific code in core/', fix: 'Core should only contain code used by ALL features. If a utility is only used by 2 out of 10 features, it belongs in shared/ or in the feature that owns it.' },
            { mistake: 'Creating circular dependencies between features', fix: 'If Feature A needs data from Feature B, use dependency injection or a shared service. Never import Feature B router or service directly into Feature A.' },
          ],
          interviewQuestions: [
            { question: 'How do you prevent core/ from becoming a dumping ground?', fix: 'Establish a strict rule: code goes in core/ only if it is used by ALL features and the app cannot run without it. Require team review for any core/ additions. Feature-specific code belongs in its feature directory.' },
            { question: 'What is the difference between core/ and shared/ directories?', answer: 'core/ contains infrastructure without which the app cannot run (database, config, auth). shared/ contains convenience utilities that prevent code duplication (pagination, custom exceptions). Removing shared/ would not break the app; removing core/ would.' },
          ],
          proTips: [
            'Use a dependency injection container like python-dependency-injector for complex projects. It manages service lifecycles and makes testing with mocks trivial.',
            'Create a script that validates the dependency graph: python scripts/check_deps.py — it scans imports and reports any upward or circular dependencies.',
          ],
          frontendIntegration: {
            title: 'API Structure Dashboard',
            vanillaHtml: {
              title: 'API Feature Browser',
              description: 'A frontend that discovers and displays all API features from the OpenAPI schema',
              code: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>FastAPI Feature Browser</title>
<style>
  body { font-family: system-ui; max-width: 700px; margin: 2rem auto; padding: 0 1rem; background: #0f172a; color: #e2e8f0; }
  .feature { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 1rem; margin: 0.5rem 0; }
  .feature h3 { color: #2dd4bf; margin: 0 0 0.5rem; }
  .endpoint { display: flex; align-items: center; gap: 0.5rem; padding: 0.25rem 0; }
  .method { font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.4rem; border-radius: 3px; font-family: monospace; }
  .get { background: #065f46; color: #6ee7b7; }
  .post { background: #1e3a5f; color: #93c5fd; }
  .put { background: #713f12; color: #fcd34d; }
  .delete { background: #7f1d1d; color: #fca5a5; }
  .path { font-family: monospace; font-size: 0.85rem; color: #94a3b8; }
</style>
</head>
<body>
  <h1>FastAPI Feature Browser</h1>
  <div id="features"></div>
  <script>
    async function loadFeatures() {
      const res = await fetch("http://localhost:8000/openapi.json");
      const spec = await res.json();
      const paths = Object.entries(spec.paths);
      const features = {};
      paths.forEach(([path, methods]) => {
        const prefix = path.split("/").slice(0, 3).join("/");
        if (!features[prefix]) features[prefix] = [];
        Object.entries(methods).forEach(([method, detail]) => {
          features[prefix].push({ method: method.toUpperCase(), path, summary: detail.summary || "" });
        });
      });
      const container = document.getElementById("features");
      Object.entries(features).forEach(([prefix, endpoints]) => {
        container.innerHTML += '<div class="feature"><h3>' + prefix + '</h3>' +
          endpoints.map(e => '<div class="endpoint"><span class="method ' + e.method.toLowerCase() + '">' + e.method + '</span><span class="path">' + e.path + '</span></div>').join('') +
          '</div>';
      });
    }
    loadFeatures();
  </script>
</body>
</html>`,
              language: 'html',
              whatHappened: [
                'The frontend fetches the OpenAPI schema from /openapi.json',
                'Endpoints are grouped by their path prefix (feature)',
                'Each feature is displayed as a card with its endpoints',
              ],
              tryToBreak: [
                'Try loading without the server running — you will see a network error',
                'Add a new endpoint to the backend and refresh — it appears automatically',
              ],
            },
            corsNote: 'The OpenAPI schema at /openapi.json is served from the same origin as the API, so CORS is not needed. If fetching from a different origin, configure CORSMiddleware.',
          },
        },
      ],
    },
    {
      id: 'm9-configuration',
      title: 'Configuration Management',
      icon: '⚙️',
      introduction:
        'Hardcoded configuration is a security risk and a deployment nightmare. Production FastAPI applications use pydantic-settings to manage configuration through environment variables, .env files, and type-safe settings classes. This topic covers everything from basic settings to advanced patterns like nested configuration, environment-specific overrides, and secrets management.',
      sections: [
        {
          heading: 'pydantic-settings Deep Dive',
          content: `Pydantic-settings (the successor to the deprecated python-dotenv + pydantic approach) is the standard way to manage configuration in FastAPI applications. It extends Pydantic BaseModel with the ability to read values from environment variables, .env files, and other sources, with full type validation and automatic casting.

The BaseSettings class works like a regular Pydantic model but with a crucial difference: when you access a field, it first checks the environment variable with the matching name (uppercase), then falls back to the default value. This means your application works with sensible defaults in development but can be configured via environment variables in production without any code changes.

For example, a field \`database_url: str = "sqlite+aiosqlite:///./dev.db"\` will use the SQLite default in development, but in production you set the DATABASE_URL environment variable to your PostgreSQL connection string. The application code never changes — only the environment does.

Pydantic-settings also handles type casting automatically. If you define \`debug: bool = False\` and set the environment variable DEBUG=true, it correctly parses "true" as a boolean. Similarly, \`port: int = 8000\` with PORT=3000 correctly parses "3000" as an integer. This eliminates the common mistake of comparing string values like \`os.environ.get("DEBUG") == "true"\`.

The model_config SettingsConfigDict controls where settings are read from. The most important options are env_file (path to .env file), env_file_encoding, case_sensitive (whether env var names must match case), and env_prefix (a prefix for all environment variables, useful for avoiding conflicts).`,
          codeExamples: [
            {
              title: 'Basic Settings with pydantic-settings',
              description: 'A complete settings class for a FastAPI application',
              code: `# app/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, PostgresDsn

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",  # Ignore extra env vars
    )

    # Application
    project_name: str = "My FastAPI App"
    version: str = "1.0.0"
    debug: bool = False
    api_prefix: str = "/api/v1"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    workers: int = 1

    # Database
    database_url: PostgresDsn = Field(
        default="postgresql+asyncpg://user:pass@localhost:5432/app"
    )
    db_pool_size: int = 20
    db_max_overflow: int = 10

    # Security
    secret_key: str = Field(default="change-me-in-production")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # CORS
    allowed_origins: list[str] = Field(default=["http://localhost:3000"])

    @property
    def is_production(self) -> bool:
        return not self.debug

settings = Settings()`,
              language: 'python',
            },
            {
              title: 'Using Settings in FastAPI',
              description: 'How to access settings throughout your application',
              code: `# app/main.py
from fastapi import FastAPI
from app.core.config import settings
from app.core.database import engine

app = FastAPI(
    title=settings.project_name,
    version=settings.version,
    debug=settings.debug,
)

# Settings are accessible anywhere via import
# from app.core.config import settings

@app.get("/api/health")
async def health():
    return {
        "status": "healthy",
        "version": settings.version,
        "environment": "production" if settings.is_production else "development",
    }

# .env file (development)
# DATABASE_URL=postgresql+asyncpg://dev:dev@localhost:5432/dev_db
# DEBUG=true
# SECRET_KEY=local-dev-secret-key

# Production environment variables (set in Docker/K8s):
# DATABASE_URL=postgresql+asyncpg://prod:prod@prod-db:5432/prod_db
# DEBUG=false
# SECRET_KEY=<random-64-char-string>`,
              language: 'python',
            },
            {
              title: 'Testing with Settings Overrides',
              description: 'Override settings for testing without modifying .env',
              code: `# tests/conftest.py
import pytest
from app.core.config import Settings

@pytest.fixture
def test_settings():
    """Provide settings configured for testing."""
    return Settings(
        database_url="postgresql+asyncpg://test:test@localhost:5432/test_db",
        debug=True,
        secret_key="test-secret-key",
        access_token_expire_minutes=5,
    )

@pytest.fixture
def app(test_settings):
    """Create a test app with overridden settings."""
    from app.main import create_app
    return create_app(test_settings)

# tests/test_users.py
async def test_list_users(test_settings):
    # test_settings.database_url points to test database
    # test_settings.secret_key is a known value for token creation
    assert test_settings.debug is True`,
              language: 'python',
            },
            {
              title: '.env File Best Practices',
              description: 'How to organize .env files for different environments',
              code: `# .env.example (committed to git — safe template)
# Copy to .env and fill in real values
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/app
DEBUG=true
SECRET_KEY=change-me-to-a-random-string
ALLOWED_ORIGINS=["http://localhost:3000"]

# .env (NOT committed — real local values)
DATABASE_URL=postgresql+asyncpg://devuser:devpass@localhost:5432/myapp_dev
DEBUG=true
SECRET_KEY=my-super-secret-local-key-abc123
ALLOWED_ORIGINS=["http://localhost:3000","http://localhost:8000"]

# .env.production (production values — stored in secrets manager)
# NEVER commit this file. Use Docker/K8s secrets or cloud secret managers.
DATABASE_URL=postgresql+asyncpg://prod:complex-pass@prod-db.internal:5432/myapp
DEBUG=false
SECRET_KEY=<64-char-random-string-from-openssl-rand-hex-32>
ALLOWED_ORIGINS=["https://myapp.com","https://api.myapp.com"]

# .gitignore
.env
.env.production
.env.staging`,
              language: 'text',
            },
          ],
          visualization: {
            type: 'flow',
            title: 'Configuration Resolution Order',
            description: 'How pydantic-settings resolves values',
            steps: [
              { label: 'Environment Variable', detail: 'DATABASE_URL=postgres://... (highest priority)', highlight: true },
              { label: '.env File', detail: 'DATABASE_URL=sqlite://... (second priority)' },
              { label: 'Default Value', detail: 'database_url: str = "sqlite:///dev.db" (lowest priority)' },
              { label: 'Validation', detail: 'Pydantic validates type, constraints, and custom validators' },
              { label: 'Settings Instance', detail: 'settings = Settings() — all values resolved and typed' },
            ],
          },
          tips: [
            'Always provide a .env.example file committed to git. New developers copy it to .env and fill in their local values.',
            'Use PostgresDsn or MySQLDsn types for database URLs — they validate the URL format at startup, catching typos early.',
            'Never commit .env files to version control. Add them to .gitignore immediately.',
          ],
          warning: 'Never store production secrets (API keys, database passwords, JWT secrets) in .env files that are committed to git. Use a secrets manager (AWS Secrets Manager, HashiCorp Vault, or GitHub Secrets) and inject them as environment variables at deployment time.',
          keyTakeaway: 'pydantic-settings reads configuration from environment variables with .env file fallback and type-safe validation. Environment variables always override .env files, which always override defaults.',
          realWorldAnalogy: 'Configuration management is like a hotel room. The default settings are the standard room setup (bed, towels, TV). The .env file is like a guest preference card (extra pillows, firm mattress). Environment variables are like calling the front desk directly (highest priority, overrides everything). The room always has a valid configuration, but guests can customize it.',
          commonMistakes: [
            { mistake: 'Committing .env files with real secrets to git', fix: 'Add .env to .gitignore immediately. Use .env.example as a template. For production, use secrets managers (AWS Secrets Manager, Vault, GitHub Secrets) and inject as environment variables.' },
            { mistake: 'Using os.environ.get() instead of pydantic-settings', fix: 'os.environ.get() returns strings that you must manually parse and validate. pydantic-settings does automatic type casting, validation, and provides IDE autocomplete. Always use BaseSettings.' },
          ],
          interviewQuestions: [
            { question: 'What is the priority order for configuration values in pydantic-settings?', answer: 'Environment variables > .env file > default values. This ensures production deployments can override any setting via environment variables without modifying code or .env files.' },
            { question: 'How do you handle secrets in a production FastAPI application?', answer: 'Never store secrets in code or .env files. Use a secrets manager (AWS Secrets Manager, HashiCorp Vault) and inject them as environment variables at deployment time. The application reads them via pydantic-settings as if they were regular environment variables.' },
          ],
          proTips: [
            'Use SettingsConfigDict(env_prefix="MYAPP_") to namespace your environment variables. This prevents conflicts when running multiple services on the same host.',
            'Create a settings validation method that checks for insecure defaults at startup: if settings.secret_key == "change-me-in-production": raise ValueError("Change the default secret key!").',
          ],
          frontendIntegration: {
            title: 'Configuration Status Dashboard',
            vanillaHtml: {
              title: 'Config Dashboard',
              description: 'A frontend that displays the current API configuration status',
              code: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Config Dashboard</title>
<style>
  body { font-family: system-ui; max-width: 600px; margin: 2rem auto; background: #0f172a; color: #e2e8f0; }
  .card { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 1rem; margin: 0.5rem 0; }
  .label { color: #94a3b8; font-size: 0.75rem; text-transform: uppercase; }
  .value { color: #2dd4bf; font-family: monospace; font-size: 0.9rem; }
  .badge { display: inline-block; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: 700; }
  .dev { background: #065f46; color: #6ee7b7; }
  .prod { background: #7f1d1d; color: #fca5a5; }
</style>
</head>
<body>
  <h1>Configuration Dashboard</h1>
  <div id="config"></div>
  <script>
    async function loadConfig() {
      const res = await fetch("http://localhost:8000/api/health");
      const data = await res.json();
      document.getElementById("config").innerHTML =
        '<div class="card"><div class="label">Environment</div><div><span class="badge ' + (data.environment === 'production' ? 'prod' : 'dev') + '">' + data.environment + '</span></div></div>' +
        '<div class="card"><div class="label">Version</div><div class="value">' + data.version + '</div></div>' +
        '<div class="card"><div class="label">Status</div><div class="value">' + data.status + '</div></div>';
    }
    loadConfig();
  </script>
</body>
</html>`,
              language: 'html',
              whatHappened: [
                'The frontend fetches the health endpoint to get configuration status',
                'The environment badge shows dev or prod based on the DEBUG setting',
                'No sensitive values are exposed through the health endpoint',
              ],
              tryToBreak: [
                'Try accessing /api/health without the server running',
                'Check what happens if you add sensitive data to the health endpoint response',
              ],
            },
            corsNote: 'If accessing the API from a different origin, add your frontend URL to ALLOWED_ORIGINS in settings and configure CORSMiddleware.',
          },
        },
      ],
    },
    {
      id: 'm9-multi-app-router',
      title: 'Multi-Project Router Architecture',
      icon: '🔀',
      introduction:
        'As your API grows, you may need to run multiple independent applications under a single domain. FastAPI supports this through app.mount(), which lets you attach entire FastAPI sub-applications under specific path prefixes. This pattern enables independent deployment, separate documentation, and team-level ownership of API domains.',
      sections: [
        {
          heading: 'Mounting Sub-Applications',
          content: `The app.mount() method in FastAPI allows you to attach a complete ASGI application (including another FastAPI instance) under a specific path prefix. This is different from include_router() — mounting creates a completely separate application with its own middleware, exception handlers, and OpenAPI schema, while include_router() adds routes to the existing application.

When should you use mount() vs include_router()? Use include_router() when the routes share the same middleware, authentication, and documentation. Use mount() when the sub-application needs different middleware, separate documentation, or is developed by a different team. Mounting is also useful for API versioning — you can mount v1 and v2 as separate applications.

The mounted sub-application is completely independent. It has its own FastAPI instance, its own startup/shutdown events, and its own OpenAPI schema. The path prefix is applied transparently — routes in the sub-application are defined as if they were at the root, but they are accessed via the mount prefix.

One important caveat: mounted sub-applications do NOT inherit middleware from the parent app. If your parent app has CORS middleware, the sub-applications need their own CORS configuration. This is by design — it allows each sub-application to have its own security and middleware policies.`,
          codeExamples: [
            {
              title: 'Mounting Multiple Sub-Applications',
              description: 'A main app that mounts independent API sub-apps',
              code: `# main.py
from fastapi import FastAPI
from app.users_app import users_app
from app.products_app import products_app
from app.admin_app import admin_app

app = FastAPI(title="Platform API", version="1.0.0")

# Each sub-app is an independent FastAPI instance
app.mount("/api/v1/users", users_app)
app.mount("/api/v1/products", products_app)
app.mount("/api/v2/admin", admin_app)

@app.get("/")
async def root():
    return {
        "message": "Platform API",
        "versions": {
            "v1": {
                "users": "/api/v1/users/docs",
                "products": "/api/v1/products/docs",
            },
            "v2": {
                "admin": "/api/v2/admin/docs",
            }
        }
    }`,
              language: 'python',
            },
            {
              title: 'Independent Sub-Application',
              description: 'A self-contained users sub-application',
              code: `# app/users_app.py
from fastapi import FastAPI
from pydantic import BaseModel

users_app = FastAPI(
    title="Users API",
    version="1.0.0",
    description="User management microservice",
)

class UserCreate(BaseModel):
    username: str
    email: str

class UserRead(BaseModel):
    id: int
    username: str
    email: str

# Note: routes are defined WITHOUT the /api/v1/users prefix
# The mount prefix is applied automatically

@users_app.get("/")
async def list_users():
    return [{"id": 1, "username": "alice"}]

@users_app.post("/", status_code=201)
async def create_user(user: UserCreate):
    return {"id": 1, **user.model_dump()}

@users_app.get("/{user_id}")
async def get_user(user_id: int):
    return {"id": user_id, "username": "alice"}`,
              language: 'python',
            },
            {
              title: 'Sub-App with Own Middleware',
              description: 'Admin sub-app with separate authentication',
              code: `# app/admin_app.py
from fastapi import FastAPI, Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware

admin_app = FastAPI(title="Admin API", version="2.0.0")

class AdminAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Admin-only authentication (separate from user auth)
        admin_key = request.headers.get("X-Admin-Key")
        if not admin_key or admin_key != "super-secret-admin-key":
            raise HTTPException(status_code=403, detail="Admin access required")
        response = await call_next(request)
        return response

admin_app.add_middleware(AdminAuthMiddleware)

@admin_app.get("/dashboard")
async def admin_dashboard():
    return {"total_users": 1234, "revenue": 99999.99}

@admin_app.get("/analytics")
async def admin_analytics():
    return {"page_views": 50000, "conversion_rate": 0.05}`,
              language: 'python',
            },
            {
              title: 'API Versioning with Mount',
              description: 'Running v1 and v2 of your API side by side',
              code: `# main.py — API versioning pattern
from fastapi import FastAPI
from app.v1.app import v1_app
from app.v2.app import v2_app

app = FastAPI(title="Versioned API")

# Mount different API versions as separate applications
app.mount("/api/v1", v1_app)
app.mount("/api/v2", v2_app)

# Version discovery endpoint
@app.get("/api")
async def api_versions():
    return {
        "current": "v2",
        "versions": {
            "v1": {"docs": "/api/v1/docs", "sunset": "2025-12-31"},
            "v2": {"docs": "/api/v2/docs", "status": "stable"},
        }
    }

# v1 and v2 can have completely different schemas
# v1 might return {"name": "Alice"}
# v2 might return {"first_name": "Alice", "last_name": "Smith"}
# Both coexist under the same domain`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'architecture',
            title: 'Multi-App Router Architecture',
            description: 'How sub-applications are mounted under a main app',
            layers: [
              { label: 'Main App (:8000)', items: ['Root endpoint', 'CORS middleware', 'Health check', 'Version discovery'] },
              { label: '/api/v1/users', items: ['Users App', 'Own OpenAPI', 'Own middleware'] },
              { label: '/api/v1/products', items: ['Products App', 'Own OpenAPI', 'Own middleware'] },
              { label: '/api/v2/admin', items: ['Admin App', 'Admin auth', 'Own OpenAPI'] },
            ],
          },
          tips: [
            'Each mounted sub-app gets its own /docs endpoint. Users API docs are at /api/v1/users/docs, Products at /api/v1/products/docs.',
            'Mounted sub-applications do NOT inherit parent middleware. If you need CORS on a sub-app, add it to the sub-app directly.',
            'Use mount() for true isolation (separate teams, separate docs, separate middleware) and include_router() for shared applications (same auth, same docs).',
          ],
          warning: 'app.mount() catches ALL requests under the prefix, including those that do not match any route in the sub-app. This means a 404 from a mounted sub-app returns the sub-app 404, not the parent app 404.',
          keyTakeaway: 'app.mount() creates independent sub-applications under path prefixes. Each sub-app has its own middleware, docs, and OpenAPI schema. Use this for API versioning, team isolation, and multi-domain APIs.',
          realWorldAnalogy: 'Mounting sub-applications is like a shopping mall. The main entrance (root app) directs visitors to different stores (sub-apps). Each store has its own layout, staff, and policies. The food court has different health codes than the electronics store, just as different sub-apps have different middleware.',
          commonMistakes: [
            { mistake: 'Including route paths with the mount prefix in the sub-app', fix: 'Routes in a mounted sub-app should NOT include the mount prefix. If mounted at /api/v1/users, define routes as @sub_app.get("/") not @sub_app.get("/api/v1/users/"). The mount prefix is applied automatically.' },
            { mistake: 'Expecting mounted sub-apps to inherit parent middleware', fix: 'Mounted sub-apps are independent ASGI applications. They do not inherit CORS, auth, or any other middleware from the parent. Add middleware to each sub-app that needs it.' },
          ],
          interviewQuestions: [
            { question: 'When should you use app.mount() vs app.include_router()?', answer: 'Use include_router() when routes share the same middleware, auth, and documentation. Use mount() when sub-applications need different middleware, separate docs, or are developed by different teams. Mounting creates true isolation; include_router() shares the application context.' },
            { question: 'How does API versioning with mount() differ from versioning with routers?', answer: 'Mounting creates completely separate applications per version — different schemas, middleware, and error handlers. Router-based versioning keeps everything in one app with different route prefixes. Mounting is cleaner for major version differences; routers are better for minor version differences.' },
          ],
          proTips: [
            'Create a version discovery endpoint at /api that lists all available versions with their docs URLs and sunset dates. This helps API consumers discover and plan migrations.',
            'Use a factory pattern for sub-applications: create_app(settings) returns a configured FastAPI instance. This makes testing and configuration management consistent across sub-apps.',
          ],
          frontendIntegration: {
            title: 'API Version Switcher',
            vanillaHtml: {
              title: 'API Version Browser',
              description: 'A frontend that lets users switch between API versions',
              code: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>API Version Switcher</title>
<style>
  body { font-family: system-ui; max-width: 600px; margin: 2rem auto; background: #0f172a; color: #e2e8f0; }
  .tabs { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
  .tab { padding: 0.5rem 1rem; border: 1px solid #334155; border-radius: 6px; cursor: pointer; background: #1e293b; color: #94a3b8; }
  .tab.active { background: #0d9488; color: white; border-color: #0d9488; }
  .content { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 1rem; }
  .endpoint { padding: 0.3rem 0; font-family: monospace; font-size: 0.85rem; color: #2dd4bf; }
</style>
</head>
<body>
  <h1>API Version Switcher</h1>
  <div class="tabs">
    <div class="tab active" onclick="switchVersion('v1')">v1</div>
    <div class="tab" onclick="switchVersion('v2')">v2</div>
  </div>
  <div class="content" id="content"></div>
  <script>
    async function switchVersion(version) {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      event.target.classList.add('active');
      try {
        const res = await fetch("http://localhost:8000/api/" + version + "/openapi.json");
        const spec = await res.json();
        const endpoints = Object.keys(spec.paths).map(p => '<div class="endpoint">' + p + '</div>').join('');
        document.getElementById("content").innerHTML = '<h3>' + spec.info.title + '</h3>' + endpoints;
      } catch (e) {
        document.getElementById("content").innerHTML = '<p>Failed to load ' + version + ' API docs</p>';
      }
    }
    switchVersion('v1');
  </script>
</body>
</html>`,
              language: 'html',
              whatHappened: [
                'Each version has its own OpenAPI schema at /api/vN/openapi.json',
                'Switching versions fetches that version schema and displays its endpoints',
                'The v1 and v2 schemas can be completely different',
              ],
              tryToBreak: [
                'Try switching to a version that does not exist',
                'Remove the CORS configuration from a sub-app and try fetching from a browser',
              ],
            },
            corsNote: 'Each mounted sub-app needs its own CORS middleware if accessed from a browser. Add CORSMiddleware to each sub-app independently.',
          },
        },
      ],
    },
    {
      id: 'm9-design-patterns',
      title: 'FastAPI Design Patterns',
      icon: '📐',
      introduction:
        'Design patterns are proven solutions to recurring problems in software architecture. In FastAPI, the most important patterns are the Repository pattern (for abstracting data access), the Service Layer pattern (for separating business logic from HTTP concerns), and CQRS (for separating read and write operations). This topic shows you how to apply these patterns in production FastAPI applications.',
      sections: [
        {
          heading: 'Repository Pattern with FastAPI',
          content: `The Repository pattern abstracts data access behind a clean interface. Instead of writing SQLAlchemy queries directly in your route handlers or services, you define a repository class that encapsulates all database operations for a specific entity. The route handler calls the repository, the repository executes the query, and the handler never knows (or cares) whether the data comes from PostgreSQL, MongoDB, or an in-memory cache.

This pattern provides three key benefits. First, it centralizes data access logic. If you need to change how users are queried (e.g., adding a cache layer or switching to a different ORM), you change one file instead of hunting through dozens of route handlers. Second, it makes testing trivial. You can replace the real repository with a mock that returns predefined data without touching a real database. Third, it enforces consistency. Every query for users goes through the same code path, ensuring that filters, ordering, and pagination are applied uniformly.

In practice, a repository class has methods like get_by_id(), list(), create(), update(), and delete(). Each method translates to one or more SQLAlchemy queries. The repository receives a database session through dependency injection, so it is tied to the current request lifecycle and automatically commits or rolls back with the session.

For async FastAPI applications, use an async repository that leverages SQLAlchemy async sessions. The pattern is identical — only the session type changes from Session to AsyncSession, and each method is marked async with await on query execution.`,
          codeExamples: [
            {
              title: 'Async Repository Implementation',
              description: 'A generic async repository pattern for SQLAlchemy',
              code: `# app/features/users/repository.py
from typing import TypeVar, Generic, Type
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import DeclarativeBase

ModelType = TypeVar("ModelType", bound=DeclarativeBase)

class BaseRepository(Generic[ModelType]):
    """Base repository with common CRUD operations."""

    def __init__(self, model: Type[ModelType], session: AsyncSession):
        self.model = model
        self.session = session

    async def get_by_id(self, id: int) -> ModelType | None:
        result = await self.session.execute(
            select(self.model).where(self.model.id == id)
        )
        return result.scalar_one_or_none()

    async def list(self, skip: int = 0, limit: int = 100) -> list[ModelType]:
        result = await self.session.execute(
            select(self.model).offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def create(self, obj: ModelType) -> ModelType:
        self.session.add(obj)
        await self.session.flush()
        await self.session.refresh(obj)
        return obj

    async def delete(self, id: int) -> bool:
        obj = await self.get_by_id(id)
        if obj:
            await self.session.delete(obj)
            await self.session.flush()
            return True
        return False

class UserRepository(BaseRepository):
    """User-specific data access methods."""

    async def get_by_email(self, email: str) -> User | None:
        result = await self.session.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()

    async def get_by_username(self, username: str) -> User | None:
        result = await self.session.execute(
            select(User).where(User.username == username)
        )
        return result.scalar_one_or_none()`,
              language: 'python',
            },
            {
              title: 'Using Repository with Dependency Injection',
              description: 'Wire repositories into FastAPI via Depends()',
              code: `# app/features/users/dependencies.py
from app.core.database import get_db
from app.features.users.repository import UserRepository
from app.features.users.models import User

async def get_user_repository(db=Depends(get_db)) -> UserRepository:
    return UserRepository(User, db)

# app/features/users/router.py
from fastapi import APIRouter, Depends
from .dependencies import get_user_repository
from .repository import UserRepository
from .schemas import UserCreate, UserRead

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/", response_model=list[UserRead])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    repo: UserRepository = Depends(get_user_repository),
):
    users = await repo.list(skip=skip, limit=limit)
    return users

@router.post("/", response_model=UserRead, status_code=201)
async def create_user(
    user_in: UserCreate,
    repo: UserRepository = Depends(get_user_repository),
):
    user = User(**user_in.model_dump())
    return await repo.create(user)`,
              language: 'python',
            },
            {
              title: 'Testing with Mock Repository',
              description: 'Replace the real repository with a mock for fast tests',
              code: `# tests/test_users.py
import pytest
from unittest.mock import AsyncMock
from app.features.users.models import User
from app.features.users.repository import UserRepository

@pytest.fixture
def mock_repo():
    repo = AsyncMock(spec=UserRepository)
    repo.list.return_value = [
        User(id=1, username="alice", email="alice@test.com"),
        User(id=2, username="bob", email="bob@test.com"),
    ]
    return repo

async def test_list_users(mock_repo):
    users = await mock_repo.list(skip=0, limit=10)
    assert len(users) == 2
    assert users[0].username == "alice"

async def test_list_users_endpoint(client, mock_repo):
    # Override the dependency
    app.dependency_overrides[get_user_repository] = lambda: mock_repo
    response = await client.get("/api/v1/users/")
    assert response.status_code == 200
    assert len(response.json()) == 2
    app.dependency_overrides.clear()`,
              language: 'python',
            },
            {
              title: 'Repository with Caching Layer',
              description: 'Add Redis caching transparently behind the repository',
              code: `# app/features/users/cached_repository.py
import json
import redis.asyncio as redis
from .repository import UserRepository
from .models import User

class CachedUserRepository(UserRepository):
    """User repository with transparent Redis caching."""

    def __init__(self, session, redis_client: redis.Redis):
        super().__init__(User, session)
        self.redis = redis_client

    async def get_by_id(self, id: int) -> User | None:
        # Check cache first
        cached = await self.redis.get(f"user:{id}")
        if cached:
            return User(**json.loads(cached))

        # Cache miss — query database
        user = await super().get_by_id(id)
        if user:
            await self.redis.setex(
                f"user:{id}", 300,  # 5 min TTL
                json.dumps({"id": user.id, "username": user.username, "email": user.email}),
            )
        return user

# Swap in your dependency:
# async def get_user_repository(db=Depends(get_db)):
#     redis_client = redis.from_url("redis://localhost")
#     return CachedUserRepository(db, redis_client)`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'flow',
            title: 'Repository Pattern Request Flow',
            description: 'How a request flows through the repository pattern',
            steps: [
              { label: 'HTTP Request', detail: 'GET /users/42', highlight: false },
              { label: 'Route Handler', detail: 'Calls repo.get_by_id(42)', highlight: false },
              { label: 'Repository', detail: 'Executes SQLAlchemy query', highlight: true },
              { label: 'Database', detail: 'Returns User row', highlight: false },
              { label: 'Repository', detail: 'Returns User model object', highlight: true },
              { label: 'Route Handler', detail: 'Serializes via response_model', highlight: false },
              { label: 'HTTP Response', detail: '{"id": 42, "username": "alice"}', highlight: false },
            ],
          },
          tips: [
            'Use a generic BaseRepository to avoid duplicating CRUD methods for every entity. Entity-specific methods go in the subclass.',
            'Always inject the repository via Depends() — this makes it trivial to swap implementations for testing or caching.',
            'Keep repository methods simple. Each method should do one database operation. Complex queries that span entities belong in the service layer.',
          ],
          warning: 'Do not put business logic in the repository. The repository is for data access only. If you need to validate, transform, or orchestrate data, that logic belongs in the service layer.',
          keyTakeaway: 'The Repository pattern abstracts data access behind a clean interface, making code testable, maintainable, and consistent. Generic base repositories eliminate CRUD boilerplate.',
          realWorldAnalogy: 'A repository is like a librarian. You ask the librarian for a book by its ID (call number), and they retrieve it from the shelves (database). You do not need to know which shelf, which room, or whether the book is in storage. The librarian handles all of that, and they can even check the reserve shelf (cache) first.',
          commonMistakes: [
            { mistake: 'Putting business logic in repository methods', fix: 'Repositories should only contain data access logic (queries, inserts, updates, deletes). Business rules, validations, and data transformations belong in the service layer.' },
            { mistake: 'Creating a new repository instance in every route handler', fix: 'Use dependency injection: repo: UserRepository = Depends(get_user_repository). This ensures the repository gets the correct database session for the current request.' },
          ],
          interviewQuestions: [
            { question: 'What is the Repository pattern and why use it with FastAPI?', answer: 'The Repository pattern abstracts data access behind a clean interface. It centralizes query logic, makes testing trivial (mock the repository), and allows transparent implementation changes (add caching, switch ORM) without modifying route handlers.' },
            { question: 'How does the Repository pattern differ from the Service Layer pattern?', answer: 'The Repository handles data access (queries, CRUD). The Service Layer handles business logic (validations, orchestration, transformations). The router calls the service, the service calls the repository. This three-layer separation keeps each concern clean and testable.' },
          ],
          proTips: [
            'Implement a generic BaseRepository[ModelType] with type-safe CRUD methods. Entity-specific repositories extend it with custom queries. This eliminates 90% of boilerplate.',
            'For high-traffic endpoints, implement a CachedRepository decorator that wraps any repository with Redis caching. The router does not need to know caching is happening.',
          ],
          frontendIntegration: {
            title: 'Repository Pattern Demo',
            vanillaHtml: {
              title: 'CRUD Interface with Repository',
              description: 'A frontend that demonstrates the repository pattern through a CRUD interface',
              code: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>CRUD Demo</title>
<style>
  body { font-family: system-ui; max-width: 600px; margin: 2rem auto; background: #0f172a; color: #e2e8f0; }
  .card { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 1rem; margin: 0.5rem 0; }
  button { background: #0d9488; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 4px; cursor: pointer; margin: 0.2rem; }
  button:hover { background: #0f766e; }
  input { background: #0f172a; border: 1px solid #334155; color: #e2e8f0; padding: 0.4rem; border-radius: 4px; margin: 0.2rem; }
  .user { display: flex; justify-content: space-between; align-items: center; padding: 0.3rem 0; border-bottom: 1px solid #334155; }
</style>
</head>
<body>
  <h1>Repository Pattern CRUD</h1>
  <div class="card">
    <input id="username" placeholder="Username">
    <input id="email" placeholder="Email">
    <button onclick="createUser()">Create</button>
  </div>
  <div class="card" id="users"></div>
  <script>
    const API = "http://localhost:8000/api/v1/users";
    async function loadUsers() {
      const res = await fetch(API + "/");
      const users = await res.json();
      document.getElementById("users").innerHTML = users.map(u =>
        '<div class="user"><span>' + u.username + ' (' + u.email + ')</span>' +
        '<button onclick="deleteUser(' + u.id + ')">Delete</button></div>'
      ).join("");
    }
    async function createUser() {
      const username = document.getElementById("username").value;
      const email = document.getElementById("email").value;
      await fetch(API + "/", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({username, email}) });
      loadUsers();
    }
    async function deleteUser(id) {
      await fetch(API + "/" + id, { method: "DELETE" });
      loadUsers();
    }
    loadUsers();
  </script>
</body>
</html>`,
              language: 'html',
              whatHappened: [
                'Each CRUD operation goes through the repository layer',
                'Create POST, Read GET, and DELETE are all handled',
                'The frontend does not know about the repository — it just calls the API',
              ],
              tryToBreak: [
                'Create a user with an empty username — the Pydantic validation will reject it',
                'Delete a user that does not exist — see how the repository handles missing records',
              ],
            },
            corsNote: 'Add your frontend origin to ALLOWED_ORIGINS and configure CORSMiddleware on the FastAPI app.',
          },
        },
      ],
    },
  ],
};
