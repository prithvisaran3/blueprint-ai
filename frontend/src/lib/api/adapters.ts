/**
 * Adapter layer — maps backend wire shapes (snake_case Pydantic outputs) into
 * the frontend domain types the UI consumes (`src/types`). This is the
 * frontend↔backend integration contract: the backend's per-agent structured
 * outputs are normalized here so every existing workspace component keeps
 * working unchanged.
 */
import type {
  AgentKey,
  AgentOutput,
  AgentRun,
  AgentStatus,
  ArchitectOutput,
  ArchitectureNodeSpec,
  CodeAgentOutput,
  CtoReviewOutput,
  DocType,
  DocumentationOutput,
  ExecutionLog,
  GeneratedDocument,
  HealthScore,
  PlannerOutput,
  Project,
  QaCheck,
  QaOutput,
  Risk,
} from '@/types'
import { AGENT_ORDER } from '@/types'
import type {
  WireAgentOutput,
  WireAgentRun,
  WireExecutionLog,
  WireGeneratedDocument,
  WireProject,
  WireProjectDetail,
} from './types'

// --- small helpers -----------------------------------------------------------
type Dict = Record<string, unknown>

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}
function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}
function arr(v: unknown): Dict[] {
  return Array.isArray(v) ? (v as Dict[]) : []
}
function strArr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
}

function clampSeverity(v: unknown): 'low' | 'medium' | 'high' {
  const s = str(v, 'medium').toLowerCase()
  if (s === 'critical' || s === 'high') return 'high'
  if (s === 'low') return 'low'
  return 'medium'
}

function clampSeniority(v: unknown): 'junior' | 'mid' | 'senior' {
  const s = str(v, 'mid').toLowerCase()
  if (s === 'junior') return 'junior'
  if (s === 'senior' || s === 'lead' || s === 'principal' || s === 'staff') return 'senior'
  return 'mid'
}

// --- project / run -----------------------------------------------------------
export function adaptHealthScore(raw: Record<string, unknown> | null | undefined): HealthScore | null {
  if (!raw) return null
  const dims = arr(raw.dimensions).map((d) => ({
    dimension: str(d.name, str(d.dimension, 'Dimension')),
    score: num(d.score),
  }))
  return { overall: num(raw.overall), dimensions: dims }
}

export function adaptProject(p: WireProject | WireProjectDetail): Project {
  const latestRun = 'latest_run' in p ? p.latest_run : null
  return {
    id: p.id,
    userId: p.user_id,
    name: p.name,
    ideaPrompt: p.idea_prompt,
    status: p.status,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    latestRunId: latestRun?.id ?? null,
    healthScore: null,
    tags: [],
  }
}

export function adaptRun(r: WireAgentRun, projectName = 'Blueprint'): AgentRun {
  const health = adaptHealthScore(r.health_score)
  return {
    id: r.id,
    projectId: r.project_id,
    projectName,
    status: r.status,
    startedAt: r.started_at ?? r.created_at,
    finishedAt: r.finished_at,
    totalTokens: r.total_tokens,
    totalDurationMs: r.total_duration_ms,
    healthScore: health,
    error: r.error,
  }
}

export function adaptLog(l: WireExecutionLog): ExecutionLog {
  const agent = (l.agent ?? 'system') as AgentKey | 'system'
  return {
    id: l.id,
    runId: l.run_id,
    agent,
    level: l.level,
    message: l.message,
    ts: l.ts,
  }
}

export function adaptDocument(d: WireGeneratedDocument): GeneratedDocument {
  return {
    id: d.id,
    projectId: d.project_id,
    runId: d.run_id,
    docType: d.doc_type,
    title: d.title,
    contentMd: d.content_md,
    createdAt: d.created_at,
  }
}

// --- agent output dispatch ---------------------------------------------------
export function adaptAgentOutput(agent: AgentKey, output: Dict | null) {
  switch (agent) {
    case 'architect':
      return adaptArchitect(output)
    case 'planner':
      return adaptPlanner(output)
    case 'backend':
    case 'frontend':
      return adaptCode(agent, output)
    case 'qa':
      return adaptQa(output)
    case 'documentation':
      return adaptDocumentation(output)
    case 'cto_review':
      return adaptCto(output)
  }
}

export function adaptOutput(o: WireAgentOutput): AgentOutput {
  const agent = o.agent as AgentKey
  return {
    id: o.id,
    runId: o.run_id,
    agent,
    status: o.status as AgentStatus,
    output: adaptAgentOutput(agent, o.output),
    tokens: o.tokens,
    durationMs: o.duration_ms,
    createdAt: o.created_at,
  }
}

