import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Share2, BarChart3, Gavel } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { GlassCard, WorkspaceSkeleton } from '@/components/shared'
import { AGENT_META } from '@/lib/agents'
import { AGENT_ORDER } from '@/types'
import type {
  AgentKey,
  AgentOutput,
  ArchitectOutput,
  CodeAgentOutput,
  CtoReviewOutput,
  DocumentationOutput,
  PlannerOutput,
  QaOutput,
} from '@/types'
import { useRun, useRunOutputs } from '@/hooks/queries'
import { fadeInUp } from '@/lib/motion'
import { ArchitectureTab } from './tabs/ArchitectureTab'
import { PlanningTab } from './tabs/PlanningTab'
import { CodeTab } from './tabs/CodeTab'
import { QaTab } from './tabs/QaTab'
import { DocumentationTab } from './tabs/DocumentationTab'
import { MarkdownView } from './MarkdownView'
import { InsightsPanel } from './InsightsPanel'
import { ExportMenu } from './ExportMenu'

export function WorkspacePage() {
  const { runId = '' } = useParams()
  const navigate = useNavigate()
  const { data: run, isLoading: runLoading } = useRun(runId)
  const { data: outputs, isLoading: outputsLoading } = useRunOutputs(runId)

  const byAgent = useMemo(() => {
    const map = {} as Record<AgentKey, AgentOutput>
    outputs?.forEach((o) => {
      map[o.agent] = o
    })
    return map
  }, [outputs])

  if (runLoading || outputsLoading) return <WorkspaceSkeleton />

  if (!outputs || outputs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-medium">No results for this run</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="size-4" /> Back to dashboard
        </Button>
      </div>
    )
  }

  const cto = byAgent.cto_review?.output as CtoReviewOutput | undefined

  return (
    <div className="space-y-6">
      <motion.div variants={fadeInUp} initial="hidden" animate="visible">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="-ml-2 text-muted-foreground">
          <ArrowLeft className="size-4" /> Dashboard
        </Button>
      </motion.div>

      <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {run?.projectName ?? 'Blueprint results'}
            </h1>
            {cto && (
              <Badge variant="success" className="capitalize">
                {cto.verdict.replace(/_/g, ' ')} · {cto.healthScore.overall}/100
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete engineering blueprint across {AGENT_ORDER.length} agents.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Share2 className="size-4" /> Share
          </Button>
          <ExportMenu runId={runId} />
        </div>
      </motion.div>

      <Tabs defaultValue="architect" className="w-full">
        <div className="overflow-x-auto pb-1">
          <TabsList className="w-max">
            {AGENT_ORDER.map((key) => {
              const meta = AGENT_META[key]
              const Icon = key === 'cto_review' ? Gavel : meta.icon
              return (
                <TabsTrigger key={key} value={key}>
                  <Icon className="size-3.5" />
                  {meta.label}
                </TabsTrigger>
              )
            })}
            <TabsTrigger value="insights">
              <BarChart3 className="size-3.5" /> Insights
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="architect">
          <ArchitectureTab data={byAgent.architect.output as ArchitectOutput} />
        </TabsContent>
        <TabsContent value="planner">
          <PlanningTab data={byAgent.planner.output as PlannerOutput} />
        </TabsContent>
        <TabsContent value="backend">
          <CodeTab data={byAgent.backend?.output as CodeAgentOutput | undefined} />
        </TabsContent>
        <TabsContent value="frontend">
          <CodeTab data={byAgent.frontend?.output as CodeAgentOutput | undefined} />
        </TabsContent>
        <TabsContent value="qa">
          <QaTab data={byAgent.qa.output as QaOutput} />
        </TabsContent>
        <TabsContent value="documentation">
          <DocumentationTab data={byAgent.documentation.output as DocumentationOutput} />
        </TabsContent>
        <TabsContent value="cto_review">
          {cto && (
            <div className="grid gap-6 lg:grid-cols-3">
              <GlassCard className="lg:col-span-2">
                <MarkdownView content={cto.contentMd} />
              </GlassCard>
              <GlassCard className="h-fit">
                <h3 className="font-semibold">Verdict</h3>
                <Badge
                  variant={cto.verdict === 'needs_work' ? 'destructive' : 'success'}
                  className="mt-3 capitalize"
                >
                  {cto.verdict.replace(/_/g, ' ')}
                </Badge>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{cto.summary}</p>
              </GlassCard>
            </div>
          )}
        </TabsContent>
        <TabsContent value="insights">{cto && <InsightsPanel review={cto} />}</TabsContent>
      </Tabs>
    </div>
  )
}
