'use client';

import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { FrontendIntegration } from '@/lib/curriculum/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Code2,
  Copy,
  Check,
  Terminal,
  Eye,
  AlertTriangle,
  Lightbulb,
  Zap,
  Globe,
  FlaskConical,
} from 'lucide-react';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
      onClick={handleCopy}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-400" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-gray-400" />
      )}
    </Button>
  );
}

export function FrontendExample({ example }: { example: FrontendIntegration }) {
  const { title, vanillaHtml, corsNote } = example;
  const lang = vanillaHtml.language || 'html';

  return (
    <div className="space-y-5">
      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
          <Globe className="h-5 w-5 text-orange-500" />
        </div>
        <h3 className="text-xl font-bold text-foreground">{title}</h3>
      </div>

      {/* Code Example */}
      <div>
        {vanillaHtml.title && (
          <div className="flex items-center gap-2 mb-2">
            <Code2 className="h-4 w-4 text-teal-500" />
            <span className="text-sm font-semibold text-foreground">
              {vanillaHtml.title}
            </span>
            {vanillaHtml.language && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-1">
                {vanillaHtml.language}
              </Badge>
            )}
          </div>
        )}
        {vanillaHtml.description && (
          <p className="text-sm text-muted-foreground mb-2">
            {vanillaHtml.description}
          </p>
        )}
        <div className="relative group rounded-lg overflow-hidden border border-gray-800">
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 border-b border-gray-800">
            <Terminal className="h-3.5 w-3.5 text-gray-500" />
            <span className="text-xs text-gray-500 font-mono">{lang}</span>
          </div>
          <CopyButton text={vanillaHtml.code} />
          <SyntaxHighlighter
            language={lang}
            style={oneDark}
            customStyle={{
              margin: 0,
              padding: '1rem',
              fontSize: '0.8125rem',
              background: '#1a1b26',
            }}
            showLineNumbers
          >
            {vanillaHtml.code.trim()}
          </SyntaxHighlighter>
        </div>

        {/* Output */}
        {vanillaHtml.output && (
          <div className="relative group rounded-lg overflow-hidden mt-2 border border-emerald-900/40">
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-950/50 border-b border-emerald-900/40">
              <Eye className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs text-emerald-600 font-mono">Output</span>
            </div>
            <CopyButton text={vanillaHtml.output} />
            <SyntaxHighlighter
              language="bash"
              style={oneDark}
              customStyle={{
                margin: 0,
                padding: '1rem',
                fontSize: '0.8125rem',
                background: '#0d1117',
              }}
            >
              {vanillaHtml.output.trim()}
            </SyntaxHighlighter>
          </div>
        )}
      </div>

      {/* CORS Note Callout */}
      {corsNote && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                CORS Note:{' '}
              </span>
              <span className="text-sm text-amber-600 dark:text-amber-400">
                {corsNote}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* What Happened Bullets */}
      {vanillaHtml.whatHappened && vanillaHtml.whatHappened.length > 0 && (
        <Card className="border-teal-500/30 bg-teal-500/5">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-teal-500" />
              <span className="text-sm font-semibold text-teal-700 dark:text-teal-300">
                What Happened
              </span>
            </div>
            <ul className="space-y-1.5">
              {vanillaHtml.whatHappened.map((item, i) => (
                <li
                  key={i}
                  className="text-sm text-teal-600 dark:text-teal-400 flex gap-2"
                >
                  <Zap className="h-4 w-4 mt-0.5 shrink-0 text-teal-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Try to Break Bullets */}
      {vanillaHtml.tryToBreak && vanillaHtml.tryToBreak.length > 0 && (
        <Card className="border-rose-500/30 bg-rose-500/5">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <FlaskConical className="h-4 w-4 text-rose-500" />
              <span className="text-sm font-semibold text-rose-700 dark:text-rose-300">
                Try to Break It
              </span>
            </div>
            <ul className="space-y-1.5">
              {vanillaHtml.tryToBreak.map((item, i) => (
                <li
                  key={i}
                  className="text-sm text-rose-600 dark:text-rose-400 flex gap-2"
                >
                  <FlaskConical className="h-3.5 w-3.5 mt-0.5 shrink-0 text-rose-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
