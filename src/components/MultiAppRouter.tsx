'use client';

import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Server,
  Layers,
  ChevronDown,
  ChevronRight,
  Code2,
  ArrowRight,
  FolderOpen,
  Route,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MiniAppRoute {
  method: string;
  path: string;
  description: string;
}

export interface MiniApp {
  id: string;
  name: string;
  prefix: string;
  icon: string;
  description: string;
  routes: MiniAppRoute[];
  dependencies: string[];
  code: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  POST: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
  PUT: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  PATCH: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30',
  DELETE: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
};

const APP_ACCENT_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  users: {
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/40',
    text: 'text-sky-600 dark:text-sky-300',
    glow: 'group-hover:shadow-sky-500/20',
  },
  products: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/40',
    text: 'text-amber-600 dark:text-amber-300',
    glow: 'group-hover:shadow-amber-500/20',
  },
  orders: {
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/40',
    text: 'text-violet-600 dark:text-violet-300',
    glow: 'group-hover:shadow-violet-500/20',
  },
  auth: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/40',
    text: 'text-rose-600 dark:text-rose-300',
    glow: 'group-hover:shadow-rose-500/20',
  },
  analytics: {
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/40',
    text: 'text-teal-600 dark:text-teal-300',
    glow: 'group-hover:shadow-teal-500/20',
  },
};

function getAccent(id: string) {
  return APP_ACCENT_COLORS[id] ?? APP_ACCENT_COLORS['analytics'];
}

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

function DependencyBadge({ dep }: { dep: string }) {
  return (
    <Badge
      variant="secondary"
      className="text-[10px] px-2 py-0.5 bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20"
    >
      {dep}
    </Badge>
  );
}

function CodeBlock({ code, language = 'python' }: { code: string; language?: string }) {
  return (
    <div className="relative group rounded-lg overflow-hidden border border-gray-800">
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 border-b border-gray-800">
        <Code2 className="h-3.5 w-3.5 text-gray-500" />
        <span className="text-xs text-gray-500 font-mono">{language}</span>
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: '0.875rem',
          fontSize: '0.75rem',
          background: '#1a1b26',
          lineHeight: '1.5',
        }}
        showLineNumbers
        lineNumberStyle={{ minWidth: '2em', paddingRight: '1em', color: '#4a5568' }}
      >
        {code.trim()}
      </SyntaxHighlighter>
    </div>
  );
}

