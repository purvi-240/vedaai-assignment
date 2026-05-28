'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  downloadQuestionPaperPdf,
  fetchQuestionPaper,
} from '@/lib/api/assignments'
import type { QuestionPaper } from '@/lib/normalizeQuestionPaper'
import { OutputQuestionSection } from './OutputQuestionSection'
import { OutputStudentFields } from './OutputStudentFields'

interface AssignmentOutputScreenProps {
  assignmentId: string
}

const DEFAULT_SCHOOL = 'Delhi Public School, Sector-4, Bokaro'

function buildBannerText(paper: QuestionPaper): string {
  const subject = paper.subject ?? 'Science'
  const classLabel = paper.classLabel ?? '8'
  const grade = classLabel.replace(/[^0-9]/g, '') || '8'
  return `Here are customized Question Paper for your CBSE Grade ${grade} ${subject} classes on the NCERT chapters:`
}

export function AssignmentOutputScreen({ assignmentId }: AssignmentOutputScreenProps) {
  const [paper, setPaper] = useState<QuestionPaper | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)

  const loadPaper = useCallback(async () => {
    return fetchQuestionPaper(assignmentId)
  }, [assignmentId])

  useEffect(() => {
    let isMounted = true

    const run = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const loaded = await loadPaper()
        if (isMounted) setPaper(loaded)
      } catch (fetchError) {
        if (isMounted) {
          setPaper(null)
          setError(fetchError instanceof Error ? fetchError.message : 'Unable to load output')
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    void run()
    return () => {
      isMounted = false
    }
  }, [loadPaper])

  const answerKeyItems = useMemo(() => {
    if (!paper) return []

    let questionNumber = 0
    return paper.sections.flatMap((section) =>
      section.questions.map((question) => {
        questionNumber += 1
        return {
          number: questionNumber,
          answer:
            question.correctAnswer?.trim() &&
            question.correctAnswer !== '—' &&
            question.correctAnswer !== '--'
              ? question.correctAnswer
              : 'See model answer in teacher copy.',
          hasAnswer: Boolean(
            question.correctAnswer?.trim() &&
              question.correctAnswer !== '—' &&
              question.correctAnswer !== '--',
          ),
        }
      }),
    )
  }, [paper])

  const totalQuestions = useMemo(() => {
    if (!paper) return 0
    return paper.sections.reduce((sum, section) => sum + section.questions.length, 0)
  }, [paper])

  const displayTotalMarks = useMemo(() => {
    if (!paper) return 0
    return paper.sections.reduce(
      (total, section) =>
        total + section.questions.reduce((sectionTotal, q) => sectionTotal + q.marks, 0),
      0,
    )
  }, [paper])

  const handleDownloadPdf = async () => {
    if (!paper || isDownloadingPdf) return

    try {
      setIsDownloadingPdf(true)
      setPdfError(null)
      await downloadQuestionPaperPdf(assignmentId, paper.title, paper)
    } catch (downloadError) {
      setPdfError(
        downloadError instanceof Error ? downloadError.message : 'Unable to download PDF',
      )
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  const schoolName = paper?.schoolName ?? DEFAULT_SCHOOL
  const subject = paper?.subject ?? 'Science'
  const classLabel = paper?.classLabel ?? '8th'
  const timeAllowed = sanitizeTimeAllowed(paper?.timeAllowed ?? '45 minutes')

  return (
    <div className="assignment-output-screen">
      <section className="output-top-banner">
        <p className="output-top-banner-text">
          {paper ? buildBannerText(paper) : 'Your question paper is ready.'}
        </p>
        <button
          type="button"
          className="output-download-btn"
          onClick={() => void handleDownloadPdf()}
          disabled={isLoading || !paper || isDownloadingPdf}
        >
          <span className="output-download-icon" aria-hidden>
            ↧
          </span>
          {isDownloadingPdf ? 'Downloading…' : 'Download as PDF'}
        </button>
        {pdfError && <p className="output-pdf-error">{pdfError}</p>}
      </section>

      <section className="output-paper-card">
        {isLoading && (
          <p className="output-state-text">Loading your question paper and answer key…</p>
        )}
        {!isLoading && error && (
          <p className="output-state-text output-state-text--error">{error}</p>
        )}
        {!isLoading && !error && !paper && (
          <p className="output-state-text">Question paper is not available yet.</p>
        )}

        {!isLoading && !error && paper && (
          <>
            <header className="output-paper-header">
              <h2>{schoolName}</h2>
              <p>Subject: {subject}</p>
              <p>Class: {classLabel}</p>
            </header>

            <div className="output-paper-meta">
              <span>Time Allowed: {timeAllowed}</span>
              <span>Maximum Marks: {displayTotalMarks}</span>
            </div>

            <OutputStudentFields classLabel={classLabel} />

            {paper.sections.map((section) => (
              <OutputQuestionSection
                key={section.label}
                label={section.label}
                title={section.title}
                questions={section.questions}
              />
            ))}

            <p className="output-end-text">End of Question Paper</p>

            {totalQuestions > 0 && (
              <div className="output-answer-key">
                <p className="output-subheading">Answer Key:</p>
                <div className="output-answer-list" role="list">
                  {answerKeyItems.map((item) => (
                    <div
                      key={item.number}
                      role="listitem"
                      className={`output-answer-row ${item.hasAnswer ? '' : 'output-answer-list-item--missing'}`}
                    >
                      <span className="output-answer-number">{item.number}.</span>
                      <span className="output-answer-text">{item.answer}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}

function sanitizeTimeAllowed(raw: string): string {
  return raw.replace(/\s*Maximum\s*Marks.*$/i, '').trim() || '45 minutes'
}
