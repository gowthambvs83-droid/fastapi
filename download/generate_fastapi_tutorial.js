const {
  Document, Packer, Paragraph, TextRun, Header, Footer, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, PageBreak, PageNumber, SectionType, ShadingType,
  BorderStyle, WidthType, TableOfContents, NumberFormat, Tab, TabStopPosition, TabStopType
} = require("docx");
const fs = require("fs");

// ── Palette: DM-1 Deep Cyan (Tech/AI) ──
const P = {
  primary: "0A1628",
  body: "1A2B40",
  secondary: "6878A0",
  accent: "1B6B7A",
  surface: "F4F8FC",
  coverBg: "162235",
  coverAccent: "37DCF2",
  coverTitle: "FFFFFF",
  coverSub: "B0B8C0",
  coverMeta: "90989F",
  coverFoot: "687078",
  table: { headerBg: "1B6B7A", headerText: "FFFFFF", accentLine: "1B6B7A", innerLine: "C8DDE2", surface: "EDF3F5" }
};

const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };
const pgSize = { width: 11906, height: 16838 };
const pgMargin = { top: 1440, bottom: 1440, left: 1701, right: 1417 };

// ── Helpers ──
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 480, after: 200 },
    children: [new TextRun({ text, bold: true, size: 32, color: P.primary, font: { ascii: "Times New Roman", eastAsia: "SimHei" } })]
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 360, after: 160 },
    children: [new TextRun({ text, bold: true, size: 28, color: P.primary, font: { ascii: "Times New Roman", eastAsia: "SimHei" } })]
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 280, after: 120 },
    children: [new TextRun({ text, bold: true, size: 26, color: P.accent, font: { ascii: "Times New Roman", eastAsia: "SimHei" } })]
  });
}
function para(text) {
  return new Paragraph({
    spacing: { line: 312, after: 120 },
    children: [new TextRun({ text, size: 24, color: P.body, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })]
  });
}
function boldPara(boldText, normalText) {
  return new Paragraph({
    spacing: { line: 312, after: 120 },
    children: [
      new TextRun({ text: boldText, bold: true, size: 24, color: P.primary, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
      new TextRun({ text: normalText, size: 24, color: P.body, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })
    ]
  });
}
function codeBlock(lines) {
  return lines.map((line, i) => new Paragraph({
    spacing: { line: 260, after: 0 },
    shading: { type: ShadingType.CLEAR, fill: "F0F4F8" },
    indent: { left: 360 },
    children: [new TextRun({ text: line, size: 20, color: "1A1A2E", font: { ascii: "Consolas", eastAsia: "Consolas" } })]
  }));
}
function codeMulti(arr) {
  const result = [];
  arr.forEach(block => {
    result.push(...codeBlock(block.split("\n")));
    result.push(new Paragraph({ spacing: { after: 160 }, children: [] }));
  });
  return result;
}
function bullet(text) {
  return new Paragraph({
    spacing: { line: 312, after: 80 },
    indent: { left: 720, hanging: 360 },
    children: [
      new TextRun({ text: "\u2022  ", size: 24, color: P.accent, font: { ascii: "Calibri" } }),
      new TextRun({ text, size: 24, color: P.body, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })
    ]
  });
}
function headerCell(text) {
  const run = new TextRun({ text: text, bold: true, size: 22, color: P.table.headerText, font: { ascii: "Calibri", eastAsia: "SimHei" } });
  const para = new Paragraph({ alignment: AlignmentType.CENTER, children: [run] });
  return new TableCell({
    children: [para],
    shading: { type: ShadingType.CLEAR, fill: P.table.headerBg },
    margins: { top: 60, bottom: 60, left: 120, right: 120 },
    verticalAlign: "top"
  });
}
function dataCell(text, idx) {
  const run = new TextRun({ text: text, size: 21, color: P.body, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } });
  const para = new Paragraph({ children: [run] });
  const fill = idx % 2 === 0 ? P.table.surface : "FFFFFF";
  return new TableCell({
    children: [para],
    shading: { type: ShadingType.CLEAR, fill: fill },
    margins: { top: 60, bottom: 60, left: 120, right: 120 },
    verticalAlign: "top"
  });
}
function makeTable(headers, rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: P.table.accentLine },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: P.table.accentLine },
      left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: P.table.innerLine },
      insideVertical: { style: BorderStyle.NONE }
    },
    rows: [
      new TableRow({ tableHeader: true, cantSplit: true, children: headers.map(h => headerCell(h)) }),
      ...rows.map((row, idx) => new TableRow({ cantSplit: true, children: row.map(cell => dataCell(cell, idx)) }))
    ]
  });
}

// ── Cover Page (R4 Top Color Block) ──
function buildCover() {
  const topBlockHeight = 8000;
  const accentBarHeight = 200;
  return [
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: allNoBorders,
      rows: [
        new TableRow({
          height: { value: topBlockHeight, rule: "exact" },
          children: [new TableCell({
            borders: allNoBorders,
            shading: { type: ShadingType.CLEAR, fill: P.coverBg },
            verticalAlign: "top",
            children: [
              new Paragraph({ spacing: { before: 2400 }, children: [] }),
              new Paragraph({
                alignment: AlignmentType.LEFT,
                indent: { left: 800 },
                spacing: { line: 828, lineRule: "atLeast" },
                children: [new TextRun({ text: "FastAPI", size: 72, bold: true, color: P.coverAccent, font: { ascii: "Times New Roman", eastAsia: "SimHei" } })]
              }),
              new Paragraph({
                alignment: AlignmentType.LEFT,
                indent: { left: 800 },
                spacing: { line: 600, lineRule: "atLeast", before: 120 },
                children: [new TextRun({ text: "Mastery", size: 52, bold: true, color: P.coverTitle, font: { ascii: "Times New Roman", eastAsia: "SimHei" } })]
              }),
              new Paragraph({
                alignment: AlignmentType.LEFT,
                indent: { left: 800 },
                spacing: { before: 400, line: 400, lineRule: "atLeast" },
                children: [new TextRun({ text: "Zero to Production Ready", size: 28, color: P.coverSub, font: { ascii: "Calibri" } })]
              }),
              new Paragraph({
                alignment: AlignmentType.LEFT,
                indent: { left: 800 },
                spacing: { before: 200, line: 312, lineRule: "atLeast" },
                children: [new TextRun({ text: "The Complete Guide to Building Real-World APIs with Python", size: 22, color: P.coverMeta, font: { ascii: "Calibri" } })]
              }),
            ]
          })]
        }),
        new TableRow({
          height: { value: accentBarHeight, rule: "exact" },
          children: [new TableCell({
            borders: allNoBorders,
            shading: { type: ShadingType.CLEAR, fill: P.coverAccent },
            children: [new Paragraph({ children: [] })]
          })]
        }),
        new TableRow({
          height: { value: 16838 - topBlockHeight - accentBarHeight, rule: "exact" },
          children: [new TableCell({
            borders: allNoBorders,
            shading: { type: ShadingType.CLEAR, fill: "FFFFFF" },
            verticalAlign: "top",
            children: [
              new Paragraph({ spacing: { before: 1200 }, children: [] }),
              new Paragraph({
                alignment: AlignmentType.LEFT,
                indent: { left: 800 },
                spacing: { line: 312 },
                children: [new TextRun({ text: "Pydantic V2  |  Authentication  |  Databases  |  WebSocket  |  Deployment", size: 20, color: P.secondary, font: { ascii: "Calibri" } })]
              }),
              new Paragraph({
                alignment: AlignmentType.LEFT,
                indent: { left: 800 },
                spacing: { before: 600, line: 312 },
                children: [new TextRun({ text: "Includes 3 Mini Projects + 2 Major Real-World Projects", size: 22, bold: true, color: P.accent, font: { ascii: "Calibri" } })]
              }),
              new Paragraph({
                alignment: AlignmentType.LEFT,
                indent: { left: 800 },
                spacing: { before: 300, line: 312 },
                children: [new TextRun({ text: "2026 Edition", size: 20, color: P.secondary, font: { ascii: "Calibri" } })]
              }),
            ]
          })]
        })
      ]
    })
  ];
}