function MiniAppCard({ app, isOpen, onToggle }: { app: MiniApp; isOpen: boolean; onToggle: () => void }) {
  const accent = getAccent(app.id);

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <Card
        className={`group transition-all duration-300 hover:shadow-lg ${accent.glow} ${
          isOpen
            ? `${accent.border} shadow-md`
            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
        }`}
      >
        {/* ---- Header (always visible) ---- */}
        <CollapsibleTrigger asChild>
          <button
            className="w-full text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 rounded-xl"
            aria-expanded={isOpen}
            aria-controls={`miniapp-content-${app.id}`}
          >
            <CardHeader className="pb-0 pt-4 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg ${accent.bg} flex items-center justify-center shrink-0 transition-colors`}
                  >
                    <Server className={`h-4 w-4 ${accent.text}`} />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <span className="truncate">{app.name}</span>
                      <Badge
                        variant="outline"
                        className="font-mono text-[10px] px-1.5 py-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600 shrink-0"
                      >
                        {app.prefix}
                      </Badge>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {app.description}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 ml-2">
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-slate-400 dark:text-slate-500 transition-transform duration-200" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-500 transition-transform duration-200" />
                  )}
                </div>
              </div>
            </CardHeader>
          </button>
        </CollapsibleTrigger>

        {/* ---- Expandable content ---- */}
        <CollapsibleContent id={`miniapp-content-${app.id}`}>
          <CardContent className="pt-3 pb-4 px-4 space-y-4">
            {/* Routes table */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Route className="h-3.5 w-3.5 text-teal-500" />
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Routes
                </span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-auto">
                  {app.routes.length}
                </Badge>
              </div>
              <div className="rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden">
                {app.routes.map((route, i) => (
                  <div
                    key={`${route.method}-${route.path}`}
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs
                      ${i > 0 ? 'border-t border-slate-100 dark:border-slate-800' : ''}
                      hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors`}
                  >
                    <MethodBadge method={route.method} />
                    <code className="font-mono text-slate-700 dark:text-slate-300 flex-1">
                      {app.prefix}{route.path}
                    </code>
                    <span className="text-muted-foreground text-[11px] hidden sm:inline truncate max-w-[180px]">
                      {route.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dependencies */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Layers className="h-3.5 w-3.5 text-teal-500" />
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Dependencies
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {app.dependencies.map((dep) => (
                  <DependencyBadge key={dep} dep={dep} />
                ))}
              </div>
            </div>

            {/* Router code */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FolderOpen className="h-3.5 w-3.5 text-teal-500" />
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Router Code
                </span>
              </div>
              <CodeBlock code={app.code} />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function MultiAppRouter({ apps }: { apps: MiniApp[] }) {
  const [openAppIds, setOpenAppIds] = useState<Set<string>>(new Set());
  const [showMainCode, setShowMainCode] = useState(true);

  const handleToggle = (id: string) => {
    setOpenAppIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleExpandAll = () => setOpenAppIds(new Set(apps.map((a) => a.id)));
  const handleCollapseAll = () => setOpenAppIds(new Set());

  return (
    <div className="space-y-6">
      {/* ---- Central Main App Node ---- */}
      <div className="flex flex-col items-center">
        <div className="relative">
          <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-lg shadow-teal-500/20">
            <Server className="h-5 w-5" />
            <div>
              <div className="text-sm font-bold tracking-wide">Main FastAPI App</div>
              <div className="text-[11px] text-teal-100 font-mono">app = FastAPI()</div>
            </div>
          </div>
          {/* Pulse ring */}
          <div className="absolute inset-0 rounded-xl border-2 border-teal-400/40 animate-ping opacity-20 pointer-events-none" />
        </div>

        {/* Connecting lines - desktop: vertical stems to horizontal bus */}
        <div className="flex flex-col items-center mt-1">
          <div className="w-0.5 h-5 bg-teal-400/50" />
          <div className="w-0.5 h-3 bg-teal-400/30" />
        </div>
      </div>

      {/* ---- Controls ---- */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExpandAll}
          className="text-xs h-7"
          aria-label="Expand all mini-app cards"
        >
          <ChevronDown className="h-3.5 w-3.5 mr-1" />
          Expand All
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCollapseAll}
          className="text-xs h-7"
          aria-label="Collapse all mini-app cards"
        >
          <ChevronRight className="h-3.5 w-3.5 mr-1" />
          Collapse All
        </Button>
        <Button
          variant={showMainCode ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowMainCode((v) => !v)}
          className="text-xs h-7"
          aria-label="Toggle main.py code visibility"
        >
          <Code2 className="h-3.5 w-3.5 mr-1" />
          {showMainCode ? 'Hide main.py' : 'Show main.py'}
        </Button>
      </div>

      {/* ---- Mini-app cards ---- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {apps.map((app) => (
          <MiniAppCard
            key={app.id}
            app={app}
            isOpen={openAppIds.has(app.id)}
            onToggle={() => handleToggle(app.id)}
          />
        ))}
      </div>

      {/* ---- Visual connector hint ---- */}
      <div className="flex items-center justify-center gap-2 py-2">
        <div className="h-px flex-1 max-w-[80px] bg-slate-200 dark:bg-slate-700" />
        <ArrowRight className="h-4 w-4 text-slate-300 dark:text-slate-600 rotate-90" />
        <span className="text-xs text-muted-foreground">app.include_router()</span>
        <ArrowRight className="h-4 w-4 text-slate-300 dark:text-slate-600 rotate-90" />
        <div className="h-px flex-1 max-w-[80px] bg-slate-200 dark:bg-slate-700" />
      </div>

      {/* ---- Mounting code ---- */}
      {showMainCode && (
        <Card className="border-teal-500/30 bg-gradient-to-br from-teal-500/5 to-transparent overflow-hidden animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
          <CardHeader className="pb-0 pt-4 px-4">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-teal-500" />
              <CardTitle className="text-sm text-teal-700 dark:text-teal-300">
                main.py &mdash; Mounting All Routers
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-3 pb-4 px-4">
            <CodeBlock
              code={`# main.py
from fastapi import FastAPI
from app.routers import users, products, orders, auth, analytics

app = FastAPI(title="Multi-App API", version="1.0.0")

# Mount sub-application routers
app.include_router(users.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(auth.router)
app.include_router(analytics.router)

@app.get("/")
def root():
    return {"message": "Multi-App Router API", "docs": "/docs"}`}
            />
          </CardContent>
        </Card>
      )}

      {/* ---- Architecture summary ---- */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-teal-500" />
          <span className="text-xs font-semibold text-foreground">Architecture Summary</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono text-teal-600 dark:text-teal-400">1</span> Main App
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span className="font-mono text-teal-600 dark:text-teal-400">{apps.length}</span> Sub-Routers
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span className="font-mono text-teal-600 dark:text-teal-400">
            {apps.reduce((sum, a) => sum + a.routes.length, 0)}
          </span>{' '}
          Total Routes
        </div>
      </div>
    </div>
  );
}
