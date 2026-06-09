import { Module } from './types';

export const module5Auth: Module = {
  id: 'module-5-auth',
  title: 'Authentication & Security',
  icon: '🔐',
  description:
    'Secure your FastAPI applications from the ground up — implement JWT authentication, OAuth2 flows, password hashing, role-based access control, rate limiting, security headers, CORS, and API key management. Every topic equips you with production-ready code patterns that protect real users and real data.',
  topics: [
    // ──────────────────────────────────────────────
    // TOPIC 1: JWT Authentication
    // ──────────────────────────────────────────────
    {
      id: 'm5-jwt-auth',
      title: 'JWT Authentication',
      icon: '🎫',
      introduction:
        'JSON Web Tokens (JWT) are the backbone of modern stateless authentication. They let your API verify a user\'s identity without storing session state on the server, making them ideal for microservices, SPAs, and mobile apps. In this topic you will learn how to create and verify JWTs, configure OAuth2PasswordBearer, and build a complete token-based authentication flow in FastAPI.',
      sections: [
        {
          heading: 'Creating and Verifying JWT Tokens',
          content: `A JWT is a compact, URL-safe string composed of three parts separated by dots: a header (algorithm and token type), a payload (claims like user ID and expiration), and a signature (cryptographic proof the token hasn't been tampered with). FastAPI doesn't include JWT support out of the box — you use the \`python-jose\` library (or \`PyJWT\`) to encode and decode tokens.

When a user logs in successfully, your server creates a JWT containing their identity claims (typically a \`sub\` subject field and an \`exp\` expiration timestamp) and signs it with a secret key. The client stores this token (usually in localStorage or an HTTP-only cookie) and sends it in the \`Authorization: Bearer <token>\` header on every subsequent request. Your FastAPI dependency then decodes the token, verifies the signature, checks the expiration, and extracts the user identity — all without hitting a database or session store.

The key security principle is that the JWT signature prevents tampering. If anyone modifies even a single character in the payload, the signature verification fails and the token is rejected. However, JWTs are not encrypted — they are only signed. Anyone who intercepts the token can read its contents, so never put sensitive data (passwords, secrets) inside the payload.`,
          codeExamples: [
            {
              title: 'JWT Token Creation and Verification Utilities',
              description: 'Complete utility module for creating and verifying JWT tokens',
              code: `from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt

# Configuration — store these in environment variables in production
SECRET_KEY = "your-secret-key-keep-it-safe-and-long"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Create a signed JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_access_token(token: str) -> dict | None:
    """Decode and verify a JWT token. Returns payload or None."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

# Usage example
token = create_access_token({"sub": "user123", "role": "admin"})
print(f"Token: {token[:50]}...")

payload = verify_access_token(token)
print(f"Payload: {payload}")
# {'sub': 'user123', 'role': 'admin', 'exp': 1700000000}`,
              language: 'python',
              output: `Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMT...
Payload: {'sub': 'user123', 'role': 'admin', 'exp': 1700000000}`,
            },
            {
              title: 'Complete JWT Authentication Dependency',
              description: 'FastAPI dependency that extracts and validates JWTs from requests',
              code: `from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """
    Dependency that extracts the JWT from the Authorization header,
    verifies it, and returns the user payload.
    Raises 401 if the token is missing, expired, or invalid.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str | None = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    return {"username": username, "role": payload.get("role", "user")}

# Using the dependency in a protected endpoint
@app.get("/users/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return current_user`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'sequence',
            title: 'JWT Authentication Flow',
            description: 'How a JWT is created, sent, and verified across requests',
            steps: [
              { label: 'Client sends credentials', detail: 'POST /auth/login with username + password', highlight: true },
              { label: 'Server validates credentials', detail: 'Check username/password against database' },
              { label: 'Server creates JWT', detail: 'Sign payload {sub, role, exp} with SECRET_KEY', highlight: true },
              { label: 'Client stores token', detail: 'Save token in localStorage or HTTP-only cookie' },
              { label: 'Client sends Bearer token', detail: 'Authorization: Bearer <token> on every request', highlight: true },
              { label: 'Server verifies signature', detail: 'Decode token, check exp, extract sub', highlight: true },
              { label: 'Request processed', detail: 'User identity available in dependency' },
              { label: 'Token expires', detail: 'Client must re-authenticate after exp time', highlight: false },
            ],
          },
          tips: [
            'Always use a strong, randomly-generated secret key (at least 32 characters) and store it in an environment variable — never hard-code it.',
            'Set a reasonable expiration time (15-30 minutes for access tokens). Use refresh tokens for longer sessions.',
            'Never store sensitive data (passwords, SSNs) in JWT payloads — they are base64-encoded, not encrypted.',
          ],
          keyTakeaway:
            'JWTs are signed, not encrypted — they prove identity via a cryptographic signature that your server verifies on every request.',
        },
        {
          heading: 'OAuth2PasswordBearer and Token Flow',
          content: `FastAPI provides \`OAuth2PasswordBearer\` as a security scheme that tells the framework two things: (1) where clients should go to obtain a token (the \`tokenUrl\`), and (2) that the client must send the token as a Bearer token in the Authorization header. When you use \`OAuth2PasswordBearer\` as a dependency, FastAPI automatically adds a lock icon to your Swagger UI documentation and an "Authorize" button that lets testers authenticate interactively.

The OAuth2PasswordBearer class doesn't actually authenticate the user — it only extracts the token from the request. The real authentication logic lives in your dependency function, which receives the extracted token string, decodes it, and returns the user object. This separation of concerns is elegant: the security scheme handles the HTTP protocol side (extracting the header), and your dependency handles the business logic side (verifying the token and loading the user).

One important detail: the \`tokenUrl\` parameter is used by Swagger UI to know where to send the login form. It should match the path of your login endpoint. When a user clicks "Authorize" in Swagger UI, it sends a POST request to that URL with the credentials in form-data format, expecting a JSON response containing an \`access_token\` field.`,
          codeExamples: [
            {
              title: 'Full Token Lifecycle with OAuth2PasswordBearer',
              description: 'Login endpoint that returns tokens and a protected endpoint that consumes them',
              code: `from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from pydantic import BaseModel

app = FastAPI()

SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str | None = None

def create_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@app.post("/auth/login", response_model=Token)
async def login(username: str, password: str):
    """Authenticate user and return a JWT access token."""
    # In production: verify against database with hashed passwords
    if username != "admin" or password != "secret":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_token(data={"sub": username, "role": "admin"})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/protected")
async def protected_route(token: str = Depends(oauth2_scheme)):
    """A route that requires a valid JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    return {"message": f"Hello, {username}!", "role": payload.get("role")}`,
              language: 'python',
              output: `# POST /auth/login (form-data: username=admin, password=secret)
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}

# GET /protected (Authorization: Bearer <token>)
{
  "message": "Hello, admin!",
  "role": "admin"
}`,
            },
          ],
          tips: [
            'The tokenUrl in OAuth2PasswordBearer enables the Swagger UI "Authorize" button — make sure it matches your actual login endpoint path.',
            'Always return token_type: "bearer" in your token response — OAuth2 spec requires this field.',
            'Use the Token and TokenData Pydantic models to enforce response shape consistency across your auth endpoints.',
          ],
          keyTakeaway:
            'OAuth2PasswordBearer extracts the token from the request header — your dependency function handles the actual verification logic.',
        },
        {
          heading: 'Token Refresh Strategy',
          content: `Short-lived access tokens are a security best practice, but they create a poor user experience if users must re-enter credentials every 15 minutes. The solution is a **refresh token** — a longer-lived, single-use token that the client exchanges for a new access token without requiring the user to log in again.

In this pattern, when a user logs in, the server returns two tokens: a short-lived access token (15-30 minutes) and a longer-lived refresh token (7-30 days). The access token is used for API requests as usual. When it expires, the client sends the refresh token to a dedicated endpoint (\`/auth/refresh\`) and receives a new access token. If the refresh token is also expired or has been revoked, the user must log in again.

Refresh tokens should be stored differently from access tokens. Access tokens can live in memory (or localStorage for SPAs), but refresh tokens should be stored in HTTP-only, Secure cookies to prevent XSS attacks. On the server side, refresh tokens should be tracked in a database so they can be revoked if a user logs out or a security breach is detected. This dual-token strategy gives you the security of short-lived tokens with the convenience of persistent sessions.`,
          codeExamples: [
            {
              title: 'Refresh Token Implementation',
              description: 'Dual-token strategy with access and refresh tokens',
              code: `from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, Depends, HTTPException, status, Response
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import BaseModel

app = FastAPI()
SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"

# In production: store refresh tokens in database
refresh_tokens_db: dict[str, str] = {}  # token -> username

class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

def create_token_pair(username: str) -> TokenPair:
    access = jwt.encode(
        {"sub": username, "exp": datetime.now(timezone.utc) + timedelta(minutes=15)},
        SECRET_KEY, algorithm=ALGORITHM
    )
    refresh = jwt.encode(
        {"sub": username, "type": "refresh", "exp": datetime.now(timezone.utc) + timedelta(days=7)},
        SECRET_KEY, algorithm=ALGORITHM
    )
    refresh_tokens_db[refresh] = username
    return TokenPair(access_token=access, refresh_token=refresh)

@app.post("/auth/login", response_model=TokenPair)
async def login(username: str, password: str):
    if username != "admin" or password != "secret":
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return create_token_pair(username)

@app.post("/auth/refresh", response_model=TokenPair)
async def refresh_access_token(refresh_token: str):
    if refresh_token not in refresh_tokens_db:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Not a refresh token")
    except JWTError:
        del refresh_tokens_db[refresh_token]  # Clean up invalid token
        raise HTTPException(status_code=401, detail="Token expired")
    # Rotate: invalidate old refresh token, issue a new pair
    del refresh_tokens_db[refresh_token]
    return create_token_pair(payload["sub"])

@app.post("/auth/logout")
async def logout(refresh_token: str):
    refresh_tokens_db.pop(refresh_token, None)
    return {"message": "Logged out successfully"}`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'flow',
            title: 'Token Refresh Lifecycle',
            description: 'How access and refresh tokens work together',
            steps: [
              { label: 'User logs in', detail: 'Server issues access + refresh token pair', highlight: true },
              { label: 'Client uses access token', detail: 'Authorization: Bearer <access_token> on API calls' },
              { label: 'Access token expires', detail: 'API returns 401 Unauthorized', highlight: true },
              { label: 'Client sends refresh token', detail: 'POST /auth/refresh with refresh_token', highlight: true },
              { label: 'Server validates refresh token', detail: 'Check DB, verify signature and expiration' },
              { label: 'Server issues new token pair', detail: 'Old refresh token is invalidated (rotation)', highlight: true },
              { label: 'Client continues with new tokens', detail: 'Seamless re-authentication' },
            ],
          },
          tips: [
            'Use refresh token rotation — issue a new refresh token every time one is used, and invalidate the old one to prevent replay attacks.',
            'Store refresh tokens in HTTP-only Secure cookies, not localStorage, to protect against XSS token theft.',
            'Keep a server-side record of active refresh tokens so you can revoke them on logout or security incidents.',
          ],
          keyTakeaway:
            'Refresh tokens give you the security of short-lived access tokens with the convenience of persistent sessions — always rotate them.',
        },
      ],
    },

    // ──────────────────────────────────────────────
    // TOPIC 2: OAuth2 Password Flow
    // ──────────────────────────────────────────────
    {
      id: 'm5-oauth2-password-flow',
      title: 'OAuth2 Password Flow',
      icon: '🔑',
      introduction:
        'The OAuth2 Resource Owner Password Credentials flow (often called the "Password Flow") is the simplest OAuth2 grant type. The client sends the user\'s username and password directly to the token endpoint and receives an access token in return. While this flow is only recommended for first-party clients (your own frontend), it is the most common pattern for FastAPI applications and integrates beautifully with Swagger UI\'s built-in Authorize button.',
      sections: [
        {
          heading: 'OAuth2PasswordRequestForm and Form-Based Login',
          content: `FastAPI provides \`OAuth2PasswordRequestForm\` — a special form class that automatically parses username and password from \`application/x-www-form-urlencoded\` request bodies. This is important because the OAuth2 specification requires the token endpoint to accept credentials as form data, not JSON. When you use this class as a dependency, FastAPI extracts \`username\`, \`password\`, \`scope\`, \`grant_type\`, and other OAuth2 fields from the form body.

The beauty of \`OAuth2PasswordRequestForm\` is that it makes Swagger UI's "Authorize" button work out of the box. When you click Authorize in Swagger, a dialog appears asking for username and password. Swagger then sends those credentials as form data to your token endpoint. If authentication succeeds, Swagger stores the returned token and includes it in all subsequent API requests automatically. This gives you an interactive, authenticated API testing environment without writing any frontend code.

The response from the token endpoint must follow the OAuth2 specification: it must include \`access_token\` (the JWT string), \`token_type\` (always "bearer"), and optionally \`expires_in\` (seconds until expiration). FastAPI validates this shape if you use the \`OAuth2PasswordRequestFormStrict\` variant or a Pydantic response model.`,
          codeExamples: [
            {
              title: 'OAuth2 Password Flow Login Endpoint',
              description: 'Full implementation using OAuth2PasswordRequestForm',
              code: `from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import jwt
from pydantic import BaseModel

app = FastAPI()

SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

# Fake user database — replace with real database
fake_users_db = {
    "alice": {
        "username": "alice",
        "hashed_password": "fakehashed_secret",
        "disabled": False,
        "role": "user",
    },
    "admin": {
        "username": "admin",
        "hashed_password": "fakehashed_secret",
        "disabled": False,
        "role": "admin",
    },
}

class Token(BaseModel):
    access_token: str
    token_type: str

@app.post("/auth/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    OAuth2 password flow token endpoint.
    Accepts form data (not JSON!) as required by OAuth2 spec.
    Swagger UI's Authorize button sends data here automatically.
    """
    user = fake_users_db.get(form_data.username)
    if not user or user["hashed_password"] != f"fakehashed_{form_data.password}":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = jwt.encode(
        {"sub": user["username"], "role": user["role"],
         "exp": datetime.now(timezone.utc) + timedelta(minutes=30)},
        SECRET_KEY, algorithm=ALGORITHM
    )
    return Token(access_token=access_token, token_type="bearer")`,
              language: 'python',
            },
            {
              title: 'Using the OAuth2 Scheme in Protected Endpoints',
              description: 'Endpoints that require the Bearer token from the password flow',
              code: `from fastapi import Depends, HTTPException
from jose import JWTError, jwt

async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """Decode JWT and return user data."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str | None = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = fake_users_db.get(username)
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@app.get("/users/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    """Get current authenticated user profile."""
    return {
        "username": current_user["username"],
        "role": current_user["role"],
        "disabled": current_user["disabled"],
    }

@app.get("/users/me/items")
async def read_own_items(current_user: dict = Depends(get_current_user)):
    """Get items belonging to the current user."""
    return [{"item_id": 1, "owner": current_user["username"]}]`,
              language: 'python',
              output: `# After clicking "Authorize" in Swagger UI with admin/secret:
# GET /users/me
{
  "username": "admin",
  "role": "admin",
  "disabled": false
}`,
            },
          ],
          visualization: {
            type: 'sequence',
            title: 'OAuth2 Password Flow Sequence',
            description: 'Step-by-step flow from login to authenticated request',
            steps: [
              { label: 'User clicks Authorize in Swagger', detail: 'Swagger shows username/password dialog', highlight: true },
              { label: 'Swagger sends POST /auth/token', detail: 'form-data: username=admin&password=secret', highlight: true },
              { label: 'Server validates credentials', detail: 'Check username + hashed password in database' },
              { label: 'Server returns access_token', detail: '{"access_token": "eyJ...", "token_type": "bearer"}', highlight: true },
              { label: 'Swagger stores token', detail: 'Token saved for subsequent requests' },
              { label: 'User makes API request', detail: 'GET /users/me with Authorization header', highlight: true },
              { label: 'Server verifies JWT', detail: 'Decode token, extract sub, load user' },
              { label: 'Server returns protected data', detail: 'User profile, owned resources, etc.' },
            ],
          },
          tips: [
            'OAuth2PasswordRequestForm always expects form-data (application/x-www-form-urlencoded), not JSON — this is required by the OAuth2 specification.',
            'The OAuth2 Password Flow is only recommended for first-party clients (your own frontend/app). Third-party apps should use the Authorization Code flow.',
            'Always return the correct response shape: {"access_token": "...", "token_type": "bearer"} — Swagger UI expects this exact format.',
          ],
          keyTakeaway:
            'OAuth2PasswordRequestForm parses form-data credentials — it makes Swagger UI\'s Authorize button work automatically.',
        },
        {
          heading: 'Swagger Authorize Button Integration',
          content: `One of FastAPI's most powerful features is the automatic Swagger UI integration with OAuth2 security schemes. When you configure \`OAuth2PasswordBearer\` with a \`tokenUrl\`, FastAPI adds an "Authorize" button to the Swagger UI at \`/docs\`. Clicking it opens a dialog where users enter their credentials, and Swagger handles the entire token exchange flow automatically.

This integration works because FastAPI generates an OpenAPI security definition from your \`OAuth2PasswordBearer\` instance. The OpenAPI schema tells Swagger UI that certain endpoints require Bearer token authentication, and Swagger provides the UI for obtaining and using that token. You don't need to write any frontend code for this — it all comes from your security scheme configuration.

For the best experience, you should also configure scopes. OAuth2 scopes let you define fine-grained permissions like \`read:items\`, \`write:items\`, or \`admin:all\`. When you add scopes to your security scheme, the Swagger Authorize dialog shows checkboxes for each scope, and the selected scopes are included in the token request. Your dependency can then check whether the token has the required scope for the requested operation.`,
          codeExamples: [
            {
              title: 'Full Swagger-Aware OAuth2 Setup with Scopes',
              description: 'Complete configuration that provides rich Swagger UI authorization experience',
              code: `from fastapi import FastAPI, Depends, HTTPException, Security
from fastapi.security import OAuth2PasswordBearer, SecurityScopes
from jose import jwt, JWTError
from pydantic import BaseModel

app = FastAPI()

SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"

# Define scopes for fine-grained permissions
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/token",
    scopes={
        "read:items": "Read access to items",
        "write:items": "Write access to items",
        "admin:all": "Full administrative access",
    },
)

async def get_current_user(
    security_scopes: SecurityScopes,
    token: str = Depends(oauth2_scheme),
) -> dict:
    """Dependency that validates token AND checks required scopes."""
    if security_scopes.scopes:
        authenticate_value = f'Bearer scope="{security_scopes.scope_str}"'
    else:
        authenticate_value = "Bearer"

    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": authenticate_value},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_scopes = payload.get("scopes", [])
    except JWTError:
        raise credentials_exception

    # Check if all required scopes are present
    for scope in security_scopes.scopes:
        if scope not in token_scopes:
            raise HTTPException(
                status_code=403,
                detail=f"Not enough permissions. Required: {scope}",
                headers={"WWW-Authenticate": authenticate_value},
            )
    return {"username": username, "scopes": token_scopes}

# Endpoint requiring specific scope
@app.get("/items", dependencies=[Security(get_current_user, scopes=["read:items"])])
async def list_items():
    return [{"id": 1, "name": "Item 1"}]`,
              language: 'python',
            },
          ],
          tips: [
            'Use SecurityScopes in your dependency to dynamically check which scopes an endpoint requires — this enables a single dependency for all protected routes.',
            'Add meaningful descriptions to your scopes — they appear as tooltips in the Swagger UI Authorize dialog.',
            'Use Security() instead of Depends() for security dependencies — it enables the scope-checking feature in FastAPI.',
          ],
          keyTakeaway:
            'OAuth2PasswordBearer with scopes gives you a fully interactive Swagger UI auth experience — users can log in and test protected endpoints without Postman.',
        },
      ],
    },

    // ──────────────────────────────────────────────
    // TOPIC 3: Password Hashing
    // ──────────────────────────────────────────────
    {
      id: 'm5-password-hashing',
      title: 'Password Hashing',
      icon: '🛡️',
      introduction:
        'Storing passwords in plain text is one of the most catastrophic security mistakes an application can make. If your database is compromised, every user\'s password is immediately exposed. Password hashing transforms passwords into irreversible fixed-length strings, so even if the hash is leaked, the original password cannot be recovered. FastAPI works with passlib and bcrypt to make secure password hashing straightforward.',
      sections: [
        {
          heading: 'Hashing and Verifying Passwords with passlib',
          content: `Password hashing is fundamentally different from encryption. Encryption is reversible — given the key, you can decrypt the ciphertext back to the original text. Hashing is one-way — you can compute the hash from the password, but you cannot compute the password from the hash. When a user registers, you hash their password and store the hash. When they log in, you hash the submitted password and compare it to the stored hash. If they match, the password is correct.

The industry-standard algorithm for password hashing is **bcrypt**. Bcrypt is deliberately slow (it uses a cost factor that determines how many iterations to run), which makes brute-force attacks computationally expensive. A cost factor of 12 means each hash takes roughly 250ms to compute — fast enough for a single login but slow enough to make cracking a stolen database infeasible. Bcrypt also generates a unique salt for each hash automatically, so identical passwords produce different hashes.

In Python, the \`passlib\` library provides a clean interface to bcrypt. The \`CryptContext\` class manages hashing schemes and automatically handles salt generation, version migration, and verification. You create a context with your preferred schemes, then call \`hash()\` to hash a password and \`verify()\` to check a password against a hash.`,
          codeExamples: [
            {
              title: 'Password Hashing Utility with passlib',
              description: 'Production-ready password hashing and verification module',
              code: `from passlib.context import CryptContext

# Configure passlib to use bcrypt with a cost factor of 12
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",  # Automatically upgrade hashes on verification
    bcrypt__rounds=12,   # Cost factor (higher = more secure but slower)
)

def hash_password(password: str) -> str:
    """Hash a plaintext password. Returns a bcrypt hash string."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a stored hash."""
    return pwd_context.verify(plain_password, hashed_password)

# Example usage
raw = "my-super-secret-password"
hashed = hash_password(raw)
print(f"Hashed: {hashed}")
# $2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

print(f"Verify correct: {verify_password('my-super-secret-password', hashed)}")
# True
print(f"Verify wrong:   {verify_password('wrong-password', hashed)}")
# False`,
              language: 'python',
              output: `Hashed: $2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
Verify correct: True
Verify wrong:   False`,
            },
            {
              title: 'User Registration and Login with Password Hashing',
              description: 'Complete flow: register with hashed password, login with verification',
              code: `from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from jose import jwt
from datetime import datetime, timedelta, timezone

app = FastAPI()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserInDB(BaseModel):
    username: str
    email: str
    hashed_password: str

# Simulated database
users_db: dict[str, dict] = {}

@app.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate):
    """Register a new user with a securely hashed password."""
    if user.username in users_db:
        raise HTTPException(status_code=400, detail="Username already exists")

    hashed = pwd_context.hash(user.password)
    users_db[user.username] = {
        "username": user.username,
        "email": user.email,
        "hashed_password": hashed,
    }
    return {"message": "User created successfully", "username": user.username}

@app.post("/auth/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Authenticate user and return JWT token."""
    user = users_db.get(form_data.username)
    if not user or not pwd_context.verify(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = jwt.encode(
        {"sub": user["username"],
         "exp": datetime.now(timezone.utc) + timedelta(minutes=30)},
        SECRET_KEY, algorithm=ALGORITHM
    )
    return {"access_token": token, "token_type": "bearer"}`,
              language: 'python',
            },
          ],
          tips: [
            'Use bcrypt__rounds=12 as a good balance between security and performance. Each increment doubles the computation time.',
            'Never implement your own hashing algorithm — use well-tested libraries like passlib with bcrypt.',
            'The deprecated="auto" setting in CryptContext automatically upgrades hashes to the latest scheme when a user logs in.',
          ],
          keyTakeaway:
            'Always hash passwords with bcrypt via passlib — it\'s deliberately slow to compute, making brute-force attacks impractical.',
        },
        {
          heading: 'Security Best Practices for Password Handling',
          content: `Beyond the core hashing algorithm, several security practices are essential for protecting user passwords in a production system. First, **validate password strength** at registration — enforce minimum length (8+ characters), require a mix of character types, and check against common password lists. The \`zxcvbn\` library (or Python port \`zxcvbn-python\`) provides realistic strength estimation.

Second, **never log passwords** — not even the plaintext version during registration or login. Use structured logging that explicitly excludes sensitive fields. If you must debug authentication, log only whether verification succeeded or failed, never the actual password or hash values.

Third, **implement password migration** — when you upgrade your hashing algorithm (e.g., from SHA-256 to bcrypt), you can't re-hash existing passwords because you don't have the plaintext. Instead, use passlib's \`deprecated="auto"\` flag, which marks old hashes as deprecated. When a user with a deprecated hash logs in, verify their password against the old hash, and if it matches, immediately re-hash it with the new algorithm and update the database. This is called "lazy migration" and it's the standard approach for upgrading password security.

Fourth, **rate-limit login attempts** to prevent brute-force attacks — we cover this in the Rate Limiting topic, but it's worth mentioning here that password hashing alone isn't enough; you must also limit how fast an attacker can try passwords.`,
          codeExamples: [
            {
              title: 'Password Validation and Strength Checking',
              description: 'Enforce strong passwords and validate at registration time',
              code: `import re
from pydantic import BaseModel, field_validator

class UserRegistration(BaseModel):
    username: str
    password: str

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError("Password must contain at least one special character")
        return v

# FastAPI will automatically return 422 with the validation error
@app.post("/register")
async def register(user: UserRegistration):
    hashed = pwd_context.hash(user.password)
    # Store in database...
    return {"message": "Registered successfully"}`,
              language: 'python',
              output: `# POST /register with weak password
{
  "username": "alice",
  "password": "weak"
}
# Response: 422 Unprocessable Entity
{
  "detail": [
    {
      "type": "value_error",
      "msg": "Value error, Password must be at least 8 characters",
      "input": "weak"
    }
  ]
}`,
            },
            {
              title: 'Lazy Password Hash Migration',
              description: 'Upgrade from deprecated hashes to bcrypt when users log in',
              code: `from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["bcrypt", "sha256_crypt"],  # Support old and new schemes
    deprecated="auto",  # Mark sha256_crypt as deprecated
)

def authenticate_user(username: str, password: str) -> dict | None:
    user = users_db.get(username)
    if not user:
        return None

    if pwd_context.verify(password, user["hashed_password"]):
        # Check if the hash needs upgrading
        if pwd_context.needs_update(user["hashed_password"]):
            # Re-hash with the new scheme and update the database
            user["hashed_password"] = pwd_context.hash(password)
            # Save updated hash to database
            save_user_to_db(user)
        return user
    return None`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'flow',
            title: 'Password Hash Migration Flow',
            description: 'How lazy migration upgrades old hashes without requiring password resets',
            steps: [
              { label: 'User submits login', detail: 'POST /auth/token with username + password', highlight: true },
              { label: 'Verify against stored hash', detail: 'passlib handles both bcrypt and sha256_crypt' },
              { label: 'Check if hash needs update', detail: 'pwd_context.needs_update() returns True for deprecated schemes', highlight: true },
              { label: 'Re-hash with bcrypt', detail: 'Compute new bcrypt hash from the plaintext password', highlight: true },
              { label: 'Update database', detail: 'Replace old hash with new bcrypt hash' },
              { label: 'Continue login normally', detail: 'User is authenticated; next login uses bcrypt', highlight: false },
            ],
          },
          tips: [
            'Enforce password strength at registration using Pydantic validators — FastAPI returns 422 errors automatically.',
            'Never log, print, or expose password hashes in error messages, API responses, or debug output.',
            'Use lazy migration (deprecated="auto") to upgrade hashes over time without forcing password resets on all users.',
          ],
          keyTakeaway:
            'Password security is a defense-in-depth practice: strong hashing, strong passwords, no logging, and gradual migration.',
        },
      ],
    },

    // ──────────────────────────────────────────────
    // TOPIC 4: Role-Based Access Control (RBAC)
    // ──────────────────────────────────────────────
    {
      id: 'm5-rbac',
      title: 'Role-Based Access Control (RBAC)',
      icon: '👥',
      introduction:
        'Role-Based Access Control (RBAC) restricts system access based on the roles assigned to individual users. Instead of managing permissions for each user individually, you assign roles (like "admin", "editor", "viewer") and then check those roles in your FastAPI dependencies. This approach scales beautifully — when you need to change access rules, you update the role definition, not every user.',
      sections: [
        {
          heading: 'Building Role Dependencies and the require_role Factory',
          content: `The core idea of RBAC in FastAPI is to create reusable dependency functions that check whether the authenticated user has the required role. The cleanest way to do this is with a **factory function** — a function that returns a dependency. You call \`require_role("admin")\` and it returns a dependency that checks if the current user's role is "admin". This pattern is composable, testable, and keeps your route definitions clean and declarative.

The factory pattern works because FastAPI dependencies are just callable objects. When you write \`Depends(require_role("admin"))\`, the \`require_role("admin")\` call returns a function (the actual dependency), and FastAPI calls that function at request time. The returned function has a closure over the required role, so it can compare it against the user's role from the JWT payload.

For more sophisticated systems, you can implement a hierarchical role system where admin inherits all viewer permissions, or a permission-based system where roles are collections of fine-grained permissions (like \`articles:write\`, \`users:delete\`). The factory pattern works for both approaches — you just change the comparison logic inside the returned dependency.`,
          codeExamples: [
            {
              title: 'Role Dependency Factory',
              description: 'A factory function that creates role-checking dependencies',
              code: `from fastapi import Depends, HTTPException, status
from functools import lru_cache

# Assume get_current_user is defined elsewhere (JWT verification)
async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    # ... JWT decode logic ...
    return {"username": "alice", "role": "editor"}

def require_role(*allowed_roles: str):
    """
    Factory that creates a dependency checking user role.
    Usage: Depends(require_role("admin", "editor"))
    """
    async def role_checker(current_user: dict = Depends(get_current_user)) -> dict:
        if current_user.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user.get('role')}' not authorized. "
                       f"Required: {', '.join(allowed_roles)}",
            )
        return current_user
    return role_checker

# Route-level usage — clean and declarative
@app.get("/admin/dashboard")
async def admin_dashboard(user: dict = Depends(require_role("admin"))):
    return {"message": f"Welcome, admin {user['username']}"}

@app.get("/content/edit")
async def edit_content(user: dict = Depends(require_role("admin", "editor"))):
    return {"message": f"Edit access granted for {user['username']}"}

@app.get("/content/view")
async def view_content(user: dict = Depends(require_role("admin", "editor", "viewer"))):
    return {"message": "View access granted"}`,
              language: 'python',
            },
            {
              title: 'Permission-Based Access Control',
              description: 'Fine-grained permissions instead of flat roles',
              code: `from fastapi import Depends, HTTPException, status
from typing import Set

# Role-to-permissions mapping
ROLE_PERMISSIONS: dict[str, Set[str]] = {
    "viewer": {"articles:read", "comments:read"},
    "editor": {"articles:read", "articles:write", "comments:read", "comments:write"},
    "admin": {"articles:read", "articles:write", "articles:delete",
              "comments:read", "comments:write", "comments:delete",
              "users:read", "users:write", "users:delete"},
}

def require_permission(*required_permissions: str):
    """Factory that checks if the user's role grants the required permissions."""
    async def permission_checker(current_user: dict = Depends(get_current_user)) -> dict:
        user_permissions = ROLE_PERMISSIONS.get(current_user.get("role", ""), set())
        for perm in required_permissions:
            if perm not in user_permissions:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Missing permission: {perm}",
                )
        return current_user
    return permission_checker

@app.delete("/articles/{article_id}")
async def delete_article(
    article_id: int,
    user: dict = Depends(require_permission("articles:delete"))
):
    return {"message": f"Article {article_id} deleted by {user['username']}"}

@app.post("/comments")
async def create_comment(
    user: dict = Depends(require_permission("comments:write"))
):
    return {"message": f"Comment created by {user['username']}"}`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'architecture',
            title: 'RBAC Architecture Layers',
            description: 'How roles, permissions, and dependencies compose in a FastAPI application',
            layers: [
              { label: 'Route Layer', items: ['@app.get("/admin")', 'Depends(require_role("admin"))', 'Endpoint function'] },
              { label: 'Dependency Layer', items: ['require_role() factory', 'require_permission() factory', 'get_current_user()'] },
              { label: 'Permission Layer', items: ['Role → Permissions mapping', 'Hierarchical inheritance', 'Permission strings (resource:action)'] },
              { label: 'Identity Layer', items: ['JWT payload (sub, role)', 'User database', 'Role assignments'] },
            ],
          },
          tips: [
            'Use a factory function (require_role) instead of writing individual dependency functions for each role — it\'s DRY and maintainable.',
            'Prefer permission-based checks (articles:delete) over flat role checks (admin) for fine-grained control in larger applications.',
            'Always return 403 Forbidden (not 401 Unauthorized) when an authenticated user lacks permissions — 401 means "not logged in", 403 means "logged in but not allowed".',
          ],
          keyTakeaway:
            'The require_role factory pattern makes RBAC declarative — just add Depends(require_role("admin")) to any endpoint.',
        },
        {
          heading: 'Implementing a Complete Permission System',
          content: `A production-grade RBAC system needs more than just role checking — it needs a way to manage role assignments, handle role hierarchies, and audit permission changes. The foundation is a data model that connects users to roles and roles to permissions. In a database-backed system, this typically involves three tables: users, roles, and a user-role join table (many-to-many relationship).

Role hierarchies allow roles to inherit permissions from other roles. For example, an "admin" role might inherit all permissions from "editor", which inherits from "viewer". This means you only need to define the unique permissions for each role — the inherited ones come automatically. Implementing this is straightforward: when checking permissions, you collect permissions from the user's role AND all roles it inherits from.

Audit logging is critical for compliance and security incident investigation. Every permission change (role assignment, role revocation, permission modification) should be logged with the actor, target user, change details, and timestamp. This creates an immutable trail that answers the question: "Who gave this user admin access, and when?"`,
          codeExamples: [
            {
              title: 'Database-Backed RBAC with Role Hierarchy',
              description: 'Complete RBAC system with hierarchical roles and audit logging',
              code: `from fastapi import FastAPI, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

app = FastAPI()

# ── Role Hierarchy ───────────────────────────────
ROLE_HIERARCHY: dict[str, list[str]] = {
    "viewer": [],
    "editor": ["viewer"],      # editor inherits viewer permissions
    "admin": ["editor"],       # admin inherits editor (+ viewer) permissions
    "superadmin": ["admin"],   # superadmin inherits everything
}

def get_inherited_roles(role: str) -> set[str]:
    """Get all roles inherited by the given role (transitive)."""
    inherited = set()
    queue = [role]
    while queue:
        current = queue.pop()
        for parent in ROLE_HIERARCHY.get(current, []):
            if parent not in inherited:
                inherited.add(parent)
                queue.append(parent)
    return inherited

def get_all_permissions(role: str) -> set[str]:
    """Get permissions for the role and all inherited roles."""
    all_roles = {role} | get_inherited_roles(role)
    perms = set()
    for r in all_roles:
        perms |= ROLE_PERMISSIONS.get(r, set())
    return perms

# ── Audit Logging ────────────────────────────────
class AuditLog(BaseModel):
    actor: str
    action: str
    target_user: str
    details: str
    timestamp: datetime

audit_logs: list[AuditLog] = []

def log_permission_change(actor: str, action: str, target: str, details: str):
    audit_logs.append(AuditLog(
        actor=actor, action=action,
        target_user=target, details=details,
        timestamp=datetime.now(),
    ))`,
              language: 'python',
            },
          ],
          tips: [
            'Implement role hierarchies using transitive inheritance — admin inherits from editor, which inherits from viewer.',
            'Log every role and permission change in an audit trail — this is essential for compliance and incident investigation.',
            'Separate the concepts of authentication (who are you?) and authorization (what can you do?) — RBAC handles authorization only.',
          ],
          keyTakeaway:
            'A production RBAC system combines hierarchical roles, permission inheritance, and audit logging for complete access control.',
        },
      ],
    },

    // ──────────────────────────────────────────────
    // TOPIC 5: Rate Limiting
    // ──────────────────────────────────────────────
    {
      id: 'm5-rate-limiting',
      title: 'Rate Limiting',
      icon: '⏱️',
      introduction:
        'Rate limiting protects your API from abuse — whether it\'s a brute-force attack on login endpoints, a DDoS flood, or a misbehaving client making too many requests. FastAPI integrates with the slowapi library to provide per-endpoint, per-IP, and sliding-window rate limiting with minimal configuration.',
      sections: [
        {
          heading: 'Configuring slowapi for Per-Endpoint Limits',
          content: `slowapi is a rate-limiting library built on top of Flask-Limiter and the limits package. It provides a clean decorator-based API that integrates seamlessly with FastAPI. Under the hood, it uses a sliding-window counter algorithm that tracks request counts per client (identified by IP address or custom key) within a time window and rejects requests that exceed the limit with a 429 Too Many Requests response.

The basic setup involves three steps: (1) create a \`Limiter\` instance with a key function (usually the client's IP address), (2) attach it to your FastAPI app as a middleware, and (3) apply the \`@limiter.limit()\` decorator to your endpoints. The limit string syntax follows the format \`"count/period"\` — for example, \`"5/minute"\` allows 5 requests per minute, \`"100/hour"\` allows 100 per hour, and \`"10/second"\` allows 10 per second.

slowapi stores request counts in memory by default (using an in-memory storage backend), which is fine for development and single-instance deployments. For production with multiple instances, you should configure Redis as the storage backend so that all instances share the same rate-limit counters.`,
          codeExamples: [
            {
              title: 'Basic slowapi Setup with Per-Endpoint Limits',
              description: 'Configure rate limiting on specific endpoints',
              code: `from fastapi import FastAPI, Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

app = FastAPI()

# Create limiter — use client IP as the rate-limit key
limiter = Limiter(key_func=get_remote_address)

# Add rate limit error handler and middleware
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# ── Per-endpoint rate limits ─────────────────────
@app.get("/public")
@limiter.limit("100/minute")  # Generous limit for public data
async def public_data(request: Request):
    return {"data": "This is public information"}

@app.post("/auth/login")
@limiter.limit("5/minute")  # Strict limit for login attempts
async def login(request: Request):
    return {"message": "Login endpoint"}

@app.get("/search")
@limiter.limit("30/minute")  # Moderate limit for expensive queries
async def search(request: Request, q: str):
    return {"query": q, "results": []}

@app.post("/upload")
@limiter.limit("10/hour")  # Very strict for resource-heavy operations
async def upload(request: Request):
    return {"message": "Upload endpoint"}`,
              language: 'python',
            },
            {
              title: 'Custom Key Functions for Rate Limiting',
              description: 'Rate limit by user ID, API key, or any custom identifier',
              code: `from slowapi import Limiter
from fastapi import Request, Depends

def get_user_id(request: Request) -> str:
    """Rate limit by authenticated user ID instead of IP."""
    # Extract user from JWT (if authenticated)
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        try:
            from jose import jwt
            payload = jwt.decode(auth_header[7:], SECRET_KEY, algorithms=[ALGORITHM])
            return f"user:{payload.get('sub', 'anonymous')}"
        except Exception:
            pass
    # Fallback to IP address for unauthenticated requests
    return f"ip:{get_remote_address(request)}"

def get_api_key_or_ip(request: Request) -> str:
    """Rate limit by API key if present, otherwise by IP."""
    api_key = request.headers.get("X-API-Key")
    if api_key:
        return f"key:{api_key}"
    return f"ip:{get_remote_address(request)}"

# Use custom key function
limiter = Limiter(key_func=get_user_id)

# You can also use different key functions per endpoint
@app.get("/data")
@limiter.limit("50/minute", key_func=get_api_key_or_ip)
async def get_data(request: Request):
    return {"data": "rate-limited by API key or IP"}`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'comparison',
            title: 'Rate Limiting Strategies',
            description: 'Different strategies for different endpoint types',
            columns: [
              {
                title: 'Endpoint Type',
                items: ['Login/Auth', 'Search/Query', 'Public Data', 'Upload/Write', 'Admin Actions'],
              },
              {
                title: 'Typical Limit',
                items: ['5/minute', '30/minute', '100/minute', '10/hour', '20/minute'],
              },
              {
                title: 'Key Function',
                items: ['IP address', 'User ID', 'IP address', 'User ID', 'User ID + Role'],
              },
              {
                title: 'Rationale',
                items: ['Prevent brute force', 'Limit expensive queries', 'Allow normal browsing', 'Protect storage', 'Audit + limit'],
              },
            ],
          },
          tips: [
            'Apply the strictest rate limits to authentication endpoints — brute-force protection is the #1 reason for rate limiting.',
            'Use Redis as the storage backend for multi-instance deployments — in-memory storage doesn\'t share counters across processes.',
            'Include rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining) in responses so clients can self-regulate.',
          ],
          keyTakeaway:
            'slowapi makes per-endpoint rate limiting declarative — add @limiter.limit("5/minute") and brute-force attacks are stopped cold.',
        },
        {
          heading: 'Sliding Window and IP-Based Limiting Strategies',
          content: `Rate limiting algorithms differ in how they count requests within a time window. The two main approaches are **fixed window** (counts requests in discrete time buckets, e.g., 0:00-0:59, 1:00-1:59) and **sliding window** (continuously tracks requests within the last N seconds). Fixed window has a known weakness: a client can send 2x the limit by clustering requests around the window boundary. Sliding window eliminates this by maintaining a rolling count.

slowapi supports multiple backends for storing rate limit counters. The default in-memory backend works for single-process development but loses state on restart and doesn't share across multiple server instances. For production, configure Redis as the storage backend. Redis provides atomic increment operations, automatic key expiration, and sub-millisecond latency — perfect for rate limiting.

IP-based limiting has edge cases you need to handle. Users behind corporate NATs or VPNs share an IP address, so strict IP-based limits may unfairly penalize legitimate users. Conversely, attackers can rotate IPs using proxy networks. The best practice is to combine IP-based limits with user-based or API-key-based limits, using the stricter of the two. This way, a single compromised account can't exceed its per-user limit, and a DDoS from many IPs is still throttled by IP.`,
          codeExamples: [
            {
              title: 'Redis-Backed Rate Limiting for Production',
              description: 'Configure slowapi with Redis for distributed rate limiting',
              code: `from slowapi import Limiter
from slowapi.storage import RedisStorage
import redis

# Connect to Redis (adjust host/port for your infrastructure)
redis_client = redis.Redis(host="localhost", port=6379, db=0)

# Create limiter with Redis storage backend
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri="redis://localhost:6379/0",
    # Or use the RedisStorage class directly:
    # storage=RedisStorage(redis_client),
)

# Now rate limit counters persist across restarts
# and are shared across multiple FastAPI instances`,
              language: 'python',
            },
            {
              title: 'Dynamic Rate Limits Based on User Tier',
              description: 'Different rate limits for free vs premium users',
              code: `from slowapi import Limiter
from fastapi import Request, Depends

# User tier configurations
TIER_LIMITS = {
    "free": "30/minute",
    "pro": "100/minute",
    "enterprise": "1000/minute",
}

def get_tier_limit(request: Request) -> str:
    """Dynamically select rate limit based on user's subscription tier."""
    user = getattr(request.state, "user", None)
    if user:
        return TIER_LIMITS.get(user.get("tier", "free"), "30/minute")
    return TIER_LIMITS["free"]

@app.get("/api/data")
@limiter.limit(lambda request: get_tier_limit(request))
async def get_api_data(request: Request):
    """Rate limit adjusts based on user's subscription tier."""
    return {"data": "tier-specific response"}

# Alternatively, use multiple limits for layered protection
@app.post("/api/expensive")
@limiter.limit("5/minute")    # Global limit (all users)
@limiter.limit("1/second")    # Burst limit (prevent rapid-fire)
async def expensive_operation(request: Request):
    return {"result": "expensive computation complete"}`,
              language: 'python',
            },
          ],
          tips: [
            'Use sliding window over fixed window to prevent the boundary-doubling attack where a client sends 2x the limit at a window boundary.',
            'Combine IP-based and user-based rate limits — use the stricter result to defend against both DDoS and compromised accounts.',
            'Return 429 Too Many Requests with a Retry-After header so well-behaved clients know when to try again.',
          ],
          keyTakeaway:
            'Use Redis-backed sliding-window rate limiting with tiered limits for production APIs — it\'s fair, accurate, and distributed.',
        },
      ],
    },

    // ──────────────────────────────────────────────
    // TOPIC 6: Security Headers & CORS
    // ──────────────────────────────────────────────
    {
      id: 'm5-security-headers-cors',
      title: 'Security Headers & CORS',
      icon: '🌐',
      introduction:
        'HTTP security headers are your first line of defense against cross-site scripting (XSS), clickjacking, and other browser-based attacks. CORS (Cross-Origin Resource Sharing) controls which external domains can access your API. Together, they form the browser-security layer that protects your users. This topic covers the essential security headers, HSTS, Content Security Policy, and proper CORS configuration for FastAPI.',
      sections: [
        {
          heading: 'Essential Security Headers: X-Frame-Options, CSP, HSTS',
          content: `Security headers instruct the browser to enable built-in protections. They are not visible to users, but they prevent entire classes of attacks. Every production API should set these headers on every response, and the easiest way to do that in FastAPI is with middleware.

**X-Frame-Options** prevents clickjacking by controlling whether your page can be embedded in an iframe. Set it to \`DENY\` (no framing allowed) or \`SAMEORIGIN\` (only same-site framing). Clickjacking works by overlaying an invisible iframe on top of a visible button, so when the user clicks what they think is a legitimate button, they're actually interacting with your hidden page.

**Content-Security-Policy (CSP)** is the most powerful security header. It tells the browser which sources of content are allowed — scripts, styles, images, fonts, and more. A strict CSP like \`default-src 'self'\` blocks all inline scripts and external resources, which defeats most XSS attacks. For APIs that return HTML, CSP is essential; for pure JSON APIs, it's a defense-in-depth measure.

**Strict-Transport-Security (HSTS)** forces browsers to always use HTTPS, preventing SSL-stripping attacks. Once a browser sees this header, it refuses to make HTTP connections to your domain for the specified duration. Set it to \`max-age=31536000; includeSubDomains; preload\` for maximum protection, but only after you're confident your entire domain works over HTTPS.`,
          codeExamples: [
            {
              title: 'Security Headers Middleware for FastAPI',
              description: 'Add all essential security headers to every response',
              code: `from fastapi import FastAPI
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

app = FastAPI()

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)

        # Prevent clickjacking — your page cannot be embedded in iframes
        response.headers["X-Frame-Options"] = "DENY"

        # Prevent MIME-type sniffing — browser must respect declared Content-Type
        response.headers["X-Content-Type-Options"] = "nosniff"

        # XSS protection (legacy, mostly for older browsers)
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # Force HTTPS for 1 year, including all subdomains
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains; preload"
        )

        # Content Security Policy — strict default, allow nothing
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self'; "
            "style-src 'self' 'unsafe-inline'; "  # unsafe-inline for styled docs
            "img-src 'self' data:; "
            "frame-ancestors 'none'; "  # Equivalent to X-Frame-Options: DENY
            "base-uri 'self'; "
            "form-action 'self'"
        )

        # Control referrer information sent to other sites
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Control browser features (camera, microphone, geolocation, etc.)
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=(), payment=()"
        )

        return response

app.add_middleware(SecurityHeadersMiddleware)

@app.get("/")
async def root():
    return {"message": "All responses now have security headers"}`,
              language: 'python',
            },
            {
              title: 'Secure Cookie Settings',
              description: 'Configure cookies with security flags for session management',
              code: `from fastapi import FastAPI, Response
from fastapi.responses import JSONResponse

app = FastAPI()

@app.post("/auth/login")
async def login(response: Response):
    # After successful authentication...
    token = create_access_token({"sub": "user123"})

    # Set secure cookie with all protection flags
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,    # JavaScript CANNOT access this cookie (prevents XSS)
        secure=True,      # Only sent over HTTPS (prevents network sniffing)
        samesite="lax",   # Prevents CSRF (cookie not sent on cross-site requests)
        max_age=1800,     # Expires in 30 minutes
        path="/",         # Available on all paths
        domain=None,      # Current domain only (no subdomains)
    )

    # Also return token in body for API clients that use Authorization header
    return {"access_token": token, "token_type": "bearer"}

@app.post("/auth/logout")
async def logout(response: Response):
    # Clear the cookie by setting max_age to 0
    response.delete_cookie(
        key="access_token",
        httponly=True,
        secure=True,
        samesite="lax",
    )
    return {"message": "Logged out"}`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'architecture',
            title: 'Security Headers Defense Layers',
            description: 'How each header protects against different attack vectors',
            layers: [
              { label: 'Transport Layer', items: ['HSTS (force HTTPS)', 'TLS 1.3', 'Certificate pinning'] },
              { label: 'Browser Protection', items: ['X-Frame-Options (clickjacking)', 'CSP (XSS)', 'X-Content-Type-Options (MIME sniffing)'] },
              { label: 'Cookie Security', items: ['HttpOnly (no JS access)', 'Secure (HTTPS only)', 'SameSite (CSRF protection)'] },
              { label: 'Privacy Controls', items: ['Referrer-Policy', 'Permissions-Policy', 'Cross-Origin-Opener-Policy'] },
            ],
          },
          tips: [
            'Always set HttpOnly, Secure, and SameSite flags on authentication cookies — this prevents XSS, network sniffing, and CSRF respectively.',
            'Start with a restrictive CSP and relax it as needed — it\'s easier to start strict than to tighten a permissive policy later.',
            'Test your security headers using securityheaders.com or the browser DevTools Network tab — verify every response includes them.',
          ],
          keyTakeaway:
            'Security headers are your browser-level defense: HSTS forces HTTPS, CSP stops XSS, X-Frame-Options prevents clickjacking, and secure cookies prevent theft.',
        },
        {
          heading: 'CORS Configuration for Cross-Origin APIs',
          content: `Cross-Origin Resource Sharing (CORS) is a browser security mechanism that controls which web domains can make requests to your API. Without CORS headers, a browser blocks cross-origin requests (e.g., a page at \`app.example.com\` calling \`api.example.com\`). This is the Same-Origin Policy — a fundamental browser security feature.

When a browser makes a cross-origin request, it first sends a "preflight" OPTIONS request with the \`Origin\` header. Your server must respond with CORS headers that allow the origin, methods, and headers the client wants to use. If the preflight fails, the browser blocks the actual request. FastAPI's \`CORSMiddleware\` handles this automatically — you just configure which origins, methods, and headers to allow.

The most common mistake is setting \`allow_origins=["*"]\` in production. While convenient for development, this allows ANY website to make requests to your API, which is dangerous if your API uses cookie-based authentication (it enables CSRF attacks). In production, always specify the exact origins that should be allowed, and never use wildcards with credentials.`,
          codeExamples: [
            {
              title: 'CORS Middleware Configuration',
              description: 'Proper CORS setup for development and production environments',
              code: `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()

# ── Development CORS (permissive) ────────────────
if os.getenv("ENVIRONMENT") == "development":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",  # React dev server
            "http://localhost:5173",  # Vite dev server
            "http://localhost:8080",  # Vue dev server
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# ── Production CORS (restrictive) ────────────────
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "https://app.example.com",
            "https://admin.example.com",
        ],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
        allow_headers=["Authorization", "Content-Type", "X-API-Key"],
        expose_headers=["X-Total-Count", "X-Request-Id"],
        max_age=3600,  # Cache preflight results for 1 hour
    )`,
              language: 'python',
            },
            {
              title: 'Dynamic CORS with Origin Validation',
              description: 'Validate origins dynamically for multi-tenant applications',
              code: `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

ALLOWED_DOMAINS = {"example.com", "myapp.io"}

def is_allowed_origin(origin: str) -> bool:
    """Check if the origin's domain is in the allowed list."""
    try:
        from urllib.parse import urlparse
        parsed = urlparse(origin)
        domain = parsed.hostname or ""
        # Allow exact matches and subdomains
        return any(
            domain == allowed or domain.endswith(f".{allowed}")
            for allowed in ALLOWED_DOMAINS
        )
    except Exception:
        return False

app.add_middleware(
    CORSMiddleware,
    allow_origins=is_allowed_origin,  # Function as origin validator
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
    max_age=600,
)

# This allows any subdomain of example.com and myapp.io
# e.g., app.example.com, staging.myapp.io, admin.example.com`,
              language: 'python',
            },
          ],
          tips: [
            'NEVER use allow_origins=["*"] with allow_credentials=True — this combination is blocked by browsers as a security risk.',
            'Specify exact methods and headers in production instead of wildcards — it reduces the attack surface and documents your API\'s actual requirements.',
            'Set max_age to cache preflight responses — this reduces OPTIONS requests and improves performance for repeated cross-origin calls.',
          ],
          warning:
            'Setting allow_origins=["*"] with cookie-based authentication exposes your users to CSRF attacks. Always specify exact origins in production.',
          keyTakeaway:
            'CORS controls which websites can call your API — always specify exact origins in production and never use wildcards with credentials.',
        },
      ],
    },

    // ──────────────────────────────────────────────
    // TOPIC 7: API Key Authentication
    // ──────────────────────────────────────────────
    {
      id: 'm5-api-key-auth',
      title: 'API Key Authentication',
      icon: '🗝️',
      introduction:
        'API key authentication is the simplest way to secure machine-to-machine communication. Unlike JWT tokens (which represent a user session), API keys are long-lived, static credentials that identify a client application. They\'re ideal for third-party integrations, internal microservices, and public APIs where you need to track usage per client without the complexity of OAuth2.',
      sections: [
        {
          heading: 'API Key in Header and Query Parameters',
          content: `API keys can be transmitted in two ways: as a custom HTTP header (preferred) or as a query parameter (fallback for clients that can't set headers). FastAPI's \`APIKeyHeader\` and \`APIKeyQuery\` classes extract the key from the appropriate location and make it available as a dependency.

Using a custom header like \`X-API-Key\` is the recommended approach because it keeps the key out of URLs (which appear in browser history, server logs, and referrer headers). However, some clients (like embedded devices or simple scripts) may not be able to set custom headers, so supporting query parameter keys (\`?api_key=...\`) provides a fallback at the cost of reduced security.

The key validation logic is straightforward: extract the key from the request, look it up in your database (or in-memory store), and if found, attach the associated client metadata to the request. If not found, return a 401 Unauthorized response. The important detail is that API key lookup must be fast — it happens on every single request, so cache frequently-used keys.`,
          codeExamples: [
            {
              title: 'API Key Authentication with Header and Query Support',
              description: 'Extract and validate API keys from both header and query parameter',
              code: `from fastapi import FastAPI, Depends, HTTPException, status, Security
from fastapi.security import APIKeyHeader, APIKeyQuery
from pydantic import BaseModel
from typing import Optional

app = FastAPI()

# ── API Key Extractors ───────────────────────────
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)
api_key_query = APIKeyQuery(name="api_key", auto_error=False)

# ── API Key Database ─────────────────────────────
class APIKeyInfo(BaseModel):
    client_id: str
    client_name: str
    tier: str  # "free", "pro", "enterprise"
    is_active: bool

api_keys_db: dict[str, APIKeyInfo] = {
    "sk-live-abc123": APIKeyInfo(
        client_id="client_1", client_name="Acme Corp",
        tier="enterprise", is_active=True
    ),
    "sk-test-xyz789": APIKeyInfo(
        client_id="client_2", client_name="Beta Inc",
        tier="free", is_active=True
    ),
}

async def get_api_key(
    header_key: Optional[str] = Depends(api_key_header),
    query_key: Optional[str] = Depends(api_key_query),
) -> APIKeyInfo:
    """
    Extract API key from header (preferred) or query parameter (fallback).
    Validates the key and returns associated client information.
    """
    key = header_key or query_key
    if key is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key required. Provide X-API-Key header or api_key query parameter.",
        )
    client = api_keys_db.get(key)
    if client is None or not client.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or revoked API key.",
        )
    return client

# ── Protected Endpoints ──────────────────────────
@app.get("/api/data")
async def get_data(client: APIKeyInfo = Depends(get_api_key)):
    return {
        "data": "sensitive information",
        "client": client.client_name,
        "tier": client.tier,
    }

@app.post("/api/data")
async def create_data(client: APIKeyInfo = Depends(get_api_key)):
    if client.tier == "free":
        raise HTTPException(status_code=403, detail="Write access requires Pro or Enterprise tier")
    return {"message": f"Data created by {client.client_name}"}`,
              language: 'python',
              output: `# With header: curl -H "X-API-Key: sk-live-abc123" http://localhost:8000/api/data
{"data": "sensitive information", "client": "Acme Corp", "tier": "enterprise"}

# With query: curl http://localhost:8000/api/data?api_key=sk-test-xyz789
{"data": "sensitive information", "client": "Beta Inc", "tier": "free"}`,
            },
          ],
          tips: [
            'Always prefer header-based API keys (X-API-Key) over query parameters — URLs are logged in browser history and server access logs.',
            'Set auto_error=False on both APIKeyHeader and APIKeyQuery so you can handle the "missing key" case with a custom error message.',
            'Prefix API keys with a readable identifier (sk-live-, sk-test-) to help identify the key type and prevent accidental leaks.',
          ],
          keyTakeaway:
            'API keys identify client applications, not users — extract from headers (preferred) or query parameters (fallback).',
        },
        {
          heading: 'API Key Management and Key Rotation',
          content: `Managing API keys in production involves more than just checking if a key exists. You need a system for creating keys with specific permissions, rotating keys without downtime, revoking compromised keys, and tracking usage per key. This is the operational side of API key authentication that turns a simple lookup into a robust access control system.

**Key rotation** is the process of replacing an old key with a new one without interrupting service. The standard approach is to issue a new key while keeping the old key active during a transition period (usually 24-48 hours). The client switches to the new key at their convenience, and after the transition period, the old key is automatically revoked. This prevents the "midnight key change" problem where updating a key causes downtime.

**Key metadata** should include the creation date, last used date, expiration date, associated permissions, and an optional description. The last-used date is particularly valuable for identifying unused keys that can be safely revoked. Keys that haven't been used in 90+ days are security risks — they might have been leaked without your knowledge.

**Usage tracking** records how many requests each key makes, which endpoints they access, and when they were last used. This data is essential for billing (tier-based pricing), security monitoring (detecting anomalous usage patterns), and capacity planning (understanding which clients generate the most load).`,
          codeExamples: [
            {
              title: 'Complete API Key Management System',
              description: 'Create, rotate, revoke, and track API keys with full lifecycle management',
              code: `from fastapi import FastAPI, Depends, HTTPException, status
from pydantic import BaseModel, Field
from datetime import datetime, timedelta, timezone
import secrets
import hashlib

app = FastAPI()

# ── Data Models ──────────────────────────────────
class APIKeyCreate(BaseModel):
    client_name: str
    tier: str = "free"
    description: str | None = None
    expires_in_days: int | None = None

class APIKeyResponse(BaseModel):
    key: str  # Only shown once at creation time!
    key_prefix: str
    client_name: str
    tier: str
    expires_at: datetime | None

class APIKeyRecord(BaseModel):
    key_hash: str       # We store the hash, not the raw key
    key_prefix: str     # First 8 chars for identification
    client_name: str
    tier: str
    description: str | None
    is_active: bool
    created_at: datetime
    last_used_at: datetime | None
    expires_at: datetime | None
    replaced_by: str | None  # Key prefix of the replacement key

# In production: use a database, not a dict
api_keys: dict[str, APIKeyRecord] = {}

def generate_api_key() -> tuple[str, str, str]:
    """Generate a new API key. Returns (raw_key, key_hash, key_prefix)."""
    raw_key = f"sk-live-{secrets.token_urlsafe(32)}"
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
    key_prefix = raw_key[:12]
    return raw_key, key_hash, key_prefix

def find_key_by_hash(key: str) -> APIKeyRecord | None:
    """Hash the provided key and look it up in the database."""
    key_hash = hashlib.sha256(key.encode()).hexdigest()
    return api_keys.get(key_hash)

# ── Endpoints ────────────────────────────────────
@app.post("/api-keys", response_model=APIKeyResponse)
async def create_api_key(req: APIKeyCreate, admin: dict = Depends(require_role("admin"))):
    """Create a new API key. The raw key is only returned once!"""
    raw_key, key_hash, key_prefix = generate_api_key()
    expires_at = None
    if req.expires_in_days:
        expires_at = datetime.now(timezone.utc) + timedelta(days=req.expires_in_days)

    api_keys[key_hash] = APIKeyRecord(
        key_hash=key_hash, key_prefix=key_prefix,
        client_name=req.client_name, tier=req.tier,
        description=req.description, is_active=True,
        created_at=datetime.now(timezone.utc),
        last_used_at=None, expires_at=expires_at,
        replaced_by=None,
    )
    return APIKeyResponse(
        key=raw_key, key_prefix=key_prefix,
        client_name=req.client_name, tier=req.tier,
        expires_at=expires_at,
    )

@app.post("/api-keys/{key_prefix}/rotate", response_model=APIKeyResponse)
async def rotate_api_key(key_prefix: str, admin: dict = Depends(require_role("admin"))):
    """Issue a new key and mark the old key for graceful deprecation."""
    # Find the old key by prefix
    old_record = next(
        (r for r in api_keys.values() if r.key_prefix == key_prefix and r.is_active),
        None,
    )
    if not old_record:
        raise HTTPException(status_code=404, detail="Active API key not found")

    # Generate new key with same metadata
    raw_key, key_hash, new_prefix = generate_api_key()
    new_record = APIKeyRecord(
        key_hash=key_hash, key_prefix=new_prefix,
        client_name=old_record.client_name, tier=old_record.tier,
        description=old_record.description, is_active=True,
        created_at=datetime.now(timezone.utc),
        last_used_at=None,
        expires_at=old_record.expires_at,
        replaced_by=None,
    )
    api_keys[key_hash] = new_record
    old_record.replaced_by = new_prefix
    old_record.is_active = False  # Mark old key as replaced

    return APIKeyResponse(
        key=raw_key, key_prefix=new_prefix,
        client_name=new_record.client_name, tier=new_record.tier,
        expires_at=new_record.expires_at,
    )

@app.delete("/api-keys/{key_prefix}")
async def revoke_api_key(key_prefix: str, admin: dict = Depends(require_role("admin"))):
    """Immediately revoke an API key."""
    record = next(
        (r for r in api_keys.values() if r.key_prefix == key_prefix),
        None,
    )
    if not record:
        raise HTTPException(status_code=404, detail="API key not found")
    record.is_active = False
    return {"message": f"Key {key_prefix} revoked"}`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'flow',
            title: 'API Key Rotation Flow',
            description: 'Graceful key rotation without service interruption',
            steps: [
              { label: 'Admin initiates rotation', detail: 'POST /api-keys/sk-live-ab/rotate', highlight: true },
              { label: 'New key generated', detail: 'sk-live-cd... issued with same permissions', highlight: true },
              { label: 'Old key marked as replaced', detail: 'is_active=False, replaced_by=new_prefix' },
              { label: 'Both keys valid during transition', detail: 'Grace period allows client to update', highlight: true },
              { label: 'Client updates to new key', detail: 'Switch from sk-live-ab to sk-live-cd', highlight: true },
              { label: 'Old key automatically revoked', detail: 'After transition period expires' },
              { label: 'Audit log recorded', detail: 'Rotation event logged with timestamps', highlight: false },
            ],
          },
          tips: [
            'Always store API key hashes (SHA-256), not raw keys — just like passwords, you should never be able to retrieve the original key.',
            'Show the raw API key only once at creation time — after that, only the prefix is visible for identification.',
            'Implement key rotation with a grace period — keep the old key active for 24-48 hours so clients can switch without downtime.',
          ],
          warning:
            'Never store raw API keys in your database — store SHA-256 hashes instead. If your database is compromised, the attacker cannot use the hashes to authenticate.',
          keyTakeaway:
            'Treat API keys like passwords: hash them for storage, show them once, rotate gracefully, and revoke immediately on compromise.',
        },
      ],
    },
  ],
};
