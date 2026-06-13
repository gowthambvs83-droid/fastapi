'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { SimulationType } from '@/lib/curriculum/types';

// ─── Types ───────────────────────────────────────────────────────────

interface SimStep {
  id: string;
  label: string;
  description: string;
  detail: string;
}

interface SimulationConfig {
  title: string;
  description: string;
  steps: SimStep[];
  stepDelay: number;
  layout: 'horizontal' | 'vertical' | 'hub-spoke';
}

// ─── Simulation Configurations ───────────────────────────────────────

const SIMULATION_CONFIGS: Record<SimulationType, SimulationConfig> = {
  HTTP_REQUEST_FLOW: {
    title: 'HTTP Request Flow',
    description:
      'Watch an HTTP request travel from the client through DNS, the server, middleware, and route validation to the handler and back.',
    stepDelay: 1400,
    layout: 'horizontal',
    steps: [
      {
        id: 'client',
        label: 'Client',
        description: 'Request initiated',
        detail:
          'User initiates an HTTP GET request to api.example.com/users. The browser checks its cache and prepares the request with headers (Accept, User-Agent, etc.).',
      },
      {
        id: 'dns',
        label: 'DNS',
        description: 'DNS resolution',
        detail:
          'DNS resolves api.example.com to IP 203.0.113.42. The browser first checks its local cache, then queries the recursive resolver, which contacts the authoritative nameserver.',
      },
      {
        id: 'server',
        label: 'Server',
        description: 'Server receives request',
        detail:
          'The server (Uvicorn) accepts the TCP connection. TLS handshake completes if HTTPS. The raw HTTP bytes are received and parsed into a request object.',
      },
      {
        id: 'middleware',
        label: 'Middleware',
        description: 'Middleware processing',
        detail:
          'CORS, authentication, rate limiting, and logging middleware run in sequence. Each can short-circuit the request or modify it before passing it along.',
      },
      {
        id: 'route',
        label: 'Router',
        description: 'Route matching',
        detail:
          'FastAPI\'s router matches the URL path "/users" and HTTP method GET to the registered route handler. Path and query parameters are extracted.',
      },
      {
        id: 'validation',
        label: 'Validation',
        description: 'Request validation',
        detail:
          'Pydantic validates query parameters, headers, and request body against the declared types. Invalid data triggers an automatic 422 response.',
      },
      {
        id: 'handler',
        label: 'Handler',
        description: 'Business logic',
        detail:
          'The route handler executes business logic — querying the database, applying filters, and processing the result. Dependencies are injected via FastAPI\'s DI system.',
      },
      {
        id: 'response',
        label: 'Response',
        description: 'Response returned',
        detail:
          'The handler returns data which is serialized to JSON by Pydantic. The response travels back through middleware, and the server sends HTTP 200 with the JSON body.',
      },
    ],
  },

  JWT_LIFECYCLE: {
    title: 'JWT Lifecycle',
    description:
      'Follow the complete lifecycle of a JWT token — from user login, through token creation and storage, to verification and access control.',
    stepDelay: 1600,
    layout: 'vertical',
    steps: [
      {
        id: 'login',
        label: 'User Login',
        description: 'Credentials submitted',
        detail:
          'User submits email and password via POST /auth/login over HTTPS. The request body contains { "email": "user@example.com", "password": "••••••••" }.',
      },
      {
        id: 'create-jwt',
        label: 'Server Creates JWT',
        description: 'Token generated & signed',
        detail:
          'Server verifies credentials against the database, then creates a JWT with HS256. Payload: { sub: "user_42", role: "admin", exp: now+3600 }. Signed with the server secret.',
      },
      {
        id: 'store-token',
        label: 'Client Stores Token',
        description: 'Token saved client-side',
        detail:
          'Client receives the JWT in the response body and stores it — typically in memory or a secure httpOnly cookie. The token is now available for subsequent authenticated requests.',
      },
      {
        id: 'bearer-request',
        label: 'Request with Bearer Token',
        description: 'Authenticated request sent',
        detail:
          'Client sends a new request to a protected endpoint with the header: Authorization: Bearer eyJhbGciOiJIUzI1NiIs... The token travels with every subsequent request.',
      },
      {
        id: 'verify-jwt',
        label: 'Server Verifies JWT',
        description: 'Signature & claims validated',
        detail:
          'Server extracts the token, verifies the HMAC-SHA256 signature using the secret key, checks the exp claim for expiration, and validates the sub and role claims.',
      },
      {
        id: 'access-granted',
        label: 'Access Granted',
        description: 'Request authorized ✓',
        detail:
          'Token is valid! The user identity (user_42, admin role) is injected into the request context via FastAPI dependency injection. The protected handler processes the request.',
      },
      {
        id: 'access-denied',
        label: 'Access Denied',
        description: 'Invalid or expired token ✗',
        detail:
          'If the token is expired, tampered with, or the signature is invalid, the server returns 401 Unauthorized. The client must re-authenticate to get a new token.',
      },
    ],
  },

  DATABASE_QUERY: {
    title: 'Database Query Pipeline',
    description:
      'Trace a database query from the API handler through SQLAlchemy ORM, connection pool, and PostgreSQL to the final serialized response.',
    stepDelay: 1200,
    layout: 'horizontal',
    steps: [
      {
        id: 'api-request',
        label: 'API Request',
        description: 'GET /users received',
        detail:
          'FastAPI receives GET /users. The route handler is called with an injected database session from the dependency injection system.',
      },
      {
        id: 'session',
        label: 'SQLAlchemy Session',
        description: 'Session created',
        detail:
          'A new SQLAlchemy Session is created via the sessionmaker. The session manages the unit of work pattern and tracks object changes.',
      },
      {
        id: 'query-build',
        label: 'Query Construction',
        description: 'ORM query built',
        detail:
          'db.execute(select(User).where(User.active == True)) — SQLAlchemy constructs the SQL from the ORM expression tree without hitting the database yet.',
      },
      {
        id: 'db-execute',
        label: 'Database Execution',
        description: 'SQL executed',
        detail:
          'The constructed SQL "SELECT * FROM users WHERE active=true" is sent to PostgreSQL. The query planner chooses an Index Scan on idx_users_active.',
      },
      {
        id: 'result-map',
        label: 'Result Mapping',
        description: 'Rows → Objects',
        detail:
          'SQLAlchemy maps the returned rows to ORM objects. 42 User instances are created and attached to the session identity map for uniqueness guarantees.',
      },
      {
        id: 'response',
        label: 'JSON Response',
        description: '200 OK returned',
        detail:
          'Pydantic serializes the User objects with the response_model schema. FastAPI returns HTTP 200 with JSON body. Total handler time: ~20ms.',
      },
    ],
  },

  WEBSOCKET_FLOW: {
    title: 'WebSocket Communication',
    description:
      'See how WebSocket connections are established and how messages flow bidirectionally between client and server in real time.',
    stepDelay: 1400,
    layout: 'hub-spoke',
    steps: [
      {
        id: 'connect',
        label: 'Client Connects',
        description: 'WS connection initiated',
        detail:
          'Client creates a new WebSocket connection: new WebSocket("wss://api.example.com/ws"). The browser initiates the HTTP upgrade request.',
      },
      {
        id: 'handshake',
        label: 'Handshake',
        description: 'Upgrade confirmed',
        detail:
          'Server receives the HTTP Upgrade request and responds with 101 Switching Protocols. The connection is now upgraded from HTTP to WebSocket. Full-duplex communication begins.',
      },
      {
        id: 'message-exchange',
        label: 'Message Exchange',
        description: 'Bidirectional messages',
        detail:
          'Client sends: {"type": "chat", "content": "Hello!"}. Server receives, processes, and can push messages back at any time. No request-response cycle needed.',
      },
      {
        id: 'broadcasting',
        label: 'Broadcasting',
        description: 'Message to all clients',
        detail:
          'Server broadcasts the message to all connected clients in the same room/channel. Each client receives: {"from": "user_42", "content": "Hello!"} in real time.',
      },
      {
        id: 'disconnect',
        label: 'Disconnect',
        description: 'Connection closed',
        detail:
          'Either side can close the connection with a close frame (code 1000 for normal). The server cleans up resources and removes the client from the active connections list.',
      },
    ],
  },

  MIDDLEWARE_CHAIN: {
    title: 'Middleware Chain',
    description:
      'Watch a request pass through middleware layers — CORS, Auth, Rate Limiting, and Logging — each can reject it before it reaches the handler.',
    stepDelay: 1300,
    layout: 'horizontal',
    steps: [
      {
        id: 'request',
        label: 'Request',
        description: 'Incoming request',
        detail:
          'An HTTP request arrives at the FastAPI application. It carries headers like Origin, Authorization, and X-Forwarded-For that each middleware will inspect.',
      },
      {
        id: 'cors',
        label: 'CORS',
        description: 'Origin check',
        detail:
          'CORS middleware checks the Origin header against the allowed origins list. Adds Access-Control-Allow-Origin, Allow-Methods, and Allow-Headers. Preflight OPTIONS requests are handled here. Can reject with 403.',
      },
      {
        id: 'auth',
        label: 'Auth',
        description: 'Token verification',
        detail:
          'Authentication middleware extracts the JWT from the Authorization header, verifies the signature and expiration. If valid, injects the user identity into request.state. Can reject with 401.',
      },
      {
        id: 'rate-limit',
        label: 'Rate Limit',
        description: 'Throttle check',
        detail:
          'Rate limiter checks the request count per client IP in a sliding window (100 req/min). Uses a Redis counter for distributed rate limiting. Can reject with 429 Too Many Requests.',
      },
      {
        id: 'logging',
        label: 'Logging',
        description: 'Request logged',
        detail:
          'Logging middleware records the request method, path, client IP, and timestamp. Structured JSON logs are emitted for the observability pipeline (ELK, Datadog, etc.).',
      },
      {
        id: 'handler',
        label: 'Route Handler',
        description: 'Business logic',
        detail:
          'All middleware checks passed! The route handler executes business logic and returns a response. The response travels back through the middleware chain in reverse order.',
      },
      {
        id: 'response',
        label: 'Response',
        description: 'Response returned',
        detail:
          'The response passes back through logging (records status code + timing), rate limit (no-op), auth (no-op), and CORS (adds headers). The final HTTP response is sent to the client.',
      },
    ],
  },
};

