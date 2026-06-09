'use client';

import { FlowStep, Visualization } from '@/lib/curriculum/types';
import { ArrowRight, ArrowDown, Layers, GitBranch, Database, Server, Globe, Shield, Zap, Users } from 'lucide-react';

function FlowDiagram({ steps }: { steps: FlowStep[] }) {
  return (
    <div className="my-4 p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 border border-slate-200 dark:border-slate-700">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`px-4 py-2.5 rounded-lg text-sm font-medium shadow-sm border transition-all
              ${step.highlight
                ? 'bg-teal-500 text-white border-teal-600 shadow-teal-200 dark:shadow-teal-900/30'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600'
              }`}>
              <div className="font-semibold">{step.label}</div>
              {step.detail && <div className="text-xs opacity-80 mt-0.5">{step.detail}</div>}
            </div>
            {i < steps.length - 1 && (
              <ArrowRight className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SequenceDiagram({ steps }: { steps: FlowStep[] }) {
  return (
    <div className="my-4 p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 border border-slate-200 dark:border-slate-700">
      <div className="flex flex-col items-center gap-1 max-w-md mx-auto">
        {steps.map((step, i) => (
          <div key={i} className="flex flex-col items-center gap-1 w-full">
            <div className={`px-4 py-2 rounded-lg text-sm font-medium w-full text-center border
              ${step.highlight
                ? 'bg-teal-500 text-white border-teal-600'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600'
              }`}>
              <div className="font-semibold">{step.label}</div>
              {step.detail && <div className="text-xs opacity-80 mt-0.5">{step.detail}</div>}
            </div>
            {i < steps.length - 1 && (
              <div className="flex flex-col items-center">
                <div className="w-0.5 h-4 bg-slate-300 dark:bg-slate-600" />
                <ArrowDown className="h-3 w-3 text-slate-400 -mt-1" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ArchitectureDiagram({ layers }: { layers: { label: string; items: string[] }[] }) {
  const iconMap: Record<string, React.ReactNode> = {
    'Client': <Globe className="h-4 w-4" />,
    'API': <Server className="h-4 w-4" />,
    'Auth': <Shield className="h-4 w-4" />,
    'Database': <Database className="h-4 w-4" />,
    'Cache': <Zap className="h-4 w-4" />,
    'Service': <Layers className="h-4 w-4" />,
    'Users': <Users className="h-4 w-4" />,
    'Routes': <GitBranch className="h-4 w-4" />,
  };

  return (
    <div className="my-4 p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 border border-slate-200 dark:border-slate-700">
      <div className="flex flex-col gap-2 max-w-lg mx-auto">
        {layers.map((layer, i) => (
          <div key={i} className="rounded-lg border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 overflow-hidden shadow-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600">
              {iconMap[layer.label] || <Layers className="h-4 w-4" />}
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{layer.label}</span>
            </div>
            <div className="px-3 py-2 flex flex-wrap gap-1.5">
              {layer.items.map((item, j) => (
                <span key={j} className="px-2 py-0.5 text-xs rounded-md bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComparisonTable({ columns }: { columns: { title: string; items: string[] }[] }) {
  return (
    <div className="my-4 p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 border border-slate-200 dark:border-slate-700 overflow-x-auto">
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
        {columns.map((col, i) => (
          <div key={i} className="rounded-lg border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 overflow-hidden">
            <div className={`px-3 py-2 text-center text-sm font-bold border-b
              ${i === 0 ? 'bg-teal-500 text-white border-teal-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600'}`}>
              {col.title}
            </div>
            <div className="px-3 py-2 space-y-1.5">
              {col.items.map((item, j) => (
                <div key={j} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                  <span className="text-teal-500 mt-0.5">•</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function VisualizationBlock({ visualization }: { visualization: Visualization }) {
  return (
    <div className="my-6">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg bg-teal-500/10 flex items-center justify-center">
          <Layers className="h-4 w-4 text-teal-500" />
        </div>
        <h4 className="text-sm font-bold text-teal-700 dark:text-teal-400">{visualization.title}</h4>
      </div>
      <p className="text-sm text-muted-foreground mb-3">{visualization.description}</p>

      {visualization.type === 'flow' && visualization.steps && (
        <FlowDiagram steps={visualization.steps} />
      )}
      {visualization.type === 'sequence' && visualization.steps && (
        <SequenceDiagram steps={visualization.steps} />
      )}
      {visualization.type === 'architecture' && visualization.layers && (
        <ArchitectureDiagram layers={visualization.layers} />
      )}
      {visualization.type === 'comparison' && visualization.columns && (
        <ComparisonTable columns={visualization.columns} />
      )}
      {visualization.type === 'data-flow' && visualization.steps && (
        <FlowDiagram steps={visualization.steps} />
      )}
    </div>
  );
}
