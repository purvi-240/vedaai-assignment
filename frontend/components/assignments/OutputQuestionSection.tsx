import type { GeneratedQuestion } from '@/lib/normalizeQuestionPaper'

interface OutputQuestionSectionProps {
  label: string
  title: string
  questions: GeneratedQuestion[]
}

const difficultyLabel = {
  easy: 'Easy',
  medium: 'Moderate',
  hard: 'Challenging',
} as const

function displayOption(option: string, index: number): string {
  const label = String.fromCharCode(97 + index)
  const trimmed = option.trim()
  if (new RegExp(`^${label}\\)\\s`, 'i').test(trimmed)) return trimmed
  if (/^[a-d]\)\s/i.test(trimmed)) return trimmed
  return `${label}) ${trimmed}`
}

function getSectionInstruction(questions: GeneratedQuestion[]): string {
  if (questions.length === 0) return 'Attempt all questions in this section.'

  const marks = questions[0].marks
  const sameMarks = questions.every((q) => q.marks === marks)

  if (sameMarks) {
    return `Attempt all questions. Each question carries ${marks} mark${marks === 1 ? '' : 's'}`
  }

  return 'Attempt all questions in this section.'
}

export function OutputQuestionSection({ label, title, questions }: OutputQuestionSectionProps) {
  return (
    <section className="output-section">
      <h3 className="output-section-title">Section {label}</h3>

      <div className="output-questions-block">
        <p className="output-subheading">{title}</p>
        <p className="output-instruction">{getSectionInstruction(questions)}</p>

        <ol className="output-question-list">
          {questions.map((question, index) => (
            <li key={question.id} className="output-question-item">
              <div className="output-question-row">
                <span className="output-question-number">{index + 1}.</span>
                <span
                  className={`output-difficulty-tag output-difficulty-tag--${question.difficulty}`}
                >
                  [{difficultyLabel[question.difficulty]}]
                </span>
                <span className="output-question-text">{question.question}</span>
                <span className="output-question-marks">
                  [{question.marks} Mark{question.marks === 1 ? '' : 's'}]
                </span>
              </div>

              {question.options && question.options.length > 0 && (
                <ul className="output-mcq-options">
                  {question.options.map((option, optIndex) => (
                    <li key={`${question.id}-opt-${optIndex}`}>
                      {displayOption(option, optIndex)}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
