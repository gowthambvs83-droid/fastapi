import { Module } from './types';

export const module4Database: Module = {
  id: 'module-4-database',
  title: 'Database Integration',
  icon: '🗄️',
  description:
    'Connect FastAPI to real databases with SQLAlchemy ORM, master CRUD operations with separate Pydantic schemas, model relationships and joins, manage schema migrations with Alembic, go fully async, add Redis caching for speed, and handle transactions like a pro. This module takes you from database basics to production-grade data access patterns.',
  topics: [
    // ──────────────────────────────────────────────
    // TOPIC 1: SQLAlchemy Setup with FastAPI
    // ──────────────────────────────────────────────
    {
      id: 'm4-sqlalchemy-setup',
      title: 'SQLAlchemy Setup with FastAPI',
      icon: '⚙️',
      introduction:
        'SQLAlchemy is the de facto ORM for Python, and FastAPI integrates with it beautifully. This topic covers the essential setup: creating the engine, defining the declarative base, building models, and — most importantly — the get_db dependency that gives each request its own database session with automatic cleanup.',
      sections: [
        {
          heading: 'Engine, Session & DeclarativeBase',
          content: `SQLAlchemy\'s architecture has three core components you must understand. The **Engine** is the starting point — it manages the connection pool and dialect (SQLite, PostgreSQL, MySQL). The **Session** is the unit of work — it tracks changes to objects, manages transactions, and talks to the database. The **DeclarativeBase** is the base class for all your ORM models — it connects Python classes to database tables.

The engine is created once at application startup and shared across all requests. For SQLite, you need \`connect_args={"check_same_thread": False}\` because SQLite uses a single-file database that doesn\'t support concurrent writes from multiple threads. For PostgreSQL, this isn\'t needed. The engine\'s connection pool manages a set of database connections, reusing them across requests for efficiency.

The SessionLocal factory creates new Session instances. Each session should be used by exactly one request — never share sessions across requests or store them in global variables. The session tracks all changes to ORM objects, and when you call commit(), it flushes all pending changes to the database in a single transaction.`,
          codeExamples: [
            {
              title: 'Database Configuration Module',
              description: 'Complete database setup with engine, session factory, and base class',
              code: `# app/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# Database URL — different for each environment
SQLALCHEMY_DATABASE_URL = "sqlite:///./app.db"
# PostgreSQL: "postgresql://user:password@localhost:5432/mydb"
# MySQL: "mysql+pymysql://user:password@localhost:3306/mydb"

# Engine — created once, shared across the app
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},  # SQLite only
    echo=False,          # Set True to log all SQL statements
    pool_size=5,         # Connection pool size (PostgreSQL)
    max_overflow=10,     # Extra connections when pool is full
)

# Session factory — creates a new Session per request
SessionLocal = sessionmaker(
    autocommit=False,    # Never autocommit — explicit control
    autoflush=False,     # Don't auto-flush before queries
    bind=engine,
)

# Base class for all ORM models
class Base(DeclarativeBase):
    """All models inherit from this class."""
    pass`,
              language: 'python',
            },
            {
              title: 'Defining SQLAlchemy Models',
              description: 'ORM models that map Python classes to database tables',
              code: `# app/models/user.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(200))
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}')>"

# app/models/product.py
from sqlalchemy import Column, Integer, String, Float, Text

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    description = Column(Text)
    price = Column(Float, nullable=False)
    stock = Column(Integer, default=0)
    category = Column(String(100), index=True)
    is_available = Column(Boolean, default=True)`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'architecture',
            title: 'SQLAlchemy Layer Architecture',
            description: 'How the components of SQLAlchemy connect to FastAPI',
            layers: [
              { label: 'FastAPI Endpoints', items: ['Depends(get_db)', 'Pydantic Schemas', 'Response Models'] },
              { label: 'Session Layer', items: ['SessionLocal()', 'get_db() dependency', 'Unit of Work pattern'] },
              { label: 'ORM Layer', items: ['DeclarativeBase', 'Model classes', 'Relationship definitions'] },
              { label: 'Engine Layer', items: ['Connection pool', 'Dialect (SQLite/PostgreSQL)', 'SQL compilation'] },
              { label: 'Database', items: ['SQLite file', 'PostgreSQL server', 'MySQL server'] },
            ],
          },
          tips: [
            'Always set autocommit=False and autoflush=False on SessionLocal — explicit commits prevent subtle bugs.',
            'Use index=True on columns you frequently filter or join on — it can make queries 100x faster on large tables.',
            'Keep database.py separate from models/ — the Base class must be importable without circular dependencies.',
          ],
          keyTakeaway:
            'Engine creates connections, Session manages transactions per request, and DeclarativeBase maps classes to tables — these three are the foundation.',
        },
        {
          heading: 'The get_db Dependency & Session Lifecycle',
          content: `The get_db function is the bridge between FastAPI\'s dependency injection and SQLAlchemy\'s session management. It uses the yield pattern to create a session before the request, provide it to the endpoint, and close it after the response — even if the endpoint raises an exception.

This pattern is critical because it ensures every request gets a fresh session, and every session is properly closed. Without it, you\'d leak database connections, eventually exhausting the connection pool and crashing your application. The try/finally guarantees that close() is called no matter what happens in the endpoint.

For testing, you override get_db with a test database provider using app.dependency_overrides. This swaps the production database for a test database without changing any endpoint code — a clean separation that makes integration tests reliable and fast.`,
          codeExamples: [
            {
              title: 'The get_db Dependency',
              description: 'Yield-based dependency that provides a database session per request',
              code: `# app/database.py (continued)
from fastapi import Depends
from sqlalchemy.orm import Session

def get_db():
    """FastAPI dependency that provides a database session per request."""
    db = SessionLocal()
    try:
        yield db          # Session created, given to endpoint
    finally:
        db.close()         # Session closed, connection returned to pool

# ─────────────────────────
# Usage in endpoints
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/")
def list_users(db: Session = Depends(get_db)):
    # db is a fresh session, automatically closed after response
    return db.query(User).all()

@router.post("/", status_code=201)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = User(**user.model_dump())
    db.add(db_user)
    db.commit()         # Explicit commit
    db.refresh(db_user) # Refresh to get auto-generated fields (id, created_at)
    return db_user`,
              language: 'python',
            },
            {
              title: 'Creating Tables Programmatically',
              description: 'For development: create all tables from model definitions',
              code: `# For development only — use Alembic migrations in production!
from app.database import engine, Base
from app.models.user import User       # Import all models
from app.models.product import Product # So Base.metadata knows about them

def create_tables():
    """Create all tables defined in models.
    WARNING: Use Alembic in production instead of this!
    """
    Base.metadata.create_all(bind=engine)

# Call this at app startup
if __name__ == "__main__":
    create_tables()
    print("Tables created!")

# Better: use a startup event
from app.main import app

@app.on_event("startup")
def startup():
    # Only for development! Use Alembic in production.
    Base.metadata.create_all(bind=engine)`,
              language: 'python',
            },
          ],
          tips: [
            'get_db uses yield — the session is closed AFTER the response is sent, guaranteed.',
            'Always call db.refresh(obj) after db.commit() to update the object with database-generated values like id and timestamps.',
            'Never use Base.metadata.create_all() in production — use Alembic migrations for controlled schema changes.',
          ],
          keyTakeaway:
            'The get_db yield dependency is the single most important pattern — it gives each request a fresh session with guaranteed cleanup.',
        },
      ],
    },

    // ──────────────────────────────────────────────
    // TOPIC 2: CRUD Operations
    // ──────────────────────────────────────────────
    {
      id: 'm4-crud-operations',
      title: 'CRUD Operations',
      icon: '🔄',
      introduction:
        'CRUD — Create, Read, Update, Delete — is the backbone of most APIs. This topic covers the full CRUD lifecycle with a critical production pattern: separate Pydantic schemas for create, update, and response operations. This separation ensures your API contract is explicit, secure, and maintainable.',
      sections: [
        {
          heading: 'Full CRUD with Separate Schemas',
          content: `The biggest mistake in FastAPI CRUD APIs is using the same Pydantic model for creating, updating, and reading. This leads to problems: your create model shouldn\'t include an id field (the database generates it), your update model should make all fields optional (so clients can update only what changed), and your response model must never include passwords or internal fields.

The solution is three separate schemas: **ItemCreate** for POST requests (required fields, no id), **ItemUpdate** for PUT/PATCH requests (all fields optional), and **ItemResponse** for responses (includes id, timestamps, computed fields). This pattern is so fundamental that every production FastAPI project uses it.

When you use response_model=ItemResponse on your endpoint, FastAPI automatically filters the response through that model. Even if your endpoint returns a SQLAlchemy model with a password_hash field, the ItemResponse model ensures it\'s never sent to the client. This is a security feature as much as a documentation feature.`,
          codeExamples: [
            {
              title: 'Separate Schemas for Create, Update, and Response',
              description: 'The production pattern for CRUD API schemas',
              code: `from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

# ── CREATE schema: for POST requests ─────────────
class ProductCreate(BaseModel):
    """Schema for creating a product — no id, all required fields."""
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    price: float = Field(..., gt=0, description="Price must be positive")
    stock: int = Field(0, ge=0, description="Current stock level")
    category: str = Field(..., max_length=100)

# ── UPDATE schema: for PATCH requests ────────────
class ProductUpdate(BaseModel):
    """Schema for updating a product — all fields optional."""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    price: Optional[float] = Field(None, gt=0)
    stock: Optional[int] = Field(None, ge=0)
    category: Optional[str] = Field(None, max_length=100)
    is_available: Optional[bool] = None

# ── RESPONSE schema: for all responses ───────────
class ProductResponse(BaseModel):
    """Schema for API responses — includes id and computed fields."""
    model_config = ConfigDict(from_attributes=True)  # Read from ORM objects

    id: int
    name: str
    description: Optional[str]
    price: float
    stock: int
    category: str
    is_available: bool
    created_at: datetime
    updated_at: Optional[datetime]`,
              language: 'python',
            },
            {
              title: 'Complete CRUD Endpoints',
              description: 'All five CRUD operations with proper schemas, status codes, and error handling',
              code: `from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

router = APIRouter(prefix="/products", tags=["products"])

# ── CREATE ──────────────────────────────────────
@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    db_product = Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

# ── READ (list) ────────────────────────────────
@router.get("/", response_model=list[ProductResponse])
def list_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Product)
    if category:
        query = query.filter(Product.category == category)
    return query.offset(skip).limit(limit).all()

# ── READ (one) ─────────────────────────────────
@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

# ── UPDATE (partial) ───────────────────────────
@router.patch("/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, update: ProductUpdate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    # Only update fields the client actually sent
    for key, value in update.model_dump(exclude_unset=True).items():
        setattr(product, key, value)
    db.commit()
    db.refresh(product)
    return product

# ── DELETE ──────────────────────────────────────
@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'comparison',
            title: 'Schema Separation Benefits',
            description: 'Why separate create, update, and response schemas matter',
            columns: [
              {
                title: 'Single Schema (❌ Bad)',
                items: ['id required on create (wrong!)', 'password in response (insecure!)', 'Can\'t partial update', 'All fields always required', 'No response filtering'],
              },
              {
                title: 'Separate Schemas (✅ Good)',
                items: ['No id on create (DB generates)', 'Password excluded from response', 'Optional fields for PATCH', 'Each schema has one purpose', 'response_model filters output'],
              },
            ],
          },
          tips: [
            'Use model_dump(exclude_unset=True) for updates — it only includes fields the client explicitly sent, not fields that default to None.',
            'Set from_attributes=True (formerly orm_mode) on response models so Pydantic can read from SQLAlchemy objects directly.',
            'Never put hashed_password or internal fields in response models — response_model is your last line of defense.',
          ],
          keyTakeaway:
            'Three schemas per resource: Create (required fields, no id), Update (all optional), Response (safe fields with id) — this pattern prevents bugs and security issues.',
        },
        {
          heading: 'Advanced Query Patterns & Filtering',
          content: `Beyond basic CRUD, real APIs need filtering, sorting, and pagination. SQLAlchemy\'s query builder makes this straightforward, but the key is to build queries dynamically based on client parameters rather than writing separate endpoints for each filter combination.

The pattern is to start with a base query, then conditionally apply filters based on which parameters the client provided. This avoids N+1 query problems (where you fetch a list, then query the database once per item for related data) and keeps your endpoint signatures clean.

For pagination, always use offset/limit or cursor-based pagination. Offset/limit is simpler but degrades on large datasets (the database must scan and skip offset rows). Cursor-based pagination uses a unique, indexed column (like id or created_at) as a bookmark, making it consistently fast regardless of how deep you paginate.`,
          codeExamples: [
            {
              title: 'Dynamic Filtering & Search',
              description: 'Build queries based on client-provided filter parameters',
              code: `from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

router = APIRouter(prefix="/products", tags=["products"])

@router.get("/", response_model=list[ProductResponse])
def list_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    # Filter parameters
    category: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    is_available: Optional[bool] = Query(None),
    search: Optional[str] = Query(None, min_length=1),
    # Sorting
    sort_by: str = Query("created_at", pattern="^(name|price|created_at|stock)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
):
    # Start with base query
    query = db.query(Product)

    # Apply filters conditionally
    if category:
        query = query.filter(Product.category == category)
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    if is_available is not None:
        query = query.filter(Product.is_available == is_available)
    if search:
        # Search across multiple fields
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Product.name.ilike(search_term),
                Product.description.ilike(search_term),
            )
        )

    # Apply sorting
    sort_column = getattr(Product, sort_by)
    query = query.order_by(sort_column.desc() if sort_order == "desc" else sort_column.asc())

    # Apply pagination
    return query.offset(skip).limit(limit).all()`,
              language: 'python',
            },
            {
              title: 'Cursor-Based Pagination',
              description: 'Consistently fast pagination for large datasets',
              code: `@router.get("/feed", response_model=list[ProductResponse])
def product_feed(
    cursor: Optional[int] = Query(None, description="ID of the last item seen"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Cursor-based pagination — always fast, even on page 1000."""
    query = db.query(Product).order_by(Product.id.desc())

    if cursor:
        # Only fetch items with id < cursor (newer items)
        query = query.filter(Product.id < cursor)

    return query.limit(limit).all()

# Client usage:
# GET /products/feed              → First 20 items
# GET /products/feed?cursor=81    → Next 20 items after id 81
# GET /products/feed?cursor=61    → Next 20 items after id 61
# Always fast: uses index on id, no OFFSET scan`,
              language: 'python',
            },
          ],
          tips: [
            'Use ilike() instead of like() for case-insensitive search — it handles unicode properly.',
            'Always validate sort_by against a whitelist of allowed columns — never trust client input for column names.',
            'For large datasets, cursor-based pagination is dramatically faster than offset/limit — no table scanning.',
          ],
          keyTakeaway:
            'Build queries dynamically with conditional filters, always paginate, and prefer cursor-based pagination for large datasets.',
        },
      ],
    },

    // ──────────────────────────────────────────────
    // TOPIC 3: Relationships & Joins
    // ──────────────────────────────────────────────
    {
      id: 'm4-relationships-joins',
      title: 'Relationships & Joins',
      icon: '🔗',
      introduction:
        'Real-world data is relational — users have orders, orders have items, items belong to categories. SQLAlchemy\'s relationship() system models these connections in Python, and its query engine generates the appropriate SQL joins. This topic covers one-to-many, many-to-many relationships, and the critical difference between eager and lazy loading.',
      sections: [
        {
          heading: 'One-to-Many & Many-to-Many Relationships',
          content: `A one-to-many relationship is the most common: one user has many posts, one category has many products, one order has many items. In SQLAlchemy, you define it with \`relationship()\` on the parent side and a foreign key on the child side. The relationship() creates a Python attribute that lazily loads the related objects when you access it.

Many-to-many relationships require a junction table (also called an association or link table). For example, students enroll in many courses, and courses have many students. The junction table holds the foreign keys to both sides. SQLAlchemy\'s secondary parameter on relationship() tells it to use this table for the join.

The back_populates parameter creates a bidirectional relationship — when you access user.orders, SQLAlchemy knows to look at Order.user on the other side. Without back_populates, you\'d have a one-way relationship, which is limiting and error-prone. Always use back_populates for bidirectional relationships.`,
          codeExamples: [
            {
              title: 'One-to-Many: User → Orders',
              description: 'A user can have many orders, each order belongs to one user',
              code: `# app/models/order.py
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    total = Column(Float, nullable=False)
    status = Column(String(50), default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship: access the user object from an order
    user = relationship("User", back_populates="orders")

    # Relationship: access order items from an order
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product")

# Update User model to include orders relationship
class User(Base):
    __tablename__ = "users"
    # ... existing columns ...
    orders = relationship("Order", back_populates="user")`,
              language: 'python',
            },
            {
              title: 'Many-to-Many: Students ↔ Courses',
              description: 'Junction table pattern for many-to-many relationships',
              code: `from sqlalchemy import Column, Integer, String, ForeignKey, Table
from sqlalchemy.orm import relationship
from app.database import Base

# Junction table — must be defined BEFORE the models that use it
enrollments = Table(
    "enrollments",
    Base.metadata,
    Column("student_id", Integer, ForeignKey("students.id"), primary_key=True),
    Column("course_id", Integer, ForeignKey("courses.id"), primary_key=True),
    Column("enrolled_at", DateTime, server_default=func.now()),
    Column("grade", String(2)),  # Optional: extra columns in junction
)

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    email = Column(String(255), unique=True)

    # secondary= tells SQLAlchemy to use the junction table
    courses = relationship("Course", secondary=enrollments, back_populates="students")

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True)
    title = Column(String(200), nullable=False)
    credits = Column(Integer)

    students = relationship("Student", secondary=enrollments, back_populates="courses")

# Usage:
# student.courses  → list of Course objects the student is enrolled in
# course.students  → list of Student objects enrolled in the course`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'architecture',
            title: 'Database Relationship Patterns',
            description: 'How different relationship types map to table structures',
            layers: [
              { label: 'One-to-Many', items: ['users.id ← FK: orders.user_id', 'User.orders = relationship("Order")', 'Order.user = relationship("User")', 'Parent has list, child has FK'] },
              { label: 'Many-to-Many', items: ['students.id ← FK: enrollments.student_id', 'courses.id ← FK: enrollments.course_id', 'Junction table links both sides', 'Both sides have list relationship'] },
              { label: 'Self-Referential', items: ['employees.id ← FK: employees.manager_id', 'Manager.subordinates relationship', 'Employee.manager relationship', 'Same table, different roles'] },
            ],
          },
          tips: [
            'Always use back_populates to create bidirectional relationships — one-way relationships lead to subtle bugs.',
            'Use cascade="all, delete-orphan" on parent-child relationships where children shouldn\'t exist without parents.',
            'For many-to-many with extra data in the junction table, use an association object pattern instead of a simple Table.',
          ],
          keyTakeaway:
            'relationship() creates Python-level navigation between models — use ForeignKey for the database constraint and back_populates for bidirectional access.',
        },
        {
          heading: 'Eager vs Lazy Loading & N+1 Problem',
          content: `By default, SQLAlchemy uses lazy loading: when you access a relationship attribute (like user.orders), it fires a new SQL query to load the related data. This is convenient but dangerous in API endpoints — if you return a list of 100 users and each user\'s orders are accessed during serialization, you\'ll make 101 SQL queries (1 for users + 100 for orders). This is the infamous N+1 problem.

Eager loading solves this by loading related data in the same query using a JOIN. With \`selectinload()\`, SQLAlchemy issues a second query with IN clause to load all related objects at once. With \`joinedload()\`, it uses a SQL JOIN to fetch everything in a single query. Both are dramatically faster than N+1 queries.

The choice between joinedload and selectinload matters: joinedload can produce duplicate rows when multiple relationships are loaded (requiring DISTINCT), while selectinload always issues a separate query but is more predictable. For most cases, selectinload is the safer choice. You can also set the default loading strategy on the relationship definition itself using lazy="selectin" or lazy="joined".`,
          codeExamples: [
            {
              title: 'The N+1 Problem & Solutions',
              description: 'See the problem and three ways to fix it',
              code: `from sqlalchemy.orm import selectinload, joinedload

# ❌ N+1 PROBLEM: 101 queries for 100 users
@router.get("/users", response_model=list[UserWithOrdersResponse])
def list_users(db: Session = Depends(get_db)):
    users = db.query(User).all()     # 1 query
    for user in users:
        _ = user.orders                # 100 more queries! One per user!
    return users

# ✅ FIX 1: selectinload — second query with IN clause
@router.get("/users", response_model=list[UserWithOrdersResponse])
def list_users(db: Session = Depends(get_db)):
    users = db.query(User).options(
        selectinload(User.orders)      # 1 query for users + 1 query for all orders
    ).all()                            # Total: 2 queries
    return users

# ✅ FIX 2: joinedload — single query with JOIN
@router.get("/users", response_model=list[UserWithOrdersResponse])
def list_users(db: Session = Depends(get_db)):
    users = db.query(User).options(
        joinedload(User.orders)        # 1 query with LEFT OUTER JOIN
    ).all()                            # Total: 1 query
    return users

# ✅ FIX 3: Set default strategy on the model
class User(Base):
    __tablename__ = "users"
    # ... columns ...
    orders = relationship("Order", back_populates="user", lazy="selectin")
    # Now db.query(User).all() automatically eager-loads orders`,
              language: 'python',
            },
            {
              title: 'Nested Eager Loading',
              description: 'Load deeply nested relationships efficiently',
              code: `from sqlalchemy.orm import selectinload

# Load user → orders → order items → product (3 levels deep!)
@router.get("/users/{user_id}/full-profile")
def get_user_full_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).options(
        selectinload(User.orders).selectinload(
            Order.items            # Load items for each order
        ).selectinload(
            OrderItem.product      # Load product for each item
        )
    ).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404)

    # Access all nested relationships without additional queries!
    return {
        "user": user.username,
        "orders": [
            {
                "id": order.id,
                "items": [
                    {
                        "product": item.product.name,
                        "quantity": item.quantity,
                        "price": item.unit_price,
                    }
                    for item in order.items
                ]
            }
            for order in user.orders
        ]
    }`,
              language: 'python',
            },
          ],
          tips: [
            'Always check for N+1 queries during development — enable SQL echo (echo=True on engine) to see every query.',
            'selectinload is safer than joinedload for multiple relationships — it avoids row duplication issues.',
            'Set lazy="selectin" on frequently-accessed relationships so you never forget to eager-load them.',
          ],
          keyTakeaway:
            'Lazy loading causes N+1 queries — always use selectinload or joinedload in API endpoints that return lists with related data.',
        },
      ],
    },

    // ──────────────────────────────────────────────
    // TOPIC 4: Alembic Migrations
    // ──────────────────────────────────────────────
    {
      id: 'm4-alembic-migrations',
      title: 'Alembic Migrations',
      icon: '🚧',
      introduction:
        'When your models change, your database schema must change too. Alembic is SQLAlchemy\'s migration tool that tracks schema changes as versioned Python scripts. This topic covers setup, auto-generating migrations, applying and rolling back migrations, and the production strategies that keep your database safe.',
      sections: [
        {
          heading: 'Setting Up Alembic & Auto-Generating Migrations',
          content: `Alembic works by comparing your SQLAlchemy model definitions (the "target" state) against the actual database schema (the "current" state). The difference between them becomes a migration script. When you run \`alembic revision --autogenerate\`, Alembic inspects both states, generates the DDL operations needed to bring the database up to date, and writes them to a timestamped Python file.

The setup requires configuring Alembic to know about your database URL and your models. In \`alembic/env.py\`, you set \`target_metadata = Base.metadata\` so Alembic can compare model definitions against the database. You also need to import all your models before this line — otherwise, Alembic won\'t see them and won\'t detect changes.

Auto-generated migrations are a starting point, not the final product. Always review them before applying. Alembic can\'t detect everything: column renames look like drop+add, data migrations aren\'t auto-detected, and some constraints need manual adjustment. The golden rule: read every migration before running it, especially in production.`,
          codeExamples: [
            {
              title: 'Alembic Setup & Configuration',
              description: 'Initialize Alembic and configure it for your FastAPI project',
              code: `# 1. Initialize Alembic
# alembic init alembic
# This creates: alembic/ directory, alembic.ini, env.py, script.py.mako

# 2. Configure alembic.ini
# Open alembic.ini and set the database URL:
# sqlalchemy.url = sqlite:///./app.db
# Or better: read from environment variable

# 3. Configure alembic/env.py
import os
import sys
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

# Add your app to the Python path
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

# Import your Base and ALL models
from app.database import Base
from app.models.user import User       # Must import each model!
from app.models.product import Product
from app.models.order import Order, OrderItem

config = context.config
fileConfig(config.config_file_name)

# THIS IS THE KEY LINE — tells Alembic about your models
target_metadata = Base.metadata

# Optional: read database URL from environment
from app.config import settings
config.set_main_option("sqlalchemy.url", settings.database_url)`,
              language: 'python',
            },
            {
              title: 'Generating & Applying Migrations',
              description: 'The daily workflow: detect changes, generate migration, apply it',
              code: `# ── STEP 1: Make a change to your model ──────────
# e.g., Add a "phone" column to User model
# phone = Column(String(20))

# ── STEP 2: Auto-generate the migration ──────────
# alembic revision --autogenerate -m "Add user phone column"
# Creates: alembic/versions/20240115_add_user_phone_column.py

# ── STEP 3: Review the generated migration ────────
"""Add user phone column

Revision ID: a1b2c3d4e5f6
Revises: x9y8z7w6
Create Date: 2024-01-15 10:30:00
"""
from alembic import op
import sqlalchemy as sa

def upgrade() -> None:
    op.add_column("users", sa.Column("phone", sa.String(20), nullable=True))

def downgrade() -> None:
    op.drop_column("users", "phone")

# ── STEP 4: Apply the migration ───────────────────
# alembic upgrade head
# Applies all pending migrations

# ── Other useful commands ──────────────────────────
# alembic current           # Show current migration version
# alembic history            # Show migration history
# alembic downgrade -1       # Roll back one migration
# alembic upgrade +1         # Apply next migration
# alembic downgrade base     # Roll back ALL migrations`,
              language: 'python',
            },
          ],
          tips: [
            'Always import ALL your models in alembic/env.py — missing imports mean Alembic won\'t detect changes to those models.',
            'Review every auto-generated migration before applying — Alembic can\'t detect column renames or data migrations.',
            'Use descriptive migration messages: "Add user phone column" not "update models".',
          ],
          keyTakeaway:
            'Alembic autogenerate compares models to database and creates migration scripts — always review before applying, especially in production.',
        },
        {
          heading: 'Production Migration Strategy',
          content: `In production, migrations are high-stakes operations. A bad migration can lock tables, corrupt data, or take your application offline. The key principles are: never edit a migration that\'s already been applied, always test migrations on a staging copy first, and break large migrations into small, safe steps.

For column renames, never rely on autogenerate — it sees a drop + add, which loses data. Instead, write a manual migration that uses \`op.alter_column\` with the rename. For adding NOT NULL columns to existing tables, use a three-step approach: add the column as nullable, populate it with data, then alter it to NOT NULL. This avoids locking the table while data is being written.

For zero-downtime deployments, your migration should be compatible with both the old and new versions of your code. Add columns before deploying new code, and remove columns after all old code is retired. This means your deployment order is: (1) run migration to add columns, (2) deploy new code that uses the new columns, (3) run migration to remove old columns, (4) remove old column references from code.`,
          codeExamples: [
            {
              title: 'Safe Column Rename Migration',
              description: 'Manual migration for renaming a column without losing data',
              code: `"""Rename user name to full_name

Revision ID: b2c3d4e5f6g7
"""
from alembic import op

def upgrade() -> None:
    # Auto-generate would do: drop "name", add "full_name" (DATA LOSS!)
    # Manual migration preserves data:
    op.alter_column("users", "name", new_column_name="full_name")

def downgrade() -> None:
    op.alter_column("users", "full_name", new_column_name="name")`,
              language: 'python',
            },
            {
              title: 'Safe NOT NULL Migration (Three Steps)',
              description: 'Add a NOT NULL column to a populated table without locking',
              code: `"""Add is_verified column to users

Revision ID: c3d4e5f6g7h8
"""
from alembic import op
import sqlalchemy as sa

def upgrade() -> None:
    # Step 1: Add column as nullable (fast, no table lock)
    op.add_column("users", sa.Column("is_verified", sa.Boolean(), nullable=True))

    # Step 2: Populate with default value for existing rows
    op.execute("UPDATE users SET is_verified = TRUE WHERE email IS NOT NULL")

    # Step 3: Alter to NOT NULL (safe because all rows have values)
    op.alter_column("users", "is_verified", nullable=False)

def downgrade() -> None:
    op.drop_column("users", "is_verified")`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'flow',
            title: 'Zero-Downtime Migration Deployment',
            description: 'How to deploy schema changes without downtime in production',
            steps: [
              { label: 'Add column as nullable', detail: 'Migration: add new column, nullable — old code ignores it', highlight: true },
              { label: 'Deploy new code', detail: 'New code reads and writes both old and new columns', highlight: true },
              { label: 'Populate & constrain', detail: 'Migration: fill default values, add NOT NULL constraint', highlight: false },
              { label: 'Remove old column', detail: 'Migration: drop old column after all code uses new one', highlight: false },
              { label: 'Clean up code', detail: 'Remove references to old column from codebase', highlight: true },
            ],
          },
          tips: [
            'Never edit an applied migration — create a new one to fix it. Alembic tracks which migrations have run.',
            'Test migrations on a production database copy before running them for real — use pg_dump for PostgreSQL.',
            'For large tables, use batch mode (op.batch_alter_table) which creates a new table and swaps — avoids locking.',
          ],
          keyTakeaway:
            'Production migrations must be safe: add before removing, populate before constraining, and always test on staging first.',
        },
      ],
    },

    // ──────────────────────────────────────────────
    // TOPIC 5: Async SQLAlchemy
    // ──────────────────────────────────────────────
    {
      id: 'm4-async-sqlalchemy',
      title: 'Async SQLAlchemy',
      icon: '⚡',
      introduction:
        'FastAPI is async by default, but if your database calls are synchronous, you\'re blocking the event loop on every query. Async SQLAlchemy fixes this by using an async engine and AsyncSession, allowing your database I/O to be non-blocking. This topic covers the setup, the async get_db pattern, and writing async CRUD operations.',
      sections: [
        {
          heading: 'Async Engine, AsyncSession & async get_db',
          content: `Async SQLAlchemy requires a different driver: instead of psycopg2 for PostgreSQL, you use asyncpg; instead of sqlite3, you use aiosqlite. The engine becomes AsyncEngine, the session becomes AsyncSession, and every method that touches the database becomes a coroutine you must await.

The setup mirrors the synchronous version but with async equivalents. The crucial difference is that AsyncSession doesn\'t auto-expire objects after commit like the sync session does. You need to call await db.refresh(obj) explicitly after commits if you want to re-read database-generated values.

The async get_db dependency follows the same yield pattern, but with async. This is important — if you use a regular (sync) yield dependency with an AsyncSession, FastAPI will run it in a thread pool, which defeats the purpose of async. Always use async def for dependencies that provide async resources.`,
          codeExamples: [
            {
              title: 'Async Database Setup',
              description: 'Complete async SQLAlchemy configuration with async engine and session',
              code: `# app/database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

# Async database URLs use different drivers
ASYNC_DATABASE_URL = "sqlite+aiosqlite:///./app.db"
# PostgreSQL: "postgresql+asyncpg://user:password@localhost:5432/mydb"

# Async engine
async_engine = create_async_engine(
    ASYNC_DATABASE_URL,
    echo=False,
    pool_size=5,
    max_overflow=10,
)

# Async session factory
AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,  # Don't expire objects after commit
)

# Base class (same as sync)
class Base(DeclarativeBase):
    pass

# Async get_db dependency
async def get_db():
    """Async dependency — provides an AsyncSession per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()`,
              language: 'python',
            },
            {
              title: 'Installing Async Database Drivers',
              description: 'The correct packages for async database access',
              code: `# For SQLite (development):
pip install aiosqlite

# For PostgreSQL (production):
pip install asyncpg

# For MySQL:
pip install aiomysql

# Connection string formats:
# SQLite:    sqlite+aiosqlite:///./app.db
# PostgreSQL: postgresql+asyncpg://user:pass@localhost:5432/db
# MySQL:     mysql+aiomysql://user:pass@localhost:3306/db`,
              language: 'bash',
            },
          ],
          visualization: {
            type: 'comparison',
            title: 'Sync vs Async Database Access',
            description: 'How sync and async database calls differ in FastAPI',
            columns: [
              {
                title: 'Sync SQLAlchemy',
                items: ['psycopg2 / sqlite3', 'Session', 'db.query(User).all()', 'Blocks event loop', 'Thread pool fallback', 'Simple but limiting'],
              },
              {
                title: 'Async SQLAlchemy',
                items: ['asyncpg / aiosqlite', 'AsyncSession', 'await db.execute(select(User))', 'Non-blocking I/O', 'True concurrency', 'Scales better under load'],
              },
            ],
          },
          tips: [
            'Use expire_on_commit=False on AsyncSessionLocal — async sessions don\'t auto-expire, so you must refresh manually if needed.',
            'Always use async def for the get_db dependency — a sync dependency providing an AsyncSession defeats the purpose.',
            'Install the correct async driver: aiosqlite for SQLite, asyncpg for PostgreSQL — the regular drivers won\'t work.',
          ],
          keyTakeaway:
            'Async SQLAlchemy uses AsyncEngine + AsyncSession + async drivers — every database call becomes a coroutine you await.',
        },
        {
          heading: 'Async CRUD with SQLAlchemy 2.0 Style',
          content: `SQLAlchemy 2.0 introduced a new query style using the select() function instead of the legacy Query API. This style is required for async sessions and is more explicit about what you\'re querying. Instead of \`db.query(User).filter(User.id == 1)\`, you write \`await db.execute(select(User).where(User.id == 1))\`.

The execute() method returns a Result object, and you use .scalars() to extract the actual model instances. .scalars().all() gives you a list, .scalars().first() gives you the first result or None, and .scalar_one() raises an exception if there isn\'t exactly one result.

For create and update operations, the pattern is the same as sync: add the object to the session, commit, and refresh. The only difference is every operation is prefixed with await. This makes async CRUD code slightly more verbose but dramatically more concurrent — your FastAPI server can handle thousands of simultaneous database queries without blocking.`,
          codeExamples: [
            {
              title: 'Async CRUD Endpoints (SQLAlchemy 2.0 Style)',
              description: 'Complete async CRUD using the modern select() API',
              code: `from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db

router = APIRouter(prefix="/products", tags=["products"])

@router.post("/", response_model=ProductResponse, status_code=201)
async def create_product(product: ProductCreate, db: AsyncSession = Depends(get_db)):
    db_product = Product(**product.model_dump())
    db.add(db_product)
    await db.commit()
    await db.refresh(db_product)
    return db_product

@router.get("/", response_model=list[ProductResponse])
async def list_products(
    skip: int = 0, limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Product).offset(skip).limit(limit)
    )
    return result.scalars().all()

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Product).where(Product.id == product_id)
    )
    product = result.scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.patch("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int, update: ProductUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Product).where(Product.id == product_id)
    )
    product = result.scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    for key, value in update.model_dump(exclude_unset=True).items():
        setattr(product, key, value)
    await db.commit()
    await db.refresh(product)
    return product

@router.delete("/{product_id}", status_code=204)
async def delete_product(product_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Product).where(Product.id == product_id)
    )
    product = result.scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    await db.delete(product)
    await db.commit()`,
              language: 'python',
            },
            {
              title: 'Async Eager Loading',
              description: 'Prevent N+1 queries in async endpoints with selectinload',
              code: `from sqlalchemy.orm import selectinload
from sqlalchemy import select

@router.get("/users/{user_id}/with-orders")
async def get_user_with_orders(user_id: int, db: AsyncSession = Depends(get_db)):
    # Eager load orders to prevent N+1 queries
    result = await db.execute(
        select(User)
        .options(selectinload(User.orders))
        .where(User.id == user_id)
    )
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404)

    # No additional query — orders already loaded
    return {
        "id": user.id,
        "username": user.username,
        "orders": [{"id": o.id, "total": o.total} for o in user.orders],
    }

# Multiple eager loads
@router.get("/users/{user_id}/full")
async def get_user_full(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User)
        .options(
            selectinload(User.orders).selectinload(Order.items),
        )
        .where(User.id == user_id)
    )
    return result.scalars().first()`,
              language: 'python',
            },
          ],
          tips: [
            'Use select() instead of db.query() with async sessions — the legacy Query API doesn\'t support async.',
            'Always use result.scalars().first() or .all() — the raw Result object isn\'t what you want.',
            'Set expire_on_commit=False and call await db.refresh() only when you need updated values — it avoids unnecessary queries.',
          ],
          keyTakeaway:
            'Async CRUD uses select() + await db.execute() + result.scalars() — the 2.0 style is required for AsyncSession and is more explicit.',
        },
      ],
    },

    // ──────────────────────────────────────────────
    // TOPIC 6: Redis Caching
    // ──────────────────────────────────────────────
    {
      id: 'm4-redis-caching',
      title: 'Redis Caching',
      icon: '💾',
      introduction:
        'Redis is an in-memory data store that can serve cached data in microseconds — 10-100x faster than database queries. This topic covers integrating Redis with FastAPI, the cache-aside pattern, TTL strategies, and cache invalidation — the hardest problem in caching.',
      sections: [
        {
          heading: 'Redis Setup & Cache-Aside Pattern',
          content: `The cache-aside pattern is the most common caching strategy: your application checks the cache first, and if the data isn\'t there (a "cache miss"), it queries the database, stores the result in the cache, and returns it. On subsequent requests, the data is served from the cache (a "cache hit") without touching the database.

Redis stores data as key-value pairs. For API caching, the key is typically a structured string like \`product:42\` or \`user:list:page1\`, and the value is the JSON-serialized response. The setex command sets a key with an expiration time (TTL), so stale data automatically disappears.

The cache-aside pattern is simple but has a subtle race condition: if two requests miss the cache simultaneously, both query the database and both write to the cache. This is usually fine — the second write just overwrites the first with the same data. But for expensive operations (like aggregation queries), you might want a lock to prevent duplicate computation.`,
          codeExamples: [
            {
              title: 'Cache-Aside Pattern with Redis',
              description: 'The standard pattern: check cache, miss → query DB, write cache, return',
              code: `import redis
import json
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session

# Redis client — configured at app startup
redis_client = redis.Redis(
    host="localhost",
    port=6379,
    db=0,
    decode_responses=True,  # Return strings, not bytes
    socket_connect_timeout=5,
    socket_timeout=5,
)

app = FastAPI()

@app.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, db: Session = Depends(get_db)):
    # Step 1: Check cache
    cache_key = f"product:{product_id}"
    cached = redis_client.get(cache_key)

    if cached:
        # Cache HIT — return immediately (no DB query)
        return json.loads(cached)

    # Step 2: Cache MISS — query database
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Step 3: Store in cache with TTL
    product_data = ProductResponse.model_validate(product).model_dump()
    redis_client.setex(
        cache_key,
        300,  # TTL: 5 minutes
        json.dumps(product_data, default=str),
    )

    # Step 4: Return the data
    return product_data`,
              language: 'python',
            },
            {
              title: 'Caching List Endpoints with Parameter-Based Keys',
              description: 'Cache paginated and filtered lists with unique cache keys',
              code: `import hashlib

def make_cache_key(prefix: str, **params) -> str:
    """Create a deterministic cache key from parameters."""
    # Sort params for consistent keys regardless of order
    param_str = json.dumps(params, sort_keys=True)
    param_hash = hashlib.md5(param_str.encode()).hexdigest()[:8]
    return f"{prefix}:{param_hash}"

@app.get("/products")
async def list_products(
    skip: int = 0, limit: int = 100,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
):
    # Create cache key based on all parameters
    cache_key = make_cache_key("products:list",
                               skip=skip, limit=limit, category=category)

    # Check cache
    cached = redis_client.get(cache_key)
    if cached:
        return json.loads(cached)

    # Query database
    query = db.query(Product)
    if category:
        query = query.filter(Product.category == category)
    products = query.offset(skip).limit(limit).all()

    # Cache the result
    result = [ProductResponse.model_validate(p).model_dump() for p in products]
    redis_client.setex(cache_key, 120, json.dumps(result, default=str))  # 2 min TTL

    return result`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'data-flow',
            title: 'Cache-Aside Request Flow',
            description: 'How a request flows through the cache layer',
            steps: [
              { label: 'Request arrives', detail: 'GET /products/42', highlight: false },
              { label: 'Check Redis cache', detail: 'GET product:42 from Redis', highlight: true },
              { label: 'Cache HIT → Return cached data', detail: 'Response in <1ms, no database query', highlight: true },
              { label: 'Cache MISS → Query database', detail: 'SELECT * FROM products WHERE id = 42', highlight: true },
              { label: 'Store result in cache', detail: 'SETEX product:42 300 <json_data>', highlight: false },
              { label: 'Return data to client', detail: 'Response in ~50ms (database latency)', highlight: false },
            ],
          },
          tips: [
            'Always set a TTL on cache entries — without expiration, stale data accumulates and Redis runs out of memory.',
            'Use structured key names like "resource:id" — this makes it easy to invalidate specific entries.',
            'Set decode_responses=True on the Redis client to get strings instead of bytes — it simplifies JSON handling.',
          ],
          keyTakeaway:
            'Cache-aside: check Redis first, miss → query DB → cache the result with TTL. Simple, effective, and the industry standard.',
        },
        {
          heading: 'Cache Invalidation & TTL Strategy',
          content: `Cache invalidation is famously "one of the two hard problems in computer science." The challenge: when the underlying data changes, the cached version becomes stale and must be removed or updated. The simplest approach is time-based invalidation (TTL), but some data needs immediate invalidation when changed.

The golden rule: whenever you create, update, or delete a resource, delete its cache entry. This ensures the next request fetches fresh data. For list caches, you can use Redis keyspace patterns to find and delete all keys matching a prefix (e.g., delete all product:list:* keys when any product changes).

TTL strategy depends on data volatility. Frequently-changing data (user feeds, stock prices) gets short TTLs (30-60 seconds). Rarely-changing data (product catalogs, configuration) gets longer TTLs (5-30 minutes). Static data (country lists, exchange rates) can have TTLs of hours. The key insight: it\'s better to serve slightly stale data from cache than to overwhelm your database with redundant queries.

For advanced invalidation, Redis pub/sub can notify multiple application instances when data changes, and Redis keyspace notifications can trigger automatic cache clearing based on database events.`,
          codeExamples: [
            {
              title: 'Cache Invalidation on Data Changes',
              description: 'Delete cached data when the underlying resource is modified',
              code: `@router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int, update: ProductUpdate, db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404)

    # Update the product
    for key, value in update.model_dump(exclude_unset=True).items():
        setattr(product, key, value)
    db.commit()
    db.refresh(product)

    # ── Invalidate caches ────────────────────────
    # 1. Delete the individual product cache
    redis_client.delete(f"product:{product_id}")

    # 2. Delete all product list caches (they might contain stale data)
    # Using SCAN instead of KEYS (KEYS blocks Redis on large datasets)
    cursor = 0
    while True:
        cursor, keys = redis_client.scan(
            cursor, match="products:list:*", count=100
        )
        if keys:
            redis_client.delete(*keys)
        if cursor == 0:
            break

    # 3. Delete category-specific caches if category changed
    if update.category is not None:
        redis_client.delete(f"products:category:{update.category}")

    return product`,
              language: 'python',
            },
            {
              title: 'TTL Strategy by Data Type',
              description: 'Different expiration times for different data volatility levels',
              code: `# app/cache/ttl.py
class CacheTTL:
    """Standardized TTL values for different data categories."""

    # Volatile data — changes frequently
    USER_SESSION = 1800        # 30 minutes
    SEARCH_RESULTS = 60        # 1 minute
    STOCK_PRICES = 10          # 10 seconds

    # Semi-stable data — changes occasionally
    PRODUCT_DETAIL = 300       # 5 minutes
    PRODUCT_LIST = 120         # 2 minutes
    USER_PROFILE = 600         # 10 minutes

    # Stable data — changes rarely
    PRODUCT_CATALOG = 1800     # 30 minutes
    CONFIGURATION = 3600       # 1 hour
    COUNTRY_LIST = 86400       # 24 hours

# Usage:
redis_client.setex(f"product:{pid}", CacheTTL.PRODUCT_DETAIL, json.dumps(data))
redis_client.setex(f"config:{key}", CacheTTL.CONFIGURATION, json.dumps(data))

# Helper: cache with automatic serialization
def cache_get_or_set(key: str, ttl: int, db_query_fn):
    """Generic cache-aside with configurable TTL."""
    cached = redis_client.get(key)
    if cached:
        return json.loads(cached)

    result = db_query_fn()  # Execute the database query
    redis_client.setex(key, ttl, json.dumps(result, default=str))
    return result`,
              language: 'python',
            },
          ],
          tips: [
            'Use SCAN instead of KEYS to find cache keys — KEYS blocks Redis while scanning, SCAN is incremental.',
            'Invalidate both individual and list caches when data changes — a stale list is just as bad as a stale item.',
            'Classify your data by volatility and assign TTL accordingly — short TTLs for volatile data, long TTLs for stable data.',
          ],
          keyTakeaway:
            'Invalidate cache on every write, use SCAN for bulk deletion, and set TTLs proportional to data volatility.',
        },
      ],
    },

    // ──────────────────────────────────────────────
    // TOPIC 7: Database Transactions & Session Management
    // ──────────────────────────────────────────────
    {
      id: 'm4-transactions-sessions',
      title: 'Database Transactions & Session Management',
      icon: '🔒',
      introduction:
        'Transactions ensure data integrity — either all operations in a transaction succeed, or none of them do. This topic covers commit/rollback semantics, the session lifecycle in FastAPI, connection pooling, and the common pitfalls that lead to data corruption or connection leaks in production.',
      sections: [
        {
          heading: 'Commit, Rollback & Transaction Boundaries',
          content: `A database transaction is a unit of work that\'s either entirely committed or entirely rolled back. In SQLAlchemy, the session tracks all changes to objects, and when you call db.commit(), it flushes all pending changes to the database in a single atomic operation. If anything goes wrong, db.rollback() undoes all pending changes.

The critical rule: always commit explicitly. Never rely on autocommit, which can commit partial changes when you didn\'t intend to. With autocommit=False (which you should always set), you control exactly when changes are persisted. This means you can make multiple changes across several objects and commit them all at once, ensuring data consistency.

In FastAPI, the transaction boundary typically matches the request boundary. Each request gets a session, makes changes, and either commits (success) or rolls back (error). The get_db dependency with try/yield/finally handles cleanup, but it doesn\'t commit or rollback automatically — that\'s your responsibility in the endpoint. If you forget to commit, your changes are lost when the session closes.`,
          codeExamples: [
            {
              title: 'Explicit Commit & Rollback Patterns',
              description: 'The correct way to handle transactions in FastAPI endpoints',
              code: `from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

router = APIRouter()

# ✅ Pattern 1: Explicit commit in endpoint (most common)
@router.post("/orders", response_model=OrderResponse, status_code=201)
def create_order(order_data: OrderCreate, db: Session = Depends(get_db)):
    # Create order
    order = Order(user_id=order_data.user_id, status="pending")
    db.add(order)

    # Create order items and update stock
    for item in order_data.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product.stock < item.quantity:
            raise HTTPException(400, f"Insufficient stock for {product.name}")
        product.stock -= item.quantity

        order_item = OrderItem(
            order_id=order.id, product_id=item.product_id,
            quantity=item.quantity, unit_price=product.price,
        )
        db.add(order_item)

    # Commit ALL changes atomically — order + items + stock update
    db.commit()
    db.refresh(order)
    return order

# ✅ Pattern 2: Try/except with explicit rollback
@router.post("/transfers")
def transfer_funds(transfer: TransferRequest, db: Session = Depends(get_db)):
    try:
        from_account = db.query(Account).with_for_update().filter(
            Account.id == transfer.from_id
        ).first()
        to_account = db.query(Account).with_for_update().filter(
            Account.id == transfer.to_id
        ).first()

        if from_account.balance < transfer.amount:
            raise HTTPException(400, "Insufficient funds")

        from_account.balance -= transfer.amount
        to_account.balance += transfer.amount
        db.commit()
        return {"status": "success"}
    except Exception:
        db.rollback()  # Undo all changes on any error
        raise`,
              language: 'python',
            },
            {
              title: 'Nested Transactions with SAVEPOINT',
              description: 'Use savepoints for partial rollbacks within a transaction',
              code: `from sqlalchemy import begin_nested

@router.post("/orders/complex")
def create_complex_order(data: ComplexOrderCreate, db: Session = Depends(get_db)):
    """Order creation where some steps can fail without losing everything."""
    order = Order(user_id=data.user_id, status="processing")
    db.add(order)
    db.flush()  # Get the order.id without committing

    # Try to reserve inventory — can fail without losing the order
    for item in data.items:
        try:
            # begin_nested creates a SAVEPOINT
            nested = db.begin_nested()
            product = db.query(Product).filter(
                Product.id == item.product_id
            ).with_for_update().first()

            if product.stock < item.quantity:
                # Rollback to savepoint — only this item fails
                nested.rollback()
                item.status = "out_of_stock"
                continue

            product.stock -= item.quantity
            db.add(OrderItem(order_id=order.id, product_id=product.id,
                           quantity=item.quantity))
            nested.commit()  # Release savepoint
            item.status = "reserved"
        except Exception:
            nested.rollback()
            item.status = "error"

    # Commit the whole transaction — order + successful items
    order.status = "confirmed"
    db.commit()
    return {"order_id": order.id, "items": data.items}`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'flow',
            title: 'Transaction Lifecycle in FastAPI',
            description: 'How transactions flow from request to response',
            steps: [
              { label: 'Request arrives', detail: 'get_db() creates a new Session', highlight: true },
              { label: 'Session begins tracking', detail: 'All model changes are tracked in memory', highlight: false },
              { label: 'Endpoint logic runs', detail: 'db.add(), setattr(), queries execute', highlight: true },
              { label: 'db.commit() called', detail: 'All pending changes flushed to DB atomically', highlight: true },
              { label: 'Success → Response sent', detail: 'Session closed in get_db finally block', highlight: false },
              { label: 'Error → db.rollback()', detail: 'All pending changes discarded', highlight: true },
              { label: 'Session closed', detail: 'Connection returned to pool', highlight: false },
            ],
          },
          tips: [
            'Always call db.commit() explicitly — never rely on implicit commits. If you forget, your changes are silently lost.',
            'Use db.flush() to send changes to the database without committing — useful when you need auto-generated IDs for subsequent operations.',
            'Use with_for_update() on critical queries to acquire row-level locks and prevent concurrent modifications.',
          ],
          keyTakeaway:
            'Explicit commit/rollback is non-negotiable — every endpoint must commit on success and rollback on failure.',
        },
        {
          heading: 'Connection Pooling & Session Lifecycle',
          content: `Connection pooling is the mechanism that reuses database connections across requests instead of creating a new one each time. Creating a database connection is expensive (TCP handshake, authentication, SSL negotiation) — typically 10-50ms. A connection pool keeps a set of warm connections ready, reducing this overhead to near zero.

SQLAlchemy\'s QueuePool (the default for non-SQLite databases) maintains a pool of connections with configurable size. pool_size sets the number of permanent connections, and max_overflow allows additional connections when the pool is full. When a request needs a connection, it borrows one from the pool; when the session closes, the connection returns to the pool.

The most common production issue is connection pool exhaustion — all connections are in use, and new requests wait indefinitely. This happens when: sessions aren\'t closed properly (missing finally in get_db), long-running queries hold connections for too long, or the pool is too small for the traffic. The fix is always: ensure sessions are closed, set pool timeout, and monitor pool usage.

For SQLite, connection pooling works differently because SQLite is file-based, not network-based. The check_same_thread=False setting allows connections to be shared across threads, but you should still use a session-per-request pattern for consistency.`,
          codeExamples: [
            {
              title: 'Connection Pool Configuration',
              description: 'Production-ready engine configuration with pool settings',
              code: `from sqlalchemy import create_engine, event
from sqlalchemy.pool import QueuePool

engine = create_engine(
    "postgresql://user:password@localhost:5432/mydb",
    poolclass=QueuePool,
    pool_size=10,           # Number of permanent connections
    max_overflow=20,        # Extra connections when pool is full (total: 30)
    pool_timeout=30,        # Seconds to wait for a connection before error
    pool_recycle=3600,      # Recycle connections after 1 hour (prevents stale)
    pool_pre_ping=True,     # Test connection before use (detects dropped connections)
    echo=False,             # Set True for SQL logging in development
)

# Monitor pool usage (for debugging)
@event.listens_for(engine, "checkout")
def on_checkout(dbapi_conn, connection_record, connection_proxy):
    """Log when a connection is checked out from the pool."""
    pool = engine.pool
    print(f"Pool: {pool.checkedout()}/{pool.size()} checked out, "
          f"{pool.overflow()} overflow")

# Health check endpoint that verifies database connectivity
@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": str(e)}, 503`,
              language: 'python',
            },
            {
              title: 'Preventing Connection Leaks',
              description: 'Common mistakes that leak connections and how to fix them',
              code: `# ❌ BAD: Session not closed on exception
def get_db_bad():
    db = SessionLocal()
    yield db
    db.close()  # NOT in finally — exception skips this!

# ✅ GOOD: Always close in finally block
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()  # ALWAYS runs, even on exception

# ❌ BAD: Creating sessions manually outside the dependency
@app.get("/users")
def list_users():
    db = SessionLocal()  # Who closes this?
    users = db.query(User).all()
    # If an exception happens above, db.close() never runs
    return users

# ✅ GOOD: Always use Depends(get_db)
@app.get("/users")
def list_users(db: Session = Depends(get_db)):
    return db.query(User).all()  # Session auto-closed after response

# ❌ BAD: Holding a session across multiple requests
shared_session = SessionLocal()  # NEVER do this!

# ✅ GOOD: One session per request, every time
# The get_db dependency guarantees this`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'architecture',
            title: 'Connection Pool Lifecycle',
            description: 'How connections flow between the pool, sessions, and requests',
            layers: [
              { label: 'FastAPI Requests', items: ['Request 1: Depends(get_db)', 'Request 2: Depends(get_db)', 'Request 3: Depends(get_db)'] },
              { label: 'Session Layer', items: ['Session 1 (borrows conn)', 'Session 2 (borrows conn)', 'Session 3 (waits for conn)'] },
              { label: 'Connection Pool', items: ['Conn 1: in use', 'Conn 2: in use', 'Conn 3-10: available', 'Overflow 11-30: if needed'] },
              { label: 'Database Server', items: ['PostgreSQL / MySQL', 'Max connections: 100', 'Idle timeout: 5 min'] },
            ],
          },
          tips: [
            'Set pool_pre_ping=True to detect dropped connections before they cause errors — it adds minimal overhead.',
            'Monitor pool usage in production — if checkedout() consistently equals pool_size + max_overflow, you need a bigger pool.',
            'Never share sessions across requests — one session per request, always via Depends(get_db).',
          ],
          keyTakeaway:
            'Connection pooling reuses expensive database connections — configure pool_size/max_overflow for your traffic, always close sessions, and monitor pool health.',
        },
      ],
    },
  ],
};
