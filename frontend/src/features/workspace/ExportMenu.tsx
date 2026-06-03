import { useState } from 'react'
import { Download, GitBranch, Loader2, ExternalLink, Ticket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useExportJira, useExportGithub } from '@/hooks/queries'
import type { WireGitHubExportResponse, WireJiraExportResponse } from '@/lib/api/types'

type Mode = 'jira' | 'github'

export function ExportMenu({ runId }: { runId: string }) {
  const [mode, setMode] = useState<Mode | null>(null)

  // Jira form
  const [projectKey, setProjectKey] = useState('BP')
  // GitHub form
  const [repo, setRepo] = useState('')
  const [token, setToken] = useState('')
  const [dryRun, setDryRun] = useState(true)

  const jira = useExportJira()
  const github = useExportGithub()

  function open(next: Mode) {
    jira.reset()
    github.reset()
    setMode(next)
  }

  function close() {
    setMode(null)
  }

  async function runJira() {
    await jira.mutateAsync({ runId, projectKey: projectKey.trim() || 'BP' })
  }

  async function runGithub() {
    await github.mutateAsync({
      runId,
      repo: repo.trim() || undefined,
      token: token.trim() || undefined,
      dryRun,
    })
  }

  const jiraData = jira.data as WireJiraExportResponse | undefined
  const githubData = github.data as WireGitHubExportResponse | undefined

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>
            <Download className="size-4" /> Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Export plan</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => open('jira')}>
            <Ticket /> Generate Jira Tickets
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => open('github')}>
            <GitBranch /> Export to GitHub Issues
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Jira dialog */}
      <Dialog open={mode === 'jira'} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate Jira tickets</DialogTitle>
            <DialogDescription>
              Convert the planner's epics, stories, and tasks into Jira issue payloads you can import.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="jira-key">Project key</Label>
              <Input
                id="jira-key"
                value={projectKey}
                onChange={(e) => setProjectKey(e.target.value.toUpperCase())}
                placeholder="BP"
              />
            </div>
            <Button onClick={runJira} disabled={jira.isPending}>
              {jira.isPending ? <Loader2 className="size-4 animate-spin" /> : <Ticket className="size-4" />}
              Generate
            </Button>
          </div>

          {jira.isError && (
            <p className="text-sm text-destructive">
              {(jira.error as Error)?.message ?? 'Export failed'}
            </p>
          )}

          {jiraData && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="success">{jiraData.count} tickets</Badge>
                <span>project {jiraData.project_key}</span>
              </div>
              <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-border p-2">
                {jiraData.tickets.map((t) => (
                  <div key={t.ref} className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {t.fields.issuetype.name}
                      </Badge>
                      <span className="font-medium">{t.fields.summary}</span>
                    </div>
                    {t.parent_ref && (
                      <p className="mt-0.5 text-xs text-muted-foreground">parent: {t.parent_ref}</p>
                    )}
                  </div>
                ))}
              </div>
              <CopyJsonButton data={jiraData.tickets} label="Copy ticket payloads" />
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={close}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* GitHub dialog */}
      <Dialog open={mode === 'github'} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Export to GitHub Issues</DialogTitle>
            <DialogDescription>
              Preview the issues, or provide a repo and a personal access token to create them. Your
              token is sent only for this request and never stored.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="gh-repo">Repository</Label>
              <Input
                id="gh-repo"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                placeholder="owner/repo"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gh-token">Access token</Label>
              <Input
                id="gh-token"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_…"
                autoComplete="off"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              className="size-4 rounded border-border"
            />
            Dry run (preview only — don't create issues)
          </label>

          <Button onClick={runGithub} disabled={github.isPending} className="w-fit">
            {github.isPending ? <Loader2 className="size-4 animate-spin" /> : <GitBranch className="size-4" />}
            {dryRun ? 'Preview issues' : 'Create issues'}
          </Button>

          {github.isError && (
            <p className="text-sm text-destructive">
              {(github.error as Error)?.message ?? 'Export failed'}
            </p>
          )}

          {githubData && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="success">{githubData.count} issues</Badge>
                {githubData.dry_run ? (
                  <span>dry run</span>
                ) : (
                  <span>{githubData.created} created in {githubData.repo}</span>
                )}
              </div>
              <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-border p-2">
                {githubData.issues.map((issue, i) => (
                  <div key={i} className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{issue.title}</span>
                      {issue.url && (
                        <a
                          href={issue.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline"
                        >
                          <ExternalLink className="size-3.5" />
                        </a>
                      )}
                    </div>
                    {issue.labels.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {issue.labels.map((l) => (
                          <Badge key={l} variant="outline" className="text-[10px]">
                            {l}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <CopyJsonButton data={githubData.issues} label="Copy issue payloads" />
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={close}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function CopyJsonButton({ data, label }: { data: unknown; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        navigator.clipboard?.writeText(JSON.stringify(data, null, 2))
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
    >
      {copied ? 'Copied!' : label}
    </Button>
  )
}
