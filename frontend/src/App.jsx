import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Interview from "./Interview.jsx";
import InterviewDetails from "./pages/InterviewDetails.jsx";

function App() {
  return (
  <Routes>

    <Route
      path="/"
      element={<Navigate to="/register" />}
    />

    <Route
      path="/register"
      element={<Register />}
    />

    <Route
      path="/login"
      element={<Login />}
    />

    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      }
    />

    <Route
      path="/interview"
      element={
        <ProtectedRoute>
          <Interview />
        </ProtectedRoute>
      }
    />
    <Route
  path="/interviews/:session_id"
  element={
    <ProtectedRoute>
      <InterviewDetails />
    </ProtectedRoute>
  }
/>

  </Routes>
);
}

export default App;