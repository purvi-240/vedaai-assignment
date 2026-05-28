interface GenerationOverlayProps {
  status: 'creating' | 'generating'
  error?: string | null
  onDismissError?: () => void
}

export function GenerationOverlay({ status, error, onDismissError }: GenerationOverlayProps) {
  if (error) {
    return (
      <div className="generation-overlay" role="alert">
        <div className="generation-overlay-card generation-overlay-card--error">
          <p className="generation-overlay-title">Generation failed</p>
          <p className="generation-overlay-text">{error}</p>
          <button type="button" className="generation-overlay-retry" onClick={onDismissError}>
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="generation-overlay" aria-live="polite" aria-busy="true">
      <div className="generation-overlay-card">
        <div className="generation-spinner" aria-hidden />
        <p className="generation-overlay-title">
          {status === 'creating' ? 'Creating assignment...' : 'Generating question paper...'}
        </p>
        <p className="generation-overlay-text">
          {status === 'creating'
            ? 'Saving your assignment details…'
            : 'AI is generating sections in parallel. This usually takes under a minute.'}
        </p>
      </div>
    </div>
  )
}