/** Build a placeholder output row for an agent that didn't run (partial runs). */
export function emptyOutput(runId: string, agent: AgentKey): AgentOutput {
  return {
    id: `${runId}-${agent}-missing`,
    runId,
    agent,
    status: 'failed',
    output: adaptAgentOutput(agent, null),
    tokens: 0,
    durationMs: 0,
    createdAt: new Date().toISOString(),
  }
}

/** Normalize to one output per agent in pipeline order (fills missing ones). */
export function fillOutputs(runId: string, outputs: AgentOutput[]): AgentOutput[] {
  const byAgent = new Map(outputs.map((o) => [o.agent, o]))
  return AGENT_ORDER.map((agent) => byAgent.get(agent) ?? emptyOutput(runId, agent))
}

// --- per-agent adapters ------------------------------------------------------
function archKind(text: string): ArchitectureNodeSpec['kind'] {
  const s = text.toLowerCase()
  if (/(postgres|database|\bdb\b|redis|cache|storage|s3|bucket|datastore|warehouse|queue|kafka|blob)/.test(s))
    return 'datastore'
  if (/(frontend|client|web app|webapp|\bspa\b|\bui\b|mobile|browser|website)/.test(s)) return 'client'
  if (/(third-party|external|stripe|sendgrid|twilio|oauth|payment|provider|integration|\bapi\b service)/.test(s))
    return 'external'
  return 'service'
}

function adaptArchitect(o: Dict | null): ArchitectOutput {
  if (!o) {
    return { summary: 'No architecture output available.', stack: [], nodes: [], edges: [], contentMd: '' }
  }
  const stack = arr(o.tech_stack).map((t) => ({
    category: str(t.category, 'general'),
    choice: str(t.choice),
    rationale: str(t.rationale),
  }))
  const components = arr(o.components)
  const integrations = strArr(o.integrations)

  const nodes: ArchitectureNodeSpec[] = []
  const ids = new Set<string>()
  for (const c of components) {
    const id = str(c.name)
    if (!id || ids.has(id)) continue
    ids.add(id)
    nodes.push({
      id,
      label: id,
      kind: archKind(`${id} ${str(c.responsibility)}`),
      description: str(c.responsibility, '—'),
    })
  }
  for (const integ of integrations) {
    if (!integ || ids.has(integ)) continue
    ids.add(integ)
    nodes.push({ id: integ, label: integ, kind: 'external', description: 'External integration' })
  }

  const edges = components.flatMap((c) => {
    const source = str(c.name)
    return strArr(c.depends_on)
      .filter((dep) => ids.has(source) && ids.has(dep))
      .map((dep) => ({ source, target: dep, label: 'depends on' }))
  })

  return { summary: str(o.summary), stack, nodes, edges, contentMd: architectMd(o) }
}

function architectMd(o: Dict): string {
  const lines = [`## System Architecture`, '', str(o.summary), '']
  if (o.pattern) lines.push(`**Pattern:** ${str(o.pattern)}`, '')
  const components = arr(o.components)
  if (components.length) {
    lines.push('### Components')
    for (const c of components) {
      const deps = strArr(c.depends_on)
      lines.push(`- **${str(c.name)}** — ${str(c.responsibility)}${deps.length ? ` _(depends on: ${deps.join(', ')})_` : ''}`)
    }
    lines.push('')
  }
  const entities = arr(o.data_model)
  if (entities.length) {
    lines.push('### Data model')
    for (const e of entities) lines.push(`- **${str(e.name)}**: ${str(e.description)} _(${strArr(e.key_fields).join(', ')})_`)
    lines.push('')
  }
  const integrations = strArr(o.integrations)
  if (integrations.length) lines.push('### Integrations', integrations.map((i) => `- ${i}`).join('\n'), '')
  if (o.diagram_mermaid) lines.push('### Diagram', '```mermaid', str(o.diagram_mermaid), '```')
  return lines.join('\n').trim()
}

