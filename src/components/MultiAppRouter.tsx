'use client';

import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Server,
  Users,
  Package,
  ShoppingCart,
  BarChart3,
  Code2,
  FolderOpen,
  Route,
  Zap,
  ChevronRight,
  ExternalLink,
  Layers,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SubAppEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
}

interface SubApp {
  id: string;
  name: string;
  prefix: string;
  routerFile: string;
  icon: string;
  description: string;
  endpoints: SubAppEndpoint[];
  mountCode: string;
  routerCode: string;
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const SUB_APPS: SubApp[] = [
  {
    id: 'users',
    name: 'Users App',
    prefix: '/api/v1/users',
    routerFile: 'app/routers/users.py',
    icon: 'users',
    description: 'User management with full CRUD operations and authentication support.',
    endpoints: [
      { method: 'GET', path: '/', description: 'List all users with pagination' },
      { method: 'POST', path: '/', description: 'Create a new user' },
      { method: 'GET', path: '/{id}', description: 'Get user by ID' },
      { method: 'PUT', path: '/{id}', description: 'Update user by ID' },
      { method: 'DELETE', path: '/{id}', description: 'Delete user by ID' },
    ],
    mountCode: `app.mount("/api/v1/users", users_app)`,
    routerCode: `# app/routers/users.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

users_app = FastAPI()

class UserCreate(BaseModel):
    username: str
    email: str

class UserUpdate(BaseModel):
    username: str | None = None
    email: str | None = None

@users_app.get("/")
async def list_users(skip: int = 0, limit: int = 100):
    return {"users": [], "skip": skip, "limit": limit}

@users_app.post("/")
async def create_user(user: UserCreate):
    return {"id": 1, **user.model_dump()}

@users_app.get("/{user_id}")
async def get_user(user_id: int):
    return {"id": user_id, "username": "example"}

@users_app.put("/{user_id}")
async def update_user(user_id: int, user: UserUpdate):
    return {"id": user_id, **user.model_dump(exclude_none=True)}

@users_app.delete("/{user_id}")
async def delete_user(user_id: int):
    return {"deleted": True, "id": user_id}`,
  },
  {
    id: 'products',
    name: 'Products App',
    prefix: '/api/v1/products',
    routerFile: 'app/routers/products.py',
    icon: 'products',
    description: 'Product catalog management with search and inventory tracking.',
    endpoints: [
      { method: 'GET', path: '/', description: 'List all products' },
      { method: 'POST', path: '/', description: 'Create a new product' },
      { method: 'GET', path: '/{id}', description: 'Get product by ID' },
      { method: 'PATCH', path: '/{id}', description: 'Partial update product' },
    ],
    mountCode: `app.mount("/api/v1/products", products_app)`,
    routerCode: `# app/routers/products.py
from fastapi import FastAPI
from pydantic import BaseModel

products_app = FastAPI()

class ProductCreate(BaseModel):
    name: str
    price: float
    category: str

class ProductUpdate(BaseModel):
    name: str | None = None
    price: float | None = None

@products_app.get("/")
async def list_products(category: str | None = None):
    return {"products": [], "category": category}

@products_app.post("/")
async def create_product(product: ProductCreate):
    return {"id": 1, **product.model_dump()}

@products_app.get("/{product_id}")
async def get_product(product_id: int):
    return {"id": product_id, "name": "Widget"}

@products_app.patch("/{product_id}")
async def patch_product(product_id: int, product: ProductUpdate):
    return {"id": product_id, **product.model_dump(exclude_none=True)}`,
  },
  {
    id: 'orders',
    name: 'Orders App',
    prefix: '/api/v1/orders',
    routerFile: 'app/routers/orders.py',
    icon: 'orders',
    description: 'Order processing with item-level details and status tracking.',
    endpoints: [
      { method: 'GET', path: '/', description: 'List all orders' },
      { method: 'POST', path: '/', description: 'Place a new order' },
      { method: 'GET', path: '/{id}', description: 'Get order by ID' },
      { method: 'GET', path: '/{id}/items', description: 'Get items for an order' },
    ],
    mountCode: `app.mount("/api/v1/orders", orders_app)`,
    routerCode: `# app/routers/orders.py
from fastapi import FastAPI
from pydantic import BaseModel

orders_app = FastAPI()

class OrderCreate(BaseModel):
    user_id: int
    items: list[dict]

@orders_app.get("/")
async def list_orders(status: str | None = None):
    return {"orders": [], "status_filter": status}

@orders_app.post("/")
async def create_order(order: OrderCreate):
    return {"id": 1, "status": "pending", **order.model_dump()}

@orders_app.get("/{order_id}")
async def get_order(order_id: int):
    return {"id": order_id, "status": "shipped"}

@orders_app.get("/{order_id}/items")
async def get_order_items(order_id: int):
    return {"order_id": order_id, "items": []}`,
  },
  {
    id: 'analytics',
    name: 'Analytics App',
    prefix: '/api/v1/analytics',
    routerFile: 'app/routers/analytics.py',
    icon: 'analytics',
    description: 'Real-time analytics dashboards, reports, and event tracking.',
    endpoints: [
      { method: 'GET', path: '/dashboard', description: 'Dashboard aggregate data' },
      { method: 'GET', path: '/reports', description: 'List available reports' },
      { method: 'POST', path: '/events', description: 'Track a new event' },
    ],
    mountCode: `app.mount("/api/v1/analytics", analytics_app)`,
    routerCode: `# app/routers/analytics.py
from fastapi import FastAPI
from pydantic import BaseModel

analytics_app = FastAPI()

class EventCreate(BaseModel):
    event_type: str
    payload: dict

@analytics_app.get("/dashboard")
async def get_dashboard():
    return {
        "total_users": 1234,
        "total_orders": 5678,
        "revenue": 99999.99
    }

@analytics_app.get("/reports")
async def list_reports():
    return {"reports": ["daily", "weekly", "monthly"]}

@analytics_app.post("/events")
async def track_event(event: EventCreate):
    return {"tracked": True, **event.model_dump()}`,
  },
];

// ---------------------------------------------------------------------------
// Color / Style Maps
// ---------------------------------------------------------------------------

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  POST: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
  PUT: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  PATCH: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30',
  DELETE: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
};

