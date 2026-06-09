import { Module } from './types';

export const module7Deployment: Module = {
  id: 'module-7-deployment',
  title: 'Deployment & Production',
  icon: '🚢',
  description:
    'Take your FastAPI application from development to production. Learn production-grade project structure, Docker containerization, WebSocket real-time features, structured logging, performance optimization, and CI/CD pipelines that ship reliable software.',
  topics: [
    // ──────────────────────────────────────────────
    // TOPIC 1: Production Project Structure
    // ──────────────────────────────────────────────
    {
      id: 'm7-production-structure',
      title: 'Production Project Structure',
      icon: '📁',
      introduction:
        'A well-organized project structure is the foundation of a maintainable, scalable FastAPI application. In production, you need clear separation of concerns, feature-based organization, and configuration management that keeps your codebase navigable as it grows from a handful of endpoints to hundreds.',
      sections: [
        {
          heading: 'Feature-Based Project Layout',
          content: `The flat "everything in main.py" approach works for tutorials, but it breaks down fast in production. Feature-based organization groups code by business domain rather than technical layer. Instead of separate folders for \`models/\`, \`routes/\`, and \`services/\`, you create a \`features/\` folder where each subfolder contains everything related to one domain — models, routes, schemas, and services all live together.

This approach scales because adding a new feature means adding one new folder, not touching five different directories. When you need to understand how the "orders" feature works, you open \`features/orders/\` and find everything in one place. When you need to remove a feature, you delete one folder instead of hunting across the codebase.

The key principle is **cohesion over separation**: related code should live near each other. Cross-cutting concerns like authentication, database setup, and middleware belong in a shared \`core/\` directory, while business logic lives in features.`,
          codeExamples: [
            {
              title: 'Production-Ready Feature-Based Structure',
              description: 'A scalable directory layout for real-world FastAPI applications',
              code: `my-fastapi-app/
├── alembic/                  # Database migrations
│   ├── versions/
│   └── env.py
├── app/
│   ├── __init__.py
│   ├── main.py               # FastAPI app factory
│   ├── core/                 # Shared infrastructure
│   │   ├── __init__.py
│   │   ├── config.py         # Settings via pydantic-settings
│   │   ├── database.py       # Engine, session factory
│   │   ├── security.py       # JWT, password hashing
│   │   ├── dependencies.py   # Shared FastAPI dependencies
│   │   ├── exceptions.py     # Custom exception classes
│   │   └── logging.py        # Logging configuration
│   ├── features/             # Business domains
│   │   ├── __init__.py
│   │   ├── auth/
│   │   │   ├── __init__.py
│   │   │   ├── router.py     # API endpoints
│   │   │   ├── schemas.py    # Pydantic models
│   │   │   ├── services.py   # Business logic
│   │   │   └── models.py     # SQLAlchemy models
│   │   ├── users/
│   │   │   ├── __init__.py
│   │   │   ├── router.py
│   │   │   ├── schemas.py
│   │   │   ├── services.py
│   │   │   └── models.py
│   │   └── products/
│   │       ├── __init__.py
│   │       ├── router.py
│   │       ├── schemas.py
│   │       ├── services.py
│   │       └── models.py
│   └── middleware/           # Cross-cutting middleware
│       ├── __init__.py
│       ├── logging.py
│       └── error_handler.py
├── tests/
│   ├── conftest.py
│   ├── test_auth.py
│   └── test_products.py
├── .env                      # Environment variables
├── .env.example              # Template for developers
├── Dockerfile
├── docker-compose.yml
├── pyproject.toml            # Project metadata & deps
└── README.md`,
              language: 'text',
            },
            {
              title: 'App Factory with Feature Router Registration',
              description: 'Main.py that auto-discovers and registers feature routers',
              code: `# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging import setup_logging
from app.features.auth.router import router as auth_router
from app.features.users.router import router as users_router
from app.features.products.router import router as products_router

def create_app() -> FastAPI:
    """Application factory pattern for clean initialization."""
    setup_logging()

    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
    )

    # Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register feature routers
    app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
    app.include_router(users_router, prefix="/api/users", tags=["users"])
    app.include_router(products_router, prefix="/api/products", tags=["products"])

    @app.get("/health")
    async def health_check():
        return {"status": "healthy", "version": settings.VERSION}

    return app

app = create_app()`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'architecture',
            title: 'Feature-Based vs Layer-Based Structure',
            description: 'Why feature-based organization scales better than layer-based',
            layers: [
              { label: 'Feature-Based (Recommended)', items: ['features/auth/ (router + schemas + services + models)', 'features/users/ (router + schemas + services + models)', 'features/products/ (router + schemas + services + models)', 'core/ (config, database, security, logging)'] },
              { label: 'Layer-Based (Avoid)', items: ['routes/ (all routes mixed together)', 'schemas/ (all schemas mixed together)', 'services/ (all services mixed together)', 'models/ (all models mixed together)'] },
            ],
          },
          tips: [
            'Feature-based means "add a feature = add a folder", not "touch six different directories."',
            'Keep core/ small — it should only contain truly shared infrastructure, not business logic.',
            'Use an app factory (create_app()) instead of module-level app = FastAPI() for testability.',
          ],
          keyTakeaway:
            'Feature-based organization groups related code together — scaling means adding folders, not searching across the codebase.',
        },
        {
          heading: 'Configuration Separation',
          content: `Hardcoded configuration is a production anti-pattern. Every value that differs between environments — database URLs, API keys, feature flags, rate limits — must be externalized into configuration. The twelve-factor app methodology defines this principle: **store config in the environment**.

Configuration in a FastAPI application has three layers: **defaults in code** (sensible fallbacks), **environment variables** (overriding defaults per deployment), and **.env files** (convenient local development). Production deployments should never rely on .env files — they use real environment variables injected by the orchestration platform (Kubernetes, Docker, AWS ECS).

The separation of concerns is critical: your application code never reads \`os.environ\` directly. Instead, it reads from a settings object that **validated** and **typed** the environment variables at startup. If a required variable is missing, the application fails fast with a clear error message before serving a single request.`,
          codeExamples: [
            {
              title: 'Environment-Specific Configuration',
              description: 'Separate settings for development, staging, and production',
              code: `# app/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, HttpUrl
from typing import list


class DatabaseSettings(BaseSettings):
    """Database configuration group."""
    model_config = SettingsConfigDict(env_prefix="DB_")

    HOST: str = "localhost"
    PORT: int = 5432
    NAME: str = "app_dev"
    USER: str = "postgres"
    PASSWORD: str = ""
    POOL_SIZE: int = Field(default=5, ge=1, le=50)
    MAX_OVERFLOW: int = Field(default=10, ge=0, le=50)
    ECHO: bool = False

    @property
    def url(self) -> str:
        return f"postgresql+asyncpg://{self.USER}:{self.PASSWORD}@{self.HOST}:{self.PORT}/{self.NAME}"


class RedisSettings(BaseSettings):
    """Redis configuration group."""
    model_config = SettingsConfigDict(env_prefix="REDIS_")

    HOST: str = "localhost"
    PORT: int = 6379
    PASSWORD: str = ""
    DB: int = 0

    @property
    def url(self) -> str:
        auth = f":{self.PASSWORD}@" if self.PASSWORD else ""
        return f"redis://{auth}{self.HOST}:{self.PORT}/{self.DB}"


class Settings(BaseSettings):
    """Application settings — reads from .env and environment."""
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # Application
    PROJECT_NAME: str = "FastAPI App"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = Field(default="production", pattern="^(development|staging|production)$")

    # Security
    SECRET_KEY: str = Field(default="change-me-in-production")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]

    # Nested settings
    DATABASE: DatabaseSettings = DatabaseSettings()
    REDIS: RedisSettings = RedisSettings()


settings = Settings()`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'flow',
            title: 'Configuration Resolution Order',
            description: 'How settings values are resolved from multiple sources',
            steps: [
              { label: 'Hardcoded defaults', detail: 'Field(default=...) provides safe fallbacks', highlight: false },
              { label: 'Environment variables', detail: 'Override defaults — DB_HOST, SECRET_KEY, etc.', highlight: true },
              { label: '.env file (dev only)', detail: 'Convenient local development, never in production', highlight: false },
              { label: 'Pydantic validation', detail: 'Types checked, constraints enforced, fails fast on errors', highlight: true },
              { label: 'Settings object', detail: 'Your code reads from this typed, validated object', highlight: true },
            ],
          },
          tips: [
            'Never commit .env files to version control — always add them to .gitignore.',
            'Production should use real environment variables, not .env files — Docker and K8s inject them natively.',
            'Use env_prefix on nested settings groups to avoid collisions (DB_HOST vs REDIS_HOST).',
          ],
          keyTakeaway:
            'Configuration has three layers: code defaults, environment variables, and .env files — your app reads only from a validated settings object.',
        },
        {
          heading: 'Environment-Based Settings Management',
          content: `Different environments need different configurations. Development needs debug mode, verbose logging, and local database connections. Production needs optimized connection pools, minimal logging, and hardened security settings. Staging mirrors production but with test data.

The pattern that works best is a **single Settings class with environment-aware defaults**, rather than separate classes for each environment. The ENVIRONMENT variable acts as a selector that adjusts behavior. This avoids code duplication and ensures that production settings are always just a variation of what you tested in development.

For secrets management, never store production secrets in code or .env files. Use a secrets manager like AWS Secrets Manager, HashiCorp Vault, or Kubernetes Secrets. Your application loads the secret at startup and injects it into the settings object. The rest of the code never knows or cares where the secret came from.`,
          codeExamples: [
            {
              title: 'Environment-Aware Settings with Secrets',
              description: 'Single settings class that adapts based on ENVIRONMENT',
              code: `# app/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, computed_field
from typing import list
import json


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    ENVIRONMENT: str = Field(default="production", pattern="^(development|staging|production)$")
    PROJECT_NAME: str = "FastAPI App"
    VERSION: str = "1.0.0"
    SECRET_KEY: str = "change-me-in-production"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/app"
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10

    # CORS
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]

    @computed_field
    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @computed_field
    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"

    def model_post_init(self, __context) -> None:
        """Adjust defaults based on environment after validation."""
        if self.is_development:
            # Development gets more verbose settings
            object.__setattr__(self, "DEBUG", True)
            object.__setattr__(self, "LOG_LEVEL", "DEBUG")
            object.__setattr__(self, "DB_POOL_SIZE", 2)

        if self.is_production:
            # Production gets optimized settings
            object.__setattr__(self, "DB_POOL_SIZE", 20)
            object.__setattr__(self, "DB_MAX_OVERFLOW", 30)


# Load secrets from external source in production
def load_secrets() -> dict:
    """In production, load from AWS Secrets Manager / Vault / K8s Secrets."""
    # Example: AWS Secrets Manager
    # import boto3
    # client = boto3.client("secretsmanager")
    # response = client.get_secret_value(SecretId="my-app/prod")
    # return json.loads(response["SecretString"])
    return {}  # Fallback for local dev


# Initialize settings with optional secrets override
_secrets = load_secrets()
settings = Settings(**_secrets)`,
              language: 'python',
            },
            {
              title: '.env Files for Different Environments',
              description: 'Template and per-environment .env files',
              code: `# .env.example (committed to git — template for developers)
ENVIRONMENT=development
PROJECT_NAME=FastAPI App
VERSION=1.0.0
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/app_dev
DB_POOL_SIZE=2
DB_MAX_OVERFLOW=5
LOG_LEVEL=DEBUG
DEBUG=true
ALLOWED_ORIGINS=["http://localhost:3000"]

# .env.development (local development)
ENVIRONMENT=development
SECRET_KEY=dev-secret-key-not-for-production
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/app_dev
LOG_LEVEL=DEBUG
DEBUG=true

# .env.production (NEVER commit this — use platform env vars instead)
ENVIRONMENT=production
SECRET_KEY=\${VAULT_SECRET_KEY}
DATABASE_URL=\${DB_URL_FROM_PLATFORM}
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=30
LOG_LEVEL=WARNING
ALLOWED_ORIGINS=["https://myapp.com"]

# .gitignore — critical!
.env
.env.*
!.env.example`,
              language: 'text',
            },
          ],
          tips: [
            'Use computed_field for derived settings like is_production — keeps logic out of business code.',
            'Provide .env.example in git so new developers know what variables are needed.',
            'In production, inject secrets via Docker/K8s environment variables or a secrets manager — never files.',
          ],
          warning:
            'Never commit .env files with real secrets to version control. Even .env.staging with test credentials is a risk — use a secrets manager.',
          keyTakeaway:
            'One Settings class adapts to all environments via the ENVIRONMENT variable — production is a validated variant of development, not a separate codebase.',
        },
      ],
    },

    // ──────────────────────────────────────────────
    // TOPIC 2: pydantic-settings Configuration
    // ──────────────────────────────────────────────
    {
      id: 'm7-pydantic-settings',
      title: 'pydantic-settings Configuration',
      icon: '⚙️',
      introduction:
        'pydantic-settings brings the full power of Pydantic validation to your application configuration. Instead of reading raw environment variables with os.environ and manually converting types, you define a typed settings class that validates, converts, and documents every configuration value at startup.',
      sections: [
        {
          heading: 'BaseSettings Deep Dive',
          content: `BaseSettings is the core class in pydantic-settings. It extends Pydantic's BaseModel with automatic environment variable reading. Every field in your settings class is automatically populated from an environment variable with the same name. If the variable doesn't exist, the field's default value is used. If there's no default and the variable is missing, validation fails immediately at startup.

This "fail fast" behavior is one of the most valuable features. If your production deployment is missing the DATABASE_URL, you want to know before the first request, not when a user triggers a database query and gets a 500 error. BaseSettings ensures all required configuration is present and valid before your application even starts accepting requests.

The model_config on BaseSettings controls how environment variables are read: case sensitivity, prefix filtering, .env file loading, and whether extra variables are allowed or rejected.`,
          codeExamples: [
            {
              title: 'Complete BaseSettings Configuration',
              description: 'A production-grade settings class with all pydantic-settings features',
              code: `# app/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, HttpUrl, EmailStr, field_validator
from typing import list, Optional


class AppSettings(BaseSettings):
    """
    Application settings with full validation.

    Every field is populated from environment variables automatically.
    Use .env for local development, real env vars in production.
    """
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,        # DB_HOST != db_host
        extra="forbid",             # Reject unknown env vars
        env_nested_delimiter="__",  # DB__HOST maps to DATABASE.HOST
        env_prefix="APP_",         # All vars must start with APP_
    )

    # ── Application ──────────────────────────────
    PROJECT_NAME: str = Field(default="My API", min_length=1, max_length=100)
    VERSION: str = Field(default="1.0.0", pattern=r"^\\d+\\.\\d+\\.\\d+$")
    ENVIRONMENT: str = Field(
        default="production",
        pattern="^(development|staging|production)$",
        description="Deployment environment",
    )
    DEBUG: bool = Field(default=False, description="Enable debug mode")

    # ── Security ─────────────────────────────────
    SECRET_KEY: str = Field(
        ...,
        min_length=32,
        description="JWT signing key — MUST be set via env var",
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, ge=1, le=1440)
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7, ge=1, le=30)
    ALGORITHM: str = Field(default="HS256")

    # ── Database ─────────────────────────────────
    DATABASE_URL: str = Field(
        ...,
        description="Async database connection string",
    )
    DB_POOL_SIZE: int = Field(default=5, ge=1, le=100)
    DB_POOL_RECYCLE: int = Field(default=3600, description="Seconds before connection recycle")
    DB_ECHO: bool = Field(default=False, description="Log all SQL statements")

    # ── Redis ────────────────────────────────────
    REDIS_URL: str = Field(default="redis://localhost:6379/0")

    # ── CORS ─────────────────────────────────────
    ALLOWED_ORIGINS: list[str] = Field(default=["http://localhost:3000"])

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_origins(cls, v):
        """Handle both JSON string and list format for origins."""
        if isinstance(v, str):
            import json
            return json.loads(v)
        return v

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v, info):
        """Warn if using default in production."""
        if info.data.get("ENVIRONMENT") == "production" and v == "change-me":
            raise ValueError("SECRET_KEY must be changed in production!")
        return v


# Singleton instance — validated at import time
settings = AppSettings()

# Usage anywhere in your code:
# from app.core.config import settings
# print(settings.DATABASE_URL)
# print(settings.DB_POOL_SIZE)`,
              language: 'python',
              output: `# If APP_SECRET_KEY is not set:
# ValidationError: 1 validation error for AppSettings
# SECRET_KEY
#   Field required [type=missing, input_value={...}]

# If APP_ENVIRONMENT="testing" (invalid value):
# ValidationError: 1 validation error for AppSettings
# ENVIRONMENT
#   String should match pattern '^(development|staging|production)$'`,
            },
          ],
          visualization: {
            type: 'data-flow',
            title: 'How BaseSettings Resolves Values',
            description: 'The resolution chain from environment to validated Python object',
            steps: [
              { label: 'Environment variables', detail: 'APP_SECRET_KEY, APP_DATABASE_URL, etc.', highlight: false },
              { label: '.env file loaded', detail: 'Falls back to .env for local development', highlight: false },
              { label: 'env_prefix applied', detail: 'APP_ prefix stripped from variable names', highlight: true },
              { label: 'Type conversion', detail: '"5" → int(5), "true" → bool(True), JSON → list', highlight: true },
              { label: 'Field validation', detail: 'Constraints checked: min_length, ge, pattern, etc.', highlight: true },
              { label: 'Custom validators run', detail: '@field_validator functions execute', highlight: false },
              { label: 'Settings object created', detail: 'Fully typed, validated, ready to use', highlight: true },
            ],
          },
          tips: [
            'Use env_prefix to namespace your variables — avoids collisions with other services in the same environment.',
            'extra="forbid" catches typos like APP_DATBASE_URL (missing A) that would otherwise silently use defaults.',
            'Create the settings instance at module level — it validates once at import time, then is reused everywhere.',
          ],
          keyTakeaway:
            'BaseSettings validates your configuration at startup — if anything is missing or invalid, the app fails before serving a single request.',
        },
        {
          heading: '.env Files & Environment Variables',
          content: `Environment variables are the standard way to configure applications across all deployment platforms. Every cloud provider, container runtime, and CI/CD system supports them natively. .env files are a convenience layer for local development — they load key=value pairs into the process environment as if they were set by the OS.

pydantic-settings supports .env files out of the box. When you set \`env_file=".env"\` in model_config, the library reads the file and merges its values with the actual environment variables. Real environment variables always take precedence over .env file values, which means you can override .env values in your CI/CD pipeline without modifying the file.

For teams, the .env file pattern works like this: you commit a .env.example file with all the variable names and placeholder values, then each developer creates their own .env file (which is gitignored) with their local configuration. New team members copy .env.example to .env and fill in their values.`,
          codeExamples: [
            {
              title: 'Multi-Environment .env Strategy',
              description: 'Using different .env files for different environments',
              code: `# app/core/config.py
import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Settings that auto-select .env file based on ENV_MODE."""

    # Determine which .env file to load
    _env_mode: str = os.getenv("ENV_MODE", "development")

    model_config = SettingsConfigDict(
        # Load environment-specific .env file
        env_file=f".env.{os.getenv('ENV_MODE', 'development')}",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    PROJECT_NAME: str = "My API"
    DATABASE_URL: str
    SECRET_KEY: str
    REDIS_URL: str = "redis://localhost:6379/0"
    LOG_LEVEL: str = "INFO"


settings = Settings()


# ──────────────────────────────────────────────
# .env.development
# ──────────────────────────────────────────────
# PROJECT_NAME=My API (Dev)
# DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/app_dev
# SECRET_KEY=dev-secret-key-minimum-32-characters!
# REDIS_URL=redis://localhost:6379/0
# LOG_LEVEL=DEBUG

# ──────────────────────────────────────────────
# .env.staging
# ──────────────────────────────────────────────
# PROJECT_NAME=My API (Staging)
# DATABASE_URL=postgresql+asyncpg://app:password@staging-db:5432/app_staging
# SECRET_KEY=staging-secret-key-minimum-32-chars!
# REDIS_URL=redis://staging-redis:6379/0
# LOG_LEVEL=INFO

# ──────────────────────────────────────────────
# .env.production  (prefer platform env vars!)
# ──────────────────────────────────────────────
# PROJECT_NAME=My API
# DATABASE_URL=postgresql+asyncpg://app:STRONG_PASSWORD@prod-db:5432/app_prod
# SECRET_KEY=super-secure-production-key-min-32-ch
# REDIS_URL=redis://prod-redis:6379/0
# LOG_LEVEL=WARNING`,
              language: 'python',
            },
            {
              title: 'Docker Environment Variable Injection',
              description: 'How Docker and docker-compose pass environment variables',
              code: `# docker-compose.yml — inject environment variables
version: "3.9"

services:
  api:
    build: .
    environment:
      - ENV_MODE=production
      - DATABASE_URL=postgresql+asyncpg://app:password@db:5432/app
      - SECRET_KEY=\${SECRET_KEY}  # From host environment
      - REDIS_URL=redis://redis:6379/0
      - LOG_LEVEL=WARNING
    env_file:
      - .env.production  # Or load from file
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started

# Kubernetes — inject via ConfigMap and Secret
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  ENV_MODE: "production"
  LOG_LEVEL: "WARNING"
  DB_POOL_SIZE: "20"

---
# secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
stringData:
  SECRET_KEY: "your-production-secret-key"
  DATABASE_URL: "postgresql+asyncpg://app:password@db:5432/app"`,
              language: 'yaml',
            },
          ],
          tips: [
            'Real environment variables always override .env file values — use this for CI/CD overrides.',
            'Use .env.example as documentation — it shows every variable the app expects with example values.',
            'In Docker Compose, prefer the environment: key over env_file: for production — it makes values explicit.',
          ],
          warning:
            'Never put production secrets in .env files that are committed to git. Use Docker secrets, Kubernetes Secrets, or a cloud secrets manager.',
          keyTakeaway:
            '.env files are for development convenience; production uses real environment variables injected by the platform.',
        },
        {
          heading: 'Advanced Settings Patterns',
          content: `As your application grows, a single flat Settings class becomes unwieldy. You need to group related settings, share configuration across services, and handle dynamic values that change at runtime. pydantic-settings supports nested models, custom environment variable sources, and JSON-encoded environment variables for complex types.

The nested model pattern is especially powerful. By splitting your settings into logical groups — DatabaseSettings, RedisSettings, SecuritySettings — you keep each class focused and testable. The \`env_nested_delimiter\` setting (typically "\_\_") maps nested fields to flat environment variables: \`DB\_\_HOST\` maps to \`settings.DATABASE.HOST\`.

For microservice architectures, you can create a shared settings package that provides common configuration (logging, tracing, health check paths) while each service adds its own specific settings. This ensures consistency across your entire platform.`,
          codeExamples: [
            {
              title: 'Nested Settings with Custom Sources',
              description: 'Organized settings with grouped configuration and a custom source',
              code: `# app/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict, PydanticBaseSettingsSource
from pydantic import Field, field_validator
from typing import list, Optional, Any, Type
import json


class DatabaseSettings(BaseSettings):
    """Database-specific configuration."""
    model_config = SettingsConfigDict(env_prefix="DB_")

    HOST: str = "localhost"
    PORT: int = 5432
    NAME: str = "app"
    USER: str = "postgres"
    PASSWORD: str = ""
    POOL_SIZE: int = Field(default=5, ge=1, le=100)
    MAX_OVERFLOW: int = Field(default=10, ge=0)
    ECHO: bool = False

    @property
    def async_url(self) -> str:
        return f"postgresql+asyncpg://{self.USER}:{self.PASSWORD}@{self.HOST}:{self.PORT}/{self.NAME}"

    @property
    def sync_url(self) -> str:
        return f"postgresql://{self.USER}:{self.PASSWORD}@{self.HOST}:{self.PORT}/{self.NAME}"


class SecuritySettings(BaseSettings):
    """Security-specific configuration."""
    model_config = SettingsConfigDict(env_prefix="SECURITY_")

    SECRET_KEY: str = Field(default="change-me-in-production", min_length=32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, ge=1)
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7, ge=1)
    BCRYPT_ROUNDS: int = Field(default=12, ge=10, le=20)


class CorsSettings(BaseSettings):
    """CORS configuration."""
    model_config = SettingsConfigDict(env_prefix="CORS_")

    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]
    ALLOW_CREDENTIALS: bool = True
    MAX_AGE: int = 3600

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_origins(cls, v):
        if isinstance(v, str):
            return json.loads(v)
        return v


class AppSettings(BaseSettings):
    """Root application settings combining all groups."""
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
        env_nested_delimiter="__",
    )

    # Application
    PROJECT_NAME: str = "My API"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "production"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"

    # Nested groups
    DATABASE: DatabaseSettings = DatabaseSettings()
    SECURITY: SecuritySettings = SecuritySettings()
    CORS: CorsSettings = CorsSettings()

    # Computed properties
    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"

    @property
    def database_url(self) -> str:
        return self.DATABASE.async_url


# Environment variables map:
# APP_PROJECT_NAME  → settings.PROJECT_NAME
# DB_HOST           → settings.DATABASE.HOST
# DB_PORT           → settings.DATABASE.PORT
# SECURITY_SECRET_KEY → settings.SECURITY.SECRET_KEY
# CORS_ALLOWED_ORIGINS → settings.CORS.ALLOWED_ORIGINS

settings = AppSettings()`,
              language: 'python',
            },
          ],
          tips: [
            'Use env_prefix on nested settings groups to avoid variable name collisions (DB_HOST vs REDIS_HOST).',
            'The env_nested_delimiter maps flat env vars to nested objects: DB__HOST → settings.DATABASE.HOST.',
            'Add @property methods for computed values like database URLs — keeps the consuming code clean.',
          ],
          keyTakeaway:
            'Nested settings groups keep configuration organized — each domain (database, security, CORS) gets its own validated class.',
        },
      ],
    },

    // ──────────────────────────────────────────────
    // TOPIC 3: Docker & Docker Compose
    // ──────────────────────────────────────────────
    {
      id: 'm7-docker',
      title: 'Docker & Docker Compose',
      icon: '🐳',
      introduction:
        'Docker containers ensure your application runs identically everywhere — your laptop, CI/CD, staging, and production. This topic covers writing production-grade Dockerfiles, multi-stage builds for minimal image sizes, and Docker Compose for orchestrating multi-service applications with databases and caches.',
      sections: [
        {
          heading: 'Dockerizing Your FastAPI App',
          content: `A Dockerfile defines how your application is packaged into a container image. For FastAPI, this means installing Python dependencies, copying your source code, and configuring the ASGI server to run your application. The goal is a reproducible, portable image that behaves the same way regardless of where it runs.

The most common mistake is copying the entire project directory including .venv, .git, and __pycache__. The .dockerignore file prevents this — it works like .gitignore but for Docker builds. A well-crafted .dockerignore can reduce your image size by hundreds of megabytes and speed up builds significantly.

Your Dockerfile should also follow security best practices: run as a non-root user, pin base image versions, and minimize the number of layers. Each RUN, COPY, and ADD instruction creates a new layer. Combining related commands into a single RUN instruction reduces the final image size.`,
          codeExamples: [
            {
              title: 'Production Dockerfile',
              description: 'A secure, optimized Dockerfile for FastAPI applications',
              code: `# Dockerfile
# ── Stage 1: Build dependencies ────────────────
FROM python:3.12-slim AS builder

WORKDIR /build

# Install build dependencies (cached layer — only rebuilds when requirements change)
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ── Stage 2: Production image ──────────────────
FROM python:3.12-slim

# Security: create non-root user
RUN groupadd -r appuser && useradd -r -g appuser -d /app -s /sbin/nologin appuser

WORKDIR /app

# Copy installed packages from builder stage
COPY --from=builder /install /usr/local

# Copy application code
COPY app/ ./app/
COPY alembic/ ./alembic/
COPY alembic.ini .

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \\
    PYTHONUNBUFFERED=1 \\
    PYTHONPATH=/app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \\
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# Run with uvicorn — overridden by docker-compose for more workers
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]`,
              language: 'dockerfile',
            },
            {
              title: '.dockerignore',
              description: 'Prevent unnecessary files from entering the Docker image',
              code: `# .dockerignore
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
.venv/
venv/
env/
.env
.env.*
.git/
.gitignore
.github/
.idea/
.vscode/
*.md
tests/
.pytest_cache/
.mypy_cache/
.ruff_cache/
htmlcov/
.coverage
*.egg-info/
dist/
build/
Dockerfile
docker-compose*.yml
.dockerignore`,
              language: 'text',
            },
          ],
          visualization: {
            type: 'flow',
            title: 'Docker Build Process',
            description: 'How Docker builds your FastAPI image step by step',
            steps: [
              { label: 'Base image pulled', detail: 'python:3.12-slim — minimal Python runtime', highlight: false },
              { label: 'Dependencies installed', detail: 'pip install from requirements.txt (cached layer)', highlight: true },
              { label: 'Application code copied', detail: 'Only what .dockerignore allows through', highlight: true },
              { label: 'Non-root user created', detail: 'Security: appuser instead of root', highlight: false },
              { label: 'Health check defined', detail: 'HTTP check on /health endpoint', highlight: false },
              { label: 'uvicorn CMD set', detail: 'Runs FastAPI app on port 8000', highlight: true },
            ],
          },
          tips: [
            'Use python:3.12-slim instead of python:3.12 — the slim variant is ~400MB smaller.',
            'Copy requirements.txt separately before application code — Docker caches the dependency layer.',
            'Always run as a non-root user in production containers — it prevents privilege escalation attacks.',
          ],
          keyTakeaway:
            'A production Dockerfile: slim base image, cached dependency layer, minimal file copy, non-root user, and health checks.',
        },
        {
          heading: 'Multi-Stage Docker Builds',
          content: `Multi-stage builds are the key to small, secure Docker images. The idea is simple: use one stage to build and compile dependencies, then copy only the results into a second, clean stage. Build tools like gcc, make, and Python development headers are left behind, reducing your image size by 50-80%.

For FastAPI applications with C-extension dependencies (like psycopg2, cryptography, or numpy), multi-stage builds are essential. The builder stage installs compile-time dependencies, builds the wheels, then the production stage copies only the installed packages — no compiler, no development headers, no build artifacts.

The result is an image that's smaller, faster to pull, and has a dramatically reduced attack surface. Fewer packages means fewer vulnerabilities. A 900MB image becomes 200MB. Startup time improves. Deployments are faster.`,
          codeExamples: [
            {
              title: 'Optimized Multi-Stage Dockerfile',
              description: 'Builder pattern that produces a minimal production image',
              code: `# ── Stage 1: Builder ──────────────────────────
FROM python:3.12-slim AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \\
    build-essential \\
    libpq-dev \\
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# Create virtual environment in builder
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies into venv
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Stage 2: Runner (production) ───────────────
FROM python:3.12-slim

# Install only runtime dependencies (no build tools!)
RUN apt-get update && apt-get install -y --no-install-recommends \\
    libpq5 \\
    && rm -rf /var/lib/apt/lists/* \\
    && groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

# Copy virtual environment from builder (contains all installed packages)
COPY --from=builder /opt/venv /opt/venv

# Set path to use venv
ENV PATH="/opt/venv/bin:$PATH" \\
    PYTHONDONTWRITEBYTECODE=1 \\
    PYTHONUNBUFFERED=1

# Copy application code
COPY --chown=appuser:appuser app/ ./app/
COPY --chown=appuser:appuser alembic/ ./alembic/
COPY --chown=appuser:appuser alembic.ini .

USER appuser
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]

# Image size comparison:
# Single stage:  ~900MB (includes gcc, dev headers, build artifacts)
# Multi-stage:  ~200MB (only Python runtime + installed packages)`,
              language: 'dockerfile',
            },
          ],
          visualization: {
            type: 'comparison',
            title: 'Single-Stage vs Multi-Stage Build',
            description: 'Image size and content comparison',
            columns: [
              {
                title: 'Single-Stage',
                items: ['Image size: ~900MB', 'Includes: gcc, make, dev headers', 'Build artifacts: present', 'Attack surface: large', 'Pull time: slow', 'Vulnerabilities: many'],
              },
              {
                title: 'Multi-Stage',
                items: ['Image size: ~200MB', 'Includes: Python + packages only', 'Build artifacts: removed', 'Attack surface: minimal', 'Pull time: fast', 'Vulnerabilities: few'],
              },
            ],
          },
          tips: [
            'Use --no-install-recommends with apt-get to skip non-essential packages.',
            'The builder stage uses a virtual environment (/opt/venv) — copy the entire venv to the runner stage.',
            'Clean up apt caches with rm -rf /var/lib/apt/lists/* in the same RUN layer to avoid bloating the image.',
          ],
          keyTakeaway:
            'Multi-stage builds cut image size by 50-80%: build in one stage, copy only results to a clean production stage.',
        },
        {
          heading: 'Docker Compose with Database & Redis',
          content: `Docker Compose orchestrates multi-container applications. For a typical FastAPI stack, you need at least three services: the API server, a PostgreSQL database, and a Redis cache. Docker Compose defines all of them in a single file, connects them on a shared network, and manages their lifecycle.

The key concepts are: **service dependencies** (the API waits for the database to be healthy), **volume persistence** (database data survives container restarts), **network isolation** (services communicate on an internal network), and **environment variable injection** (each service gets its configuration). With health checks and depends_on conditions, your API won't start trying to connect to a database that isn't ready yet.

Docker Compose also supports profiles for running different service sets. The development profile might include admin tools like pgAdmin and Redis Commander, while the production profile strips these out.`,
          codeExamples: [
            {
              title: 'Complete docker-compose.yml',
              description: 'Production-ready compose file with API, database, Redis, and migration service',
              code: `# docker-compose.yml
version: "3.9"

services:
  # ── PostgreSQL Database ───────────────────────
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: \${DB_PASSWORD:-postgres}
      POSTGRES_DB: app
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # ── Redis Cache ───────────────────────────────
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --requirepass \${REDIS_PASSWORD:-}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # ── Database Migrations ───────────────────────
  migrate:
    build: .
    command: alembic upgrade head
    environment:
      DATABASE_URL: postgresql+asyncpg://app:\${DB_PASSWORD:-postgres}@db:5432/app
    depends_on:
      db:
        condition: service_healthy
    restart: "no"  # Run once, don't restart

  # ── FastAPI Application ───────────────────────
  api:
    build: .
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
    environment:
      ENVIRONMENT: production
      DATABASE_URL: postgresql+asyncpg://app:\${DB_PASSWORD:-postgres}@db:5432/app
      REDIS_URL: redis://redis:6379/0
      SECRET_KEY: \${SECRET_KEY}
      LOG_LEVEL: WARNING
    ports:
      - "8000:8000"
    depends_on:
      migrate:
        condition: service_completed_successfully
      redis:
        condition: service_healthy
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: "1.0"

volumes:
  postgres_data:
  redis_data:`,
              language: 'yaml',
            },
            {
              title: 'Development Compose Override',
              description: 'docker-compose.override.yml for local development (auto-merged by Docker)',
              code: `# docker-compose.override.yml
# This file is automatically merged with docker-compose.yml
# Only used for local development

version: "3.9"

services:
  api:
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    environment:
      ENVIRONMENT: development
      LOG_LEVEL: DEBUG
      DB_ECHO: "true"
    volumes:
      - ./app:/app/app:ro  # Mount source for hot reload
    ports:
      - "8000:8000"
      - "5678:5678"  # Debug port

  # Admin tools — only in development
  pgadmin:
    image: dpage/pgadmin4
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@admin.com
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    profiles:
      - debug

  redis-commander:
    image: rediscommander/redis-commander
    environment:
      REDIS_HOSTS: local:redis:6379
    ports:
      - "8081:8081"
    profiles:
      - debug`,
              language: 'yaml',
            },
          ],
          visualization: {
            type: 'architecture',
            title: 'Docker Compose Service Architecture',
            description: 'How services connect and depend on each other',
            layers: [
              { label: 'External Access', items: ['Port 8000 → API', 'Port 5432 → DB (dev only)', 'Port 6379 → Redis (dev only)'] },
              { label: 'Application', items: ['FastAPI (uvicorn, 4 workers)', 'Alembic (migration runner)'] },
              { label: 'Data Layer', items: ['PostgreSQL 16 (persistent volume)', 'Redis 7 (AOF persistence)'] },
              { label: 'Docker Network', items: ['Internal DNS: db, redis, api', 'Shared volume: postgres_data, redis_data'] },
            ],
          },
          tips: [
            'Use depends_on with healthcheck conditions — prevents your API from connecting to an unready database.',
            'Docker Compose auto-merges docker-compose.override.yml — perfect for dev-specific config like hot reload.',
            'Use profiles for optional debug tools (pgAdmin, Redis Commander) — docker compose --profile debug up.',
          ],
          warning:
            'Never expose database or Redis ports in production. The ports: mapping is for development only — in production, use internal Docker networking.',
          keyTakeaway:
            'Docker Compose orchestrates your entire stack: API, database, cache, and migrations — all connected, health-checked, and restartable.',
        },
      ],
    },

    // ──────────────────────────────────────────────
    // TOPIC 4: WebSocket Real-Time Communication
    // ──────────────────────────────────────────────
    {
      id: 'm7-websocket',
      title: 'WebSocket Real-Time Communication',
      icon: '🔌',
      introduction:
        'WebSocket enables full-duplex, persistent connections between client and server — essential for real-time features like chat, live notifications, collaborative editing, and streaming data. FastAPI provides first-class WebSocket support with built-in route handlers and connection lifecycle management.',
      sections: [
        {
          heading: 'WebSocket Endpoints in FastAPI',
          content: `FastAPI's WebSocket support is built on Starlette's WebSocket implementation. A WebSocket endpoint handles the full connection lifecycle: accepting the connection, receiving messages, sending messages, and handling disconnections. Unlike HTTP endpoints that process one request and return a response, WebSocket endpoints maintain an open connection and exchange messages in both directions.

The key difference from HTTP is statefulness. An HTTP request is stateless — each request is independent. A WebSocket connection is stateful — the server remembers the client for the duration of the connection. This means you need to manage connection lifecycle carefully: accept connections, track active connections, handle unexpected disconnections, and clean up resources.

The \`WebSocket\` object provides \`accept()\` to initiate the connection, \`receive_text()\` / \`receive_json()\` to get messages, and \`send_text()\` / \`send_json()\` to push messages to the client. When the client disconnects, \`receive_text()\` raises a \`WebSocketDisconnect\` exception that you should catch to perform cleanup.`,
          codeExamples: [
            {
              title: 'Basic WebSocket Endpoint',
              description: 'A simple echo WebSocket that demonstrates the connection lifecycle',
              code: `# app/features/chat/router.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import list
import json

router = APIRouter()


class ConnectionManager:
    """Manages active WebSocket connections."""

    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        """Accept and register a new connection."""
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        """Remove a connection from the registry."""
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        """Send a message to a specific client."""
        await websocket.send_text(message)

    async def broadcast(self, message: str, sender: WebSocket | None = None):
        """Send a message to all connected clients (optionally exclude sender)."""
        disconnected = []
        for connection in self.active_connections:
            if connection == sender:
                continue
            try:
                await connection.send_text(message)
            except Exception:
                disconnected.append(connection)
        # Clean up broken connections
        for conn in disconnected:
            self.active_connections.remove(conn)


manager = ConnectionManager()


@router.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    """
    WebSocket endpoint for real-time chat.
    Handles connection, messaging, and disconnection.
    """
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            # Echo back to sender with confirmation
            await manager.send_personal_message(
                json.dumps({"type": "ack", "message": message}),
                websocket,
            )

            # Broadcast to all other clients
            await manager.broadcast(
                json.dumps({
                    "type": "message",
                    "content": message.get("content", ""),
                    "timestamp": message.get("timestamp"),
                }),
                sender=websocket,
            )
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.broadcast(
            json.dumps({"type": "user_left", "count": len(manager.active_connections)})
        )`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'sequence',
            title: 'WebSocket Connection Lifecycle',
            description: 'How a WebSocket connection is established, used, and terminated',
            steps: [
              { label: 'Client sends HTTP upgrade request', detail: 'GET /ws/chat with Upgrade: websocket header', highlight: true },
              { label: 'Server accepts connection', detail: 'websocket.accept() — connection is now duplex', highlight: true },
              { label: 'Client sends message', detail: 'websocket.receive_text() captures it', highlight: false },
              { label: 'Server processes & responds', detail: 'websocket.send_text() or send_json()', highlight: false },
              { label: 'Server broadcasts to others', detail: 'manager.broadcast() sends to all other connections', highlight: false },
              { label: 'Client disconnects', detail: 'WebSocketDisconnect exception raised', highlight: true },
              { label: 'Server cleans up', detail: 'manager.disconnect() removes from active list', highlight: true },
            ],
          },
          tips: [
            'Always catch WebSocketDisconnect — clients can close connections unexpectedly at any time.',
            'Use send_json() and receive_json() for structured data instead of raw text.',
            'Clean up broken connections during broadcast — a send failure means the client is gone.',
          ],
          keyTakeaway:
            'WebSocket endpoints manage persistent connections: accept, receive/send, broadcast, and handle disconnections with proper cleanup.',
        },
        {
          heading: 'Connection Management Patterns',
          content: `Real-world WebSocket applications need sophisticated connection management. You need to track which users are connected, handle reconnections gracefully, limit the number of concurrent connections, and route messages to the right recipients. The basic ConnectionManager pattern from the previous section works for simple cases, but production applications need more structure.

The key patterns are: **connection registry** (track connections by user ID or session), **heartbeat/ping-pong** (detect dead connections before they accumulate), **connection limits** (prevent resource exhaustion), and **graceful reconnection** (allow clients to resume after network interruptions).

A common production pattern uses a dictionary mapping user IDs to their WebSocket connections. This allows you to send targeted messages — "notify user 42 that their order shipped" — without broadcasting to everyone. When a user connects from multiple devices, you store a list of connections per user.`,
          codeExamples: [
            {
              title: 'Production Connection Manager with User Tracking',
              description: 'A robust connection manager that tracks users, handles heartbeats, and limits connections',
              code: `# app/core/websocket.py
import asyncio
import time
from fastapi import WebSocket, WebSocketDisconnect
from typing import dict
from collections import defaultdict
import logging
import json

logger = logging.getLogger(__name__)


class WebSocketConnectionManager:
    """
    Production-grade WebSocket connection manager.

    Features:
    - User-based connection tracking (multiple devices per user)
    - Room-based message routing
    - Heartbeat/ping-pong for dead connection detection
    - Connection limits per user
    - Automatic cleanup of stale connections
    """

    MAX_CONNECTIONS_PER_USER = 5
    MAX_TOTAL_CONNECTIONS = 1000
    HEARTBEAT_INTERVAL = 30  # seconds
    STALE_CONNECTION_TIMEOUT = 60  # seconds

    def __init__(self):
        # user_id → list of WebSocket connections
        self._user_connections: dict[int, list[WebSocket]] = defaultdict(list)
        # room_id → set of user_ids
        self._rooms: dict[str, set[int]] = defaultdict(set)
        # websocket → metadata
        self._connection_meta: dict[WebSocket, dict] = {}
        self._lock = asyncio.Lock()

    @property
    def total_connections(self) -> int:
        return sum(len(conns) for conns in self._user_connections.values())

    async def connect(self, websocket: WebSocket, user_id: int, room: str | None = None):
        """Accept a new connection with validation."""
        async with self._lock:
            # Check connection limits
            if self.total_connections >= self.MAX_TOTAL_CONNECTIONS:
                await websocket.close(code=1013, reason="Server at capacity")
                return False

            if len(self._user_connections[user_id]) >= self.MAX_CONNECTIONS_PER_USER:
                await websocket.close(code=1013, reason="Too many connections for this user")
                return False

            await websocket.accept()

            # Track the connection
            self._user_connections[user_id].append(websocket)
            self._connection_meta[websocket] = {
                "user_id": user_id,
                "room": room,
                "connected_at": time.time(),
                "last_ping": time.time(),
            }

            # Join room if specified
            if room:
                self._rooms[room].add(user_id)

            logger.info(f"User {user_id} connected. Total: {self.total_connections}")
            return True

    async def disconnect(self, websocket: WebSocket):
        """Remove a connection and clean up."""
        async with self._lock:
            meta = self._connection_meta.pop(websocket, None)
            if not meta:
                return

            user_id = meta["user_id"]
            room = meta["room"]

            # Remove from user connections
            if websocket in self._user_connections[user_id]:
                self._user_connections[user_id].remove(websocket)

            # Clean up empty user entries
            if not self._user_connections[user_id]:
                del self._user_connections[user_id]
                # Remove from rooms
                if room and room in self._rooms:
                    self._rooms[room].discard(user_id)
                    if not self._rooms[room]:
                        del self._rooms[room]

            logger.info(f"User {user_id} disconnected. Total: {self.total_connections}")

    async def send_to_user(self, user_id: int, message: dict):
        """Send a message to all connections of a specific user."""
        connections = self._user_connections.get(user_id, [])
        disconnected = []
        for ws in connections:
            try:
                await ws.send_json(message)
            except Exception:
                disconnected.append(ws)
        for ws in disconnected:
            await self.disconnect(ws)

    async def broadcast_to_room(self, room: str, message: dict, exclude_user: int | None = None):
        """Send a message to all users in a room."""
        user_ids = self._rooms.get(room, set())
        for user_id in user_ids:
            if user_id == exclude_user:
                continue
            await self.send_to_user(user_id, message)

    async def handle_heartbeat(self, websocket: WebSocket):
        """Start a heartbeat loop for a connection."""
        try:
            while True:
                await asyncio.sleep(self.HEARTBEAT_INTERVAL)
                meta = self._connection_meta.get(websocket)
                if not meta:
                    break
                try:
                    await websocket.send_json({"type": "ping"})
                    meta["last_ping"] = time.time()
                except Exception:
                    await self.disconnect(websocket)
                    break
        except asyncio.CancelledError:
            pass

    def get_room_users(self, room: str) -> list[int]:
        """Get list of user IDs in a room."""
        return list(self._rooms.get(room, set()))

    def get_online_user_count(self) -> int:
        """Get total number of unique online users."""
        return len(self._user_connections)


# Singleton instance
ws_manager = WebSocketConnectionManager()`,
              language: 'python',
            },
          ],
          tips: [
            'Use asyncio.Lock when modifying shared connection state — race conditions cause duplicate entries and missed cleanups.',
            'Set MAX_CONNECTIONS_PER_USER to prevent a single user from monopolizing server resources.',
            'Send periodic ping messages — if the client doesn\'t respond, the connection is dead and should be cleaned up.',
          ],
          warning:
            'WebSocket connections consume memory and file descriptors. Without connection limits and cleanup, a connection leak will eventually crash your server.',
          keyTakeaway:
            'Production WebSocket managers track connections by user, enforce limits, handle heartbeats, and clean up stale connections automatically.',
        },
        {
          heading: 'Broadcasting & Room-Based Communication',
          content: `Most real-time applications need room-based communication — chat rooms, collaborative documents, live auction bidding, or multiplayer game lobbies. The concept is simple: users join a "room," and messages sent to that room are delivered to all members. When a user leaves or disconnects, they're removed from the room.

FastAPI WebSocket endpoints integrate naturally with the room pattern. When a client connects, they send a "join" message specifying which room they want to enter. The server adds them to the room's connection list. When a message arrives, the server broadcasts it to all other room members. When the client disconnects, the server removes them from the room.

For horizontal scaling (multiple server instances), you need a pub/sub backend like Redis. Each server instance subscribes to Redis channels for its rooms. When a message is published to a channel, all server instances receive it and broadcast to their local connections. This pattern allows your WebSocket infrastructure to scale across multiple machines.`,
          codeExamples: [
            {
              title: 'Room-Based Chat with Redis Pub/Sub',
              description: 'Scalable room communication that works across multiple server instances',
              code: `# app/features/chat/router.py
import asyncio
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from app.core.websocket import ws_manager
from app.core.security import verify_token

router = APIRouter()


async def authenticate_websocket(websocket: WebSocket) -> dict | None:
    """Extract and verify JWT from WebSocket query params."""
    token = websocket.query_params.get("token")
    if not token:
        return None
    try:
        from app.core.security import decode_access_token
        payload = decode_access_token(token)
        return payload
    except Exception:
        return None


@router.websocket("/ws/chat/{room_id}")
async def websocket_room_chat(websocket: WebSocket, room_id: str):
    """
    Room-based WebSocket chat endpoint.

    URL: ws://host/ws/chat/room42?token=JWT_TOKEN
    """
    # Authenticate before accepting connection
    user = await authenticate_websocket(websocket)
    if not user:
        await websocket.close(code=4001, reason="Authentication failed")
        return

    user_id = user["user_id"]
    username = user.get("username", "Anonymous")

    # Connect and join room
    connected = await ws_manager.connect(websocket, user_id, room=room_id)
    if not connected:
        return

    # Notify room that user joined
    await ws_manager.broadcast_to_room(
        room_id,
        {
            "type": "user_joined",
            "user_id": user_id,
            "username": username,
            "online_count": len(ws_manager.get_room_users(room_id)),
        },
    )

    # Start heartbeat in background
    heartbeat_task = asyncio.create_task(ws_manager.handle_heartbeat(websocket))

    try:
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            message_type = data.get("type", "message")

            if message_type == "message":
                # Broadcast chat message to room
                await ws_manager.broadcast_to_room(
                    room_id,
                    {
                        "type": "message",
                        "user_id": user_id,
                        "username": username,
                        "content": data.get("content", ""),
                        "timestamp": data.get("timestamp"),
                    },
                    exclude_user=user_id,
                )
                # Send acknowledgment to sender
                await ws_manager.send_to_user(user_id, {"type": "ack"})

            elif message_type == "typing":
                # Notify room that user is typing
                await ws_manager.broadcast_to_room(
                    room_id,
                    {"type": "typing", "user_id": user_id, "username": username},
                    exclude_user=user_id,
                )

            elif message_type == "pong":
                # Heartbeat response — update last ping time
                meta = ws_manager._connection_meta.get(websocket)
                if meta:
                    meta["last_ping"] = asyncio.get_event_loop().time()

    except WebSocketDisconnect:
        pass
    finally:
        heartbeat_task.cancel()
        await ws_manager.disconnect(websocket)
        await ws_manager.broadcast_to_room(
            room_id,
            {
                "type": "user_left",
                "user_id": user_id,
                "username": username,
                "online_count": len(ws_manager.get_room_users(room_id)),
            },
        )


# ── Redis Pub/Sub for Horizontal Scaling ────────
# For multi-instance deployments, add Redis pub/sub:

import redis.asyncio as aioredis

class RedisPubSub:
    """Enables WebSocket broadcasting across multiple server instances."""

    def __init__(self, redis_url: str):
        self.redis = aioredis.from_url(redis_url)
        self.pubsub = self.redis.pubsub()

    async def publish(self, room: str, message: dict):
        """Publish a message to a room's Redis channel."""
        await self.redis.publish(f"room:{room}", json.dumps(message))

    async def subscribe(self, room: str):
        """Subscribe to a room's Redis channel."""
        await self.pubsub.subscribe(f"room:{room}")

    async def listen(self, callback):
        """Listen for messages and call the callback."""
        async for message in self.pubsub.listen():
            if message["type"] == "message":
                data = json.loads(message["data"])
                await callback(data)`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'architecture',
            title: 'WebSocket Architecture with Redis Pub/Sub',
            description: 'How multiple server instances share WebSocket messages',
            layers: [
              { label: 'Clients', items: ['Browser (ws://)', 'Mobile App', 'Desktop Client'] },
              { label: 'Server Instances', items: ['Instance 1: local connections', 'Instance 2: local connections', 'Instance N: local connections'] },
              { label: 'Redis Pub/Sub', items: ['room:general channel', 'room:engineering channel', 'Broadcasts to all instances'] },
              { label: 'Persistence', items: ['Message history in PostgreSQL', 'Connection state in Redis'] },
            ],
          },
          tips: [
            'Authenticate WebSocket connections before accepting them — pass the JWT token as a query parameter.',
            'Use Redis Pub/Sub when you have more than one server instance — messages from one instance reach all clients.',
            'Send typing indicators with a debounce — don\'t broadcast every keystroke, throttle to once per second.',
          ],
          keyTakeaway:
            'Room-based WebSocket with Redis Pub/Sub scales horizontally: each instance handles local connections, Redis distributes messages across instances.',
        },
      ],
    },

    // ──────────────────────────────────────────────
    // TOPIC 5: Error Handling & Logging
    // ──────────────────────────────────────────────
    {
      id: 'm7-error-logging',
      title: 'Error Handling & Logging',
      icon: '📋',
      introduction:
        'Production applications need structured error handling and logging that goes far beyond print statements. Structured logs enable search and aggregation, proper error responses protect your API from leaking internals, and error tracking services alert you to problems before users report them.',
      sections: [
        {
          heading: 'Structured Logging',
          content: `Structured logging outputs log entries as JSON objects instead of formatted text strings. This is critical in production because log aggregation systems (ELK, Datadog, CloudWatch) can parse, search, and alert on structured logs efficiently. Searching for "all 500 errors from the payments service in the last hour" is trivial with structured logs and nearly impossible with plain text.

Python's standard logging library can output JSON with a custom formatter. The key fields every log entry should have are: timestamp, level, message, logger name, and request-specific context (request_id, user_id, path). Additional fields like duration_ms, status_code, and error_details provide rich observability.

The pattern is to configure structured logging once at application startup, then use the standard logging.getLogger(__name__) pattern throughout your code. Each module gets its own logger, and the configuration ensures all output is consistently formatted.`,
          codeExamples: [
            {
              title: 'JSON Structured Logging Configuration',
              description: 'Production-grade logging setup with JSON output and request context',
              code: `# app/core/logging.py
import logging
import json
import sys
from datetime import datetime, timezone
from typing import Any
from pythonjsonlogger import json as jsonlogger


class CustomJsonFormatter(jsonlogger.JsonFormatter):
    """Custom JSON formatter with standard fields."""

    def add_fields(self, log_record: dict, record: logging.LogRecord, message_dict: dict):
        super().add_fields(log_record, record, message_dict)

        # Standard fields
        log_record["timestamp"] = datetime.now(timezone.utc).isoformat()
        log_record["level"] = record.levelname
        log_record["logger"] = record.name
        log_record["module"] = record.module
        log_record["function"] = record.funcName
        log_record["line"] = record.lineno

        # Remove redundant fields
        log_record.pop("exc_info", None)


class RequestContextFilter(logging.Filter):
    """Add request-specific context to all log entries."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = getattr(record, "request_id", "-")
        record.user_id = getattr(record, "user_id", "-")
        record.path = getattr(record, "path", "-")
        record.method = getattr(record, "method", "-")
        return True


def setup_logging(log_level: str = "INFO"):
    """Configure structured JSON logging for the application."""
    formatter = CustomJsonFormatter(
        "%(timestamp)s %(level)s %(logger)s %(message)s "
        "%(request_id)s %(user_id)s %(path)s %(method)s"
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)
    handler.addFilter(RequestContextFilter())

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level.upper()))
    root_logger.handlers = [handler]

    # Quiet down noisy libraries
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)


# Usage throughout the application:
# import logging
# logger = logging.getLogger(__name__)
# logger.info("User logged in", extra={"user_id": 42, "request_id": "abc123"})`,
              language: 'python',
              output: `# Log output (formatted for readability):
{
  "timestamp": "2024-01-15T10:30:45.123456+00:00",
  "level": "INFO",
  "logger": "app.features.auth.services",
  "message": "User logged in",
  "request_id": "abc123",
  "user_id": 42,
  "path": "/api/auth/login",
  "method": "POST",
  "module": "services",
  "function": "login",
  "line": 45
}

# Error log:
{
  "timestamp": "2024-01-15T10:31:02.456789+00:00",
  "level": "ERROR",
  "logger": "app.features.orders.services",
  "message": "Payment processing failed",
  "request_id": "def456",
  "user_id": 42,
  "path": "/api/orders/123/pay",
  "method": "POST",
  "exc_info": "StripeError: Card declined",
  "order_id": 123
}`,
            },
            {
              title: 'Request Logging Middleware',
              description: 'Middleware that logs every request with timing and status',
              code: `# app/middleware/logging.py
import time
import uuid
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    """Log every HTTP request with timing, status, and request ID."""

    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))

        # Attach context for downstream loggers
        start_time = time.time()

        logger.info(
            f"Request started: {request.method} {request.url.path}",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "user_id": getattr(request.state, "user_id", "-"),
                "client_ip": request.client.host if request.client else "-",
            },
        )

        try:
            response = await call_next(request)
            duration_ms = round((time.time() - start_time) * 1000, 2)

            logger.info(
                f"Request completed: {request.method} {request.url.path} "
                f"→ {response.status_code} in {duration_ms}ms",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": response.status_code,
                    "duration_ms": duration_ms,
                },
            )

            # Add request ID to response headers
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Process-Time"] = f"{duration_ms}ms"
            return response

        except Exception as exc:
            duration_ms = round((time.time() - start_time) * 1000, 2)
            logger.error(
                f"Request failed: {request.method} {request.url.path}",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "duration_ms": duration_ms,
                    "error": str(exc),
                },
                exc_info=True,
            )
            raise`,
              language: 'python',
            },
          ],
          tips: [
            'Log to stdout, not files — Docker and K8s capture stdout and send it to log aggregators.',
            'Always include request_id in logs — it lets you trace a single request across multiple services.',
            'Use logger.info() with extra={} for structured fields — don\'t format everything into the message string.',
          ],
          keyTakeaway:
            'Structured JSON logging enables powerful search and alerting — every log entry should have timestamp, level, request_id, and relevant context.',
        },
        {
          heading: 'Production Error Handling',
          content: `Development error pages show stack traces, local variables, and source code — everything an attacker needs to find vulnerabilities. In production, you must never expose internal details. Instead, return generic error messages with a reference ID that maps to the detailed server-side log.

FastAPI's exception handling is layered: first, Pydantic validation errors (422), then your custom business exceptions, then HTTPException, and finally unhandled exceptions (500). For production, you need a global exception handler that catches everything, logs the full details server-side, and returns a sanitized response to the client.

The pattern is: catch all exceptions at the middleware level, generate a unique error reference ID, log the full exception with context, and return a JSON response that includes only the reference ID and a generic message. Support can then look up the reference ID in the logs to diagnose the issue.`,
          codeExamples: [
            {
              title: 'Global Exception Handlers',
              description: 'Production error handling that hides internals from clients',
              code: `# app/core/exceptions.py
from fastapi import Request, FastAPI
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging
import uuid
import traceback

logger = logging.getLogger(__name__)


class AppException(Exception):
    """Base application exception with structured details."""

    def __init__(self, status_code: int, detail: str, error_code: str = None):
        self.status_code = status_code
        self.detail = detail
        self.error_code = error_code or f"ERR_{status_code}"
        super().__init__(detail)


class NotFoundError(AppException):
    def __init__(self, resource: str, resource_id: int | str):
        super().__init__(
            status_code=404,
            detail=f"{resource} with id '{resource_id}' not found",
            error_code="NOT_FOUND",
        )


class ConflictError(AppException):
    def __init__(self, detail: str):
        super().__init__(status_code=409, detail=detail, error_code="CONFLICT")


class ForbiddenError(AppException):
    def __init__(self, detail: str = "You don't have permission to perform this action"):
        super().__init__(status_code=403, detail=detail, error_code="FORBIDDEN")


def register_exception_handlers(app: FastAPI):
    """Register all exception handlers on the FastAPI app."""

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        """Handle custom application exceptions."""
        logger.warning(
            f"App exception: {exc.error_code} - {exc.detail}",
            extra={
                "request_id": getattr(request.state, "request_id", "-"),
                "path": request.url.path,
                "error_code": exc.error_code,
                "status_code": exc.status_code,
            },
        )
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": exc.error_code,
                    "message": exc.detail,
                }
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        """Handle Pydantic validation errors with cleaner formatting."""
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
                    "details": errors,
                }
            },
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        """Handle standard HTTP exceptions."""
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": f"HTTP_{exc.status_code}",
                    "message": exc.detail,
                }
            },
        )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        """Catch-all handler — never expose internal details in production."""
        error_id = str(uuid.uuid4())
        logger.error(
            f"Unhandled exception [{error_id}]: {str(exc)}",
            extra={
                "error_id": error_id,
                "request_id": getattr(request.state, "request_id", "-"),
                "path": request.url.path,
                "method": request.method,
            },
            exc_info=True,
        )
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "An unexpected error occurred. Please try again later.",
                    "reference_id": error_id,
                }
            },
        )`,
              language: 'python',
            },
          ],
          tips: [
            'Always return a reference_id for 500 errors — it maps the client\'s error to your server-side logs.',
            'Custom exception classes (NotFoundError, ConflictError) make your business logic more readable.',
            'Never include stack traces, file paths, or SQL queries in production error responses.',
          ],
          warning:
            'A stack trace in a production error response is a security vulnerability — it reveals your internal architecture to attackers.',
          keyTakeaway:
            'Production error handling: catch everything, log the details server-side, return sanitized responses with reference IDs for debugging.',
        },
        {
          heading: 'Error Tracking & Monitoring',
          content: `Structured logging tells you what happened, but error tracking services like Sentry tell you how often it happened, who it affected, and what the trends are. Sentry captures unhandled exceptions, groups them by root cause (not just error message), and alerts you when error rates spike.

The integration pattern is straightforward: initialize the Sentry SDK at application startup with your DSN and environment, and it automatically captures all unhandled exceptions. You can also manually capture handled exceptions with \`capture_exception()\` when you want tracking without changing the user-facing behavior.

Beyond error tracking, production monitoring needs health checks, metrics, and alerting. Health checks answer "is this service running?" Metrics answer "how well is it running?" Alerting answers "who needs to know when something goes wrong?" Together, they form the observability triangle that keeps your production system reliable.`,
          codeExamples: [
            {
              title: 'Sentry Integration & Health Checks',
              description: 'Error tracking with Sentry plus health check endpoints for monitoring',
              code: `# app/core/monitoring.py
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlAlchemyIntegration
from sentry_sdk.integration.redis import RedisIntegration


def init_sentry(dsn: str, environment: str, release: str, traces_sample_rate: float = 0.1):
    """Initialize Sentry for error tracking and performance monitoring."""
    if not dsn:
        return

    sentry_sdk.init(
        dsn=dsn,
        environment=environment,
        release=release,
        traces_sample_rate=traces_sample_rate,
        integrations=[
            FastApiIntegration(),
            SqlAlchemyIntegration(),
            RedisIntegration(),
        ],
        # Don't send PII
        send_default_pii=False,
        # Filter out health check noise
        before_send=filter_transaction,
    )


def filter_transaction(event, hint):
    """Filter out health check and readiness transactions from Sentry."""
    if event.get("request", {}).get("url", "").endswith("/health"):
        return None
    if event.get("request", {}).get("url", "").endswith("/ready"):
        return None
    return event


# ── Health Check Endpoints ──────────────────────
# app/features/monitoring/router.py
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
import redis.asyncio as aioredis

router = APIRouter()


@router.get("/health")
async def health_check():
    """Liveness probe — is the service running?"""
    return {"status": "healthy"}


@router.get("/ready")
async def readiness_check(db: AsyncSession = Depends(get_db)):
    """Readiness probe — is the service ready to accept traffic?"""
    checks = {"database": False, "redis": False}

    # Check database connectivity
    try:
        await db.execute(text("SELECT 1"))
        checks["database"] = True
    except Exception:
        pass

    # Check Redis connectivity
    try:
        redis_client = aioredis.from_url("redis://localhost:6379/0")
        await redis_client.ping()
        await redis_client.close()
        checks["redis"] = True
    except Exception:
        pass

    all_healthy = all(checks.values())
    return {
        "status": "ready" if all_healthy else "degraded",
        "checks": checks,
    }`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'flow',
            title: 'Error Tracking Flow',
            description: 'How errors flow from your application to alerting',
            steps: [
              { label: 'Exception occurs', detail: 'Unhandled or manually captured exception', highlight: true },
              { label: 'Sentry SDK captures', detail: 'Stack trace, request context, user info, breadcrumbs', highlight: true },
              { label: 'Event grouped by fingerprint', detail: 'Same root cause = same issue in Sentry', highlight: false },
              { label: 'Alert rules evaluated', detail: 'Error rate > threshold? New error type?', highlight: true },
              { label: 'Notification sent', detail: 'Slack, email, PagerDuty, or webhook', highlight: false },
              { label: 'Structured log also written', detail: 'Error ID links Sentry issue to log entry', highlight: false },
            ],
          },
          tips: [
            'Set traces_sample_rate to 0.1 in production (10% of transactions) — 100% is expensive and unnecessary.',
            'Filter health check requests from Sentry — they create noise and inflate your event quota.',
            'Use Sentry\'s release tracking to correlate deployments with error rate changes.',
          ],
          keyTakeaway:
            'Error tracking (Sentry) captures exceptions with context and groups them by root cause — health checks and metrics complete the observability picture.',
        },
      ],
    },

    // ──────────────────────────────────────────────
    // TOPIC 6: Performance Optimization
    // ──────────────────────────────────────────────
    {
      id: 'm7-performance',
      title: 'Performance Optimization',
      icon: '⚡',
      introduction:
        'FastAPI is already one of the fastest Python frameworks, but production workloads demand more than framework speed. Database queries, serialization, connection management, and caching strategies all impact real-world performance. This topic covers the optimizations that matter most in production.',
      sections: [
        {
          heading: 'Caching Strategies',
          content: `Caching is the single most impactful performance optimization for most APIs. A database query that takes 50ms becomes a 1ms Redis lookup. For high-traffic endpoints, caching can reduce database load by 90% and cut response times by 95%. The key is knowing what to cache, when to invalidate, and how to structure your cache keys.

The three caching strategies are: **cache-aside** (application checks cache first, then database), **write-through** (application writes to cache and database simultaneously), and **write-behind** (application writes to cache, database is updated asynchronously). Cache-aside is the most common and the safest — your application explicitly manages the cache.

Cache invalidation is the hard problem. The simplest approach is TTL (time-to-live): cached items expire after a set duration. For more precise invalidation, you explicitly delete cache entries when the underlying data changes. The pattern is: update database → delete cache entry → next request fetches fresh data and re-caches it.`,
          codeExamples: [
            {
              title: 'Cache-Aside Pattern with Redis',
              description: 'A reusable caching decorator and manual cache management',
              code: `# app/core/cache.py
import json
import hashlib
import logging
from functools import wraps
from typing import Optional, Any
import redis.asyncio as aioredis

logger = logging.getLogger(__name__)


class CacheService:
    """Redis-backed cache service with JSON serialization."""

    def __init__(self, redis_url: str = "redis://localhost:6379/0"):
        self.redis = aioredis.from_url(redis_url, decode_responses=True)

    def _make_key(self, prefix: str, **kwargs) -> str:
        """Generate a deterministic cache key from prefix and parameters."""
        sorted_params = json.dumps(kwargs, sort_keys=True)
        hash_suffix = hashlib.md5(sorted_params.encode()).hexdigest()[:8]
        return f"{prefix}:{hash_suffix}"

    async def get(self, key: str) -> Optional[dict]:
        """Retrieve a cached value by key."""
        value = await self.redis.get(key)
        if value:
            return json.loads(value)
        return None

    async def set(self, key: str, value: Any, ttl: int = 60):
        """Store a value in cache with TTL in seconds."""
        await self.redis.setex(key, ttl, json.dumps(value, default=str))

    async def delete(self, pattern: str):
        """Delete cache entries matching a pattern."""
        keys = []
        async for key in self.redis.scan_iter(match=pattern):
            keys.append(key)
        if keys:
            await self.redis.delete(*keys)
            logger.info(f"Invalidated {len(keys)} cache entries: {pattern}")

    async def delete_key(self, key: str):
        """Delete a specific cache key."""
        await self.redis.delete(key)


def cached(prefix: str, ttl: int = 60):
    """Decorator for caching async function results in Redis."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            cache = kwargs.pop("cache_service", None)
            if not cache:
                return await func(*args, **kwargs)

            # Generate cache key from function name and arguments
            cache_key = cache._make_key(
                prefix=prefix,
                func=func.__name__,
                args=str(args[1:]),  # Skip 'self'
                **{k: v for k, v in kwargs.items() if k != "db"},
            )

            # Check cache
            cached_result = await cache.get(cache_key)
            if cached_result is not None:
                logger.debug(f"Cache hit: {cache_key}")
                return cached_result

            # Cache miss — execute function
            result = await func(*args, **kwargs)
            if result is not None:
                await cache.set(cache_key, result, ttl=ttl)
                logger.debug(f"Cache miss: {cache_key}")

            return result
        return wrapper
    return decorator


# Usage in a service:
# @cached(prefix="products", ttl=120)
# async def get_product(product_id: int, db: AsyncSession, cache_service: CacheService):
#     return await db.get(Product, product_id)

# Manual invalidation when data changes:
# async def update_product(product_id: int, data: dict, db: AsyncSession, cache: CacheService):
#     product = await db.get(Product, product_id)
#     # ... update product ...
#     await cache.delete(f"products:*")  # Invalidate all product caches`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'flow',
            title: 'Cache-Aside Pattern',
            description: 'How cache-aside reduces database load',
            steps: [
              { label: 'Request arrives', detail: 'GET /api/products/42', highlight: false },
              { label: 'Check Redis cache', detail: 'Key: products:42', highlight: true },
              { label: 'Cache HIT → Return cached data', detail: '1ms response, no DB query', highlight: true },
              { label: 'Cache MISS → Query database', detail: '50ms query, fresh data', highlight: false },
              { label: 'Store result in cache', detail: 'Set TTL (e.g., 120 seconds)', highlight: true },
              { label: 'Return data to client', detail: 'Next request hits cache', highlight: false },
            ],
          },
          tips: [
            'Use different TTLs for different data: user profiles = 300s, product listings = 60s, static config = 3600s.',
            'Invalidate on write: update database → delete cache → next read re-populates. This is simpler than write-through.',
            'Use cache key hashing for complex query parameters — ensures consistent cache hits regardless of parameter order.',
          ],
          keyTakeaway:
            'Cache-aside with Redis is the simplest, safest caching pattern: check cache first, query DB on miss, cache the result with TTL, invalidate on writes.',
        },
        {
          heading: 'Database Query Optimization & Connection Pooling',
          content: `Database queries are the most common performance bottleneck in API applications. A single N+1 query problem can turn a 10ms endpoint into a 10-second endpoint under load. Connection pooling ensures you're not spending more time establishing connections than executing queries.

**N+1 query problem**: When you fetch a list of 100 orders and then make a separate query for each order's user, that's 101 queries instead of 1. SQLAlchemy's \`selectinload()\` and \`joinedload()\` solve this by eagerly loading relationships in a single query or one additional query.

**Connection pooling**: Every database connection takes time to establish (TCP handshake, SSL negotiation, authentication). A connection pool maintains a set of ready-to-use connections, eliminating this overhead. SQLAlchemy's AsyncAdaptedQueuePool manages this automatically — set pool_size for persistent connections and max_overflow for burst capacity.

**Index optimization**: Queries on unindexed columns perform full table scans. Add indexes on columns that appear in WHERE, JOIN, and ORDER BY clauses. Use composite indexes for multi-column queries. Monitor slow queries with SQLAlchemy's echo mode or database query logs.`,
          codeExamples: [
            {
              title: 'Query Optimization & Connection Pooling',
              description: 'Fix N+1 queries and configure optimal connection pools',
              code: `# app/core/database.py
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE.async_url,
    # ── Connection Pool Settings ───────────────
    pool_size=20,           # Persistent connections kept open
    max_overflow=30,        # Additional connections during bursts
    pool_timeout=30,        # Wait 30s for a connection from pool
    pool_recycle=3600,      # Recycle connections after 1 hour
    pool_pre_ping=True,     # Verify connections before use

    # ── Query Optimization ─────────────────────
    echo=False,             # Set True to log all SQL (dev only)
    echo_pool=False,        # Set True to log pool events (debug)

    # ── Execution Options ──────────────────────
    execution_options={
        "isolation_level": "READ COMMITTED",
    },
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    expire_on_commit=False,  # Access attributes after commit
    class_=AsyncSession,
)


async def get_db():
    """Dependency that provides a database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# ── N+1 Query Fix ──────────────────────────────
# app/features/orders/services.py
from sqlalchemy import select
from sqlalchemy.orm import selectinload, joinedload

# ❌ BAD: N+1 query problem
async def list_orders_slow(db: AsyncSession):
    """This makes 1 + N queries (one per order's user)."""
    result = await db.execute(select(Order))
    orders = result.scalars().all()
    for order in orders:
        # Each access triggers a separate query!
        _ = order.user.name
    return orders

# ✅ GOOD: Eager loading with selectinload
async def list_orders_fast(db: AsyncSession):
    """This makes exactly 2 queries total."""
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.user))  # Load users in 1 extra query
        .limit(100)
    )
    return result.scalars().all()

# ✅ GOOD: Join-based eager loading for single queries
async def get_order_with_user(db: AsyncSession, order_id: int):
    """Single query with JOIN — no extra round trip."""
    result = await db.execute(
        select(Order)
        .options(joinedload(Order.user))  # JOIN in the same query
        .where(Order.id == order_id)
    )
    return result.scalars().first()


# ── Batch Operations ───────────────────────────
async def bulk_create_orders(db: AsyncSession, orders_data: list[dict]):
    """Insert multiple records efficiently in one query."""
    from sqlalchemy import insert
    await db.execute(insert(Order), orders_data)
    await db.commit()`,
              language: 'python',
            },
          ],
          tips: [
            'Use selectinload() for collections (one-to-many) and joinedload() for single relationships (many-to-one).',
            'Set pool_pre_ping=True to detect stale connections before they cause errors.',
            'Always use .limit() on list queries — unbounded queries will eventually OOM your server.',
          ],
          keyTakeaway:
            'Fix N+1 queries with eager loading, configure connection pooling for efficiency, and index your frequently queried columns.',
        },
        {
          heading: 'Profiling & Performance Tuning',
          content: `You can't optimize what you don't measure. Profiling identifies exactly where your application spends its time — is it database queries, serialization, middleware, or the business logic itself? Without profiling, performance optimization is just guessing.

FastAPI integrates with OpenTelemetry for distributed tracing, which shows you the full path of a request across services. For local profiling, Python's cProfile and the py-spy tool provide function-level timing. For production, middleware that measures request duration and logs slow endpoints gives you continuous performance visibility.

The performance tuning workflow is: (1) measure baseline, (2) identify the bottleneck (profile), (3) fix the bottleneck, (4) measure again. Repeat until performance meets your requirements. Never optimize without measuring first — you'll often find that the bottleneck isn't where you think it is.`,
          codeExamples: [
            {
              title: 'Performance Profiling Middleware',
              description: 'Middleware that tracks request timing and identifies slow endpoints',
              code: `# app/middleware/profiling.py
import time
import logging
from collections import defaultdict
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


class PerformanceMonitor:
    """Track request performance metrics in memory."""

    def __init__(self):
        self._metrics: dict[str, list[float]] = defaultdict(list)
        self._max_samples = 1000  # Keep last 1000 samples per endpoint

    def record(self, path: str, method: str, duration_ms: float, status_code: int):
        key = f"{method} {path}"
        self._metrics[key].append(duration_ms)
        if len(self._metrics[key]) > self._max_samples:
            self._metrics[key] = self._metrics[key][-self._max_samples:]

    def get_stats(self, path: str | None = None) -> dict:
        """Get performance statistics for all or specific endpoints."""
        stats = {}
        for key, durations in self._metrics.items():
            if path and path not in key:
                continue
            if not durations:
                continue
            sorted_d = sorted(durations)
            stats[key] = {
                "count": len(durations),
                "avg_ms": round(sum(durations) / len(durations), 2),
                "p50_ms": round(sorted_d[len(sorted_d) // 2], 2),
                "p95_ms": round(sorted_d[int(len(sorted_d) * 0.95)], 2),
                "p99_ms": round(sorted_d[int(len(sorted_d) * 0.99)], 2),
                "max_ms": round(sorted_d[-1], 2),
            }
        return stats

    def get_slow_endpoints(self, threshold_ms: float = 500) -> list[dict]:
        """Find endpoints with p95 above threshold."""
        slow = []
        for key, durations in self._metrics.items():
            if not durations:
                continue
            sorted_d = sorted(durations)
            p95 = sorted_d[int(len(sorted_d) * 0.95)]
            if p95 > threshold_ms:
                slow.append({"endpoint": key, "p95_ms": round(p95, 2)})
        return sorted(slow, key=lambda x: x["p95_ms"], reverse=True)


performance_monitor = PerformanceMonitor()


class ProfilingMiddleware(BaseHTTPMiddleware):
    """Middleware that measures and records request performance."""

    SLOW_REQUEST_THRESHOLD_MS = 500  # Log warnings for slow requests

    async def dispatch(self, request: Request, call_next):
        # Skip profiling for health checks
        if request.url.path in ("/health", "/ready", "/metrics"):
            return await call_next(request)

        start_time = time.time()

        response = await call_next(request)

        duration_ms = (time.time() - start_time) * 1000

        # Record the metric
        performance_monitor.record(
            path=request.url.path,
            method=request.method,
            duration_ms=duration_ms,
            status_code=response.status_code,
        )

        # Log slow requests
        if duration_ms > self.SLOW_REQUEST_THRESHOLD_MS:
            logger.warning(
                f"Slow request: {request.method} {request.url.path} "
                f"took {duration_ms:.0f}ms",
                extra={
                    "path": request.url.path,
                    "method": request.method,
                    "duration_ms": round(duration_ms, 2),
                    "status_code": response.status_code,
                },
            )

        response.headers["X-Response-Time"] = f"{duration_ms:.0f}ms"
        return response


# ── Admin Endpoint for Metrics ──────────────────
# In your admin router:
# @router.get("/admin/performance")
# async def get_performance_stats():
#     return {
#         "endpoints": performance_monitor.get_stats(),
#         "slow_endpoints": performance_monitor.get_slow_endpoints(),
#     }`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'comparison',
            title: 'Performance Optimization Impact',
            description: 'Before and after optimization for typical API endpoints',
            columns: [
              {
                title: 'Before Optimization',
                items: ['List orders: 850ms (N+1 queries)', 'Get product: 120ms (no cache)', 'Search: 2000ms (no index)', 'Bulk insert: 15s (loop inserts)', 'Connection: 50ms setup per query'],
              },
              {
                title: 'After Optimization',
                items: ['List orders: 45ms (eager loading)', 'Get product: 3ms (Redis cache)', 'Search: 25ms (composite index)', 'Bulk insert: 0.5s (batch insert)', 'Connection: <1ms (pool reuse)'],
              },
            ],
          },
          tips: [
            'Profile before optimizing — the bottleneck is rarely where you think it is.',
            'Track p95 and p99 latencies, not just averages — averages hide outliers that affect real users.',
            'Set a SLOW_REQUEST_THRESHOLD and log warnings — it creates an automatic performance regression detector.',
          ],
          keyTakeaway:
            'Profile first, optimize the bottleneck, measure again. Track p95/p99 latencies and set slow request alerts for continuous performance monitoring.',
        },
      ],
    },

    // ──────────────────────────────────────────────
    // TOPIC 7: CI/CD & Production Deployment
    // ──────────────────────────────────────────────
    {
      id: 'm7-cicd-deployment',
      title: 'CI/CD & Production Deployment',
      icon: '🔄',
      introduction:
        'Continuous Integration and Continuous Deployment (CI/CD) automates the path from code commit to production release. This topic covers GitHub Actions pipelines, health checks for zero-downtime deployments, graceful shutdown handling, and production monitoring strategies that keep your API reliable.',
      sections: [
        {
          heading: 'CI/CD with GitHub Actions',
          content: `A CI/CD pipeline runs automated checks on every commit and deploys to production when everything passes. The typical pipeline has stages: lint, test, build, and deploy. Each stage acts as a gate — if linting fails, tests don't run; if tests fail, no deployment happens.

GitHub Actions is the most popular CI/CD platform for open-source and many commercial projects. It uses YAML workflow files in the .github/workflows/ directory. Each workflow defines triggers (push, pull request), jobs (lint, test, deploy), and steps within each job.

The key principle is: **every commit is tested the same way**. No "it works on my machine" — the pipeline runs in a clean environment every time. Linting catches style issues, type checking catches type errors, testing catches logic errors, and the build/deploy stage only runs if everything above it passed.`,
          codeExamples: [
            {
              title: 'Complete GitHub Actions Workflow',
              description: 'Full CI/CD pipeline with linting, testing, building, and deployment',
              code: `# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  PYTHON_VERSION: "3.12"
  DOCKER_REGISTRY: ghcr.io
  IMAGE_NAME: \${{ github.repository }}

jobs:
  # ── Stage 1: Lint & Type Check ───────────────
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: \${{ env.PYTHON_VERSION }}

      - name: Install dependencies
        run: |
          pip install ruff mypy
          pip install -r requirements.txt

      - name: Run Ruff linter
        run: ruff check app/ tests/

      - name: Run Ruff formatter check
        run: ruff format --check app/ tests/

      - name: Run MyPy type checking
        run: mypy app/ --ignore-missing-imports

  # ── Stage 2: Tests ───────────────────────────
  test:
    runs-on: ubuntu-latest
    needs: lint
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

      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: \${{ env.PYTHON_VERSION }}

      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pytest pytest-asyncio pytest-cov httpx

      - name: Run tests with coverage
        env:
          DATABASE_URL: postgresql+asyncpg://test:test@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379/0
          SECRET_KEY: test-secret-key-for-ci-only-min-32-chars!
          ENVIRONMENT: testing
        run: |
          pytest tests/ -v --cov=app --cov-report=xml --cov-report=term-missing

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          file: ./coverage.xml

  # ── Stage 3: Build & Push Docker Image ────────
  build:
    runs-on: ubuntu-latest
    needs: test
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: \${{ env.DOCKER_REGISTRY }}
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            \${{ env.DOCKER_REGISTRY }}/\${{ env.IMAGE_NAME }}:latest
            \${{ env.DOCKER_REGISTRY }}/\${{ env.IMAGE_NAME }}:\${{ github.sha }}

  # ── Stage 4: Deploy ──────────────────────────
  deploy:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    environment: production

    steps:
      - name: Deploy to production
        run: |
          echo "Deploying image \${{ env.DOCKER_REGISTRY }}/\${{ env.IMAGE_NAME }}:\${{ github.sha }}"
          # Add your deployment commands here:
          # - kubectl set image deployment/api api=\${{ env.DOCKER_REGISTRY }}/\${{ env.IMAGE_NAME }}:\${{ github.sha }}
          # - docker compose pull && docker compose up -d
          # - AWS ECS update-service --force-new-deployment`,
              language: 'yaml',
            },
          ],
          visualization: {
            type: 'flow',
            title: 'CI/CD Pipeline Flow',
            description: 'How code moves from commit to production',
            steps: [
              { label: 'Developer pushes code', detail: 'git push origin main', highlight: false },
              { label: 'Lint & type check', detail: 'Ruff + MyPy — catches style and type errors', highlight: true },
              { label: 'Run test suite', detail: 'pytest with PostgreSQL and Redis services', highlight: true },
              { label: 'Build Docker image', detail: 'Multi-stage build, push to registry', highlight: false },
              { label: 'Deploy to production', detail: 'Kubernetes rollout or docker compose up', highlight: true },
              { label: 'Health check verifies', detail: 'New instance passes readiness probe', highlight: true },
              { label: 'Traffic routes to new version', detail: 'Zero-downtime deployment complete', highlight: false },
            ],
          },
          tips: [
            'Use GitHub service containers for test databases — they spin up PostgreSQL and Redis automatically.',
            'Tag Docker images with the git SHA, not just "latest" — you can always roll back to a specific commit.',
            'Use GitHub environments with protection rules for production — require manual approval before deploying.',
          ],
          keyTakeaway:
            'CI/CD automates the path from commit to production: lint → test → build → deploy, with each stage as a quality gate.',
        },
        {
          heading: 'Health Checks & Graceful Shutdown',
          content: `Health checks tell your infrastructure whether your application is ready to serve traffic. Kubernetes, Docker, and load balancers use health check endpoints to decide whether to route requests to a container or remove it from the pool. Without health checks, your infrastructure can't distinguish between a slow startup and a crashed application.

There are two types of health checks: **liveness** (is the process running?) and **readiness** (can it handle requests?). Liveness fails when the process is deadlocked or unresponsive — the orchestrator restarts the container. Readiness fails when the application can't connect to its database or cache — the orchestrator stops sending traffic but doesn't restart.

Graceful shutdown ensures in-flight requests complete before the server stops. When Kubernetes sends SIGTERM to your container, FastAPI should stop accepting new connections, finish processing current requests, close database connections, and then exit. Without graceful shutdown, deploying a new version kills active user requests.`,
          codeExamples: [
            {
              title: 'Health Checks & Graceful Shutdown',
              description: 'Complete implementation of liveness, readiness, and shutdown lifecycle',
              code: `# app/main.py
import signal
import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import engine
from app.core.logging import setup_logging

logger = logging.getLogger(__name__)

# Global state for health checks
app_state = {"ready": False, "shutting_down": False}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — startup and shutdown logic."""
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}")

    # ── Startup ─────────────────────────────────
    try:
        # Verify database connectivity
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("Database connection verified")

        # Verify Redis connectivity
        import redis.asyncio as aioredis
        redis = aioredis.from_url(settings.REDIS_URL)
        await redis.ping()
        await redis.close()
        logger.info("Redis connection verified")

        # Mark as ready to receive traffic
        app_state["ready"] = True
        logger.info("Application is ready to serve traffic")

    except Exception as e:
        logger.error(f"Startup failed: {e}")
        app_state["ready"] = False
        raise

    yield  # Application runs here

    # ── Shutdown ────────────────────────────────
    logger.info("Shutting down gracefully...")
    app_state["shutting_down"] = True
    app_state["ready"] = False  # Stop receiving new traffic

    # Close database connections
    await engine.dispose()
    logger.info("Database connections closed")

    logger.info("Shutdown complete")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
)


# ── Health Check Endpoints ─────────────────────
@app.get("/health")
async def liveness_check():
    """Liveness probe — is the process alive?"""
    if app_state["shutting_down"]:
        return JSONResponse(status_code=503, content={"status": "shutting_down"})
    return {"status": "alive"}


@app.get("/ready")
async def readiness_check():
    """Readiness probe — can we handle traffic?"""
    if not app_state["ready"]:
        return JSONResponse(
            status_code=503,
            content={"status": "not_ready", "reason": "Dependencies unavailable"},
        )
    return {"status": "ready"}


# ── Signal Handlers for Graceful Shutdown ──────
def handle_sigterm(signum, frame):
    """Handle SIGTERM by triggering graceful shutdown."""
    logger.info("Received SIGTERM — initiating graceful shutdown")
    app_state["shutting_down"] = True
    app_state["ready"] = False


# Register signal handlers (important for Docker/K8s)
signal.signal(signal.SIGTERM, handle_sigterm)


# ── Uvicorn Configuration for Production ───────
# Run with:
# uvicorn app.main:app \\
#   --host 0.0.0.0 \\
#   --port 8000 \\
#   --workers 4 \\
#   --loop uvloop \\
#   --http httptools \\
#   --timeout-keep-alive 5 \\
#   --graceful-timeout 30`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'flow',
            title: 'Graceful Shutdown Sequence',
            description: 'What happens when Kubernetes sends SIGTERM',
            steps: [
              { label: 'SIGTERM received', detail: 'Kubernetes sends termination signal', highlight: true },
              { label: 'Mark as not ready', detail: 'Readiness check returns 503 — no new traffic', highlight: true },
              { label: 'Stop accepting new connections', detail: 'Uvicorn stops the listener socket', highlight: false },
              { label: 'Finish in-flight requests', detail: 'Existing connections complete normally', highlight: true },
              { label: 'Close database connections', detail: 'Return connections to pool, dispose engine', highlight: false },
              { label: 'Flush logs and exit', detail: 'Clean exit with code 0', highlight: false },
            ],
          },
          tips: [
            'Separate liveness and readiness checks — a dead database shouldn\'t trigger a container restart.',
            'Set --graceful-timeout on uvicorn to give in-flight requests time to complete (30 seconds is typical).',
            'Mark the app as "not ready" immediately on SIGTERM — this stops traffic while you finish current requests.',
          ],
          keyTakeaway:
            'Liveness checks if the process is alive, readiness checks if it can serve traffic — graceful shutdown completes in-flight requests before exiting.',
        },
        {
          heading: 'Production Monitoring & Alerting',
          content: `Monitoring is the feedback loop that tells you how your application behaves in the real world. Without it, you're flying blind — you won't know about degraded performance, rising error rates, or resource exhaustion until users complain. Production monitoring has three pillars: metrics, logs, and traces.

**Metrics** are numeric measurements sampled over time: request rate, error rate, response latency, CPU usage, memory consumption. Prometheus is the de facto standard for metrics collection. Your application exposes a /metrics endpoint, Prometheus scrapes it, and Grafana visualizes the data.

**Logs** are the detailed record of what happened. Structured JSON logs (covered in the Error Handling topic) flow into aggregation systems like ELK (Elasticsearch, Logstash, Kibana) or CloudWatch Logs. Logs are for debugging specific issues.

**Traces** follow a request across service boundaries. When an API call triggers a database query, a cache lookup, and an external HTTP call, a trace links them all together. OpenTelemetry is the standard for distributed tracing.

Alerting connects monitoring to action: "if error rate > 5% for 5 minutes, page the on-call engineer." Define alerts based on SLOs (Service Level Objectives) — for example, "99.9% of requests complete in under 500ms."`,
          codeExamples: [
            {
              title: 'Prometheus Metrics & Grafana Dashboard',
              description: 'Expose application metrics for Prometheus and visualize in Grafana',
              code: `# app/core/metrics.py
from prometheus_client import Counter, Histogram, Gauge, generate_latest
from fastapi import APIRouter, Response

router = APIRouter()

# ── Define Metrics ─────────────────────────────
REQUEST_COUNT = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "endpoint", "status_code"],
)

REQUEST_LATENCY = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency",
    ["method", "endpoint"],
    buckets=[0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0],
)

ACTIVE_CONNECTIONS = Gauge(
    "websocket_active_connections",
    "Active WebSocket connections",
)

DB_QUERY_DURATION = Histogram(
    "db_query_duration_seconds",
    "Database query duration",
    ["query_type"],
    buckets=[0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0],
)

CACHE_OPS = Counter(
    "cache_operations_total",
    "Cache operations",
    ["operation", "result"],  # operation: get/set/delete, result: hit/miss
)


# ── Metrics Middleware ──────────────────────────
from starlette.middleware.base import BaseHTTPMiddleware
import time


class MetricsMiddleware(BaseHTTPMiddleware):
    """Collect Prometheus metrics for every request."""

    async def dispatch(self, request, call_next):
        # Skip metrics endpoint itself
        if request.url.path == "/metrics":
            return await call_next(request)

        start_time = time.time()
        response = await call_next(request)
        duration = time.time() - start_time

        # Record metrics
        REQUEST_COUNT.labels(
            method=request.method,
            endpoint=request.url.path,
            status_code=response.status_code,
        ).inc()

        REQUEST_LATENCY.labels(
            method=request.method,
            endpoint=request.url.path,
        ).observe(duration)

        return response


# ── Metrics Endpoint ────────────────────────────
@router.get("/metrics")
async def metrics():
    """Prometheus scrapes this endpoint for metrics."""
    return Response(
        content=generate_latest(),
        media_type="text/plain",
    )


# ── Grafana Dashboard Configuration ────────────
# Key panels to include:
# 1. Request Rate (QPS) — sum(rate(http_requests_total[5m]))
# 2. Error Rate — sum(rate(http_requests_total{status_code=~"5.."}[5m]))
#    / sum(rate(http_requests_total[5m]))
# 3. P50/P95/P99 Latency — histogram_quantile(0.95,
#    rate(http_request_duration_seconds_bucket[5m]))
# 4. Active WebSocket Connections — websocket_active_connections
# 5. Cache Hit Rate — sum(rate(cache_operations_total{result="hit"}[5m]))
#    / sum(rate(cache_operations_total{operation="get"}[5m]))`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'architecture',
            title: 'Production Monitoring Stack',
            description: 'The three pillars of observability: metrics, logs, traces',
            layers: [
              { label: 'Application', items: ['FastAPI (metrics middleware)', 'Prometheus client', 'Structured logging', 'OpenTelemetry SDK'] },
              { label: 'Collection', items: ['Prometheus (metrics scrape)', 'ELK / CloudWatch (logs)', 'Jaeger / Tempo (traces)'] },
              { label: 'Visualization', items: ['Grafana dashboards', 'Kibana log search', 'Jaeger trace UI'] },
              { label: 'Alerting', items: ['Alertmanager (Prometheus)', 'PagerDuty / OpsGenie', 'Slack notifications'] },
            ],
          },
          tips: [
            'Start with the "RED" metrics: Rate (requests/sec), Errors (error rate), Duration (latency percentiles).',
            'Set up alerts based on SLOs, not thresholds — "error rate > 0.1% for 5 minutes" is better than "error count > 50."',
            'Use histogram_quantile() for latency percentiles — averages hide the long-tail outliers that affect real users.',
          ],
          keyTakeaway:
            'Production monitoring has three pillars: metrics (Prometheus), logs (ELK/CloudWatch), and traces (OpenTelemetry) — alert on SLO breaches, not arbitrary thresholds.',
        },
      ],
    },
  ],
};