function adaptPlanner(o: Dict | null): PlannerOutput {
  if (!o) return { summary: 'No plan available.', epics: [], milestones: [], contentMd: '' }
  const epics = arr(o.epics).map((epic, ei) => ({
    id: `E${ei + 1}`,
    title: str(epic.title, 'Untitled epic'),
    description: str(epic.goal),
    stories: arr(epic.stories).map((story, si) => ({
      id: `S${ei + 1}.${si + 1}`,
      title: str(story.title, 'Untitled story'),
      tasks: arr(story.tasks).map((task, ti) => ({
        id: `T${ei + 1}.${si + 1}.${ti + 1}`,
        title: str(task.title, 'Untitled task'),
        estimate: num(task.estimate_hours) > 0 ? `${num(task.estimate_hours)}h` : '—',
      })),
    })),
  }))
  const milestones = arr(o.milestones).map((m) => ({
    title: str(m.name, 'Milestone'),
    due: strArr(m.epics).join(', ') || '—',
  }))
  return { summary: str(o.summary), epics, milestones, contentMd: plannerMd(o) }
}

function plannerMd(o: Dict): string {
  const lines = ['## Delivery Plan', '', str(o.summary), '']
  for (const epic of arr(o.epics)) {
    lines.push(`### ${str(epic.title)}`)
    if (epic.goal) lines.push(`_${str(epic.goal)}_`, '')
    for (const story of arr(epic.stories)) {
      const pts = num(story.story_points)
      lines.push(`- **${str(story.title)}**${pts ? ` (${pts} pts)` : ''}`)
      for (const c of strArr(story.acceptance_criteria)) lines.push(`  - ✓ ${c}`)
    }
    lines.push('')
  }
  return lines.join('\n').trim()
}

function adaptCode(agent: AgentKey, o: Dict | null): CodeAgentOutput {
  if (!o) return { summary: `No ${agent} output available.`, artifacts: [], contentMd: '' }
  const artifacts = arr(o.code_artifacts).map((a) => ({
    path: str(a.path, 'file'),
    language: str(a.language, agent === 'frontend' ? 'tsx' : 'python'),
    description: str(a.description),
    code: str(a.snippet, '// (no snippet provided)'),
  }))
  return { summary: str(o.summary), artifacts, contentMd: codeMd(agent, o) }
}

function codeMd(agent: AgentKey, o: Dict): string {
  const title = agent === 'frontend' ? 'Frontend Implementation' : 'Backend Implementation'
  const lines = [`## ${title}`, '', str(o.summary), '']
  if (o.framework) lines.push(`**Framework:** ${str(o.framework)}`, '')
  if (agent === 'frontend' && o.styling) lines.push(`**Styling:** ${str(o.styling)}`)
  if (agent === 'frontend' && o.state_management) lines.push(`**State:** ${str(o.state_management)}`, '')

  const endpoints = arr(o.endpoints)
  if (endpoints.length) {
    lines.push('### API Endpoints')
    for (const e of endpoints)
      lines.push(`- \`${str(e.method, 'GET')} ${str(e.path)}\`${e.auth_required ? ' 🔒' : ''} ${str(e.description)}`)
    lines.push('')
  }
  const routes = arr(o.routes)
  if (routes.length) {
    lines.push('### Routes')
    for (const r of routes) lines.push(`- \`${str(r.path)}\` — ${str(r.name)} ${str(r.description)}`)
    lines.push('')
  }
  const models = arr(o.models)
  if (models.length) {
    lines.push('### Data Models')
    for (const m of models) lines.push(`- **${str(m.name)}**: ${strArr(m.fields).join(', ')}`)
    lines.push('')
  }
  const components = arr(o.components)
  if (components.length) {
    lines.push('### Components')
    for (const c of components) lines.push(`- **${str(c.name)}**: ${str(c.responsibility)}`)
    lines.push('')
  }
  const services = strArr(o.services)
  if (services.length) lines.push('### Services', services.map((s) => `- ${s}`).join('\n'), '')
  const deps = strArr(o.dependencies)
  if (deps.length) lines.push('### Key dependencies', deps.map((d) => `- \`${d}\``).join('\n'))
  return lines.join('\n').trim()
}

function adaptQa(o: Dict | null): QaOutput {
  if (!o) return { summary: 'No QA output available.', coverage: 0, checks: [], artifacts: [], contentMd: '' }
  const targets = (o.coverage_targets ?? {}) as Record<string, unknown>
  const values = Object.values(targets).map((v) => num(v))
  const coverage = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0

  const checks: QaCheck[] = []
  arr(o.test_cases).forEach((t, i) => {
    const gwt = [str(t.given), str(t.when), str(t.then)].filter(Boolean).join(' → ')
    checks.push({
      id: `TC${i + 1}`,
      title: str(t.title, 'Test case'),
      severity: clampSeverity(t.priority),
      status: 'pass',
      detail: gwt || `Type: ${str(t.type, 'unit')}`,
    })
  })
  arr(o.risks).forEach((r, i) => {
    const sev = clampSeverity(r.severity)
    checks.push({
      id: `RK${i + 1}`,
      title: str(r.title, 'Risk'),
      severity: sev,
      status: sev === 'high' ? 'fail' : 'warn',
      detail: str(r.mitigation),
    })
  })
  return { summary: str(o.summary), coverage, checks, artifacts: [], contentMd: qaMd(o, coverage) }
}

