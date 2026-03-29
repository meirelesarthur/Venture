export function PlaceholderPage({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
        <div className="h-8 w-8 rounded-lg bg-primary/30" />
      </div>
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      {description && (
        <p className="max-w-md text-center text-muted">{description}</p>
      )}
      <div className="mt-4 rounded-lg border border-dashed border-border bg-surface px-6 py-3 text-sm text-muted">
        Em desenvolvimento
      </div>
    </div>
  )
}
