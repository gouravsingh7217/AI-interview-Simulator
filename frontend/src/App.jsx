import { useState, useRef } from "react"
import "./App.css"
import EvaluationResult from "./components/EvaluationResult"

function App() {

  const [message, setMessage] = useState("")
  const [sessionId, setSessionId] = useState("")
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")

  const [grade, setGrade] = useState(null)
  const [feedback, setFeedback] = useState("")
  const [betterAnswer, setBetterAnswer] = useState("")

  // UI states
  const [isStarting, setIsStarting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEnding, setIsEnding] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [questionCount, setQuestionCount] = useState(0)

  // Camera states
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [cameraStarted, setCameraStarted] = useState(false)

  // Recorded video URL
  const [recordedVideoUrl, setRecordedVideoUrl] = useState("")

  // Reference to <video> live preview
  const videoRef = useRef(null)

  // Stores camera + microphone stream
  const mediaStreamRef = useRef(null)

  // Stores MediaRecorder object
  const recorderRef = useRef(null)

  // Stores pieces of recorded video
  const recordedChunksRef = useRef([])
  const [finalReport, setFinalReport] = useState(null)

  const API_URL = import.meta.env.VITE_API_URL


  // ---------------- START RECORDING ----------------

  const startRecording = (stream) => {

    // Clear old chunks
    recordedChunksRef.current = []

    const recorder = new MediaRecorder(stream)

    recorderRef.current = recorder


    // Browser gives recorded pieces here
    recorder.ondataavailable = (event) => {

      if (event.data.size > 0) {

        recordedChunksRef.current.push(
          event.data
        )

      }
    }


    // Runs when recorder.stop() is called
    recorder.onstop = () => {

      const blob = new Blob(
        recordedChunksRef.current,
        {
          type: "video/webm"
        }
      )


      // Remove old temporary video URL
      if (recordedVideoUrl) {

        URL.revokeObjectURL(
          recordedVideoUrl
        )

      }


      // Create playable URL from recorded video
      const videoUrl =
        URL.createObjectURL(blob)


      setRecordedVideoUrl(
        videoUrl
      )


      console.log(
        "RECORDED VIDEO:",
        videoUrl
      )
    }


    // Start recording
    recorder.start()

    console.log(
      "RECORDING STARTED"
    )
  }



  // ---------------- CAMERA ----------------

  const startCamera = async () => {

    try {

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        })


      // Store camera stream
      mediaStreamRef.current = stream


      // Display live camera
      if (videoRef.current) {

        videoRef.current.srcObject =
          stream

      }


      setCameraStarted(true)


      // Start recording automatically
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



  // ---------------- START INTERVIEW ----------------

  const handleStartInterview = async () => {

    if (
      !message.trim() ||
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
              "application/json"
          },

          body: JSON.stringify({
            message: message
          })

        }
      )


      const data =
        await response.json()


      console.log(
        "START RESPONSE:",
        data
      )


      setSessionId(
        data.sessionid
      )

      setQuestion(
        data.response
      )

      setQuestionCount(1)


      // Clear previous recording
      setRecordedVideoUrl("")


      // Start camera only if selected
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

    } finally {

      setIsStarting(false)

    }
  }



  // ---------------- SUBMIT ANSWER ----------------

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
              "application/json"
          },

          body: JSON.stringify({

            sessionid: sessionId,

            answer: answer

          })

        }
      )


      const data =
        await response.json()


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

    } finally {

      setIsSubmitting(false)

    }
  }



  // ---------------- VOICE ANSWER ----------------

  const handleVoiceAnswer = () => {

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition


    console.log(
      "SpeechRecognition:",
      SpeechRecognition
    )


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

      console.log(
        "VOICE STARTED"
      )

      setIsListening(true)
    }


    recognition.onresult =
      (event) => {

        console.log(
          "VOICE RESULT:",
          event
        )


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
      (event) => {

        console.log(
          "VOICE ERROR:",
          event.error
        )

        setIsListening(false)
      }


    recognition.onend = () => {

      console.log(
        "VOICE ENDED"
      )

      setIsListening(false)
    }


    recognition.start()
  }



  // ---------------- STOP CAMERA ----------------

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



  // ---------------- END INTERVIEW ----------------

  const handleEndInterview = async () => {

    if (isEnding) return


    setIsEnding(true)


    try {

      // Stop video recording
      if (
        recorderRef.current &&
        recorderRef.current.state !==
          "inactive"
      ) {

        recorderRef.current.stop()

        console.log(
          "RECORDING STOPPED"
        )
      }


      // Stop camera + microphone
      stopCamera()


      const response = await fetch(
        "http://127.0.0.1:8000/interview/answer",
        {

          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({

            sessionid:
              sessionId,

            answer:
              "end my interview"

          })

        }
      )


      const data = await response.json()

console.log("FINAL REPORT:", data)

setFinalReport(data.report)

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



  // ---------------- UI ----------------

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
          !recordedVideoUrl && (

          <div className="start-section">


            <div className="hero">

              <span className="badge">

                <span className="badge-dot" />

                AI Powered Interview

              </span>


              <h2>

                What do you want to{" "}

                <span className="accent">

                  practice

                </span>

                ?

              </h2>


              <p>

                Choose any topic and your AI interviewer will
                generate questions and evaluate your answers.

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



            {/* START INPUT */}

            <div className="start-box">


              <input

                type="text"

                placeholder="e.g. Take my Operating Systems interview"

                value={message}

                onChange={(e) =>
                  setMessage(
                    e.target.value
                  )
                }

                onKeyDown={(e) =>
                  e.key ===
                    "Enter" &&
                  handleStartInterview()
                }

                disabled={
                  isStarting
                }

              />


              <button

                className="start-btn"

                onClick={
                  handleStartInterview
                }

                disabled={
                  isStarting ||
                  !message.trim()
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


            {/* STATUS */}

            <div className="status-bar">


              <span className="live-dot" />


              Interview in progress


              <span className="question-count">

                Question {questionCount}

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



            {/* INTERVIEW GRID */}

            <div className="interview-layout">


              {/* LEFT SIDE */}

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

                      {isListening ? (

                        <>
                          <span className="mic-pulse" />
                          Listening…
                        </>

                      ) : (

                        <>
                          🎙️ Speak Answer
                        </>

                      )}

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

                      {isSubmitting ? (

                        <span className="btn-spinner" />

                      ) : (

                        <>
                          Submit Answer →
                        </>

                      )}

                    </button>

                  </div>

                </div>

              </div>



              {/* RIGHT SIDE */}

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



        {/* RECORDED INTERVIEW */}

        {recordedVideoUrl && (

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
              onClick={() => {

                setRecordedVideoUrl("")

                setMessage("")

                setGrade(null)

                setFeedback("")

                setBetterAnswer("")

                setQuestionCount(0)

                setCameraEnabled(false)

              }}
            >

              Start New Interview

            </button>

          </div>

        )}

      </div>

    </div>
  )
}

export default App