function qaMd(o: Dict, coverage: number): string {
  const lines = ['## QA Report', '', str(o.summary), '']
  if (o.strategy) lines.push(`**Strategy:** ${str(o.strategy)}`, '')
  lines.push(`**Average coverage target:** ${coverage}%`, '')
  const tooling = strArr(o.tooling)
  if (tooling.length) lines.push('### Tooling', tooling.map((t) => `- ${t}`).join('\n'), '')
  const risks = arr(o.risks)
  if (risks.length) {
    lines.push('### Risks')
    for (const r of risks) lines.push(`- **${str(r.title)}** (${str(r.severity, 'medium')}) — ${str(r.mitigation)}`)
  }
  return lines.join('\n').trim()
}

function adaptDocumentation(o: Dict | null): DocumentationOutput {
  if (!o) return { summary: 'No documentation available.', documents: [], contentMd: '' }
  const documents = arr(o.documents).map((d) => ({
    title: str(d.title, 'Document'),
    docType: str(d.doc_type, 'notes') as DocType,
    contentMd: str(d.content_md),
  }))
  return {
    summary: str(o.summary),
    documents,
    contentMd: str(o.summary) || '## Documentation\n\nGenerated project documents.',
  }
}

function adaptCto(o: Dict | null): CtoReviewOutput {
  const emptyHealth: HealthScore = { overall: 0, dimensions: [] }
  if (!o) {
    return {
      summary: 'No CTO review available.',
      verdict: 'needs_work',
      healthScore: emptyHealth,
      risks: [],
      cost: { monthlyInfraUsd: 0, oneTimeBuildUsd: 0, breakdown: [] },
      team: { roles: [], totalHeadcount: 0 },
      delivery: { totalWeeks: 0, phases: [] },
      contentMd: '',
    }
  }
  const verdictRaw = str(o.verdict, '').toLowerCase()
  const verdict: CtoReviewOutput['verdict'] = verdictRaw.includes('no')
    ? 'needs_work'
    : verdictRaw.includes('change')
      ? 'approved_with_changes'
      : 'approved'

  const health = adaptHealthScore(o.health_score as Dict) ?? emptyHealth
  const risks: Risk[] = arr(o.key_risks).map((r, i) => ({
    id: `CR${i + 1}`,
    title: str(r.title, 'Risk'),
    severity: clampSeverity(r.severity),
    mitigation: str(r.mitigation),
  }))

  const cost = (o.cost_estimation ?? {}) as Dict
  const team = (o.team_estimation ?? {}) as Dict
  const delivery = (o.delivery_estimation ?? {}) as Dict

  return {
    summary: str(o.summary),
    verdict,
    healthScore: health,
    risks,
    cost: {
      monthlyInfraUsd: num(cost.monthly_total_usd),
      oneTimeBuildUsd: num(cost.one_time_usd),
      breakdown: arr(cost.line_items).map((li) => ({
        label: str(li.label, 'Item'),
        amountUsd: num(li.monthly_usd),
      })),
    },
    team: {
      totalHeadcount: num(team.total_headcount),
      roles: arr(team.roles).map((r) => ({
        role: str(r.role, 'Engineer'),
        count: num(r.count),
        seniority: clampSeniority(r.seniority),
      })),
    },
    delivery: {
      totalWeeks: num(delivery.total_weeks),
      phases: arr(delivery.phases).map((p) => ({
        name: str(p.name, 'Phase'),
        weeks: num(p.duration_weeks),
      })),
    },
    contentMd: ctoMd(o),
  }
}

function ctoMd(o: Dict): string {
  const lines = ['## CTO Review', '', str(o.summary), '']
  if (o.verdict) lines.push(`**Verdict:** ${str(o.verdict)}`, '')
  const recs = strArr(o.recommendations)
  if (recs.length) {
    lines.push('### Recommendations')
    recs.forEach((r, i) => lines.push(`${i + 1}. ${r}`))
  }
  return lines.join('\n').trim()
}
