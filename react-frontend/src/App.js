import {Routes, Route, Navigate, BrowserRouter as Router} from "react-router-dom";
import { useState, createContext, useContext, useEffect } from "react";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage"
import ChatDashboard from "./components/ChatDashboard"
import OTPPage from "./components/OTPPage"
import EnterEmailPage from "./components/EnterEmailPage"
import OTPPage2 from "./components/OTPPage2";
import PasswordResetting from "./components/PasswordResetting";
import RoomsDashboard from "./components/RoomsDashboard";
import RealTimeChattingDashboard from "./components/RealTimeChattingDashboard"



// Create context for tracking login state
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

function ProtectedRoute({ children }) {
  const { isLoggedInThisSession } = useAuth();
  const token = localStorage.getItem("token");

  // Must have both valid token AND have logged in during this session
  if (!token || !isLoggedInThisSession) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  // Track if user logged in during this browser session (persisted across reloads)
  const [isLoggedInThisSession, setIsLoggedInThisSession] = useState(() => {
    // Initialize from sessionStorage on app load
    return sessionStorage.getItem("loggedInThisSession") === "true";
  });

  // Update sessionStorage whenever login state changes
  useEffect(() => {
    if (isLoggedInThisSession) {
      sessionStorage.setItem("loggedInThisSession", "true");
    } else {
      sessionStorage.removeItem("loggedInThisSession");
    }
  }, [isLoggedInThisSession]);

  const login = () => {
    setIsLoggedInThisSession(true);
  };

  const logout = () => {
    setIsLoggedInThisSession(false);
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ isLoggedInThisSession, login, logout }}>
      <Router>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <ChatDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/rooms-dashboard"
            element={
              <ProtectedRoute>
                <RoomsDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/real-time-chat"
            element={
              <ProtectedRoute>
                <RealTimeChattingDashboard />
              </ProtectedRoute>
            }
          />


          <Route
            path="/verification"
            element={
                <OTPPage />
            }
          />

          <Route
            path="/forgotpassword"
            element={
                <EnterEmailPage />
            }
          />
          <Route
            path="/passwordresetting"
            element={
                <PasswordResetting />
            }
          />

          <Route
            path="/verificationpwd"
            element={
                <OTPPage2 />
            }
          />

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;