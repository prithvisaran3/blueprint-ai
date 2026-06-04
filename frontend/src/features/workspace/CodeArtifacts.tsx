import { useState } from 'react'
import Editor, { type BeforeMount } from '@monaco-editor/react'
import { Check, Copy, FileCode2 } from 'lucide-react'
import { GlassCard } from '@/components/shared'
import { cn } from '@/lib/utils'
import { useTheme } from '@/app/providers'
import type { CodeArtifact } from '@/types'

const THEME_DARK = 'blueprint-dark'

const defineThemes: BeforeMount = (monaco) => {
  monaco.editor.defineTheme(THEME_DARK, {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#00000000',
      'editorGutter.background': '#00000000',
      'editor.lineHighlightBackground': '#ffffff08',
      'editorLineNumber.foreground': '#5b6472',
    },
  })
}

function monacoLanguage(language: string): string {
  const map: Record<string, string> = {
    tsx: 'typescript',
    ts: 'typescript',
    typescript: 'typescript',
    js: 'javascript',
    python: 'python',
    py: 'python',
  }
  return map[language] ?? language
}

export function CodeArtifacts({ artifacts }: { artifacts: CodeArtifact[] }) {
  const [active, setActive] = useState(0)
  const [copied, setCopied] = useState(false)
  const { theme } = useTheme()

  if (!artifacts.length) {
    return (
      <GlassCard className="py-10 text-center text-sm text-muted-foreground">
        No code artifacts were generated for this agent yet.
      </GlassCard>
    )
  }

  const safeActive = Math.min(active, artifacts.length - 1)
  const current = artifacts[safeActive]
  if (!current?.code) {
    return (
      <GlassCard className="py-10 text-center text-sm text-muted-foreground">
        Code artifact data is missing or incomplete.
      </GlassCard>
    )
  }

  async function copy() {
    await navigator.clipboard.writeText(current.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  const lineCount = current.code.split('\n').length
  const height = Math.min(Math.max(lineCount * 19 + 24, 200), 520)

  return (
    <GlassCard className="p-0">
      <div className="flex items-center gap-1 overflow-x-auto border-b border-border px-2 py-2">
        {artifacts.map((a, i) => (
          <button
            key={a.path || i}
            onClick={() => setActive(i)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
              i === safeActive ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <FileCode2 className="size-3.5" />
            {a.path.split('/').pop()}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between px-4 py-2 text-xs text-muted-foreground">
        <span className="truncate font-mono">{current.path}</span>
        <button
          onClick={copy}
          className="flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-accent hover:text-foreground"
        >
          {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {current.description && (
        <p className="px-4 pb-2 text-xs text-muted-foreground">{current.description}</p>
      )}

      <div className="overflow-hidden rounded-b-2xl">
        <Editor
          key={current.path}
          height={height}
          language={monacoLanguage(current.language)}
          value={current.code}
          beforeMount={defineThemes}
          theme={theme === 'dark' ? THEME_DARK : 'vs'}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: 'JetBrains Mono, ui-monospace, monospace',
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            renderLineHighlight: 'line',
            padding: { top: 12, bottom: 12 },
            scrollbar: { alwaysConsumeMouseWheel: false },
            overviewRulerLanes: 0,
          }}
        />
      </div>
    </GlassCard>
  )
}
