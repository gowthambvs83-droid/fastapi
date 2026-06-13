'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { SimulationType } from '@/lib/curriculum/types';
import {
  Play,
  Pause,
  RotateCcw,
  Globe,
  Server,
  Database,
  Shield,
  Zap,
  Users,
  Lock,
  Unlock,
  ArrowRight,
  X,
  ChevronRight,
  Monitor,
  Wifi,
  Layers,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────

interface LogEntry {
  id: number;
  timestamp: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface SimNodeData {
  id: string;
  label: string;
  icon: React.ReactNode;
  detail: string;
  timing?: string;
}

interface SimStep {
  node: SimNodeData;
  logMessage: string;
  logType: LogEntry['type'];
}

// ─── Simulation Configurations ───────────────────────────────────────

const HTTP_NODES: SimStep[] = [
  {
    node: {
      id: 'browser',
      label: 'Browser',
      icon: <Monitor className="h-4 w-4" />,
      detail: 'User initiates an HTTP GET request to api.example.com/users. The browser checks its cache, then begins DNS resolution.',
      timing: '0ms',
    },
    logMessage: 'Browser sends HTTP GET /users',
    logType: 'info',
  },
  {
    node: {
      id: 'dns',
      label: 'DNS Resolver',
      icon: <Globe className="h-4 w-4" />,
      detail: 'DNS resolves api.example.com to IP 203.0.113.42. The browser first checks its local DNS cache, then queries the recursive resolver.',
      timing: '2ms',
    },
    logMessage: 'DNS resolved api.example.com → 203.0.113.42',
    logType: 'info',
  },
  {
    node: {
      id: 'lb',
      label: 'Load Balancer',
      icon: <Layers className="h-4 w-4" />,
      detail: 'Nginx load balancer receives the request and selects worker-3 using least_conn algorithm. Adds X-Forwarded-For and X-Real-IP headers.',
      timing: '1ms',
    },
    logMessage: 'Load balancer routed to worker-3 (least_conn)',
    logType: 'info',
  },
  {
    node: {
      id: 'fastapi',
      label: 'FastAPI Worker',
      icon: <Server className="h-4 w-4" />,
      detail: 'Uvicorn worker-3 processes the request. FastAPI validates path/query params, runs dependency injection, and executes the route handler.',
      timing: '5ms',
    },
    logMessage: 'FastAPI handler get_users() invoked',
    logType: 'success',
  },
  {
    node: {
      id: 'db',
      label: 'Database',
      icon: <Database className="h-4 w-4" />,
      detail: 'SQLAlchemy executes "SELECT * FROM users WHERE active=true" via connection pool. PostgreSQL uses index scan on idx_users_active.',
      timing: '15ms',
    },
    logMessage: 'DB query returned 42 rows in 15ms',
    logType: 'success',
  },
];

const JWT_STEPS: SimStep[] = [
  {
    node: {
      id: 'login',
      label: 'User Logs In',
      icon: <Users className="h-4 w-4" />,
      detail: 'User submits credentials (email + password) via POST /auth/login over HTTPS.',
    },
    logMessage: 'POST /auth/login — credentials received',
    logType: 'info',
  },
  {
    node: {
      id: 'create-jwt',
      label: 'Server Creates JWT',
      icon: <Lock className="h-4 w-4" />,
      detail: 'Server verifies credentials, then signs a JWT with HS256. Payload contains {sub: user_id, exp: now+1h, role: "admin"}.',
    },
    logMessage: 'JWT signed with HS256 — exp: 3600s',
    logType: 'success',
  },
  {
    node: {
      id: 'send-jwt',
      label: 'JWT Sent to Client',
      icon: <ArrowRight className="h-4 w-4" />,
      detail: 'Server returns JWT in response body. Client extracts the token from the JSON response.',
    },
    logMessage: 'JWT delivered in response body',
    logType: 'info',
  },
  {
    node: {
      id: 'store-jwt',
      label: 'Client Stores JWT',
      icon: <Shield className="h-4 w-4" />,
      detail: 'Client stores the JWT in memory (or httpOnly cookie). The token is now available for subsequent requests.',
    },
    logMessage: 'JWT stored client-side',
    logType: 'info',
  },
  {
    node: {
      id: 'use-jwt',
      label: 'Next Request: JWT in Header',
      icon: <Zap className="h-4 w-4" />,
      detail: 'Client sends a new request with Authorization: Bearer <token> header attached.',
    },
    logMessage: 'GET /users — Authorization header attached',
    logType: 'info',
  },
  {
    node: {
      id: 'decode-jwt',
      label: 'Server Decodes JWT',
      icon: <Unlock className="h-4 w-4" />,
      detail: 'Server verifies signature using secret key, checks exp claim, and extracts user_id from sub claim. Token is valid!',
    },
    logMessage: 'JWT verified — sub: user_42, role: admin',
    logType: 'success',
  },
  {
    node: {
      id: 'identified',
      label: 'User Identified',
      icon: <Users className="h-4 w-4" />,
      detail: 'Request is authenticated. The route handler receives the current user object via dependency injection and processes the request.',
    },
    logMessage: 'User authenticated — request processed',
    logType: 'success',
  },
];

const DB_STEPS: SimStep[] = [
  {
    node: {
      id: 'handler',
      label: 'FastAPI Handler',
      icon: <Server className="h-4 w-4" />,
      detail: 'Route handler get_users() is called. Dependency injection provides the DB session.',
      timing: '0ms',
    },
    logMessage: 'Handler get_users() invoked',
    logType: 'info',
  },
  {
    node: {
      id: 'orm',
      label: 'SQLAlchemy ORM',
      icon: <Layers className="h-4 w-4" />,
      detail: 'db.execute(select(User).where(User.active == True)) — SQLAlchemy constructs the SQL query from the ORM expression.',
      timing: '0.5ms',
    },
    logMessage: 'ORM generated: SELECT * FROM users WHERE active=true',
    logType: 'info',
  },
  {
    node: {
      id: 'pool',
      label: 'Connection Pool',
      icon: <Wifi className="h-4 w-4" />,
      detail: 'Connection pool (size=10, max_overflow=5) provides connection #7 from the pool. Pool had 3 idle connections available.',
      timing: '1ms',
    },
    logMessage: 'Connection #7 acquired from pool (3 idle)',
    logType: 'info',
  },
  {
    node: {
      id: 'postgres',
      label: 'PostgreSQL',
      icon: <Database className="h-4 w-4" />,
      detail: 'PostgreSQL receives the query and uses the query planner to determine the optimal execution strategy.',
      timing: '12ms',
    },
    logMessage: 'PostgreSQL executing query',
    logType: 'info',
  },
  {
    node: {
      id: 'query-plan',
      label: 'Query Plan',
      icon: <Zap className="h-4 w-4" />,
      detail: 'Planner chooses Index Scan using idx_users_active. Estimated cost: 4.20..15.80. Rows: 42. Actual time: 0.034..0.128.',
      timing: '2ms',
    },
    logMessage: 'Index Scan on idx_users_active — cost 4.20',
    logType: 'success',
  },
  {
    node: {
      id: 'result-set',
      label: 'Result Set',
      icon: <Layers className="h-4 w-4" />,
      detail: '42 rows returned. Each row contains: id, email, name, role, created_at, active. Total payload size: ~8KB.',
      timing: '3ms',
    },
    logMessage: '42 rows fetched (8KB payload)',
    logType: 'success',
  },
  {
    node: {
      id: 'pydantic',
      label: 'Pydantic Serialization',
      icon: <Shield className="h-4 w-4" />,
      detail: 'UserResponse schema validates and serializes each row. orm_mode=True maps ORM objects to dicts. Response model enforces output types.',
      timing: '2ms',
    },
    logMessage: 'Pydantic serialized 42 UserResponse objects',
    logType: 'success',
  },
  {
    node: {
      id: 'json-response',
      label: 'JSON Response',
      icon: <Globe className="h-4 w-4" />,
      detail: 'FastAPI returns HTTP 200 with JSON body. Total handler time: 20.5ms. Response includes X-Process-Time header.',
      timing: '0ms',
    },
    logMessage: '200 OK — total: 20.5ms',
    logType: 'success',
  },
];

const WS_NODES: SimNodeData[] = [
  { id: 'client-a', label: 'Client A', icon: <Monitor className="h-4 w-4" />, detail: 'Client A connects via WebSocket and sends a chat message.' },
  { id: 'server', label: 'WS Server', icon: <Server className="h-4 w-4" />, detail: 'WebSocket server receives the message and broadcasts it to all connected clients.' },
  { id: 'client-b', label: 'Client B', icon: <Monitor className="h-4 w-4" />, detail: 'Client B receives the broadcasted message from the server.' },
  { id: 'client-c', label: 'Client C', icon: <Monitor className="h-4 w-4" />, detail: 'Client C receives the broadcasted message from the server.' },
  { id: 'client-d', label: 'Client D', icon: <Monitor className="h-4 w-4" />, detail: 'Client D receives the broadcasted message from the server.' },
];

const WS_LOG_STEPS: SimStep[] = [
  { node: WS_NODES[0], logMessage: 'Client A sends: "Hello everyone!"', logType: 'info' },
  { node: WS_NODES[1], logMessage: 'Server received message from Client A', logType: 'info' },
  { node: WS_NODES[2], logMessage: 'Client B received: "Hello everyone!"', logType: 'success' },
  { node: WS_NODES[3], logMessage: 'Client C received: "Hello everyone!"', logType: 'success' },
  { node: WS_NODES[4], logMessage: 'Client D received: "Hello everyone!"', logType: 'success' },
];

const MW_STEPS: SimStep[] = [
  {
    node: {
      id: 'cors',
      label: 'CORS Middleware',
      icon: <Shield className="h-4 w-4" />,
      detail: 'Checks Origin header against allowed origins. Adds Access-Control-Allow-Origin and related headers. Preflight requests are handled here.',
      canReject: true,
      rejectReason: 'Origin not allowed',
    },
    logMessage: 'CORS check passed — origin: https://app.example.com',
    logType: 'success',
  },
  {
    node: {
      id: 'rate-limit',
      label: 'Rate Limiter',
      icon: <Zap className="h-4 w-4" />,
      detail: 'Checks request count per IP in the sliding window (100 req/min). Uses Redis counter for distributed rate limiting.',
      canReject: true,
      rejectReason: 'Rate limit exceeded (429)',
    },
    logMessage: 'Rate limit OK — 23/100 requests this minute',
    logType: 'success',
  },
  {
    node: {
      id: 'auth',
      label: 'Auth Middleware',
      icon: <Lock className="h-4 w-4" />,
      detail: 'Validates JWT from Authorization header. Verifies signature and expiration. Extracts user claims for downstream use.',
      canReject: true,
      rejectReason: 'Invalid or expired token (401)',
    },
    logMessage: 'JWT validated — user_id: 42',
    logType: 'success',
  },
  {
    node: {
      id: 'logging',
      label: 'Logging',
      icon: <Layers className="h-4 w-4" />,
      detail: 'Records request method, path, status code, and processing time. Structured JSON logs for observability pipeline.',
      canReject: false,
    },
    logMessage: 'Logged: GET /users — processing...',
    logType: 'info',
  },
  {
    node: {
      id: 'handler',
      label: 'Route Handler',
      icon: <Server className="h-4 w-4" />,
      detail: 'Final handler executes business logic. All middleware checks have passed. Returns the response to the client.',
    },
    logMessage: 'Handler executed — 200 OK',
    logType: 'success',
  },
];

// ─── CSS Keyframes ───────────────────────────────────────────────────

const CSS_KEYFRAMES = `
@keyframes sim-moveDot {
  0% { left: 0%; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { left: 100%; opacity: 0; }
}

@keyframes sim-pulseGlow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(20, 184, 166, 0); }
  50% { box-shadow: 0 0 16px 4px rgba(20, 184, 166, 0.4); }
}

@keyframes sim-pulseGlowError {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
  50% { box-shadow: 0 0 16px 4px rgba(239, 68, 68, 0.4); }
}

@keyframes sim-slideIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes sim-flyRight {
  0% { transform: translateX(0); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateX(var(--fly-distance, 120px)); opacity: 0; }
}

@keyframes sim-flyDown {
  0% { transform: translateY(0); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(var(--fly-distance, 60px)); opacity: 0; }
}

@keyframes sim-flyDiagonalBR {
  0% { transform: translate(0, 0); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translate(var(--fly-x, 80px), var(--fly-y, 60px)); opacity: 0; }
}

@keyframes sim-flyDiagonalBL {
  0% { transform: translate(0, 0); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translate(var(--fly-x, -80px), var(--fly-y, 60px)); opacity: 0; }
}

@keyframes sim-rejectFlash {
  0% { background-color: rgba(239, 68, 68, 0); }
  50% { background-color: rgba(239, 68, 68, 0.2); }
  100% { background-color: rgba(239, 68, 68, 0); }
}

@keyframes sim-appear {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes sim-bounceIn {
  0% { transform: scale(0); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}
`;

// ─── Shared Components ───────────────────────────────────────────────

function ControlBar({
  isPlaying,
  onPlay,
  onPause,
  onReset,
  completed,
}: {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  completed: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={isPlaying ? onPause : onPlay}
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all
          bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-500/20
          focus:outline-none focus:ring-2 focus:ring-teal-500/40"
        aria-label={isPlaying ? 'Pause simulation' : 'Play simulation'}
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        {isPlaying ? 'Pause' : completed ? 'Replay' : 'Play'}
      </button>
      <button
        onClick={onReset}
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all
          bg-slate-700/50 text-slate-300 border border-slate-600/50 hover:bg-slate-700
          focus:outline-none focus:ring-2 focus:ring-slate-500/40"
        aria-label="Reset simulation"
      >
        <RotateCcw className="h-4 w-4" />
        Reset
      </button>
    </div>
  );
}

function LogPanel({ logs }: { logs: LogEntry[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const typeColors: Record<LogEntry['type'], string> = {
    info: 'text-sky-400',
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    error: 'text-red-400',
  };

  const typeBadge: Record<LogEntry['type'], string> = {
    info: 'bg-sky-500/10 border-sky-500/20',
    success: 'bg-emerald-500/10 border-emerald-500/20',
    warning: 'bg-amber-500/10 border-amber-500/20',
    error: 'bg-red-500/10 border-red-500/20',
  };

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/80 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-slate-700/50 bg-slate-800/50">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Event Log</h4>
      </div>
      <div ref={scrollRef} className="max-h-48 overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
        {logs.length === 0 && (
          <p className="text-xs text-slate-500 italic text-center py-4">Press Play to start the simulation...</p>
        )}
        {logs.map((log) => (
          <div
            key={log.id}
            className="flex items-start gap-2 text-xs"
            style={{ animation: 'sim-slideIn 0.3s ease-out' }}
          >
            <span className={`shrink-0 px-1.5 py-0.5 rounded border font-mono ${typeBadge[log.type]} ${typeColors[log.type]}`}>
              {log.type.toUpperCase()}
            </span>
            <span className="text-slate-300 font-mono">{log.message}</span>
            <span className="text-slate-600 ml-auto shrink-0">{log.timestamp}ms</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Animated Arrow with Dot ─────────────────────────────────────────

function AnimatedArrow({ active, index }: { active: boolean; index: number }) {
  return (
    <div className="flex items-center justify-center w-8 sm:w-12 shrink-0 relative">
      <div className="h-0.5 w-full bg-slate-700 rounded-full" />
      <ChevronRight className="h-3 w-3 text-slate-600 absolute right-0" />
      {active && (
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-teal-400 shadow-lg shadow-teal-400/50"
          style={{
            animation: `sim-moveDot 0.8s ease-in-out ${index * 0.1}s forwards`,
          }}
        />
      )}
    </div>
  );
}

// ─── Simulation Node Box ─────────────────────────────────────────────

function SimNodeBox({
  node,
  active,
  completed,
  rejected,
  onClick,
  showTiming,
  compact,
}: {
  node: SimNodeData;
  active: boolean;
  completed: boolean;
  rejected?: boolean;
  onClick?: () => void;
  showTiming?: boolean;
  compact?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex flex-col items-center gap-1 px-3 ${compact ? 'py-2' : 'py-3'} rounded-xl border transition-all
        min-w-[80px] max-w-[140px] text-center cursor-pointer select-none
        focus:outline-none focus:ring-2 focus:ring-teal-500/40
        ${rejected
          ? 'bg-red-500/10 border-red-500/30 text-red-400'
          : active
            ? 'bg-teal-500/15 border-teal-500/40 text-teal-300'
            : completed
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-slate-800/80 border-slate-700/50 text-slate-400 hover:border-slate-600'
        }
      `}
      style={{
        animation: active ? 'sim-pulseGlow 1.5s ease-in-out infinite' : rejected ? 'sim-pulseGlowError 1s ease-in-out infinite' : undefined,
      }}
      aria-label={`${node.label}${active ? ' (active)' : ''}${completed ? ' (completed)' : ''}`}
    >
      <div className={`${compact ? 'h-4 w-4' : 'h-5 w-5'}`}>{node.icon}</div>
      <span className={`font-semibold leading-tight ${compact ? 'text-[10px]' : 'text-xs'}`}>{node.label}</span>
      {showTiming && node.timing && (
        <span className="text-[10px] text-slate-500 font-mono">{node.timing}</span>
      )}
      {rejected && <X className="h-3 w-3 text-red-400 absolute -top-1 -right-1" />}
    </button>
  );
}

// ─── Detail Tooltip ──────────────────────────────────────────────────

function DetailPanel({ node, visible }: { node: SimNodeData | null; visible: boolean }) {
  if (!visible || !node) return null;
  return (
    <div
      className="mt-3 p-3 rounded-lg border border-teal-500/20 bg-teal-500/5 text-xs text-slate-300 leading-relaxed"
      style={{ animation: 'sim-slideIn 0.2s ease-out' }}
    >
      <div className="font-semibold text-teal-400 mb-1 flex items-center gap-1.5">
        {node.icon}
        {node.label}
      </div>
      {node.detail}
    </div>
  );
}

// ─── HTTP Request Flow ───────────────────────────────────────────────

function HttpRequestFlow({
  currentStep,
  completedSteps,
  logs,
  selectedNode,
  onSelectNode,
}: {
  currentStep: number;
  completedSteps: Set<number>;
  logs: LogEntry[];
  selectedNode: number | null;
  onSelectNode: (i: number) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-0">
        {HTTP_NODES.map((step, i) => (
          <div key={step.node.id} className="flex items-center">
            <SimNodeBox
              node={step.node}
              active={currentStep === i}
              completed={completedSteps.has(i)}
              onClick={() => onSelectNode(i)}
              showTiming
            />
            {i < HTTP_NODES.length - 1 && (
              <AnimatedArrow active={currentStep === i} index={i} />
            )}
          </div>
        ))}
      </div>
      <DetailPanel
        node={selectedNode !== null ? HTTP_NODES[selectedNode].node : null}
        visible={selectedNode !== null}
      />
      <LogPanel logs={logs} />
    </div>
  );
}

// ─── JWT Lifecycle ───────────────────────────────────────────────────

function JwtLifecycle({
  currentStep,
  completedSteps,
  logs,
}: {
  currentStep: number;
  completedSteps: Set<number>;
  logs: LogEntry[];
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-1 max-w-md mx-auto">
        {JWT_STEPS.map((step, i) => (
          <div key={step.node.id} className="flex flex-col items-center gap-1 w-full">
            <div
              className={`w-full px-4 py-3 rounded-xl border transition-all text-center
                ${currentStep === i
                  ? 'bg-teal-500/15 border-teal-500/40 text-teal-300'
                  : completedSteps.has(i)
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-800/80 border-slate-700/50 text-slate-500'
                }
              `}
              style={{
                animation: currentStep === i ? 'sim-pulseGlow 1.5s ease-in-out infinite' : undefined,
              }}
            >
              <div className="flex items-center justify-center gap-2">
                <span className={currentStep === i ? 'text-teal-400' : completedSteps.has(i) ? 'text-emerald-400' : 'text-slate-600'}>
                  {step.node.icon}
                </span>
                <span className="text-sm font-semibold">{step.node.label}</span>
              </div>
              <p className="text-[11px] mt-1 text-slate-400 leading-snug max-w-sm mx-auto">{step.node.detail}</p>
            </div>
            {i < JWT_STEPS.length - 1 && (
              <div className="flex flex-col items-center py-0.5">
                <div className="w-0.5 h-4 bg-slate-700" />
                <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-600" />
              </div>
            )}
          </div>
        ))}
      </div>
      <LogPanel logs={logs} />
    </div>
  );
}

// ─── Database Query ──────────────────────────────────────────────────

function DatabaseQuery({
  currentStep,
  completedSteps,
  logs,
  selectedNode,
  onSelectNode,
}: {
  currentStep: number;
  completedSteps: Set<number>;
  logs: LogEntry[];
  selectedNode: number | null;
  onSelectNode: (i: number) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Desktop: horizontal flow */}
      <div className="hidden lg:flex flex-wrap items-center justify-center gap-1">
        {DB_STEPS.map((step, i) => (
          <div key={step.node.id} className="flex items-center">
            <SimNodeBox
              node={step.node}
              active={currentStep === i}
              completed={completedSteps.has(i)}
              onClick={() => onSelectNode(i)}
              showTiming
              compact
            />
            {i < DB_STEPS.length - 1 && (
              <AnimatedArrow active={currentStep === i} index={i} />
            )}
          </div>
        ))}
      </div>
      {/* Mobile: vertical flow */}
      <div className="lg:hidden flex flex-col items-center gap-1 max-w-sm mx-auto">
        {DB_STEPS.map((step, i) => (
          <div key={step.node.id} className="flex flex-col items-center gap-1 w-full">
            <button
              onClick={() => onSelectNode(i)}
              className={`w-full px-4 py-2.5 rounded-xl border transition-all text-center
                ${currentStep === i
                  ? 'bg-teal-500/15 border-teal-500/40 text-teal-300'
                  : completedSteps.has(i)
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-800/80 border-slate-700/50 text-slate-500'
                }
              `}
              style={{
                animation: currentStep === i ? 'sim-pulseGlow 1.5s ease-in-out infinite' : undefined,
              }}
            >
              <div className="flex items-center justify-center gap-2">
                <span className={currentStep === i ? 'text-teal-400' : completedSteps.has(i) ? 'text-emerald-400' : 'text-slate-600'}>
                  {step.node.icon}
                </span>
                <span className="text-xs font-semibold">{step.node.label}</span>
                {step.node.timing && <span className="text-[10px] text-slate-500 font-mono ml-auto">{step.node.timing}</span>}
              </div>
            </button>
            {i < DB_STEPS.length - 1 && (
              <div className="flex flex-col items-center py-0.5">
                <div className="w-0.5 h-3 bg-slate-700" />
                <div className="w-0 h-0 border-l-3 border-r-3 border-t-3 border-transparent border-t-slate-600" />
              </div>
            )}
          </div>
        ))}
      </div>
      <DetailPanel
        node={selectedNode !== null ? DB_STEPS[selectedNode].node : null}
        visible={selectedNode !== null}
      />
      <LogPanel logs={logs} />
    </div>
  );
}

// ─── WebSocket Flow ──────────────────────────────────────────────────

function WebSocketFlow({
  currentStep,
  completedSteps,
  logs,
  flyingMessages,
}: {
  currentStep: number;
  completedSteps: Set<number>;
  logs: LogEntry[];
  flyingMessages: { id: number; from: string; to: string }[];
}) {
  return (
    <div className="space-y-4">
      {/* Hub-and-spoke layout */}
      <div className="relative flex flex-col items-center gap-6 py-4">
        {/* Top row: Client A */}
        <div className="flex justify-center">
          <SimNodeBox
            node={WS_NODES[0]}
            active={currentStep === 0}
            completed={completedSteps.has(0)}
            showTiming={false}
          />
        </div>

        {/* Arrow from Client A to Server */}
        <div className="flex flex-col items-center">
          <div className="relative w-0.5 h-6 bg-slate-700">
            {(currentStep === 0 || completedSteps.has(0)) && currentStep <= 1 && (
              <div
                className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-teal-400 shadow-lg shadow-teal-400/50"
                style={{ animation: 'sim-moveDot 0.6s ease-in-out forwards' }}
              />
            )}
          </div>
        </div>

        {/* Server */}
        <div className="flex justify-center">
          <SimNodeBox
            node={WS_NODES[1]}
            active={currentStep === 1}
            completed={completedSteps.has(1)}
          />
        </div>

        {/* Arrows from Server to clients B, C, D */}
        <div className="flex flex-col items-center">
          <div className="relative w-0.5 h-4 bg-slate-700">
            {currentStep >= 2 && (
              <div
                className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50"
                style={{ animation: 'sim-moveDot 0.5s ease-in-out forwards' }}
              />
            )}
          </div>
        </div>

        {/* Client row */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
          {[WS_NODES[2], WS_NODES[3], WS_NODES[4]].map((node, i) => {
            const stepIdx = i + 2;
            return (
              <SimNodeBox
                key={node.id}
                node={node}
                active={currentStep === stepIdx}
                completed={completedSteps.has(stepIdx)}
              />
            );
          })}
        </div>

        {/* Flying message bubbles */}
        {flyingMessages.map((msg) => (
          <div
            key={msg.id}
            className="absolute pointer-events-none"
            style={{
              top: msg.from === 'client-a' ? '10%' : '45%',
              left: msg.to === 'client-b' ? '15%' : msg.to === 'client-c' ? '50%' : msg.to === 'client-d' ? '80%' : '50%',
              animation: msg.from === 'client-a'
                ? 'sim-flyDown 0.8s ease-in-out forwards'
                : msg.to === 'client-b'
                  ? 'sim-flyDiagonalBL 0.6s ease-in-out forwards'
                  : msg.to === 'client-c'
                    ? 'sim-flyDown 0.6s ease-in-out forwards'
                    : 'sim-flyDiagonalBR 0.6s ease-in-out forwards',
              '--fly-distance': '60px',
              '--fly-x': msg.to === 'client-b' ? '-80px' : msg.to === 'client-d' ? '80px' : '0px',
              '--fly-y': '60px',
            } as React.CSSProperties}
          >
            <div className="px-2 py-1 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-[10px] font-mono whitespace-nowrap shadow-lg">
              &quot;Hello!&quot;
            </div>
          </div>
        ))}
      </div>
      <LogPanel logs={logs} />
    </div>
  );
}

// ─── Middleware Chain ─────────────────────────────────────────────────

function MiddlewareChain({
  currentStep,
  completedSteps,
  logs,
  rejectedAt,
  showRejectOptions,
  onReject,
}: {
  currentStep: number;
  completedSteps: Set<number>;
  logs: LogEntry[];
  rejectedAt: number | null;
  showRejectOptions: boolean;
  onReject: (step: number) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Desktop: horizontal */}
      <div className="hidden md:flex flex-wrap items-center justify-center gap-1">
        {MW_STEPS.map((step, i) => {
          const isRejected = rejectedAt === i;
          const isAfterRejection = rejectedAt !== null && i > rejectedAt;
          return (
            <div key={step.node.id} className="flex items-center">
              <div className="relative">
                <SimNodeBox
                  node={step.node}
                  active={currentStep === i && !isAfterRejection}
                  completed={completedSteps.has(i) && !isRejected}
                  rejected={isRejected}
                />
                {showRejectOptions && step.node.canReject && !isAfterRejection && rejectedAt === null && (
                  <button
                    onClick={() => onReject(i)}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500/20 border border-red-500/30
                      flex items-center justify-center text-red-400 hover:bg-red-500/40 transition-all
                      focus:outline-none focus:ring-2 focus:ring-red-500/40"
                    style={{ animation: 'sim-appear 0.2s ease-out' }}
                    aria-label={`Reject at ${step.node.label}`}
                    title={`Reject: ${step.node.rejectReason || 'Rejected'}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              {i < MW_STEPS.length - 1 && !isAfterRejection && (
                <AnimatedArrow active={currentStep === i} index={i} />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: vertical */}
      <div className="md:hidden flex flex-col items-center gap-1 max-w-sm mx-auto">
        {MW_STEPS.map((step, i) => {
          const isRejected = rejectedAt === i;
          const isAfterRejection = rejectedAt !== null && i > rejectedAt;
          return (
            <div key={step.node.id} className="flex flex-col items-center gap-1 w-full">
              <div className="relative w-full">
                <div
                  className={`w-full px-4 py-3 rounded-xl border transition-all text-center
                    ${isRejected
                      ? 'bg-red-500/15 border-red-500/40 text-red-400'
                      : isAfterRejection
                        ? 'bg-slate-800/40 border-slate-700/30 text-slate-600 opacity-50'
                        : currentStep === i
                          ? 'bg-teal-500/15 border-teal-500/40 text-teal-300'
                          : completedSteps.has(i)
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : 'bg-slate-800/80 border-slate-700/50 text-slate-500'
                    }
                  `}
                  style={{
                    animation: currentStep === i && !isAfterRejection
                      ? 'sim-pulseGlow 1.5s ease-in-out infinite'
                      : isRejected
                        ? 'sim-rejectFlash 0.5s ease-in-out'
                        : undefined,
                  }}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className={isRejected ? 'text-red-400' : currentStep === i && !isAfterRejection ? 'text-teal-400' : completedSteps.has(i) ? 'text-emerald-400' : 'text-slate-600'}>
                      {step.node.icon}
                    </span>
                    <span className="text-sm font-semibold">{step.node.label}</span>
                    {isRejected && <X className="h-4 w-4 text-red-400 ml-1" />}
                  </div>
                </div>
                {showRejectOptions && step.node.canReject && !isAfterRejection && rejectedAt === null && (
                  <button
                    onClick={() => onReject(i)}
                    className="absolute top-1 right-2 px-2 py-0.5 rounded text-[10px] font-semibold
                      bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/40 transition-all"
                    style={{ animation: 'sim-appear 0.2s ease-out' }}
                  >
                    Reject
                  </button>
                )}
              </div>
              {i < MW_STEPS.length - 1 && !isAfterRejection && (
                <div className="flex flex-col items-center py-0.5">
                  <div className={`w-0.5 h-3 ${isRejected || (rejectedAt !== null && i >= rejectedAt) ? 'bg-red-500/30' : 'bg-slate-700'}`} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Error response panel when rejected */}
      {rejectedAt !== null && (
        <div
          className="p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-xs text-red-300"
          style={{ animation: 'sim-slideIn 0.3s ease-out' }}
        >
          <div className="font-semibold text-red-400 mb-1 flex items-center gap-1.5">
            <X className="h-4 w-4" />
            Request Rejected at {MW_STEPS[rejectedAt].node.label}
          </div>
          <p className="text-slate-400">{MW_STEPS[rejectedAt].node.rejectReason || 'Request denied'}. The request was short-circuited and an error response was returned to the client.</p>
        </div>
      )}

      <LogPanel logs={logs} />
    </div>
  );
}

// ─── Main SimulationEngine Component ─────────────────────────────────

export function SimulationEngine({ simulation }: { simulation: SimulationType }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [completed, setCompleted] = useState(false);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [rejectedAt, setRejectedAt] = useState<number | null>(null);
  const [flyingMessages, setFlyingMessages] = useState<{ id: number; from: string; to: string }[]>([]);
  const logIdRef = useRef(0);
  const msgIdRef = useRef(0);

  // Get config for current simulation type
  const getConfig = useCallback((): { steps: SimStep[]; stepDelay: number } => {
    switch (simulation) {
      case 'HTTP_REQUEST_FLOW':
        return { steps: HTTP_NODES, stepDelay: 1200 };
      case 'JWT_LIFECYCLE':
        return { steps: JWT_STEPS, stepDelay: 1000 };
      case 'DATABASE_QUERY':
        return { steps: DB_STEPS, stepDelay: 900 };
      case 'WEBSOCKET_FLOW':
        return { steps: WS_LOG_STEPS, stepDelay: 1000 };
      case 'MIDDLEWARE_CHAIN':
        return { steps: MW_STEPS, stepDelay: 1100 };
      default:
        return { steps: [], stepDelay: 1000 };
    }
  }, [simulation]);

  // Add log entry
  const addLog = useCallback((step: SimStep, stepIndex: number) => {
    logIdRef.current += 1;
    const entry: LogEntry = {
      id: logIdRef.current,
      timestamp: step.node.timing ? parseInt(step.node.timing) || (stepIndex + 1) * 100 : (stepIndex + 1) * 100,
      message: step.logMessage,
      type: step.logType,
    };
    setLogs((prev) => [...prev, entry]);
  }, []);

  // Handle WebSocket flying messages
  useEffect(() => {
    if (simulation !== 'WEBSOCKET_FLOW' || !isPlaying) return;

    if (currentStep === 0) {
      // Client A sends message
      msgIdRef.current += 1;
      setFlyingMessages((prev) => [...prev, { id: msgIdRef.current, from: 'client-a', to: 'server' }]);
      const timer = setTimeout(() => setFlyingMessages([]), 1000);
      return () => clearTimeout(timer);
    }
    if (currentStep === 2) {
      // Server broadcasts to all clients
      const targets = ['client-b', 'client-c', 'client-d'];
      targets.forEach((target, i) => {
        setTimeout(() => {
          msgIdRef.current += 1;
          setFlyingMessages((prev) => [...prev, { id: msgIdRef.current + i, from: 'server', to: target }]);
        }, i * 200);
      });
      const timer = setTimeout(() => setFlyingMessages([]), 1500);
      return () => clearTimeout(timer);
    }
  }, [currentStep, isPlaying, simulation]);

  // Main animation loop
  useEffect(() => {
    if (!isPlaying || completed) return;

    const { steps, stepDelay } = getConfig();
    if (steps.length === 0) return;

    // If we haven't started yet, start at step 0
    if (currentStep === -1) {
      const timer = setTimeout(() => {
        setCurrentStep(0);
        setCompletedSteps(new Set());
        addLog(steps[0], 0);
      }, 300);
      return () => clearTimeout(timer);
    }

    // Check for middleware rejection — state is already updated in handleReject
    if (simulation === 'MIDDLEWARE_CHAIN' && rejectedAt !== null) {
      return;
    }

    // Move to next step
    const timer = setTimeout(() => {
      const nextStep = currentStep + 1;

      if (nextStep >= steps.length) {
        // Animation complete
        setCompletedSteps((prev) => new Set([...prev, currentStep]));
        setCurrentStep(-1);
        setIsPlaying(false);
        setCompleted(true);
        return;
      }

      setCompletedSteps((prev) => new Set([...prev, currentStep]));
      setCurrentStep(nextStep);
      addLog(steps[nextStep], nextStep);
    }, stepDelay);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, completed, simulation, rejectedAt, getConfig, addLog]);

  // Reset
  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep(-1);
    setCompletedSteps(new Set());
    setLogs([]);
    setCompleted(false);
    setSelectedNode(null);
    setRejectedAt(null);
    setFlyingMessages([]);
    logIdRef.current = 0;
    msgIdRef.current = 0;
  }, []);

  // Play
  const handlePlay = useCallback(() => {
    if (completed) {
      handleReset();
      setTimeout(() => setIsPlaying(true), 100);
    } else {
      setIsPlaying(true);
    }
  }, [completed, handleReset]);

  // Pause
  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  // Handle middleware rejection
  const handleReject = useCallback((stepIndex: number) => {
    setIsPlaying(false);
    setRejectedAt(stepIndex);
    setCompletedSteps((prev) => new Set([...prev, stepIndex]));

    const step = MW_STEPS[stepIndex];
    logIdRef.current += 1;
    setLogs((prev) => [
      ...prev,
      {
        id: logIdRef.current,
        timestamp: (stepIndex + 1) * 100,
        message: `REJECTED at ${step.node.label}: ${step.node.rejectReason || 'Request denied'}`,
        type: 'error' as const,
      },
    ]);
    setCompleted(true);
  }, []);

  // Title for the simulation
  const titles: Record<SimulationType, string> = {
    HTTP_REQUEST_FLOW: 'HTTP Request Flow',
    JWT_LIFECYCLE: 'JWT Lifecycle',
    DATABASE_QUERY: 'Database Query Pipeline',
    WEBSOCKET_FLOW: 'WebSocket Broadcast',
    MIDDLEWARE_CHAIN: 'Middleware Chain',
  };

  // Descriptions for the simulation
  const descriptions: Record<SimulationType, string> = {
    HTTP_REQUEST_FLOW: 'Watch an HTTP request travel from the browser through DNS, load balancer, and API worker to the database.',
    JWT_LIFECYCLE: 'Follow the complete lifecycle of a JWT token from creation to verification.',
    DATABASE_QUERY: 'Trace a query from the FastAPI handler through the ORM, connection pool, and PostgreSQL to the final JSON response.',
    WEBSOCKET_FLOW: 'See how a WebSocket server broadcasts messages from one client to all connected clients in real time.',
    MIDDLEWARE_CHAIN: 'Watch a request pass through middleware layers — each one can reject it before it reaches the handler.',
  };

  return (
    <>
      <style>{CSS_KEYFRAMES}</style>
      <div className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-700/50 bg-slate-800/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-teal-400">{titles[simulation]}</h3>
              <p className="text-xs text-slate-400 mt-0.5 max-w-lg">{descriptions[simulation]}</p>
            </div>
            <ControlBar
              isPlaying={isPlaying}
              onPlay={handlePlay}
              onPause={handlePause}
              onReset={handleReset}
              completed={completed}
            />
          </div>
        </div>

        {/* Simulation Area */}
        <div className="px-4 sm:px-6 py-5">
          {simulation === 'HTTP_REQUEST_FLOW' && (
            <HttpRequestFlow
              currentStep={currentStep}
              completedSteps={completedSteps}
              logs={logs}
              selectedNode={selectedNode}
              onSelectNode={setSelectedNode}
            />
          )}
          {simulation === 'JWT_LIFECYCLE' && (
            <JwtLifecycle
              currentStep={currentStep}
              completedSteps={completedSteps}
              logs={logs}
            />
          )}
          {simulation === 'DATABASE_QUERY' && (
            <DatabaseQuery
              currentStep={currentStep}
              completedSteps={completedSteps}
              logs={logs}
              selectedNode={selectedNode}
              onSelectNode={setSelectedNode}
            />
          )}
          {simulation === 'WEBSOCKET_FLOW' && (
            <WebSocketFlow
              currentStep={currentStep}
              completedSteps={completedSteps}
              logs={logs}
              flyingMessages={flyingMessages}
            />
          )}
          {simulation === 'MIDDLEWARE_CHAIN' && (
            <MiddlewareChain
              currentStep={currentStep}
              completedSteps={completedSteps}
              logs={logs}
              rejectedAt={rejectedAt}
              showRejectOptions={isPlaying || completed}
              onReject={handleReject}
            />
          )}
        </div>
      </div>
    </>
  );
}