// ── Build Content ──
function buildBody() {
  const children = [];

  // ──────────────────────── MODULE 1 ────────────────────────
  children.push(h1("Module 1: FastAPI Foundation"));

  children.push(h2("1.1 What is FastAPI?"));
  children.push(para("FastAPI is a modern, high-performance web framework for building APIs with Python 3.8+, based on standard Python type hints. It was created by Sebastian Ramirez and has rapidly become one of the most popular Python web frameworks due to its speed, developer experience, and automatic documentation generation. FastAPI is built on top of Starlette for the web layer and Pydantic for data validation, which means you get the best of both worlds: the raw speed of an ASGI framework and the safety of rigorous type checking."));
  children.push(para("What makes FastAPI stand out from other frameworks like Flask or Django REST Framework is its unique combination of features. First, it is one of the fastest Python frameworks available, rivaling NodeJS and Go in benchmark tests. Second, it leverages Python type hints to provide automatic request validation, serialization, and documentation, eliminating entire categories of bugs. Third, it generates interactive API documentation automatically using OpenAPI and JSON Schema, so your documentation is always in sync with your code. Fourth, it has first-class support for async/await, making it ideal for modern I/O-bound workloads."));
  children.push(para("FastAPI is used in production by companies like Microsoft, Uber, and Netflix, and it is particularly well-suited for building microservices, real-time applications, and data-driven APIs. Whether you are building a simple CRUD API or a complex real-time system, FastAPI provides the tools and patterns you need to be productive from day one."));

  children.push(h2("1.2 Installation & Setup"));
  children.push(para("Getting started with FastAPI is straightforward. You need Python 3.8 or later, and we strongly recommend using a virtual environment to isolate your project dependencies. The installation process installs FastAPI along with Uvicorn, which is the ASGI server that runs your application. Uvicorn is a lightning-fast ASGI server built on uvloop and httptools, providing production-grade performance out of the box."));
  children.push(...codeMulti([
    "# Create and activate a virtual environment\npython -m venv venv\nsource venv/bin/activate  # On Windows: venv\\Scripts\\activate\n\n# Install FastAPI and Uvicorn\npip install fastapi uvicorn[standard]\n\n# Verify installation\npython -c \"import fastapi; print(fastapi.__version__)\"",
  ]));

  children.push(h2("1.3 Your First API"));
  children.push(para("Let us build your first FastAPI application. This is the classic hello world example, but we will also add a structured JSON response to show you how FastAPI handles serialization automatically. Save this code in a file called main.py. The app object is the main entry point for your FastAPI application, and every path operation you define will be registered with this object."));
  children.push(...codeMulti([
    "# main.py\nfrom fastapi import FastAPI\nfrom pydantic import BaseModel\n\napp = FastAPI(title=\"My First API\", version=\"1.0.0\")\n\n@app.get(\"/\")\nasync def root():\n    return {\"message\": \"Welcome to FastAPI!\"]}\n\n@app.get(\"/health\")\nasync def health_check():\n    return {\"status\": \"healthy\", \"version\": \"1.0.0\"}\n\n# Run with: uvicorn main:app --reload",
  ]));
  children.push(para("The --reload flag enables auto-reloading during development, so your server restarts automatically whenever you modify your code. This is incredibly useful during the development cycle. Navigate to http://127.0.0.1:8000 to see the JSON response, and visit http://127.0.0.1:8000/docs to see the automatically generated interactive Swagger UI documentation."));

  children.push(h2("1.4 Path Operations: GET, POST, PUT, DELETE"));
  children.push(para("Path operations are the core building blocks of any REST API. FastAPI provides decorators for all standard HTTP methods. Each decorator maps a URL path and HTTP method to a Python function, which is called the path operation function. FastAPI automatically converts the return value to JSON and sets the appropriate content-type header. The framework also validates incoming requests and outgoing responses based on the type hints you provide."));
  children.push(...codeMulti([
    "from fastapi import FastAPI, HTTPException\nfrom typing import Optional\n\napp = FastAPI()\n\n# In-memory database for demonstration\nitems_db = {}\n\n@app.post(\"/items/{item_id}\")\nasync def create_item(item_id: int, name: str, price: float):\n    if item_id in items_db:\n        raise HTTPException(status_code=400, detail=\"Item already exists\")\n    items_db[item_id] = {\"id\": item_id, \"name\": name, \"price\": price}\n    return items_db[item_id]\n\n@app.get(\"/items/{item_id}\")\nasync def read_item(item_id: int):\n    if item_id not in items_db:\n        raise HTTPException(status_code=404, detail=\"Item not found\")\n    return items_db[item_id]\n\n@app.put(\"/items/{item_id}\")\nasync def update_item(item_id: int, name: Optional[str] = None, price: Optional[float] = None):\n    if item_id not in items_db:\n        raise HTTPException(status_code=404, detail=\"Item not found\")\n    if name is not None:\n        items_db[item_id][\"name\"] = name\n    if price is not None:\n        items_db[item_id][\"price\"] = price\n    return items_db[item_id]\n\n@app.delete(\"/items/{item_id}\")\nasync def delete_item(item_id: int):\n    if item_id not in items_db:\n        raise HTTPException(status_code=404, detail=\"Item not found\")\n    deleted = items_db.pop(item_id)\n    return {\"deleted\": deleted}",
  ]));

  children.push(h2("1.5 Path Parameters & Query Parameters"));
  children.push(para("Path parameters are part of the URL path itself, while query parameters are appended after a question mark. FastAPI uses Python type hints to automatically parse, validate, and convert both types. Path parameters are required by nature because they are embedded in the URL structure, while query parameters can be made optional by providing default values. FastAPI also supports string validation on parameters, allowing you to constrain values using regex patterns, minimum/maximum lengths, and numeric ranges."));
  children.push(...codeMulti([
    "from fastapi import FastAPI, Query, Path\n\napp = FastAPI()\n\n@app.get(\"/users/{user_id}\")\nasync def get_user(\n    user_id: int = Path(..., gt=0, description=\"User ID must be positive\"),\n    detail: bool = Query(False, description=\"Include detailed user info\"),\n    role: str = Query(None, enum=[\"admin\", \"user\", \"moderator\"]),\n    limit: int = Query(10, ge=1, le=100, description=\"Max results to return\"),\n    offset: int = Query(0, ge=0),\n):\n    return {\n        \"user_id\": user_id,\n        \"detail\": detail,\n        \"role\": role,\n        \"pagination\": {\"limit\": limit, \"offset\": offset}\n    }",
  ]));

  children.push(h2("1.6 Request Body & Response Model"));
  children.push(para("The request body is the data sent by the client to your API, typically as JSON. FastAPI uses Pydantic models to define the shape of request bodies and response payloads. When you declare a Pydantic model as a parameter in your path operation function, FastAPI will automatically parse the request body, validate it against the model, and return a 422 Unprocessable Entity error if validation fails. The response_model parameter controls what data is included in the response, allowing you to filter out sensitive fields like passwords without creating separate models."));
  children.push(...codeMulti([
    "from fastapi import FastAPI\nfrom pydantic import BaseModel, EmailStr, Field\nfrom typing import Optional, List\nfrom datetime import datetime\n\napp = FastAPI()\n\nclass UserCreate(BaseModel):\n    username: str = Field(..., min_length=3, max_length=50)\n    email: EmailStr\n    password: str = Field(..., min_length=8)\n    full_name: Optional[str] = None\n\nclass UserResponse(BaseModel):\n    id: int\n    username: str\n    email: EmailStr\n    full_name: Optional[str] = None\n    created_at: datetime\n    is_active: bool = True\n\n@app.post(\"/users\", response_model=UserResponse, status_code=201)\nasync def create_user(user: UserCreate):\n    # In production, hash the password and save to database\n    return {\n        \"id\": 1,\n        \"username\": user.username,\n        \"email\": user.email,\n        \"full_name\": user.full_name,\n        \"created_at\": datetime.now(),\n        \"is_active\": True\n    }",
  ]));

  // ──────────────────────── MODULE 2 ────────────────────────
  children.push(h1("Module 2: Pydantic & Data Validation"));

  children.push(h2("2.1 Pydantic V2 Basics"));
  children.push(para("Pydantic is the data validation engine that powers FastAPI. Version 2 of Pydantic, released in 2023, is a complete rewrite in Rust that delivers 5-50x performance improvements over V1 while maintaining a familiar API. Pydantic V2 uses Python type annotations to define data schemas and automatically validates incoming data against those schemas. Every BaseModel subclass becomes a data validator, serializer, and documentation generator all at once. When FastAPI receives a request, it passes the raw data through your Pydantic models, which validate types, apply constraints, and transform data into the shapes your application expects."));
  children.push(para("The key difference between Pydantic V1 and V2 is the migration from a pure Python implementation to a Rust core via the pydantic-core package. This means validation happens at native speed, not Python interpreter speed. The API surface remains largely compatible, but some internal methods and class structures have changed. If you are migrating from V1, the most notable changes are the removal of the .parse_obj() method (replaced by model_validate()), the removal of .dict() (replaced by model_dump()), and the new validator syntax using field_validator and model_validator decorators instead of the old @validator decorator."));
  children.push(...codeMulti([
    "from pydantic import BaseModel, Field, ConfigDict\nfrom typing import Optional\n\nclass Product(BaseModel):\n    model_config = ConfigDict(\n        str_strip_whitespace=True,\n        str_min_length=1,\n        json_schema_extra={\n            \"examples\": [{\"name\": \"Laptop\", \"price\": 999.99}]\n        }\n    )\n    \n    name: str = Field(..., min_length=1, max_length=200)\n    price: float = Field(..., gt=0)\n    description: Optional[str] = None\n    tags: list[str] = []\n\n# Validate data\nproduct = Product(name=\"  Wireless Mouse  \", price=29.99, tags=[\"electronics\"])\nprint(product.name)         # \"Wireless Mouse\" (stripped)\nprint(product.model_dump())  # {'name': 'Wireless Mouse', 'price': 29.99, ...}",
  ]));

  children.push(h2("2.2 BaseModel & Field Validation"));
  children.push(para("The BaseModel class is the foundation of Pydantic. Every model you define inherits from it, and each attribute represents a field with a type, default value, and optional constraints. The Field function provides fine-grained control over validation rules, including minimum and maximum values for numbers, length constraints for strings, regex patterns, and custom error messages. Fields marked with ... as the first argument are required, while fields with a default value are optional. Pydantic also supports default_factory for mutable defaults like lists and dictionaries, preventing the common Python pitfall of shared mutable state."));
  children.push(...codeMulti([
    "from pydantic import BaseModel, Field\nfrom datetime import datetime, date\nfrom decimal import Decimal\n\nclass Order(BaseModel):\n    order_id: int = Field(..., gt=0)\n    customer_name: str = Field(..., min_length=2, max_length=100)\n    total_amount: Decimal = Field(..., gt=0, decimal_places=2)\n    order_date: date\n    items_count: int = Field(..., ge=1, le=1000)\n    notes: str = Field(default=\"\", max_length=500)\n    created_at: datetime = Field(default_factory=datetime.now)\n\n# This raises ValidationError\ntry:\n    Order(order_id=-1, customer_name=\"A\", total_amount=-10, order_date=\"invalid\", items_count=0)\nexcept Exception as e:\n    print(e.error_count())  # 5 validation errors",
  ]));

  children.push(h2("2.3 Validators: field_validator & model_validator"));
  children.push(para("Custom validation logic goes beyond simple type checking. Pydantic V2 provides two main decorators for custom validation: field_validator for validating individual fields, and model_validator for cross-field validation that depends on multiple fields. The field_validator runs whenever a specific field is set, while model_validator runs after all field-level validation passes. Both support different modes: 'before' (runs before Pydantic's built-in validation), 'after' (runs after built-in validation), and 'wrap' (wraps around built-in validation for complete control)."));
  children.push(...codeMulti([
    "from pydantic import BaseModel, field_validator, model_validator\nimport re\n\nclass UserRegistration(BaseModel):\n    username: str\n    password: str\n    confirm_password: str\n    age: int\n\n    @field_validator('username')\n    @classmethod\n    def username_alphanumeric(cls, v):\n        if not re.match(r'^[a-zA-Z0-9_]+$', v):\n            raise ValueError('Username must be alphanumeric')\n        if len(v) < 3:\n            raise ValueError('Username must be at least 3 characters')\n        return v\n\n    @field_validator('password')\n    @classmethod\n    def password_strength(cls, v):\n        if len(v) < 8:\n            raise ValueError('Password must be at least 8 characters')\n        if not any(c.isupper() for c in v):\n            raise ValueError('Password must contain uppercase letter')\n        if not any(c.isdigit() for c in v):\n            raise ValueError('Password must contain a digit')\n        return v\n\n    @model_validator(mode='after')\n    def passwords_match(self):\n        if self.password != self.confirm_password:\n            raise ValueError('Passwords do not match')\n        return self",
  ]));

  children.push(h2("2.4 Nested Models & Complex Types"));
  children.push(para("Real-world data is rarely flat. Pydantic supports deeply nested models, allowing you to model complex hierarchical data structures. You can compose models by embedding one BaseModel inside another, create lists of models, use Optional for nullable fields, and leverage Python's typing module for unions, literals, and forward references. This composability means your Pydantic models can directly mirror your domain objects, from simple key-value pairs to deeply nested structures with dozens of levels. FastAPI automatically generates OpenAPI schemas for the entire hierarchy, so your documentation stays accurate even for the most complex data models."));
  children.push(...codeMulti([
    "from pydantic import BaseModel\nfrom typing import Optional, Literal, Union\n\nclass Address(BaseModel):\n    street: str\n    city: str\n    state: str\n    zip_code: str\n    country: str = \"US\"\n\nclass Company(BaseModel):\n    name: str\n    industry: Literal[\"tech\", \"finance\", \"healthcare\", \"other\"]\n    address: Address\n    website: Optional[str] = None\n\nclass Employee(BaseModel):\n    name: str\n    email: str\n    role: Literal[\"engineer\", \"manager\", \"designer\", \"executive\"]\n    company: Company\n    manager: Optional[\"Employee\"] = None  # Forward reference\n\n# Create nested instance\nemp = Employee(\n    name=\"Jane Doe\",\n    email=\"jane@example.com\",\n    role=\"engineer\",\n    company=Company(\n        name=\"TechCorp\",\n        industry=\"tech\",\n        address=Address(street=\"123 Main\", city=\"SF\", state=\"CA\", zip_code=\"94102\")\n    )\n)\nprint(emp.company.address.city)  # 'SF'",
  ]));

  children.push(h2("2.5 Serialization & Configuration"));
  children.push(para("Serialization is the process of converting Pydantic models to dictionaries, JSON strings, or other formats. Pydantic V2 provides model_dump() and model_dump_json() methods with powerful filtering options. You can exclude specific fields, include only certain fields, exclude unset fields (fields the user did not explicitly provide), exclude defaults, and customize the output format. The model_config attribute on BaseModel allows you to control behavior globally, such as forbidding extra fields, allowing arbitrary types, enforcing strict mode, and configuring JSON schema generation."));
  children.push(...codeMulti([
    "from pydantic import BaseModel, ConfigDict\nfrom typing import Optional\n\nclass SecureUser(BaseModel):\n    model_config = ConfigDict(\n        extra=\"forbid\",        # Reject unknown fields\n        populate_by_name=True, # Allow population by field name\n    )\n    \n    id: int\n    username: str\n    password_hash: str\n    api_key: Optional[str] = None\n    is_admin: bool = False\n\nuser = SecureUser(id=1, username=\"admin\", password_hash=\"abc123\", is_admin=True)\n\n# Exclude sensitive fields from output\nsafe_data = user.model_dump(exclude={\"password_hash\", \"api_key\"})\nprint(safe_data)  # {'id': 1, 'username': 'admin', 'is_admin': True}\n\n# Export to JSON\njson_str = user.model_dump_json(exclude={\"password_hash\"})",
  ]));

  // ──────────────────────── MODULE 3 ────────────────────────
  children.push(h1("Module 3: Advanced Routing & API Design"));

  children.push(h2("3.1 APIRouter & Modular Routing"));
  children.push(para("As your application grows, putting all routes in a single main.py file becomes unmanageable. FastAPI provides APIRouter to organize routes into separate modules, each with its own prefix and tags. This pattern mirrors the Blueprint concept in Flask and the Router concept in Express.js. APIRouter allows you to split your application into logical groups like users, products, orders, and authentication, each living in its own file with its own prefix. The main application then includes these routers, assembling them into a cohesive API. This modular approach also makes it easier for teams to work on different parts of the API simultaneously without merge conflicts."));
  children.push(...codeMulti([
    "# routers/users.py\nfrom fastapi import APIRouter, Depends\n\nrouter = APIRouter(prefix=\"/users\", tags=[\"users\"])\n\n@router.get(\"/\")\nasync def list_users():\n    return [{\"id\": 1, \"name\": \"Alice\"}, {\"id\": 2, \"name\": \"Bob\"}]\n\n@router.get(\"/{user_id}\")\nasync def get_user(user_id: int):\n    return {\"id\": user_id, \"name\": \"User\" + str(user_id)}\n\n@router.post(\"/\")\nasync def create_user(name: str):\n    return {\"id\": 3, \"name\": name}\n\n# ────────────────────────────────────────\n# routers/products.py\nfrom fastapi import APIRouter\n\nrouter = APIRouter(prefix=\"/products\", tags=[\"products\"])\n\n@router.get(\"/\")\nasync def list_products():\n    return [{\"id\": 1, \"name\": \"Widget\"}]\n\n# ────────────────────────────────────────\n# main.py\nfrom fastapi import FastAPI\nfrom routers.users import router as users_router\nfrom routers.products import router as products_router\n\napp = FastAPI()\napp.include_router(users_router)\napp.include_router(products_router)",
  ]));

  children.push(h2("3.2 Dependency Injection System"));
  children.push(para("FastAPI's dependency injection system is one of its most powerful features. It allows you to declare dependencies that FastAPI will resolve and inject before your path operation function runs. Dependencies can fetch database connections, verify authentication tokens, extract common query parameters, enforce rate limits, or perform any setup logic your endpoint needs. The beauty of this system is that dependencies themselves can have dependencies, creating a clean composable architecture. Dependencies can also yield values (using generator functions), which enables proper resource cleanup after the response is sent, such as closing database connections or releasing locks."));
  children.push(...codeMulti([
    "from fastapi import FastAPI, Depends, HTTPException, Query\nfrom typing import Optional\n\ndef common_parameters(\n    q: Optional[str] = Query(None),\n    skip: int = Query(0, ge=0),\n    limit: int = Query(100, ge=1, le=1000),\n):\n    return {\"q\": q, \"skip\": skip, \"limit\": limit}\n\ndef get_db():\n    db = DatabaseConnection()\n    try:\n        yield db\n    finally:\n        db.close()\n\ndef require_admin(token: str = Header(...)):\n    if not verify_admin_token(token):\n        raise HTTPException(status_code=403, detail=\"Admin access required\")\n    return {\"role\": \"admin\", \"token\": token}\n\napp = FastAPI()\n\n@app.get(\"/items\")\nasync def list_items(params: dict = Depends(common_parameters)):\n    return params\n\n@app.delete(\"/items/{item_id}\")\nasync def delete_item(item_id: int, admin: dict = Depends(require_admin), db=Depends(get_db)):\n    db.delete_item(item_id)\n    return {\"deleted\": item_id}",
  ]));

  children.push(h2("3.3 Middleware"));
  children.push(para("Middleware in FastAPI is a function that runs before and after every request, allowing you to implement cross-cutting concerns like logging, timing, error handling, and request modification. FastAPI middleware is built on top of Starlette's middleware system. Each middleware wraps around the next handler in the chain, giving you access to both the incoming request and the outgoing response. You can modify the request before it reaches your route handler, and you can modify the response before it is sent to the client. The @app.middleware decorator registers a middleware function, and the call_next function passes control to the next middleware or the actual route handler."));
  children.push(...codeMulti([
    "import time\nfrom fastapi import FastAPI, Request\n\napp = FastAPI()\n\n@app.middleware(\"http\")\nasync def add_process_time_header(request: Request, call_next):\n    start_time = time.time()\n    response = await call_next(request)\n    process_time = time.time() - start_time\n    response.headers[\"X-Process-Time\"] = str(process_time)\n    return response\n\n@app.middleware(\"http\")\nasync def log_requests(request: Request, call_next):\n    print(f\"Incoming: {request.method} {request.url}\")\n    response = await call_next(request)\n    print(f\"Response: {response.status_code}\")\n    return response",
  ]));

  children.push(h2("3.4 CORS Configuration"));
  children.push(para("Cross-Origin Resource Sharing (CORS) is a browser security mechanism that restricts web pages from making requests to a different domain than the one serving the page. When your FastAPI backend serves a frontend on a different domain or port, you must configure CORS to allow the frontend to communicate with the API. FastAPI provides the CORSMiddleware to handle this. You can specify which origins are allowed, which HTTP methods are permitted, which headers can be used, and whether credentials (cookies, authorization headers) are allowed. In development, you might allow all origins, but in production you should restrict CORS to your actual frontend domain."));
  children.push(...codeMulti([
    "from fastapi import FastAPI\nfrom fastapi.middleware.cors import CORSMiddleware\n\napp = FastAPI()\n\napp.add_middleware(\n    CORSMiddleware,\n    allow_origins=[\"https://myfrontend.com\", \"https://admin.myfrontend.com\"],\n    allow_credentials=True,\n    allow_methods=[\"GET\", \"POST\", \"PUT\", \"DELETE\", \"PATCH\"],\n    allow_headers=[\"Authorization\", \"Content-Type\"],\n    max_age=3600,  # Preflight cache duration\n)\n\n# For development only - DO NOT use in production:\n# allow_origins=[\"*\"]",
  ]));

  children.push(h2("3.5 Background Tasks"));
  children.push(para("Background tasks allow you to run operations after returning a response to the client. This is useful for operations that do not need to block the response, such as sending emails, logging analytics, processing files, or triggering webhooks. FastAPI's BackgroundTasks class lets you add functions to be executed after the response is sent. For more complex background processing that requires persistence, retries, or scheduling, you should use a task queue like Celery with a message broker like Redis or RabbitMQ. However, for simple fire-and-forget operations, FastAPI's built-in BackgroundTasks is more than sufficient and requires no additional infrastructure."));
  children.push(...codeMulti([
    "from fastapi import FastAPI, BackgroundTasks\nfrom pydantic import BaseModel, EmailStr\n\napp = FastAPI()\n\nclass UserSignup(BaseModel):\n    email: EmailStr\n    username: str\n\ndef send_welcome_email(email: str, username: str):\n    # Simulate email sending (in production, use an email service)\n    print(f\"Sending welcome email to {email} for user {username}\")\n\ndef log_signup(username: str):\n    print(f\"Logging signup for {username}\")\n\n@app.post(\"/signup\")\nasync def signup(user: UserSignup, background_tasks: BackgroundTasks):\n    background_tasks.add_task(send_welcome_email, user.email, user.username)\n    background_tasks.add_task(log_signup, user.username)\n    return {\"message\": f\"User {user.username} created. Welcome email will be sent.\"}",
  ]));

  // ──────────────────────── MODULE 4 ────────────────────────
  children.push(h1("Module 4: Database Integration"));

  children.push(h2("4.1 SQLAlchemy with FastAPI"));
  children.push(para("SQLAlchemy is the most popular ORM for Python, and it integrates seamlessly with FastAPI. SQLAlchemy provides two paradigms: the Core layer (table-oriented) and the ORM layer (model-oriented). We will use the ORM layer with the declarative mapping style, which allows you to define your database models as Python classes. The recommended pattern is to create a database session as a FastAPI dependency, so each request gets its own session that is automatically closed after the response is sent. This prevents connection leaks and ensures proper transaction management across your application."));
  children.push(...codeMulti([
    "# database.py\nfrom sqlalchemy import create_engine\nfrom sqlalchemy.orm import sessionmaker, DeclarativeBase\n\nSQLALCHEMY_DATABASE_URL = \"sqlite:///./app.db\"\n# For PostgreSQL: \"postgresql://user:password@localhost/dbname\"\n\nengine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={\"check_same_thread\": False})\nSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)\n\nclass Base(DeclarativeBase):\n    pass\n\ndef get_db():\n    db = SessionLocal()\n    try:\n        yield db\n    finally:\n        db.close()\n\n# models.py\nfrom sqlalchemy import Column, Integer, String, Float, Boolean\nfrom database import Base\n\nclass DBItem(Base):\n    __tablename__ = \"items\"\n    id = Column(Integer, primary_key=True, index=True)\n    name = Column(String(200), nullable=False, index=True)\n    price = Column(Float, nullable=False)\n    description = Column(String(1000))\n    is_available = Column(Boolean, default=True)",
  ]));

  children.push(h2("4.2 CRUD Operations"));
  children.push(para("CRUD (Create, Read, Update, Delete) operations form the backbone of most APIs. With SQLAlchemy and FastAPI, implementing CRUD is straightforward. The key pattern is to use Pydantic models for input validation (what the client sends) and output serialization (what the client receives), while SQLAlchemy models handle the actual database interaction. This separation of concerns keeps your code clean and testable. We typically create separate Pydantic schemas for creation, updating, and reading, each with different validation rules and field visibility."));
  children.push(...codeMulti([
    "from fastapi import FastAPI, Depends, HTTPException\nfrom sqlalchemy.orm import Session\nfrom pydantic import BaseModel, Field\nfrom typing import Optional, List\n\napp = FastAPI()\n\nclass ItemCreate(BaseModel):\n    name: str = Field(..., min_length=1, max_length=200)\n    price: float = Field(..., gt=0)\n    description: Optional[str] = None\n\nclass ItemUpdate(BaseModel):\n    name: Optional[str] = Field(None, min_length=1, max_length=200)\n    price: Optional[float] = Field(None, gt=0)\n    description: Optional[str] = None\n\nclass ItemResponse(BaseModel):\n    id: int\n    name: str\n    price: float\n    description: Optional[str]\n    is_available: bool\n\n@app.post(\"/items\", response_model=ItemResponse, status_code=201)\ndef create_item(item: ItemCreate, db: Session = Depends(get_db)):\n    db_item = DBItem(**item.model_dump())\n    db.add(db_item)\n    db.commit()\n    db.refresh(db_item)\n    return db_item\n\n@app.get(\"/items\", response_model=List[ItemResponse])\ndef list_items(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):\n    return db.query(DBItem).offset(skip).limit(limit).all()\n\n@app.get(\"/items/{item_id}\", response_model=ItemResponse)\ndef read_item(item_id: int, db: Session = Depends(get_db)):\n    item = db.query(DBItem).filter(DBItem.id == item_id).first()\n    if not item:\n        raise HTTPException(status_code=404, detail=\"Item not found\")\n    return item\n\n@app.put(\"/items/{item_id}\", response_model=ItemResponse)\ndef update_item(item_id: int, item: ItemUpdate, db: Session = Depends(get_db)):\n    db_item = db.query(DBItem).filter(DBItem.id == item_id).first()\n    if not db_item:\n        raise HTTPException(status_code=404, detail=\"Item not found\")\n    for key, value in item.model_dump(exclude_unset=True).items():\n        setattr(db_item, key, value)\n    db.commit()\n    db.refresh(db_item)\n    return db_item\n\n@app.delete(\"/items/{item_id}\")\ndef delete_item(item_id: int, db: Session = Depends(get_db)):\n    db_item = db.query(DBItem).filter(DBItem.id == item_id).first()\n    if not db_item:\n        raise HTTPException(status_code=404, detail=\"Item not found\")\n    db.delete(db_item)\n    db.commit()\n    return {\"detail\": \"Item deleted\"}",
  ]));

  children.push(h2("4.3 Database Migrations with Alembic"));
  children.push(para("Alembic is the database migration tool for SQLAlchemy, analogous to Django's migration system or Rails' Active Record Migrations. As your application evolves, your database schema changes: you add tables, modify columns, create indexes, and drop deprecated fields. Alembic tracks these changes as migration scripts, each representing a forward (upgrade) and backward (downgrade) transformation. This allows you to evolve your database schema in a controlled, repeatable manner across development, staging, and production environments. Alembic auto-generates migration scripts by comparing your SQLAlchemy models against the current database state, though you can also write custom migrations for complex transformations."));
  children.push(...codeMulti([
    "# Setup Alembic\n# pip install alembic\n# alembic init alembic\n\n# In alembic/env.py, import your Base metadata:\n# from database import Base\n# target_metadata = Base.metadata\n\n# Auto-generate a migration:\n# alembic revision --autogenerate -m \"Add items table\"\n\n# Apply migrations:\n# alembic upgrade head\n\n# Rollback one step:\n# alembic downgrade -1\n\n# View current version:\n# alembic current\n\n# View migration history:\n# alembic history",
  ]));

  children.push(h2("4.4 Async SQLAlchemy"));
  children.push(para("For high-concurrency applications, synchronous database operations can become a bottleneck because each query blocks the event loop. Async SQLAlchemy uses the asyncpg driver for PostgreSQL (or aiosqlite for SQLite) to perform database operations without blocking. The pattern is similar to synchronous SQLAlchemy, but you use AsyncSession instead of Session, and every database operation is awaited. This allows FastAPI to serve other requests while waiting for database I/O, dramatically improving throughput under load. The key change is using an async session maker and marking your path operation functions as async."));
  children.push(...codeMulti([
    "from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker\n\n# Async engine (note the async driver in URL)\nengine = create_async_engine(\"postgresql+asyncpg://user:pass@localhost/db\")\nasync_session = async_sessionmaker(engine, expire_on_commit=False)\n\nasync def get_async_db():\n    async with async_session() as session:\n        try:\n            yield session\n        finally:\n            await session.close()\n\n@app.get(\"/items/{item_id}\")\nasync def read_item(item_id: int, db: AsyncSession = Depends(get_async_db)):\n    result = await db.execute(select(DBItem).where(DBItem.id == item_id))\n    item = result.scalar_one_or_none()\n    if not item:\n        raise HTTPException(status_code=404, detail=\"Item not found\")\n    return item",
  ]));

  children.push(h2("4.5 Redis Caching"));
  children.push(para("Redis is an in-memory data store that excels as a caching layer. By caching frequently accessed data in Redis, you can reduce database load and dramatically improve response times. The typical pattern is to check Redis for a cached result before querying the database, and to store the database result in Redis after fetching it. Redis supports setting expiration times on keys, which is essential for cache invalidation. For production APIs, Redis caching can reduce average response times from hundreds of milliseconds to single-digit milliseconds for read-heavy endpoints."));
  children.push(...codeMulti([
    "import redis\nimport json\nfrom fastapi import FastAPI, Depends\n\nredis_client = redis.Redis(host=\"localhost\", port=6379, db=0, decode_responses=True)\napp = FastAPI()\n\ndef get_cache(key: str):\n    cached = redis_client.get(key)\n    if cached:\n        return json.loads(cached)\n    return None\n\ndef set_cache(key: str, value: dict, expire: int = 300):\n    redis_client.setex(key, expire, json.dumps(value))\n\n@app.get(\"/products/{product_id}\")\nasync def get_product(product_id: int, db=Depends(get_db)):\n    cache_key = f\"product:{product_id}\"\n    cached = get_cache(cache_key)\n    if cached:\n        return {**cached, \"cached\": True}\n    \n    product = db.query(DBItem).filter(DBItem.id == product_id).first()\n    if not product:\n        raise HTTPException(status_code=404)\n    \n    result = {\"id\": product.id, \"name\": product.name, \"price\": product.price}\n    set_cache(cache_key, result, expire=60)\n    return {**result, \"cached\": False}",
  ]));

  // ──────────────────────── MODULE 5 ────────────────────────
  children.push(h1("Module 5: Authentication & Security"));

  children.push(h2("5.1 JWT Authentication"));
  children.push(para("JSON Web Tokens (JWT) are the standard mechanism for stateless authentication in modern APIs. A JWT is a compact, URL-safe token that contains a set of claims (such as user ID, role, and expiration time) encoded as a JSON object. The token is signed with a secret key, so the server can verify its authenticity without storing session state. In a typical flow, the client sends credentials to a login endpoint, the server validates them and returns a JWT, and the client includes the JWT in the Authorization header of subsequent requests. FastAPI's security utilities make implementing JWT authentication straightforward, and the OAuth2PasswordBearer class handles extracting the token from the request automatically."));
  children.push(...codeMulti([
    "from datetime import datetime, timedelta\nfrom typing import Optional\nimport jwt\nfrom fastapi import FastAPI, Depends, HTTPException, status\nfrom fastapi.security import OAuth2PasswordBearer\nfrom pydantic import BaseModel\n\nSECRET_KEY = \"your-secret-key-keep-it-safe-in-production\"\nALGORITHM = \"HS256\"\nACCESS_TOKEN_EXPIRE_MINUTES = 30\n\noauth2_scheme = OAuth2PasswordBearer(tokenUrl=\"token\")\napp = FastAPI()\n\nclass TokenData(BaseModel):\n    username: Optional[str] = None\n\ndef create_access_token(data: dict, expires_delta: Optional[timedelta] = None):\n    to_encode = data.copy()\n    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))\n    to_encode.update({\"exp\": expire})\n    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)\n\ndef get_current_user(token: str = Depends(oauth2_scheme)):\n    credentials_exception = HTTPException(\n        status_code=status.HTTP_401_UNAUTHORIZED,\n        detail=\"Could not validate credentials\",\n        headers={\"WWW-Authenticate\": \"Bearer\"},\n    )\n    try:\n        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])\n        username: str = payload.get(\"sub\")\n        if username is None:\n            raise credentials_exception\n        token_data = TokenData(username=username)\n    except jwt.PyJWTError:\n        raise credentials_exception\n    return token_data\n\n@app.post(\"/token\")\nasync def login(username: str, password: str):\n    user = authenticate_user(username, password)  # Your auth logic\n    if not user:\n        raise HTTPException(status_code=401, detail=\"Invalid credentials\")\n    access_token = create_access_token(data={\"sub\": user.username})\n    return {\"access_token\": access_token, \"token_type\": \"bearer\"}\n\n@app.get(\"/users/me\")\nasync def read_users_me(current_user: TokenData = Depends(get_current_user)):\n    return {\"username\": current_user.username}",
  ]));

  children.push(h2("5.2 OAuth2 with Password Flow"));
  children.push(para("FastAPI provides built-in support for OAuth2 password bearer flow, which is the most common authentication pattern for APIs. The OAuth2PasswordBearer class tells FastAPI that endpoints require a bearer token in the Authorization header, and it automatically generates the proper OpenAPI documentation for the login flow. The OAuth2PasswordRequestForm class handles parsing the standard OAuth2 login form data (username, password, scope, etc.) from the request. When you use these together, your Swagger UI at /docs will show a Authorize button that lets users log in and test authenticated endpoints interactively, which is extremely helpful during development and testing."));
  children.push(...codeMulti([
    "from fastapi import FastAPI, Depends, HTTPException\nfrom fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm\n\napp = FastAPI()\noauth2_scheme = OAuth2PasswordBearer(tokenUrl=\"token\")\n\n@app.post(\"/token\")\nasync def login(form_data: OAuth2PasswordRequestForm = Depends()):\n    user = authenticate_user(form_data.username, form_data.password)\n    if not user:\n        raise HTTPException(status_code=400, detail=\"Incorrect username or password\")\n    access_token = create_access_token(data={\"sub\": user.username})\n    return {\"access_token\": access_token, \"token_type\": \"bearer\"}\n\n@app.get(\"/protected\")\nasync def protected_route(token: str = Depends(oauth2_scheme)):\n    user = verify_token(token)\n    return {\"message\": f\"Hello {user.username}!\"}",
  ]));

  children.push(h2("5.3 Role-Based Access Control (RBAC)"));
  children.push(para("Role-Based Access Control restricts API access based on the user's role. In FastAPI, you implement RBAC by creating dependency functions that check the user's role from the JWT token and raise a 403 Forbidden error if the user lacks the required role. You can compose these role-checking dependencies with your authentication dependency to create clean, reusable access control patterns. This approach scales well because each endpoint declares its access requirements through dependency injection, and the actual authorization logic is centralized in a few dependency functions rather than scattered across your route handlers."));
  children.push(...codeMulti([
    "from fastapi import FastAPI, Depends, HTTPException, status\nfrom functools import wraps\n\ndef require_role(*roles: str):\n    def role_checker(current_user: dict = Depends(get_current_user)):\n        if current_user.get(\"role\") not in roles:\n            raise HTTPException(\n                status_code=status.HTTP_403_FORBIDDEN,\n                detail=f\"Requires one of roles: {', '.join(roles)}\"\n            )\n        return current_user\n    return role_checker\n\n@app.get(\"/admin/dashboard\")\nasync def admin_dashboard(admin: dict = Depends(require_role(\"admin\"))):\n    return {\"message\": \"Welcome to admin dashboard\"}\n\n@app.get(\"/moderator/reports\")\nasync def moderator_reports(mod: dict = Depends(require_role(\"admin\", \"moderator\"))):\n    return {\"message\": \"Reports data\"}",
  ]));

  children.push(h2("5.4 Rate Limiting & Security Headers"));
  children.push(para("Rate limiting protects your API from abuse by restricting how many requests a client can make within a time window. The slowapi library provides a simple rate limiting decorator for FastAPI. Security headers add an additional layer of protection by instructing browsers to enforce security policies like XSS protection, content type sniffing prevention, and clickjacking protection. Both are essential for production deployments. Rate limiting should be applied globally to all endpoints, with stricter limits on expensive operations like login attempts and file uploads. Security headers should be added via middleware to ensure they are present on every response."));
  children.push(...codeMulti([
    "from fastapi import FastAPI, Request\nfrom slowapi import Limiter\nfrom slowapi.util import get_remote_address\n\nlimiter = Limiter(key_func=get_remote_address)\napp = FastAPI()\n\n@app.get(\"/api/data\")\n@limiter.limit(\"10/minute\")\nasync def get_data(request: Request):\n    return {\"data\": \"sensitive information\"}\n\n@app.post(\"/login\")\n@limiter.limit(\"5/minute\")  # Stricter for login\nasync def login(request: Request):\n    return {\"token\": \"...\"}\n\n# Security headers middleware\n@app.middleware(\"http\")\nasync def add_security_headers(request: Request, call_next):\n    response = await call_next(request)\n    response.headers[\"X-Content-Type-Options\"] = \"nosniff\"\n    response.headers[\"X-Frame-Options\"] = \"DENY\"\n    response.headers[\"X-XSS-Protection\"] = \"1; mode=block\"\n    response.headers[\"Strict-Transport-Security\"] = \"max-age=31536000; includeSubDomains\"\n    return response",
  ]));

  // ──────────────────────── MODULE 6 ────────────────────────
  children.push(h1("Module 6: Testing & Documentation"));

  children.push(h2("6.1 Unit Testing with pytest"));
  children.push(para("Testing is not optional in production software. FastAPI provides the TestClient class, which wraps Starlette's test client and allows you to make requests to your application without actually starting a server. This makes tests fast, deterministic, and easy to set up. The TestClient uses Python's requests library interface, so if you have ever used the requests library, the testing API will feel immediately familiar. You can test path operations, validation, authentication, error handling, and any other aspect of your API. pytest is the recommended test framework because of its simple assertion syntax, powerful fixtures, and extensive plugin ecosystem."));
  children.push(...codeMulti([
    "# test_main.py\nfrom fastapi.testclient import TestClient\nfrom main import app\n\nclient = TestClient(app)\n\ndef test_read_root():\n    response = client.get(\"/\")\n    assert response.status_code == 200\n    assert response.json() == {\"message\": \"Welcome to FastAPI!\"}\n\ndef test_create_item():\n    response = client.post(\"/items/1?name=Widget&price=9.99\")\n    assert response.status_code == 200\n    assert response.json()[\"name\"] == \"Widget\"\n\ndef test_create_duplicate_item():\n    client.post(\"/items/2?name=Widget2&price=19.99\")\n    response = client.post(\"/items/2?name=Widget2&price=19.99\")\n    assert response.status_code == 400\n\ndef test_read_nonexistent_item():\n    response = client.get(\"/items/999\")\n    assert response.status_code == 404\n\ndef test_validation_error():\n    response = client.post(\"/users\", json={\"username\": \"ab\", \"email\": \"invalid\", \"password\": \"short\"})\n    assert response.status_code == 422\n    errors = response.json()[\"detail\"]\n    assert len(errors) > 0\n\n# Run with: pytest test_main.py -v",
  ]));

  children.push(h2("6.2 Integration Testing"));
  children.push(para("Integration tests verify that multiple components work together correctly. Unlike unit tests that test individual functions in isolation, integration tests exercise the full request-response cycle including database operations, authentication, and business logic. For database integration tests, you should use a separate test database and clean it between tests using pytest fixtures. This ensures tests are isolated and repeatable. The fixture pattern with pytest provides a clean way to set up and tear down test resources, including database connections, test data, and authenticated clients."));
  children.push(...codeMulti([
    "import pytest\nfrom sqlalchemy import create_engine\nfrom sqlalchemy.orm import sessionmaker\nfrom fastapi.testclient import TestClient\n\n# Use in-memory SQLite for tests\nTEST_DB_URL = \"sqlite:///./test.db\"\ntest_engine = create_engine(TEST_DB_URL)\nTestSession = sessionmaker(bind=test_engine)\n\n@pytest.fixture\ndef db_session():\n    Base.metadata.create_all(bind=test_engine)\n    session = TestSession()\n    try:\n        yield session\n    finally:\n        session.close()\n        Base.metadata.drop_all(bind=test_engine)\n\n@pytest.fixture\ndef client(db_session):\n    def override_get_db():\n        try:\n            yield db_session\n        finally:\n            db_session.close()\n    app.dependency_overrides[get_db] = override_get_db\n    yield TestClient(app)\n    app.dependency_overrides.clear()\n\ndef test_full_crud_flow(client):\n    # Create\n    resp = client.post(\"/items\", json={\"name\": \"Test\", \"price\": 10.0})\n    assert resp.status_code == 201\n    item_id = resp.json()[\"id\"]\n    # Read\n    resp = client.get(f\"/items/{item_id}\")\n    assert resp.json()[\"name\"] == \"Test\"\n    # Update\n    resp = client.put(f\"/items/{item_id}\", json={\"name\": \"Updated\"})\n    assert resp.json()[\"name\"] == \"Updated\"\n    # Delete\n    resp = client.delete(f\"/items/{item_id}\")\n    assert resp.status_code == 200",
  ]));

  children.push(h2("6.3 Auto-Generated API Documentation"));
  children.push(para("One of FastAPI's most celebrated features is its automatic documentation generation. Based on your type hints, Pydantic models, and path operation definitions, FastAPI generates a complete OpenAPI 3.0 specification. This specification powers two interactive documentation interfaces: Swagger UI (available at /docs) and ReDoc (available at /redoc). Swagger UI provides a try-it-out feature that lets developers test endpoints directly from the browser, while ReDoc provides a clean, professional documentation layout. You can customize both interfaces with your own branding, descriptions, and examples using the FastAPI constructor parameters and the Field function's description and example arguments."));
  children.push(...codeMulti([
    "from fastapi import FastAPI\nfrom pydantic import BaseModel, Field\n\ndescription = \"\"\"## E-Commerce API\n\nThis API provides endpoints for managing products, orders, and users.\n\n### Features\n* Product catalog management\n* Order processing\n* User authentication\n\"\"\"\n\napp = FastAPI(\n    title=\"E-Commerce API\",\n    description=description,\n    version=\"2.0.0\",\n    terms_of_service=\"https://example.com/terms\",\n    contact={\"name\": \"API Support\", \"email\": \"support@example.com\"},\n    license_info={\"name\": \"MIT\"},\n    docs_url=\"/docs\",          # Swagger UI\n    redoc_url=\"/redoc\",        # ReDoc\n    openapi_url=\"/openapi.json\" # OpenAPI schema\n)\n\nclass Product(BaseModel):\n    name: str = Field(..., description=\"Product name\", examples=[\"Wireless Mouse\"])\n    price: float = Field(..., gt=0, description=\"Price in USD\", examples=[29.99])",
  ]));

  // ──────────────────────── MODULE 7 ────────────────────────
  children.push(h1("Module 7: Deployment & Production"));

  children.push(h2("7.1 Production Project Structure"));
  children.push(para("A well-organized project structure is crucial for maintainability and scalability. The recommended FastAPI project structure separates concerns into distinct modules: routers for API endpoints, models for database schemas, schemas for Pydantic validation models, services for business logic, and core for configuration and shared utilities. This structure follows the separation of concerns principle and makes it easy for new team members to understand the codebase. Each module has a clear responsibility, and the dependency flow is unidirectional: routers depend on services, services depend on models and schemas, but never the reverse."));
  children.push(...codeMulti([
    "project/\n\u251c\u2500\u2500 app/\n\u2502   \u251c\u2500\u2500 __init__.py\n\u2502   \u251c\u2500\u2500 main.py              # FastAPI application\n\u2502   \u251c\u2500\u2500 core/\n\u2502   \u2502   \u251c\u2500\u2500 config.py          # Settings (pydantic-settings)\n\u2502   \u2502   \u251c\u2500\u2500 security.py        # JWT, password hashing\n\u2502   \u2502   \u2514\u2500\u2500 deps.py            # Shared dependencies\n\u2502   \u251c\u2500\u2500 models/                # SQLAlchemy models\n\u2502   \u2502   \u251c\u2500\u2500 user.py\n\u2502   \u2502   \u2514\u2500\u2500 item.py\n\u2502   \u251c\u2500\u2500 schemas/               # Pydantic schemas\n\u2502   \u2502   \u251c\u2500\u2500 user.py\n\u2502   \u2502   \u2514\u2500\u2500 item.py\n\u2502   \u251c\u2500\u2500 routers/               # API route handlers\n\u2502   \u2502   \u251c\u2500\u2500 auth.py\n\u2502   \u2502   \u251c\u2500\u2500 users.py\n\u2502   \u2502   \u2514\u2500\u2500 items.py\n\u2502   \u251c\u2500\u2500 services/              # Business logic\n\u2502   \u2502   \u251c\u2500\u2500 user_service.py\n\u2502   \u2502   \u2514\u2500\u2500 item_service.py\n\u2502   \u2514\u2500\u2500 database.py            # DB connection\n\u251c\u2500\u2500 alembic/                 # Database migrations\n\u251c\u2500\u2500 tests/\n\u251c\u2500\u2500 requirements.txt\n\u251c\u2500\u2500 Dockerfile\n\u251c\u2500\u2500 docker-compose.yml\n\u2514\u2500\u2500 .env",
  ]));

  children.push(h2("7.2 Environment Configuration with pydantic-settings"));
  children.push(para("Hardcoded configuration values are a security risk and a maintenance nightmare. The pydantic-settings package (formerly pydantic's BaseSettings) provides a clean way to manage configuration through environment variables, .env files, and type-safe validation. Settings are defined as a Pydantic model, so they benefit from the same validation, type coercion, and documentation as your API schemas. Sensitive values like database passwords and secret keys should never be committed to source control; instead, they should be injected through environment variables or a .env file that is listed in .gitignore."));
  children.push(...codeMulti([
    "# app/core/config.py\nfrom pydantic_settings import BaseSettings\nfrom pydantic import Field\n\nclass Settings(BaseSettings):\n    APP_NAME: str = \"FastAPI App\"\n    DEBUG: bool = False\n    DATABASE_URL: str = Field(..., description=\"Database connection string\")\n    SECRET_KEY: str = Field(..., description=\"JWT secret key\")\n    ALGORITHM: str = \"HS256\"\n    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30\n    REDIS_URL: str = \"redis://localhost:6379\"\n    CORS_ORIGINS: list[str] = [\"http://localhost:3000\"]\n\n    model_config = {\"env_file\": \".env\", \"env_file_encoding\": \"utf-8\"}\n\nsettings = Settings()  # Reads from environment / .env\n\n# Usage in main.py:\n# from app.core.config import settings\n# app = FastAPI(title=settings.APP_NAME)",
  ]));

  children.push(h2("7.3 Docker & Docker Compose"));
  children.push(para("Docker containers ensure your application runs consistently across all environments, from development laptops to production servers. A well-crafted Dockerfile uses a multi-stage build to minimize image size: the first stage installs all dependencies, and the second stage copies only the runtime artifacts into a slim image. Docker Compose orchestrates multiple containers, making it easy to run your API alongside its dependencies (PostgreSQL, Redis, etc.) with a single command. This is especially valuable for development, where spinning up the entire stack should be as simple as running docker-compose up."));
  children.push(...codeMulti([
    "# Dockerfile\nFROM python:3.11-slim AS builder\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY . .\n\nFROM python:3.11-slim\nWORKDIR /app\nCOPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages\nCOPY --from=builder /app /app\nEXPOSE 8000\nCMD [\"uvicorn\", \"app.main:app\", \"--host\", \"0.0.0.0\", \"--port\", \"8000\"]\n\n# ─────────────────────────────────────────\n# docker-compose.yml\nversion: '3.8'\nservices:\n  api:\n    build: .\n    ports: [\"8000:8000\"]\n    env_file: .env\n    depends_on: [db, redis]\n  db:\n    image: postgres:15\n    environment:\n      POSTGRES_DB: app_db\n      POSTGRES_USER: app_user\n      POSTGRES_PASSWORD: secret\n    volumes: [\"pgdata:/var/lib/postgresql/data\"]\n    ports: [\"5432:5432\"]\n  redis:\n    image: redis:7-alpine\n    ports: [\"6379:6379\"]\nvolumes:\n  pgdata:",
  ]));

  children.push(h2("7.4 Error Handling & Exception Middleware"));
  children.push(para("Graceful error handling is a hallmark of production-ready APIs. FastAPI allows you to define custom exception handlers that intercept specific exception types and return structured error responses. You can also create a global exception handler middleware that catches any unhandled exception, logs it for debugging, and returns a generic 500 error without exposing internal details. The key principle is that your API should never return raw stack traces to clients, and error responses should always follow a consistent format with enough information for clients to understand what went wrong and how to fix it."));
  children.push(...codeMulti([
    "from fastapi import FastAPI, Request\nfrom fastapi.responses import JSONResponse\nfrom pydantic import BaseModel\n\nclass ErrorResponse(BaseModel):\n    error: str\n    detail: str\n    status_code: int\n\napp = FastAPI()\n\nclass AppException(Exception):\n    def __init__(self, error: str, detail: str, status_code: int = 400):\n        self.error = error\n        self.detail = detail\n        self.status_code = status_code\n\n@app.exception_handler(AppException)\nasync def app_exception_handler(request: Request, exc: AppException):\n    return JSONResponse(\n        status_code=exc.status_code,\n        content=ErrorResponse(\n            error=exc.error, detail=exc.detail, status_code=exc.status_code\n        ).model_dump()\n    )\n\n@app.exception_handler(Exception)\nasync def global_exception_handler(request: Request, exc: Exception):\n    # Log the full exception for debugging\n    import traceback\n    traceback.print_exc()\n    return JSONResponse(\n        status_code=500,\n        content={\"error\": \"internal_error\", \"detail\": \"An unexpected error occurred\", \"status_code\": 500}\n    )",
  ]));

  children.push(h2("7.5 WebSocket Real-time Communication"));
  children.push(para("WebSocket enables full-duplex communication between client and server, allowing real-time data exchange without the overhead of HTTP polling. FastAPI supports WebSocket through the WebSocket class, which provides methods for accepting connections, receiving messages, and sending messages. WebSocket is ideal for chat applications, live notifications, real-time dashboards, collaborative editing, and any feature where the server needs to push data to the client immediately. FastAPI's WebSocket support is built on Starlette's implementation and works seamlessly alongside your regular HTTP endpoints."));
  children.push(...codeMulti([
    "from fastapi import FastAPI, WebSocket, WebSocketDisconnect\nfrom typing import List\n\napp = FastAPI()\n\nclass ConnectionManager:\n    def __init__(self):\n        self.active_connections: List[WebSocket] = []\n\n    async def connect(self, websocket: WebSocket):\n        await websocket.accept()\n        self.active_connections.append(websocket)\n\n    def disconnect(self, websocket: WebSocket):\n        self.active_connections.remove(websocket)\n\n    async def broadcast(self, message: str):\n        for connection in self.active_connections:\n            await connection.send_text(message)\n\nmanager = ConnectionManager()\n\n@app.websocket(\"/ws/{client_id}\")\nasync def websocket_endpoint(websocket: WebSocket, client_id: int):\n    await manager.connect(websocket)\n    try:\n        while True:\n            data = await websocket.receive_text()\n            await manager.broadcast(f\"Client {client_id}: {data}\")\n    except WebSocketDisconnect:\n        manager.disconnect(websocket)\n        await manager.broadcast(f\"Client {client_id} left the chat\")",
  ]));

  children.push(h2("7.6 Logging & Monitoring"));
  children.push(para("Production APIs need comprehensive logging for debugging, auditing, and performance monitoring. Python's logging module provides flexible log levels, formatters, and handlers. For FastAPI, you should log every request with its method, path, status code, and response time. Structured logging (JSON format) is preferred for production because it integrates easily with log aggregation services like ELK Stack, Datadog, or CloudWatch. You should also monitor key metrics like request latency percentiles, error rates, and active connections, which can be exported to Prometheus using the fastapi-instrumentation library or custom middleware."));
  children.push(...codeMulti([
    "import logging\nimport json\nimport time\nfrom fastapi import FastAPI, Request\n\n# Structured JSON logging\nlogging.basicConfig(level=logging.INFO)\nlogger = logging.getLogger(\"api\")\n\napp = FastAPI()\n\n@app.middleware(\"http\")\nasync def logging_middleware(request: Request, call_next):\n    start = time.time()\n    response = await call_next(request)\n    duration = time.time() - start\n    log_data = {\n        \"method\": request.method,\n        \"path\": str(request.url.path),\n        \"status\": response.status_code,\n        \"duration_ms\": round(duration * 1000, 2),\n        \"client_ip\": request.client.host if request.client else None,\n    }\n    logger.info(json.dumps(log_data))\n    return response",
  ]));

  // ──────────────────────── MINI PROJECTS ────────────────────────
  children.push(h1("Mini Projects"));

  children.push(h2("Mini Project 1: URL Shortener API"));
  children.push(para("Build a fully functional URL shortener API that accepts long URLs, generates short codes, stores them in a database, and redirects short URLs to their original destinations. This project covers the complete CRUD lifecycle, path parameter handling, database operations with SQLAlchemy, response model design, error handling, and proper HTTP status codes. The URL shortener also demonstrates the difference between returning JSON data (for the create endpoint) and returning a redirect response (for the redirect endpoint)."));
  children.push(...codeMulti([
    "# url_shortener/main.py\nimport string, random\nfrom fastapi import FastAPI, HTTPException, Depends\nfrom sqlalchemy.orm import Session\nfrom pydantic import BaseModel, HttpUrl\nfrom database import Base, engine, get_db\nfrom sqlalchemy import Column, String, DateTime\nfrom datetime import datetime\n\napp = FastAPI(title=\"URL Shortener\")\n\n# --- Database Model ---\nclass URL(Base):\n    __tablename__ = \"urls\"\n    short_code = Column(String(10), primary_key=True)\n    original_url = Column(String(2048), nullable=False)\n    created_at = Column(DateTime, default=datetime.utcnow)\n    clicks = Column(Integer, default=0)\n\nBase.metadata.create_all(bind=engine)\n\n# --- Schemas ---\nclass URLRequest(BaseModel):\n    url: HttpUrl\n\nclass URLResponse(BaseModel):\n    short_code: str\n    original_url: str\n    short_url: str\n    clicks: int\n\n# --- Helper ---\ndef generate_short_code(length: int = 6) -> str:\n    chars = string.ascii_letters + string.digits\n    return ''.join(random.choices(chars, k=length))\n\n# --- Endpoints ---\n@app.post(\"/shorten\", response_model=URLResponse, status_code=201)\ndef create_short_url(request: URLRequest, db: Session = Depends(get_db)):\n    code = generate_short_code()\n    while db.query(URL).filter(URL.short_code == code).first():\n        code = generate_short_code()\n    url_obj = URL(short_code=code, original_url=str(request.url))\n    db.add(url_obj)\n    db.commit()\n    db.refresh(url_obj)\n    return URLResponse(short_code=code, original_url=str(request.url), short_url=f\"http://localhost:8000/{code}\", clicks=0)\n\n@app.get(\"/{short_code}\")\ndef redirect_url(short_code: str, db: Session = Depends(get_db)):\n    url_obj = db.query(URL).filter(URL.short_code == short_code).first()\n    if not url_obj:\n        raise HTTPException(status_code=404, detail=\"URL not found\")\n    url_obj.clicks += 1\n    db.commit()\n    from fastapi.responses import RedirectResponse\n    return RedirectResponse(url=url_obj.original_url)\n\n@app.get(\"/stats/{short_code}\", response_model=URLResponse)\ndef url_stats(short_code: str, db: Session = Depends(get_db)):\n    url_obj = db.query(URL).filter(URL.short_code == short_code).first()\n    if not url_obj:\n        raise HTTPException(status_code=404, detail=\"URL not found\")\n    return URLResponse(short_code=url_obj.short_code, original_url=url_obj.original_url, short_url=f\"http://localhost:8000/{url_obj.short_code}\", clicks=url_obj.clicks)",
  ]));

  children.push(h2("Mini Project 2: Blog API with Authentication"));
  children.push(para("Build a blog API with user registration, JWT authentication, and full CRUD operations for blog posts. This project demonstrates how to combine authentication, database operations, and authorization in a realistic application. Users can create accounts, log in to receive JWT tokens, create and edit their own posts, and read all posts. The API enforces that users can only edit or delete their own posts, demonstrating ownership-based authorization on top of basic authentication. This pattern of resource ownership is one of the most common authorization patterns in real-world APIs."));
  children.push(...codeMulti([
    "# blog/main.py (key endpoints)\nfrom fastapi import FastAPI, Depends, HTTPException, status\nfrom fastapi.security import OAuth2PasswordRequestForm\n\napp = FastAPI(title=\"Blog API\")\n\n@app.post(\"/auth/register\", status_code=201)\nasync def register(user: UserCreate, db: Session = Depends(get_db)):\n    if db.query(User).filter(User.username == user.username).first():\n        raise HTTPException(status_code=400, detail=\"Username already taken\")\n    if db.query(User).filter(User.email == user.email).first():\n        raise HTTPException(status_code=400, detail=\"Email already registered\")\n    hashed_pw = hash_password(user.password)\n    db_user = User(username=user.username, email=user.email, hashed_password=hashed_pw)\n    db.add(db_user)\n    db.commit()\n    return {\"message\": \"User created successfully\"}\n\n@app.post(\"/auth/token\")\nasync def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):\n    user = authenticate_user(db, form_data.username, form_data.password)\n    if not user:\n        raise HTTPException(status_code=401, detail=\"Invalid credentials\")\n    token = create_access_token({\"sub\": user.username, \"user_id\": user.id})\n    return {\"access_token\": token, \"token_type\": \"bearer\"}\n\n@app.post(\"/posts\", response_model=PostResponse, status_code=201)\nasync def create_post(post: PostCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):\n    db_post = Post(title=post.title, content=post.content, author_id=current_user.id)\n    db.add(db_post)\n    db.commit()\n    db.refresh(db_post)\n    return db_post\n\n@app.put(\"/posts/{post_id}\", response_model=PostResponse)\nasync def update_post(post_id: int, post: PostUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):\n    db_post = db.query(Post).filter(Post.id == post_id).first()\n    if not db_post:\n        raise HTTPException(status_code=404)\n    if db_post.author_id != current_user.id:  # Ownership check\n        raise HTTPException(status_code=403, detail=\"Not your post\")\n    for key, value in post.model_dump(exclude_unset=True).items():\n        setattr(db_post, key, value)\n    db.commit()\n    return db_post",
  ]));

  children.push(h2("Mini Project 3: Real-time Chat with WebSocket"));
  children.push(para("Build a real-time chat application using FastAPI's WebSocket support. This project teaches you how to manage WebSocket connections, broadcast messages to all connected clients, handle disconnections gracefully, and maintain connection state. The chat server supports multiple chat rooms, private messages, and typing indicators. This project is fundamental for understanding real-time application patterns, which are increasingly important in modern web applications for features like live updates, notifications, collaborative editing, and streaming data."));
  children.push(...codeMulti([
    "# chat/main.py\nfrom fastapi import FastAPI, WebSocket, WebSocketDisconnect\nfrom typing import Dict, List\nfrom pydantic import BaseModel\nimport json\n\napp = FastAPI(title=\"Real-time Chat\")\n\nclass ChatRoom:\n    def __init__(self, name: str):\n        self.name = name\n        self.connections: Dict[str, WebSocket] = {}\n\n    async def broadcast(self, message: dict, exclude: str = None):\n        for username, ws in self.connections.items():\n            if username != exclude:\n                await ws.send_json(message)\n\nclass ChatManager:\n    def __init__(self):\n        self.rooms: Dict[str, ChatRoom] = {}\n\n    def get_room(self, room_name: str) -> ChatRoom:\n        if room_name not in self.rooms:\n            self.rooms[room_name] = ChatRoom(room_name)\n        return self.rooms[room_name]\n\nmanager = ChatManager()\n\n@app.websocket(\"/ws/{room_name}/{username}\")\nasync def websocket_chat(websocket: WebSocket, room_name: str, username: str):\n    await websocket.accept()\n    room = manager.get_room(room_name)\n    room.connections[username] = websocket\n    await room.broadcast({\"type\": \"join\", \"username\": username, \"room\": room_name})\n    try:\n        while True:\n            data = await websocket.receive_text()\n            message = json.loads(data)\n            await room.broadcast({\n                \"type\": \"message\",\n                \"username\": username,\n                \"content\": message.get(\"content\", \"\"),\n                \"room\": room_name\n            })\n    except WebSocketDisconnect:\n        del room.connections[username]\n        await room.broadcast({\"type\": \"leave\", \"username\": username, \"room\": room_name})\n\n@app.get(\"/rooms\")\nasync def list_rooms():\n    return {\"rooms\": list(manager.rooms.keys())}\n\n@app.get(\"/rooms/{room_name}/users\")\nasync def list_room_users(room_name: str):\n    room = manager.rooms.get(room_name)\n    if not room:\n        return {\"users\": []}\n    return {\"users\": list(room.connections.keys())}",
  ]));

  // ──────────────────────── MAJOR PROJECTS ────────────────────────
  children.push(h1("Major Projects"));

  children.push(h2("Major Project 1: E-Commerce API"));
  children.push(para("This is a comprehensive e-commerce API that incorporates every concept from this tutorial into a production-grade application. The API includes user management with JWT authentication and role-based access control, a product catalog with search and filtering, a shopping cart system, order processing with status tracking, and an admin dashboard for managing products and orders. The project demonstrates proper separation of concerns with a layered architecture (routers, services, models, schemas), comprehensive error handling, database migrations, Redis caching for product listings, rate limiting on sensitive endpoints, and full test coverage."));
  children.push(h3("Project Architecture"));
  children.push(para("The e-commerce API follows a clean layered architecture. The router layer handles HTTP request parsing and response formatting. The service layer contains business logic such as price calculations, inventory checks, and order validation. The model layer defines database schemas. The schema layer defines Pydantic models for request validation and response serialization. This separation ensures that each layer has a single responsibility and can be tested independently. The service layer is particularly important because it encapsulates business rules that should not be duplicated across multiple endpoints."));
  children.push(...codeMulti([
    "# ecommerce/app/main.py\nfrom fastapi import FastAPI\nfrom fastapi.middleware.cors import CORSMiddleware\nfrom app.core.config import settings\nfrom app.routers import auth, products, cart, orders, admin\n\napp = FastAPI(\n    title=settings.APP_NAME,\n    version=\"1.0.0\",\n    description=\"Full-featured E-Commerce API\",\n)\n\napp.add_middleware(\n    CORSMiddleware,\n    allow_origins=settings.CORS_ORIGINS,\n    allow_credentials=True,\n    allow_methods=[\"*\"],\n    allow_headers=[\"*\"],\n)\n\napp.include_router(auth.router, prefix=\"/api/auth\", tags=[\"Authentication\"])\napp.include_router(products.router, prefix=\"/api/products\", tags=[\"Products\"])\napp.include_router(cart.router, prefix=\"/api/cart\", tags=[\"Cart\"])\napp.include_router(orders.router, prefix=\"/api/orders\", tags=[\"Orders\"])\napp.include_router(admin.router, prefix=\"/api/admin\", tags=[\"Admin\"])\n\n@app.on_event(\"startup\")\nasync def startup():\n    # Create tables, warm cache, etc.\n    pass",
  ]));
  children.push(h3("Product Service with Caching"));
  children.push(para("The product service demonstrates the caching pattern with Redis. Product listings are cached for 60 seconds to reduce database load during traffic spikes. When a product is updated or deleted, the cache is invalidated to ensure consistency. The service also supports full-text search using PostgreSQL's full-text search capabilities, with search results cached separately with a shorter TTL since they change more frequently."));
  children.push(...codeMulti([
    "# ecommerce/app/services/product_service.py\nfrom app.models.product import Product\nfrom app.schemas.product import ProductCreate, ProductUpdate, ProductResponse\nfrom app.core.cache import get_cache, set_cache, delete_cache\n\nclass ProductService:\n    def __init__(self, db: Session):\n        self.db = db\n\n    async def list_products(self, skip: int = 0, limit: int = 20, category: str = None):\n        cache_key = f\"products:{skip}:{limit}:{category}\"\n        cached = get_cache(cache_key)\n        if cached:\n            return cached\n        query = self.db.query(Product)\n        if category:\n            query = query.filter(Product.category == category)\n        products = query.offset(skip).limit(limit).all()\n        result = [ProductResponse.model_validate(p).model_dump() for p in products]\n        set_cache(cache_key, result, expire=60)\n        return result\n\n    async def get_product(self, product_id: int):\n        cache_key = f\"product:{product_id}\"\n        cached = get_cache(cache_key)\n        if cached:\n            return cached\n        product = self.db.query(Product).filter(Product.id == product_id).first()\n        if not product:\n            raise AppException(\"not_found\", \"Product not found\", 404)\n        result = ProductResponse.model_validate(product).model_dump()\n        set_cache(cache_key, result, expire=120)\n        return result\n\n    async def create_product(self, data: ProductCreate) -> Product:\n        product = Product(**data.model_dump())\n        self.db.add(product)\n        self.db.commit()\n        self.db.refresh(product)\n        delete_cache(\"products:\")  # Invalidate list cache\n        return product",
  ]));
  children.push(h3("Order Processing with Status Tracking"));
  children.push(para("Orders go through a defined lifecycle: pending, confirmed, processing, shipped, delivered, or cancelled. The order service validates that products are in stock before creating an order, reserves inventory, and sends confirmation emails via background tasks. Each status change is logged with a timestamp for audit purposes. The service also handles partial cancellations, where individual items can be removed from an order with appropriate refund calculations."));
  children.push(...codeMulti([
    "# ecommerce/app/services/order_service.py\nfrom app.models.order import Order, OrderItem, OrderStatus\nfrom app.services.product_service import ProductService\n\nclass OrderService:\n    def __init__(self, db: Session):\n        self.db = db\n        self.product_service = ProductService(db)\n\n    async def create_order(self, user_id: int, items: list, background_tasks: BackgroundTasks):\n        total = 0\n        order_items = []\n        for item in items:\n            product = await self.product_service.get_product(item.product_id)\n            if product[\"stock\"] < item.quantity:\n                raise AppException(\"out_of_stock\", f\"Product {product['name']} out of stock\", 400)\n            subtotal = product[\"price\"] * item.quantity\n            total += subtotal\n            order_items.append(OrderItem(product_id=item.product_id, quantity=item.quantity, price=product[\"price\"]))\n\n        order = Order(user_id=user_id, total=total, status=OrderStatus.PENDING, items=order_items)\n        self.db.add(order)\n        self.db.commit()\n        self.db.refresh(order)\n        background_tasks.add_task(send_order_confirmation, order.id, user_id)\n        return order\n\n    async def update_status(self, order_id: int, new_status: OrderStatus, admin: User):\n        order = self.db.query(Order).filter(Order.id == order_id).first()\n        if not order:\n            raise AppException(\"not_found\", \"Order not found\", 404)\n        order.status = new_status\n        self.db.commit()\n        return order",
  ]));

  children.push(h2("Major Project 2: Task Management System"));
  children.push(para("Build a full-featured task management system (similar to Trello or Jira) with real-time updates. This project combines everything you have learned: FastAPI fundamentals, Pydantic validation, SQLAlchemy database operations, JWT authentication with role-based access, WebSocket for real-time notifications, Redis for caching, and Docker for deployment. The system supports workspaces, projects, task boards with columns, task assignment and comments, file attachments, activity logging, and real-time collaboration through WebSocket."));
  children.push(h3("Core Features"));
  children.push(bullet("Workspace and project management with team membership and role assignment"));
  children.push(bullet("Kanban-style task boards with customizable columns and drag-and-drop reordering"));
  children.push(bullet("Task CRUD with priority levels, due dates, labels, and assignee management"));
  children.push(bullet("Real-time notifications via WebSocket when tasks are created, updated, or moved"));
  children.push(bullet("Comment threads on tasks with @mention support and email notifications"));
  children.push(bullet("Activity feed that tracks all changes within a project for audit purposes"));
  children.push(bullet("File attachment upload with size limits and allowed file type validation"));
  children.push(bullet("Search and filter tasks by assignee, priority, status, due date, and labels"));
  children.push(...codeMulti([
    "# taskmanager/app/main.py\nfrom fastapi import FastAPI\nfrom fastapi.middleware.cors import CORSMiddleware\nfrom app.core.config import settings\nfrom app.routers import auth, workspaces, projects, tasks, comments, websocket_router\n\napp = FastAPI(title=\"Task Manager API\", version=\"1.0.0\")\napp.add_middleware(CORSMiddleware, allow_origins=settings.CORS_ORIGINS, allow_credentials=True, allow_methods=[\"*\"], allow_headers=[\"*\"])\n\napp.include_router(auth.router, prefix=\"/api/auth\", tags=[\"Auth\"])\napp.include_router(workspaces.router, prefix=\"/api/workspaces\", tags=[\"Workspaces\"])\napp.include_router(projects.router, prefix=\"/api/projects\", tags=[\"Projects\"])\napp.include_router(tasks.router, prefix=\"/api/tasks\", tags=[\"Tasks\"])\napp.include_router(comments.router, prefix=\"/api/comments\", tags=[\"Comments\"])\napp.include_router(websocket_router.router, prefix=\"/ws\", tags=[\"WebSocket\"])",
  ]));
  children.push(h3("Real-time WebSocket Notification System"));
  children.push(para("The WebSocket notification system is the backbone of real-time collaboration. When a user connects, they subscribe to a workspace channel. Any task changes within that workspace are broadcast to all connected members. The system uses a pub/sub pattern with Redis as the message broker, enabling horizontal scaling across multiple API instances. Each WebSocket connection maintains a heartbeat to detect disconnections, and missed notifications are persisted in the database so users can catch up when they reconnect."));
  children.push(...codeMulti([
    "# taskmanager/app/routers/websocket_router.py\nfrom fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends\nfrom app.services.websocket_manager import manager\nfrom app.core.security import verify_token_ws\n\nrouter = APIRouter()\n\n@router.websocket(\"/workspace/{workspace_id}\")\nasync def workspace_ws(websocket: WebSocket, workspace_id: int, token: str):\n    user = await verify_token_ws(token)\n    if not user:\n        await websocket.close(code=4001, reason=\"Invalid token\")\n        return\n    await manager.connect(websocket, workspace_id, user.id)\n    try:\n        while True:\n            data = await websocket.receive_json()\n            # Handle client messages (e.g., typing indicators, heartbeats)\n            if data.get(\"type\") == \"heartbeat\":\n                await websocket.send_json({\"type\": \"heartbeat_ack\"})\n            elif data.get(\"type\") == \"typing\":\n                await manager.broadcast(workspace_id, {\n                    \"type\": \"typing\",\n                    \"user_id\": user.id,\n                    \"username\": user.username\n                }, exclude=user.id)\n    except WebSocketDisconnect:\n        await manager.disconnect(workspace_id, user.id)\n\n# Usage from task service after any task change:\n# await manager.broadcast(workspace_id, {\n#     \"type\": \"task_updated\",\n#     \"task_id\": task.id,\n#     \"changes\": {\"status\": \"done\"},\n#     \"updated_by\": user.username\n# })",
  ]));
  children.push(h3("Task Board with Column Management"));
  children.push(para("The task board model organizes tasks into columns (like To Do, In Progress, Done) that can be customized per project. Each column has an order index for drag-and-drop reordering. Tasks within a column also have an order index. Moving a task between columns updates its status and triggers a real-time notification. This model demonstrates complex database relationships, transactional operations (reordering requires updating multiple rows atomically), and real-time synchronization across multiple clients."));
  children.push(...codeMulti([
    "# taskmanager/app/models/board.py\nfrom sqlalchemy import Column, Integer, String, ForeignKey\nfrom sqlalchemy.orm import relationship\nfrom app.database import Base\n\nclass Board(Base):\n    __tablename__ = \"boards\"\n    id = Column(Integer, primary_key=True, index=True)\n    name = Column(String(100), nullable=False)\n    project_id = Column(Integer, ForeignKey(\"projects.id\"))\n    columns = relationship(\"Column\", back_populates=\"board\", order_by=\"Column.order\")\n\nclass Column(Base):\n    __tablename__ = \"columns\"\n    id = Column(Integer, primary_key=True, index=True)\n    name = Column(String(50), nullable=False)\n    order = Column(Integer, nullable=False)\n    board_id = Column(Integer, ForeignKey(\"boards.id\"))\n    board = relationship(\"Board\", back_populates=\"columns\")\n    tasks = relationship(\"Task\", back_populates=\"column\", order_by=\"Task.order\")\n\nclass Task(Base):\n    __tablename__ = \"tasks\"\n    id = Column(Integer, primary_key=True, index=True)\n    title = Column(String(200), nullable=False)\n    description = Column(String(5000))\n    priority = Column(String(10), default=\"medium\")\n    order = Column(Integer, nullable=False)\n    column_id = Column(Integer, ForeignKey(\"columns.id\"))\n    assignee_id = Column(Integer, ForeignKey(\"users.id\"), nullable=True)\n    column = relationship(\"Column\", back_populates=\"tasks\")\n    assignee = relationship(\"User\")\n    comments = relationship(\"Comment\", back_populates=\"task\")",
  ]));
  children.push(h3("Running the Major Projects"));
  children.push(para("Both major projects are designed to run with Docker Compose, which orchestrates the API server, PostgreSQL database, and Redis cache. To run either project, clone the repository, copy the .env.example file to .env and fill in your configuration values, then run docker-compose up --build. The API will be available at http://localhost:8000 with interactive documentation at http://localhost:8000/docs. Run the test suite with docker-compose exec api pytest -v. For production deployment, add Nginx or Traefik as a reverse proxy with SSL termination, and configure proper CORS origins, secret keys, and database credentials through environment variables."));
  children.push(...codeMulti([
    "# Quick start for any project:\ngit clone <repo-url>\ncd project-directory\ncp .env.example .env    # Edit with your values\ndocker-compose up --build\n\n# Run tests:\ndocker-compose exec api pytest -v\n\n# Apply database migrations:\ndocker-compose exec api alembic upgrade head\n\n# View logs:\ndocker-compose logs -f api\n\n# Stop everything:\ndocker-compose down -v   # -v removes volumes (deletes DB data)",
  ]));

  return children;
}

