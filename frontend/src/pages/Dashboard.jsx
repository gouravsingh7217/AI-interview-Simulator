import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [interviews, setInterviews] = useState([]);
  const [loadingInterviews, setLoadingInterviews] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL;


  useEffect(() => {
    const loadDashboard = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      try {

        // -----------------------------------
        // VERIFY USER
        // -----------------------------------

        const response = await fetch(
          `${API_URL}/me`,
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

        if (!response.ok) {
          throw new Error(
            "Unable to verify user"
          );
        }

        const data = await response.json();

        console.log(
          "LOGGED IN USER:",
          data
        );

        setUser(data);


        // -----------------------------------
        // FETCH PREVIOUS INTERVIEWS
        // -----------------------------------

        const interviewResponse = await fetch(
          `${API_URL}/interviews`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (interviewResponse.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        if (!interviewResponse.ok) {
          throw new Error(
            "Unable to fetch interviews"
          );
        }

        const interviewData =
          await interviewResponse.json();

        console.log(
          "PREVIOUS INTERVIEWS:",
          interviewData
        );

        setInterviews(
          interviewData.interviews || []
        );

      } catch (error) {

        console.log(
          "DASHBOARD ERROR:",
          error
        );

      } finally {

        setLoadingUser(false);
        setLoadingInterviews(false);

      }
    };

    loadDashboard();

  }, [API_URL, navigate]);


  // -----------------------------------
  // FORMAT TEXT
  // -----------------------------------

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


  // -----------------------------------
  // FORMAT SCORE
  // -----------------------------------

  const formatScore = (score) => {

    if (
      score === null ||
      score === undefined
    ) {
      return "Not available";
    }

    return `${score}/10`;
  };


  // -----------------------------------
  // START INTERVIEW
  // -----------------------------------

  const startInterview = (type) => {

    console.log(
      "Selected interview:",
      type
    );

    navigate("/interview", {
      state: { type }
    });
  };


  // -----------------------------------
  // LOGOUT
  // -----------------------------------

  const handleLogout = () => {

    localStorage.removeItem("token");

    navigate("/login");
  };


  const interviewModes = [
    {
      type: "resume",
      title: "Resume Based Interview",
      description:
        "Practice questions generated from your resume and projects."
    },

    {
      type: "topic",
      title: "Topic Based Interview",
      description:
        "Choose a technical topic and practice focused interview questions."
    },

    {
      type: "jd",
      title: "JD Based Interview",
      description:
        "Paste a job description and prepare for role-specific questions."
    },

    {
      type: "mixed",
      title: "Mixed Technical Interview",
      description:
        "Practice a mix of technical concepts and problem-solving questions."
    },

    {
      type: "company",
      title: "Company Specific Interview",
      description:
        "Prepare with interview questions tailored to a specific company."
    }
  ];


  // -----------------------------------
  // LOADING
  // -----------------------------------

  if (loadingUser) {

    return (

      <div className="dashboard-page">

        <div className="dashboard-container">

          <p>
            Verifying user...
          </p>

        </div>

      </div>
    );
  }


  return (

    <div className="dashboard-page">

      <div className="dashboard-container">


        {/* ---------------------------------- */}
        {/* TOP BAR */}
        {/* ---------------------------------- */}

        <div className="dashboard-topbar">

          <div>

            <p className="dashboard-tag">
              AI Interview Assistant
            </p>


            <h1 className="dashboard-title">
              Choose Your Interview Mode
            </h1>


            {user && (

              <p className="dashboard-subtitle">

                Welcome, {user.name}

              </p>

            )}


            <p className="dashboard-subtitle">

              Select how you want to practice
              your next interview.

            </p>

          </div>


          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>



        {/* ---------------------------------- */}
        {/* INTERVIEW MODES */}
        {/* ---------------------------------- */}

        <div className="dashboard-grid">

          {interviewModes.map((mode) => (

            <div
              className="dashboard-card"
              key={mode.type}
            >

              <div className="dashboard-card-glow" />


              <div className="dashboard-icon">

                {mode.type === "resume" && "📄"}

                {mode.type === "topic" && "📚"}

                {mode.type === "jd" && "💼"}

                {mode.type === "mixed" && "🧠"}

                {mode.type === "company" && "🏢"}

              </div>


              <h2>
                {mode.title}
              </h2>


              <p>
                {mode.description}
              </p>


              <button
                className="start-interview-button"
                onClick={() =>
                  startInterview(
                    mode.type
                  )
                }
              >
                Start Interview
              </button>

            </div>

          ))}

        </div>



        {/* ---------------------------------- */}
        {/* PREVIOUS INTERVIEWS */}
        {/* ---------------------------------- */}

        <div className="previous-interviews">

          <h2>
            Previous Interviews
          </h2>


          {loadingInterviews ? (

            <p>
              Loading interviews...
            </p>

          ) : interviews.length === 0 ? (

            <p>
              No previous interviews found.
            </p>

          ) : (

            <div className="previous-interviews-grid">

              {interviews.map((item) => (

                <div
                  className="previous-interview-card"
                  key={item.id}
                  onClick={() =>
                    navigate(
                      `/interviews/${item.session_id}`
                    )
                  }
                  style={{
                    cursor: "pointer"
                  }}
                >


                  <h3>

                    {formatText(
                      item.interview_type
                    )}

                    {" "}Interview

                  </h3>



                  <p>

                    <strong>
                      Difficulty:
                    </strong>{" "}

                    {formatText(
                      item.difficulty
                    )}

                  </p>



                  <p>

                    <strong>
                      Question Mode:
                    </strong>{" "}

                    {formatText(
                      item.follow_up_mode
                    )}

                  </p>



                  <p>

                    <strong>
                      Status:
                    </strong>{" "}

                    {formatText(
                      item.status
                    )}

                  </p>



                  {/* OVERALL SCORE */}

                  <p>

                    <strong>
                      Overall Score:
                    </strong>{" "}

                    {formatScore(
                      item.overall_score
                    )}

                  </p>



                  <p>

                    <strong>
                      Date:
                    </strong>{" "}

                    {item.created_at
                      ? new Date(
                          item.created_at
                        ).toLocaleString()
                      : "Not available"}

                  </p>



                  {item.context && (

                    <p>

                      <strong>
                        Context:
                      </strong>{" "}

                      {item.context.length > 100
                        ? item.context.slice(
                            0,
                            100
                          ) + "..."
                        : item.context}

                    </p>

                  )}


                  <button
                    className="view-details-button"
                    onClick={(event) => {

                      event.stopPropagation();

                      navigate(
                        `/interviews/${item.session_id}`
                      );

                    }}
                  >
                    View Details
                  </button>


                </div>

              ))}

            </div>

          )}

        </div>


      </div>

    </div>

  );
}

export default Dashboard;