'use client';

import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FrontendIntegration } from '@/lib/curriculum/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Copy,
  Check,
  Eye,
  EyeOff,
  AlertTriangle,
  Lightbulb,
  Zap,
  FlaskConical,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

export function FrontendExample({ frontendIntegration }: { frontendIntegration: FrontendIntegration }) {
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  const { title, vanillaHtml, corsNote } = frontendIntegration;
  const lang = vanillaHtml.language || 'html';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(vanillaHtml.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for environments where clipboard API is unavailable
      const textarea = document.createElement('textarea');
      textarea.value = vanillaHtml.code;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-5">
      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
          <span className="text-lg" role="img" aria-label="HTML">🌐</span>
        </div>
        <h3 className="text-xl font-bold text-foreground">{title}</h3>
      </div>

      {/* Code Card */}
      <Card className="overflow-hidden border border-gray-800 dark:border-gray-700">
        {/* Card Header Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900 dark:bg-gray-800 border-b border-gray-800 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-sm" role="img" aria-label="HTML file">🌐</span>
            <span className="text-xs text-gray-400 dark:text-gray-500 font-mono font-medium">
              {vanillaHtml.title || `${lang.toUpperCase()} File`}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 gap-1.5 text-xs text-gray-400 hover:text-foreground transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-green-400" />
                <span className="text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </Button>
        </div>

        {/* Code Description */}
        {vanillaHtml.description && (
          <div className="px-4 py-2 bg-gray-900/50 dark:bg-gray-800/50 border-b border-gray-800/50 dark:border-gray-700/50">
            <p className="text-sm text-muted-foreground">
              {vanillaHtml.description}
            </p>
          </div>
        )}

        {/* Syntax Highlighted Code */}
        <div className="overflow-x-auto">
          <SyntaxHighlighter
            language={lang}
            style={oneDark}
            customStyle={{
              margin: 0,
              padding: '1rem',
              fontSize: '0.8125rem',
              background: '#1a1b26',
              borderRadius: 0,
            }}
            showLineNumbers
            lineNumberStyle={{
              minWidth: '2.5em',
              paddingRight: '1em',
              color: '#4a5568',
            }}
          >
            {vanillaHtml.code.trim()}
          </SyntaxHighlighter>
        </div>

        {/* Output */}
        {vanillaHtml.output && (
          <div className="border-t border-gray-800 dark:border-gray-700">
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-950/30 border-b border-emerald-900/30">
              <Eye className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">
                Output
              </span>
            </div>
            <div className="overflow-x-auto">
              <SyntaxHighlighter
                language="bash"
                style={oneDark}
                customStyle={{
                  margin: 0,
                  padding: '1rem',
                  fontSize: '0.8125rem',
                  background: '#0d1117',
                  borderRadius: 0,
                }}
              >
                {vanillaHtml.output.trim()}
              </SyntaxHighlighter>
            </div>
          </div>
        )}
      </Card>

      {/* Preview Toggle Section */}
      <Card className="overflow-hidden border border-gray-800 dark:border-gray-700">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-900 dark:bg-gray-800 hover:bg-gray-800/80 dark:hover:bg-gray-700/80 transition-colors"
          aria-expanded={showPreview}
          aria-controls="preview-panel"
        >
          <div className="flex items-center gap-2">
            {showPreview ? (
              <EyeOff className="h-4 w-4 text-teal-500" />
            ) : (
              <Eye className="h-4 w-4 text-teal-500" />
            )}
            <span className="text-sm font-semibold text-foreground">
              {showPreview ? 'Hide Preview' : 'Preview'}
            </span>
          </div>
          {showPreview ? (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
        </button>

        {showPreview && (
          <div
            id="preview-panel"
            className="border-t border-gray-800 dark:border-gray-700 bg-white"
          >
            <iframe
              srcDoc={vanillaHtml.code}
              title={`Preview: ${title}`}
              className="w-full h-80 border-0"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        )}
      </Card>

      {/* CORS Note Alert */}
      {corsNote && (
        <Card className="border-amber-500/30 bg-amber-500/5 dark:border-amber-500/20 dark:bg-amber-500/10">
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

      {/* What Happened Section */}
      {vanillaHtml.whatHappened && vanillaHtml.whatHappened.length > 0 && (
        <Card className="border-teal-500/30 bg-teal-500/5 dark:border-teal-500/20 dark:bg-teal-500/10">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-teal-500" />
              <span className="text-sm font-semibold text-teal-700 dark:text-teal-300">
                What Happened
              </span>
            </div>
            <ul className="space-y-1.5" role="list">
              {vanillaHtml.whatHappened.map((item, i) => (
                <li
                  key={i}
                  className="text-sm text-teal-600 dark:text-teal-400 flex gap-2"
                >
                  <Zap className="h-4 w-4 mt-0.5 shrink-0 text-teal-500" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Try to Break Section */}
      {vanillaHtml.tryToBreak && vanillaHtml.tryToBreak.length > 0 && (
        <Card className="border-rose-500/30 bg-rose-500/5 dark:border-rose-500/20 dark:bg-rose-500/10">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <FlaskConical className="h-4 w-4 text-rose-500" />
              <span className="text-sm font-semibold text-rose-700 dark:text-rose-300">
                Try to Break It
              </span>
            </div>
            <ul className="space-y-1.5" role="list">
              {vanillaHtml.tryToBreak.map((item, i) => (
                <li
                  key={i}
                  className="text-sm text-rose-600 dark:text-rose-400 flex gap-2"
                >
                  <FlaskConical className="h-3.5 w-3.5 mt-0.5 shrink-0 text-rose-500" aria-hidden="true" />
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

export default FrontendExample;
