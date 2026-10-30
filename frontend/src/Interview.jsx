import { useState, useRef } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import "./App.css"
import EvaluationResult from "./components/EvaluationResult"

function Interview() {

  // ---------------- DASHBOARD INTERVIEW TYPE ----------------

  const location = useLocation()
  const navigate = useNavigate()

  const type = location.state?.type


  // ---------------- INTERVIEW STATES ----------------

  const [message, setMessage] = useState("")
  const [sessionId, setSessionId] = useState("")
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")

  const [grade, setGrade] = useState(null)
  const [feedback, setFeedback] = useState("")
  const [betterAnswer, setBetterAnswer] = useState("")


  // ---------------- INTERVIEW SETUP STATES ----------------

  const [topic, setTopic] = useState("")
  const [company, setCompany] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [resumeFile, setResumeFile] = useState(null)

  const [difficulty, setDifficulty] = useState("medium")
  const [followUpMode, setFollowUpMode] = useState("normal")


  // ---------------- UI STATES ----------------

  const [isStarting, setIsStarting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEnding, setIsEnding] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isUploadingResume, setIsUploadingResume] = useState(false)
  const [questionCount, setQuestionCount] = useState(0)


  // ---------------- CAMERA STATES ----------------

  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [cameraStarted, setCameraStarted] = useState(false)


  // ---------------- RECORDED VIDEO ----------------

  const [recordedVideoUrl, setRecordedVideoUrl] = useState("")

  const videoRef = useRef(null)
  const mediaStreamRef = useRef(null)
  const recorderRef = useRef(null)
  const recordedChunksRef = useRef([])


  // ---------------- FINAL REPORT ----------------

  const [finalReport, setFinalReport] = useState(null)


  // ---------------- API URL ----------------

  const API_URL = import.meta.env.VITE_API_URL
  const token = localStorage.getItem("token")



  // =========================================================
  // PREPARE INTERVIEW MESSAGE
  // =========================================================

  const prepareInterviewMessage = () => {

    if (type === "topic") {
      return topic
    }

    if (type === "company") {
      return company
    }

    if (type === "jd") {
      return jobDescription
    }

    if (type === "mixed") {
      return "DSA, Operating Systems, DBMS, Computer Networks and OOPs"
    }

    if (type === "resume") {
      return message
    }

    return message
  }
