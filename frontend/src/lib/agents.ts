import {
  Boxes,
  ClipboardList,
  Server,
  LayoutDashboard,
  ShieldCheck,
  BookOpen,
  Gavel,
  type LucideIcon,
} from 'lucide-react'
import type { AgentKey } from '@/types'

export interface AgentMeta {
  key: AgentKey
  /** Short label used on nodes. */
  label: string
  /** Full title used in headers/tabs. */
  title: string
  role: string
  description: string
  icon: LucideIcon
  /** Accent color (hex) used for glow + charts. */
  color: string
}

export const AGENT_META: Record<AgentKey, AgentMeta> = {
  architect: {
    key: 'architect',
    label: 'Architect',
    title: 'System Architect',
    role: 'Designs the system',
    description: 'Defines the high-level architecture, tech stack, and service topology.',
    icon: Boxes,
    color: '#38bdf8',
  },
  planner: {
    key: 'planner',
    label: 'Planner',
    title: 'Delivery Planner',
    role: 'Breaks down work',
    description: 'Turns the architecture into epics, stories, tasks, and milestones.',
    icon: ClipboardList,
    color: '#818cf8',
  },
  backend: {
    key: 'backend',
    label: 'Backend',
    title: 'Backend Engineer',
    role: 'Builds the API & data',
    description: 'Generates API contracts, data models, and backend service scaffolding.',
    icon: Server,
    color: '#34d399',
  },
  frontend: {
    key: 'frontend',
    label: 'Frontend',
    title: 'Frontend Engineer',
    role: 'Builds the UI',
    description: 'Generates component hierarchy, routing, and UI scaffolding.',
    icon: LayoutDashboard,
    color: '#22d3ee',
  },
  qa: {
    key: 'qa',
    label: 'QA',
    title: 'QA Engineer',
    role: 'Verifies quality',
    description: 'Produces test strategy, edge cases, and quality checks across the stack.',
    icon: ShieldCheck,
    color: '#fbbf24',
  },
  documentation: {
    key: 'documentation',
    label: 'Docs',
    title: 'Documentation',
    role: 'Writes the docs',
    description: 'Authors developer guides, deployment plans, and the technical spec.',
    icon: BookOpen,
    color: '#f472b6',
  },
  cto_review: {
    key: 'cto_review',
    label: 'CTO Review',
    title: 'CTO Review',
    role: 'Final sign-off',
    description: 'Synthesizes everything into health score, risks, cost, team, and timeline.',
    icon: Gavel,
    color: '#a855f7',
  },
}
