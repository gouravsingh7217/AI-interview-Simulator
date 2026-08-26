function EvaluationResult(props) {
  const { grade, feedback, betterAnswer } = props

  // Pick a tier purely for styling — grade value itself is unchanged
  const tier =
    grade >= 8 ? "great" : grade >= 5 ? "okay" : "low"

  const tierLabel =
    tier === "great" ? "Strong answer" : tier === "okay" ? "Room to grow" : "Needs work"

  return (
    <div className={`evaluation-card evaluation-${tier}`}>

      <div className="evaluation-header">

        <div className="grade-ring" style={{ "--pct": `${(grade / 10) * 100}%` }}>
          <span className="grade-number">{grade}</span>
          <span className="grade-max">/10</span>
        </div>

        <div>
          <span className="small-label">EVALUATION</span>
          <h3>{tierLabel}</h3>
        </div>

      </div>

      <div className="evaluation-body">

        <div className="evaluation-block">
          <span className="block-label">Feedback</span>
          <p>{feedback}</p>
        </div>

        <div className="evaluation-block better-answer">
          <span className="block-label">A stronger answer</span>
          <p>{betterAnswer}</p>
        </div>

      </div>

    </div>
  )
}

export default EvaluationResult