const handleGoBack = () => {
  navigate("/dashboard");
};


  // =========================================================
  // RESUME UPLOAD
  // =========================================================

  const handleResumeUpload = async () => {

    if (!resumeFile) {

      alert("Please select a resume first")

      return
    }


    if (isUploadingResume) {
      return
    }


    setIsUploadingResume(true)


    try {

      const formData = new FormData()

      formData.append(
        "file",
        resumeFile
      )

console.log("TOKEN BEFORE RESUME UPLOAD:", token);
      const response = await fetch(
        `${API_URL}/resume/upload`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: formData
        }
      )


      const data = await response.json()


      console.log(
        "RESUME UPLOAD RESPONSE:",
        data
      )


      if (!response.ok) {

        alert(
          data.detail ||
          "Resume upload failed"
        )

        return
      }


      setMessage(
        data.resume_text
      )


      alert(
        "Resume processed successfully"
      )


    } catch (error) {

      console.log(
        "RESUME UPLOAD ERROR:",
        error
      )

      alert(
        "Unable to upload resume"
      )


    } finally {

      setIsUploadingResume(false)

    }

  }



  // =========================================================
  // START RECORDING
  // =========================================================

  const startRecording = (stream) => {

    recordedChunksRef.current = []


    const recorder =
      new MediaRecorder(stream)


    recorderRef.current =
      recorder


    recorder.ondataavailable =
      (event) => {

        if (event.data.size > 0) {

          recordedChunksRef.current.push(
            event.data
          )

        }

      }


    recorder.onstop = () => {

      const blob =
        new Blob(
          recordedChunksRef.current,
          {
            type: "video/webm"
          }
        )


      if (recordedVideoUrl) {

        URL.revokeObjectURL(
          recordedVideoUrl
        )

      }


      const videoUrl =
        URL.createObjectURL(blob)


      setRecordedVideoUrl(
        videoUrl
      )

    }


    recorder.start()

  }



  // =========================================================
  // CAMERA
  // =========================================================

  const startCamera = async () => {

    try {

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        })


      mediaStreamRef.current =
        stream


      if (videoRef.current) {

        videoRef.current.srcObject =
          stream

      }


      setCameraStarted(true)


      startRecording(stream)


    } catch (error) {

      console.log(
        "CAMERA ERROR:",
        error
      )


      alert(
        "Unable to access camera or microphone"
      )

    }

  }



  // =========================================================
  // START INTERVIEW
  // =========================================================

  const handleStartInterview = async () => {

    const interviewMessage =
      prepareInterviewMessage()


    if (
      !interviewMessage.trim() ||
      isStarting
    ) {

      return
    }


    setIsStarting(true)


    try {

      const response = await fetch(
        `${API_URL}/interview/start`,
        {

          method: "POST",


          headers: {

            "Content-Type":
              "application/json",

            "Authorization":
              `Bearer ${token}`

          },


          body: JSON.stringify({

            message: interviewMessage,

            interview_type: type,

            difficulty: difficulty,

            follow_up_mode: followUpMode

          })

        }
      )


      const data =
        await response.json()


      console.log(
        "START RESPONSE:",
        data
      )


      if (!response.ok) {

  console.log(
    "START ERROR RESPONSE:",
    data
  )

  alert(
    JSON.stringify(
      data,
      null,
      2
    )
  )

  return
}


      setSessionId(
        data.sessionid
      )


      setQuestion(
        data.response
      )


      setQuestionCount(1)


      setRecordedVideoUrl("")


      if (cameraEnabled) {

        setTimeout(() => {

          startCamera()

        }, 100)

      }


    } catch (error) {

      console.log(
        "START ERROR:",
        error
      )


      alert(
        "Unable to start interview"
      )


    } finally {

      setIsStarting(false)

    }

  }



  // =========================================================
  // SUBMIT ANSWER
  // =========================================================

  const handleSubmitAnswer = async () => {

    if (
      !answer.trim() ||
      isSubmitting
    ) {

      return
    }


    setIsSubmitting(true)


    try {

      const response = await fetch(
        `${API_URL}/interview/answer`,
        {

          method: "POST",


          headers: {

            "Content-Type":
              "application/json",

            "Authorization":
              `Bearer ${token}`

          },


          body: JSON.stringify({

            sessionid: sessionId,

            answer: answer

          })

        }
      )


      const data =
        await response.json()


      if (!response.ok) {

        alert(
          data.detail ||
          "Unable to evaluate answer"
        )

        return
      }


      const evaluation =
        JSON.parse(
          data.response.content
        )


      console.log(
        "EVALUATION:",
        evaluation
      )


      setGrade(
        evaluation.grade
      )


      setFeedback(
        evaluation.feedback
      )


      setBetterAnswer(
        evaluation.better_answer
      )


      setQuestion(
        evaluation.next_question
      )


      setQuestionCount(
        (prev) => prev + 1
      )


      setAnswer("")


    } catch (error) {

      console.log(
        "SUBMIT ERROR:",
        error
      )


      alert(
        "Unable to submit answer"
      )


    } finally {

      setIsSubmitting(false)

    }

  }



  // =========================================================
  // VOICE ANSWER
  // =========================================================

  const handleVoiceAnswer = () => {

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition


    if (!SpeechRecognition) {

      alert(
        "Speech recognition is not supported in this browser"
      )

      return
    }


    const recognition =
      new SpeechRecognition()


    recognition.lang =
      "en-US"


    recognition.onstart = () => {

      setIsListening(true)

    }


    recognition.onresult =
      (event) => {

        const transcript =
          event.results[0][0]
            .transcript


        setAnswer(
          (prev) =>
            prev +
            " " +
            transcript
        )

      }


    recognition.onerror =
      () => {

        setIsListening(false)

      }


    recognition.onend = () => {

      setIsListening(false)

    }


    recognition.start()

  }



  // =========================================================
  // STOP CAMERA
  // =========================================================

  const stopCamera = () => {

    if (
      mediaStreamRef.current
    ) {

      mediaStreamRef.current
        .getTracks()
        .forEach(
          (track) =>
            track.stop()
        )


      mediaStreamRef.current =
        null

    }


    setCameraStarted(false)

  }



  // =========================================================
  // END INTERVIEW
  // =========================================================

  const handleEndInterview = async () => {

    if (isEnding) return


    setIsEnding(true)


    try {

      if (
        recorderRef.current &&
        recorderRef.current.state !==
          "inactive"
      ) {

        recorderRef.current.stop()

      }


      stopCamera()


      const response = await fetch(
        `${API_URL}/interview/answer`,
        {

          method: "POST",


          headers: {

            "Content-Type":
              "application/json",

            "Authorization":
              `Bearer ${token}`

          },


          body: JSON.stringify({

            sessionid:
              sessionId,

            answer:
              "end my interview"

          })

        }
      )


      const data =
        await response.json()


      console.log(
        "FINAL REPORT:",
        data
      )


      setFinalReport(
        data.report
      )


      setQuestion("")


    } catch (error) {

      console.log(
        "END ERROR:",
        error
      )


    } finally {

      setIsEnding(false)

    }

  }



  // =========================================================
  // RESET INTERVIEW
  // =========================================================

  const handleResetInterview = () => {

    setRecordedVideoUrl("")

    setMessage("")

    setTopic("")

    setCompany("")

    setJobDescription("")

    setResumeFile(null)

    setGrade(null)

    setFeedback("")

    setBetterAnswer("")

    setQuestion("")

    setAnswer("")

    setSessionId("")

    setQuestionCount(0)

    setCameraEnabled(false)

    setCameraStarted(false)

    setFinalReport(null)

    setDifficulty("medium")

    setFollowUpMode("normal")

  }



  // =========================================================
  // UI
  // =========================================================

  return (

    <div className="app">

      <div className="interview-container">


        {/* HEADER */}

        <header className="header">

          <div className="logo">
            AI
          </div>


          <div>

            <h1>
              Interview Assistant
            </h1>


            <p>
              Practice. Improve. Get interview ready.
            </p>

          </div>

        </header>



        {/* START SCREEN */}

        {!question &&
          !recordedVideoUrl &&
          !finalReport && (

            <div className="start-section">


              <div className="hero">

                <span className="badge">

                  <span className="badge-dot" />

                  AI Powered Interview

                </span>


                <h2>

                  Prepare for your{" "}

                  <span className="accent">
                    interview
                  </span>

                </h2>


                <p>

                  Configure your interview and let the AI
                  interviewer generate questions and evaluate
                  your answers.

                </p>

              </div>



              {/* CAMERA MODE */}

              <div className="camera-choice">


                <button

                  className={
                    cameraEnabled
                      ? "camera-option selected"
                      : "camera-option"
                  }

                  onClick={() =>
                    setCameraEnabled(true)
                  }

                >

                  📹 With Camera

                </button>



                <button

                  className={
                    !cameraEnabled
                      ? "camera-option selected"
                      : "camera-option"
                  }

                  onClick={() =>
                    setCameraEnabled(false)
                  }

                >

                  Without Camera

                </button>

              </div>



              <div className="start-box">


                {/* TOPIC BASED */}

                {type === "topic" && (

                  <div>

                    <h3>
                      Topic Based Interview
                    </h3>


                    <input

                      type="text"

                      placeholder="e.g. Operating Systems"

                      value={topic}

                      onChange={(e) =>
                        setTopic(
                          e.target.value
                        )
                      }

                      disabled={
                        isStarting
                      }

                    />

                  </div>

                )}



                {/* COMPANY BASED */}

                {type === "company" && (

                  <div>

                    <h3>
                      Company Specific Interview
                    </h3>


                    <input

                      type="text"

                      placeholder="e.g. Cognizant"

                      value={company}

                      onChange={(e) =>
                        setCompany(
                          e.target.value
                        )
                      }

                      disabled={
                        isStarting
                      }

                    />

                  </div>

                )}



                {/* JD BASED */}

                {type === "jd" && (

                  <div>

                    <h3>
                      Job Description Based Interview
                    </h3>


                    <textarea

                      placeholder="Paste the job description here..."

                      value={jobDescription}

                      onChange={(e) =>
                        setJobDescription(
                          e.target.value
                        )
                      }

                      disabled={
                        isStarting
                      }

                    />

                  </div>

                )}



                {/* MIXED */}

                {type === "mixed" && (

                  <div>

                    <h3>
                      Mixed Technical Interview
                    </h3>


                    <p>

                      Questions will cover DSA,
                      Operating Systems, DBMS,
                      Computer Networks and OOPs.

                    </p>

                  </div>

                )}



                {/* RESUME BASED */}

                {type === "resume" && (

                  <div>

                    <h3>
                      Resume Based Interview
                    </h3>


                    <input

                      type="file"

                      accept=".pdf"

                      onChange={(e) => {

                        const file =
                          e.target.files[0]


                        setResumeFile(file)


                        // Clear previously extracted resume
                        setMessage("")

                      }}

                      disabled={
                        isUploadingResume ||
                        isStarting
                      }

                    />


                    {resumeFile && (

                      <p>
                        Selected: {resumeFile.name}
                      </p>

                    )}


                    <button

                      type="button"

                      onClick={
                        handleResumeUpload
                      }

                      disabled={
                        !resumeFile ||
                        isUploadingResume ||
                        isStarting
                      }

                    >

                      {isUploadingResume
                        ? "Processing Resume..."
                        : "Upload Resume"}

                    </button>


                    {message && (

                      <p>
                        ✅ Resume processed successfully
                      </p>

                    )}

                  </div>

                )}



                {/* FALLBACK */}

                {!type && (

                  <div>

                    <input

                      type="text"

                      placeholder="e.g. Operating Systems"

                      value={message}

                      onChange={(e) =>
                        setMessage(
                          e.target.value
                        )
                      }

                    />

                  </div>

                )}



                {/* DIFFICULTY */}

                <div className="interview-setting">

                  <h3>
                    Select Difficulty
                  </h3>


                  <select

                    value={difficulty}

                    onChange={(e) =>
                      setDifficulty(
                        e.target.value
                      )
                    }

                    disabled={
                      isStarting
                    }

                  >

                    <option value="easy">
                      Easy
                    </option>

                    <option value="medium">
                      Medium
                    </option>

                    <option value="hard">
                      Hard
                    </option>

                    <option value="adaptive">
                      Adaptive
                    </option>

                  </select>

                </div>



                {/* FOLLOW UP MODE */}

                <div className="interview-setting">

                  <h3>
                    Question Style
                  </h3>


                  <select

                    value={followUpMode}

                    onChange={(e) =>
                      setFollowUpMode(
                        e.target.value
                      )
                    }

                    disabled={
                      isStarting
                    }

                  >

                    <option value="normal">
                      Normal Interview
                    </option>

                    <option value="follow_up">
                      Follow-up Questions
                    </option>

                    <option value="cross">
                      Cross Questions
                    </option>

                  </select>

                </div>



                {/* START BUTTON */}

                <button

                  className="start-btn"

                  onClick={
                    handleStartInterview
                  }

                  disabled={
                    isStarting ||
                    (type === "resume" && !message)
                  }

                >

                  {isStarting ? (

                    <span className="btn-spinner" />

                  ) : (

                    <>
                      Start Interview →
                    </>

                  )}

                </button>


              </div>

            </div>

          )}



        {/* INTERVIEW */}

        {question && (

          <main className="interview">


            <div className="status-bar">


              <span className="live-dot" />


              Interview in progress


              <span className="question-count">

                Question {questionCount}

              </span>


              <span className="question-count">

                Difficulty: {difficulty}

              </span>


              <button

                className="end-btn"

                onClick={
                  handleEndInterview
                }

                disabled={
                  isEnding
                }

              >

                {isEnding
                  ? "Ending…"
                  : "End Interview"}

              </button>

            </div>



            {/* CAMERA */}

            {cameraEnabled && (

              <div className="video-preview">

                <video

                  ref={videoRef}

                  autoPlay

                  muted

                  playsInline

                />


                <span className="recording-label">

                  {cameraStarted
                    ? "Recording"
                    : "Starting..."}

                </span>

              </div>

            )}



            <div className="interview-layout">


              <div className="interview-main">


                {/* QUESTION */}

                <div
                  className="question-card"
                  key={question}
                >

                  <div className="question-header">


                    <div className="ai-avatar">

                      AI

                    </div>


                    <div>

                      <span className="small-label">

                        INTERVIEWER

                      </span>


                      <h2>

                        {question}

                      </h2>

                    </div>

                  </div>

                </div>



                {/* ANSWER */}

                <div className="answer-card">


                  <label>

                    Your Answer

                  </label>


                  <textarea

                    placeholder="Type your answer here, or use the microphone..."

                    value={answer}

                    onChange={(e) =>
                      setAnswer(
                        e.target.value
                      )
                    }

                    disabled={
                      isSubmitting
                    }

                  />


                  <div className="answer-actions">


                    <button

                      className={`mic-btn ${
                        isListening
                          ? "mic-active"
                          : ""
                      }`}

                      onClick={
                        handleVoiceAnswer
                      }

                      disabled={
                        isSubmitting
                      }

                    >

                      {isListening
                        ? "🎙️ Listening..."
                        : "🎙️ Speak Answer"}

                    </button>



                    <button

                      className="submit-btn"

                      onClick={
                        handleSubmitAnswer
                      }

                      disabled={
                        isSubmitting ||
                        !answer.trim()
                      }

                    >

                      {isSubmitting
                        ? "Submitting..."
                        : "Submit Answer →"}

                    </button>

                  </div>

                </div>

              </div>



              {/* EVALUATION */}

              {grade !== null && (

                <div className="evaluation-panel">

                  <EvaluationResult

                    grade={grade}

                    feedback={feedback}

                    betterAnswer={
                      betterAnswer
                    }

                  />

                </div>

              )}

            </div>

          </main>

        )}



        {/* FINAL REPORT */}

        {finalReport && (

  <div className="recorded-interview">

    <h2>
      Interview Completed
    </h2>


    <div className="final-report">

      <p>
        <strong>Overall Score:</strong> {finalReport.overall_score}/10
      </p>

      <p>
        <strong>Technical Score:</strong> {finalReport.technical_score}/10
      </p>

      <p>
        <strong>Communication Score:</strong> {finalReport.communication_score}/10
      </p>

      <p>
        <strong>Grammar Score:</strong> {finalReport.grammar_score}/10
      </p>


      <h3>Strengths</h3>

      <ul>
        {finalReport.strengths?.map((item, index) => (
          <li key={index}>
            {item}
          </li>
        ))}
      </ul>


      <h3>Weaknesses</h3>

      <ul>
        {finalReport.weaknesses?.map((item, index) => (
          <li key={index}>
            {item}
          </li>
        ))}
      </ul>


      <h3>Topics To Improve</h3>

      <ul>
        {finalReport.topics_to_improve?.map((item, index) => (
          <li key={index}>
            {item}
          </li>
        ))}
      </ul>


      <h3>Final Feedback</h3>

      <p>
        {finalReport.final_feedback}
      </p>

    </div>


    <div className="report-actions">

  <button
    className="start-btn"
    onClick={handleResetInterview}
  >
    Start New Interview
  </button>

  <button
    className="back-btn"
    onClick={handleGoBack}
  >
    ← Go Back
  </button>

</div>

  </div>

)}



        {/* RECORDED VIDEO */}

        {recordedVideoUrl &&
          !finalReport && (

            <div className="recorded-interview">


              <h2>
                🎥 Your Interview Recording
              </h2>


              <p>

                Review your interview and identify areas where
                you can improve your communication and body language.

              </p>


              <video

                src={
                  recordedVideoUrl
                }

                controls

                playsInline

              />


              <button

                className="start-btn"

                onClick={
                  handleResetInterview
                }

              >

                Start New Interview

              </button>

            </div>

          )}


      </div>

    </div>

  )

}

export default Interview