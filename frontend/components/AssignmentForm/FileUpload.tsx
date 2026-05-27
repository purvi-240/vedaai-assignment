'use client'

import { useRef } from 'react'
import { useAssignmentStore } from '@/store/assignmentStore'
import { UploadCloudIcon } from '@/components/icons/FormIcons'

const ACCEPTED_TYPES = '.pdf,.txt,.text,.jpg,.jpeg,.png'
const MAX_FILE_BYTES = 10 * 1024 * 1024

export function FileUpload() {
  const file = useAssignmentStore((state) => state.formData.file)
  const setFile = useAssignmentStore((state) => state.setFile)
  const error = useAssignmentStore((state) => state.errors.file)
  const setErrors = useAssignmentStore((state) => state.setErrors)
  const errors = useAssignmentStore((state) => state.errors)
  const clearError = useAssignmentStore((state) => state.clearError)
  const inputRef = useRef<HTMLInputElement>(null)

  const applyFile = (selected: File | null) => {
    if (selected && selected.size > MAX_FILE_BYTES) {
      setErrors({ ...errors, file: 'File must be 10MB or smaller' })
      setFile(null)
      if (inputRef.current) inputRef.current.value = ''
      return
    }
    setFile(selected)
    if (selected) clearError('file')
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    applyFile(event.target.files?.[0] ?? null)
  }

  const handleRemove = () => {
    setFile(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="form-field file-upload-field">
      {!file ? (
        <div
          className={`file-dropzone ${error ? 'has-error' : ''}`}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              inputRef.current?.click()
            }
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const dropped = e.dataTransfer.files?.[0]
            if (dropped) applyFile(dropped)
          }}
          role="button"
          tabIndex={0}
        >
          <div className="file-dropzone-icon-wrap">
            <UploadCloudIcon />
          </div>
          <p className="file-dropzone-text">
            Choose a file or drag &amp; drop it here
          </p>
          <p className="file-dropzone-subtext">JPEG, PNG, upto 10MB</p>
          <button
            type="button"
            className="btn-browse-files"
            onClick={(e) => {
              e.stopPropagation()
              inputRef.current?.click()
            }}
          >
            Browse Files
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={handleFileChange}
            className="file-input-hidden"
          />
        </div>
      ) : (
        <div className="file-preview">
          <div className="file-preview-info">
            <span className="file-preview-icon">📎</span>
            <div>
              <p className="file-preview-name">{file.name}</p>
              <p className="file-preview-size">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <button type="button" className="btn-text" onClick={handleRemove}>
            Remove
          </button>
        </div>
      )}
      <p className="file-upload-hint">
        Upload images of your preferred document/image.
      </p>
      {error && <p className="field-error">{error}</p>}
    </div>
  )
}
