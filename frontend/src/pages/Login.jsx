import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";


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


function Login() {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);


  const handleLogin = async (e) => {

    e.preventDefault();

    setMessage("");

    setLoading(true);


    try {

     const response = await fetch(
  "https://ai-interview-assistant-j2if.onrender.com/auth/login",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            email,
            password
          })
        }
      );


      const data = await response.json();


      if (response.ok) {

        console.log("LOGIN RESPONSE:", data);


        localStorage.setItem(
          "token",
          data.access_token
        );


        console.log("TOKEN SAVED");


        navigate("/dashboard");

      } else {

        console.log("LOGIN ERROR:", data);


        setMessage(
          data.detail ||
          "Invalid email or password."
        );

      }

    } catch (error) {

      console.error(
        "LOGIN FAILED:",
        error
      );


      setMessage(
        "Unable to connect to the server."
      );

    } finally {

      setLoading(false);

    }

  };


  return (

    <div className="auth-page">

      <form
        className="auth-card"
        onSubmit={handleLogin}
      >

        <div className="auth-glow" />


        <div className="auth-heading">

          <p className="auth-tag">
            AI Interview Assistant
          </p>


          <h1 className="auth-title">
            Welcome Back
          </h1>


          <p className="auth-subtitle">
            Login to continue your interview practice
          </p>

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
            id="login-email"
            required
          />


          <label
            className="auth-label"
            htmlFor="login-email"
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
              id="login-password"
              required
            />


            <label
              className="auth-label"
              htmlFor="login-password"
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
              aria-label={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
            >

              <EyeIcon
                open={showPassword}
              />

            </button>

          </div>

        </div>


        {message && (

          <p className="auth-message error">
            {message}
          </p>

        )}


        <button
          className="auth-button"
          type="submit"
          disabled={loading}
        >

          {loading
            ? "Logging in..."
            : "Login"}

        </button>


        <p className="auth-switch">

          Don't have an account?


          <button
            type="button"
            onClick={() =>
              navigate("/register")
            }
          >
            Register
          </button>

        </p>

      </form>

    </div>

  );

}


export default Login;