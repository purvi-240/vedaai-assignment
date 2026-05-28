'use client'

import { useRef } from 'react'
import { extractReferenceFromFile } from '@/lib/api/reference'
import { useAssignmentStore } from '@/store/assignmentStore'
import { UploadCloudIcon } from '@/components/icons/FormIcons'

const ACCEPTED_TYPES = '.pdf,.txt,.text,.jpg,.jpeg,.png'
const MAX_FILE_BYTES = 10 * 1024 * 1024

function isReferenceFile(file: File): boolean {
  const name = file.name.toLowerCase()
  return (
    file.type === 'application/pdf' ||
    file.type === 'text/plain' ||
    file.type.startsWith('image/') ||
    name.endsWith('.pdf') ||
    name.endsWith('.txt') ||
    name.endsWith('.jpg') ||
    name.endsWith('.jpeg') ||
    name.endsWith('.png')
  )
}

export function FileUpload() {
  const file = useAssignmentStore((state) => state.formData.file)
  const referenceContent = useAssignmentStore((state) => state.referenceContent)
  const setFile = useAssignmentStore((state) => state.setFile)
  const referenceExtracting = useAssignmentStore((state) => state.referenceExtracting)
  const referenceExtractError = useAssignmentStore((state) => state.referenceExtractError)
  const setReferenceContent = useAssignmentStore((state) => state.setReferenceContent)
  const setReferenceExtracting = useAssignmentStore((state) => state.setReferenceExtracting)
  const setReferenceExtractError = useAssignmentStore((state) => state.setReferenceExtractError)
  const error = useAssignmentStore((state) => state.errors.file)
  const setErrors = useAssignmentStore((state) => state.setErrors)
  const errors = useAssignmentStore((state) => state.errors)
  const clearError = useAssignmentStore((state) => state.clearError)
  const inputRef = useRef<HTMLInputElement>(null)
  const extractGenerationRef = useRef(0)

  const extractReferenceInBackground = async (selected: File) => {
    if (!isReferenceFile(selected)) {
      setReferenceContent(null)
      setReferenceExtractError(null)
      setReferenceExtracting(false)
      return
    }

    const generation = ++extractGenerationRef.current
    setReferenceExtracting(true)
    setReferenceExtractError(null)

    try {
      const text = await extractReferenceFromFile(selected)
      if (generation !== extractGenerationRef.current) return

      setReferenceContent(text)
    } catch (extractError) {
      if (generation !== extractGenerationRef.current) return
      setReferenceContent(null)
      setReferenceExtractError(
        extractError instanceof Error ? extractError.message : 'Could not read reference file',
      )
    } finally {
      if (generation === extractGenerationRef.current) {
        setReferenceExtracting(false)
      }
    }
  }

  const applyFile = (selected: File | null) => {
    if (selected && selected.size > MAX_FILE_BYTES) {
      setErrors({ ...errors, file: 'File must be 10MB or smaller' })
      setFile(null)
      if (inputRef.current) inputRef.current.value = ''
      return
    }

    extractGenerationRef.current += 1
    setFile(selected)
    if (selected) {
      clearError('file')
      void extractReferenceInBackground(selected)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    applyFile(event.target.files?.[0] ?? null)
  }

  const handleRemove = () => {
    extractGenerationRef.current += 1
    setFile(null)
    setReferenceContent(null)
    setReferenceExtractError(null)
    setReferenceExtracting(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  const referenceStatus = (() => {
    if (!file || !isReferenceFile(file)) return null
    if (referenceExtracting) return 'Reading file…'
    if (referenceExtractError) return 'Could not read file'
    if (referenceContent) return 'Reference ready'
    return 'No text extracted'
  })()

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
          <p className="file-dropzone-subtext">PDF, TXT, JPEG, or PNG up to 10MB</p>
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
                {referenceStatus ? ` · ${referenceStatus}` : ''}
              </p>
            </div>
          </div>
          <button type="button" className="btn-text" onClick={handleRemove}>
            Remove
          </button>
        </div>
      )}
      <p className="file-upload-hint">
        Upload your sample question paper (PDF or image). Questions will be taken from this file.
      </p>
      {referenceExtractError && (
        <p className="field-error field-error--muted">{referenceExtractError}</p>
      )}
      {error && <p className="field-error">{error}</p>}
    </div>
  )
}
