import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

const components: Components = {
  h1: ({ children }) => <h1 className="mt-6 mb-3 text-2xl font-semibold tracking-tight first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="mt-6 mb-2.5 text-xl font-semibold tracking-tight first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-5 mb-2 text-base font-semibold first:mt-0">{children}</h3>,
  p: ({ children }) => <p className="my-3 leading-relaxed text-muted-foreground">{children}</p>,
  ul: ({ children }) => <ul className="my-3 ml-5 list-disc space-y-1.5 text-muted-foreground marker:text-primary/60">{children}</ul>,
  ol: ({ children }) => <ol className="my-3 ml-5 list-decimal space-y-1.5 text-muted-foreground">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noreferrer" className="text-primary underline-offset-4 hover:underline">
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-4 border-l-2 border-primary/50 bg-primary/5 py-1 pl-4 text-muted-foreground italic">
      {children}
    </blockquote>
  ),
  code: ({ className, children }) => {
    const isBlock = className?.includes('language-')
    if (isBlock) {
      return (
        <code className="block overflow-x-auto rounded-lg border border-border bg-card/60 p-4 font-mono text-xs leading-relaxed">
          {children}
        </code>
      )
    }
    return <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-primary">{children}</code>
  },
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-muted/50">{children}</thead>,
  th: ({ children }) => <th className="px-4 py-2 text-left font-medium">{children}</th>,
  td: ({ children }) => <td className="border-t border-border px-4 py-2 text-muted-foreground">{children}</td>,
  hr: () => <hr className="my-6 border-border" />,
}

export function MarkdownView({ content, className }: { content: string; className?: string }) {
  return (
    <div className={cn('text-sm', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