// ─── SVG Icon Components ─────────────────────────────────────────────

function SvgIconMonitor({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <line x1="8" x2="16" y1="21" y2="21" />
      <line x1="12" x2="12" y1="17" y2="21" />
    </svg>
  );
}

function SvgIconGlobe({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}

function SvgIconServer({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="8" x="2" y="2" rx="2" ry="2" />
      <rect width="20" height="8" x="2" y="14" rx="2" ry="2" />
      <line x1="6" x2="6.01" y1="6" y2="6" />
      <line x1="6" x2="6.01" y1="18" y2="18" />
    </svg>
  );
}

function SvgIconShield({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function SvgIconLock({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function SvgIconZap({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
    </svg>
  );
}

function SvgIconDatabase({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </svg>
  );
}

function SvgIconUsers({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function SvgIconKey({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="m21 2-9.6 9.6" />
      <path d="m15.5 7.5 3 3L22 7l-3-3" />
    </svg>
  );
}

function SvgIconWifi({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h.01" />
      <path d="M8.5 16.5a5 5 0 0 1 7 0" />
      <path d="M5 13a10 10 0 0 1 14 0" />
      <path d="M1.5 9.5a15 15 0 0 1 21 0" />
    </svg>
  );
}

function SvgIconLayers({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
      <path d="m22.54 12.43-1.97-.9-8.57 3.91a2 2 0 0 1-1.66 0l-8.58-3.9-1.97.9a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.91a1 1 0 0 0 0-1.83Z" />
    </svg>
  );
}

function SvgIconRoute({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="19" r="3" />
      <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
      <circle cx="18" cy="5" r="3" />
    </svg>
  );
}

function SvgIconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function SvgIconX({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

// ─── Step Icon Mapping ───────────────────────────────────────────────

function getStepIcon(stepId: string, className: string): React.ReactNode {
  const iconMap: Record<string, React.ReactNode> = {
    client: <SvgIconMonitor className={className} />,
    dns: <SvgIconGlobe className={className} />,
    server: <SvgIconServer className={className} />,
    middleware: <SvgIconLayers className={className} />,
    route: <SvgIconRoute className={className} />,
    validation: <SvgIconShield className={className} />,
    handler: <SvgIconZap className={className} />,
    response: <SvgIconCheck className={className} />,
    login: <SvgIconUsers className={className} />,
    'create-jwt': <SvgIconLock className={className} />,
    'store-token': <SvgIconShield className={className} />,
    'bearer-request': <SvgIconKey className={className} />,
    'verify-jwt': <SvgIconShield className={className} />,
    'access-granted': <SvgIconCheck className={className} />,
    'access-denied': <SvgIconX className={className} />,
    'api-request': <SvgIconMonitor className={className} />,
    session: <SvgIconDatabase className={className} />,
    'query-build': <SvgIconLayers className={className} />,
    'db-execute': <SvgIconDatabase className={className} />,
    'result-map': <SvgIconLayers className={className} />,
    connect: <SvgIconWifi className={className} />,
    handshake: <SvgIconShield className={className} />,
    'message-exchange': <SvgIconZap className={className} />,
    broadcasting: <SvgIconWifi className={className} />,
    disconnect: <SvgIconX className={className} />,
    request: <SvgIconMonitor className={className} />,
    cors: <SvgIconShield className={className} />,
    auth: <SvgIconLock className={className} />,
    'rate-limit': <SvgIconZap className={className} />,
    logging: <SvgIconLayers className={className} />,
  };
  return iconMap[stepId] ?? <SvgIconServer className={className} />;
}

// ─── Inline SVG Flow Renderer ────────────────────────────────────────

function FlowVisualization({
  steps,
  currentStep,
  completedSteps,
  simulationType,
}: {
  steps: SimStep[];
  currentStep: number;
  completedSteps: Set<number>;
  simulationType: SimulationType;
}) {
  const isLastStepDenied = simulationType === 'JWT_LIFECYCLE' && currentStep === steps.length - 1;
  const isHubSpoke = simulationType === 'WEBSOCKET_FLOW';

  // Hub-and-spoke layout for WebSocket
  if (isHubSpoke) {
    const nodeW = 100;
    const nodeH = 48;
    const svgW = 420;
    const svgH = 320;

    // Position: Client at top center, Server in middle, Broadcast clients at bottom
    const clientPos = { x: svgW / 2 - nodeW / 2, y: 16 };
    const serverPos = { x: svgW / 2 - nodeW / 2, y: 136 };
    const clientBPos = { x: 16, y: 256 };
    const clientCPos = { x: svgW / 2 - nodeW / 2, y: 256 };
    const clientDPos = { x: svgW - nodeW - 16, y: 256 };

    const nodePositions = [clientPos, serverPos, clientBPos, clientCPos, clientDPos];

    // Connection lines
    const connections = [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 1, to: 3 },
      { from: 1, to: 4 },
    ];

    // Animated dots on connections
    const activeConnectionIdx = currentStep > 0 ? currentStep - 1 : -1;

    return (
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        className="w-full max-w-md mx-auto"
        role="img"
        aria-label="WebSocket flow visualization"
      >
        <defs>
          <filter id="sim-glow-filter">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#475569" />
          </marker>
          <marker id="arrowhead-teal" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#2dd4bf" />
          </marker>
        </defs>

        {/* Connection lines */}
        {connections.map((conn, i) => {
          const fromCenter = {
            x: nodePositions[conn.from].x + nodeW / 2,
            y: nodePositions[conn.from].y + nodeH,
          };
          const toCenter = {
            x: nodePositions[conn.to].x + nodeW / 2,
            y: nodePositions[conn.to].y,
          };
          const isActive = activeConnectionIdx === i;
          return (
            <line
              key={`conn-${i}`}
              x1={fromCenter.x}
              y1={fromCenter.y}
              x2={toCenter.x}
              y2={toCenter.y}
              stroke={isActive ? '#2dd4bf' : '#334155'}
              strokeWidth={isActive ? 2 : 1.5}
              markerEnd={isActive ? 'url(#arrowhead-teal)' : 'url(#arrowhead)'}
              className="transition-all duration-300"
            />
          );
        })}

        {/* Animated packet dot */}
        {currentStep > 0 && currentStep <= 4 && (() => {
          const connIdx = Math.min(currentStep - 1, connections.length - 1);
          const conn = connections[connIdx];
          const fromCenter = {
            x: nodePositions[conn.from].x + nodeW / 2,
            y: nodePositions[conn.from].y + nodeH,
          };
          const toCenter = {
            x: nodePositions[conn.to].x + nodeW / 2,
            y: nodePositions[conn.to].y,
          };
          return (
            <circle r="4" fill="#2dd4bf" filter="url(#sim-glow-filter)">
              <animate
                attributeName="cx"
                from={fromCenter.x}
                to={toCenter.x}
                dur="0.8s"
                begin="0s"
                fill="freeze"
              />
              <animate
                attributeName="cy"
                from={fromCenter.y}
                to={toCenter.y}
                dur="0.8s"
                begin="0s"
                fill="freeze"
              />
              <animate
                attributeName="opacity"
                values="0;1;1;0"
                keyTimes="0;0.1;0.8;1"
                dur="0.8s"
                begin="0s"
                fill="freeze"
              />
            </circle>
          );
        })()}

        {/* Nodes */}
        {steps.map((step, i) => {
          const pos = nodePositions[i];
          const isActive = currentStep === i;
          const isCompleted = completedSteps.has(i);
          const fillColor = isActive
            ? 'rgba(20, 184, 166, 0.15)'
            : isCompleted
              ? 'rgba(16, 185, 129, 0.1)'
              : 'rgba(30, 41, 59, 0.8)';
          const strokeColor = isActive
            ? '#14b8a6'
            : isCompleted
              ? '#10b981'
              : '#334155';
          const textColor = isActive
            ? '#5eead4'
            : isCompleted
              ? '#6ee7b7'
              : '#94a3b8';

          return (
            <g key={step.id}>
              {/* Glow effect for active node */}
              {isActive && (
                <rect
                  x={pos.x - 2}
                  y={pos.y - 2}
                  width={nodeW + 4}
                  height={nodeH + 4}
                  rx="10"
                  fill="none"
                  stroke="#14b8a6"
                  strokeWidth="1"
                  opacity="0.5"
                  className="sim-pulse"
                />
              )}
              <rect
                x={pos.x}
                y={pos.y}
                width={nodeW}
                height={nodeH}
                rx="8"
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={isActive ? 2 : 1.5}
                className="transition-all duration-300"
              />
              <text
                x={pos.x + nodeW / 2}
                y={pos.y + nodeH / 2 + 4}
                textAnchor="middle"
                fill={textColor}
                fontSize="11"
                fontWeight="600"
                fontFamily="system-ui, sans-serif"
                className="transition-all duration-300"
              >
                {step.label}
              </text>
              {/* Step number badge */}
              <circle
                cx={pos.x + nodeW - 4}
                cy={pos.y + 4}
                r="8"
                fill={isActive ? '#14b8a6' : isCompleted ? '#10b981' : '#475569'}
              />
              <text
                x={pos.x + nodeW - 4}
                y={pos.y + 7.5}
                textAnchor="middle"
                fill="white"
                fontSize="8"
                fontWeight="700"
                fontFamily="system-ui, sans-serif"
              >
                {i + 1}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  // Standard horizontal/vertical layout
  const isVertical = simulationType === 'JWT_LIFECYCLE';
  const nodeW = 88;
  const nodeH = 52;
  const gapX = 24;
  const gapY = 20;

  if (isVertical) {
    const svgW = 320;
    const svgH = steps.length * (nodeH + gapY) - gapY + 32;
    const cx = svgW / 2 - nodeW / 2;

    return (
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        className="w-full max-w-sm mx-auto"
        role="img"
        aria-label={`${simulationType} visualization`}
      >
        <defs>
          <filter id="sim-glow-v">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <marker id="arrowhead-v" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#475569" />
          </marker>
          <marker id="arrowhead-teal-v" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#2dd4bf" />
          </marker>
        </defs>

        {steps.map((step, i) => {
          const y = 16 + i * (nodeH + gapY);
          const isActive = currentStep === i;
          const isCompleted = completedSteps.has(i);
          const isDenied = step.id === 'access-denied' && isActive;

          const fillColor = isDenied
            ? 'rgba(239, 68, 68, 0.15)'
            : isActive
              ? 'rgba(20, 184, 166, 0.15)'
              : isCompleted
                ? 'rgba(16, 185, 129, 0.1)'
                : 'rgba(30, 41, 59, 0.8)';
          const strokeColor = isDenied
            ? '#ef4444'
            : isActive
              ? '#14b8a6'
              : isCompleted
                ? '#10b981'
                : '#334155';
          const textColor = isDenied
            ? '#f87171'
            : isActive
              ? '#5eead4'
              : isCompleted
                ? '#6ee7b7'
                : '#94a3b8';

          return (
            <g key={step.id}>
              {/* Arrow between nodes */}
              {i > 0 && (
                <>
                  <line
                    x1={cx + nodeW / 2}
                    y1={16 + (i - 1) * (nodeH + gapY) + nodeH}
                    x2={cx + nodeW / 2}
                    y2={y - 2}
                    stroke={isActive ? '#14b8a6' : '#334155'}
                    strokeWidth={1.5}
                    markerEnd={isActive ? 'url(#arrowhead-teal-v)' : 'url(#arrowhead-v)'}
                    className="transition-all duration-300"
                  />
                  {/* Animated dot traveling down */}
                  {isActive && (
                    <circle r="3" fill="#2dd4bf" filter="url(#sim-glow-v)">
                      <animate
                        attributeName="cx"
                        from={cx + nodeW / 2}
                        to={cx + nodeW / 2}
                        dur="0.6s"
                        fill="freeze"
                      />
                      <animate
                        attributeName="cy"
                        from={16 + (i - 1) * (nodeH + gapY) + nodeH}
                        to={y - 2}
                        dur="0.6s"
                        fill="freeze"
                      />
                      <animate
                        attributeName="opacity"
                        values="0;1;1;0"
                        keyTimes="0;0.1;0.8;1"
                        dur="0.6s"
                        fill="freeze"
                      />
                    </circle>
                  )}
                </>
              )}

              {/* Glow for active */}
              {isActive && (
                <rect
                  x={cx - 2}
                  y={y - 2}
                  width={nodeW + 4}
                  height={nodeH + 4}
                  rx="10"
                  fill="none"
                  stroke={isDenied ? '#ef4444' : '#14b8a6'}
                  strokeWidth="1"
                  opacity="0.5"
                  className="sim-pulse"
                />
              )}

              <rect
                x={cx}
                y={y}
                width={nodeW}
                height={nodeH}
                rx="8"
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={isActive ? 2 : 1.5}
                className="transition-all duration-300"
              />
              <text
                x={cx + nodeW / 2}
                y={y + nodeH / 2 + 4}
                textAnchor="middle"
                fill={textColor}
                fontSize="11"
                fontWeight="600"
                fontFamily="system-ui, sans-serif"
                className="transition-all duration-300"
              >
                {step.label}
              </text>
              {/* Step number */}
              <circle
                cx={cx + nodeW - 2}
                cy={y + 4}
                r="8"
                fill={isDenied ? '#ef4444' : isActive ? '#14b8a6' : isCompleted ? '#10b981' : '#475569'}
              />
              <text
                x={cx + nodeW - 2}
                y={y + 7.5}
                textAnchor="middle"
                fill="white"
                fontSize="8"
                fontWeight="700"
                fontFamily="system-ui, sans-serif"
              >
                {i + 1}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  // Horizontal layout
  const totalW = steps.length * nodeW + (steps.length - 1) * gapX + 32;
  const svgH_h = nodeH + 40;

  return (
    <svg
      viewBox={`0 0 ${totalW} ${svgH_h}`}
      className="w-full overflow-visible"
      role="img"
      aria-label={`${simulationType} visualization`}
      style={{ minWidth: `${Math.min(steps.length * 70, 800)}px` }}
    >
      <defs>
        <filter id="sim-glow-h">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <marker id="arrowhead-h" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#475569" />
        </marker>
        <marker id="arrowhead-teal-h" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#2dd4bf" />
        </marker>
      </defs>

      {steps.map((step, i) => {
        const x = 16 + i * (nodeW + gapX);
        const y = 16;
        const isActive = currentStep === i;
        const isCompleted = completedSteps.has(i);

        const fillColor = isActive
          ? 'rgba(20, 184, 166, 0.15)'
          : isCompleted
            ? 'rgba(16, 185, 129, 0.1)'
            : 'rgba(30, 41, 59, 0.8)';
        const strokeColor = isActive
          ? '#14b8a6'
          : isCompleted
            ? '#10b981'
            : '#334155';
        const textColor = isActive
          ? '#5eead4'
          : isCompleted
            ? '#6ee7b7'
            : '#94a3b8';

        return (
          <g key={step.id}>
            {/* Arrow between nodes */}
            {i > 0 && (
              <>
                <line
                  x1={16 + (i - 1) * (nodeW + gapX) + nodeW}
                  y1={y + nodeH / 2}
                  x2={x - 2}
                  y2={y + nodeH / 2}
                  stroke={isActive ? '#14b8a6' : '#334155'}
                  strokeWidth={1.5}
                  markerEnd={isActive ? 'url(#arrowhead-teal-h)' : 'url(#arrowhead-h)'}
                  className="transition-all duration-300"
                />
                {/* Animated packet dot */}
                {isActive && (
                  <circle r="3" fill="#2dd4bf" filter="url(#sim-glow-h)">
                    <animate
                      attributeName="cx"
                      from={16 + (i - 1) * (nodeW + gapX) + nodeW}
                      to={x - 2}
                      dur="0.6s"
                      fill="freeze"
                    />
                    <animate
                      attributeName="cy"
                      from={y + nodeH / 2}
                      to={y + nodeH / 2}
                      dur="0.6s"
                      fill="freeze"
                    />
                    <animate
                      attributeName="opacity"
                      values="0;1;1;0"
                      keyTimes="0;0.1;0.8;1"
                      dur="0.6s"
                      fill="freeze"
                    />
                  </circle>
                )}
              </>
            )}

            {/* Glow for active */}
            {isActive && (
              <rect
                x={x - 2}
                y={y - 2}
                width={nodeW + 4}
                height={nodeH + 4}
                rx="10"
                fill="none"
                stroke="#14b8a6"
                strokeWidth="1"
                opacity="0.5"
                className="sim-pulse"
              />
            )}

            <rect
              x={x}
              y={y}
              width={nodeW}
              height={nodeH}
              rx="8"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={isActive ? 2 : 1.5}
              className="transition-all duration-300"
            />
            <text
              x={x + nodeW / 2}
              y={y + nodeH / 2 + 4}
              textAnchor="middle"
              fill={textColor}
              fontSize="11"
              fontWeight="600"
              fontFamily="system-ui, sans-serif"
              className="transition-all duration-300"
            >
              {step.label}
            </text>
            {/* Step number */}
            <circle
              cx={x + nodeW - 2}
              cy={y + 4}
              r="8"
              fill={isActive ? '#14b8a6' : isCompleted ? '#10b981' : '#475569'}
            />
            <text
              x={x + nodeW - 2}
              y={y + 7.5}
              textAnchor="middle"
              fill="white"
              fontSize="8"
              fontWeight="700"
              fontFamily="system-ui, sans-serif"
            >
              {i + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Step Indicator Bar ──────────────────────────────────────────────

function StepIndicatorBar({
  steps,
  currentStep,
  completedSteps,
}: {
  steps: SimStep[];
  currentStep: number;
  completedSteps: Set<number>;
}) {
  const progress = steps.length > 0
    ? currentStep >= 0
      ? ((completedSteps.size + (currentStep >= 0 ? 1 : 0)) / steps.length) * 100
      : completedSteps.size > 0
        ? (completedSteps.size / steps.length) * 100
        : 0
    : 0;

  return (
    <div className="space-y-2">
      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-slate-700/50 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500 ease-out"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      {/* Step dots */}
      <div className="flex items-center justify-between px-1">
        {steps.map((step, i) => {
          const isActive = currentStep === i;
          const isCompleted = completedSteps.has(i);
          return (
            <button
              key={step.id}
              className={`
                flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold transition-all duration-300
                focus:outline-none focus:ring-2 focus:ring-teal-500/40
                ${isActive
                  ? 'bg-teal-500 text-white sim-pulse shadow-lg shadow-teal-500/30'
                  : isCompleted
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-700 text-slate-400'
                }
              `}
              aria-label={`Step ${i + 1}: ${step.label}`}
              title={step.label}
            >
              {isCompleted && !isActive ? '✓' : i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step Description Panel ──────────────────────────────────────────

function StepDescription({
  steps,
  currentStep,
  completedSteps,
}: {
  steps: SimStep[];
  currentStep: number;
  completedSteps: Set<number>;
}) {
  const activeStep = currentStep >= 0 ? steps[currentStep] : null;
  const isDenied = activeStep?.id === 'access-denied';

  return (
    <div className="min-h-[80px]">
      {activeStep ? (
        <div
          key={activeStep.id}
          className={`
            p-4 rounded-xl border transition-all sim-fade-in
            ${isDenied
              ? 'bg-red-500/5 border-red-500/20'
              : 'bg-teal-500/5 border-teal-500/20'
            }
          `}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span className={isDenied ? 'text-red-400' : 'text-teal-400'}>
              {getStepIcon(activeStep.id, 'h-4 w-4')}
            </span>
            <span className={`text-sm font-bold ${isDenied ? 'text-red-300' : 'text-teal-300'}`}>
              Step {currentStep + 1}: {activeStep.label}
            </span>
            <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${
              isDenied
                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                : 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
            }`}>
              {activeStep.description}
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">{activeStep.detail}</p>
        </div>
      ) : completedSteps.size > 0 ? (
        <div className="p-4 rounded-xl border bg-emerald-500/5 border-emerald-500/20 sim-fade-in">
          <div className="flex items-center gap-2">
            <SvgIconCheck className="h-5 w-5 text-emerald-400" />
            <span className="text-sm font-bold text-emerald-300">Simulation Complete</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            All {steps.length} steps have been completed. Press Play to run again or Reset to start over.
          </p>
        </div>
      ) : (
        <div className="p-4 rounded-xl border bg-slate-800/50 border-slate-700/50">
          <div className="flex items-center gap-2">
            <SvgIconZap className="h-5 w-5 text-slate-500" />
            <span className="text-sm font-medium text-slate-400">Press Play to start the simulation</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            This simulation has {steps.length} steps. Each step will highlight as the animation progresses.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Event Log ───────────────────────────────────────────────────────

interface LogEntry {
  id: number;
  step: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

function EventLog({ logs }: { logs: LogEntry[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const typeConfig: Record<LogEntry['type'], { color: string; badge: string }> = {
    info: { color: 'text-sky-400', badge: 'bg-sky-500/10 border-sky-500/20' },
    success: { color: 'text-emerald-400', badge: 'bg-emerald-500/10 border-emerald-500/20' },
    warning: { color: 'text-amber-400', badge: 'bg-amber-500/10 border-amber-500/20' },
    error: { color: 'text-red-400', badge: 'bg-red-500/10 border-red-500/20' },
  };

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/80 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-slate-700/50 bg-slate-800/50 flex items-center justify-between">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Event Log</h4>
        <span className="text-[10px] text-slate-500 font-mono">{logs.length} events</span>
      </div>
      <div
        ref={scrollRef}
        className="max-h-40 overflow-y-auto p-3 space-y-1"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#334155 transparent',
        }}
      >
        {logs.length === 0 && (
          <p className="text-xs text-slate-500 italic text-center py-3">
            Events will appear here as the simulation runs...
          </p>
        )}
        {logs.map((log) => {
          const cfg = typeConfig[log.type];
          return (
            <div
              key={log.id}
              className="flex items-start gap-2 text-xs sim-fade-in"
            >
              <span
                className={`shrink-0 px-1.5 py-0.5 rounded border font-mono text-[10px] ${cfg.badge} ${cfg.color}`}
              >
                {log.type.toUpperCase()}
              </span>
              <span className="text-slate-300 font-mono text-[11px] leading-snug">{log.message}</span>
              <span className="text-slate-600 ml-auto shrink-0 text-[10px]">
                #{log.step + 1}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main SimulationEngine Component ─────────────────────────────────

export default function SimulationEngine({ simulationType }: { simulationType: SimulationType }) {
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const logIdRef = useRef(0);

  const config = SIMULATION_CONFIGS[simulationType];
  const { steps, stepDelay } = config;

  // Add a log entry for a step
  const addLog = useCallback((stepIndex: number) => {
    const step = steps[stepIndex];
    if (!step) return;

    logIdRef.current += 1;
    const isDenied = step.id === 'access-denied';
    const entry: LogEntry = {
      id: logIdRef.current,
      step: stepIndex,
      message: `[${step.label}] ${step.description}`,
      type: isDenied ? 'error' : stepIndex === steps.length - 1 ? 'success' : 'info',
    };
    setLogs((prev) => [...prev, entry]);
  }, [steps]);

  // Auto-advance with setInterval
  useEffect(() => {
    if (!isPlaying || isPaused || isComplete) return;

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        const next = prev + 1;

        if (next >= steps.length) {
          // Mark last step complete
          setCompletedSteps((prevSet) => new Set([...prevSet, prev]));
          setIsPlaying(false);
          setIsComplete(true);
          return prev; // stay on last step
        }

        // Mark previous step complete
        if (prev >= 0) {
          setCompletedSteps((prevSet) => new Set([...prevSet, prev]));
        }

        addLog(next);
        return next;
      });
    }, stepDelay);

    return () => clearInterval(interval);
  }, [isPlaying, isPaused, isComplete, steps.length, stepDelay, addLog]);

  // Start the first step when play begins — use timeout to avoid synchronous setState in effect
  useEffect(() => {
    if (isPlaying && !isPaused && currentStep === -1) {
      const t = requestAnimationFrame(() => {
        setCurrentStep(0);
        addLog(0);
      });
      return () => cancelAnimationFrame(t);
    }
  }, [isPlaying, isPaused, currentStep, addLog]);

  const handlePlay = useCallback(() => {
    if (isComplete) {
      // Reset and play again
      setCurrentStep(-1);
      setCompletedSteps(new Set());
      setLogs([]);
      setIsComplete(false);
      logIdRef.current = 0;
      // Will start on next render via the effect above
      setTimeout(() => {
        setIsPlaying(true);
        setIsPaused(false);
      }, 50);
    } else {
      setIsPlaying(true);
      setIsPaused(false);
    }
  }, [isComplete]);

  const handlePause = useCallback(() => {
    setIsPaused(true);
  }, []);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentStep(-1);
    setCompletedSteps(new Set());
    setLogs([]);
    setIsComplete(false);
    logIdRef.current = 0;
  }, []);

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-slate-700/50 bg-slate-800/30">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-teal-400 truncate">
              {config.title}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
              {config.description}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Play / Pause */}
            <button
              onClick={isPlaying && !isPaused ? handlePause : handlePlay}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all
                bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-500/20
                focus:outline-none focus:ring-2 focus:ring-teal-500/40
                active:scale-95"
              aria-label={isPlaying && !isPaused ? 'Pause simulation' : 'Play simulation'}
            >
              {isPlaying && !isPaused ? (
                <>
                  <span className="text-base">⏸</span>
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <span className="text-base">▶</span>
                  <span>{isComplete ? 'Replay' : 'Play'}</span>
                </>
              )}
            </button>
            {/* Reset */}
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all
                bg-slate-700/50 text-slate-300 border border-slate-600/50 hover:bg-slate-700
                focus:outline-none focus:ring-2 focus:ring-slate-500/40
                active:scale-95"
              aria-label="Reset simulation"
            >
              <span className="text-base">↺</span>
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Simulation Area */}
      <div className="px-4 sm:px-6 py-5 space-y-5">
        {/* SVG Flow Visualization */}
        <div className="overflow-x-auto">
          <FlowVisualization
            steps={steps}
            currentStep={currentStep}
            completedSteps={completedSteps}
            simulationType={simulationType}
          />
        </div>

        {/* Step Indicator Bar */}
        <StepIndicatorBar
          steps={steps}
          currentStep={currentStep}
          completedSteps={completedSteps}
        />

        {/* Step Description */}
        <StepDescription
          steps={steps}
          currentStep={currentStep}
          completedSteps={completedSteps}
        />

        {/* Event Log */}
        <EventLog logs={logs} />
      </div>
    </div>
  );
}

// Named export
export { SimulationEngine };
