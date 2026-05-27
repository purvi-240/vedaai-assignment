'use client'

import { MinusIcon, PlusSmallIcon } from '@/components/icons/FormIcons'

interface NumberStepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  ariaLabel: string
}

export function NumberStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  step = 1,
  ariaLabel,
}: NumberStepperProps) {
  const decrement = () => onChange(Math.max(min, value - step))
  const increment = () => onChange(Math.min(max, value + step))

  return (
    <div className="number-stepper" role="group" aria-label={ariaLabel}>
      <button
        type="button"
        className="number-stepper-btn"
        onClick={decrement}
        disabled={value <= min}
        aria-label={`Decrease ${ariaLabel}`}
      >
        <MinusIcon />
      </button>
      <span className="number-stepper-value">{value}</span>
      <button
        type="button"
        className="number-stepper-btn"
        onClick={increment}
        disabled={value >= max}
        aria-label={`Increase ${ariaLabel}`}
      >
        <PlusSmallIcon />
      </button>
    </div>
  )
}