const APP_COLORS: Record<string, {
  fill: string;
  stroke: string;
  text: string;
  glow: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  connectionStroke: string;
}> = {
  users: {
    fill: 'fill-sky-500/10',
    stroke: 'stroke-sky-500/70',
    text: 'text-sky-600 dark:text-sky-300',
    glow: 'drop-shadow-[0_0_12px_rgba(14,165,233,0.3)]',
    accentBg: 'bg-sky-500/10',
    accentBorder: 'border-sky-500/40',
    accentText: 'text-sky-600 dark:text-sky-300',
    connectionStroke: '#0ea5e9',
  },
  products: {
    fill: 'fill-amber-500/10',
    stroke: 'stroke-amber-500/70',
    text: 'text-amber-600 dark:text-amber-300',
    glow: 'drop-shadow-[0_0_12px_rgba(245,158,11,0.3)]',
    accentBg: 'bg-amber-500/10',
    accentBorder: 'border-amber-500/40',
    accentText: 'text-amber-600 dark:text-amber-300',
    connectionStroke: '#f59e0b',
  },
  orders: {
    fill: 'fill-violet-500/10',
    stroke: 'stroke-violet-500/70',
    text: 'text-violet-600 dark:text-violet-300',
    glow: 'drop-shadow-[0_0_12px_rgba(139,92,246,0.3)]',
    accentBg: 'bg-violet-500/10',
    accentBorder: 'border-violet-500/40',
    accentText: 'text-violet-600 dark:text-violet-300',
    connectionStroke: '#8b5cf6',
  },
  analytics: {
    fill: 'fill-teal-500/10',
    stroke: 'stroke-teal-500/70',
    text: 'text-teal-600 dark:text-teal-300',
    glow: 'drop-shadow-[0_0_12px_rgba(20,184,166,0.3)]',
    accentBg: 'bg-teal-500/10',
    accentBorder: 'border-teal-500/40',
    accentText: 'text-teal-600 dark:text-teal-300',
    connectionStroke: '#14b8a6',
  },
};

function getAppColor(id: string) {
  return APP_COLORS[id] ?? APP_COLORS['analytics'];
}

// ---------------------------------------------------------------------------
// SVG Diagram Constants
// ---------------------------------------------------------------------------

const SVG_WIDTH = 820;
const SVG_HEIGHT = 340;
const MAIN_APP_X = SVG_WIDTH / 2;
const MAIN_APP_Y = 60;
const MAIN_APP_W = 220;
const MAIN_APP_H = 70;

