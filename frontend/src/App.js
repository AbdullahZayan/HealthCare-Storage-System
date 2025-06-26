import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import PatientLoginPage from "./pages/PatientLoginPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import HeartRateDashboard from "./pages/HeartRatePage";
import ProfileInfo from "./pages/ProfileInfo";
import AdminPage from "./pages/AdminPage";
import ProtectedRoute from "./components/ProtectedRoute";
import Chatbot from "./pages/ChatBot";
import "./globals.css";

function App() {
  const api = process.env.REACT_APP_API_URL;
  console.log("🧪 API dsf in frontend:", api);

  return (
    <Router>
      <Routes>
        {/* Redirect root path to /login always */}
        ? <Route path="/" element={<Navigate to="/login" api={api} replace />} />
        {/* Chatbot route */}
        <Route path="/chatbot" element={<Chatbot api={api} />} />
        {/* Auth routes */}
        <Route path="/login" element={<PatientLoginPage api={api} />} />
        <Route path="/admin-login" element={<AdminLoginPage api={api} />} />
        <Route path="/register" element={<RegisterPage api={api} />} />
        {/* Protected routes */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomePage api={api}>
                <Chatbot api={api}></Chatbot>
              </HomePage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/heartrate"
          element={
            <ProtectedRoute>
              <HeartRateDashboard api={api}/>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPage api={api} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfileInfo api={api}/>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
