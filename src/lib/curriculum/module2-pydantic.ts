import { Module } from './types';

export const module2Pydantic: Module = {
  id: 'module-2-pydantic',
  title: 'Pydantic V2 Deep Dive',
  icon: '🛡️',
  description:
    'Master Pydantic V2 — the validation engine that powers FastAPI. From BaseModel fundamentals to Rust-powered performance, custom validators, serialization mastery, and schema generation, this module transforms you into a Pydantic expert who can design bulletproof data models for any application.',
  topics: [
    // ──────────────────────────────────────────────
    // TOPIC 1: Pydantic V2 — What, Why & Architecture
    // ──────────────────────────────────────────────
    {
      id: 'm2-pydantic-overview',
      title: 'Pydantic V2: What, Why & Architecture',
      icon: '🛡️',
      introduction:
        'Pydantic V2 is the most popular data validation library for Python, and the validation engine that makes FastAPI possible. Version 2 is a ground-up rewrite with a Rust core that delivers 5-50x performance improvements over V1 while maintaining the elegant API you love. Understanding its architecture is essential for building robust, high-performance FastAPI applications.',
      sections: [
        {
          heading: 'What is Pydantic and Why Does It Exist?',
          content: `Pydantic is a data validation and settings management library that uses Python type annotations to enforce runtime type checking and data parsing. It was created by Samuel Colvin in 2018 to solve a fundamental problem in Python: type hints are purely decorative at runtime. A function annotated as \`def process(age: int)\` will happily accept \`process("hello")\` — the type hint is documentation, not enforcement.

Pydantic bridges this gap. When you define a model class inheriting from \`BaseModel\`, Pydantic generates a constructor that parses, validates, and coerces input data according to your type annotations. Pass \`"25"\` where an \`int\` is expected, and Pydantic will coerce it to \`25\`. Pass \`"not_a_number"\` and you get a detailed \`ValidationError\` telling you exactly what went wrong and where.

This is transformative for API development. Instead of writing manual validation code (if/else chains checking types, ranges, and formats), you declare your data shape with type annotations and Pydantic handles everything. In the FastAPI context, Pydantic validates every incoming request before your code runs, and serializes every outgoing response. It is the invisible backbone that makes the "type hints drive everything" paradigm work. Without Pydantic, FastAPI would just be Starlette with manual validation — a much less compelling proposition.`,
          visualization: {
            type: 'comparison',
            title: 'Python Without Pydantic vs With Pydantic',
            description: 'How Pydantic transforms type hints from decorative annotations into runtime enforcement',
            columns: [
              {
                title: 'Without Pydantic',
                items: [
                  'Type hints are ignored at runtime',
                  'Manual if/else validation chains',
                  'Silent data corruption (wrong types pass through)',
                  'No automatic error messages',
                  'Manual serialization to JSON',
                  'Types drift from runtime behavior',
                ],
              },
              {
                title: 'With Pydantic',
                items: [
                  'Type hints are enforced at runtime',
                  'Declarative validation via annotations',
                  'Automatic coercion ("25" → 25)',
                  'Detailed ValidationError with locations',
                  'Automatic model_dump() / model_dump_json()',
                  'Types and runtime are always in sync',
                ],
              },
            ],
          },
          tips: [
            'Pydantic is not just for FastAPI — it is used anywhere you need to validate external data: CLI tools, config files, API clients, ETL pipelines.',
            'The name "Pydantic" comes from "pedantic" — it is strict and meticulous about data types, which is exactly what you want for validation.',
            'Pydantic validates at the boundary (when data enters your system), so your internal code can trust the types completely.',
          ],
          keyTakeaway:
            'Pydantic makes Python type hints enforceable at runtime — validate at the boundary, trust types everywhere else.',
        
          realWorldAnalogy: `Pydantic is like a bouncer at a club who checks every guest's ID at the door. Without the bouncer, anyone could walk in — minors, people with fake IDs, or people who don't belong. With Pydantic, every piece of data is checked at the boundary before it enters your system, so your business logic can trust it completely.`,
          commonMistake: [
            {
              mistake: `Using isinstance() checks instead of Pydantic for validation`,
              fix: `Pydantic provides detailed error messages, coercion, and nested validation. isinstance() only checks the top-level type with no error details.`,
            },
            {
              mistake: `Validating data in multiple places throughout the codebase`,
              fix: `Validate once at the boundary (API endpoint) with Pydantic, then trust the types everywhere else. This is the "parse, don't validate" principle.`,
            },
          ],
          interviewQuestions: [
            {
              question: `What does "validate at the boundary" mean?`,
              answer: `Validate data once when it enters your system (API endpoint, config loading), then trust the types throughout your code. This eliminates redundant validation and makes internal code simpler.`,
            },
            {
              question: `Why is Pydantic better than manual if/else validation?`,
              answer: `Pydantic provides automatic coercion, detailed error messages, JSON Schema generation, and nesting — all from type annotations. Manual validation is repetitive, error-prone, and doesn't generate documentation.`,
            },
          ],
          proTips: [
            `Use Pydantic for any data boundary: API requests, config files, CLI arguments, database rows. If data comes from outside your code, validate it with Pydantic.`,
            `The "parse, don't validate" principle means your internal functions should never check types — they should trust that the data was validated at the boundary.`,
          ],},
        {
          heading: 'The Rust Revolution: Pydantic V2 Core Architecture',
          content: `The single most significant change in Pydantic V2 is the rewrite of its core validation engine in Rust. In V1, all validation logic was pure Python — iterating over fields, checking types, coercing values, collecting errors. This worked but was slow for large models or high-throughput APIs. Pydantic V2 moves the hot path into Rust, compiled to a native Python extension via PyO3.

The architecture is layered: the \`pydantic-core\` crate (written in Rust) handles all validation, serialization, and schema building at native speed. The \`pydantic\` Python package provides the friendly API you interact with — \`BaseModel\`, \`Field()\`, validators, etc. When you create a model, Pydantic generates a Rust-based "schema" that describes the validation rules, and this schema is executed by the Rust engine at validation time. The result is 5-50x faster validation compared to V1, with the most dramatic improvements on large, nested models.

The Rust core also brings improvements beyond speed: more consistent error messages, better handling of edge cases (like recursive models), and a more robust type system for the internal schema representation. The Python layer remains the same friendly API — you never write Rust, you never interact with \`pydantic-core\` directly. But every time you call \`Model(data)\`, the Rust engine is what actually validates your data.`,
          visualization: {
            type: 'architecture',
            title: 'Pydantic V2 Layer Architecture',
            description: 'How the Python API layer sits on top of the Rust validation core',
            layers: [
              { label: 'Your Code', items: ['BaseModel subclasses', 'Field() constraints', 'Custom validators', 'model_dump() / model_validate()'] },
              { label: 'Pydantic Python API', items: ['Model construction', 'Validator registration', 'Error formatting', 'JSON Schema generation'] },
              { label: 'pydantic-core (Rust)', items: ['Schema building', 'Type validation', 'Coercion engine', 'Serialization core'] },
              { label: 'PyO3 Bridge', items: ['Python ↔ Rust interop', 'Zero-copy data transfer', 'Error type conversion'] },
            ],
          },
          codeExamples: [
            {
              title: 'Pydantic V2 Performance in Action',
              description: 'See the raw speed difference between V1 and V2 on the same model',
              code: `# pip install pydantic==2.9.0
from pydantic import BaseModel
from typing import List
import time

class Item(BaseModel):
    name: str
    price: float
    quantity: int
    tags: List[str] = []

# V2 benchmark: validating 100,000 items
data = {"name": "Widget", "price": "9.99", "quantity": "5", "tags": ["sale", "new"]}

start = time.perf_counter()
for _ in range(100_000):
    Item(**data)
elapsed = time.perf_counter() - start

print(f"V2: {elapsed:.3f}s for 100,000 validations")
print(f"Throughput: {100_000 / elapsed:,.0f} validations/sec")

# Typical results:
# V1: ~2.8s  (~36,000 validations/sec)
# V2: ~0.12s (~833,000 validations/sec)
# → ~23x faster!`,
              language: 'python',
              output: `V2: 0.120s for 100,000 validations
Throughput: 833,333 validations/sec`,
            },
            {
              title: 'Pydantic V2 Error Messages',
              description: 'V2 produces structured, detailed validation errors with exact locations',
              code: `from pydantic import BaseModel, ValidationError

class User(BaseModel):
    name: str
    age: int
    email: str

# Trigger multiple validation errors
try:
    User(name=123, age="not_a_number", email=None)
except ValidationError as e:
    print(e.error_count())  # Number of errors
    for error in e.errors():
        print(f"  Location: {error['loc']}")
        print(f"  Type:     {error['type']}")
        print(f"  Message:  {error['msg']}")
        print(f"  Input:    {error['input']!r}")
        print()`,
              language: 'python',
              output: `3
  Location: ('name',)
  Type:     str_type
  Message:  Input should be a valid string
  Input:    123

  Location: ('age',)
  Type:     int_parsing
  Message:  Input should be a valid integer, unable to parse string as an integer
  Input:    'not_a_number'

  Location: ('email',)
  Type:     missing
  Message:  Field required
  Input:    None`,
            },
          ],
          tips: [
            'You never need to install pydantic-core separately — it is a dependency of pydantic and is installed automatically.',
            'The 5-50x speedup depends on model complexity: simple models see ~5x improvement, deeply nested models with many fields see ~50x.',
            'V2 error messages use a different format than V1 — they include type, loc, msg, and input fields for programmatic error handling.',
          ],
          keyTakeaway:
            'Pydantic V2\'
          realWorldAnalogy: `Pydantic V2's Rust core is like replacing a bicycle courier (Python validation) with a high-speed train (Rust validation). The destination is the same — validated data — but the train gets there 5-50x faster. You still buy the same ticket (use the same Python API), but the journey is dramatically quicker.`,
          commonMistake: [
            {
              mistake: `Trying to use Pydantic V1 API methods in V2`,
              fix: `V2 renamed methods: .dict() → .model_dump(), .parse_obj() → .model_validate(), .schema() → .model_json_schema(). Use the V2 API.`,
            },
            {
              mistake: `Thinking you need to learn Rust to use Pydantic V2`,
              fix: `You never write or read Rust. The Python API is the same or better. The Rust engine is an invisible performance boost.`,
            },
          ],
          interviewQuestions: [
            {
              question: `How much faster is Pydantic V2 than V1?`,
              answer: `5-50x faster depending on model complexity. Simple models see ~5x improvement, deeply nested models with many fields see ~50x.`,
            },
            {
              question: `What is pydantic-core and why is it written in Rust?`,
              answer: `pydantic-core is the validation engine compiled as a native Python extension via PyO3. Rust provides memory safety, zero-cost abstractions, and performance close to C.`,
            },
          ],
          proTips: [
            `Use model_validate_json() instead of json.loads() + model_validate(). The Rust engine handles both parsing and validation in a single optimized pass.`,
            `The V2 migration guide at docs.pydantic.dev/latest/migration/ covers every API change. Most projects migrate in under an hour.`,
          ],s Rust core makes validation 5-50x faster — you write the same Python API, but the execution is native-speed.',
        },
        {
          heading: 'The Pydantic V2 Validation Pipeline',
          content: `Understanding the validation pipeline is crucial for debugging and designing effective models. When you instantiate a Pydantic model — \`User(name="Alice", age=30)\` — a precise sequence of steps occurs internally. Each step has specific semantics and understanding them lets you predict exactly what happens to your data.

The pipeline begins with **input parsing**: Pydantic reads the keyword arguments and matches them to model fields. Fields not provided are checked for defaults or marked as missing. Next comes **type coercion and validation**: for each field, Pydantic attempts to convert the input to the declared type. Strings like \`"30"\` are coerced to \`int\` where possible. If coercion fails, a \`ValidationError\` is raised. Then **field validators** run — any \`@field_validator\` decorators you have defined execute in their configured mode (before, after, or wrap). After that, **model validators** execute — \`@model_validator\` functions that can validate the entire model at once, enabling cross-field checks. Finally, the model instance is constructed with all validated data.

This pipeline is deterministic and well-defined. The order matters: field validators before model validators, "before" mode before type coercion, "after" mode after type coercion. When you understand this order, you can place your custom validation logic exactly where it needs to be.`,
          visualization: {
            type: 'flow',
            title: 'Pydantic V2 Validation Pipeline',
            description: 'The exact sequence of steps when a model is instantiated',
            steps: [
              { label: 'Raw input received', detail: 'Keyword arguments passed to model constructor', highlight: false },
              { label: 'Field matching', detail: 'Match kwargs to declared fields, identify missing fields', highlight: false },
              { label: 'Default values applied', detail: 'Missing fields with defaults get their values', highlight: false },
              { label: '@field_validator(mode="before")', detail: 'Pre-coercion field validators run (raw input)', highlight: true },
              { label: 'Type coercion & validation', detail: 'Rust core coerces types: "30" → 30, validates constraints', highlight: true },
              { label: '@field_validator(mode="after")', detail: 'Post-coercion field validators run (typed values)', highlight: true },
              { label: '@model_validator(mode="before")', detail: 'Whole-model pre-validation (all fields available)', highlight: true },
              { label: '@model_validator(mode="after")', detail: 'Whole-model post-validation (fully typed model)', highlight: true },
              { label: 'Model instance created', detail: 'Validated, typed model object returned to caller', highlight: false },
            ],
          },
          codeExamples: [
            {
              title: 'Tracing the Validation Pipeline',
              description: 'Observe the exact order of validation steps',
              code: `from pydantic import BaseModel, field_validator, model_validator

class UserProfile(BaseModel):
    username: str
    age: int
    role: str = "viewer"

    @field_validator("username", mode="before")
    @classmethod
    def strip_username(cls, v):
        print(f"  [before] username validator: {v!r}")
        return v.strip() if isinstance(v, str) else v

    @field_validator("age", mode="after")
    @classmethod
    def check_age(cls, v):
        print(f"  [after] age validator: {v!r}")
        if v < 0 or v > 150:
            raise ValueError("Age must be between 0 and 150")
        return v

    @model_validator(mode="after")
    def check_model(self):
        print(f"  [model] All fields validated: username={self.username!r}, age={self.age!r}, role={self.role!r}")
        if self.role == "admin" and self.age < 18:
            raise ValueError("Admins must be at least 18")
        return self

print("Creating UserProfile:")
user = UserProfile(username="  alice  ", age="25")
print(f"Result: {user}")`,
              language: 'python',
              output: `Creating UserProfile:
  [before] username validator: '  alice  '
  [after] age validator: 25
  [model] All fields validated: username='alice', age=25, role='viewer'
Result: username='alice' age=25 role='viewer'`,
            },
          ],
          tips: [
            'The validation pipeline runs in a fixed order — understanding it prevents surprising behavior with custom validators.',
            'Use mode="before" validators to preprocess raw input (strip whitespace, normalize formats) before type coercion.',
            'Use mode="after" validators to check constraints on already-typed values (range checks, business rules).',
          ],
          keyTakeaway:
            'The validation pipeline is: field matching → defaults → before validators → type coercion → after validators → model validators → instance.',
        
          realWorldAnalogy: `The validation pipeline is like an assembly line in a factory. Raw materials enter (input data), pass through quality checkpoints (before validators), get shaped by machines (type coercion), pass through final inspections (after validators), and receive an overall quality stamp (model validators) before leaving as a finished product (model instance).`,
          commonMistake: [
            {
              mistake: `Putting validation that needs typed values in mode="before" validators`,
              fix: `Use mode="before" only for preprocessing raw input (strip whitespace, normalize formats). Use mode="after" for checks on already-typed values.`,
            },
            {
              mistake: `Forgetting @classmethod on field_validator decorators`,
              fix: `Pydantic V2 requires @classmethod on field_validator methods. Omitting it causes a confusing TypeError.`,
            },
          ],
          interviewQuestions: [
            {
              question: `What is the order of the Pydantic V2 validation pipeline?`,
              answer: `Field matching → defaults → before validators → type coercion → after validators → model validators → instance creation.`,
            },
            {
              question: `When would you use mode="before" vs mode="after" on a field_validator?`,
              answer: `Use mode="before" to preprocess raw input before type coercion (e.g., strip whitespace). Use mode="after" to validate the already-coerced typed value (e.g., check age range).`,
            },
          ],
          proTips: [
            `Use model_validator(mode="after") for cross-field validation like "if role is admin, age must be 18+". It runs after all field validators and has access to the full typed model.`,
            `Print statements in validators show the pipeline order during development — remove them before production.`,
          ],},
      ],
      frontendIntegration: {
        title: `Sending Validated Data from a Form to FastAPI`,
        vanillaHtml: {
          title: `Form Submission with Pydantic Validation`,
          description: `HTML form that sends data to a Pydantic-validated FastAPI endpoint`,
          code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Pydantic Validation Demo</title>
  <style>
    body { font-family: system-ui; max-width: 600px; margin: 2rem auto; }
    .error { color: #dc2626; background: #fef2f2; padding: 0.5rem; border-radius: 6px; margin: 0.5rem 0; }
    .success { color: #059669; background: #f0fdf4; padding: 0.5rem; border-radius: 6px; margin: 0.5rem 0; }
    input { padding: 0.4rem; border: 1px solid #cbd5e1; border-radius: 4px; margin: 0.25rem 0; width: 100%; }
    button { background: #0d9488; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; margin-top: 0.5rem; }
  </style>
</head>
<body>
  <h1>Create User</h1>
  <form id="userForm">
    <input id="name" placeholder="Full Name" required>
    <input id="email" type="email" placeholder="Email" required>
    <input id="age" type="number" placeholder="Age (13-120)" min="13" max="120">
    <button type="submit">Create User</button>
  </form>
  <div id="result"></div>
  <script>
    document.getElementById("userForm").onsubmit = async (e) => {
      e.preventDefault();
      const body = { name: document.getElementById("name").value, email: document.getElementById("email").value, age: parseInt(document.getElementById("age").value) };
      const res = await fetch("http://localhost:8000/users", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body) });
      const resultDiv = document.getElementById("result");
      if (res.ok) { const data = await res.json(); resultDiv.innerHTML = '<div class="success">User created: ' + data.name + '</div>'; }
      else { const err = await res.json(); resultDiv.innerHTML = '<div class="error"><strong>Validation Errors:</strong><br>' + err.detail.map(e => e.loc.join(".") + ": " + e.msg).join("<br>") + '</div>'; }
    };
  </script>
</body>
</html>`,
          language: `html`,
          whatHappened: [
            `The form sends a JSON body to POST /users`,
            `Pydantic validates each field automatically`,
            `Validation errors show the exact field location and message`,
          ],
          tryToBreak: [
            `Set age to 5 — Pydantic rejects it (must be >= 13)`,
            `Enter invalid email — validation error for email format`,
          ],
        },
        corsNote: `POST requests with JSON need CORS configured on your FastAPI app.`,
      },
    },

    // ──────────────────────────────────────────────
    // TOPIC 2: BaseModel — The Foundation
    // ──────────────────────────────────────────────
    {
      id: 'm2-basemodel',
      title: 'BaseModel: The Foundation',
      icon: '🏗️',
      introduction:
        'BaseModel is the cornerstone of Pydantic — every data model you create inherits from it. It provides construction, validation, serialization, schema generation, and a rich set of utility methods. Mastering BaseModel is the single most important step in becoming proficient with Pydantic.',
      sections: [
        {
          heading: 'Creating Your First Pydantic Models',
          content: `A Pydantic model is a class that inherits from \`BaseModel\` and defines fields using type annotations. Unlike regular Python classes, the type annotations are not just hints — they are enforced at runtime. When you create an instance, Pydantic validates every field against its type, coerces compatible values, and raises \`ValidationError\` for incompatible data.

The simplest model has just a few typed fields. Each field can have a default value (making it optional) or be required (no default). Fields without defaults MUST be provided when creating an instance. Fields with defaults can be omitted. This mirrors function parameter behavior in Python, making it intuitive to learn.

What makes BaseModel special versus a regular dataclass or NamedTuple is the validation layer. A dataclass will accept any value for any field — \`dataclass(age="hello")\` works fine. A BaseModel will reject it immediately with a clear error. This is the core value proposition: your data is guaranteed to conform to your declared types, every single time. In a FastAPI context, this means every request body, every response, every configuration value is validated before your business logic sees it.`,
          codeExamples: [
            {
              title: 'Basic Model Definition and Usage',
              description: 'Creating and using a simple Pydantic model with required and optional fields',
              code: `from pydantic import BaseModel
from typing import Optional

class Product(BaseModel):
    name: str                    # Required field
    price: float                 # Required field
    description: Optional[str] = None  # Optional with None default
    in_stock: bool = True        # Optional with non-None default
    quantity: int = 0            # Optional with non-None default

# Valid construction — all required fields provided
product = Product(name="Widget", price=9.99)
print(product)
# name='Widget' price=9.99 description=None in_stock=True quantity=0

# With all fields specified
full_product = Product(
    name="Gadget",
    price=24.99,
    description="A fancy gadget",
    in_stock=False,
    quantity=100
)
print(full_product)
# name='Gadget' price=24.99 description='A fancy gadget' in_stock=False quantity=100`,
              language: 'python',
            },
            {
              title: 'Automatic Type Coercion',
              description: 'Pydantic coerces compatible types — strings to numbers, numbers to strings, etc.',
              code: `from pydantic import BaseModel, ValidationError

class User(BaseModel):
    name: str
    age: int
    active: bool
    score: float

# Pydantic coerces compatible types automatically
user = User(name="Alice", age="30", active="yes", score="95.5")
print(user)
# name='Alice' age=30 active=True score=95.5
# "30" → 30 (str to int)
# "yes" → True (truthy string to bool)
# "95.5" → 95.5 (str to float)

# But incompatible data raises ValidationError
try:
    User(name="Bob", age="not_a_number", active=True, score=9.0)
except ValidationError as e:
    print(e.error_count())   # 1
    print(e.errors()[0]['msg'])
    # Input should be a valid integer, unable to parse string as an integer

# None is NOT coerced — it fails for required non-Optional fields
try:
    User(name=None, age=25, active=True, score=9.0)
except ValidationError as e:
    print(e.errors()[0]['type'])
    # str_type`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'flow',
            title: 'BaseModel Instance Creation Flow',
            description: 'What happens when you call Model(field1=val1, field2=val2)',
            steps: [
              { label: 'Keyword arguments received', detail: 'Model(name="Widget", price=9.99)', highlight: false },
              { label: 'Match args to field names', detail: 'name → str, price → float', highlight: false },
              { label: 'Check for missing required fields', detail: 'Fields without defaults must be present', highlight: true },
              { label: 'Apply defaults for omitted fields', detail: 'Optional fields get None or declared default', highlight: false },
              { label: 'Type coercion & validation', detail: '"9.99" → 9.99, check types match', highlight: true },
              { label: 'Run custom validators', detail: 'Field and model validators execute', highlight: false },
              { label: 'Return validated model instance', detail: 'All fields guaranteed to match types', highlight: true },
            ],
          },
          tips: [
            'Use Optional[str] = None (or str | None = None in Python 3.10+) for fields that can be missing or None.',
            'Pydantic coerces "truthy" strings to True for bool fields: "yes", "on", "true", "1" all become True.',
            'Required fields without defaults MUST be provided — this is the most common source of ValidationError for beginners.',
          ],
          keyTakeaway:
            'BaseModel enforces your type annotations at runtime — fields are validated, coerced, and guaranteed to match declared types.',
        
          realWorldAnalogy: `A Pydantic model is like a form template at a government office. Each field has a specific format (type), some are required (name, address) and some are optional with defaults (middle name = None). If you fill in the wrong type — writing "abc" in the date field — the clerk rejects the form immediately with a clear explanation of what's wrong.`,
          commonMistake: [
            {
              mistake: `Using Optional[type] without a default value`,
              fix: `Optional[str] means "str or None" but the field is still REQUIRED without a default. Use Optional[str] = None or str | None = None to make it truly optional.`,
            },
            {
              mistake: `Expecting Pydantic to validate nested dicts without defining nested models`,
              fix: `Define a separate BaseModel for each nested structure and use it as the field type. Pydantic validates recursively through nested models.`,
            },
          ],
          interviewQuestions: [
            {
              question: `What is the difference between Optional[str] and Optional[str] = None?`,
              answer: `Optional[str] means the field accepts str or None, but it's still REQUIRED (no default). Optional[str] = None makes it truly optional with None as default.`,
            },
            {
              question: `How does Pydantic handle type coercion?`,
              answer: `Pydantic coerces compatible types automatically: "30" → 30 (str to int), "yes" → True (truthy string to bool), "9.99" → 9.99 (str to float). Incompatible values raise ValidationError.`,
            },
          ],
          proTips: [
            `In Python 3.10+, use str | None = None instead of Optional[str] = None. It's cleaner and more modern.`,
            `Use model_config = ConfigDict(strict=True) to disable coercion and enforce exact types. This is useful for security-sensitive APIs where "30" should NOT become 30.`,
          ],},
        {
          heading: 'model_validate: Parsing from Dicts, JSON & More',
          content: `While the constructor syntax \`Model(field=value)\` is great for hand-written code, real applications often need to parse data from external sources — JSON strings, dictionaries, ORM objects, or raw bytes. Pydantic provides \`model_validate()\` as the universal entry point for parsing data from any format into a validated model instance.

\`model_validate()\` is the V2 replacement for V1's \`parse_obj()\` and \`parse_raw()\`. It accepts a dictionary or similar mapping and returns a validated model instance. For JSON strings, use \`model_validate_json()\` which parses JSON and validates in a single optimized pass through the Rust core — this is significantly faster than \`json.loads()\` followed by \`model_validate()\` because the Rust engine handles both steps natively.

The power of \`model_validate()\` lies in its flexibility combined with strictness. It will attempt to parse whatever you give it, but it will never silently accept invalid data. Every field is validated, every constraint is checked, and any problem results in a detailed \`ValidationError\`. This makes it perfect for API request bodies (FastAPI uses it internally), configuration file parsing, and any boundary where external data enters your system.`,
          codeExamples: [
            {
              title: 'model_validate and model_validate_json',
              description: 'Parsing data from dictionaries and JSON strings',
              code: `from pydantic import BaseModel, ValidationError
import json

class Book(BaseModel):
    title: str
    author: str
    pages: int
    published: int

# From a dictionary
data = {"title": "1984", "author": "George Orwell", "pages": "328", "published": 1949}
book = Book.model_validate(data)
print(book)
# title='1984' author='George Orwell' pages=328 published=1949

# From a JSON string (optimized — Rust handles parsing + validation)
json_str = '{"title": "Dune", "author": "Frank Herbert", "pages": 412, "published": 1965}'
book2 = Book.model_validate_json(json_str)
print(book2)
# title='Dune' author='Frank Herbert' pages=412 published=1965

# Invalid data → ValidationError
try:
    Book.model_validate({"title": "Bad Book"})  # Missing required fields
except ValidationError as e:
    for err in e.errors():
        print(f"Missing: {err['loc'][0]}")
# Missing: author
# Missing: pages
# Missing: published`,
              language: 'python',
            },
            {
              title: 'V1 → V2 API Migration Cheatsheet',
              description: 'How the V1 API maps to V2 equivalents',
              code: `# ── V1 → V2 Method Mapping ──────────────────────────
# V1 Method                 → V2 Method
# ──────────────────────────────────────────────────
# Model.parse_obj(data)     → Model.model_validate(data)
# Model.parse_raw(json_str) → Model.model_validate_json(json_str)
# Model.parse_file(path)    → Model.model_validate_json(path.read_text())
# Model.schema()            → Model.model_json_schema()
# Model.dict()              → Model.model_dump()
# Model.json()              → Model.model_dump_json()
# Model.construct(**data)   → Model.model_construct(**data)
# validator()               → field_validator()
# root_validator()          → model_validator()
# class Config              → model_config = ConfigDict(...)

# ── Practical example of V2 API ──────────────────
from pydantic import BaseModel, ConfigDict

class Item(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)  # Replaces class Config

    name: str
    price: float

# model_validate replaces parse_obj
item = Item.model_validate({"name": "Widget", "price": "9.99"})
print(item.model_dump())         # Replaces .dict()
# {'name': 'Widget', 'price': 9.99}

print(item.model_dump_json())    # Replaces .json()
# '{"name":"Widget","price":9.99}'

print(Item.model_json_schema())  # Replaces .schema()
# {'properties': {'name': {...}, 'price': {...}}, 'required': [...], ...}`,
              language: 'python',
            },
          ],
          tips: [
            'Always use model_validate_json() for JSON strings — it is 2-3x faster than json.loads() + model_validate() because Rust handles both steps.',
            'model_construct() creates a model WITHOUT validation — use it only when you are certain the data is already valid (e.g., loading from a trusted database).',
            'FastAPI calls model_validate() internally when it processes request bodies — you rarely call it yourself in FastAPI code.',
          ],
          keyTakeaway:
            'model_validate() is the universal parser — use it for dicts, model_validate_json() for JSON strings. Both guarantee validated output.',
        
          realWorldAnalogy: `model_validate is like a universal adapter for foreign plugs. No matter what format your data comes in (dict, JSON string, ORM object), the adapter converts it to the same validated model instance. You don't need separate code for each format — one method handles all of them.`,
          commonMistake: [
            {
              mistake: `Using json.loads() then model_validate() instead of model_validate_json()`,
              fix: `model_validate_json() is 2-3x faster because the Rust engine handles both JSON parsing and validation in a single pass.`,
            },
            {
              mistake: `Using model_construct() when you need validation`,
              fix: `model_construct() skips validation entirely. Only use it when data is already trusted (e.g., from your own database). For any external data, use model_validate().`,
            },
          ],
          interviewQuestions: [
            {
              question: `When should you use model_construct() instead of model_validate()?`,
              answer: `Use model_construct() only for trusted data that doesn't need validation, like loading from your own database. It skips all validation for maximum speed.`,
            },
            {
              question: `What is the V1 to V2 method mapping for parsing?`,
              answer: `parse_obj → model_validate, parse_raw → model_validate_json, dict → model_dump, schema → model_json_schema, json → model_dump_json.`,
            },
          ],
          proTips: [
            `FastAPI calls model_validate() internally when processing request bodies — you rarely call it yourself in endpoint code.`,
            `model_validate_json() is one of the biggest performance wins in V2. Use it whenever you have a raw JSON string.`,
          ],},
        {
          heading: 'model_dump: Serialization & Export',
          content: `After validation, you often need to convert your model back to a dictionary or JSON string for API responses, database storage, or logging. Pydantic V2 provides \`model_dump()\` and \`model_dump_json()\` as the primary serialization methods, replacing V1's \`.dict()\` and \`.json()\`.

\`model_dump()\` returns a Python dictionary with all field values. \`model_dump_json()\` returns a JSON string, and it is significantly faster than \`json.dumps(model_dump())\` because the Rust core handles serialization natively. Both methods accept powerful filtering options: \`exclude\` and \`include\` to select specific fields, \`exclude_unset\` to omit fields that were not explicitly set, \`exclude_defaults\` to omit fields with default values, \`exclude_none\` to omit None fields, and \`by_alias\` to use field aliases instead of field names.

These options make model_dump incredibly flexible. For a PATCH endpoint, you can use \`model_dump(exclude_unset=True)\` to get only the fields the client actually sent. For a public API response, you can use \`model_dump(exclude={"internal_id", "secret"})\` to strip sensitive fields. For a compact representation, \`model_dump(exclude_defaults=True, exclude_none=True)\` gives you the minimal dictionary.`,
          codeExamples: [
            {
              title: 'model_dump with All Options',
              description: 'Master every model_dump variation for different use cases',
              code: `from pydantic import BaseModel, Field
from typing import Optional

class User(BaseModel):
    id: int
    name: str
    email: str
    role: str = "viewer"
    bio: Optional[str] = None
    internal_notes: Optional[str] = None

# Create a user — only set some fields explicitly
user = User(id=1, name="Alice", email="alice@example.com")

# Full dump — all fields included
print(user.model_dump())
# {'id': 1, 'name': 'Alice', 'email': 'alice@example.com',
#  'role': 'viewer', 'bio': None, 'internal_notes': None}

# Exclude unset — only fields explicitly provided
print(user.model_dump(exclude_unset=True))
# {'id': 1, 'name': 'Alice', 'email': 'alice@example.com'}

# Exclude defaults — omit fields with default values
print(user.model_dump(exclude_defaults=True))
# {'id': 1, 'name': 'Alice', 'email': 'alice@example.com'}

# Exclude None — omit None fields
print(user.model_dump(exclude_none=True))
# {'id': 1, 'name': 'Alice', 'email': 'alice@example.com', 'role': 'viewer'}

# Exclude specific fields (e.g., sensitive data)
print(user.model_dump(exclude={"internal_notes"}))
# {'id': 1, 'name': 'Alice', 'email': 'alice@example.com', 'role': 'viewer', 'bio': None}

# JSON dump — fast Rust-based serialization
print(user.model_dump_json(exclude={"internal_notes"}))
# '{"id":1,"name":"Alice","email":"alice@example.com","role":"viewer","bio":null}'`,
              language: 'python',
            },
            {
              title: 'Practical Serialization Patterns',
              description: 'Real-world patterns for different serialization needs',
              code: `from pydantic import BaseModel, Field
from typing import Optional

class Article(BaseModel):
    title: str
    content: str
    author_id: int
    views: int = 0
    published: bool = False
    tags: list[str] = []

article = Article(
    title="Pydantic V2 Guide",
    content="Deep dive into Pydantic...",
    author_id=42,
    tags=["python", "pydantic"]
)

# 1. API response — exclude internal fields
api_response = article.model_dump(exclude={"author_id"})
# {'title': '...', 'content': '...', 'views': 0, 'published': False, 'tags': [...]}

# 2. PATCH update payload — only explicitly set fields
# (Useful when creating update payloads that shouldn't overwrite defaults)
patch_data = article.model_dump(exclude_unset=True, exclude_defaults=True)
# {'title': '...', 'content': '...', 'author_id': 42, 'tags': [...]}

# 3. Compact storage — strip defaults and None
compact = article.model_dump(exclude_defaults=True, exclude_none=True)
# {'title': '...', 'content': '...', 'author_id': 42, 'tags': [...]}

# 4. Nested include/exclude (for models with nested models)
# article.model_dump(include={"title": True, "tags": True})
# {'title': 'Pydantic V2 Guide', 'tags': ['python', 'pydantic']}`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'comparison',
            title: 'model_dump Options at a Glance',
            description: 'What each serialization option excludes',
            columns: [
              {
                title: 'Option',
                items: ['(no options)', 'exclude_unset', 'exclude_defaults', 'exclude_none', 'exclude={fields}', 'by_alias'],
              },
              {
                title: 'Excludes',
                items: ['Nothing — all fields', 'Fields not explicitly set', 'Fields with default values', 'Fields with None value', 'Specific named fields', 'Nothing — uses aliases'],
              },
              {
                title: 'Use Case',
                items: ['Full serialization', 'PATCH payloads', 'Minimal representation', 'Clean API responses', 'Hide sensitive fields', 'API with naming conventions'],
              },
            ],
          },
          tips: [
            'exclude_unset=True is essential for PATCH endpoints — it gives you only the fields the client actually sent.',
            'model_dump_json() is 2-5x faster than json.dumps(model_dump()) because Rust handles serialization natively.',
            'You can combine options: model_dump(exclude_unset=True, exclude_none=True) gives you the most compact representation.',
          ],
          keyTakeaway:
            'model_dump() with exclude/include/exclude_unset/exclude_defaults/exclude_none gives you surgical control over serialization.',
        
          realWorldAnalogy: `model_dump is like a photocopy machine with filters. By default, it copies everything. But you can apply filters: "only copy what I wrote" (exclude_unset), "skip the blank pages" (exclude_defaults), "remove the blank pages" (exclude_none), or "black out sensitive sections" (exclude={"password"}).`,
          commonMistake: [
            {
              mistake: `Using .dict() which is deprecated in V2`,
              fix: `Use .model_dump() instead. .dict() still works but is deprecated and will be removed in a future version.`,
            },
            {
              mistake: `Not using exclude_unset=True for PATCH endpoint payloads`,
              fix: `exclude_unset=True is essential for PATCH — it returns only the fields the client actually sent, not fields that defaulted to None.`,
            },
          ],
          interviewQuestions: [
            {
              question: `What is the difference between exclude_unset and exclude_defaults?`,
              answer: `exclude_unset omits fields not explicitly provided by the caller (even if they have non-None defaults). exclude_defaults omits fields that equal their default values.`,
            },
            {
              question: `How do you exclude specific fields from serialization?`,
              answer: `Use model_dump(exclude={"password", "secret"}) to omit specific fields, or model_dump(include={"name", "email"}) to include only specific fields.`,
            },
          ],
          proTips: [
            `Combine options: model_dump(exclude_unset=True, exclude_none=True) gives you the most compact representation for API responses.`,
            `model_dump_json() is 2-5x faster than json.dumps(model_dump()) because the Rust engine handles serialization natively.`,
          ],},
      ],
      frontendIntegration: {
        title: `Product Form with Type Coercion Demo`,
        vanillaHtml: {
          title: `See Pydantic Coerce String Inputs to Proper Types`,
          description: `A form that sends strings for price/quantity and lets Pydantic coerce them`,
          code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Pydantic Coercion Demo</title>
  <style>
    body { font-family: system-ui; max-width: 600px; margin: 2rem auto; }
    input { padding: 0.4rem; border: 1px solid #cbd5e1; border-radius: 4px; margin: 0.3rem 0; width: 100%; }
    button { background: #0d9488; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; }
    pre { background: #1e293b; color: #e2e8f0; padding: 1rem; border-radius: 8px; }
  </style>
</head>
<body>
  <h1>Product Creator</h1>
  <p>Try "9.99" for price — Pydantic coerces it to float!</p>
  <input id="name" placeholder="Product name">
  <input id="price" placeholder='Price (try "9.99")'>
  <input id="qty" placeholder='Quantity (try "5")'>
  <button onclick="createProduct()">Create</button>
  <pre id="result"></pre>
  <script>
    async function createProduct() {
      const body = { name: document.getElementById("name").value, price: document.getElementById("price").value, quantity: document.getElementById("qty").value };
      const res = await fetch("http://localhost:8000/products", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body) });
      const data = await res.json();
      document.getElementById("result").textContent = JSON.stringify(data, null, 2);
    }
  </script>
</body>
</html>`,
          language: `html`,
          whatHappened: [
            `Strings are sent for price and quantity`,
            `Pydantic coerces "9.99" to 9.99 (float) and "5" to 5 (int)`,
            `If coercion fails, a 422 error is returned`,
          ],
          tryToBreak: [
            `Enter "free" for price — coercion fails`,
            `Leave name empty — required field validation triggers`,
          ],
        },
        corsNote: `Sends JSON to FastAPI. Enable CORS for cross-origin requests.`,
      },
    },

    // ──────────────────────────────────────────────
    // TOPIC 3: Field Validation & Constraints
    // ──────────────────────────────────────────────
    {
      id: 'm2-field-constraints',
      title: 'Field Validation & Constraints',
      icon: '🎯',
      introduction:
        'The Field() function is Pydantic\'s way of adding constraints, metadata, and documentation to individual model fields. While type annotations define the basic shape, Field() adds the fine-grained control — minimum values, maximum lengths, regex patterns, descriptions, examples, and more. Every production model should use Field() for its constrained fields.',
      sections: [
        {
          heading: 'Field() Basics: Constraints & Metadata',
          content: `The \`Field()\` function is imported from \`pydantic\` and used as the default value for a model field. It serves two purposes: adding **validation constraints** (numeric bounds, string length, regex patterns) and adding **metadata** (descriptions, examples, aliases) that enrich the JSON Schema and API documentation.

For numeric fields, \`gt\` (greater than), \`ge\` (greater than or equal), \`lt\` (less than), and \`le\` (less than or equal) define bounds. These are checked after type coercion, so \`age: int = Field(ge=0)\` will reject negative integers. For string fields, \`min_length\` and \`max_length\` enforce length constraints, and \`pattern\` applies a regex pattern that the string must match. For list/sequence fields, \`min_length\` and \`max_length\` control the number of items.

Beyond constraints, \`Field()\` accepts \`description\` (a human-readable explanation), \`examples\` (sample values shown in docs), \`alias\` (an alternative name for serialization/parsing), \`default\` (the default value), and \`default_factory\` (a callable that produces the default). These metadata fields don't affect validation but make your OpenAPI documentation richer and your API more usable. In FastAPI, the description appears in Swagger UI, and examples are pre-filled in the "Try it out" form.`,
          codeExamples: [
            {
              title: 'Numeric & String Constraints',
              description: 'Using Field() with gt, ge, lt, le, min_length, max_length, pattern',
              code: `from pydantic import BaseModel, Field, ValidationError

class Product(BaseModel):
    name: str = Field(min_length=1, max_length=100, description="Product name")
    price: float = Field(gt=0, description="Price in USD (must be positive)")
    quantity: int = Field(ge=0, default=0, description="Stock quantity (non-negative)")
    sku: str = Field(
        pattern=r"^[A-Z]{3}-\d{4}$",
        description="SKU format: ABC-1234"
    )
    discount: float = Field(ge=0, le=1, default=0.0, description="Discount as decimal (0-1)")

# Valid product
product = Product(name="Widget", price=9.99, sku="WDG-0001")
print(product)
# name='Widget' price=9.99 quantity=0 sku='WDG-0001' discount=0.0

# Various validation errors
errors = [
    {"name": "", "price": -5, "quantity": -1, "sku": "invalid", "discount": 1.5},
    {"name": "X" * 101, "price": 0, "quantity": "abc", "sku": "abc-12", "discount": -0.1},
]

for i, data in enumerate(errors, 1):
    try:
        Product(**data)
    except ValidationError as e:
        print(f"\\nError set {i}:")
        for err in e.errors():
            print(f"  {err['loc'][0]}: {err['msg']}")`,
              language: 'python',
              output: `Error set 1:
  name: String should have at least 1 character
  price: Input should be greater than 0
  quantity: Input should be greater than or equal to 0
  sku: String should match pattern '^[A-Z]{3}-\\d{4}$'
  discount: Input should be less than or equal to 1

Error set 2:
  name: String should have at most 100 characters
  price: Input should be greater than 0
  quantity: Input should be a valid integer
  sku: String should match pattern '^[A-Z]{3}-\\d{4}$'
  discount: Input should be greater than or equal to 0`,
            },
            {
              title: 'Field Metadata: Description, Examples, Aliases',
              description: 'Enrich your models with documentation and naming conventions',
              code: `from pydantic import BaseModel, Field
from typing import Optional

class UserCreate(BaseModel):
    username: str = Field(
        min_length=3,
        max_length=20,
        pattern=r"^[a-zA-Z0-9_]+$",
        description="Unique username (alphanumeric + underscore)",
        examples=["alice_123", "bob_the_builder"],
    )
    email: str = Field(
        description="User email address",
        examples=["user@example.com"],
    )
    age: int = Field(
        ge=13,
        le=120,
        description="User age (must be 13+)",
        examples=[25, 30],
    )
    display_name: Optional[str] = Field(
        default=None,
        alias="displayName",  # API uses camelCase, Python uses snake_case
        description="Optional display name (defaults to username)",
    )

# Parse with alias
user = UserCreate(username="alice", email="alice@example.com", age=25, displayName="Alice")
print(user)
# username='alice' email='alice@example.com' age=25 display_name='Alice'

# The JSON Schema includes all metadata
schema = UserCreate.model_json_schema()
print(schema["properties"]["username"]["description"])
# "Unique username (alphanumeric + underscore)"
print(schema["properties"]["username"]["examples"])
# ["alice_123", "bob_the_builder"]`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'comparison',
            title: 'Field() Constraint Reference',
            description: 'Every constraint option organized by field type',
            columns: [
              {
                title: 'Numeric (int/float)',
                items: ['gt — strictly greater than', 'ge — greater than or equal', 'lt — strictly less than', 'le — less than or equal', 'multiple_of — must be a multiple of'],
              },
              {
                title: 'String (str)',
                items: ['min_length — minimum characters', 'max_length — maximum characters', 'pattern — regex pattern to match', 'to_lower / to_upper (deprecated → use validators)'],
              },
              {
                title: 'Sequence (list/set)',
                items: ['min_length — minimum items', 'max_length — maximum items'],
              },
              {
                title: 'Metadata',
                items: ['description — human-readable text', 'examples — sample values', 'alias — alternative field name', 'default — default value', 'default_factory — callable default'],
              },
            ],
          },
          tips: [
            'Use gt=0 for "must be positive" — it excludes zero. Use ge=0 for "non-negative" which includes zero.',
            'The pattern constraint uses Python regex — the entire string must match (it is anchored with ^ and $ automatically in V2).',
            'Always add description and examples to fields in API models — they appear in Swagger UI and help consumers understand your API.',
          ],
          keyTakeaway:
            'Field() adds constraints (gt, lt, min_length, pattern) and metadata (description, examples, alias) — use it for every non-trivial field.',
        
          realWorldAnalogy: `Field() constraints are like the rules on a form: "minimum 3 characters" (min_length=3), "must be positive" (gt=0), "format: ABC-1234" (pattern). Without these rules, people submit garbage data. With them, you get clean, consistent data every time.`,
          commonMistake: [
            {
              mistake: `Using gt=0 when you mean ge=0 (allowing zero)`,
              fix: `gt=0 means strictly greater than zero (excludes 0). ge=0 means greater than or equal to zero (includes 0). Use ge=0 for non-negative numbers.`,
            },
            {
              mistake: `Not adding description and examples to API model fields`,
              fix: `Always add description and examples — they appear in Swagger UI and help API consumers understand your API without reading separate docs.`,
            },
          ],
          interviewQuestions: [
            {
              question: `What is the difference between gt and ge in Field()?`,
              answer: `gt means "strictly greater than" (gt=0 excludes 0). ge means "greater than or equal to" (ge=0 includes 0). Same for lt vs le.`,
            },
            {
              question: `How do Field() constraints affect the OpenAPI schema?`,
              answer: `All constraints (gt, lt, min_length, pattern, etc.) are reflected in the generated JSON Schema and shown in Swagger UI. minLength becomes a validation hint, pattern shows the regex, etc.`,
            },
          ],
          proTips: [
            `The pattern constraint is automatically anchored in V2 — you don't need ^ and $ in your regex. pattern=r"[A-Z]{3}" matches the entire string.`,
            `Use Field(alias="camelCase") for APIs that use camelCase naming while keeping Python snake_case internally. Set by_alias=True in model_dump() for output.`,
          ],},
        {
          heading: 'Default Values and Default Factory',
          content: `Fields can have default values that are used when no value is provided during model creation. There are two ways to specify defaults: \`default\` for static values and \`default_factory\` for dynamic values. This distinction is critical for mutable defaults — using a mutable default (like a list or dict) directly will cause the same object to be shared across all model instances, which is a classic Python bug.

\`default\` accepts any value — strings, numbers, booleans, None. It is the simplest and most common way to make a field optional. \`default_factory\` accepts a callable (function or class) that is invoked each time a new model instance is created. This ensures each instance gets its own fresh copy of the mutable default.

In Pydantic V2, you can specify defaults in three ways: as the Field() default parameter (\`name: str = Field(default="unnamed")\`), as a direct assignment (\`name: str = "unnamed"\`), or via default_factory (\`tags: list = Field(default_factory=list)\`). The direct assignment style is cleanest for simple defaults, while Field() is needed when you also want constraints or metadata alongside the default.`,
          codeExamples: [
            {
              title: 'Default vs Default Factory',
              description: 'The critical difference and when to use each',
              code: `from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import Optional
import uuid

class Document(BaseModel):
    # ── Static defaults (immutable values) ────────
    id: str = Field(default_factory=lambda: uuid.uuid4().hex[:8])
    title: str = "Untitled"
    status: str = "draft"
    priority: int = 0

    # ── Factory defaults (mutable or computed) ────
    tags: list[str] = Field(default_factory=list)    # Fresh list per instance
    metadata: dict[str, str] = Field(default_factory=dict)  # Fresh dict per instance
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # ── Optional with None default ────────────────
    description: Optional[str] = None

# Each instance gets its own fresh mutable defaults
doc1 = Document(title="Doc 1")
doc2 = Document(title="Doc 2")

doc1.tags.append("important")
print(doc1.tags)   # ['important']
print(doc2.tags)   # []  ← Not shared!

print(doc1.id)     # e.g., 'a3f7b2c1'
print(doc2.id)     # e.g., '9d4e1f8a'  ← Different UUID

print(doc1.created_at)  # 2024-01-15 10:30:00+00:00
print(doc2.created_at)  # 2024-01-15 10:30:01+00:00  ← Different timestamp`,
              language: 'python',
            },
            {
              title: 'The Mutable Default Bug',
              description: 'Why default_factory exists — the classic Python gotcha',
              code: `from pydantic import BaseModel, Field

# ❌ BUG: Mutable default is shared across instances
class BuggyModel(BaseModel):
    # This will NOT work as expected in Pydantic V2
    # Pydantic actually protects you here — it raises a warning
    tags: list[str] = []  # ⚠️ Dangerous pattern!

# ✅ CORRECT: Use default_factory for mutable defaults
class CorrectModel(BaseModel):
    tags: list[str] = Field(default_factory=list)  # Safe!

# Demonstration
m1 = CorrectModel()
m2 = CorrectModel()
m1.tags.append("shared?")
print(m1.tags)  # ['shared?']
print(m2.tags)  # []  ← Safe! Each instance has its own list

# Default factory can be any callable
class Counter(BaseModel):
    values: list[int] = Field(default_factory=lambda: [0, 0, 0])
    config: dict[str, bool] = Field(default_factory=lambda: {"enabled": True})

c = Counter()
print(c.values)  # [0, 0, 0]
print(c.config)  # {'enabled': True}`,
              language: 'python',
            },
          ],
          tips: [
            'ALWAYS use default_factory for mutable defaults (list, dict, set) — never assign them directly.',
            'default_factory accepts any zero-argument callable: list, dict, set, lambda: value, datetime.now, etc.',
            'Pydantic V2 will emit a warning if you use a mutable default directly — upgrade to default_factory.',
          ],
          warning:
            'Never use mutable defaults like tags: list[str] = [] — use Field(default_factory=list) instead to avoid shared state between instances.',
          keyTakeaway:
            'Use default for immutable values, default_factory for mutable or computed values — every instance gets its own fresh copy.',
        
          realWorldAnalogy: `default is like a pre-printed value on a form (every copy starts with "USA" in the country field). default_factory is like a stamp that generates a fresh value each time (a new serial number on every form). Using a mutable default directly (like tags: list = []) is like giving everyone the same shared piece of paper — when one person writes on it, everyone sees the change.`,
          commonMistake: [
            {
              mistake: `Using mutable defaults directly (tags: list = [])`,
              fix: `Use default_factory=list: tags: list = Field(default_factory=list). Without default_factory, all instances share the same list object.`,
            },
            {
              mistake: `Calling a function as default instead of passing the callable`,
              fix: `Use default_factory=uuid.uuid4 (no parentheses), not default=uuid.uuid4() (with parentheses). The factory is called each time; the direct call is evaluated once at class definition.`,
            },
          ],
          interviewQuestions: [
            {
              question: `Why can't you use a mutable default like list directly in a Pydantic field?`,
              answer: `Because all instances would share the same list object. Modifying it on one instance would affect all others. Use default_factory=list to create a fresh list for each instance.`,
            },
            {
              question: `When should you use default vs default_factory?`,
              answer: `Use default for immutable values (strings, numbers, None). Use default_factory for mutable values (list, dict, set) or dynamic values (uuid4, datetime.now) that need fresh creation per instance.`,
            },
          ],
          proTips: [
            `Use default_factory=datetime.now for timestamp fields — it's called when the model is instantiated, not when the class is defined.`,
            `For uuid fields, use id: str = Field(default_factory=lambda: str(uuid.uuid4())). This generates a unique ID for each new instance.`,
          ],},
      ],
      frontendIntegration: {
        title: `Registration Form with Field Constraint Validation`,
        vanillaHtml: {
          title: `Live Validation Feedback from Field() Constraints`,
          description: `A form that demonstrates Field() constraints like min_length, pattern, ge/le`,
          code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Field Constraints Demo</title>
  <style>
    body { font-family: system-ui; max-width: 600px; margin: 2rem auto; }
    input { padding: 0.4rem; border: 1px solid #cbd5e1; border-radius: 4px; margin: 0.3rem 0; width: 100%; }
    button { background: #0d9488; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; }
    .hint { font-size: 0.8rem; color: #64748b; }
    .error { color: #dc2626; font-size: 0.85rem; }
  </style>
</head>
<body>
  <h1>Registration (Field Constraints)</h1>
  <input id="username" placeholder="Username (3-20 chars, alphanumeric)">
  <div class="hint">3-20 characters, letters/numbers/underscore only</div>
  <input id="email" type="email" placeholder="Email">
  <input id="age" type="number" placeholder="Age (13-120)">
  <div class="hint">Must be 13-120</div>
  <button onclick="register()">Register</button>
  <div id="result"></div>
  <script>
    async function register() {
      const body = { username: document.getElementById("username").value, email: document.getElementById("email").value, age: parseInt(document.getElementById("age").value) };
      const res = await fetch("http://localhost:8000/register", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body) });
      const data = await res.json();
      const div = document.getElementById("result");
      if (res.ok) { div.innerHTML = "<div style='color:#059669'>Success!</div>"; }
      else { div.innerHTML = data.detail.map(e => '<div class="error">' + e.loc.join(".") + ": " + e.msg + '</div>').join(""); }
    }
  </script>
</body>
</html>`,
          language: `html`,
          whatHappened: [
            `Each field has HTML hints matching Pydantic constraints`,
            `FastAPI validates username (min_length=3, pattern), age (ge=13, le=120)`,
            `Validation errors show the exact field and constraint that failed`,
          ],
          tryToBreak: [
            `2-character username — min_length triggers`,
            `Username with special chars — pattern rejects`,
          ],
        },
        corsNote: `Form posts JSON to FastAPI. Enable CORS for cross-origin requests.`,
      },
    },

    // ──────────────────────────────────────────────
    // TOPIC 4: Custom Field Validators
    // ──────────────────────────────────────────────
    {
      id: 'm2-field-validators',
      title: 'Custom Field Validators',
      icon: '⚙️',
      introduction:
        'When built-in constraints aren\'t enough, @field_validator lets you write custom validation logic for individual fields. With three modes — before, after, and wrap — you have precise control over where your logic runs in the validation pipeline. This is Pydantic\'s extensibility mechanism: the framework handles 90% of validation, and you handle the last 10%.',
      sections: [
        {
          heading: '@field_validator: The Three Modes',
          content: `The \`@field_validator\` decorator in Pydantic V2 replaces V1's \`@validator\` decorator with a cleaner, more powerful API. It has three modes that determine when your validator runs relative to the core type validation: **before**, **after**, and **wrap**.

In \`mode="before"\`, your validator receives the raw input before Pydantic's type coercion. This is ideal for preprocessing — normalizing strings, converting formats, or cleaning up data before the Rust engine attempts type conversion. For example, stripping whitespace from a username or converting a date string format before Pydantic tries to parse it.

In \`mode="after"\` (the default), your validator receives the already-validated, typed value. This is ideal for business rule checks — verifying an age is in a valid range, checking a date is in the future, or validating a password meets complexity requirements. The value is already the correct type, so you can focus on domain logic.

In \`mode="wrap"\`, your validator receives both the raw value and a \`ValidatorFunctionWrapHandler\` that you can call to invoke the standard validation. This gives you full control — you can pre-process, call the handler, post-process, or even skip standard validation entirely. This is the most powerful but also the most complex mode.

All field validators follow the \`@classmethod\` pattern — they receive \`cls\` as the first argument (the model class) and the value as the second. This enables access to class-level state and configuration.`,
          visualization: {
            type: 'flow',
            title: 'Field Validator Modes in the Pipeline',
            description: 'Where each validator mode runs relative to core validation',
            steps: [
              { label: 'Raw input arrives', detail: 'e.g., "  alice  " for username: str', highlight: false },
              { label: 'mode="before" validators', detail: 'Pre-process raw input: strip, normalize, convert', highlight: true },
              { label: 'Core type validation (Rust)', detail: 'Type coercion + built-in constraints: "alice" → str ✓', highlight: true },
              { label: 'mode="after" validators', detail: 'Business rules on typed value: check length, format, etc.', highlight: true },
              { label: 'mode="wrap" (full control)', detail: 'Wrap entire process: pre → core → post', highlight: true },
              { label: 'Field validation complete', detail: 'Value is guaranteed valid', highlight: false },
            ],
          },
          codeExamples: [
            {
              title: 'Before Mode: Preprocessing Raw Input',
              description: 'Clean and normalize data before type coercion runs',
              code: `from pydantic import BaseModel, field_validator

class User(BaseModel):
    username: str
    email: str
    phone: str

    @field_validator("username", mode="before")
    @classmethod
    def normalize_username(cls, v):
        """Strip and lowercase the username before type validation."""
        if isinstance(v, str):
            return v.strip().lower()
        return v

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v):
        """Lowercase email before validation."""
        if isinstance(v, str):
            return v.strip().lower()
        return v

    @field_validator("phone", mode="before")
    @classmethod
    def clean_phone(cls, v):
        """Remove non-digit characters from phone number."""
        if isinstance(v, str):
            return "".join(c for c in v if c.isdigit())
        return v

user = User(username="  Alice_123  ", email="  Alice@Example.COM  ", phone="+1 (555) 123-4567")
print(user.username)  # 'alice_123'
print(user.email)     # 'alice@example.com'
print(user.phone)     # '15551234567'`,
              language: 'python',
            },
            {
              title: 'After Mode: Business Rule Validation',
              description: 'Check constraints on already-typed values',
              code: `from pydantic import BaseModel, field_validator, Field
from datetime import date, timedelta

class Booking(BaseModel):
    guest_name: str = Field(min_length=2)
    check_in: date
    check_out: date
    guests: int = Field(ge=1, le=10)

    @field_validator("check_in", mode="after")
    @classmethod
    def check_in_must_be_future(cls, v):
        """Check-in date must be today or in the future."""
        if v < date.today():
            raise ValueError(f"Check-in date {v} is in the past")
        return v

    @field_validator("check_out", mode="after")
    @classmethod
    def check_out_after_check_in(cls, v):
        """This validates check_out in isolation. Cross-field checks need model_validator."""
        if v < date.today():
            raise ValueError(f"Check-out date {v} is in the past")
        return v

    @field_validator("guests", mode="after")
    @classmethod
    def reasonable_guest_count(cls, v):
        """Warn about unusual guest counts (still allow them)."""
        if v > 6:
            # You could log a warning here
            pass  # Just pass through — we already have the le=10 constraint
        return v

# Valid booking
booking = Booking(guest_name="Alice", check_in="2025-07-01", check_out="2025-07-05", guests=2)
print(booking)
# guest_name='Alice' check_in=datetime.date(2025, 7, 1) check_out=datetime.date(2025, 7, 5) guests=2

# Invalid: past check-in date
try:
    Booking(guest_name="Bob", check_in="2020-01-01", check_out="2025-07-05", guests=1)
except ValueError as e:
    print(e)
    # Check-in date 2020-01-01 is in the past`,
              language: 'python',
            },
            {
              title: 'Wrap Mode: Full Control Over Validation',
              description: 'Intercept, modify, or skip core validation entirely',
              code: `from pydantic import BaseModel, field_validator
from pydantic_core.core_schema import ValidationInfo

class FlexibleNumber(BaseModel):
    value: float

    @field_validator("value", mode="wrap")
    @classmethod
    def validate_value(cls, v, handler):
        """
        Wrap mode gives you the raw value and a handler function.
        You decide when (or if) to call the standard validation.
        """
        # Pre-processing: handle special string values
        if isinstance(v, str):
            v = v.strip()
            if v.lower() in ("n/a", "null", "none", "-"):
                return 0.0  # Convert null-like strings to 0.0

        # Call the standard validation handler
        result = handler(v)

        # Post-processing: round to 2 decimal places
        return round(result, 2)

# Normal number
print(FlexibleNumber(value=3.14159))
# value=3.14  ← Rounded by post-processing

# String that gets parsed
print(FlexibleNumber(value="  42.567  "))
# value=42.57  ← Stripped, parsed, rounded

# Special null-like strings
print(FlexibleNumber(value="N/A"))
# value=0.0  ← Converted by pre-processing

print(FlexibleNumber(value="null"))
# value=0.0`,
              language: 'python',
            },
          ],
          tips: [
            'Use mode="before" for preprocessing (normalize input) and mode="after" for business rules (check constraints on typed values).',
            'Always decorate field validators with @classmethod — Pydantic passes the model class as the first argument.',
            'Raise ValueError with a descriptive message — Pydantic wraps it in a ValidationError with location info.',
          ],
          keyTakeaway:
            '@field_validator has three modes: before (preprocess raw input), after (check typed values), wrap (full control). Use after for most cases.',
        },
        {
          heading: 'Validating Multiple Fields with One Validator',
          content: `A single \`@field_validator\` can target multiple fields by passing a tuple of field names. This is useful when the same validation logic applies to several fields — for example, ensuring all string fields are trimmed, or all date fields are in the future. The validator runs once per field, not once for all fields together.

You can also use the special value \`"*"\` to apply a validator to ALL fields in the model. This is powerful for global transformations — stripping whitespace from every string, logging field values, or enforcing organization-wide formatting rules. Be careful with \`"*"\` validators: they run for every field, which can have performance implications on large models and can produce unexpected results if your validation logic doesn't handle all possible types.

When a validator targets multiple fields, it receives the value for each field individually — it does NOT receive a dict of all field values. If you need to validate multiple fields together (e.g., "end_date must be after start_date"), use \`@model_validator\` instead.`,
          codeExamples: [
            {
              title: 'Multi-Field Validators and the Asterisk',
              description: 'Apply the same validation logic to multiple or all fields',
              code: `from pydantic import BaseModel, field_validator

class ContactForm(BaseModel):
    first_name: str
    last_name: str
    company: str
    message: str

    # Apply to specific multiple fields
    @field_validator("first_name", "last_name", mode="before")
    @classmethod
    def capitalize_names(cls, v):
        """Capitalize first and last names."""
        if isinstance(v, str):
            return v.strip().title()
        return v

    # Apply to ALL fields
    @field_validator("*", mode="before")
    @classmethod
    def strip_all_strings(cls, v):
        """Strip whitespace from every string field."""
        if isinstance(v, str):
            return v.strip()
        return v

form = ContactForm(
    first_name="  alice  ",
    last_name="  johnson  ",
    company="  acme corp  ",
    message="  Hello, I need help  "
)
print(form.first_name)  # 'Alice' (stripped then capitalized)
print(form.last_name)   # 'Johnson'
print(form.company)     # 'acme corp' (stripped but NOT capitalized)
print(form.message)     # 'Hello, I need help'`,
              language: 'python',
            },
          ],
          tips: [
            'Use ("field1", "field2") syntax when multiple fields share the same validation — avoids code duplication.',
            'The "*" validator runs for EVERY field — make sure your logic handles all possible types (check isinstance first).',
            'Validators run in the order they are defined, top to bottom — order matters when validators have side effects.',
          ],
          keyTakeaway:
            'Pass multiple field names to @field_validator for shared logic, or use "*" for global validation — but prefer explicit field names for clarity.',
        },
      ],
    },

    // ──────────────────────────────────────────────
    // TOPIC 5: Model Validators & Cross-Field Validation
    // ──────────────────────────────────────────────
    {
      id: 'm2-model-validators',
      title: 'Model Validators & Cross-Field Validation',
      icon: '🔗',
      introduction:
        'Field validators are great for individual fields, but many real-world validation rules involve relationships between fields — "end_date must be after start_date," "if payment_method is credit_card then card_number is required," "password and confirm_password must match." Model validators give you access to all fields at once, enabling cross-field validation that field validators simply cannot express.',
      sections: [
        {
          heading: '@model_validator: Whole-Model Validation',
          content: `The \`@model_validator\` decorator in Pydantic V2 replaces V1's \`@root_validator\` and provides two modes for validating the entire model at once. Unlike field validators that operate on a single field's value, model validators receive the complete model data and can enforce rules that span multiple fields.

In \`mode="before"\`, the validator receives a dictionary of raw input values (before type coercion). This is useful when you need to preprocess or check the input structure before Pydantic attempts type conversion — for example, removing a field based on the presence of another, or reformatting the entire input structure.

In \`mode="after"\`, the validator receives the fully validated model instance with all fields properly typed and coerced. This is the most common mode for cross-field validation — you can compare dates, check conditional requirements, enforce invariants, and raise \`ValueError\` if the model state is inconsistent. The model is fully constructed, so you have access to all fields as their proper Python types.

Model validators are essential for business rule enforcement. Any validation rule that references more than one field is a model validator candidate. The pattern is: field validators for single-field rules, model validators for multi-field rules. This separation keeps your validation logic organized and easy to test.`,
          visualization: {
            type: 'flow',
            title: 'Model Validator in the Pipeline',
            description: 'Where model validators run relative to field validators',
            steps: [
              { label: 'Raw input', detail: '{"start": "2025-01-01", "end": "2025-02-01"}', highlight: false },
              { label: 'Field matching & defaults', detail: 'Map input to model fields', highlight: false },
              { label: 'field_validator(mode="before")', detail: 'Per-field preprocessing', highlight: false },
              { label: 'Type coercion (Rust)', detail: 'Convert types, apply Field() constraints', highlight: false },
              { label: 'field_validator(mode="after")', detail: 'Per-field business rules', highlight: false },
              { label: '@model_validator(mode="before")', detail: 'Whole-model pre-validation (raw dict)', highlight: true },
              { label: '@model_validator(mode="after")', detail: 'Whole-model cross-field checks (typed model)', highlight: true },
              { label: 'Model instance returned', detail: 'All validations passed ✓', highlight: false },
            ],
          },
          codeExamples: [
            {
              title: 'Cross-Field Date Validation',
              description: 'Ensure end_date is after start_date using model_validator',
              code: `from pydantic import BaseModel, model_validator, Field
from datetime import date
from typing import Optional

class DateRange(BaseModel):
    start_date: date = Field(description="Start of the range")
    end_date: date = Field(description="End of the range")

    @model_validator(mode="after")
    def dates_must_be_ordered(self):
        """End date must be on or after start date."""
        if self.end_date < self.start_date:
            raise ValueError(
                f"end_date ({self.end_date}) must be >= start_date ({self.start_date})"
            )
        return self

# Valid range
range1 = DateRange(start_date="2025-01-01", end_date="2025-06-30")
print(range1)
# start_date=datetime.date(2025, 1, 1) end_date=datetime.date(2025, 6, 30)

# Invalid: end before start
try:
    DateRange(start_date="2025-06-30", end_date="2025-01-01")
except ValueError as e:
    print(e)
    # end_date (2025-01-01) must be >= start_date (2025-06-30)`,
              language: 'python',
            },
            {
              title: 'Conditional Required Fields',
              description: 'If payment_method is "credit_card", card_number is required',
              code: `from pydantic import BaseModel, model_validator, Field
from typing import Optional, Literal

class Payment(BaseModel):
    method: Literal["credit_card", "paypal", "bank_transfer"]
    card_number: Optional[str] = None
    card_cvv: Optional[str] = None
    paypal_email: Optional[str] = None
    bank_iban: Optional[str] = None
    amount: float = Field(gt=0)

    @model_validator(mode="after")
    def validate_payment_details(self):
        """Validate that the correct details are provided for the payment method."""
        if self.method == "credit_card":
            if not self.card_number:
                raise ValueError("card_number is required for credit card payments")
            if not self.card_cvv:
                raise ValueError("card_cvv is required for credit card payments")
        elif self.method == "paypal":
            if not self.paypal_email:
                raise ValueError("paypal_email is required for PayPal payments")
        elif self.method == "bank_transfer":
            if not self.bank_iban:
                raise ValueError("bank_iban is required for bank transfers")
        return self

# Valid credit card payment
payment = Payment(
    method="credit_card",
    card_number="4242424242424242",
    card_cvv="123",
    amount=99.99
)
print(payment.method)  # 'credit_card'

# Invalid: credit card without card_number
try:
    Payment(method="credit_card", amount=50.0)
except ValueError as e:
    print(e)
    # card_number is required for credit card payments`,
              language: 'python',
            },
            {
              title: 'Mode="before" for Input Preprocessing',
              description: 'Modify the raw input dict before any field validation runs',
              code: `from pydantic import BaseModel, model_validator
from typing import Any

class APIResponse(BaseModel):
    status: str
    data: dict[str, Any] | None = None
    error: str | None = None

    @model_validator(mode="before")
    @classmethod
    def normalize_response(cls, data):
        """
        Some APIs wrap responses in a 'response' key.
        Unwrap it before validation.
        """
        if isinstance(data, dict) and "response" in data:
            # Flatten the wrapper
            inner = data["response"]
            if isinstance(inner, dict):
                data = {**data, **inner}
                data.pop("response", None)
        return data

# Input with wrapper
raw = {
    "response": {
        "status": "ok",
        "data": {"users": []}
    }
}

result = APIResponse.model_validate(raw)
print(result.status)  # 'ok'
print(result.data)    # {'users': []}

# Input without wrapper (also works)
direct = {"status": "error", "error": "Not found"}
result2 = APIResponse.model_validate(direct)
print(result2.error)  # 'Not found'`,
              language: 'python',
            },
          ],
          tips: [
            'Use mode="after" for most cross-field validation — you get typed, validated values and can write clean comparison logic.',
            'Use mode="before" when you need to restructure the input dict itself — renaming keys, unwrapping nested structures, etc.',
            'Return self (or the modified data dict for mode="before") from your model validator — forgetting the return statement is a common bug.',
          ],
          keyTakeaway:
            '@model_validator(mode="after") is for cross-field validation — it receives the fully typed model and can enforce rules spanning multiple fields.',
        },
      ],
    },

    // ──────────────────────────────────────────────
    // TOPIC 6: Nested Models & Complex Types
    // ──────────────────────────────────────────────
    {
      id: 'm2-nested-complex-types',
      title: 'Nested Models & Complex Types',
      icon: '🧬',
      introduction:
        'Real-world data is rarely flat. APIs deal with nested objects, arrays of items, polymorphic types, and self-referencing structures. Pydantic handles all of these elegantly — nested models validate recursively, Union types enable polymorphism, Literal types restrict to specific values, and forward references handle circular dependencies.',
      sections: [
        {
          heading: 'Nested Models: Building Complex Data Structures',
          content: `Pydantic models can contain other Pydantic models as fields, creating deeply nested data structures that validate recursively. When you define a field as another BaseModel subclass, Pydantic automatically validates the nested data using that model's rules. This means a single top-level validation call validates the entire tree — every nested model, every field, every constraint, all the way down.

Nested models are how you represent real API data structures. A User has an Address, which has Geo coordinates. An Order has a list of Items, each with a Product. A Blog has a list of Comments, each with a User. Each layer of nesting has its own validation rules, and Pydantic composes them automatically.

When you pass a dictionary to a nested model field, Pydantic automatically constructs the nested model instance. You can also pass an already-constructed model instance. This flexibility means your API can accept JSON (which becomes dicts) and your internal code can work with typed model instances — Pydantic handles the conversion seamlessly. For serialization, model_dump() recursively converts all nested models to dicts, and model_dump_json() produces a complete JSON string.`,
          codeExamples: [
            {
              title: 'Deeply Nested Models',
              description: 'A real-world e-commerce order structure with multiple nesting levels',
              code: `from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class Address(BaseModel):
    street: str
    city: str
    state: str = Field(min_length=2, max_length=2)
    zip_code: str = Field(pattern=r"^\\d{5}(-\\d{4})?$")
    country: str = "US"

class Customer(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    address: Address  # Nested model

class OrderItem(BaseModel):
    product_name: str
    sku: str
    quantity: int = Field(ge=1)
    unit_price: float = Field(gt=0)

class Order(BaseModel):
    order_id: str
    customer: Customer          # Nested model
    items: list[OrderItem]      # List of nested models
    total: float = Field(ge=0)
    created_at: datetime = Field(default_factory=datetime.now)

# Create a nested structure from a dict (like API JSON input)
order_data = {
    "order_id": "ORD-001",
    "customer": {
        "name": "Alice Johnson",
        "email": "alice@example.com",
        "address": {
            "street": "123 Main St",
            "city": "Springfield",
            "state": "IL",
            "zip_code": "62701"
        }
    },
    "items": [
        {"product_name": "Widget", "sku": "WDG-001", "quantity": 2, "unit_price": 9.99},
        {"product_name": "Gadget", "sku": "GDT-002", "quantity": 1, "unit_price": 24.99}
    ],
    "total": 44.97
}

order = Order.model_validate(order_data)
print(order.customer.address.city)   # 'Springfield'
print(order.items[0].product_name)   # 'Widget'
print(order.customer.name)           # 'Alice Johnson'`,
              language: 'python',
            },
            {
              title: 'Forward References & Self-Referencing Models',
              description: 'Handle circular references and models that reference themselves',
              code: `from pydantic import BaseModel, Field
from typing import Optional, List

# Forward reference: referencing a model before it's defined
class TreeNode(BaseModel):
    """A tree node that can contain child nodes of the same type."""
    name: str
    value: Optional[int] = None
    children: List["TreeNode"] = Field(default_factory=list)

# After defining TreeNode, update forward references
TreeNode.model_rebuild()

# Build a tree structure
root = TreeNode(
    name="root",
    children=[
        TreeNode(name="child_1", value=10, children=[
            TreeNode(name="grandchild_1", value=5),
            TreeNode(name="grandchild_2", value=15),
        ]),
        TreeNode(name="child_2", value=20),
    ]
)

print(root.name)                  # 'root'
print(root.children[0].name)      # 'child_1'
print(root.children[0].children[0].value)  # 5

# Serialize the entire tree
tree_dict = root.model_dump()
print(tree_dict["children"][0]["name"])  # 'child_1'

# ── Another example: linked list ────────────────
class LinkedListNode(BaseModel):
    value: int
    next: Optional["LinkedListNode"] = None

LinkedListNode.model_rebuild()

linked = LinkedListNode(value=1, next=LinkedListNode(value=2, next=LinkedListNode(value=3)))
print(linked.next.next.value)  # 3`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'architecture',
            title: 'Nested Model Validation Tree',
            description: 'How Pydantic validates each level of a nested structure recursively',
            layers: [
              { label: 'Order', items: ['order_id: str', 'customer: Customer ← validates nested', 'items: List[OrderItem] ← validates each item', 'total: float'] },
              { label: 'Customer (nested)', items: ['name: str', 'email: str', 'address: Address ← validates nested'] },
              { label: 'Address (nested)', items: ['street: str', 'city: str', 'state: str (2 chars)', 'zip_code: str (pattern)'] },
              { label: 'OrderItem (list element)', items: ['product_name: str', 'sku: str', 'quantity: int (ge=1)', 'unit_price: float (gt=0)'] },
            ],
          },
          tips: [
            'Pydantic validates nested models recursively — a single model_validate() call validates the entire data tree.',
            'Use model_rebuild() after defining models with forward references (quoted type annotations) to resolve them.',
            'Pass dicts for nested fields and Pydantic auto-constructs the nested models — pass model instances and they are used directly.',
          ],
          keyTakeaway:
            'Nested models validate recursively — define each level with its own BaseModel, compose them as fields, and Pydantic handles the rest.',
        },
        {
          heading: 'Literal, Union, and Optional Types',
          content: `Pydantic fully supports Python's advanced type annotations, turning them into validation rules. \`Literal\` restricts a field to a fixed set of values — like an enum but defined inline. \`Union\` allows a field to accept multiple types, validating against each in order. \`Optional\` (or \`X | None\`) makes a field nullable. These types compose to express complex validation constraints purely through annotations.

\`Literal["admin", "user", "guest"]\` means the field must be exactly one of those three strings. No other value is accepted. This is more restrictive than a string with a pattern — it is a finite set. Pydantic validates Literal by exact equality, not by type coercion. If you pass \`"ADMIN"\` (uppercase), it fails.

\`Union[int, str]\` means the field can be either an int or a string. Pydantic tries each type in order: first int, then str. If int succeeds, the value is an int. If int fails but str succeeds, the value is a str. The order matters — \`Union[str, int]\` will always produce a string because any value can be converted to a string. Put the more specific type first.

\`Optional[X]\` is just \`Union[X, None]\` — it means the field can be X or None. In Pydantic V2, you can also write \`X | None\` (Python 3.10+). An Optional field without a default value is still REQUIRED — the caller must provide either X or None explicitly. To make a field truly optional (omittable), use \`Optional[X] = None\`.`,
          codeExamples: [
            {
              title: 'Literal, Union, and Optional Together',
              description: 'Combine these types to express rich validation constraints',
              code: `from pydantic import BaseModel, Field, ValidationError
from typing import Literal, Union, Optional

class ServerConfig(BaseModel):
    # Literal: exact value match from a fixed set
    environment: Literal["development", "staging", "production"]
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"

    # Union: accept multiple types (tried in order)
    port: Union[int, str]  # int first → prefer int when possible

    # Optional: can be None, but still required in the input
    # (must be explicitly provided as None or a value)
    database_url: Optional[str] = None  # Truly optional — can be omitted

    # Combining: optional union type
    cache_size: Optional[Union[int, str]] = None

# All valid variations
config1 = ServerConfig(environment="production", port=8080)
config2 = ServerConfig(environment="staging", port="8081", database_url="postgres://...")
config3 = ServerConfig(environment="development", port=3000, cache_size="512MB")

# Literal rejects invalid values
try:
    ServerConfig(environment="testing", port=8080)  # "testing" not in Literal
except ValidationError as e:
    print(e.errors()[0]["msg"])
    # Input should be 'development', 'staging' or 'production'

# Union tries types in order
config4 = ServerConfig(environment="production", port="8080")
print(type(config4.port))  # <class 'int'> — "8080" was coerced to int`,
              language: 'python',
            },
            {
              title: 'Annotated Types for Reusable Validation',
              description: 'Use typing.Annotated to create reusable, annotated types',
              code: `from pydantic import BaseModel, Field, AfterValidator
from typing import Annotated

# Define reusable annotated types
PositiveInt = Annotated[int, Field(gt=0)]
NonEmptyStr = Annotated[str, Field(min_length=1)]
Percentage = Annotated[float, Field(ge=0, le=100)]
Username = Annotated[str, Field(min_length=3, max_length=20, pattern=r"^[a-zA-Z0-9_]+$")]

# Custom validator as an Annotated type
def normalize_email(v: str) -> str:
    return v.strip().lower()

Email = Annotated[str, AfterValidator(normalize_email)]

# Use the annotated types in models
class UserProfile(BaseModel):
    username: Username
    email: Email
    age: PositiveInt
    completion: Percentage = 0.0
    bio: NonEmptyStr = "No bio provided"

# All validation is applied through the annotated types
user = UserProfile(username="alice_123", email="  ALICE@EXAMPLE.COM  ", age=25)
print(user.email)     # 'alice@example.com' (normalized)
print(user.username)  # 'alice_123' (validated pattern)

# Invalid username (contains special chars)
try:
    UserProfile(username="alice@#$", email="a@b.com", age=25)
except ValidationError as e:
    print(e.errors()[0]["msg"])
    # String should match pattern '^[a-zA-Z0-9_]+$'`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'comparison',
            title: 'Type Annotation Validation Behavior',
            description: 'How each type annotation affects validation',
            columns: [
              {
                title: 'Type',
                items: ['str', 'int', 'Literal["a","b"]', 'Union[int, str]', 'Optional[str]', 'Optional[str] = None', 'list[str]'],
              },
              {
                title: 'Accepts',
                items: ['Any string, coerced from compatible types', 'Any integer, coerced from "25"', 'Exactly "a" or "b"', 'int first, then str fallback', 'str or None (must provide)', 'str, None, or omit entirely', 'List of strings'],
              },
              {
                title: 'Rejects',
                items: ['None, incompatible types', '"abc", None', '"c", "A", any other value', 'Types matching neither', 'Omission without =None', 'Nothing (can omit)', 'Non-list, wrong item types'],
              },
            ],
          },
          tips: [
            'Literal is stricter than Enum — it requires exact value match, no case conversion, no type coercion.',
            'In Union types, order matters — put the most specific type first (Union[int, str] not Union[str, int]).',
            'Optional[X] = None makes a field truly omittable. Optional[X] without = None still requires the field in the input.',
          ],
          keyTakeaway:
            'Literal restricts to fixed values, Union accepts multiple types (order matters), Optional[X] = None makes fields omittable. Annotated creates reusable types.',
        },
      ],
    },

    // ──────────────────────────────────────────────
    // TOPIC 7: Serialization Deep-Dive
    // ──────────────────────────────────────────────
    {
      id: 'm2-serialization',
      title: 'Serialization Deep-Dive',
      icon: '📦',
      introduction:
        'Serialization — converting model instances to dicts and JSON — is half of Pydantic\'s job. V2 gives you granular control over what gets serialized, how fields are named, and which values are included. Mastering serialization options is essential for building APIs that return exactly the right data without leaking internals.',
      sections: [
        {
          heading: 'model_dump and model_dump_json: Full Control',
          content: `Serialization in Pydantic V2 is handled by two methods: \`model_dump()\` returns a Python dictionary, and \`model_dump_json()\` returns a JSON string. Both accept the same set of filtering options, but \`model_dump_json()\` is significantly faster for JSON output because the Rust core handles the entire conversion natively without creating intermediate Python objects.

The key options are: \`exclude_unset\` (only include fields that were explicitly set during construction), \`exclude_defaults\` (exclude fields with default values), \`exclude_none\` (exclude fields with None values), \`include\` and \`exclude\` (select specific fields by name), and \`by_alias\` (use field aliases instead of Python field names). These can be combined for precise control.

The most important option is \`exclude_unset\`. When you create a model instance like \`User(name="Alice")\`, the fields that were not provided (but have defaults) are considered "unset." Using \`model_dump(exclude_unset=True)\` returns only the fields you explicitly passed — perfect for PATCH endpoints where you only want to update fields the client actually sent. Without \`exclude_unset\`, you would overwrite existing values with defaults, which is almost never what you want in an update operation.`,
          codeExamples: [
            {
              title: 'All Serialization Options Demonstrated',
              description: 'See every model_dump option in action with a single model',
              code: `from pydantic import BaseModel, Field
from typing import Optional

class Server(BaseModel):
    name: str
    host: str = Field(alias="hostname")
    port: int = 8080
    description: Optional[str] = None
    is_active: bool = True
    tags: list[str] = Field(default_factory=list, alias="labels")

# Create a server — only set some fields
server = Server(name="web-01", hostname="192.168.1.1", tags=["production"])

# 1. Full dump — everything
print("Full:", server.model_dump())
# {'name': 'web-01', 'host': '192.168.1.1', 'port': 8080,
#  'description': None, 'is_active': True, 'tags': ['production']}

# 2. exclude_unset — only fields explicitly provided
print("Unset:", server.model_dump(exclude_unset=True))
# {'name': 'web-01', 'host': '192.168.1.1', 'tags': ['production']}

# 3. exclude_defaults — omit fields with default values
print("No defaults:", server.model_dump(exclude_defaults=True))
# {'name': 'web-01', 'host': '192.168.1.1', 'tags': ['production']}

# 4. exclude_none — omit None fields
print("No none:", server.model_dump(exclude_none=True))
# {'name': 'web-01', 'host': '192.168.1.1', 'port': 8080, 'is_active': True, 'tags': ['production']}

# 5. by_alias — use aliases instead of field names
print("Aliased:", server.model_dump(by_alias=True))
# {'name': 'web-01', 'hostname': '192.168.1.1', 'port': 8080,
#  'description': None, 'is_active': True, 'labels': ['production']}

# 6. include/exclude specific fields
print("Include:", server.model_dump(include={"name", "host"}))
# {'name': 'web-01', 'host': '192.168.1.1'}

print("Exclude:", server.model_dump(exclude={"tags", "description"}))
# {'name': 'web-01', 'host': '192.168.1.1', 'port': 8080, 'is_active': True}

# 7. JSON serialization (Rust-powered, faster)
print("JSON:", server.model_dump_json(exclude_none=True))
# '{"name":"web-01","host":"192.168.1.1","port":8080,"is_active":true,"tags":["production"]}'`,
              language: 'python',
            },
            {
              title: 'Nested Serialization with Include/Exclude',
              description: 'Control serialization of nested models with dict-based include/exclude',
              code: `from pydantic import BaseModel, Field
from typing import Optional

class Address(BaseModel):
    street: str
    city: str
    zip_code: str
    country: str = "US"

class User(BaseModel):
    name: str
    email: str
    address: Address
    internal_id: str = "secret-123"
    password_hash: str = "hashed..."

user = User(
    name="Alice",
    email="alice@example.com",
    address=Address(street="123 Main St", city="Springfield", zip_code="62701")
)

# Exclude sensitive fields from API response
public = user.model_dump(exclude={"internal_id", "password_hash"})
# {'name': 'Alice', 'email': 'alice@example.com', 'address': {...}}

# Nested include: only specific fields from nested model
minimal = user.model_dump(
    include={"name": True, "email": True, "address": {"city": True, "country": True}}
)
# {'name': 'Alice', 'email': 'alice@example.com', 'address': {'city': 'Springfield', 'country': 'US'}}

# Nested exclude: exclude specific nested fields
no_zip = user.model_dump(exclude={"internal_id", "password_hash", "address": {"zip_code"}})
# {'name': 'Alice', 'email': 'alice@example.com', 'address': {'street': '123 Main St', 'city': 'Springfield', 'country': 'US'}}`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'data-flow',
            title: 'Serialization Options Flow',
            description: 'How each option filters the output from a model instance',
            steps: [
              { label: 'All fields in model', detail: 'name, host, port, description, is_active, tags', highlight: false },
              { label: 'exclude_unset applied', detail: 'Removes fields not explicitly set → name, host, tags only', highlight: true },
              { label: 'exclude_defaults applied', detail: 'Removes fields with default values → name, host, tags only', highlight: true },
              { label: 'exclude_none applied', detail: 'Removes None-valued fields → drops description', highlight: true },
              { label: 'include/exclude applied', detail: 'Selects or removes specific named fields', highlight: true },
              { label: 'by_alias applied', detail: 'Renames fields using their aliases → hostname, labels', highlight: true },
              { label: 'Final output', detail: 'dict (model_dump) or JSON string (model_dump_json)', highlight: false },
            ],
          },
          tips: [
            'For PATCH endpoints, always use model_dump(exclude_unset=True) — it gives you only the fields the client actually sent.',
            'model_dump_json() is 2-5x faster than json.dumps(model_dump()) — use it when you need JSON output.',
            'Nested include/exclude uses dict syntax: include={"name": True, "address": {"city": True}}.',
          ],
          keyTakeaway:
            'exclude_unset for PATCH, exclude_none for clean responses, by_alias for API naming, include/exclude for field selection — combine freely.',
        },
        {
          heading: 'Aliases: Bridging Python and API Naming Conventions',
          content: `Python uses snake_case for variable names, but many APIs use camelCase or other conventions. Pydantic aliases bridge this gap: your Python code uses snake_case field names, while the API accepts and returns camelCase. The \`alias\` parameter on \`Field()\` defines the alternative name used during parsing and serialization.

There are two key configuration options in \`ConfigDict\` that control alias behavior: \`populate_by_name=True\` allows the model to accept both the Python field name and the alias during construction. Without it, only the alias is accepted for input. \`by_alias\` on \`model_dump()\` controls whether the output uses aliases — without it, dumps use Python field names.

For FastAPI, the common pattern is: define aliases for camelCase API names, set \`populate_by_name=True\` in ConfigDict, and use \`model_dump(by_alias=True)\` when serializing responses. This gives you the best of both worlds — clean Python code and API-compatible naming. FastAPI even supports \`alias_generator\` which automatically generates aliases for all fields based on a naming convention, eliminating the need to specify aliases manually.`,
          codeExamples: [
            {
              title: 'Alias Patterns for API Naming',
              description: 'Using aliases to support camelCase API conventions with snake_case Python code',
              code: `from pydantic import BaseModel, ConfigDict, Field

class UserAPI(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    first_name: str = Field(alias="firstName")
    last_name: str = Field(alias="lastName")
    email_address: str = Field(alias="emailAddress")
    is_active: bool = Field(alias="isActive", default=True)

# Input can use EITHER alias or Python name
user1 = UserAPI(firstName="Alice", lastName="Smith", emailAddress="alice@example.com")
user2 = UserAPI(first_name="Bob", last_name="Jones", email_address="bob@example.com")

print(user1.first_name)  # 'Alice'
print(user2.first_name)  # 'Bob'

# Serialization with by_alias=True for API output
print(user1.model_dump(by_alias=True))
# {'firstName': 'Alice', 'lastName': 'Smith', 'emailAddress': 'alice@example.com', 'isActive': True}

# Serialization without by_alias for Python code
print(user1.model_dump())
# {'first_name': 'Alice', 'last_name': 'Smith', 'email_address': 'alice@example.com', 'is_active': True}`,
              language: 'python',
            },
            {
              title: 'Alias Generator: Automatic Naming Convention',
              description: 'Generate aliases automatically for all fields with a naming convention function',
              code: `from pydantic import BaseModel, ConfigDict, Field

def to_camel(name: str) -> str:
    """Convert snake_case to camelCase."""
    parts = name.split("_")
    return parts[0] + "".join(word.capitalize() for word in parts[1:])

class APIModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )

    user_id: int
    first_name: str
    last_name: str
    email_address: str
    is_premium_member: bool = False
    account_balance: float = 0.0

# All fields automatically get camelCase aliases
user = APIModel(userId=1, firstName="Alice", lastName="Smith", emailAddress="alice@example.com")
print(user.user_id)       # 1
print(user.first_name)    # 'Alice'

# Or use Python names (populate_by_name=True)
user2 = APIModel(user_id=2, first_name="Bob", last_name="Smith", email_address="bob@example.com")

# API output with auto-generated aliases
print(user.model_dump(by_alias=True))
# {'userId': 1, 'firstName': 'Alice', 'lastName': 'Smith',
#  'emailAddress': 'alice@example.com', 'isPremiumMember': False,
#  'accountBalance': 0.0}

# Verify the generated aliases
schema = APIModel.model_json_schema()
for prop, details in schema["properties"].items():
    print(f"{prop} → alias in schema title")`,
              language: 'python',
            },
          ],
          tips: [
            'Set populate_by_name=True in ConfigDict so both alias and Python name work for input — this is the most flexible option.',
            'Use alias_generator for consistent naming across your entire API — define the function once and apply it to all models.',
            'FastAPI respects Pydantic aliases automatically — models with aliases work seamlessly in request/response bodies.',
          ],
          keyTakeaway:
            'Aliases bridge Python naming (snake_case) and API naming (camelCase) — use alias_generator for consistency and populate_by_name=True for flexibility.',
        },
      ],
    },

    // ──────────────────────────────────────────────
    // TOPIC 8: ConfigDict & Model Configuration
    // ──────────────────────────────────────────────
    {
      id: 'm2-configdict',
      title: 'ConfigDict & Model Configuration',
      icon: '⚡',
      introduction:
        'Every Pydantic model can be configured using ConfigDict — a typed dictionary that controls validation strictness, serialization behavior, ORM integration, and more. Moving from V1\'s inner Config class to V2\'s ConfigDict brings type safety, better IDE support, and clearer configuration semantics.',
      sections: [
        {
          heading: 'ConfigDict: Controlling Model Behavior',
          content: `In Pydantic V1, model configuration was done with an inner \`class Config\` — an untyped, convention-based approach that offered no IDE autocomplete or type checking. Pydantic V2 replaces this with \`ConfigDict\`, a typed dictionary class that provides all the same configuration options with full type hints and IDE support.

ConfigDict is assigned to the \`model_config\` class attribute: \`model_config = ConfigDict(...)\`. This placement is intentional — it is a class-level configuration that applies to all instances. The most commonly used options are: \`extra\` (control how unexpected fields are handled), \`populate_by_name\` (allow both field names and aliases), \`from_attributes\` (enable ORM object parsing), \`str_strip_whitespace\` (auto-strip all string fields), and \`json_schema_extra\` (add custom metadata to the JSON Schema).

The \`extra\` option is particularly important for API development. By default (\`extra="ignore"\`), unexpected fields in the input are silently dropped. With \`extra="forbid"\`, any unexpected field causes a ValidationError — this is the strictest mode and excellent for catching typos and unexpected data in API requests. With \`extra="allow"\`, unexpected fields are preserved in the model instance and accessible via \`model.__pydantic_extra__\` or as attributes. Each mode has its use case: "ignore" for flexibility, "forbid" for strictness, "allow" for pass-through proxies.`,
          codeExamples: [
            {
              title: 'Extra Field Handling: Ignore vs Forbid vs Allow',
              description: 'The three modes for handling unexpected input fields',
              code: `from pydantic import BaseModel, ConfigDict, ValidationError, Field

# 1. extra="ignore" (default) — silently drop unknown fields
class FlexibleModel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: str
    age: int

flex = FlexibleModel(name="Alice", age=25, unknown_field="oops")
print(flex.name)  # 'Alice'
# unknown_field is silently dropped — no error

# 2. extra="forbid" — reject any unknown fields (strict mode)
class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str
    age: int

try:
    StrictModel(name="Bob", age=30, typo_nme="Bob")  # typo in field name
except ValidationError as e:
    print(e.errors()[0]["msg"])
    # Extra inputs are not permitted

# 3. extra="allow" — preserve unknown fields
class ProxyModel(BaseModel):
    model_config = ConfigDict(extra="allow")
    name: str

proxy = ProxyModel(name="Charlie", extra_data="preserved", another_field=42)
print(proxy.name)             # 'Charlie'
print(proxy.extra_data)       # 'preserved'  ← accessible as attribute!
print(proxy.another_field)    # 42
print(proxy.__pydantic_extra__)
# {'extra_data': 'preserved', 'another_field': 42}`,
              language: 'python',
            },
            {
              title: 'from_attributes: ORM Integration',
              description: 'Parse Pydantic models directly from SQLAlchemy/ORM objects',
              code: `from pydantic import BaseModel, ConfigDict

# Simulating a SQLAlchemy ORM object
class ORMUser:
    """This simulates a SQLAlchemy model instance."""
    def __init__(self):
        self.id = 1
        self.name = "Alice"
        self.email = "alice@example.com"
        self.hashed_password = "secret_hash"

    # SQLAlchemy objects have __dict__ or attribute access

# Without from_attributes, you can't parse from ORM objects
class UserResponseNoORM(BaseModel):
    name: str
    email: str

# This would fail:
# UserResponseNoORM.model_validate(orm_user)
# ValidationError: Input should be a valid dictionary

# With from_attributes=True, Pydantic reads attributes from the object
class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    email: str
    # hashed_password is NOT included → filtered out in response

orm_user = ORMUser()

# Parse directly from ORM object
response = UserResponse.model_validate(orm_user)
print(response)
# name='Alice' email='alice@example.com'

# The ORM object's hashed_password is ignored (not in model)
# This is how FastAPI reads SQLAlchemy objects and returns safe responses`,
              language: 'python',
            },
            {
              title: 'Useful ConfigDict Options',
              description: 'The most important ConfigDict settings for production models',
              code: `from pydantic import BaseModel, ConfigDict, Field

class ProductionModel(BaseModel):
    model_config = ConfigDict(
        # ── Validation behavior ───────────────────
        str_strip_whitespace=True,    # Auto-strip all string fields
        str_min_length=1,             # Strings must have at least 1 char
        str_to_lower=False,           # Don't auto-lowercase strings
        extra="forbid",               # Reject unexpected fields (strict)

        # ── Alias & naming ────────────────────────
        populate_by_name=True,        # Accept both field name and alias

        # ── ORM integration ───────────────────────
        from_attributes=True,         # Parse from ORM objects

        # ── Schema customization ──────────────────
        json_schema_extra={
            "examples": [
                {"name": "example", "value": 42}
            ]
        },

        # ── Validation strictness ─────────────────
        validate_default=True,        # Validate default values too
        validate_return=True,         # Validate function return values

        # ── Performance ───────────────────────────
        use_enum_values=True,         # Store enum values, not enum instances
    )

    name: str
    value: int = 0

# str_strip_whitespace is applied to ALL string fields
m = ProductionModel(name="  hello  ")
print(m.name)  # 'hello' (whitespace stripped)

# extra="forbid" catches typos
try:
    ProductionModel(name="test", unknown="bad")
except Exception as e:
    print("Extra field rejected")  # Extra inputs are not permitted`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'comparison',
            title: 'ConfigDict Key Options',
            description: 'The most important ConfigDict settings and their effects',
            columns: [
              {
                title: 'Option',
                items: ['extra="ignore"', 'extra="forbid"', 'extra="allow"', 'from_attributes', 'str_strip_whitespace', 'populate_by_name', 'validate_default'],
              },
              {
                title: 'Effect',
                items: ['Silently drop unknown fields', 'Raise error on unknown fields', 'Preserve unknown fields as attrs', 'Parse from ORM objects', 'Auto-strip all string fields', 'Accept both name and alias', 'Validate default/factory values'],
              },
              {
                title: 'Best For',
                items: ['Flexible APIs', 'Strict APIs, catch typos', 'Proxy/passthrough models', 'SQLAlchemy integration', 'User input normalization', 'camelCase APIs', 'Critical data integrity'],
              },
            ],
          },
          tips: [
            'Use extra="forbid" for API request models — it catches typos and unexpected fields that might indicate a bug in the client.',
            'str_strip_whitespace=True is a global version of the "strip before" validator pattern — use it instead of per-field validators.',
            'from_attributes=True is essential when using SQLAlchemy with FastAPI — it lets response_model read from ORM objects directly.',
          ],
          keyTakeaway:
            'ConfigDict controls model behavior: extra="forbid" for strict APIs, from_attributes=True for ORM integration, str_strip_whitespace for auto-cleaning.',
        },
        {
          heading: 'V1 Config vs V2 ConfigDict Migration',
          content: `If you are migrating from Pydantic V1, the configuration system has changed significantly. V1 used an inner \`class Config\` with arbitrary attributes, while V2 uses a typed \`ConfigDict\` assigned to \`model_config\`. Most options have the same names, but some have been renamed or removed.

The key changes: \`class Config\` becomes \`model_config = ConfigDict(...)\`, \`allow_mutation\` is removed (use \`frozen=True\` for immutability), \`orm_mode\` is renamed to \`from_attributes\`, \`fields\` (for aliases) is replaced by \`Field(alias=...)\`, \`schema_extra\` is renamed to \`json_schema_extra\`, and \`json_loads\`/\`json_dumps\` are removed (Pydantic V2 uses its own Rust-based JSON parser).

The ConfigDict approach is strictly better: it provides type hints (your IDE catches typos and invalid options), it is consistent with the rest of the Pydantic V2 API, and it integrates cleanly with tools that analyze type annotations. The migration is straightforward for most models — rename the options and switch to the new syntax.`,
          codeExamples: [
            {
              title: 'V1 Config → V2 ConfigDict Migration',
              description: 'Side-by-side comparison of V1 and V2 configuration',
              code: `# ── Pydantic V1 (OLD) ─────────────────────────────
# class UserV1(BaseModel):
#     name: str
#     email: str
#
#     class Config:
#         orm_mode = True               # ← renamed
#         allow_mutation = False         # ← removed, use frozen
#         fields = {"email": {"alias": "emailAddress"}}  # ← use Field()
#         schema_extra = {"example": {"name": "test"}}   # ← renamed
#         extra = "forbid"
#         validate_all = True            # ← renamed

# ── Pydantic V2 (NEW) ────────────────────────────
from pydantic import BaseModel, ConfigDict, Field

class UserV2(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,           # was orm_mode
        frozen=True,                    # was allow_mutation=False
        extra="forbid",
        validate_default=True,          # was validate_all
        json_schema_extra={             # was schema_extra
            "examples": [{"name": "test", "email": "test@example.com"}]
        },
    )

    name: str
    email: str = Field(alias="emailAddress")  # was Config.fields

# V2 model is immutable (frozen=True)
user = UserV2(name="Alice", emailAddress="alice@example.com")
# user.name = "Bob"  # ← FrozenInstanceError!`,
              language: 'python',
            },
          ],
          tips: [
            'Search for "class Config" in your codebase — every instance needs to be migrated to model_config = ConfigDict(...).',
            'The frozen=True option makes models hashable (can be used as dict keys or in sets) — useful for caching.',
            'Use strict=True in ConfigDict to disable type coercion — "25" will NOT be converted to 25. Use this for security-critical APIs.',
          ],
          keyTakeaway:
            'V1 class Config → V2 ConfigDict: orm_mode→from_attributes, allow_mutation→frozen, fields→Field(alias), schema_extra→json_schema_extra.',
        },
      ],
    },

    // ──────────────────────────────────────────────
    // TOPIC 9: Computed Fields & Advanced Patterns
    // ──────────────────────────────────────────────
    {
      id: 'm2-computed-advanced',
      title: 'Computed Fields & Advanced Patterns',
      icon: '🧮',
      introduction:
        'Not all model fields come from input data — some are computed from other fields. Pydantic V2\'s @computed_field decorator makes derived values first-class model fields that appear in serialization and JSON Schema. Combined with discriminated unions and model_validator patterns, you can express sophisticated domain logic entirely within your Pydantic models.',
      sections: [
        {
          heading: '@computed_field: Derived Values as Model Fields',
          content: `A computed field is a property on a model whose value is calculated from other fields rather than provided as input. In Pydantic V2, the \`@computed_field\` decorator marks such properties so they are included in \`model_dump()\` and \`model_dump_json()\` output automatically, and they appear in the JSON Schema. This is a significant improvement over regular \`@property\` which is invisible to serialization.

Computed fields are defined using the \`@computed_field\` decorator combined with \`@property\`. The return type annotation determines the field's type in the schema. Unlike regular fields, computed fields are never part of the input — they cannot be set during construction, and they are always excluded from \`model_validate()\` input processing. They are computed on-demand during serialization.

Common use cases include: full names computed from first_name and last_name, display values that format raw data, age computed from birth_date, discounted prices, status flags based on multiple fields, and any derived value that should appear in API responses but shouldn't be accepted as input. Computed fields make your models self-contained — the model knows how to derive its own display values, rather than requiring the API layer to compute them separately.`,
          codeExamples: [
            {
              title: 'Computed Fields for Derived Values',
              description: 'Fields that are calculated from other fields and appear in serialization',
              code: `from pydantic import BaseModel, computed_field, Field
from datetime import date
from typing import Optional

class Person(BaseModel):
    first_name: str
    last_name: str
    birth_date: date
    hourly_rate: float = Field(gt=0)

    @computed_field  # ← Included in model_dump() and JSON Schema
    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

    @computed_field
    @property
    def age(self) -> int:
        today = date.today()
        return today.year - self.birth_date.year - (
            (today.month, today.day) < (self.birth_date.month, self.birth_date.day)
        )

    @computed_field
    @property
    def annual_salary(self) -> float:
        return round(self.hourly_rate * 2080, 2)  # 2080 hours/year

    @computed_field
    @property
    def display_rate(self) -> str:
        return f'\${self.hourly_rate:,.2f}/hr'

# Input does NOT include computed fields
person = Person(first_name="Alice", last_name="Smith", birth_date="1990-06-15", hourly_rate=45.00)

# Computed fields appear in serialization
print(person.model_dump())
# {'first_name': 'Alice', 'last_name': 'Smith', 'birth_date': date(1990, 6, 15),
#  'hourly_rate': 45.0, 'full_name': 'Alice Smith', 'age': 34,
#  'annual_salary': 93600.0, 'display_rate': '$45.00/hr'}

# They also appear in JSON output
print(person.model_dump_json())
# {"first_name":"Alice","last_name":"Smith","birth_date":"1990-06-15",
#  "hourly_rate":45.0,"full_name":"Alice Smith","age":34,
#  "annual_salary":93600.0,"display_rate":"$45.00/hr"}`,
              language: 'python',
            },
            {
              title: 'Conditional Computed Fields',
              description: 'Computed fields that depend on model state and optional fields',
              code: `from pydantic import BaseModel, computed_field, Field
from typing import Optional
from datetime import datetime

class Order(BaseModel):
    subtotal: float = Field(ge=0)
    tax_rate: float = Field(ge=0, le=1, default=0.08)
    discount_code: Optional[str] = None
    discount_percent: float = Field(ge=0, le=1, default=0.0)

    @computed_field
    @property
    def discount_amount(self) -> float:
        return round(self.subtotal * self.discount_percent, 2)

    @computed_field
    @property
    def tax_amount(self) -> float:
        taxable = self.subtotal - self.discount_amount
        return round(taxable * self.tax_rate, 2)

    @computed_field
    @property
    def total(self) -> float:
        return round(self.subtotal - self.discount_amount + self.tax_amount, 2)

    @computed_field
    @property
    def has_discount(self) -> bool:
        return self.discount_percent > 0 or self.discount_code is not None

# Order with discount
order = Order(subtotal=100.0, discount_code="SAVE20", discount_percent=0.20)
print(f'Subtotal: \${order.subtotal}')
print(f'Discount: -\${order.discount_amount}')   # -$20.0
print(f'Tax:      +\${order.tax_amount}')         # +$6.4
print(f'Total:     \${order.total}')               # $86.4
print(f"Discount: {order.has_discount}")          # True

# Order without discount
simple = Order(subtotal=50.0)
print(f'Total: \${simple.total}')       # $54.0
print(f"Discount: {simple.has_discount}")  # False`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'data-flow',
            title: 'Computed Field Derivation',
            description: 'How computed fields derive their values from stored fields',
            steps: [
              { label: 'Input fields stored', detail: 'subtotal, tax_rate, discount_code, discount_percent', highlight: false },
              { label: 'discount_amount computed', detail: 'subtotal × discount_percent = 20.0', highlight: true },
              { label: 'tax_amount computed', detail: '(subtotal - discount) × tax_rate = 6.4', highlight: true },
              { label: 'total computed', detail: 'subtotal - discount + tax = 86.4', highlight: true },
              { label: 'has_discount computed', detail: 'discount_percent > 0 or discount_code exists = True', highlight: true },
              { label: 'All fields serialized', detail: 'model_dump() includes both stored and computed fields', highlight: false },
            ],
          },
          tips: [
            'Always combine @computed_field with @property — the property makes it computed lazily, computed_field makes it serializable.',
            'Computed fields are recalculated each time model_dump() is called — they reflect the current state of other fields.',
            'Computed fields are NOT included in model_validate() input — they are output-only fields.',
          ],
          keyTakeaway:
            '@computed_field + @property creates derived fields that appear in serialization and schema but never in input — perfect for display values and derived data.',
        },
        {
          heading: 'Discriminated Unions: Type-Safe Polymorphism',
          content: `Discriminated unions (also called tagged unions) are a pattern where a common field — the "discriminator" — determines which model schema to use for validation. This is essential for APIs that accept different shapes of data depending on a type field, like processing different payment methods, handling different event types, or supporting multiple notification channels.

In Pydantic V2, you define a discriminated union using \`Annotated\` with \`Discriminator\` or by using \`Literal\` types in a Union. The discriminator field must be a Literal type in each variant model, and the values must be unique across variants. When Pydantic sees the discriminator value in the input data, it immediately routes validation to the correct variant model — no need to try each variant sequentially.

This is faster than regular Union validation (which tries each type in order until one succeeds) and produces better error messages (errors reference the specific variant, not "none of the variants matched"). Discriminated unions are also essential for OpenAPI schema generation — they produce the \`oneOf\` construct with a discriminator property, which enables code generators to create proper type hierarchies in client SDKs.`,
          codeExamples: [
            {
              title: 'Discriminated Unions for Event Processing',
              description: 'Type-safe event handling with discriminated unions',
              code: `from pydantic import BaseModel, Field, Tag
from typing import Annotated, Literal, Union

# Each variant has a unique "type" field using Literal
class UserCreatedEvent(BaseModel):
    type: Literal["user_created"] = "user_created"
    user_id: int
    username: str
    email: str

class UserDeletedEvent(BaseModel):
    type: Literal["user_deleted"] = "user_deleted"
    user_id: int
    reason: str

class UserUpdatedEvent(BaseModel):
    type: Literal["user_updated"] = "user_updated"
    user_id: int
    changes: dict[str, str]

# Discriminated union — Pydantic uses "type" to select the right model
Event = Annotated[
    Union[UserCreatedEvent, UserDeletedEvent, UserUpdatedEvent],
    Field(discriminator="type")
]

class EventEnvelope(BaseModel):
    event_id: str
    timestamp: float
    data: Event  # ← Discriminated union field

# Parse a "user_created" event
envelope1 = EventEnvelope.model_validate({
    "event_id": "evt_001",
    "timestamp": 1700000000.0,
    "data": {
        "type": "user_created",
        "user_id": 42,
        "username": "alice",
        "email": "alice@example.com"
    }
})
print(type(envelope1.data))  # <class 'UserCreatedEvent'>
print(envelope1.data.username)  # 'alice'

# Parse a "user_deleted" event
envelope2 = EventEnvelope.model_validate({
    "event_id": "evt_002",
    "timestamp": 1700000001.0,
    "data": {
        "type": "user_deleted",
        "user_id": 42,
        "reason": "Account closure"
    }
})
print(type(envelope2.data))  # <class 'UserDeletedEvent'>
print(envelope2.data.reason)  # 'Account closure'`,
              language: 'python',
            },
            {
              title: 'Discriminated Unions for Payment Processing',
              description: 'A practical e-commerce payment system using discriminated unions',
              code: `from pydantic import BaseModel, Field
from typing import Annotated, Literal, Union

class CreditCardPayment(BaseModel):
    method: Literal["credit_card"] = "credit_card"
    amount: float = Field(gt=0)
    card_number: str = Field(pattern=r"^\\d{16}$")
    expiry_month: int = Field(ge=1, le=12)
    expiry_year: int = Field(ge=2024)

class PayPalPayment(BaseModel):
    method: Literal["paypal"] = "paypal"
    amount: float = Field(gt=0)
    email: str

class CryptoPayment(BaseModel):
    method: Literal["crypto"] = "crypto"
    amount: float = Field(gt=0)
    wallet_address: str
    network: Literal["bitcoin", "ethereum", "solana"]

PaymentMethod = Annotated[
    Union[CreditCardPayment, PayPalPayment, CryptoPayment],
    Field(discriminator="method")
]

class Checkout(BaseModel):
    order_id: str
    payment: PaymentMethod

# Credit card checkout
cc_checkout = Checkout.model_validate({
    "order_id": "ORD-001",
    "payment": {
        "method": "credit_card",
        "amount": 99.99,
        "card_number": "4242424242424242",
        "expiry_month": 12,
        "expiry_year": 2026
    }
})
print(cc_checkout.payment.card_number)  # '4242424242424242'

# Invalid discriminator value
try:
    Checkout.model_validate({
        "order_id": "ORD-002",
        "payment": {"method": "bank_transfer", "amount": 50.0}
    })
except Exception as e:
    print("Unknown payment method rejected")`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'flow',
            title: 'Discriminated Union Resolution',
            description: 'How Pydantic routes to the correct variant based on the discriminator field',
            steps: [
              { label: 'Input data arrives', detail: '{"method": "credit_card", "amount": 99.99, ...}', highlight: false },
              { label: 'Read discriminator field', detail: 'method = "credit_card"', highlight: true },
              { label: 'Route to matching variant', detail: 'CreditCardPayment (Literal["credit_card"])', highlight: true },
              { label: 'Validate variant fields', detail: 'card_number, expiry_month, expiry_year', highlight: false },
              { label: 'Return typed instance', detail: 'CreditCardPayment instance (not generic Union)', highlight: false },
            ],
          },
          tips: [
            'Each variant in a discriminated union must have the discriminator field as a Literal type with a unique value.',
            'Discriminated unions are faster than regular Unions — Pydantic dispatches directly instead of trying each variant.',
            'The discriminator field must be present in the input data — if missing, Pydantic raises a clear error about the missing discriminator.',
          ],
          keyTakeaway:
            'Discriminated unions use a Literal field as a discriminator for type-safe, fast polymorphism — essential for event systems and multi-type APIs.',
        },
        {
          heading: 'Model Validator Patterns for Derived Values',
          content: `While computed fields are great for read-only derived values, sometimes you need to set a field's value during validation based on other fields. Model validators in \`mode="after"\` are perfect for this — they run after all field validation is complete and can modify the model before it is returned.

The pattern is: declare the derived field with a default value, then compute and set it in a model_validator. This is useful when the derived value should be "sticky" (computed once and stored) rather than recalculated on every access, or when the derived value affects the model's equality/hash behavior.

Common patterns include: generating a slug from a title, computing a hash from content, setting a status based on multiple fields, populating a search vector from text fields, and any case where a derived value should be stored rather than computed on-the-fly. The key difference from computed_field is that these values are part of the model's stored state — they appear in equality checks, they can be included/excluded from serialization like any other field, and they are set once during construction rather than recalculated.`,
          codeExamples: [
            {
              title: 'Model Validator for Slug Generation',
              description: 'Auto-generate a URL slug from the title during validation',
              code: `from pydantic import BaseModel, model_validator, Field
import re

class Article(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    slug: str = ""  # Will be auto-generated if not provided
    content: str
    tags: list[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def generate_slug(self):
        """Auto-generate slug from title if not explicitly provided."""
        if not self.slug:
            # Convert title to URL-friendly slug
            slug = self.title.lower()
            slug = re.sub(r"[^a-z0-9]+", "-", slug)
            slug = slug.strip("-")
            self.slug = slug
        return self

# Slug auto-generated from title
article = Article(title="My First Blog Post!", content="Hello world...")
print(article.slug)  # 'my-first-blog-post'

# Explicit slug is preserved
article2 = Article(title="My First Blog Post!", slug="custom-slug", content="Hello world...")
print(article2.slug)  # 'custom-slug'`,
              language: 'python',
            },
          ],
          tips: [
            'Use @computed_field for display-only values that are always derived. Use model_validator for values that should be stored and may be explicitly set.',
            'Model validators can modify the model in-place using self.field = value — computed fields are read-only properties.',
            'For derived values that affect equality or hashing, use model_validator — computed fields don\'t affect equality checks.',
          ],
          keyTakeaway:
            'Use @computed_field for lazy, read-only derived values. Use model_validator for eager, stored derived values that should be part of model state.',
        },
      ],
    },

    // ──────────────────────────────────────────────
    // TOPIC 10: Pydantic Types & Schema Generation
    // ──────────────────────────────────────────────
    {
      id: 'm2-types-schema',
      title: 'Pydantic Types & Schema Generation',
      icon: '📐',
      introduction:
        'Pydantic provides a rich library of specialized types for common validation scenarios — email addresses, URLs, IP addresses, payment card numbers, and constrained numeric types. Combined with automatic JSON Schema generation and seamless OpenAPI integration, these types let you express domain-specific validation with zero custom code.',
      sections: [
        {
          heading: 'Specialized Pydantic Types',
          content: `Beyond basic Python types (str, int, float, bool), Pydantic provides specialized types that encode common validation rules. These types are imported from \`pydantic\` or \`pydantic-extra-types\` and work just like regular types — you use them as field type annotations and Pydantic handles the validation automatically.

The most commonly used specialized types are: \`EmailStr\` (validates email format), \`HttpUrl\` (validates HTTP/HTTPS URLs), \`IPvAnyAddress\` (validates IP addresses), \`PaymentCardNumber\` (validates credit card numbers with Luhn algorithm), \`conint\` (constrained integer with gt/ge/lt/le), \`constr\` (constrained string with min_length/max_length/pattern), and \`condecimal\` (constrained Decimal with precision and bounds).

These types save you from writing regex patterns and custom validators for common formats. Instead of writing a regex for email validation (notoriously difficult to get right), you just use \`EmailStr\`. Instead of implementing the Luhn algorithm for credit card validation, you use \`PaymentCardNumber\`. The validation is battle-tested and edge-case-handled — much more reliable than ad-hoc implementations.

In Pydantic V2, some types have moved to the \`pydantic-extra-types\` package (install separately), while the core types remain in the main \`pydantic\` package. The constrained types (\`conint\`, \`constr\`, etc.) still exist but the recommended approach is to use \`Annotated\` with \`Field()\` constraints instead.`,
          codeExamples: [
            {
              title: 'EmailStr, HttpUrl, and Other Specialized Types',
              description: 'Built-in types that handle common validation formats',
              code: `# pip install pydantic[email] pydantic-extra-types
from pydantic import BaseModel, EmailStr, HttpUrl, Field, ValidationError
from typing import Optional

class UserProfile(BaseModel):
    email: EmailStr                           # Validates email format
    website: Optional[HttpUrl] = None         # Validates URL format
    username: str = Field(min_length=3, max_length=20)

# Valid profile
profile = UserProfile(
    email="alice@example.com",
    website="https://alice.dev",
    username="alice"
)
print(profile.email)    # 'alice@example.com'
print(profile.website)  # Url('https://alice.dev/')

# Invalid email
try:
    UserProfile(email="not-an-email", username="bob")
except ValidationError as e:
    print(e.errors()[0]["msg"])
    # value is not a valid email address

# Invalid URL
try:
    UserProfile(email="bob@example.com", website="not-a-url", username="bob")
except ValidationError as e:
    print(e.errors()[0]["msg"])
    # Input should be a valid URL`,
              language: 'python',
            },
            {
              title: 'Constrained Types: conint, constr, condecimal',
              description: 'Pre-V2 constrained types and their modern Annotated equivalents',
              code: `from pydantic import BaseModel, conint, constr, condecimal, Field
from typing import Annotated
from decimal import Decimal

# ── Legacy constrained types (still work in V2) ──
class LegacyModel(BaseModel):
    age: conint(gt=0, le=150)           # Constrained int
    name: constr(min_length=1, max_length=50)  # Constrained str
    price: condecimal(gt=Decimal("0"), max_digits=10, decimal_places=2)

# ── Modern Annotated approach (recommended in V2) ──
PositiveInt = Annotated[int, Field(gt=0, le=150)]
NonEmptyStr = Annotated[str, Field(min_length=1, max_length=50)]
Price = Annotated[Decimal, Field(gt=0, max_digits=10, decimal_places=2)]

class ModernModel(BaseModel):
    age: PositiveInt
    name: NonEmptyStr
    price: Price

# Both work identically
legacy = LegacyModel(age=25, name="Alice", price=Decimal("9.99"))
modern = ModernModel(age=25, name="Alice", price=Decimal("9.99"))

print(legacy.age)    # 25
print(modern.age)    # 25

# Constraint violations produce clear errors
try:
    ModernModel(age=-5, name="", price=Decimal("0"))
except ValidationError as e:
    for err in e.errors():
        print(f"{err['loc'][0]}: {err['msg']}")`,
              language: 'python',
              output: `age: Input should be greater than 0
name: String should have at least 1 character
price: Input should be greater than 0`,
            },
            {
              title: 'PaymentCardNumber and IP Address Types',
              description: 'Domain-specific types for financial and network validation',
              code: `# pip install pydantic-extra-types
from pydantic import BaseModel, ValidationError
from pydantic_extra_types.payment import PaymentCardNumber
from pydantic import IPvAnyAddress

class PaymentForm(BaseModel):
    card: PaymentCardNumber  # Validates with Luhn algorithm
    amount: float

class NetworkConfig(BaseModel):
    server_ip: IPvAnyAddress  # Accepts IPv4 or IPv6
    port: int

# Valid credit card (passes Luhn check)
payment = PaymentForm(card="4242424242424242", amount=99.99)
print(payment.card.masked)  # '4242 42** **** 4242'

# Invalid card (fails Luhn check)
try:
    PaymentForm(card="1234567890123456", amount=50.0)
except ValidationError as e:
    print(e.errors()[0]["msg"])
    # card number is not a valid card number

# IP address validation
config = NetworkConfig(server_ip="192.168.1.1", port=8080)
print(config.server_ip)  # IPv4Address('192.168.1.1')

# IPv6 also works
config6 = NetworkConfig(server_ip="::1", port=8080)
print(config6.server_ip)  # IPv6Address('::1')

# Invalid IP
try:
    NetworkConfig(server_ip="999.999.999.999", port=8080)
except ValidationError as e:
    print(e.errors()[0]["msg"])`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'comparison',
            title: 'Pydantic Specialized Types Reference',
            description: 'Built-in types for common validation scenarios',
            columns: [
              {
                title: 'Type',
                items: ['EmailStr', 'HttpUrl', 'IPvAnyAddress', 'PaymentCardNumber', 'conint / Annotated[int, Field()]', 'constr / Annotated[str, Field()]', 'condecimal / Annotated[Decimal, Field()]'],
              },
              {
                title: 'Validates',
                items: ['Email format (RFC 5322)', 'HTTP/HTTPS URL', 'IPv4 or IPv6 address', 'Credit card + Luhn check', 'Integer with bounds', 'String with length/pattern', 'Decimal with precision/bounds'],
              },
              {
                title: 'Package',
                items: ['pydantic[email]', 'pydantic (core)', 'pydantic (core)', 'pydantic-extra-types', 'pydantic (core)', 'pydantic (core)', 'pydantic (core)'],
              },
            ],
          },
          tips: [
            'Use Annotated[int, Field(gt=0)] instead of conint(gt=0) — the Annotated approach is the V2 recommended style.',
            'Install pydantic[email] for EmailStr support: pip install "pydantic[email]" — it is not included by default.',
            'PaymentCardNumber requires pydantic-extra-types: pip install pydantic-extra-types — it validates Luhn checksums.',
          ],
          keyTakeaway:
            'Pydantic specialized types (EmailStr, HttpUrl, PaymentCardNumber) replace custom validators for common formats — battle-tested and reliable.',
        },
        {
          heading: 'JSON Schema Generation & OpenAPI Integration',
          content: `One of Pydantic's most powerful features is automatic JSON Schema generation from your models. Every Pydantic model can produce a complete JSON Schema that describes its fields, types, constraints, and metadata. FastAPI uses this feature to generate OpenAPI (Swagger) documentation automatically — every request body, response model, and parameter type is documented from your Pydantic schemas.

The \`model_json_schema()\` method returns a dictionary representing the JSON Schema for the model. This schema includes field types, constraints (minLength, maximum, pattern), descriptions, examples, required fields, and nested model references. The schema is compliant with JSON Schema Draft 2020-12 and integrates with any tool that accepts JSON Schema.

In FastAPI, when you use a Pydantic model as a request body or response_model, FastAPI calls \`model_json_schema()\` internally and embeds the result in the OpenAPI spec. This means your API documentation is always in sync with your code — if you add a field, change a constraint, or add a description, the documentation updates automatically. You never write API docs manually; they are generated from your models.

The schema can also be customized: \`json_schema_extra\` in ConfigDict adds custom fields, \`Field(description=..., examples=[...])\` adds documentation, and \`schema_generator\` allows complete control over the generation process.`,
          codeExamples: [
            {
              title: 'JSON Schema Generation',
              description: 'Generate and inspect JSON Schema from your models',
              code: `from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional
import json

class UserCreate(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "username": "alice_123",
                    "email": "alice@example.com",
                    "age": 25
                }
            ]
        }
    )

    username: str = Field(
        min_length=3,
        max_length=20,
        pattern=r"^[a-zA-Z0-9_]+$",
        description="Unique username"
    )
    email: EmailStr = Field(description="User email address")
    age: int = Field(ge=13, le=120, description="User age")
    bio: Optional[str] = Field(default=None, max_length=500)

# Generate the JSON Schema
schema = UserCreate.model_json_schema()
print(json.dumps(schema, indent=2))`,
              language: 'python',
              output: `{
  "properties": {
    "username": {
      "description": "Unique username",
      "maxLength": 20,
      "minLength": 3,
      "pattern": "^[a-zA-Z0-9_]+$",
      "title": "Username",
      "type": "string"
    },
    "email": {
      "description": "User email address",
      "format": "email",
      "title": "Email",
      "type": "string"
    },
    "age": {
      "description": "User age",
      "maximum": 120,
      "minimum": 13,
      "title": "Age",
      "type": "integer"
    },
    "bio": {
      "anyOf": [
        { "maxLength": 500, "type": "string" },
        { "type": "null" }
      ],
      "default": null,
      "title": "Bio"
    }
  },
  "required": ["username", "email", "age"],
  "title": "UserCreate",
  "type": "object",
  "examples": [{"username": "alice_123", "email": "alice@example.com", "age": 25}]
}`,
            },
            {
              title: 'FastAPI OpenAPI Integration',
              description: 'How Pydantic models become OpenAPI documentation in FastAPI',
              code: `from fastapi import FastAPI
from pydantic import BaseModel, Field, EmailStr
from typing import Optional

app = FastAPI(title="User API", version="1.0.0")

class UserCreate(BaseModel):
    """Schema for creating a new user."""
    username: str = Field(min_length=3, max_length=20, description="Unique username")
    email: EmailStr = Field(description="User email address")
    age: int = Field(ge=13, le=120, description="User age")
    bio: Optional[str] = Field(default=None, max_length=500)

class UserResponse(BaseModel):
    """Schema returned after user creation."""
    id: int
    username: str
    email: EmailStr

@app.post("/users", response_model=UserResponse, summary="Create a user")
async def create_user(user: UserCreate):
    """
    Create a new user account.

    The request body is automatically validated against UserCreate.
    The response is automatically serialized using UserResponse.
    Both schemas appear in the OpenAPI documentation at /docs.
    """
    # In a real app, save to database
    return UserResponse(id=1, username=user.username, email=user.email)

# What FastAPI does automatically:
# 1. UserCreate.model_json_schema() → request body in OpenAPI spec
# 2. UserResponse.model_json_schema() → response body in OpenAPI spec
# 3. Field descriptions → parameter descriptions in Swagger UI
# 4. Constraints → validation in Swagger UI "Try it out"
# 5. Examples → pre-filled values in Swagger UI

# Visit /docs to see the full interactive documentation
# Visit /openapi.json to see the raw OpenAPI schema`,
              language: 'python',
            },
          ],
          visualization: {
            type: 'flow',
            title: 'From Pydantic Model to API Documentation',
            description: 'How Pydantic models flow through FastAPI to become OpenAPI docs',
            steps: [
              { label: 'Define Pydantic model', detail: 'class UserCreate(BaseModel): username: str = Field(...)', highlight: false },
              { label: 'Use in FastAPI endpoint', detail: '@app.post("/users") def create(user: UserCreate)', highlight: false },
              { label: 'FastAPI calls model_json_schema()', detail: 'Generates JSON Schema for request/response', highlight: true },
              { label: 'Schema embedded in OpenAPI spec', detail: 'At /openapi.json with all constraints and descriptions', highlight: true },
              { label: 'Swagger UI renders docs', detail: 'At /docs with forms, examples, and validation', highlight: true },
              { label: 'ReDoc renders alt docs', detail: 'At /redoc with a different visual layout', highlight: false },
            ],
          },
          tips: [
            'Add Field(description=...) to all API-facing fields — these become parameter descriptions in Swagger UI.',
            'Use json_schema_extra in ConfigDict to add top-level examples that appear in the "Try it out" form.',
            'Visit /openapi.json to see the raw schema — useful for debugging documentation issues.',
          ],
          keyTakeaway:
            'Pydantic models automatically generate JSON Schema, which FastAPI embeds in OpenAPI — your documentation is always in sync with your code.',
        },
        {
          heading: 'V1 to V2 Migration: Complete Guide',
          content: `Migrating from Pydantic V1 to V2 is the most significant breaking change in the Pydantic ecosystem. While the core concepts remain the same, the API has been substantially redesigned for consistency, performance, and correctness. Understanding the migration path is essential for teams with existing V1 codebases.

The major changes fall into several categories: **method renames** (\`.dict()\` → \`.model_dump()\`, \`.parse_obj()\` → \`.model_validate()\`), **validator changes** (\`@validator\` → \`@field_validator\`, \`@root_validator\` → \`@model_validator\`), **configuration changes** (\`class Config\` → \`model_config = ConfigDict(...)\`), **type changes** (\`Optional[X]\` behavior, \`Union\` validation order), and **removed features** (\`.construct()\` semantics, \`__fields_set__\` → \`.pydantic_fields_set__\`).

Pydantic provides a migration tool (\`bump-pydantic\`) that automates much of the mechanical renaming. Install it with \`pip install bump-pydantic\` and run it against your codebase. It handles method renames, validator signature updates, and configuration migration. However, it cannot handle semantic changes — places where the behavior changed even though the API looks similar. For these, you need to understand the differences and manually adjust your code.

The most common runtime gotchas are: Union validation now tries types in order (previously it tried the "best" match), Optional fields without defaults are still required, and custom validators must use the new signature with mode parameter. Test thoroughly after migration.`,
          codeExamples: [
            {
              title: 'Complete V1 → V2 Migration Example',
              description: 'A full model migrated from V1 to V2 with every change documented',
              code: `# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PYDANTIC V1 (BEFORE)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# from pydantic import BaseModel, validator, root_validator
#
# class UserV1(BaseModel):
#     name: str
#     email: str
#     age: int
#     role: str = "user"
#
#     class Config:
#         orm_mode = True
#         extra = "forbid"
#         schema_extra = {"example": {"name": "Alice"}}
#
#     @validator("name")
#     def name_must_not_be_empty(cls, v):
#         if not v.strip():
#             raise ValueError("name cannot be empty")
#         return v.strip()
#
#     @validator("email")
#     def email_must_contain_at(cls, v):
#         if "@" not in v:
#             raise ValueError("email must contain @")
#         return v
#
#     @root_validator
#     def check_admin_age(cls, values):
#         if values.get("role") == "admin" and values.get("age", 0) < 18:
#             raise ValueError("admin must be 18+")
#         return values

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PYDANTIC V2 (AFTER)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
from pydantic import BaseModel, field_validator, model_validator, ConfigDict, Field

class UserV2(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,           # was: orm_mode = True
        extra="forbid",                 # same name
        json_schema_extra={             # was: schema_extra
            "examples": [{"name": "Alice", "email": "a@b.com", "age": 25}]
        }
    )

    name: str = Field(min_length=1)     # Constraint moved to Field
    email: str = Field(pattern=r".+@.+")  # Pattern replaces validator
    age: int = Field(ge=0)
    role: str = "user"

    @field_validator("name", mode="before")   # was: @validator("name")
    @classmethod                               # was: just "cls" convention
    def name_must_not_be_empty(cls, v):
        if isinstance(v, str) and not v.strip():
            raise ValueError("name cannot be empty")
        return v.strip()

    @model_validator(mode="after")            # was: @root_validator
    def check_admin_age(self):                # was: def check_admin_age(cls, values)
        if self.role == "admin" and self.age < 18:
            raise ValueError("admin must be 18+")
        return self                           # Must return self

# ── Method changes ──────────────────────────────
user = UserV2(name="Alice", email="alice@example.com", age=25)

# V1: user.dict()              → V2: user.model_dump()
# V1: user.json()              → V2: user.model_dump_json()
# V1: User.parse_obj(data)     → V2: User.model_validate(data)
# V1: User.parse_raw(json_str) → V2: User.model_validate_json(json_str)
# V1: User.schema()            → V2: User.model_json_schema()
# V1: user.__fields_set__      → V2: user.model_fields_set

print(user.model_dump())
# {'name': 'Alice', 'email': 'alice@example.com', 'age': 25, 'role': 'user'}
print(user.model_fields_set)
# {'name', 'email', 'age'}`,
              language: 'python',
            },
            {
              title: 'Automated Migration with bump-pydantic',
              description: 'Use the official migration tool to automate mechanical changes',
              code: `# Step 1: Install the migration tool
# pip install bump-pydantic

# Step 2: Run it against your codebase
# bump-pydantic .

# What it automatically migrates:
# ✅ .dict() → .model_dump()
# ✅ .json() → .model_dump_json()
# ✅ .parse_obj() → .model_validate()
# ✅ .parse_raw() → .model_validate_json()
# ✅ .parse_file() → .model_validate_json()
# ✅ .schema() → .model_json_schema()
# ✅ class Config → model_config = ConfigDict(...)
# ✅ @validator → @field_validator (with mode parameter)
# ✅ @root_validator → @model_validator (with mode parameter)
# ✅ Optional[X] annotations (adds = None where needed)
# ✅ __fields_set__ → model_fields_set
# ✅ .construct() → .model_construct()

# Step 3: Handle semantic changes manually
# ⚠️ Union validation order changed (now left-to-right)
# ⚠️ Optional[X] without = None is still required
# ⚠️ validator signatures changed (must use @classmethod)
# ⚠️ root_validator receives model instance, not dict
# ⚠️ Error message format changed
# ⚠️ Some Config options renamed (orm_mode → from_attributes)

# Step 4: Run your test suite
# pytest -x  # Stop on first failure to debug

# Step 5: Check for deprecation warnings
# python -W all -m pytest`,
              language: 'bash',
            },
          ],
          visualization: {
            type: 'comparison',
            title: 'V1 → V2 Migration Quick Reference',
            description: 'The most important API changes from V1 to V2',
            columns: [
              {
                title: 'Category',
                items: ['Serialization', 'Parsing', 'Schema', 'Validation', 'Config', 'Types', 'Internal'],
              },
              {
                title: 'V1',
                items: ['.dict(), .json()', '.parse_obj(), .parse_raw()', '.schema()', '@validator, @root_validator', 'class Config:', 'conint(), constr()', '__fields_set__'],
              },
              {
                title: 'V2',
                items: ['.model_dump(), .model_dump_json()', '.model_validate(), .model_validate_json()', '.model_json_schema()', '@field_validator, @model_validator', 'model_config = ConfigDict()', 'Annotated[int, Field(gt=0)]', '.model_fields_set'],
              },
            ],
          },
          tips: [
            'Run bump-pydantic first for mechanical changes, then manually review semantic differences — don\'t skip the manual review.',
            'The most common post-migration bug: Optional[X] without = None is now required — add = None to all truly optional fields.',
            'Union types now validate left-to-right — if Union[str, int] always returns str, switch to Union[int, str].',
          ],
          warning:
            'V1 → V2 migration has semantic changes that automated tools cannot detect. Always run your full test suite after migration and review any differences.',
          keyTakeaway:
            'Use bump-pydantic for mechanical migration, then manually review: Union order, Optional defaults, validator signatures, and Config renames.',
        },
      ],
    },
  ],
};