// ── Footer helper ──
function pageNumFooter() {
  return new Footer({
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: P.secondary, font: { ascii: "Calibri" } })]
    })]
  });
}

// ── Assemble Document ──
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" }, size: 24, color: P.body },
        paragraph: { spacing: { line: 312 } }
      },
      heading1: {
        run: { font: { ascii: "Times New Roman", eastAsia: "SimHei" }, size: 32, bold: true, color: P.primary }
      },
      heading2: {
        run: { font: { ascii: "Times New Roman", eastAsia: "SimHei" }, size: 28, bold: true, color: P.primary }
      },
      heading3: {
        run: { font: { ascii: "Times New Roman", eastAsia: "SimHei" }, size: 26, bold: true, color: P.accent }
      }
    }
  },
  sections: [
    // Section 1: Cover (no page numbers)
    {
      properties: {
        page: { size: pgSize, margin: { top: 0, bottom: 0, left: 0, right: 0 } }
      },
      children: buildCover()
    },
    // Section 2: Front matter (TOC) - Roman numerals
    {
      properties: {
        type: SectionType.NEXT_PAGE,
        page: {
          size: pgSize,
          margin: pgMargin,
          pageNumbers: { start: 1, formatType: NumberFormat.UPPER_ROMAN }
        }
      },
      footers: { default: pageNumFooter() },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 480, after: 360 },
          children: [new TextRun({ text: "Table of Contents", bold: true, size: 32, font: { ascii: "Times New Roman", eastAsia: "SimHei" }, color: P.primary })]
        }),
        new TableOfContents("Table of Contents", {
          hyperlink: true,
          headingStyleRange: "1-3"
        }),
        new Paragraph({
          spacing: { before: 200 },
          children: [new TextRun({
            text: "Note: This Table of Contents is generated via field codes. To ensure page number accuracy after editing, please right-click the TOC and select \"Update Field.\"",
            italics: true, size: 18, color: "888888"
          })]
        }),
        new Paragraph({ children: [new PageBreak()] })
      ]
    },
    // Section 3: Body - Arabic numerals starting from 1
    {
      properties: {
        type: SectionType.NEXT_PAGE,
        page: {
          size: pgSize,
          margin: pgMargin,
          pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL }
        }
      },
      footers: { default: pageNumFooter() },
      children: buildBody()
    }
  ]
});

// ── Generate ──
Packer.toBuffer(doc).then(buffer => {
  const outPath = "/home/z/my-project/download/FastAPI_Mastery_Zero_to_Production_Ready.docx";
  fs.writeFileSync(outPath, buffer);
  console.log("Document generated: " + outPath);
}).catch(err => {
  console.error("Generation error:", err);
  process.exit(1);
});
