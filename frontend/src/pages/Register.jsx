import {
  useState,
  useRef
} from "react";

import {
  useNavigate
} from "react-router-dom";

import "./Register.css";


const EyeIcon = ({ open }) => (

  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
  >

    {open ? (

      <>

        <path
          d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"
          stroke="currentColor"
          strokeWidth="1.8"
        />

        <circle
          cx="12"
          cy="12"
          r="3"
          stroke="currentColor"
          strokeWidth="1.8"
        />

      </>

    ) : (

      <path
        d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.24 4.24M6.5 6.7C3.9 8.3 2 12 2 12s4 7 11 7c1.8 0 3.4-.45 4.8-1.1M17.4 17.4C19.8 15.8 22 12 22 12s-1.7-3-4.6-4.9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

    )}

  </svg>

);


const Register = () => {

  const navigate = useNavigate();

  const cardRef = useRef(null);


  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);


  const handleTilt = (e) => {

    const card = cardRef.current;

    if (!card) return;


    const rect =
      card.getBoundingClientRect();


    const x =
      e.clientX - rect.left;

    const y =
      e.clientY - rect.top;


    const rotateX =
      ((y / rect.height) - 0.5) * -8;

    const rotateY =
      ((x / rect.width) - 0.5) * 8;


    card.style.setProperty(
      "--rx",
      `${rotateX}deg`
    );

    card.style.setProperty(
      "--ry",
      `${rotateY}deg`
    );

  };


  const resetTilt = () => {

    const card = cardRef.current;

    if (!card) return;

    card.style.setProperty(
      "--rx",
      "0deg"
    );

    card.style.setProperty(
      "--ry",
      "0deg"
    );

  };


  const passwordScore = (() => {

    let score = 0;

    if (password.length >= 6)
      score++;

    if (password.length >= 10)
      score++;

    if (
      /[A-Z]/.test(password) &&
      /[0-9]/.test(password)
    )
      score++;

    if (
      /[^A-Za-z0-9]/.test(password)
    )
      score++;

    return score;

  })();


  const strengthLabels = [
    "Too short",
    "Weak",
    "Okay",
    "Good",
    "Strong"
  ];


  const strengthLabel =
    password
      ? strengthLabels[passwordScore]
      : "";


  const handleSubmit = async (e) => {

    e.preventDefault();

    setMessage("");

    setLoading(true);


    try {

      const response = await fetch(
        "https://ai-interview-assistant-j2if.onrender.com/auth/register",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            name,
            email,
            password
          })
        }
      );


      const data =
        await response.json();


      if (response.ok) {

        setMessage(
          "Account created successfully."
        );


        setTimeout(() => {

          navigate("/login");

        }, 1000);

      } else {

        setMessage(
          data.detail ||
          "Registration failed."
        );

      }

    } catch (error) {

      console.error(error);

      setMessage(
        "Unable to connect to the server."
      );

    } finally {

      setLoading(false);

    }

  };


  return (

    <div
      className="auth-page"
      onMouseMove={handleTilt}
      onMouseLeave={resetTilt}
    >

      <form
        className="auth-card"
        ref={cardRef}
        onSubmit={handleSubmit}
      >

        <div className="auth-glow" />


        <div className="auth-heading">

          <p className="auth-tag">
            AI Interview Assistant
          </p>

          <h1 className="auth-title">
            Create Account
          </h1>

          <p className="auth-subtitle">
            Start practicing smarter interviews
          </p>

        </div>


        <div className="auth-field">

          <input
            className="auth-input"
            type="text"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            placeholder=" "
            id="reg-name"
            required
          />

          <label
            className="auth-label"
            htmlFor="reg-name"
          >
            Full name
          </label>

        </div>


        <div className="auth-field">

          <input
            className="auth-input"
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            placeholder=" "
            id="reg-email"
            required
          />

          <label
            className="auth-label"
            htmlFor="reg-email"
          >
            Email address
          </label>

        </div>


        <div className="auth-field">

          <div className="auth-password-wrap">

            <input
              className="auth-input"
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder=" "
              id="reg-password"
              required
            />

            <label
              className="auth-label"
              htmlFor="reg-password"
            >
              Password
            </label>


            <button
              type="button"
              className="auth-eye-toggle"
              onClick={() =>
                setShowPassword(
                  (value) => !value
                )
              }
            >

              <EyeIcon
                open={showPassword}
              />

            </button>

          </div>


          {password && (

            <div className="auth-strength">

              <div className="auth-strength-track">

                <div
                  className={
                    `auth-strength-fill auth-strength-${passwordScore}`
                  }
                />

              </div>

              <span className="auth-strength-label">
                {strengthLabel}
              </span>

            </div>

          )}

        </div>


        {message && (

          <p className="auth-message">
            {message}
          </p>

        )}


        <button
          className="auth-button"
          type="submit"
          disabled={loading}
        >

          {loading
            ? "Creating account..."
            : "Create Account"}

        </button>


        <p className="auth-switch">

          Already have an account?

          <button
            type="button"
            onClick={() =>
              navigate("/login")
            }
          >
            Login
          </button>

        </p>

      </form>

    </div>

  );

};


export default Register;