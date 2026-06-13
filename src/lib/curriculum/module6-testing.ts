import { Module } from './types';

export const module6Testing: Module = {
  id: 'module-6-testing',
  title: 'Testing & Documentation',
  icon: '🧪',
  description:
    'Ship with confidence — write fast, reliable tests with pytest and TestClient, master integration testing with dependency overrides, test authentication flows, achieve high coverage, and produce beautiful auto-generated API documentation. This module transforms you from "hoping it works" to "proving it works" on every commit.',
  topics: [
    // ──────────────────────────────────────────────
    // TOPIC 1: Unit Testing with pytest
    // ──────────────────────────────────────────────
    {
      id: 'm6-unit-testing',
      title: 'Unit Testing with pytest',
      icon: '🔬',
      introduction:
        'Unit testing is the foundation of a reliable codebase. With FastAPI\'s TestClient and pytest, you can test your API endpoints in milliseconds — no server startup required. This topic covers testing endpoints, validating responses, testing error handling, and writing tests that are fast, deterministic, and maintainable.',
      sections: [
        {
          heading: 'Testing Endpoints with TestClient',
          content: `FastAPI's \`TestClient\` is built on top of httpx and provides a synchronous interface for making requests to your FastAPI application without starting a real HTTP server. It communicates with your app through the ASGI interface internally, which means tests run in milliseconds and you don't need to worry about port conflicts, server startup time, or network issues.

The TestClient supports all HTTP methods (GET, POST, PUT, PATCH, DELETE), handles cookies and sessions, follows redirects, and provides the same response interface you're used to from httpx. Because it's synchronous, you write regular pytest functions (not async) even if your FastAPI endpoints are async. The TestClient handles the async-to-sync bridge internally.

Every test should follow the Arrange-Act-Assert pattern: set up the test data, make the request, then verify the response status code, body, and headers. For FastAPI specifically, you should also test that validation errors return 422 with the correct error structure — this ensures your type hints and Pydantic models are working as expected.`,
          codeExamples: [
            {
              title: 'Basic Endpoint Testing with TestClient',
              description: 'Testing GET, POST, and validation error responses',
              code: `# test_main.py
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import BaseModel

app = FastAPI()

class ItemCreate(BaseModel):
    name: str
    price: float
    in_stock: bool = True

items_db: dict[int, dict] = {}
next_id = 1

@app.get("/items")
def list_items():
    return list(items_db.values())

@app.post("/items", status_code=201)
def create_item(item: ItemCreate):
    global next_id
    item_dict = item.model_dump()
    item_dict["id"] = next_id
    items_db[next_id] = item_dict
    next_id += 1
    return item_dict

@app.get("/items/{item_id}")
def get_item(item_id: int):
    if item_id not in items_db:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Item not found")
    return items_db[item_id]

# ── Tests ────────────────────────────────────────
client = TestClient(app)

def test_list_items_empty():
    """List returns empty array when no items exist."""
    response = client.get("/items")
    assert response.status_code == 200
    assert response.json() == []

def test_create_item():
    """POST creates a new item and returns it with an ID."""
    response = client.post("/items", json={
        "name": "Widget",
        "price": 9.99,
        "in_stock": True
    })
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Widget"
    assert data["price"] == 9.99
    assert "id" in data

def test_create_item_validation_error():
    """POST with missing required field returns 422."""
    response = client.post("/items", json={"name": "Widget"})  # missing price
    assert response.status_code == 422
    errors = response.json()["detail"]
    assert any(e["loc"] == ["body", "price"] for e in errors)

def test_get_item_not_found():
    """GET non-existent item returns 404."""
    response = client.get("/items/999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Item not found"`,
              language: 'python',
            },
            {
              title: 'Testing Query Parameters and Edge Cases',
              description: 'Comprehensive testing of filtering, pagination, and boundary conditions',
              code: `# test_items_advanced.py
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

class TestItemListFiltering:
    """Test suite for item listing with filters."""

    def test_filter_by_in_stock(self):
        response = client.get("/items", params={"in_stock": True})
        assert response.status_code == 200
        items = response.json()
        assert all(item["in_stock"] for item in items)

    def test_filter_by_price_range(self):
        response = client.get("/items", params={"min_price": 5.0, "max_price": 50.0})
        assert response.status_code == 200
        items = response.json()
        for item in items:
            assert 5.0 <= item["price"] <= 50.0

    def test_pagination(self):
        response = client.get("/items", params={"skip": 0, "limit": 10})
        assert response.status_code == 200
        assert len(response.json()) <= 10

class TestItemEdgeCases:
    """Test boundary conditions and edge cases."""

    def test_negative_price_rejected(self):
        response = client.post("/items", json={"name": "Bad", "price": -1.0})
        assert response.status_code == 422

    def test_empty_name_rejected(self):
        response = client.post("/items", json={"name": "", "price": 1.0})
        assert response.status_code == 422

    def test_very_long_name(self):
        response = client.post("/items", json={"name": "A" * 1000, "price": 1.0})
        # Behavior depends on your validation rules
        assert response.status_code in (200, 201, 422)

    def test_item_id_must_be_integer(self):
        response = client.get("/items/not-a-number")
        assert response.status_code == 422`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'flow',
            title: 'Test Request Lifecycle',
            description: 'How TestClient tests flow through your FastAPI application',
            steps: [
              { label: 'Test function calls client.get("/items")', detail: 'TestClient creates an ASGI request', highlight: true },
              { label: 'FastAPI route matching', detail: 'URL pattern matched, path/query params extracted' },
              { label: 'Pydantic validation', detail: 'Request body and parameters validated against type hints', highlight: true },
              { label: 'Dependency injection', detail: 'Depends() resolved (e.g., database session)' },
              { label: 'Endpoint function executes', detail: 'Business logic runs, returns data' },
              { label: 'Response serialization', detail: 'Return value serialized to JSON' },
              { label: 'Test asserts on response', detail: 'Status code, JSON body, headers checked', highlight: true },
            ],
          },
          tips: [
            'TestClient is synchronous — use regular def test_...() functions, not async def, even for async endpoints.',
            'Always test both the happy path (valid input) and the sad path (invalid input) — 422 validation errors are as important as 200 OK responses.',
            'Reset shared state between tests using pytest fixtures — in-memory databases and global variables persist across tests unless explicitly cleared.',
          ],
          keyTakeaway:
            'TestClient lets you test FastAPI endpoints in milliseconds without starting a server — test every endpoint, every status code, every validation rule.',
        
          realWorldAnalogy: `TestClient is like a flight simulator for your API. You can take off, land, and encounter turbulence (edge cases) without risking a real plane (production server). Every test is a simulated flight that verifies your API behaves correctly under specific conditions.`,
          commonMistake: [
            {
              mistake: `Starting a real Uvicorn server to run tests`,
              fix: `Use TestClient(app) which communicates via ASGI directly. No server needed — tests run in milliseconds.`,
            },
            {
              mistake: `Testing only the happy path (valid inputs)`,
              fix: `Test error responses too: invalid types, missing fields, non-existent resources. Error handling is where most bugs hide.`,
            },
          ],
          interviewQuestions: [
            {
              question: `How does TestClient work without starting a real server?`,
              answer: `TestClient uses httpx to call your FastAPI app through the ASGI interface directly, bypassing the network layer. This makes tests run in milliseconds instead of seconds.`,
            },
            {
              question: `What is the testing pyramid for FastAPI?`,
              answer: `Unit tests (most) → Integration tests (medium) → E2E tests (few). Unit tests test individual functions, integration tests test endpoint + database, E2E tests test the full stack.`,
            },
          ],
          proTips: [
            `Test both success AND failure cases. Error handling is where most bugs hide.`,
            `Use pytest fixtures for database setup/teardown. This keeps tests isolated and repeatable.`,
          ],},
        {
          heading: 'Testing Validation Errors and Response Shapes',
          content: `One of FastAPI's greatest strengths is automatic request validation via Pydantic. But that validation only works if you test it. Every Pydantic model you define creates a contract with your API consumers — if you change a field type without updating tests, you might break clients without realizing it. Testing validation errors ensures your contracts stay intact.

When Pydantic validation fails, FastAPI returns a 422 Unprocessable Entity response with a structured error body. The \`detail\` array contains objects with \`type\` (the error class), \`loc\` (the location of the error as a path like ["body", "price"]), \`msg\` (a human-readable message), and \`input\` (the invalid value). Your tests should verify the error structure, not just the status code — this catches subtle changes like a field moving from optional to required.

Testing response shapes is equally important. Use Pydantic's \`model_validate\` method to assert that response bodies conform to your expected schema. If a response includes extra fields or missing fields, the validation will fail. This is especially important for public APIs where removing a field from a response is a breaking change for consumers.`,
          codeExamples: [
            {
              title: 'Comprehensive Validation Error Testing',
              description: 'Test every validation rule and verify the 422 error structure',
              code: `import pytest
from fastapi.testclient import TestClient
from pydantic import BaseModel, EmailStr, Field, field_validator
from main import app

client = TestClient(app)

class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=20, pattern=r"^[a-zA-Z0-9_]+$")
    email: EmailStr
    age: int = Field(ge=0, le=150)

# ── Validation Error Tests ───────────────────────

def test_username_too_short():
    response = client.post("/users", json={
        "username": "ab",  # min_length=3
        "email": "test@example.com",
        "age": 25
    })
    assert response.status_code == 422
    error = next(e for e in response.json()["detail"] if "username" in e["loc"])
    assert error["type"] == "string_too_short"

def test_username_invalid_characters():
    response = client.post("/users", json={
        "username": "user@name!",  # pattern violation
        "email": "test@example.com",
        "age": 25
    })
    assert response.status_code == 422

def test_invalid_email_format():
    response = client.post("/users", json={
        "username": "validuser",
        "email": "not-an-email",
        "age": 25
    })
    assert response.status_code == 422
    error = next(e for e in response.json()["detail"] if "email" in e["loc"])
    assert "email" in error["msg"].lower()

def test_age_out_of_range():
    response = client.post("/users", json={
        "username": "validuser",
        "email": "test@example.com",
        "age": -5  # ge=0 violation
    })
    assert response.status_code == 422

def test_multiple_validation_errors():
    """When multiple fields are invalid, all errors should be returned."""
    response = client.post("/users", json={
        "username": "a",      # too short
        "email": "bad",       # not an email
        "age": 200,           # too old
    })
    assert response.status_code == 422
    errors = response.json()["detail"]
    assert len(errors) == 3  # All three errors reported`,
              language: 'python',
            },
            {
              title: 'Response Shape Testing with Pydantic',
              description: 'Verify that API responses match the expected schema exactly',
              code: `import pytest
from fastapi.testclient import TestClient
from pydantic import BaseModel
from main import app

client = TestClient(app)

# Define the expected response model (mirror of API response)
class ItemResponse(BaseModel):
    id: int
    name: str
    price: float
    in_stock: bool

class ItemListResponse(BaseModel):
    items: list[ItemResponse]
    total: int
    page: int

def test_item_response_matches_schema():
    """Verify the response body conforms to the expected model."""
    # First create an item
    client.post("/items", json={"name": "Widget", "price": 9.99})

    # Then fetch it and validate the schema
    response = client.get("/items/1")
    assert response.status_code == 200

    # This will raise ValidationError if the response doesn't match
    item = ItemResponse.model_validate(response.json())
    assert item.name == "Widget"
    assert item.price == 9.99

def test_list_response_matches_schema():
    """Verify paginated list response structure."""
    response = client.get("/items", params={"page": 1, "size": 10})
    assert response.status_code == 200

    result = ItemListResponse.model_validate(response.json())
    assert isinstance(result.items, list)
    assert result.total >= 0
    assert result.page == 1

def test_response_has_correct_headers():
    """Verify important response headers are present."""
    response = client.get("/items")
    assert response.headers["content-type"] == "application/json"
    assert "x-request-id" in response.headers`,
              language: 'python',
            },
          ],
          tips: [
            'Test every Pydantic validation rule — each Field constraint (min_length, ge, pattern) should have a corresponding test that verifies the 422 error.',
            'Use model_validate() to test response shapes — it catches missing fields, extra fields, and type mismatches that manual assertions miss.',
            'Test multiple validation errors simultaneously to ensure FastAPI reports all issues, not just the first one.',
          ],
          keyTakeaway:
            'Test validation errors as rigorously as happy paths — your Pydantic models are contracts, and tests prove they\'
          realWorldAnalogy: `Testing validation is like quality control on an assembly line. You deliberately send defective products (invalid data) through the line to verify the inspection station (Pydantic) catches every type of defect and produces the correct rejection report (422 error).`,
          commonMistake: [
            {
              mistake: `Only checking status code without verifying error details`,
              fix: `Always verify the error response body: check error type, location (loc), and message. This ensures your validation is specific, not just "something went wrong".`,
            },
            {
              mistake: `Not testing boundary values for Field constraints`,
              fix: `Test Field(ge=0) with -1, 0, and 1. Test Field(max_length=100) with 99, 100, and 101 characters. Boundary values catch off-by-one errors.`,
            },
          ],
          interviewQuestions: [
            {
              question: `How do you test Pydantic validation errors via TestClient?`,
              answer: `Send invalid data and assert status_code == 422. Check the response body for error details: error type, field location, and message.`,
            },
            {
              question: `What should you test in a 422 error response?`,
              answer: `Verify the error count, the field location (loc), the error type (e.g., "int_parsing"), and the error message. This ensures validation is specific and helpful.`,
            },
          ],
          proTips: [
            `Create a helper: assert_validation_error(res, field="age", error_type="greater_than_equal") to reduce boilerplate across tests.`,
            `Test boundary values: Field(ge=0) should accept 0 and reject -1. Field(max_length=100) should accept 100 chars and reject 101.`,
          ],re enforced.',
        },
      ],
    },

    // ──────────────────────────────────────────────
    // TOPIC 2: Integration Testing
    // ──────────────────────────────────────────────
    {
      id: 'm6-integration-testing',
      title: 'Integration Testing',
      icon: '🔗',
      introduction:
        'Integration tests verify that multiple components work together correctly — your API endpoints, database, dependencies, and business logic all function as a cohesive system. Unlike unit tests that isolate individual functions, integration tests exercise the full request lifecycle from HTTP request to database query and back.',
      sections: [
        {
          heading: 'Test Databases and Fixture Patterns',
          content: `Integration tests need a real database to validate that your queries, migrations, and data constraints work correctly. But you should NEVER use your production database for testing. Instead, create a separate test database that is created before each test session and torn down afterward. For SQLite, this means using an in-memory database (\`:memory:\`) or a temporary file. For PostgreSQL, you'd create a \`test_db\` database that is reset between test runs.

The cleanest approach is to use pytest fixtures that provide a fresh database session for each test. The fixture creates the tables, yields the session, and then drops everything. This ensures complete test isolation — no test can affect another test's data, and tests can run in any order. For SQLAlchemy, you use the \`create_all()\` and \`drop_all()\` methods on your metadata object.

A common pattern is to have three fixture levels: (1) a \`db_engine\` fixture that creates the database engine once per session, (2) a \`db_tables\` fixture that creates and drops tables once per test, and (3) a \`db_session\` fixture that provides a transaction-based session that rolls back after each test. The transaction-rollback approach is the fastest because it avoids creating and dropping tables between every test.`,
          codeExamples: [
            {
              title: 'Database Fixture Pattern with SQLAlchemy',
              description: 'Isolated test database with automatic setup and teardown',
              code: `# conftest.py
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.main import app

# Use in-memory SQLite for testing (fast and isolated)
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test."""
    # Create all tables
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        # Drop all tables after the test
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    """Create a TestClient with the test database injected."""
    def override_get_db():
        try:
            yield db_session
        finally:
            db_session.close()

    # Replace the real database dependency with our test one
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    # Clean up overrides after the test
    app.dependency_overrides.clear()`,
              language: 'python',
            },
            {
              title: 'Integration Test for Full CRUD Lifecycle',
              description: 'End-to-end test that creates, reads, updates, and deletes a resource',
              code: `# test_items_integration.py
import pytest
from fastapi.testclient import TestClient

def test_full_crud_lifecycle(client: TestClient):
    """Test the complete lifecycle: create → read → update → delete."""
    # ── CREATE ────────────────────────────────────
    create_response = client.post("/items", json={
        "name": "Integration Test Item",
        "price": 19.99,
        "in_stock": True,
    })
    assert create_response.status_code == 201
    item_id = create_response.json()["id"]
    created_at = create_response.json().get("created_at")

    # ── READ (single) ─────────────────────────────
    get_response = client.get(f"/items/{item_id}")
    assert get_response.status_code == 200
    assert get_response.json()["name"] == "Integration Test Item"
    assert get_response.json()["price"] == 19.99

    # ── READ (list, verify item appears) ──────────
    list_response = client.get("/items")
    assert list_response.status_code == 200
    assert any(item["id"] == item_id for item in list_response.json())

    # ── UPDATE ────────────────────────────────────
    update_response = client.patch(f"/items/{item_id}", json={
        "price": 14.99,
        "in_stock": False,
    })
    assert update_response.status_code == 200
    assert update_response.json()["price"] == 14.99
    assert update_response.json()["in_stock"] is False

    # ── DELETE ────────────────────────────────────
    delete_response = client.delete(f"/items/{item_id}")
    assert delete_response.status_code == 204

    # ── VERIFY DELETED ────────────────────────────
    get_deleted_response = client.get(f"/items/{item_id}")
    assert get_deleted_response.status_code == 404`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'architecture',
            title: 'Integration Test Architecture',
            description: 'How fixtures, dependency overrides, and TestClient compose',
            layers: [
              { label: 'Test Function', items: ['test_full_crud_lifecycle()', 'client.post / get / patch / delete', 'Assertions on response'] },
              { label: 'TestClient + Fixtures', items: ['TestClient(app)', 'db_session fixture', 'client fixture with overrides'] },
              { label: 'Dependency Overrides', items: ['get_db → test_db', 'get_current_user → mock_user', 'Other deps → test doubles'] },
              { label: 'Test Database', items: ['SQLite in-memory / test.db', 'Tables created/dropped per test', 'Transaction rollback for speed'] },
            ],
          },
          tips: [
            'Use dependency_overrides to inject test databases — this keeps your production code clean and your tests isolated.',
            'Prefer in-memory SQLite for testing — it\'s the fastest option and avoids file I/O. For PostgreSQL-specific features, use a Docker test container.',
            'Write CRUD lifecycle tests that exercise the full create→read→update→delete flow — this catches issues that individual endpoint tests miss.',
          ],
          keyTakeaway:
            'Integration tests use real databases and dependency overrides to verify the full request lifecycle — from HTTP to database and back.',
        
          realWorldAnalogy: `Test databases are like scratch paper for math homework. You write your calculations (tests) on scratch paper first, verify they're correct, then throw the paper away (teardown). You never do homework on the final exam paper (production database).`,
          commonMistake: [
            {
              mistake: `Using the production database for testing`,
              fix: `Create a separate test database and override get_db to use it. Never run tests against production data — tests modify and delete data.`,
            },
            {
              mistake: `Not cleaning up test data between tests`,
              fix: `Use pytest fixtures with yield to create a fresh database state before each test and clean up after. Without cleanup, tests become order-dependent and flaky.`,
            },
          ],
          interviewQuestions: [
            {
              question: `How do you set up a test database for FastAPI integration tests?`,
              answer: `Override get_db with a test database session using app.dependency_overrides. Use pytest fixtures with yield to create tables before each test and drop them after.`,
            },
            {
              question: `What is the difference between unit tests and integration tests for FastAPI?`,
              answer: `Unit tests test individual functions (services, validators) in isolation. Integration tests test the full request/response cycle including database, serialization, and validation. Both are needed.`,
            },
          ],
          proTips: [
            `Use SQLAlchemy's create_all/drop_all in fixtures to create fresh tables for each test. This ensures test isolation.`,
            `For faster tests, use SQLite in-memory (:memory:) as the test database instead of PostgreSQL.`,
          ],},
        {
          heading: 'Dependency Overrides for Test Doubles',
          content: `FastAPI's \`dependency_overrides\` mechanism is the key to writing testable applications. It lets you replace any dependency — database connections, authentication, external API clients — with a test double that behaves predictably. This means you can test your endpoint logic without hitting real databases, making real HTTP calls to external services, or requiring real user credentials.

The override system works by mapping the original dependency function to a replacement function. When FastAPI resolves dependencies for a request, it checks the \`app.dependency_overrides\` dictionary first. If a dependency is listed there, it uses the replacement instead of the original. This happens transparently — your endpoint code doesn't know or care whether it's running in production or in a test.

Common dependency overrides include: (1) replacing the database session with a test database, (2) replacing \`get_current_user\` with a function that returns a fixed user, (3) replacing external API clients with mock implementations, and (4) replacing settings/configuration with test-specific values. The key principle is that every external dependency should be injectable so it can be overridden in tests.`,
          codeExamples: [
            {
              title: 'Overriding Authentication and Database Dependencies',
              description: 'Replace real dependencies with test doubles for isolated testing',
              code: `# conftest.py
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.dependencies import get_db, get_current_user
from app.models import User

# ── Test User ────────────────────────────────────
TEST_USER = {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "role": "user",
}

TEST_ADMIN = {
    "id": 2,
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin",
}

# ── Override Functions ───────────────────────────
def override_get_current_user():
    """Return a fixed test user instead of validating JWT."""
    return TEST_USER

def override_get_current_admin():
    """Return a fixed admin user for admin-only tests."""
    return TEST_ADMIN

def override_get_db():
    """Yield test database session instead of production one."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()

# ── Fixtures ─────────────────────────────────────
@pytest.fixture
def authenticated_client():
    """Client with a mock authenticated user."""
    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()

@pytest.fixture
def admin_client():
    """Client with a mock admin user."""
    app.dependency_overrides[get_current_user] = override_get_current_admin
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()

@pytest.fixture
def unauthenticated_client():
    """Client without any authentication (tests 401 responses)."""
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()`,
              language: 'python',
            },
            {
              title: 'Using Dependency Overrides in Tests',
              description: 'Tests that leverage different client fixtures for different auth scenarios',
              code: `# test_protected_routes.py

def test_authenticated_user_can_read_profile(authenticated_client):
    """Authenticated users can access their profile."""
    response = authenticated_client.get("/users/me")
    assert response.status_code == 200
    assert response.json()["username"] == "testuser"

def test_unauthenticated_user_gets_401(unauthenticated_client):
    """Unauthenticated requests to protected routes return 401."""
    response = unauthenticated_client.get("/users/me")
    assert response.status_code == 401

def test_admin_can_access_admin_panel(admin_client):
    """Admin users can access admin-only endpoints."""
    response = admin_client.get("/admin/dashboard")
    assert response.status_code == 200

def test_regular_user_cannot_access_admin(authenticated_client):
    """Regular users get 403 on admin-only endpoints."""
    response = authenticated_client.get("/admin/dashboard")
    assert response.status_code == 403

def test_override_external_service(authenticated_client):
    """Test that external service calls are properly mocked."""
    # Override the external API dependency
    from app.dependencies import get_payment_client

    def mock_payment_client():
        return MockPaymentClient(success=True)

    app.dependency_overrides[get_payment_client] = mock_payment_client

    response = authenticated_client.post("/orders", json={"amount": 100})
    assert response.status_code == 201

    # Clean up this specific override
    del app.dependency_overrides[get_payment_client]`,
              language: 'python',
            },
          ],
          tips: [
            'Always clear dependency_overrides after each test using app.dependency_overrides.clear() or a fixture teardown — leftover overrides cause test pollution.',
            'Create separate fixtures for different user roles (authenticated_client, admin_client) to keep tests readable and avoid repetitive setup.',
            'Override external service dependencies (payment APIs, email services) with mocks to avoid network calls in tests.',
          ],
          keyTakeaway:
            'dependency_overrides is FastAPI\'
          realWorldAnalogy: `Dependency overrides are like stunt doubles in movies. The real actor (production dependency) does the dramatic scenes, but for dangerous stunts (tests that need isolation), a trained stunt double (test dependency) takes their place. The camera (endpoint) can't tell the difference.`,
          commonMistake: [
            {
              mistake: `Modifying the app directly instead of using dependency_overrides`,
              fix: `Use app.dependency_overrides[get_db] = test_get_db. This swaps dependencies cleanly without modifying your app code.`,
            },
            {
              mistake: `Forgetting to clear dependency_overrides after tests`,
              fix: `Call app.dependency_overrides.clear() in teardown to prevent test contamination between test modules.`,
            },
          ],
          interviewQuestions: [
            {
              question: `What is app.dependency_overrides and when do you use it?`,
              answer: `It's a dict that maps production dependencies to test replacements. FastAPI checks it before resolving dependencies, so overridden dependencies are used instead. Essential for swapping databases, auth, and external services in tests.`,
            },
            {
              question: `How do you test a protected endpoint without real authentication?`,
              answer: `Override get_current_user with a function that returns a mock user. This bypasses JWT validation while still testing the endpoint logic.`,
            },
          ],
          proTips: [
            `Always clear dependency_overrides after tests: app.dependency_overrides.clear(). Forgetting this causes test contamination.`,
            `Create a fixture that provides an authenticated TestClient to reduce boilerplate in protected endpoint tests.`,
          ],s secret weapon for testing — replace any dependency with a test double for fast, isolated, deterministic tests.',
        },
      ],
    },

    // ──────────────────────────────────────────────
    // TOPIC 3: Testing Authentication
    // ──────────────────────────────────────────────
    {
      id: 'm6-testing-auth',
      title: 'Testing Authentication',
      icon: '🔐',
      introduction:
        'Authentication is the gateway to every protected endpoint, and it must work flawlessly. This topic teaches you how to test JWT token flows, mock authenticated users, test protected routes, and verify that your security dependencies correctly reject invalid, expired, and missing tokens.',
      sections: [
        {
          heading: 'Mocking Tokens and Authenticated TestClient',
          content: `Testing authentication flows directly — sending username/password to the login endpoint, receiving a token, then using that token on protected endpoints — works, but it's slow and couples your tests to the full auth pipeline. A faster, more focused approach is to mock the authentication dependency so you can test protected endpoint logic independently from the auth implementation.

The strategy is two-fold: (1) for testing the auth endpoints themselves (login, token refresh), use real authentication flows with TestClient, and (2) for testing business logic behind protected endpoints, override \`get_current_user\` to return a predetermined user object. This separation ensures your auth system is tested thoroughly while keeping business logic tests fast and focused.

When mocking tokens, you should also test edge cases: expired tokens, tokens with invalid signatures, tokens missing required claims, and tokens with tampered payloads. These tests verify that your JWT verification logic correctly rejects all forms of invalid tokens. Create a helper function that generates test tokens with custom claims and expiration times so you can easily create any token scenario.`,
          codeExamples: [
            {
              title: 'Authentication Test Utilities',
              description: 'Helper functions for creating test tokens and mock users',
              code: `# test_auth_utils.py
from datetime import datetime, timedelta, timezone
from jose import jwt
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from fastapi.testclient import TestClient

SECRET_KEY = "test-secret-key"
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

app = FastAPI()

async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"username": username, "role": payload.get("role", "user")}
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.get("/protected")
async def protected_route(user: dict = Depends(get_current_user)):
    return {"message": f"Hello, {user['username']}", "role": user["role"]}

# ── Test Helpers ─────────────────────────────────
def create_test_token(
    username: str = "testuser",
    role: str = "user",
    expires_delta: timedelta | None = None,
    secret: str = SECRET_KEY,
) -> str:
    """Create a JWT token with custom claims for testing."""
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=30)
    )
    payload = {"sub": username, "role": role, "exp": expire}
    return jwt.encode(payload, secret, algorithm=ALGORITHM)

def create_expired_token(username: str = "testuser") -> str:
    """Create a token that has already expired."""
    return create_test_token(
        username=username,
        expires_delta=timedelta(seconds=-1),  # Already expired
    )

def create_token_with_wrong_secret(username: str = "testuser") -> str:
    """Create a token signed with the wrong secret key."""
    return create_test_token(username=username, secret="wrong-secret-key")`,
              language: 'python',
            },
            {
              title: 'Comprehensive Authentication Tests',
              description: 'Test valid tokens, expired tokens, invalid signatures, and missing tokens',
              code: `# test_auth.py
import pytest
from fastapi.testclient import TestClient
from test_auth_utils import app, create_test_token, create_expired_token, create_token_with_wrong_secret

client = TestClient(app)

class TestValidAuthentication:
    """Tests for successful authentication scenarios."""

    def test_valid_token_returns_200(self):
        token = create_test_token(username="alice", role="admin")
        response = client.get("/protected", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        assert response.json()["username"] == "alice"
        assert response.json()["role"] == "admin"

    def test_regular_user_token(self):
        token = create_test_token(username="bob", role="user")
        response = client.get("/protected", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        assert response.json()["role"] == "user"

class TestInvalidAuthentication:
    """Tests for authentication failure scenarios."""

    def test_missing_authorization_header(self):
        response = client.get("/protected")
        assert response.status_code == 401
        assert "Not authenticated" in response.json()["detail"]

    def test_expired_token(self):
        token = create_expired_token()
        response = client.get("/protected", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 401

    def test_token_with_wrong_signature(self):
        token = create_token_with_wrong_secret()
        response = client.get("/protected", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 401

    def test_malformed_token(self):
        response = client.get("/protected", headers={"Authorization": "Bearer not-a-jwt"})
        assert response.status_code == 401

    def test_bearer_scheme_required(self):
        token = create_test_token()
        # "Token" instead of "Bearer" should fail
        response = client.get("/protected", headers={"Authorization": f"Token {token}"})
        assert response.status_code == 401`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'sequence',
            title: 'Authentication Test Scenarios',
            description: 'Different token scenarios tested in authentication tests',
            steps: [
              { label: 'Valid token request', detail: 'Bearer + valid JWT → 200 OK', highlight: true },
              { label: 'Missing Authorization header', detail: 'No header at all → 401 Not authenticated' },
              { label: 'Expired token', detail: 'Bearer + expired JWT → 401 Token expired' },
              { label: 'Wrong signature', detail: 'Bearer + wrong-key JWT → 401 Invalid token' },
              { label: 'Malformed token', detail: 'Bearer + garbage → 401 Invalid token' },
              { label: 'Wrong scheme', detail: 'Token + valid JWT → 401 Not authenticated' },
              { label: 'Missing sub claim', detail: 'Bearer + no-sub JWT → 401 Invalid token' },
            ],
          },
          tips: [
            'Create reusable helper functions (create_test_token, create_expired_token) to generate test tokens — this keeps test code DRY and readable.',
            'Test every failure path: missing header, expired token, wrong signature, malformed JWT, and wrong auth scheme — security is only as strong as its weakest check.',
            'Separate auth tests from business logic tests — test auth in isolation, then use dependency overrides to skip auth in business logic tests.',
          ],
          keyTakeaway:
            'Test every authentication scenario — valid tokens, expired tokens, bad signatures, and missing headers — your security depends on correct rejection.',
        
          realWorldAnalogy: `Mocking authentication in tests is like having a VIP pass at a theme park. Instead of waiting in the regular line (going through the full login flow), you use the VIP entrance (mock auth) to skip straight to the ride (endpoint logic). You still experience the ride, just without the queue.`,
          commonMistake: [
            {
              mistake: `Creating real JWTs in tests instead of mocking auth`,
              fix: `Override get_current_user to return a mock user directly. Creating real JWTs in every test is slow and couples tests to auth implementation.`,
            },
            {
              mistake: `Testing auth logic in every endpoint test`,
              fix: `Test auth logic separately (in auth-specific tests). For endpoint tests, override auth to focus on endpoint behavior.`,
            },
          ],
          interviewQuestions: [
            {
              question: `How do you create an authenticated TestClient for testing?`,
              answer: `Override get_current_user with a function returning a mock user, then create TestClient(app). For header-based testing, create a real JWT and add Authorization: Bearer <token> to requests.`,
            },
            {
              question: `Should you test with real or mocked authentication?`,
              answer: `Both. Use mocked auth for endpoint logic tests (faster, focused). Use real auth for integration tests that verify the full auth flow.`,
            },
          ],
          proTips: [
            `Create a pytest fixture that returns an authenticated TestClient: auth_client = TestClient(app) with get_current_user overridden.`,
            `Test the full auth flow (login → token → protected endpoint) in at least one integration test, even if you mock auth for unit tests.`,
          ],},
        {
          heading: 'Testing Protected Routes End-to-End',
          content: `End-to-end authentication tests verify the complete flow: the client sends credentials to the login endpoint, receives a token, and uses that token to access protected resources. These tests are slower than mocked-auth tests because they exercise the full authentication pipeline, but they provide the highest confidence that everything works together.

The key patterns for end-to-end auth testing are: (1) test the login flow by sending credentials and verifying the token response, (2) test that the returned token works on protected endpoints, (3) test that login with wrong credentials is rejected, and (4) test that logout properly invalidates the session (if you track refresh tokens server-side).

A common pattern is to create a pytest fixture that performs the full login flow and returns a pre-authenticated TestClient. This fixture does the real login, stores the token, and automatically includes it in all subsequent requests. Tests that need authenticated access simply use this fixture instead of the plain TestClient.`,
          codeExamples: [
            {
              title: 'End-to-End Auth Test Fixture',
              description: 'Fixture that performs real login and returns an authenticated client',
              code: `# conftest.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture
def authenticated_client():
    """TestClient that has already logged in with valid credentials."""
    client = TestClient(app)

    # Register a test user first
    client.post("/register", json={
        "username": "testuser",
        "email": "test@example.com",
        "password": "SecurePass123!",
    })

    # Perform actual login
    login_response = client.post("/auth/token", data={
        "username": "testuser",
        "password": "SecurePass123!",
    })
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]

    # Set default Authorization header for all subsequent requests
    client.headers["Authorization"] = f"Bearer {token}"
    return client

# ── Tests Using the Authenticated Client ─────────

def test_can_access_protected_route(authenticated_client):
    response = authenticated_client.get("/users/me")
    assert response.status_code == 200
    assert response.json()["username"] == "testuser"

def test_can_create_resource(authenticated_client):
    response = authenticated_client.post("/items", json={
        "name": "My Item",
        "price": 10.00,
    })
    assert response.status_code == 201

def test_login_with_wrong_password():
    client = TestClient(app)
    response = client.post("/auth/token", data={
        "username": "testuser",
        "password": "wrong-password",
    })
    assert response.status_code == 401
    assert "Incorrect" in response.json()["detail"]`,
              language: 'python',
            },
          ],
          tips: [
            'Create an authenticated_client fixture that performs real login — this tests the entire auth pipeline end-to-end.',
            'Test the login endpoint with wrong credentials explicitly — verify the 401 response and error message content.',
            'After logout, verify the token (or refresh token) is actually invalidated by attempting to use it again.',
          ],
          keyTakeaway:
            'End-to-end auth tests exercise the full login→token→protected route flow, giving you confidence that the entire pipeline works together.',
        },
      ],
    },

    // ──────────────────────────────────────────────
    // TOPIC 4: Test Coverage & Best Practices
    // ──────────────────────────────────────────────
    {
      id: 'm6-test-coverage',
      title: 'Test Coverage & Best Practices',
      icon: '📊',
      introduction:
        'Test coverage measures what percentage of your code is executed by your tests. While 100% coverage doesn\'t guarantee bug-free code, low coverage guarantees untested code. This topic covers measuring coverage with pytest-cov, organizing your test suite, using parametrize for data-driven tests, and following naming conventions that make your tests self-documenting.',
      sections: [
        {
          heading: 'Measuring Coverage with pytest-cov',
          content: `pytest-cov is a pytest plugin that integrates the coverage.py library with your test runner. It measures which lines of your source code are executed during tests and generates reports showing covered and uncovered lines. This data is essential for identifying blind spots in your test suite — code that runs in production but is never exercised by tests.

The key metric is **line coverage** — the percentage of code lines that are executed during the test run. A good target for a FastAPI application is 80-90% coverage. The last 10-20% is often edge cases, error handlers, or defensive code that's difficult to trigger in tests. Don't chase 100% at the expense of test quality — a well-tested 85% is better than a poorly-tested 100%.

pytest-cov can generate reports in multiple formats: terminal output (quick overview), HTML (detailed line-by-line view with color coding), and XML (for CI integration with tools like Codecov or Coveralls). The HTML report is particularly useful — it highlights uncovered lines in red so you can quickly see which code paths need additional tests.`,
          codeExamples: [
            {
              title: 'Running Coverage and Interpreting Results',
              description: 'Command-line coverage reporting and HTML output',
              code: `# Run tests with coverage reporting
pytest --cov=app --cov-report=term-missing

# Output:
# Name                    Stmts   Miss  Cover   Missing
# -----------------------------------------------------
# app/main.py                45      2    96%   23-24
# app/dependencies.py        30      5    83%   12, 45-48
# app/models.py              20      0   100%
# app/routers/users.py       60     12    80%   34-37, 89-95
# app/routers/items.py       55      8    85%   22, 56-62
# -----------------------------------------------------
# TOTAL                     210     27    87%

# Generate HTML report (open htmlcov/index.html in browser)
pytest --cov=app --cov-report=html

# Generate XML for CI integration
pytest --cov=app --cov-report=xml

# Fail if coverage drops below a threshold
pytest --cov=app --cov-fail-under=80

# Configuration in pyproject.toml
[tool.pytest.ini_options]
addopts = "--cov=app --cov-report=term-missing --cov-fail-under=80"`,
              language: 'bash',
              output: `# HTML coverage report shows:
# - Green lines: covered by tests
# - Red lines: NOT covered by tests
# - Line numbers of uncovered code
# - Branch coverage (if/else paths)`,
            },
            {
              title: 'pyproject.toml Coverage Configuration',
              description: 'Best-practice coverage configuration for FastAPI projects',
              code: `# pyproject.toml
[tool.coverage.run]
source = ["app"]              # Only measure coverage for app/ directory
omit = [
    "app/tests/*",            # Don't measure test files
    "app/migrations/*",       # Don't measure migration files
    "app/__init__.py",        # Empty init files
]
branch = true                 # Measure branch coverage (if/else paths)

[tool.coverage.report]
fail_under = 80               # Minimum coverage threshold
show_missing = true           # Show line numbers of uncovered code
exclude_lines = [
    "pragma: no cover",       # Standard pragma to exclude
    "if TYPE_CHECKING:",      # Type-checking-only blocks
    "raise NotImplementedError",  # Abstract methods
    "pass",                   # Empty function bodies
    "if __name__ == .__main__.:",  # Main blocks
]

[tool.pytest.ini_options]
testpaths = ["app/tests"]
addopts = "-v --cov=app --cov-report=term-missing"
filterwarnings = ["ignore::DeprecationWarning"]`,
              language: 'toml',
            },
          ],
          visualization: {
            type: 'comparison',
            title: 'Coverage Targets by Module Type',
            description: 'Recommended coverage thresholds for different parts of your application',
            columns: [
              {
                title: 'Module Type',
                items: ['Business Logic', 'API Endpoints', 'Auth/Security', 'Utilities', 'Models/Schemas', 'Configuration'],
              },
              {
                title: 'Target Coverage',
                items: ['90-95%', '85-90%', '95-100%', '80-85%', '70-80%', '50-70%'],
              },
              {
                title: 'Priority',
                items: ['Critical', 'High', 'Critical', 'Medium', 'Low', 'Low'],
              },
              {
                title: 'Reason',
                items: ['Core logic must work', 'API contract tests', 'Security non-negotiable', 'Helper functions', 'Pydantic validates', 'Env-dependent'],
              },
            ],
          },
          tips: [
            'Use --cov-fail-under=80 in your CI pipeline to prevent coverage regressions — if a PR drops coverage below the threshold, the build fails.',
            'Enable branch coverage (branch=true) for more accurate measurement — line coverage can miss untested else branches and exception handlers.',
            'Use the HTML report to find uncovered code quickly — it highlights exact lines in red, making it easy to write targeted tests.',
          ],
          keyTakeaway:
            'Aim for 80-90% coverage with pytest-cov — use --cov-fail-under in CI to prevent coverage regression on every commit.',
        
          realWorldAnalogy: `Code coverage is like a map showing which rooms in a building you've visited. 100% coverage means you've been in every room, but it doesn't mean you've checked every drawer. You might have 100% coverage and still miss bugs in edge cases that your tests don't exercise.`,
          commonMistake: [
            {
              mistake: `Chasing 100% coverage at the expense of test quality`,
              fix: `Coverage measures which code runs, not whether tests are meaningful. Aim for 80-90% coverage with meaningful assertions rather than 100% with shallow tests.`,
            },
            {
              mistake: `Not excluding test files from coverage reports`,
              fix: `Use --cov=app --cov-report=term-missing to focus on your app code, not tests. Add omit patterns in .coveragerc for migration files and config.`,
            },
          ],
          interviewQuestions: [
            {
              question: `What does code coverage measure?`,
              answer: `It measures the percentage of code lines executed during tests. 80%+ coverage is good, but coverage doesn't guarantee correctness — it only shows what code ran, not whether assertions are meaningful.`,
            },
            {
              question: `What is branch coverage vs line coverage?`,
              answer: `Line coverage measures whether each line executed. Branch coverage measures whether each if/else branch was taken. Branch coverage is stricter — you can have 100% line coverage but miss else branches.`,
            },
          ],
          proTips: [
            `Use pytest --cov=app --cov-report=html to generate an HTML coverage report. It highlights uncovered lines visually.`,
            `Aim for 80-90% coverage. 100% is often not worth the effort, and coverage doesn't guarantee test quality.`,
          ],},
        {
          heading: 'Test Organization, Parametrize, and Naming Conventions',
          content: `A well-organized test suite is easy to navigate, easy to extend, and easy to debug. The convention is to mirror your application's directory structure in your test directory: if your app has \`app/routers/users.py\`, your test should be at \`tests/routers/test_users.py\`. This makes it trivial to find the tests for any given module.

**pytest.mark.parametrize** is one of pytest's most powerful features for reducing test duplication. Instead of writing ten similar test functions that differ only in input data, you write one test function and decorate it with parametrize, providing a list of input/output pairs. pytest generates a separate test case for each combination, and each gets its own pass/fail result in the output. This is invaluable for testing validation rules — you can test ten invalid input scenarios with a single test function.

Test naming conventions are critical for readability. The pattern \`test_{function}_{scenario}_{expected_result}\` makes test reports self-documenting. When a test fails in CI, the name alone should tell you what went wrong. For example: \`test_create_item_with_missing_name_returns_422\` is infinitely more informative than \`test_item_error\`.`,
          codeExamples: [
            {
              title: 'Parametrized Tests for Validation Rules',
              description: 'Test multiple input scenarios with a single test function',
              code: `import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

# ── Parametrized validation tests ────────────────
@pytest.mark.parametrize("invalid_data,expected_error_field", [
    ({"name": "", "price": 10.0}, "name"),              # Empty name
    ({"name": "Widget", "price": -1.0}, "price"),       # Negative price
    ({"name": "Widget", "price": 0}, "price"),          # Zero price
    ({"name": "A" * 1000, "price": 10.0}, "name"),     # Name too long
    ({}, "name"),                                         # Missing all fields
    ({"name": "Widget"}, "price"),                        # Missing price
    ({"name": 123, "price": "not-a-number"}, "name"),    # Wrong types
])
def test_create_item_validation_errors(invalid_data, expected_error_field):
    """Each invalid input should return 422 with error on the expected field."""
    response = client.post("/items", json=invalid_data)
    assert response.status_code == 422
    errors = response.json()["detail"]
    assert any(expected_error_field in str(e["loc"]) for e in errors)

# ── Parametrized role-based access tests ─────────
@pytest.mark.parametrize("role,endpoint,expected_status", [
    ("viewer", "/admin/dashboard", 403),
    ("viewer", "/content/view", 200),
    ("editor", "/content/edit", 200),
    ("editor", "/admin/dashboard", 403),
    ("admin", "/admin/dashboard", 200),
    ("admin", "/content/edit", 200),
])
def test_role_based_access(role, endpoint, expected_status):
    """Each role should get the correct status code for each endpoint."""
    token = create_test_token(role=role)
    response = client.get(endpoint, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == expected_status`,
              language: 'python',
            },
            {
              title: 'Test Directory Structure and Naming Convention',
              description: 'How to organize your test suite for a FastAPI project',
              code: `# Project structure:
# app/
# ├── main.py
# ├── dependencies.py
# ├── models/
# │   ├── user.py
# │   └── item.py
# ├── routers/
# │   ├── users.py
# │   ├── items.py
# │   └── auth.py
# └── services/
#     ├── email.py
#     └── payment.py
#
# tests/
# ├── conftest.py              # Shared fixtures
# ├── test_main.py             # App-level tests (startup, middleware)
# ├── test_dependencies.py     # Dependency tests
# ├── routers/
# │   ├── test_users.py        # User endpoint tests
# │   ├── test_items.py        # Item endpoint tests
# │   └── test_auth.py         # Auth endpoint tests
# ├── models/
# │   ├── test_user.py         # User model tests
# │   └── test_item.py         # Item model tests
# └── services/
#     ├── test_email.py        # Email service tests
#     └── test_payment.py      # Payment service tests

# ── Naming Convention ────────────────────────────
# Pattern: test_{function}_{scenario}_{expected_result}

def test_create_user_with_valid_data_returns_201(): ...
def test_create_user_with_duplicate_email_returns_409(): ...
def test_create_user_with_invalid_email_returns_422(): ...
def test_get_user_when_not_found_returns_404(): ...
def test_delete_user_as_admin_returns_204(): ...
def test_delete_user_as_viewer_returns_403(): ...`,
              language: 'python',
            },
          ],
          tips: [
            'Use pytest.mark.parametrize for data-driven testing — one test function can cover 10+ scenarios with different inputs and expected outputs.',
            'Follow the test_{function}_{scenario}_{expected_result} naming pattern — when a test fails, the name tells you exactly what broke.',
            'Mirror your app directory structure in the tests/ directory — this makes it easy to find tests for any given module.',
          ],
          keyTakeaway:
            'Parametrize reduces duplication, clear naming makes failures self-documenting, and mirroring app structure makes tests easy to find.',
        },
      ],
    },

    // ──────────────────────────────────────────────
    // TOPIC 5: Auto-Generated API Documentation
    // ──────────────────────────────────────────────
    {
      id: 'm6-api-documentation',
      title: 'Auto-Generated API Documentation',
      icon: '📖',
      introduction:
        'FastAPI generates interactive API documentation automatically from your code — Swagger UI at /docs and ReDoc at /redoc. But the default output is only as good as your annotations. This topic teaches you how to customize documentation with rich descriptions, examples, tags, and response models that make your API docs a pleasure to use.',
      sections: [
        {
          heading: 'Customizing Swagger UI and ReDoc',
          content: `FastAPI's auto-generated documentation is powered by the OpenAPI specification. Every type hint, Pydantic model, and docstring contributes to the generated schema. But the default output is minimal — endpoint names, parameter types, and response shapes. To make your documentation truly useful, you need to add descriptions, examples, tags, and response models.

The first level of customization is at the FastAPI app level. The \`FastAPI()\` constructor accepts \`title\`, \`description\`, \`version\`, \`terms_of_service\`, \`contact\`, and \`license_info\` — all of which appear in the documentation header. A well-crafted description tells consumers what the API does, who it's for, and how to get started. The \`version\` field is critical for API consumers tracking changes.

The second level is at the endpoint level. Every path operation decorator accepts \`summary\` (short title), \`description\` (detailed explanation), \`response_description\` (describes the successful response), \`responses\` (custom status code descriptions), \`tags\` (grouping), \`deprecated\` (marks old endpoints), and \`operation_id\` (unique identifier for code generation). The \`description\` supports Markdown, so you can include code blocks, tables, and formatted text in your documentation.`,
          codeExamples: [
            {
              title: 'App-Level Documentation Configuration',
              description: 'Rich metadata that appears in the Swagger UI header',
              code: `from fastapi import FastAPI

app = FastAPI(
    title="Task Manager API",
    summary="A RESTful API for managing tasks and projects",
    description="""
## Task Manager API

This API provides full CRUD operations for tasks, projects, and user management.

### Features
- **Task Management**: Create, update, assign, and track tasks
- **Project Organization**: Group tasks into projects with milestones
- **User Authentication**: JWT-based auth with role-based access control
- **Real-time Updates**: WebSocket support for live task changes

### Getting Started
1. Register a new account at \`POST /auth/register\`
2. Obtain a token at \`POST /auth/token\`
3. Use the token in the \`Authorization: Bearer <token>\` header
    """,
    version="2.1.0",
    terms_of_service="https://example.com/terms/",
    contact={
        "name": "API Support",
        "url": "https://example.com/support",
        "email": "support@example.com",
    },
    license_info={
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT",
    },
    docs_url="/docs",        # Swagger UI path (default: /docs)
    redoc_url="/redoc",      # ReDoc path (default: /redoc)
    openapi_url="/openapi.json",  # OpenAPI schema path
)`,
              language: 'python',
            },
            {
              title: 'Endpoint-Level Documentation with Tags and Responses',
              description: 'Detailed per-endpoint documentation with custom response descriptions',
              code: `from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional

app = FastAPI(title="Task Manager API", version="1.0.0")

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200, description="Task title")
    description: Optional[str] = Field(None, description="Detailed task description")
    priority: str = Field("medium", pattern="^(low|medium|high|critical)$")

class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    priority: str
    completed: bool

@app.post(
    "/tasks",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new task",
    description="""
    Creates a new task in the system.

    The task will be assigned to the authenticated user by default.
    Use the \`priority\` field to set urgency: low, medium, high, or critical.
    """,
    response_description="The created task with its assigned ID",
    tags=["Tasks"],
    responses={
        400: {"description": "Invalid task data provided"},
        401: {"description": "Authentication required"},
        422: {"description": "Validation error in request body"},
    },
)
async def create_task(task: TaskCreate):
    """Create a new task with the provided details."""
    # Implementation...
    return {"id": 1, **task.model_dump(), "completed": False}

@app.get(
    "/tasks/{task_id}",
    response_model=TaskResponse,
    summary="Get a task by ID",
    tags=["Tasks"],
    responses={
        404: {"description": "Task not found"},
    },
    deprecated=False,
)
async def get_task(task_id: int):
    """Retrieve a single task by its unique identifier."""
    # Implementation...
    pass

# Tags organize endpoints in Swagger UI sidebar
# They appear as collapsible sections`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'comparison',
            title: 'Documentation Customization Levels',
            description: 'What you can customize at each level of your FastAPI application',
            columns: [
              {
                title: 'Level',
                items: ['App Level', 'Router Level', 'Endpoint Level', 'Model Level', 'Field Level'],
              },
              {
                title: 'Customization',
                items: ['Title, description, version, contact, license', 'Prefix, tags, dependencies', 'Summary, description, responses, tags, deprecated', 'Schema, examples, descriptions', 'Descriptions, examples, constraints'],
              },
              {
                title: 'Appears In',
                items: ['Doc header, OpenAPI info', 'Grouped sections in sidebar', 'Each endpoint in docs', 'Request/response schemas', 'Field details in schema'],
              },
            ],
          },
          tips: [
            'Use Markdown in description fields — Swagger UI renders it, making your docs scannable with headers, lists, and code blocks.',
            'Group endpoints with tags — they appear as collapsible sections in the Swagger UI sidebar, making large APIs navigable.',
            'Document every possible response code (200, 201, 400, 401, 404, 422) — consumers need to know what errors to handle.',
          ],
          keyTakeaway:
            'Great API docs come from intentional annotation — title, description, tags, examples, and response descriptions make auto-generated docs truly useful.',
        },
        {
          heading: 'Adding Examples, Descriptions, and Schema Details',
          content: `Examples are the single most impactful improvement you can make to your API documentation. They show consumers exactly what data to send and what to expect in return — no ambiguity, no guesswork. FastAPI supports examples at three levels: field-level (inside Pydantic models), endpoint-level (in the path operation decorator), and OpenAPI-level (in the response schema).

Field-level examples are defined in Pydantic's \`Field()\` constructor using the \`examples\` parameter. These examples appear in the Swagger UI request body editor and help consumers understand the expected format. For example, an email field might show \`user@example.com\` as an example, and a date field might show \`2024-01-15\`.

Endpoint-level examples use the \`openapi_examples\` parameter in the path operation decorator. You can provide multiple named examples, each with a summary, description, and value. This is perfect for showing different scenarios: a "Minimal User" example with only required fields, and a "Complete User" example with all optional fields filled in. Swagger UI shows a dropdown that lets consumers switch between examples.`,
          codeExamples: [
            {
              title: 'Rich Pydantic Models with Examples and Descriptions',
              description: 'Field-level examples and descriptions that appear in auto-generated docs',
              code: `from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    """Schema for creating a new user account."""
    username: str = Field(
        ...,
        min_length=3,
        max_length=30,
        pattern=r"^[a-zA-Z0-9_]+$",
        description="Unique username. Alphanumeric characters and underscores only.",
        examples=["john_doe", "jane_smith42"],
    )
    email: EmailStr = Field(
        ...,
        description="User's email address. Must be unique across the system.",
        examples=["user@example.com"],
    )
    full_name: Optional[str] = Field(
        None,
        min_length=1,
        max_length=100,
        description="User's display name. Optional — defaults to username.",
        examples=["John Doe"],
    )
    age: Optional[int] = Field(
        None,
        ge=13,
        le=120,
        description="User's age. Must be at least 13 for COPPA compliance.",
        examples=[25, 30],
    )

class UserResponse(BaseModel):
    """Schema for user data in API responses."""
    id: int = Field(..., description="Unique user identifier", examples=[1, 42])
    username: str = Field(..., examples=["john_doe"])
    email: EmailStr = Field(..., examples=["john@example.com"])
    full_name: Optional[str] = Field(None, examples=["John Doe"])
    created_at: datetime = Field(
        ..., description="Timestamp when the account was created",
        examples=["2024-01-15T10:30:00Z"],
    )
    is_active: bool = Field(True, description="Whether the account is currently active")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "id": 1,
                    "username": "john_doe",
                    "email": "john@example.com",
                    "full_name": "John Doe",
                    "created_at": "2024-01-15T10:30:00Z",
                    "is_active": True,
                }
            ]
        }
    }`,
              language: 'python',
            },
            {
              title: 'Endpoint-Level OpenAPI Examples',
              description: 'Named examples that appear as a dropdown in Swagger UI',
              code: `from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class ItemCreate(BaseModel):
    name: str
    price: float
    category: str

@app.post(
    "/items",
    openapi_examples={
        "Minimal Item": {
            "summary": "Basic item with required fields only",
            "description": "The simplest valid item creation request",
            "value": {
                "name": "Widget",
                "price": 9.99,
                "category": "tools",
            },
        },
        "Complete Item": {
            "summary": "Item with all optional fields",
            "description": "An item with every field populated",
            "value": {
                "name": "Premium Widget Pro",
                "price": 49.99,
                "category": "premium-tools",
            },
        },
        "Budget Item": {
            "summary": "Low-cost item example",
            "value": {
                "name": "Economy Widget",
                "price": 1.99,
                "category": "budget",
            },
        },
    },
)
async def create_item(item: ItemCreate):
    """Create a new item. Select an example from the dropdown above."""
    return {"id": 1, **item.model_dump()}`,
              language: 'python',
            },
          ],
          tips: [
            'Add examples to every Pydantic field — they appear as placeholder text in the Swagger UI request body editor.',
            'Use openapi_examples for endpoint-level named examples — Swagger UI shows a dropdown that makes it easy to test different scenarios.',
            'Use json_schema_extra on your response models to provide complete response examples — this shows consumers the exact shape of real data.',
          ],
          keyTakeaway:
            'Examples are the most impactful documentation improvement — field examples, endpoint examples, and response examples eliminate ambiguity for API consumers.',
        },
      ],
    },

    // ──────────────────────────────────────────────
    // TOPIC 6: API Schema & Code Generation
    // ──────────────────────────────────────────────
    {
      id: 'm6-schema-codegen',
      title: 'API Schema & Code Generation',
      icon: '⚙️',
      introduction:
        'FastAPI\'s OpenAPI schema isn\'t just documentation — it\'s a machine-readable contract that enables automated code generation, client SDK creation, and schema validation. This topic covers customizing the OpenAPI schema, generating type-safe client libraries, and validating API conformance against the schema.',
      sections: [
        {
          heading: 'OpenAPI Schema Customization',
          content: `FastAPI generates a complete OpenAPI 3.1 schema at \`/openapi.json\` by default. This schema includes all your endpoints, request/response models, security schemes, and validation rules. But sometimes you need to customize it beyond what FastAPI infers from your code — adding server information, external documentation, custom security schemes, or modifying generated operation IDs.

The most common customization is adding server URLs. By default, the schema uses the current server, but for public APIs you should list all available servers (production, staging, development). This lets consumers know exactly where to send requests. You can also add server variables for templated URLs (e.g., \`https://{environment}.api.example.com\`).

Operation IDs are another important customization. By default, FastAPI generates operation IDs from your function names (e.g., \`create_item_items_post\`). These IDs are used by code generators to name client methods. If you want cleaner names (e.g., \`createItem\`), you can customize the operation ID generation function. This is essential for generating idiomatic client SDKs.`,
          codeExamples: [
            {
              title: 'Customizing the OpenAPI Schema',
              description: 'Add servers, security schemes, and custom operation IDs',
              code: `from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi

app = FastAPI(
    title="My API",
    version="1.0.0",
    servers=[
        {"url": "https://api.example.com", "description": "Production"},
        {"url": "https://staging-api.example.com", "description": "Staging"},
        {"url": "http://localhost:8000", "description": "Development"},
    ],
)

# ── Custom OpenAPI Schema Function ───────────────
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="My API",
        version="1.0.0",
        description="Custom API with enhanced OpenAPI schema",
        routes=app.routes,
    )
    # Add custom security schemes
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        },
        "ApiKeyAuth": {
            "type": "apiKey",
            "in": "header",
            "name": "X-API-Key",
        },
    }
    # Apply security globally
    openapi_schema["security"] = [{"BearerAuth": []}]

    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# ── Custom Operation ID Generator ────────────────
def custom_operation_id(route):
    """Generate clean operation IDs for code generation."""
    # Convert 'create_item' to 'createItem' (camelCase)
    name = route.name
    parts = name.split("_")
    return parts[0] + "".join(p.capitalize() for p in parts[1:])

app = FastAPI(generate_unique_id_function=custom_operation_id)`,
              language: 'python',
            },
            {
              title: 'Adding External Documentation and Webhooks',
              description: 'Advanced OpenAPI features for comprehensive API documentation',
              code: `from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(
    title="Payment API",
    external_docs={
        "url": "https://docs.example.com/api-guide",
        "description": "Full API Guide with tutorials",
    },
)

class PaymentEvent(BaseModel):
    event_type: str
    amount: int
    currency: str

# FastAPI 0.100+ supports OpenAPI webhooks
webhook_app = FastAPI(
    title="Payment API with Webhooks",
)

@webhook_app.webhook("post", "/webhooks/payment-completed")
async def payment_completed(body: PaymentEvent):
    """
    Called when a payment is successfully completed.
    Your server should implement this endpoint to receive notifications.
    """
    pass

# The webhook appears in the OpenAPI schema under "x-webhooks"
# Client generators can create webhook handler stubs automatically`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'data-flow',
            title: 'OpenAPI Schema Generation Flow',
            description: 'How FastAPI code becomes an OpenAPI specification',
            steps: [
              { label: 'FastAPI route definitions', detail: 'Decorators, type hints, Pydantic models', highlight: true },
              { label: 'FastAPI introspection', detail: 'Scans routes, extracts parameters and schemas' },
              { label: 'OpenAPI schema generated', detail: '/openapi.json endpoint serves the schema', highlight: true },
              { label: 'Swagger UI renders docs', detail: '/docs uses the schema for interactive UI' },
              { label: 'ReDoc renders docs', detail: '/redoc uses the schema for reference docs' },
              { label: 'Code generators consume schema', detail: 'TypeScript, Python, Go, Java clients generated', highlight: true },
              { label: 'Schema validators check conformance', detail: 'Schemathesis, Dredd test against schema' },
            ],
          },
          tips: [
            'Customize operation IDs for clean code generation — the default IDs include HTTP method and path, which create ugly client method names.',
            'Add server URLs to your OpenAPI schema so consumers know exactly where to send requests in each environment.',
            'Use a custom openapi() function to add security schemes, global security requirements, and other schema-level customizations.',
          ],
          keyTakeaway:
            'The OpenAPI schema is a machine-readable API contract — customize it with servers, security schemes, and operation IDs for better code generation.',
        },
        {
          heading: 'Generating Client SDKs and Schema Validation',
          content: `The OpenAPI schema generated by FastAPI can be fed into code generators to produce type-safe client libraries in TypeScript, Python, Go, Java, and more. This eliminates the need to write and maintain HTTP client code by hand — the generator creates functions for every endpoint, types for every request/response model, and proper error handling.

The most popular OpenAPI code generator is **openapi-generator** (formerly swagger-codegen). It supports 50+ languages and produces production-quality client code. For TypeScript frontends, **openapi-typescript** and **openapi-fetch** are lighter alternatives that generate type definitions directly from the schema. For Python clients, **datamodel-code-generator** generates Pydantic models from OpenAPI schemas, ensuring your client and server share the same type definitions.

Schema validation goes the other direction — instead of generating code from the schema, you test that your API actually conforms to its schema. Tools like **Schemathesis** automatically generate test cases from your OpenAPI schema, fuzzing your endpoints with valid and invalid inputs. This catches bugs that hand-written tests miss because it explores edge cases you didn't think to test. Schemathesis can find missing validation, incorrect response shapes, and authentication bypasses.`,
          codeExamples: [
            {
              title: 'Generating TypeScript Client from OpenAPI Schema',
              description: 'Use openapi-generator to create a type-safe TypeScript client',
              code: `# Step 1: Save the OpenAPI schema
curl http://localhost:8000/openapi.json > openapi.json

# Step 2: Generate TypeScript client with openapi-generator
npx @openapitools/openapi-generator-cli generate \\
  -i openapi.json \\
  -g typescript-fetch \\
  -o generated-client \\
  --additional-properties=supportsES6=true,typescriptThreePlus=true

# Step 3: Use the generated client in your frontend
# generated-client/api.ts contains fully typed functions:

import { Configuration, ItemsApi } from './generated-client'

const config = new Configuration({
  basePath: 'https://api.example.com',
  accessToken: 'your-jwt-token',
})

const itemsApi = new ItemsApi(config)

// Fully typed — IDE autocomplete, compile-time errors
const item = await itemsApi.createItem({
  name: 'Widget',
  price: 9.99,
  category: 'tools',
})
// item is typed as ItemResponse — .id, .name, .price all typed

const items = await itemsApi.listItems()
// items is typed as ItemResponse[]`,
              language: 'bash',
            },
            {
              title: 'Schema Validation with Schemathesis',
              description: 'Automatically test your API against its OpenAPI schema',
              code: `# Install schemathesis
pip install schemathesis

# Run automatic schema-based testing
st run http://localhost:8000/openapi.json

# Schemathesis will:
# 1. Read your OpenAPI schema
# 2. Generate hundreds of test cases for each endpoint
# 3. Send valid and invalid inputs
# 4. Check that responses match the schema
# 5. Report any discrepancies

# Output:
# F...............................F..
# === FAILURES ===
# POST /items: Response does not match schema
#   Expected: {"id": "integer", "name": "string"}
#   Got: {"id": "1", "name": "Widget"}  # id should be int, not string!
#
# GET /users/me: Missing 401 response documentation
#   Endpoint returns 401 but schema only documents 200

# ── Python API for Schemathesis ──────────────────
import schemathesis
from hypothesis import settings

schema = schemathesis.from_path("openapi.json")

@schema.parametrize()
@settings(max_examples=50)
def test_api_conforms_to_schema(case):
    """Every endpoint should conform to its documented schema."""
    response = case.call()
    case.validate_response(response)`,
              language: 'bash',
              output: `# Schemathesis output:
# == SUMMARY ==
# Performed: 312 checks in 12.5s
# Passed: 308
# Failed: 4
#
# Failures:
# 1. POST /items - response "id" field is string, expected integer
# 2. GET /users - missing 401 documentation
# 3. PATCH /items/{id} - response missing "updated_at" field
# 4. DELETE /items/{id} - 204 response has body (should be empty)`,
            },
          ],
          tips: [
            'Run openapi-generator as part of your CI pipeline to keep client SDKs in sync with the server — commit the generated code so changes are visible in PRs.',
            'Use Schemathesis in your test suite to automatically validate API conformance — it catches schema drift that manual tests miss.',
            'Generate Pydantic models from your OpenAPI schema using datamodel-code-generator — this ensures client and server share identical type definitions.',
          ],
          keyTakeaway:
            'Your OpenAPI schema is a contract — generate client SDKs from it, and validate your API against it to prevent schema drift.',
        },
      ],
    },
  ],
};
