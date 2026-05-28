export function OutputStudentFields({ classLabel = '5th' }: { classLabel?: string }) {
  const classDisplay = classLabel.replace(/^Class\s*/i, '').trim() || classLabel

  return (
    <div className="output-student-fields">
      <div className="output-student-field">
        <span className="output-student-label">Name:</span>
        <span className="output-student-line output-student-line--name" aria-hidden />
      </div>
      <div className="output-student-field">
        <span className="output-student-label">Roll Number:</span>
        <span className="output-student-line output-student-line--roll" aria-hidden />
      </div>
      <div className="output-student-field output-student-field--class">
        <span className="output-student-label">Class:</span>
        <span className="output-student-value">{classDisplay}</span>
        <span className="output-student-label output-student-label--inline">Section:</span>
        <span className="output-student-line output-student-line--section" aria-hidden />
      </div>
    </div>
  )
}
