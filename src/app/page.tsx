'use client';

import { useState, useCallback, useEffect } from 'react';
import { modules, projects, type Module, type Topic, type Project, totalTopics } from '@/lib/curriculum';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChevronDown, ChevronRight, CheckCircle2, Circle, Code2, Copy, Check,
  Menu, BookOpen, Rocket, Trophy, Lightbulb, Terminal, Eye,
  FolderOpen, Zap, GraduationCap, Star, ArrowRight, Home
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

type ViewState =
  | { type: 'home' }
  | { type: 'topic'; module: Module; topic: Topic }
  | { type: 'project'; project: Project };

function useProgress() {
  const [completed, setCompleted] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const saved = localStorage.getItem('fastapi-progress');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  useEffect(() => {
    try { localStorage.setItem('fastapi-progress', JSON.stringify([...completed])); } catch {}
  }, [completed]);

  const toggle = useCallback((id: string) => {
    setCompleted(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  return { completed, toggle, count: completed.size };
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="ghost" size="icon" className="h-7 w-7 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={handleCopy}>
      {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5 text-gray-400" />}
    </Button>
  );
}

function CodeBlock({ code, language = 'python' }: { code: string; language?: string }) {
  return (
    <div className="relative group rounded-lg overflow-hidden my-4 border border-gray-800">
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 border-b border-gray-800">
        <Terminal className="h-3.5 w-3.5 text-gray-500" />
        <span className="text-xs text-gray-500 font-mono">{language}</span>
      </div>
      <CopyButton text={code} />
      <SyntaxHighlighter language={language} style={oneDark} customStyle={{ margin: 0, padding: '1rem', fontSize: '0.8125rem', background: '#1a1b26' }} showLineNumbers>
        {code.trim()}
      </SyntaxHighlighter>
    </div>
  );
}

function OutputBlock({ output }: { output: string }) {
  return (
    <div className="relative group rounded-lg overflow-hidden my-4 border border-emerald-900/40">
      <div className="flex items-center gap-2 px-4 py-2 bg-emerald-950/50 border-b border-emerald-900/40">
        <Eye className="h-3.5 w-3.5 text-emerald-500" />
        <span className="text-xs text-emerald-600 font-mono">Output</span>
      </div>
      <CopyButton text={output} />
      <SyntaxHighlighter language="bash" style={oneDark} customStyle={{ margin: 0, padding: '1rem', fontSize: '0.8125rem', background: '#0d1117' }}>
        {output.trim()}
      </SyntaxHighlighter>
    </div>
  );
}

function TopicContent({ topic, isCompleted, onToggleComplete }: { topic: Topic; isCompleted: boolean; onToggleComplete: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{topic.title}</h1>
        </div>
        <Button variant={isCompleted ? "default" : "outline"} size="sm" onClick={onToggleComplete} className="shrink-0 gap-1.5">
          {isCompleted ? <><CheckCircle2 className="h-4 w-4" /> Done</> : <><Circle className="h-4 w-4" /> Mark Done</>}
        </Button>
      </div>

      <div className="prose prose-slate dark:prose-invert max-w-none">
        <ReactMarkdown>{topic.content}</ReactMarkdown>
      </div>

      {topic.code && <CodeBlock code={topic.code} />}

      {topic.output && <OutputBlock output={topic.output} />}

      {topic.tips && topic.tips.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Lightbulb className="h-5 w-5" /> Pro Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topic.tips.map((tip, i) => (
              <p key={i} className="text-sm text-amber-700 dark:text-amber-300 flex gap-2">
                <Zap className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
                <span>{tip}</span>
              </p>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ProjectContent({ project }: { project: Project }) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Badge variant={project.type === 'major' ? 'default' : 'secondary'} className="text-xs">
            {project.type === 'major' ? '🏆 Major Project' : '🛠️ Mini Project'}
          </Badge>
          <Badge variant="outline" className="text-xs">{project.difficulty}</Badge>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">{project.icon} {project.title}</h1>
        <p className="text-muted-foreground mt-2">{project.description}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {project.features.map((f, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-teal-500 shrink-0" />
            <span>{f}</span>
          </div>
        ))}
      </div>

      <div className="prose prose-slate dark:prose-invert max-w-none">
        <ReactMarkdown>{project.content}</ReactMarkdown>
      </div>

      <CodeBlock code={project.code} />
    </div>
  );
}

function SidebarContent({ view, setView, progress, expandedModules, toggleModule }: {
  view: ViewState;
  setView: (v: ViewState) => void;
  progress: { completed: Set<string>; toggle: (id: string) => void; count: number };
  expandedModules: Set<string>;
  toggleModule: (id: string) => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <button onClick={() => setView({ type: 'home' })} className="flex items-center gap-3 w-full hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center font-bold text-white text-sm shadow-lg shadow-teal-500/20">⚡</div>
          <div className="text-left">
            <h2 className="font-bold text-foreground text-sm">FastAPI Mastery</h2>
            <p className="text-xs text-muted-foreground">Zero → Production Ready</p>
          </div>
        </button>
      </div>

      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span>{progress.count} of {totalTopics} completed</span>
          <span>{Math.round((progress.count / totalTopics) * 100)}%</span>
        </div>
        <Progress value={(progress.count / totalTopics) * 100} className="h-2" />
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          <button onClick={() => setView({ type: 'home' })} className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors ${view.type === 'home' ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-accent/50 text-muted-foreground'}`}>
            <Home className="h-4 w-4" /> Dashboard
          </button>

          {modules.map(mod => {
            const isExpanded = expandedModules.has(mod.id);
            const modTopics = mod.topics.length;
            const modCompleted = mod.topics.filter(t => progress.completed.has(t.id)).length;
            return (
              <Collapsible key={mod.id} open={isExpanded} onOpenChange={() => toggleModule(mod.id)}>
                <CollapsibleTrigger asChild>
                  <button className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors hover:bg-accent/50 ${view.type === 'topic' && modules.find(m => m.topics.some(t => t.id === (view as any).topic?.id))?.id === mod.id ? 'bg-accent/30' : ''}`}>
                    <span className="text-base">{mod.icon}</span>
                    <span className="flex-1 text-left font-medium truncate">{mod.title}</span>
                    <span className="text-xs text-muted-foreground">{modCompleted}/{modTopics}</span>
                    {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="ml-4 space-y-0.5 mt-1">
                    {mod.topics.map(topic => {
                      const done = progress.completed.has(topic.id);
                      const isActive = view.type === 'topic' && (view as any).topic?.id === topic.id;
                      return (
                        <button key={topic.id} onClick={() => setView({ type: 'topic', module: mod, topic })} className={`flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-xs transition-colors ${isActive ? 'bg-primary text-primary-foreground font-medium' : done ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground hover:bg-accent/50'}`}>
                          {done ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> : <Circle className="h-3.5 w-3.5 shrink-0" />}
                          <span className="truncate">{topic.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}

          <Separator className="my-2" />

          <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Projects</div>

          {projects.map(proj => {
            const isActive = view.type === 'project' && (view as any).project?.id === proj.id;
            const done = progress.completed.has(proj.id);
            return (
              <button key={proj.id} onClick={() => setView({ type: 'project', project: proj })} className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary text-primary-foreground font-medium' : done ? 'text-emerald-600 dark:text-emerald-400 hover:bg-accent/50' : 'text-muted-foreground hover:bg-accent/50'}`}>
                <span className="text-base">{proj.icon}</span>
                <span className="flex-1 text-left truncate font-medium">{proj.title}</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">{proj.type === 'major' ? 'MAJOR' : 'MINI'}</Badge>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

function HomePage({ setView, progress }: { setView: (v: ViewState) => void; progress: { completed: Set<string>; toggle: (id: string) => void; count: number } }) {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-emerald-600 to-cyan-700 p-8 md:p-12 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl">⚡</div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">FastAPI Mastery</h1>
              <p className="text-teal-100 text-sm">Zero → Production Ready</p>
            </div>
          </div>
          <p className="text-teal-100 max-w-2xl text-base md:text-lg leading-relaxed mb-6">
            The complete guide to building real-world APIs with Python. From your first endpoint to production deployment — 
            Pydantic V2, authentication, databases, WebSocket, Docker, and 5 hands-on projects.
          </p>
          <div className="flex flex-wrap gap-3 mb-6">
            <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">🛡️ Pydantic V2</Badge>
            <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">🔐 JWT Auth</Badge>
            <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">🗄️ SQLAlchemy</Badge>
            <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">💬 WebSocket</Badge>
            <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">🚢 Docker</Badge>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="font-semibold">{totalTopics} topics</span>
            <span className="text-teal-200">•</span>
            <span className="font-semibold">3 mini projects</span>
            <span className="text-teal-200">•</span>
            <span className="font-semibold">2 major projects</span>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2"><GraduationCap className="h-5 w-5 text-teal-500" /> Your Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>{progress.count} of {totalTopics} topics completed</span>
            <span className="font-semibold text-foreground">{Math.round((progress.count / totalTopics) * 100)}%</span>
          </div>
          <Progress value={(progress.count / totalTopics) * 100} className="h-3 mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 rounded-lg bg-teal-500/10 border border-teal-500/20">
              <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">{modules.length}</div>
              <div className="text-xs text-muted-foreground">Modules</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{modules.reduce((a, m) => a + m.topics.length, 0)}</div>
              <div className="text-xs text-muted-foreground">Topics</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">3</div>
              <div className="text-xs text-muted-foreground">Mini Projects</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">2</div>
              <div className="text-xs text-muted-foreground">Major Projects</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modules Grid */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><BookOpen className="h-5 w-5 text-teal-500" /> Learning Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map(mod => {
            const modCompleted = mod.topics.filter(t => progress.completed.has(t.id)).length;
            return (
              <Card key={mod.id} className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => setView({ type: 'topic', module: mod, topic: mod.topics[0] })}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{mod.icon}</span>
                    <Badge variant="outline" className="text-xs">{modCompleted}/{mod.topics.length}</Badge>
                  </div>
                  <CardTitle className="text-base group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">{mod.title}</CardTitle>
                  <CardDescription className="text-xs line-clamp-2">{mod.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Progress value={(modCompleted / mod.topics.length) * 100} className="h-1.5 mb-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{mod.topics.length} topics</span>
                    <span className="flex items-center gap-1 text-teal-600 dark:text-teal-400 font-medium">Start <ArrowRight className="h-3 w-3" /></span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Projects */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Trophy className="h-5 w-5 text-amber-500" /> Hands-On Projects</h2>
        <Tabs defaultValue="mini">
          <TabsList className="mb-4">
            <TabsTrigger value="mini">🛠️ Mini Projects</TabsTrigger>
            <TabsTrigger value="major">🏆 Major Projects</TabsTrigger>
          </TabsList>
          <TabsContent value="mini">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {projects.filter(p => p.type === 'mini').map(proj => (
                <Card key={proj.id} className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => setView({ type: 'project', project: proj })}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl">{proj.icon}</span>
                      <Badge variant="secondary" className="text-xs">{proj.difficulty}</Badge>
                    </div>
                    <CardTitle className="text-base group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">{proj.title}</CardTitle>
                    <CardDescription className="text-xs">{proj.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-1">
                      {proj.features.slice(0, 4).map((f, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CheckCircle2 className="h-3 w-3 text-teal-500 shrink-0" /> {f}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="major">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.filter(p => p.type === 'major').map(proj => (
                <Card key={proj.id} className="hover:shadow-lg transition-shadow cursor-pointer group border-amber-500/20" onClick={() => setView({ type: 'project', project: proj })}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl">{proj.icon}</span>
                      <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30 text-xs">{proj.difficulty}</Badge>
                    </div>
                    <CardTitle className="text-base group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{proj.title}</CardTitle>
                    <CardDescription className="text-xs">{proj.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-1">
                      {proj.features.slice(0, 6).map((f, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Star className="h-3 w-3 text-amber-500 shrink-0" /> {f}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function FastAPITutorial() {
  const [view, setView] = useState<ViewState>({ type: 'home' });
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const progress = useProgress();

  const toggleModule = useCallback((id: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleSetView = useCallback((v: ViewState) => {
    setView(v);
    if (v.type === 'topic') {
      setExpandedModules(prev => new Set([...prev, v.module.id]));
    }
  }, []);

  const currentModule = view.type === 'topic' ? view.module : null;
  const currentTopic = view.type === 'topic' ? view.topic : null;

  // Find next topic
  const getNextTopic = (): ViewState | null => {
    if (view.type !== 'topic') return null;
    const modIdx = modules.findIndex(m => m.id === view.module.id);
    const topIdx = modules[modIdx].topics.findIndex(t => t.id === view.topic.id);
    if (topIdx < modules[modIdx].topics.length - 1) {
      return { type: 'topic', module: modules[modIdx], topic: modules[modIdx].topics[topIdx + 1] };
    }
    if (modIdx < modules.length - 1) {
      return { type: 'topic', module: modules[modIdx + 1], topic: modules[modIdx + 1].topics[0] };
    }
    return { type: 'project', project: projects[0] };
  };
  const nextView = getNextTopic();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-72 lg:flex-col border-r border-border bg-card shrink-0">
        <SidebarContent view={view} setView={handleSetView} progress={progress} expandedModules={expandedModules} toggleModule={toggleModule} />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 border-b border-border flex items-center px-4 gap-3 shrink-0 bg-card">
          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="sr-only"><SheetTitle>Navigation</SheetTitle></SheetHeader>
              <SidebarContent view={view} setView={handleSetView} progress={progress} expandedModules={expandedModules} toggleModule={toggleModule} />
            </SheetContent>
          </Sheet>

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground overflow-hidden">
            <button onClick={() => setView({ type: 'home' })} className="hover:text-foreground transition-colors shrink-0">Home</button>
            {currentModule && (
              <>
                <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{currentModule.icon} {currentModule.title}</span>
              </>
            )}
            {view.type === 'project' && (
              <>
                <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{(view as any).project.icon} {(view as any).project.title}</span>
              </>
            )}
            {currentTopic && (
              <>
                <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate text-foreground font-medium">{currentTopic.title}</span>
              </>
            )}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Badge variant="outline" className="text-xs hidden sm:flex">
              <Code2 className="h-3 w-3 mr-1" /> FastAPI
            </Badge>
          </div>
        </header>

        {/* Content Area */}
        <ScrollArea className="flex-1">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
            {view.type === 'home' && <HomePage setView={handleSetView} progress={progress} />}

            {view.type === 'topic' && currentTopic && currentModule && (
              <>
                <TopicContent
                  topic={currentTopic}
                  isCompleted={progress.completed.has(currentTopic.id)}
                  onToggleComplete={() => progress.toggle(currentTopic.id)}
                />
                {/* Next button */}
                {nextView && (
                  <div className="mt-10 pt-6 border-t border-border">
                    <Button onClick={() => handleSetView(nextView)} className="gap-2">
                      Continue <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}

            {view.type === 'project' && (
              <ProjectContent project={(view as any).project} />
            )}
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
