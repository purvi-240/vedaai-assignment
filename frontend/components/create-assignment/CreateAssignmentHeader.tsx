export function CreateAssignmentHeader() {
  return (
    <header className="create-page-header">
      <div className="create-title-row">
        <span className="assignments-status-dot" aria-hidden />
        <h1 className="create-page-title">Create Assignment</h1>
      </div>
      <p className="create-page-subtitle">
        Set up a new assignment for your students.
      </p>
      <div className="create-progress" aria-label="Step 1 of 2">
        <div className="create-progress-fill" />
      </div>
    </header>
  )
}