const SUB_APP_W = 160;
const SUB_APP_H = 80;

// Calculate sub-app positions evenly spaced
const SUB_APP_POSITIONS = SUB_APPS.map((_, i) => {
  const totalWidth = SVG_WIDTH - 80; // 40px padding each side
  const spacing = totalWidth / (SUB_APPS.length);
  const x = 40 + spacing * i + spacing / 2;
  const y = 240;
  return { x, y };
});

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MethodBadge({ method }: { method: string }) {
  return (
    <Badge
      variant="outline"
      className={`font-mono text-[10px] px-1.5 py-0 border ${METHOD_COLORS[method] ?? 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30'}`}
    >
      {method}
    </Badge>
  );
}

function SubAppIcon({ appId, className }: { appId: string; className?: string }) {
  switch (appId) {
    case 'users': return <Users className={className} />;
    case 'products': return <Package className={className} />;
    case 'orders': return <ShoppingCart className={className} />;
    case 'analytics': return <BarChart3 className={className} />;
    default: return <Server className={className} />;
  }
}

function DetailPanel({ app }: { app: SubApp }) {
  const colors = getAppColor(app.id);

  return (
    <div className="sim-fade-in">
      <Card className={`border ${colors.accentBorder} overflow-hidden`}>
        {/* Header bar */}
        <div className={`${colors.accentBg} px-4 py-3 border-b ${colors.accentBorder}`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg ${colors.accentBg} border ${colors.accentBorder} flex items-center justify-center`}>
              <SubAppIcon appId={app.id} className={`h-4 w-4 ${colors.accentText}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className={`text-sm font-bold ${colors.accentText}`}>{app.name}</h4>
              <p className="text-xs text-muted-foreground truncate">{app.description}</p>
            </div>
            <Badge variant="outline" className="font-mono text-[10px] px-2 py-0.5 bg-background/50">
              {app.prefix}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4 space-y-4">
          {/* Info row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 border border-border/50">
              <Route className="h-4 w-4 text-teal-500 shrink-0" />
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Prefix</div>
                <code className="text-xs font-mono text-foreground">{app.prefix}</code>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 border border-border/50">
              <FolderOpen className="h-4 w-4 text-teal-500 shrink-0" />
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Router File</div>
                <code className="text-xs font-mono text-foreground">{app.routerFile}</code>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 border border-border/50">
              <Zap className="h-4 w-4 text-teal-500 shrink-0" />
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Endpoints</div>
                <span className="text-xs font-mono text-foreground">{app.endpoints.length} routes</span>
              </div>
            </div>
          </div>

          {/* Endpoints list */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Route className="h-3.5 w-3.5 text-teal-500" />
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Endpoints</span>
            </div>
            <div className="rounded-md border border-border overflow-hidden">
              {app.endpoints.map((endpoint, i) => (
                <div
                  key={`${endpoint.method}-${endpoint.path}`}
                  className={`flex items-center gap-2 px-3 py-2 text-xs
                    ${i > 0 ? 'border-t border-border/50' : ''}
                    hover:bg-muted/50 transition-colors`}
                >
                  <MethodBadge method={endpoint.method} />
                  <code className="font-mono text-foreground flex-1">
                    {app.prefix}{endpoint.path}
                  </code>
                  <span className="text-muted-foreground text-[11px] hidden sm:inline truncate max-w-[200px]">
                    {endpoint.description}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Mount code */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Code2 className="h-3.5 w-3.5 text-teal-500" />
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Mount Code</span>
            </div>
            <div className="rounded-lg border border-gray-800 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 border-b border-gray-800">
                <Code2 className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-xs text-gray-500 font-mono">python</span>
              </div>
              <pre className="bg-[#1a1b26] p-3.5 text-xs font-mono leading-relaxed overflow-x-auto">
                <code className="text-emerald-300">{app.mountCode}</code>
              </pre>
            </div>
          </div>

          {/* Full router code */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FolderOpen className="h-3.5 w-3.5 text-teal-500" />
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Full Router Code</span>
              <span className="text-[10px] text-muted-foreground">({app.routerFile})</span>
            </div>
            <div className="rounded-lg border border-gray-800 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 border-b border-gray-800">
                <Code2 className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-xs text-gray-500 font-mono">{app.routerFile}</span>
              </div>
              <pre className="bg-[#1a1b26] p-3.5 text-xs font-mono leading-relaxed overflow-x-auto max-h-64 overflow-y-auto scrollbar-thin">
                <code className="text-gray-300">{app.routerCode}</code>
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ArchitectureDiagram({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <svg
      viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
      className="w-full h-auto max-w-4xl mx-auto"
      role="img"
      aria-label="FastAPI Multi-App Router Architecture Diagram"
    >
      <defs>
        {/* Gradient for main app */}
        <linearGradient id="mainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#14b8a6" stopOpacity="1" />
          <stop offset="100%" stopColor="#0d9488" stopOpacity="1" />
        </linearGradient>

        {/* Arrow marker */}
        <marker
          id="arrowTeal"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#14b8a6" />
        </marker>

        {/* Glow filters for each app */}
        {SUB_APPS.map((app) => (
          <filter key={`glow-${app.id}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feFlood floodColor={getAppColor(app.id).connectionStroke} floodOpacity="0.4" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        ))}

        {/* Animated dash for connections */}
        <style>{`
          @keyframes dash-flow {
            to { stroke-dashoffset: -20; }
          }
          .connection-line {
            animation: dash-flow 1.5s linear infinite;
          }
          @keyframes pulse-glow {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
          }
          .pulse-ring {
            animation: pulse-glow 2s ease-in-out infinite;
          }
        `}</style>
      </defs>

      {/* ---- Connecting Lines ---- */}
      {SUB_APPS.map((app, i) => {
        const pos = SUB_APP_POSITIONS[i];
        const colors = getAppColor(app.id);
        const isSelected = selectedId === app.id;

        // Line from bottom-center of main app to top-center of sub-app
        const startX = MAIN_APP_X;
        const startY = MAIN_APP_Y + MAIN_APP_H / 2;
        const endX = pos.x;
        const endY = pos.y - SUB_APP_H / 2;

        // Curve control points
        const midY = (startY + endY) / 2;

        return (
          <g key={`connection-${app.id}`}>
            {/* Background glow line when selected */}
            {isSelected && (
              <path
                d={`M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`}
                fill="none"
                stroke={colors.connectionStroke}
                strokeWidth="6"
                strokeOpacity="0.15"
                className="pulse-ring"
              />
            )}
            {/* Main connection line */}
            <path
              d={`M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`}
              fill="none"
              stroke={isSelected ? colors.connectionStroke : '#64748b'}
              strokeWidth={isSelected ? 2.5 : 1.5}
              strokeOpacity={isSelected ? 0.8 : 0.35}
              strokeDasharray={isSelected ? 'none' : '6 4'}
              className={isSelected ? '' : 'connection-line'}
              markerEnd={isSelected ? `url(#arrow-${app.id})` : undefined}
            />
            {/* Arrow for selected */}
            {isSelected && (
              <marker
                id={`arrow-${app.id}`}
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="8"
                markerHeight="8"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill={colors.connectionStroke} />
              </marker>
            )}
            {/* Route prefix label on the line */}
            <text
              x={(startX + endX) / 2 + (i % 2 === 0 ? -8 : 8)}
              y={midY - 6}
              textAnchor="middle"
              className="fill-slate-400 dark:fill-slate-500"
              fontSize="10"
              fontFamily="monospace"
            >
              {app.prefix}
            </text>
          </g>
        );
      })}

      {/* ---- Main FastAPI App Box ---- */}
      <g>
        {/* Pulse ring behind main app */}
        <rect
          x={MAIN_APP_X - MAIN_APP_W / 2 - 4}
          y={MAIN_APP_Y - MAIN_APP_H / 2 - 4}
          width={MAIN_APP_W + 8}
          height={MAIN_APP_H + 8}
          rx="18"
          fill="none"
          stroke="#14b8a6"
          strokeWidth="2"
          strokeOpacity="0.25"
          className="pulse-ring"
        />
        <rect
          x={MAIN_APP_X - MAIN_APP_W / 2}
          y={MAIN_APP_Y - MAIN_APP_H / 2}
          width={MAIN_APP_W}
          height={MAIN_APP_H}
          rx="14"
          fill="url(#mainGrad)"
          stroke="#14b8a6"
          strokeWidth="1"
        />
        {/* Icon via foreignObject */}
        <foreignObject x={MAIN_APP_X - 100} y={MAIN_APP_Y - 22} width={28} height={28}>
          <div className="flex items-center justify-center w-full h-full">
            <Server className="w-4 h-4" style={{color: 'white'}} />
          </div>
        </foreignObject>
        <text
          x={MAIN_APP_X + 8}
          y={MAIN_APP_Y - 8}
          textAnchor="middle"
          fill="white"
          fontSize="14"
          fontWeight="bold"
        >
          Main FastAPI
        </text>
        <text
          x={MAIN_APP_X + 2}
          y={MAIN_APP_Y + 12}
          textAnchor="middle"
          fill="rgba(255,255,255,0.7)"
          fontSize="11"
          fontFamily="monospace"
        >
          app = FastAPI()  :8000
        </text>
      </g>

      {/* ---- Sub App Boxes ---- */}
      {SUB_APPS.map((app, i) => {
        const pos = SUB_APP_POSITIONS[i];
        const colors = getAppColor(app.id);
        const isSelected = selectedId === app.id;

        return (
          <g
            key={app.id}
            onClick={() => onSelect(app.id)}
            className="cursor-pointer"
            role="button"
            aria-label={`Select ${app.name}`}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(app.id);
              }
            }}
            filter={isSelected ? `url(#glow-${app.id})` : undefined}
          >
            {/* Selection highlight ring */}
            {isSelected && (
              <rect
                x={pos.x - SUB_APP_W / 2 - 3}
                y={pos.y - SUB_APP_H / 2 - 3}
                width={SUB_APP_W + 6}
                height={SUB_APP_H + 6}
                rx="14"
                fill="none"
                stroke={colors.connectionStroke}
                strokeWidth="2.5"
                strokeOpacity="0.6"
                className="pulse-ring"
              />
            )}
            {/* Box background */}
            <rect
              x={pos.x - SUB_APP_W / 2}
              y={pos.y - SUB_APP_H / 2}
              width={SUB_APP_W}
              height={SUB_APP_H}
              rx="10"
              className={`${colors.fill} ${isSelected ? colors.stroke : 'stroke-slate-300 dark:stroke-slate-600'}`}
              strokeWidth={isSelected ? 2 : 1}
            />
            {/* Icon via foreignObject */}
            <foreignObject x={pos.x - 72} y={pos.y - 30} width={24} height={24}>
              <div className="flex items-center justify-center w-full h-full">
                <SubAppIcon appId={app.id} className={`w-4 h-4 ${isSelected ? colors.text : 'text-slate-500 dark:text-slate-400'}`} />
              </div>
            </foreignObject>
            {/* App name */}
            <text
              x={pos.x + 8}
              y={pos.y - 10}
              textAnchor="middle"
              className={isSelected ? colors.text : 'fill-slate-700 dark:fill-slate-300'}
              fontSize="12"
              fontWeight="600"
            >
              {app.name}
            </text>
            {/* Prefix */}
            <text
              x={pos.x}
              y={pos.y + 8}
              textAnchor="middle"
              className="fill-slate-400 dark:fill-slate-500"
              fontSize="9.5"
              fontFamily="monospace"
            >
              {app.prefix}
            </text>
            {/* Route count */}
            <text
              x={pos.x}
              y={pos.y + 24}
              textAnchor="middle"
              className="fill-slate-400 dark:fill-slate-500"
              fontSize="9"
            >
              {app.endpoints.length} endpoints
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function MultiAppRouter() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [animatingIn, setAnimatingIn] = useState(true);

  const selectedApp = SUB_APPS.find((a) => a.id === selectedId) ?? null;

  const handleSelect = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setAnimatingIn(false), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full space-y-6">
      {/* ---- Title ---- */}
      <div className={`text-center space-y-2 ${animatingIn ? 'sim-fade-in' : 'sim-fade-in'}`}>
        <div className="flex items-center justify-center gap-2">
          <Layers className="h-5 w-5 text-teal-500" />
          <h3 className="text-lg font-bold text-foreground">
            Multi-App Router Architecture
          </h3>
        </div>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          Mount independent FastAPI sub-applications under a single main application
          using <code className="font-mono text-xs px-1 py-0.5 rounded bg-muted border border-border">app.mount()</code>.
          Click any sub-app to explore its routes and code.
        </p>
      </div>

      {/* ---- Interactive SVG Diagram ---- */}
      <div className={`sim-slide-down ${animatingIn ? '' : ''}`}>
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm">
          <ArchitectureDiagram selectedId={selectedId} onSelect={handleSelect} />
        </div>
      </div>

      {/* ---- Sub-app quick-select chips ---- */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs text-muted-foreground mr-1">Select:</span>
        {SUB_APPS.map((app) => {
          const colors = getAppColor(app.id);
          const isActive = selectedId === app.id;
          return (
            <button
              key={app.id}
              onClick={() => handleSelect(app.id)}
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                transition-all duration-200 border cursor-pointer
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50
                ${isActive
                  ? `${colors.accentBg} ${colors.accentBorder} ${colors.accentText} shadow-sm`
                  : 'border-border bg-background text-muted-foreground hover:bg-muted hover:border-muted-foreground/30'
                }
              `}
              aria-pressed={isActive}
              aria-label={`Select ${app.name}`}
            >
              <SubAppIcon appId={app.id} className="h-3 w-3" />
              {app.name}
              {isActive && <ChevronRight className="h-3 w-3 rotate-90" />}
            </button>
          );
        })}
        {selectedId && (
          <button
            onClick={() => setSelectedId(null)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium
              border border-border bg-background text-muted-foreground hover:bg-rose-50 dark:hover:bg-rose-500/10
              hover:text-rose-600 dark:hover:text-rose-300 hover:border-rose-300 dark:hover:border-rose-500/30
              transition-all duration-200 cursor-pointer"
            aria-label="Deselect"
          >
            Clear
          </button>
        )}
      </div>

      {/* ---- Detail Panel ---- */}
      {selectedApp && <DetailPanel app={selectedApp} />}

      {/* ---- Main.py Mounting Code ---- */}
      <div className="sim-fade-in">
        <Card className="border-teal-500/30 overflow-hidden">
          <CardHeader className="pb-0 pt-4 px-4">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-teal-500" />
              <CardTitle className="text-sm text-teal-700 dark:text-teal-300">
                main.py &mdash; Mounting Sub-Applications
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-3 pb-4 px-4">
            <div className="rounded-lg border border-gray-800 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 border-b border-gray-800">
                <Code2 className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-xs text-gray-500 font-mono">main.py</span>
              </div>
              <pre className="bg-[#1a1b26] p-4 text-xs font-mono leading-relaxed overflow-x-auto">
                <code>{`# main.py
from fastapi import FastAPI
from app.routers.users import users_app
from app.routers.products import products_app
from app.routers.orders import orders_app
from app.routers.analytics import analytics_app

app = FastAPI(title="Multi-App API", version="1.0.0")

# Mount each sub-application under its route prefix
app.mount("/api/v1/users", users_app)
app.mount("/api/v1/products", products_app)
app.mount("/api/v1/orders", orders_app)
app.mount("/api/v1/analytics", analytics_app)

@app.get("/")
def root():
    return {
        "message": "Multi-App Router API",
        "docs": "/docs",
        "mounted_apps": [
            "/api/v1/users",
            "/api/v1/products",
            "/api/v1/orders",
            "/api/v1/analytics",
        ]
    }`}</code>
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ---- Key Concepts ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Server className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Independent Apps</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Each sub-app is a standalone FastAPI instance with its own routes, middleware, and docs.
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Route className="h-4 w-4 text-amber-600 dark:text-amber-300" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Path Prefixing</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                <code className="font-mono text-[10px] px-0.5 bg-muted rounded">app.mount()</code> automatically
                prefixes all routes with the mount path.
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
              <ExternalLink className="h-4 w-4 text-violet-600 dark:text-violet-300" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Separate Docs</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Each mounted app gets its own OpenAPI schema at <code className="font-mono text-[10px] px-0.5 bg-muted rounded">/docs</code> under its prefix.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ---- Architecture Summary ---- */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 px-4 py-3 rounded-xl bg-muted/50 border border-border">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-teal-500" />
          <span className="text-xs font-semibold text-foreground">Architecture Summary</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono text-teal-600 dark:text-teal-400">1</span> Main App
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span className="font-mono text-teal-600 dark:text-teal-400">{SUB_APPS.length}</span> Sub-Apps
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span className="font-mono text-teal-600 dark:text-teal-400">
            {SUB_APPS.reduce((sum, a) => sum + a.endpoints.length, 0)}
          </span>{' '}
          Total Endpoints
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span className="font-mono text-teal-600 dark:text-teal-400">app.mount()</span> Pattern
        </div>
      </div>
    </div>
  );
}
