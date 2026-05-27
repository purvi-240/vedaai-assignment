import Link from 'next/link'
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons/FormIcons'

interface FormStepNavProps {
  onNext?: () => void
  nextDisabled?: boolean
  nextLabel?: string
}

export function FormStepNav({
  onNext,
  nextDisabled = false,
  nextLabel = 'Next',
}: FormStepNavProps) {
  return (
    <div className="form-step-nav">
      <Link href="/assignments" className="btn-form-secondary">
        <ChevronLeftIcon />
        Previous
      </Link>
      <button
        type="button"
        className="btn-form-primary"
        onClick={onNext}
        disabled={nextDisabled}
      >
        {nextLabel}
        <ChevronRightIcon />
      </button>
    </div>
  )
}
