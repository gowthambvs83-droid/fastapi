import { Project } from './types';

export const miniProjects: Project[] = [
  // ──────────────────────────────────────────────
  // MINI PROJECT 1: URL Shortener API
  // ──────────────────────────────────────────────
  {
    id: 'proj-url-shortener',
    title: 'URL Shortener API',
    type: 'mini',
    icon: '🔗',
    description: 'Build a URL shortener service that generates short codes, redirects to original URLs, tracks clicks, supports custom aliases, and handles expiration.',
    difficulty: 'Beginner',
    features: [
      'Shorten long URLs to compact codes',
      'Redirect short codes to original URLs',
      'Track click counts per link',
      'Support custom aliases',
      'Set expiration dates on links',
    ],
    sections: [
      {
        heading: 'Project Overview & Architecture',
        content: `A URL shortener is a classic API project that demonstrates CRUD operations, database design, and redirect handling — all fundamental skills for any API developer. The concept is simple: a user submits a long URL, your API generates a short unique code, stores the mapping in a database, and when someone visits the short URL, your API looks up the original URL and redirects them.

The architecture follows a standard three-tier pattern: the client sends HTTP requests to FastAPI, FastAPI processes the request and interacts with the SQLite database via SQLAlchemy, and returns a JSON response or an HTTP redirect. Each shortened URL is stored as a record with fields for the original URL, the short code, click count, optional custom alias, and optional expiration timestamp.

This project teaches you several key patterns: generating unique identifiers, performing database lookups efficiently, handling HTTP redirects (307/301), implementing click counting atomically, and managing time-based expiration. These patterns appear in virtually every production API you will ever build.`,
        visualization: {
          type: 'flow',
          title: 'URL Shortener Request Flow',
          description: 'How a URL shortening and redirect request flows through the system',
          steps: [
            { label: 'User submits long URL', detail: 'POST /shorten with {"url": "https://example.com/very/long/path"}', highlight: true },
            { label: 'Generate short code', detail: 'Create 6-8 character unique code (or use custom alias)' },
            { label: 'Store in database', detail: 'Save URL + code + metadata to SQLite' },
            { label: 'Return short URL', detail: '{"short_url": "http://localhost:8000/abc123", "code": "abc123"}', highlight: true },
            { label: 'User visits short URL', detail: 'GET /abc123' },
            { label: 'Lookup in database', detail: 'Find original URL by code, increment click count', highlight: true },
            { label: 'HTTP Redirect', detail: '307 Redirect to original URL', highlight: false },
          ],
        },
        tips: [
          'Use a 307 Temporary Redirect instead of 301 Permanent Redirect so browsers always check the server instead of caching.',
          'Short codes should use base62 (a-z, A-Z, 0-9) to maximize combinations in minimal characters.',
          'Consider adding rate limiting to the /shorten endpoint to prevent abuse.',
        ],
        keyTakeaway: 'A URL shortener teaches CRUD, redirects, and atomic operations — the building blocks of any real API.',
      },
      {
        heading: 'Database Model & Pydantic Schemas',
        content: `We need a SQLAlchemy model to persist URL records and Pydantic schemas for request/response validation. The model stores the original URL, the short code (which serves as the lookup key), click count, creation timestamp, optional custom alias flag, and optional expiration datetime. Indexes on the short_code column ensure fast lookups.

The Pydantic schemas enforce validation rules: the URL must be a valid HTTP/HTTPS URL, custom aliases must be alphanumeric with hyphens/underscores, and expiration dates must be in the future. We use separate schemas for creation (URLCreate) and responses (URLResponse, URLStatsResponse) to control what the client sends vs receives.`,
        codeExamples: [
          {
            title: 'SQLAlchemy Model & Pydantic Schemas',
            description: 'Complete database model and validation schemas for the URL shortener',
            code: `# models.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from database import Base

class URLRecord(Base):
    __tablename__ = "url_records"

    id = Column(Integer, primary_key=True, index=True)
    original_url = Column(String(2048), nullable=False, index=True)
    short_code = Column(String(10), unique=True, index=True, nullable=False)
    custom_alias = Column(Boolean, default=False)
    click_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())


# schemas.py
from pydantic import BaseModel, HttpUrl, Field
from typing import Optional
from datetime import datetime

class URLCreate(BaseModel):
    url: HttpUrl = Field(..., description="The long URL to shorten")
    custom_alias: Optional[str] = Field(
        None,
        min_length=3,
        max_length=20,
        pattern=r'^[a-zA-Z0-9_-]+$',
        description="Custom alias (alphanumeric, hyphens, underscores)"
    )
    expires_in_hours: Optional[int] = Field(
        None, gt=0, le=8760,  # Max 1 year
        description="Hours until the link expires"
    )

class URLResponse(BaseModel):
    id: int
    short_url: str
    original_url: str
    short_code: str
    is_custom: bool
    expires_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}

class URLStatsResponse(BaseModel):
    short_code: str
    original_url: str
    click_count: int
    is_active: bool
    expires_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}`,
            language: 'python',
          },
        ],
        keyTakeaway: 'Separate Pydantic schemas for create/response give you strict control over what clients send and receive.',
      },
      {
        heading: 'Core Endpoints Implementation',
        content: `The core of the URL shortener consists of three endpoints: one to create a shortened URL, one to redirect visitors, and one to view statistics. The creation endpoint generates a unique short code (or uses a custom alias), saves the record to the database, and returns the shortened URL. The redirect endpoint looks up the short code, increments the click counter atomically, checks expiration, and performs an HTTP redirect. The stats endpoint returns analytics data.

Generating short codes requires care. We use Python's \`secrets\` module (not \`random\` — it's not cryptographically secure) to generate random base62 strings. If a collision occurs (extremely unlikely with 6+ character codes), we simply retry. For high-traffic systems, you'd pre-generate codes or use a counter-based approach with base62 encoding.`,
        codeExamples: [
          {
            title: 'Complete URL Shortener API',
            description: 'Full implementation of all three core endpoints',
            code: `# main.py
import secrets
import string
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, RedirectResponse, Depends
from sqlalchemy.orm import Session
from database import engine, Base, get_db
from models import URLRecord
from schemas import URLCreate, URLResponse, URLStatsResponse

Base.metadata.create_all(bind=engine)
app = FastAPI(title="URL Shortener API", version="1.0.0")

# Generate random short code using base62 characters
def generate_short_code(length: int = 6) -> str:
    chars = string.ascii_letters + string.digits  # a-z, A-Z, 0-9
    return ''.join(secrets.choice(chars) for _ in range(length))

# ── CREATE SHORT URL ─────────────────────────────
@app.post("/shorten", response_model=URLResponse, status_code=201)
def create_short_url(url_data: URLCreate, db: Session = Depends(get_db)):
    # Handle custom alias
    if url_data.custom_alias:
        existing = db.query(URLRecord).filter(
            URLRecord.short_code == url_data.custom_alias
        ).first()
        if existing:
            raise HTTPException(status_code=409, detail="Alias already taken")
        short_code = url_data.custom_alias
        is_custom = True
    else:
        # Generate unique short code
        for _ in range(10):  # Max 10 attempts
            short_code = generate_short_code()
            if not db.query(URLRecord).filter(
                URLRecord.short_code == short_code
            ).first():
                break
        else:
            raise HTTPException(status_code=500, detail="Could not generate unique code")
        is_custom = False

    # Calculate expiration
    expires_at = None
    if url_data.expires_in_hours:
        expires_at = datetime.now() + timedelta(hours=url_data.expires_in_hours)

    # Create and save record
    record = URLRecord(
        original_url=str(url_data.url),
        short_code=short_code,
        custom_alias=is_custom,
        expires_at=expires_at,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return URLResponse(
        id=record.id,
        short_url=f"http://localhost:8000/{short_code}",
        original_url=record.original_url,
        short_code=record.short_code,
        is_custom=record.custom_alias,
        expires_at=record.expires_at,
        created_at=record.created_at,
    )

# ── REDIRECT ─────────────────────────────────────
@app.get("/{short_code}")
def redirect_url(short_code: str, db: Session = Depends(get_db)):
    record = db.query(URLRecord).filter(
        URLRecord.short_code == short_code
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Short URL not found")

    # Check expiration
    if record.expires_at and datetime.now() > record.expires_at:
        record.is_active = False
        db.commit()
        raise HTTPException(status_code=410, detail="This link has expired")

    # Increment click count atomically
    record.click_count += 1
    db.commit()

    # Redirect to original URL
    return RedirectResponse(url=record.original_url, status_code=307)

# ── STATS ────────────────────────────────────────
@app.get("/stats/{short_code}", response_model=URLStatsResponse)
def get_url_stats(short_code: str, db: Session = Depends(get_db)):
    record = db.query(URLRecord).filter(
        URLRecord.short_code == short_code
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Short URL not found")

    return URLStatsResponse(
        short_code=record.short_code,
        original_url=record.original_url,
        click_count=record.click_count,
        is_active=record.is_active,
        expires_at=record.expires_at,
        created_at=record.created_at,
    )`,
            language: 'python',
            output: `# Create a short URL
# POST /shorten
# {"url": "https://docs.python.org/3/library/secrets.html"}
# Response:
{
  "id": 1,
  "short_url": "http://localhost:8000/aB3x9K",
  "original_url": "https://docs.python.org/3/library/secrets.html",
  "short_code": "aB3x9K",
  "is_custom": false,
  "expires_at": null,
  "created_at": "2024-01-15T10:30:00"
}

# Visit the short URL → redirects to original
# GET /aB3x9K → 307 Redirect

# View stats
# GET /stats/aB3x9K
{
  "short_code": "aB3x9K",
  "original_url": "https://docs.python.org/3/library/secrets.html",
  "click_count": 5,
  "is_active": true,
  "expires_at": null,
  "created_at": "2024-01-15T10:30:00"
}`,
          },
        ],
        tips: [
          'Use HTTP 307 Temporary Redirect so browsers always check the server — 301 Permanent Redirect gets cached by browsers.',
          'Use secrets.choice() instead of random.choice() for generating short codes — random is not cryptographically secure.',
          'Increment click_count in the same database transaction as the lookup to ensure atomicity.',
        ],
        keyTakeaway: 'Three endpoints power a URL shortener: POST /shorten creates, GET /{code} redirects, GET /stats/{code} shows analytics.',
      },
      {
        heading: 'Running & Testing the Project',
        content: `To run the URL shortener, you need the database setup file and to start uvicorn. The project uses SQLite for simplicity, but you can easily switch to PostgreSQL by changing the database URL. Testing should cover all three endpoints plus edge cases like duplicate aliases, expired links, and invalid URLs.

The TestClient makes testing straightforward. You can create a URL, verify the response, test the redirect, and check stats — all without starting a real server. This is the same testing pattern used in production FastAPI applications.`,
        codeExamples: [
          {
            title: 'Database Setup & Running Instructions',
            description: 'Database configuration and how to run the project',
            code: `# database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

SQLALCHEMY_DATABASE_URL = "sqlite:///./url_shortener.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ── Run the project ──────────────────────────────
# pip install fastapi uvicorn sqlalchemy pydantic
# uvicorn main:app --reload
# Visit http://localhost:8000/docs for interactive API docs`,
            language: 'python',
          },
          {
            title: 'Test Suite for URL Shortener',
            description: 'Comprehensive tests covering all endpoints and edge cases',
            code: `# test_main.py
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_create_short_url():
    response = client.post("/shorten", json={
        "url": "https://example.com/very/long/path"
    })
    assert response.status_code == 201
    data = response.json()
    assert "short_code" in data
    assert data["is_custom"] is False
    assert "short_url" in data

def test_create_with_custom_alias():
    response = client.post("/shorten", json={
        "url": "https://example.com",
        "custom_alias": "my-link"
    })
    assert response.status_code == 201
    assert response.json()["short_code"] == "my-link"
    assert response.json()["is_custom"] is True

def test_duplicate_alias_rejected():
    # Create first
    client.post("/shorten", json={"url": "https://a.com", "custom_alias": "taken"})
    # Try duplicate
    response = client.post("/shorten", json={"url": "https://b.com", "custom_alias": "taken"})
    assert response.status_code == 409

def test_redirect_works():
    # Create URL
    create_resp = client.post("/shorten", json={"url": "https://example.com"})
    short_code = create_resp.json()["short_code"]
    # Test redirect
    response = client.get(f"/{short_code}", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "https://example.com"

def test_stats_increment_clicks():
    create_resp = client.post("/shorten", json={"url": "https://example.com"})
    short_code = create_resp.json()["short_code"]
    # Click twice
    client.get(f"/{short_code}", follow_redirects=False)
    client.get(f"/{short_code}", follow_redirects=False)
    # Check stats
    stats = client.get(f"/stats/{short_code}")
    assert stats.json()["click_count"] == 2

def test_not_found_code():
    response = client.get("/nonexistent")
    assert response.status_code == 404`,
            language: 'python',
          },
        ],
        keyTakeaway: 'Test all endpoints plus edge cases: duplicates, expiration, not found — TestClient makes it instant.',
      },
    ],
  },

  // ──────────────────────────────────────────────
  // MINI PROJECT 2: Blog API with Authentication
  // ──────────────────────────────────────────────
  {
    id: 'proj-blog-api',
    title: 'Blog API with Authentication',
    type: 'mini',
    icon: '📝',
    description: 'Build a full-featured blog API with JWT authentication, CRUD operations for posts and comments, author profiles, and pagination with filtering.',
    difficulty: 'Intermediate',
    features: [
      'JWT-based user authentication',
      'Create, read, update, delete blog posts',
      'Comment system on posts',
      'Author profile management',
      'Pagination and filtering by tag/author',
    ],
    sections: [
      {
        heading: 'Project Architecture & Auth Setup',
        content: `This blog API introduces authentication to the CRUD pattern — a fundamental skill for any real-world API. Every blog has authors who create content, and only authenticated authors should be able to create, edit, or delete their own posts. Anonymous visitors can read posts and leave comments.

The architecture layers authentication on top of the standard CRUD pattern. JWT tokens identify users, and dependency injection enforces access control. Each post belongs to an author (foreign key relationship), and each comment belongs to both a post and a user. This creates a clear ownership model that maps to business rules: authors can edit their own posts but not others', anyone can read published posts, and only authenticated users can comment.

The JWT flow follows the standard pattern: users register with username/password, the server hashes the password with bcrypt, users log in to receive a JWT token, and they include this token in the Authorization header for subsequent requests. FastAPI's OAuth2PasswordBearer dependency extracts the token automatically.`,
        visualization: {
          type: 'architecture',
          title: 'Blog API Architecture',
          description: 'The layered architecture of the blog API with authentication',
          layers: [
            { label: 'Client', items: ['Web App', 'Mobile App', 'API Client'] },
            { label: 'API', items: ['Auth Routes', 'Post Routes', 'Comment Routes', 'User Routes'] },
            { label: 'Auth', items: ['JWT Tokens', 'Password Hashing', 'OAuth2 Bearer'] },
            { label: 'Database', items: ['Users Table', 'Posts Table', 'Comments Table', 'Tags Table'] },
          ],
        },
        keyTakeaway: 'Layering authentication on CRUD is the pattern every protected API follows — master it here and apply it everywhere.',
      },
      {
        heading: 'Authentication Endpoints',
        content: `The authentication system provides three endpoints: register (create account), login (get JWT token), and get current user (verify token). Password hashing uses passlib with bcrypt — never store plain-text passwords. The JWT token contains the user's ID and username as claims, with an expiration time to limit the damage of compromised tokens.

The \`get_current_user\` dependency is the linchpin of the entire auth system. It extracts the token from the Authorization header, decodes it using the secret key, validates the claims, and returns the user object. Every protected endpoint uses \`Depends(get_current_user)\` to enforce authentication. This pattern is composable — you can add role checking, permission verification, or rate limiting on top of it.`,
        codeExamples: [
          {
            title: 'Complete Auth System',
            description: 'User model, password hashing, JWT creation, and auth dependencies',
            code: `# auth.py
from datetime import datetime, timedelta
from typing import Optional
import jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

# ── Configuration ────────────────────────────────
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# ── Password Hashing ────────────────────────────
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# ── JWT Token ───────────────────────────────────
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# ── Dependencies ────────────────────────────────
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

# ── Auth Routes ─────────────────────────────────
# In your router file:
from pydantic import BaseModel, EmailStr

class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

@router.post("/register", status_code=201)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    # Check if username/email already exists
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Username taken")
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "username": user.username}

@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(
        data={"sub": user.username, "user_id": user.id},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
    }`,
            language: 'python',
          },
        ],
        keyTakeaway: 'The get_current_user dependency is the gateway to every protected endpoint — compose it for roles and permissions.',
      },
      {
        heading: 'Blog Post CRUD with Ownership',
        content: `Blog post CRUD differs from simple CRUD because posts have owners. Only the author can update or delete their own posts, while anyone can read published posts. This ownership pattern is one of the most common access control patterns in web applications.

The implementation uses the \`get_current_user\` dependency on write endpoints (POST, PUT, DELETE) and makes read endpoints (GET) publicly accessible. The update and delete endpoints verify that the current user owns the post before allowing modifications. Pagination uses skip/limit parameters, and filtering supports tag and author-based queries.`,
        codeExamples: [
          {
            title: 'Blog Post CRUD Endpoints',
            description: 'Complete post CRUD with authentication, ownership, pagination, and filtering',
            code: `# posts router
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List

router = APIRouter(prefix="/posts", tags=["posts"])

class PostCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    tags: list[str] = []
    is_published: bool = True

class PostUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = Field(None, min_length=1)
    tags: Optional[list[str]] = None
    is_published: Optional[bool] = None

class PostResponse(BaseModel):
    id: int
    title: str
    content: str
    author: str  # username
    tags: list[str]
    is_published: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

@router.post("/", response_model=PostResponse, status_code=201)
def create_post(
    post_data: PostCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    post = Post(
        title=post_data.title,
        content=post_data.content,
        tags=post_data.tags,
        is_published=post_data.is_published,
        author_id=current_user.id,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return PostResponse(
        id=post.id, title=post.title, content=post.content,
        author=current_user.username, tags=post.tags,
        is_published=post.is_published, created_at=post.created_at,
    )

@router.get("/", response_model=List[PostResponse])
def list_posts(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    tag: Optional[str] = None,
    author: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Post).filter(Post.is_published == True)
    if tag:
        query = query.filter(Post.tags.contains([tag]))
    if author:
        query = query.join(User).filter(User.username == author)
    return query.offset(skip).limit(limit).all()

@router.put("/{post_id}", response_model=PostResponse)
def update_post(
    post_id: int,
    post_data: PostUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your post")
    for key, value in post_data.model_dump(exclude_unset=True).items():
        setattr(post, key, value)
    db.commit()
    db.refresh(post)
    return post

@router.delete("/{post_id}", status_code=204)
def delete_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404)
    if post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your post")
    db.delete(post)
    db.commit()`,
            language: 'python',
          },
        ],
        keyTakeaway: 'Ownership-based access control (only the author can modify) is the most common authorization pattern in web APIs.',
      },
    ],
  },

  // ──────────────────────────────────────────────
  // MINI PROJECT 3: Real-time Chat with WebSocket
  // ──────────────────────────────────────────────
  {
    id: 'proj-chat-app',
    title: 'Real-time Chat with WebSocket',
    type: 'mini',
    icon: '💬',
    description: 'Build a real-time chat application using FastAPI WebSocket support with room management, message history, and connection lifecycle handling.',
    difficulty: 'Intermediate',
    features: [
      'WebSocket real-time messaging',
      'Room-based chat channels',
      'Message history persistence',
      'Online user tracking',
      'Typing indicators',
    ],
    sections: [
      {
        heading: 'WebSocket Architecture',
        content: `WebSocket is fundamentally different from HTTP. While HTTP follows a request-response pattern (client asks, server responds, connection closes), WebSocket creates a persistent bidirectional connection. Once established, both client and server can send messages at any time without the overhead of HTTP headers on each message. This makes WebSocket ideal for real-time features like chat, live notifications, and collaborative editing.

FastAPI provides first-class WebSocket support through the \`@app.websocket("/path")\` decorator. Inside a WebSocket endpoint, you use \`await websocket.accept()\` to establish the connection, \`await websocket.receive_text()\` (or \`receive_json\`) to get messages, and \`await websocket.send_text()\` (or \`send_json\`) to send messages. The connection stays open until either side closes it or an error occurs.

The challenge with WebSocket is managing multiple connections. When user A sends a message in room "general", how does user B receive it? The solution is a ConnectionManager that maintains a mapping of rooms to active WebSocket connections and broadcasts messages to all participants in a room.`,
        visualization: {
          type: 'comparison',
          title: 'HTTP vs WebSocket Communication',
          description: 'How WebSocket differs from the standard HTTP request-response cycle',
          columns: [
            { title: 'HTTP', items: ['Request → Response', 'Connection closes after each', 'Server cannot initiate', 'Header overhead per request', 'Stateless', 'Polling needed for updates'] },
            { title: 'WebSocket', items: ['Persistent bidirectional', 'Connection stays open', 'Server can push anytime', 'Minimal framing overhead', 'Stateful connection', 'Real-time push'] },
          ],
        },
        keyTakeaway: 'WebSocket creates a persistent bidirectional channel — essential for real-time features where the server needs to push data instantly.',
      },
      {
        heading: 'Connection Manager & Chat Server',
        content: `The ConnectionManager is the heart of the chat application. It tracks all active WebSocket connections organized by room, handles joining and leaving rooms, and broadcasts messages to the right recipients. When a user connects, they are added to the room's connection list. When they disconnect, they are removed. When a message arrives, it's broadcast to every connection in the same room.

Thread safety is important here because FastAPI handles requests concurrently. We use an asyncio-compatible approach where the manager uses standard Python data structures within the async event loop. For horizontal scaling (multiple server instances), you'd replace the in-memory manager with a Redis Pub/Sub solution.`,
        codeExamples: [
          {
            title: 'Complete Chat Server with ConnectionManager',
            description: 'Full implementation of a WebSocket chat server with rooms and message types',
            code: `# main.py
import json
from datetime import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import Dict, List
from collections import defaultdict

app = FastAPI(title="Real-time Chat API")

class ConnectionManager:
    def __init__(self):
        # room_id -> list of websocket connections
        self.rooms: Dict[str, List[WebSocket]] = defaultdict(list)
        # websocket -> username mapping
        self.user_names: Dict[WebSocket, str] = {}

    async def connect(self, websocket: WebSocket, room_id: str, username: str):
        await websocket.accept()
        self.rooms[room_id].append(websocket)
        self.user_names[websocket] = username
        # Notify others in the room
        await self.broadcast(room_id, {
            "type": "user_joined",
            "username": username,
            "timestamp": datetime.now().isoformat(),
            "online_count": len(self.rooms[room_id]),
        }, exclude=websocket)
        # Send welcome to the joining user
        await self.send(websocket, {
            "type": "room_info",
            "room": room_id,
            "online_count": len(self.rooms[room_id]),
            "online_users": [self.user_names[ws] for ws in self.rooms[room_id]],
        })

    def disconnect(self, websocket: WebSocket, room_id: str):
        if websocket in self.rooms[room_id]:
            self.rooms[room_id].remove(websocket)
        username = self.user_names.pop(websocket, "Unknown")
        return username

    async def broadcast(self, room_id: str, message: dict, exclude: WebSocket = None):
        for ws in self.rooms[room_id]:
            if ws != exclude:
                try:
                    await ws.send_json(message)
                except Exception:
                    pass  # Connection already closed

    async def send(self, websocket: WebSocket, message: dict):
        try:
            await websocket.send_json(message)
        except Exception:
            pass

manager = ConnectionManager()

# Message history storage (in production, use a database)
message_history: Dict[str, List[dict]] = defaultdict(list)

@app.websocket("/ws/{room_id}/{username}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, username: str):
    await manager.connect(websocket, room_id, username)

    # Send recent message history
    for msg in message_history[room_id][-50:]:  # Last 50 messages
        await manager.send(websocket, msg)

    try:
        while True:
            data = await websocket.receive_text()
            try:
                parsed = json.loads(data)
                msg_type = parsed.get("type", "message")

                if msg_type == "message":
                    message = {
                        "type": "message",
                        "username": username,
                        "content": parsed.get("content", ""),
                        "timestamp": datetime.now().isoformat(),
                        "room": room_id,
                    }
                    message_history[room_id].append(message)
                    await manager.broadcast(room_id, message)

                elif msg_type == "typing":
                    await manager.broadcast(room_id, {
                        "type": "typing",
                        "username": username,
                    }, exclude=websocket)

            except json.JSONDecodeError:
                await manager.send(websocket, {
                    "type": "error",
                    "message": "Invalid JSON format",
                })
    except WebSocketDisconnect:
        username = manager.disconnect(websocket, room_id)
        await manager.broadcast(room_id, {
            "type": "user_left",
            "username": username,
            "timestamp": datetime.now().isoformat(),
            "online_count": len(manager.rooms[room_id]),
        })

# REST endpoint to get room info
@app.get("/rooms/{room_id}/info")
def room_info(room_id: str):
    return {
        "room": room_id,
        "online_count": len(manager.rooms.get(room_id, [])),
        "message_count": len(message_history.get(room_id, [])),
    }`,
            language: 'python',
          },
        ],
        keyTakeaway: 'A ConnectionManager tracks rooms and connections, broadcasts messages to the right recipients, and handles join/leave lifecycle.',
      },
    ],
  },
];

