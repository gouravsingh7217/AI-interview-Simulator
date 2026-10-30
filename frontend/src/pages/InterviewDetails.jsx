import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./InterviewDetails.css";

function InterviewDetails() {
  const navigate = useNavigate();
  const { session_id } = useParams();

  const [interview, setInterview] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [report, setReport] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_URL = import.meta.env.VITE_API_URL;


  useEffect(() => {

    const fetchInterviewDetails = async () => {

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }


      try {

        const response = await fetch(
          `${API_URL}/interviews/${session_id}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );


        if (response.status === 401) {

          localStorage.removeItem("token");

          navigate("/login");

          return;
        }


        if (response.status === 404) {

          setError(
            "Interview not found."
          );

          return;
        }


        if (!response.ok) {

          throw new Error(
            "Unable to fetch interview details"
          );

        }


        const data = await response.json();


        console.log(
          "INTERVIEW DETAILS:",
          data
        );


        setInterview(
          data.interview || null
        );


        setQuestions(
          data.questions || []
        );


        setReport(
          data.report || null
        );


      } catch (error) {

        console.log(
          "INTERVIEW DETAILS ERROR:",
          error
        );


        setError(
          "Unable to load interview details."
        );


      } finally {

        setLoading(false);

      }

    };


    fetchInterviewDetails();


  }, [
    API_URL,
    session_id,
    navigate
  ]);


  // ---------------------------------------------------
  // FORMAT TEXT
  // ---------------------------------------------------

  const formatText = (text) => {

    if (!text) {
      return "Not available";
    }

    return text
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );

  };


  // ---------------------------------------------------
  // FORMAT SCORE
  // ---------------------------------------------------

  const formatScore = (score) => {

    if (
      score === null ||
      score === undefined
    ) {
      return "N/A";
    }

    return `${score}/10`;

  };


  // ---------------------------------------------------
  // LOADING
  // ---------------------------------------------------

  if (loading) {

    return (

      <div className="interview-details-page">

        <div className="interview-details-container">

          <p>
            Loading interview...
          </p>

        </div>

      </div>

    );

  }


  // ---------------------------------------------------
  // ERROR
  // ---------------------------------------------------

  if (error) {

    return (

      <div className="interview-details-page">

        <div className="interview-details-container">

          <h2>
            {error}
          </h2>


          <button
            onClick={() =>
              navigate("/dashboard")
            }
          >
            Back to Dashboard
          </button>

        </div>

      </div>

    );

  }


  return (

    <div className="interview-details-page">

      <div className="interview-details-container">


        {/* ------------------------------------------------ */}
        {/* BACK BUTTON */}
        {/* ------------------------------------------------ */}

        <button
          className="back-dashboard-button"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          ← Back to Dashboard
        </button>



        {/* ------------------------------------------------ */}
        {/* INTERVIEW SUMMARY */}
        {/* ------------------------------------------------ */}

        {interview && (

          <div className="interview-summary">

            <h1>
              Interview Details
            </h1>


            <div className="interview-summary-grid">


              <p>

                <strong>
                  Type:
                </strong>{" "}

                {formatText(
                  interview.interview_type
                )}

              </p>


              <p>

                <strong>
                  Difficulty:
                </strong>{" "}

                {formatText(
                  interview.difficulty
                )}

              </p>


              <p>

                <strong>
                  Mode:
                </strong>{" "}

                {formatText(
                  interview.follow_up_mode
                )}

              </p>


              <p>

                <strong>
                  Status:
                </strong>{" "}

                {formatText(
                  interview.status
                )}

              </p>


              <p>

                <strong>
                  Date:
                </strong>{" "}

                {interview.created_at
                  ? new Date(
                      interview.created_at
                    ).toLocaleString()
                  : "Not available"}

              </p>

            </div>


            {interview.context && (

              <div className="interview-context">

                <strong>
                  Interview Context:
                </strong>

                <p>
                  {interview.context}
                </p>

              </div>

            )}

          </div>

        )}



        {/* ------------------------------------------------ */}
        {/* FINAL REPORT */}
        {/* ------------------------------------------------ */}

        {report ? (

          <div className="final-report-section">

            <h2>
              Final Interview Report
            </h2>



            {/* SCORES */}

            <div className="report-score-grid">


              <div className="score-card">

                <h3>
                  Overall Score
                </h3>

                <p>
                  {formatScore(
                    report.overall_score
                  )}
                </p>

              </div>


              <div className="score-card">

                <h3>
                  Technical Score
                </h3>

                <p>
                  {formatScore(
                    report.technical_score
                  )}
                </p>

              </div>


              <div className="score-card">

                <h3>
                  Communication
                </h3>

                <p>
                  {formatScore(
                    report.communication_score
                  )}
                </p>

              </div>


              <div className="score-card">

                <h3>
                  Grammar
                </h3>

                <p>
                  {formatScore(
                    report.grammar_score
                  )}
                </p>

              </div>

            </div>



            {/* ------------------------------------------------ */}
            {/* STRENGTHS */}
            {/* ------------------------------------------------ */}

            <div className="report-section">

              <h3>
                Strengths
              </h3>


              {report.strengths &&
              report.strengths.length > 0 ? (

                <ul>

                  {report.strengths.map(
                    (item, index) => (

                      <li key={index}>
                        {item}
                      </li>

                    )
                  )}

                </ul>

              ) : (

                <p>
                  No strengths recorded.
                </p>

              )}

            </div>



            {/* ------------------------------------------------ */}
            {/* WEAKNESSES */}
            {/* ------------------------------------------------ */}

            <div className="report-section">

              <h3>
                Weaknesses
              </h3>


              {report.weaknesses &&
              report.weaknesses.length > 0 ? (

                <ul>

                  {report.weaknesses.map(
                    (item, index) => (

                      <li key={index}>
                        {item}
                      </li>

                    )
                  )}

                </ul>

              ) : (

                <p>
                  No weaknesses recorded.
                </p>

              )}

            </div>



            {/* ------------------------------------------------ */}
            {/* TOPICS TO IMPROVE */}
            {/* ------------------------------------------------ */}

            <div className="report-section">

              <h3>
                Topics To Improve
              </h3>


              {report.topics_to_improve &&
              report.topics_to_improve.length > 0 ? (

                <ul>

                  {report.topics_to_improve.map(
                    (item, index) => (

                      <li key={index}>
                        {item}
                      </li>

                    )
                  )}

                </ul>

              ) : (

                <p>
                  No topics recorded.
                </p>

              )}

            </div>



            {/* ------------------------------------------------ */}
            {/* FINAL FEEDBACK */}
            {/* ------------------------------------------------ */}

            <div className="report-section">

              <h3>
                Final Feedback
              </h3>


              <p>

                {report.final_feedback
                  ? report.final_feedback
                  : "No final feedback available."}

              </p>

            </div>

          </div>

        ) : (

          <div className="final-report-section">

            <h2>
              Final Interview Report
            </h2>


            <p>
              No final report available for this interview.
            </p>

          </div>

        )}



        {/* ------------------------------------------------ */}
        {/* QUESTIONS & ANSWERS */}
        {/* ------------------------------------------------ */}

        <div className="interview-question-history">

          <h2>
            Questions & Answers
          </h2>


          {questions.length === 0 ? (

            <p>
              No questions found for this interview.
            </p>

          ) : (

            questions.map(
              (item, index) => (

                <div
                  key={item.id}
                  className="interview-history-card"
                >


                  <div className="question-header">

                    <h3>
                      Question {index + 1}
                    </h3>


                    <span className="question-difficulty">

                      {formatText(
                        item.difficulty
                      )}

                    </span>

                  </div>



                  <div className="question-section">

                    <strong>
                      Question
                    </strong>

                    <p>
                      {item.question}
                    </p>

                  </div>



                  <div className="question-section">

                    <strong>
                      Your Answer
                    </strong>

                    <p>

                      {item.answer
                        ? item.answer
                        : "No answer recorded."}

                    </p>

                  </div>



                  <div className="question-section">

                    <strong>
                      Grade
                    </strong>

                    <p>
                      {formatScore(
                        item.grade
                      )}
                    </p>

                  </div>



                  <div className="question-section">

                    <strong>
                      Feedback
                    </strong>

                    <p>

                      {item.feedback
                        ? item.feedback
                        : "No feedback available."}

                    </p>

                  </div>


                </div>

              )
            )

          )}

        </div>


      </div>

    </div>

  );

}

export default InterviewDetails;