import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { promptSchema, type PromptValues } from './promptSchema'

const EXAMPLES = [
  'A realtime collaborative task manager for small teams',
  'A privacy-first personal finance tracker',
  'An internal docs search engine with Slack integration',
]

interface PromptInputProps {
  onGenerate: (idea: string) => void
  submitting?: boolean
}

export function PromptInput({ onGenerate, submitting = false }: PromptInputProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PromptValues>({
    resolver: zodResolver(promptSchema),
    defaultValues: { idea: '' },
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-2xl"
    >
      <form
        onSubmit={handleSubmit((v) => onGenerate(v.idea))}
        className={cn(
          'glass group relative rounded-2xl p-2 shadow-xl transition-shadow',
          'focus-within:shadow-[0_0_50px_-12px_rgba(56,189,248,0.45)]',
        )}
      >
        <Textarea
          {...register('idea')}
          placeholder="Describe the product you want to build…"
          className="min-h-28 border-0 bg-transparent px-4 py-3 text-base shadow-none focus-visible:ring-0"
        />
        <div className="flex items-center justify-between gap-3 px-2 pb-1">
          <span className="hidden text-xs text-muted-foreground sm:inline">
            Blueprint AI will design, plan, and scaffold it for you.
          </span>
          <Button type="submit" size="lg" disabled={submitting} className="ml-auto">
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Generating…
              </>
            ) : (
              <>
                <Sparkles className="size-4" /> Generate Blueprint
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </div>
      </form>

      {errors.idea && (
        <p className="mt-2 px-1 text-sm text-destructive">{errors.idea.message}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs text-muted-foreground">Try:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => setValue('idea', ex, { shouldValidate: true })}
            className="rounded-full border border-border bg-card/40 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            {ex}
          </button>
        ))}
      </div>
    </motion.div>
  )
}