export const majorProjects: Project[] = [
  // ──────────────────────────────────────────────
  // MAJOR PROJECT 1: E-Commerce API
  // ──────────────────────────────────────────────
  {
    id: 'proj-ecommerce',
    title: 'E-Commerce API',
    type: 'major',
    icon: '🛒',
    description: 'Build a complete e-commerce API with product catalog, shopping cart, order processing, payment integration, admin dashboard, and reviews system — the full production stack.',
    difficulty: 'Advanced',
    features: [
      'Product catalog with search and filtering',
      'Shopping cart with session management',
      'Order processing with status workflow',
      'Payment integration (Stripe stub)',
      'Admin dashboard with analytics',
      'Product reviews and ratings',
    ],
    sections: [
      {
        heading: 'System Architecture & Database Design',
        content: `An e-commerce API is the most comprehensive project you can build because it touches every aspect of API development: complex relationships (products → categories, orders → items), authentication and authorization (customers vs admins), business logic (cart → checkout → payment → order), and real-world concerns (inventory, search, analytics).

The database design centers around these entities: Users (customers and admins), Categories (product categories), Products (with price, inventory, images), CartItems (session-based or user-based), Orders (with status workflow), OrderItems (line items within orders), and Reviews (product ratings and comments). The relationships are: Products belong to Categories (many-to-one), Orders contain OrderItems (one-to-many), Users write Reviews (one-to-many), and Carts hold CartItems (one-to-many per session or user).

The order status workflow follows a finite state machine: pending → paid → processing → shipped → delivered, with possible transitions to cancelled or refunded. Each status change is logged for auditability. This pattern — a status field with valid transitions — appears in virtually every business application.`,
        visualization: {
          type: 'architecture',
          title: 'E-Commerce API Architecture',
          description: 'The complete architecture of the e-commerce system',
          layers: [
            { label: 'Client', items: ['Web Store', 'Mobile App', 'Admin Panel'] },
            { label: 'API', items: ['Product Routes', 'Cart Routes', 'Order Routes', 'Auth Routes', 'Admin Routes'] },
            { label: 'Auth', items: ['JWT Bearer', 'Role: Customer', 'Role: Admin'] },
            { label: 'Database', items: ['Users', 'Products', 'Categories', 'CartItems', 'Orders', 'OrderItems', 'Reviews'] },
          ],
        },
        keyTakeaway: 'E-commerce touches every API pattern: relationships, auth, business logic, status workflows, and analytics.',
      },
      {
        heading: 'Product Catalog & Search',
        content: `The product catalog is the public-facing part of the API. It supports listing products with pagination, filtering by category, price range, and search terms, and retrieving detailed product information including reviews. The search functionality uses SQL LIKE queries for simplicity, but in production you'd use PostgreSQL full-text search or Elasticsearch.

Product images are handled by storing file paths in the database and serving files through a static files mount or a CDN. The inventory tracking system decrements stock when orders are placed and prevents overselling with row-level locking or optimistic concurrency control.`,
        codeExamples: [
          {
            title: 'Product Catalog Endpoints',
            description: 'Product listing, search, detail, and review endpoints',
            code: `# routers/products.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List

router = APIRouter(prefix="/products", tags=["products"])

class ProductResponse(BaseModel):
    id: int
    name: str
    description: str
    price: float
    stock: int
    category: str
    average_rating: Optional[float] = None
    image_url: Optional[str] = None

    model_config = {"from_attributes": True}

@router.get("/", response_model=List[ProductResponse])
def list_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    category: Optional[str] = None,
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    search: Optional[str] = None,
    sort_by: str = Query("created_at", pattern="^(name|price|created_at|average_rating)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db)
):
    query = db.query(Product)

    # Apply filters
    if category:
        query = query.join(Category).filter(Category.slug == category)
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Product.name.ilike(search_term),
                Product.description.ilike(search_term),
            )
        )

    # Apply sorting
    sort_column = getattr(Product, sort_by)
    query = query.order_by(
        sort_column.desc() if sort_order == "desc" else sort_column.asc()
    )

    return query.offset(skip).limit(limit).all()

@router.get("/{product_id}", response_model=ProductDetailResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product`,
            language: 'python',
          },
        ],
        keyTakeaway: 'A product catalog needs flexible filtering, sorting, and pagination — the foundation of any data-heavy API.',
      },
      {
        heading: 'Shopping Cart & Order Processing',
        content: `The shopping cart bridges browsing and purchasing. It stores items a user intends to buy with their quantities. Carts can be session-based (for anonymous users) or user-based (for authenticated users). When a user checks out, the cart is converted into an order, stock is decremented, and the order enters the status workflow.

Order processing is the most critical business logic in an e-commerce system. It must handle: stock validation (prevent overselling), atomic operations (cart → order conversion must be all-or-nothing), payment processing (with failure handling), and the order status state machine. Each of these concerns must be handled correctly to prevent data corruption or lost orders.`,
        codeExamples: [
          {
            title: 'Order Processing with Status Workflow',
            description: 'Complete order creation and status management',
            code: `# routers/orders.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from enum import Enum

router = APIRouter(prefix="/orders", tags=["orders"])

class OrderStatus(str, Enum):
    pending = "pending"
    paid = "paid"
    processing = "processing"
    shipped = "shipped"
    delivered = "delivered"
    cancelled = "cancelled"
    refunded = "refunded"

# Valid status transitions
VALID_TRANSITIONS = {
    OrderStatus.pending: [OrderStatus.paid, OrderStatus.cancelled],
    OrderStatus.paid: [OrderStatus.processing, OrderStatus.refunded],
    OrderStatus.processing: [OrderStatus.shipped, OrderStatus.refunded],
    OrderStatus.shipped: [OrderStatus.delivered],
    OrderStatus.delivered: [OrderStatus.refunded],
}

@router.post("/", status_code=201)
def create_order(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Convert cart to order — atomic operation."""
    cart_items = db.query(CartItem).filter(
        CartItem.user_id == current_user.id
    ).all()

    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # Validate stock availability
    for item in cart_items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product.stock < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {product.name}. "
                       f"Available: {product.stock}, Requested: {item.quantity}"
            )

    # Calculate total
    total = 0.0
    order_items = []
    for item in cart_items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        # Decrement stock
        product.stock -= item.quantity
        line_total = product.price * item.quantity
        total += line_total
        order_items.append(OrderItem(
            product_id=product.id,
            quantity=item.quantity,
            unit_price=product.price,
            line_total=line_total,
        ))

    # Create order
    order = Order(
        user_id=current_user.id,
        status=OrderStatus.pending,
        total_amount=total,
        items=order_items,
    )
    db.add(order)

    # Clear cart
    for item in cart_items:
        db.delete(item)

    db.commit()
    db.refresh(order)
    return {"order_id": order.id, "status": order.status, "total": total}

@router.patch("/{order_id}/status")
def update_order_status(
    order_id: int,
    new_status: OrderStatus,
    current_user: User = Depends(get_current_admin),  # Admin only
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404)

    current = OrderStatus(order.status)
    if new_status not in VALID_TRANSITIONS.get(current, []):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot transition from {current.value} to {new_status.value}"
        )

    order.status = new_status.value
    db.commit()
    return {"order_id": order_id, "status": new_status.value}`,
            language: 'python',
          },
        ],
        keyTakeaway: 'Order processing must be atomic, validate stock, and enforce status transitions — business logic is the core of any API.',
      },
      {
        heading: 'Docker Deployment',
        content: `Deploying the e-commerce API with Docker ensures consistent environments across development, staging, and production. The setup includes three containers: the FastAPI application, a PostgreSQL database, and a Redis cache. Docker Compose orchestrates all three services with proper networking, volumes for data persistence, and health checks for reliability.

The Dockerfile uses a multi-stage build: the first stage installs dependencies, the second stage copies only the necessary files to a slim runtime image. This keeps the final image small and secure. The docker-compose.yml defines service dependencies (API depends on DB and Redis), environment variables for configuration, and volume mounts for database persistence.`,
        codeExamples: [
          {
            title: 'Docker Configuration',
            description: 'Dockerfile and docker-compose.yml for the e-commerce API',
            code: `# Dockerfile
FROM python:3.12-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.12-slim
WORKDIR /app
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# ─────────────────────────────────────────────────
# docker-compose.yml
version: "3.8"
services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/ecommerce
      - REDIS_URL=redis://redis:6379/0
      - SECRET_KEY=\${SECRET_KEY}
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    volumes:
      - ./app:/app

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ecommerce
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:`,
            language: 'yaml',
          },
        ],
        keyTakeaway: 'Docker Compose orchestrates multi-service deployments — API, database, and cache work together with health checks and persistence.',
      },
    ],
  },

  // ──────────────────────────────────────────────
  // MAJOR PROJECT 2: Task Management System
  // ──────────────────────────────────────────────
  {
    id: 'proj-task-mgmt',
    title: 'Task Management System',
    type: 'major',
    icon: '📋',
    description: 'Build a full-featured task management system with workspaces, projects, task assignments, real-time updates via WebSocket, activity logging, and role-based access control.',
    difficulty: 'Advanced',
    features: [
      'Multi-workspace project management',
      'Task CRUD with priorities and labels',
      'Real-time updates via WebSocket',
      'Activity logging and audit trail',
      'Role-based access control per workspace',
      'Assignment and delegation system',
    ],
    sections: [
      {
        heading: 'System Architecture & Data Model',
        content: `A task management system is essentially a multi-tenant project management application. Each organization gets a workspace, workspaces contain projects, and projects contain tasks. Users can belong to multiple workspaces with different roles (owner, admin, member, viewer). This hierarchy creates a rich access control model that mirrors real-world organizational structures.

The data model has five core entities: Workspace (top-level container), WorkspaceMember (many-to-many with role), Project (grouping within workspace), Task (the work item with priority, status, assignee, labels), and ActivityLog (audit trail of all changes). Tasks support a kanban-style workflow with statuses: backlog, todo, in_progress, in_review, and done. The status transitions follow a state machine similar to the e-commerce order workflow.

Real-time updates use WebSocket to push task changes to all workspace members instantly. When someone moves a task, assigns it, or adds a comment, every connected client sees the update without refreshing. This is the defining feature that makes task management tools feel responsive and collaborative.`,
        visualization: {
          type: 'architecture',
          title: 'Task Management System Architecture',
          description: 'The multi-tenant, real-time architecture of the task management system',
          layers: [
            { label: 'Client', items: ['Web Dashboard', 'Mobile App', 'CLI Tool'] },
            { label: 'API', items: ['Workspace Routes', 'Project Routes', 'Task Routes', 'WebSocket Handler'] },
            { label: 'Auth', items: ['JWT Bearer', 'RBAC: Owner/Admin/Member/Viewer'] },
            { label: 'Real-time', items: ['WebSocket Manager', 'Room per Workspace', 'Activity Broadcasting'] },
            { label: 'Database', items: ['Workspaces', 'Projects', 'Tasks', 'Activity Logs', 'Workspace Members'] },
          ],
        },
        keyTakeaway: 'Multi-tenant + RBAC + real-time updates = the core architecture of every collaborative SaaS application.',
      },
      {
        heading: 'Workspace & Task Management',
        content: `Workspaces are the top-level organizational unit. Each workspace has members with specific roles that determine what they can do. Owners can delete the workspace and manage members. Admins can create projects and manage tasks. Members can create and update tasks. Viewers can only read. This four-tier role system provides fine-grained access control.

Tasks are the core entity. Each task belongs to a project, has a creator and optional assignee, supports priorities (low, medium, high, urgent), labels for categorization, and a kanban-style status. The task model includes a description (rich text in production), due dates, and an estimated hours field for time tracking. Comments are stored as a separate entity with a foreign key to the task.`,
        codeExamples: [
          {
            title: 'Task CRUD with Workspace RBAC',
            description: 'Complete task management with workspace-level access control',
            code: `# routers/tasks.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from enum import Enum
from typing import Optional, List

router = APIRouter(prefix="/workspaces/{ws_id}/projects/{proj_id}/tasks", tags=["tasks"])

class TaskStatus(str, Enum):
    backlog = "backlog"
    todo = "todo"
    in_progress = "in_progress"
    in_review = "in_review"
    done = "done"

class TaskPriority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    urgent = "urgent"

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    priority: TaskPriority = TaskPriority.medium
    status: TaskStatus = TaskStatus.todo
    assignee_id: Optional[int] = None
    labels: list[str] = []
    due_date: Optional[datetime] = None
    estimated_hours: Optional[float] = Field(None, gt=0)

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None
    assignee_id: Optional[int] = None
    labels: Optional[list[str]] = None
    due_date: Optional[datetime] = None

def require_workspace_member(
    ws_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    membership = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == ws_id,
        WorkspaceMember.user_id == current_user.id,
    ).first()
    if not membership:
        raise HTTPException(status_code=403, detail="Not a workspace member")
    return membership

@router.post("/", status_code=201)
def create_task(
    ws_id: int,
    proj_id: int,
    task_data: TaskCreate,
    membership: WorkspaceMember = Depends(require_workspace_member),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if membership.role == "viewer":
        raise HTTPException(status_code=403, detail="Viewers cannot create tasks")

    project = db.query(Project).filter(
        Project.id == proj_id,
        Project.workspace_id == ws_id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    task = Task(
        project_id=proj_id,
        creator_id=current_user.id,
        assignee_id=task_data.assignee_id,
        title=task_data.title,
        description=task_data.description,
        priority=task_data.priority.value,
        status=task_data.status.value,
        labels=task_data.labels,
        due_date=task_data.due_date,
    )
    db.add(task)

    # Log activity
    activity = ActivityLog(
        workspace_id=ws_id,
        user_id=current_user.id,
        action="task_created",
        resource_type="task",
        resource_id=task.id,
        details={"title": task.title},
    )
    db.add(activity)
    db.commit()
    db.refresh(task)
    return task

@router.get("/", response_model=List[TaskResponse])
def list_tasks(
    ws_id: int,
    proj_id: int,
    membership: WorkspaceMember = Depends(require_workspace_member),
    status_filter: Optional[TaskStatus] = Query(None, alias="status"),
    priority: Optional[TaskPriority] = None,
    assignee_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Task).filter(Task.project_id == proj_id)
    if status_filter:
        query = query.filter(Task.status == status_filter.value)
    if priority:
        query = query.filter(Task.priority == priority.value)
    if assignee_id:
        query = query.filter(Task.assignee_id == assignee_id)
    return query.order_by(Task.created_at.desc()).all()`,
            language: 'python',
          },
        ],
        keyTakeaway: 'Workspace-level RBAC with task CRUD and activity logging — the pattern behind every collaborative SaaS tool.',
      },
      {
        heading: 'Real-time Updates & Activity Tracking',
        content: `Real-time updates make the task management system feel alive. When a team member moves a task from "todo" to "in_progress," everyone else sees the change instantly. This is achieved by combining WebSocket connections with an activity logging system. Every task mutation creates an ActivityLog record AND broadcasts the change via WebSocket to all connected members of the workspace.

The activity log serves dual purposes: it provides the real-time feed that WebSocket clients consume, and it provides a permanent audit trail that can be queried later. Each log entry records who did what, when, and the before/after values for important fields like status and assignee. This creates a complete history that supports both real-time collaboration and compliance requirements.

The WebSocket connection follows the same room-based pattern as the chat project, but instead of chat rooms, we have workspace rooms. Every workspace gets its own "channel," and when any task changes in that workspace, the change is broadcast to all connected members.`,
        codeExamples: [
          {
            title: 'WebSocket Real-time Updates',
            description: 'Broadcast task changes to workspace members via WebSocket',
            code: `# websocket.py
import json
from datetime import datetime
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List, Set
from collections import defaultdict

class WorkspaceConnectionManager:
    def __init__(self):
        # workspace_id -> set of websocket connections
        self.connections: Dict[int, Set[WebSocket]] = defaultdict(set)
        # websocket -> user info
        self.connection_info: Dict[WebSocket, dict] = {}

    async def connect(self, websocket: WebSocket, workspace_id: int, user: dict):
        await websocket.accept()
        self.connections[workspace_id].add(websocket)
        self.connection_info[websocket] = {
            "user_id": user["id"],
            "username": user["username"],
            "workspace_id": workspace_id,
        }
        # Notify workspace members
        await self.broadcast_to_workspace(workspace_id, {
            "type": "user_online",
            "user_id": user["id"],
            "username": user["username"],
        }, exclude=websocket)

    def disconnect(self, websocket: WebSocket):
        info = self.connection_info.pop(websocket, None)
        if info:
            ws_id = info["workspace_id"]
            self.connections[ws_id].discard(websocket)
            return info
        return None

    async def broadcast_to_workspace(
        self, workspace_id: int, message: dict, exclude: WebSocket = None
    ):
        dead_connections = []
        for ws in self.connections.get(workspace_id, set()):
            if ws != exclude:
                try:
                    await ws.send_json(message)
                except Exception:
                    dead_connections.append(ws)
        # Clean up dead connections
        for ws in dead_connections:
            self.connections[workspace_id].discard(ws)

ws_manager = WorkspaceConnectionManager()

@app.websocket("/ws/workspace/{workspace_id}")
async def workspace_ws(
    websocket: WebSocket,
    workspace_id: int,
    token: str  # Pass token as query param for WebSocket auth
):
    user = verify_token(token)
    if not user:
        await websocket.close(code=4001, reason="Invalid token")
        return

    await ws_manager.connect(websocket, workspace_id, user)
    try:
        while True:
            data = await websocket.receive_text()
            # Client can request specific actions via WebSocket
            msg = json.loads(data)
            if msg.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        info = ws_manager.disconnect(websocket)
        if info:
            await ws_manager.broadcast_to_workspace(workspace_id, {
                "type": "user_offline",
                "user_id": info["user_id"],
                "username": info["username"],
            })

# Helper function to call from task routes
async def notify_task_change(workspace_id: int, action: str, task: dict, user: dict):
    """Call this after any task mutation to push real-time updates."""
    await ws_manager.broadcast_to_workspace(workspace_id, {
        "type": "task_updated",
        "action": action,  # "created", "updated", "deleted", "moved"
        "task": task,
        "by": {"user_id": user["id"], "username": user["username"]},
        "timestamp": datetime.now().isoformat(),
    })`,
            language: 'python',
          },
        ],
        keyTakeaway: 'Activity logs provide both real-time updates (via WebSocket broadcast) and permanent audit trails — dual purpose, single data source.',
      },
    ],
  },
];
