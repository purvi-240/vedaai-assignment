'use client'

import { useAssignmentStore } from '@/store/assignmentStore'
import { MicIcon } from '@/components/icons/FormIcons'

export function AdditionalInformation() {
  const additionalInstructions = useAssignmentStore(
    (state) => state.formData.additionalInstructions,
  )
  const setAdditionalInstructions = useAssignmentStore(
    (state) => state.setAdditionalInstructions,
  )

  return (
    <div className="form-field create-form-additional">
      <label htmlFor="instructions" className="form-label-bold">
        Additional Information{' '}
        <span className="form-label-for-output">(For better output)</span>
      </label>
      <div className="instructions-wrap">
        <textarea
          id="instructions"
          className="instructions-textarea"
          rows={2}
          placeholder="e.g Generate a question paper for 3 hour exam duration.."
          value={additionalInstructions}
          onChange={(e) => setAdditionalInstructions(e.target.value)}
        />
        <button
          type="button"
          className="instructions-mic-btn"
          aria-label="Voice input"
        >
          <MicIcon />
        </button>
      </div>
    </div>
  )
}
