import { useAuth } from "../App";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";

export default function ChatDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showRequests, setShowRequests] = useState(false);
  const [username, setUsername] = useState("");
  const [users, setUsers] = useState([]);

  // Get logged-in username
  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  // Fetch usernames from backend
  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/listusername/") // <-- your API endpoint
      .then((response) => {
        setUsers(response.data.data || []);
      })
      .catch((error) => {
        console.error("Error fetching usernames:", error);
      });
  }, []);

  const handleLogout = () => {
    logout();
    localStorage.removeItem("username");
    navigate("/login");
  };

  const handleConnect = (friendUsername) => {
    alert(`Friend request sent to ${friendUsername}!`);
    // Later replace with WebSocket/API call
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      {/* Top Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          backgroundColor: "#f8f9fa",
          padding: "10px 20px",
          borderRadius: "8px",
          boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
        }}
      >
        <h2 style={{ margin: 0, color: "#333" }}>
          Welcome, {username || "User"}
        </h2>

        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          {/* Bell Icon */}
          <div
            style={{ position: "relative", cursor: "pointer", fontSize: "20px" }}
            onClick={() => setShowRequests(!showRequests)}
          >
            🔔
            {showRequests && (
              <div
                style={{
                  position: "absolute",
                  top: "30px",
                  right: 0,
                  background: "#fff",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                  padding: "10px",
                  minWidth: "220px",
                  zIndex: 10,
                  maxHeight: "250px",
                  overflowY: "auto"
                }}
              >
                <p style={{ margin: "0 0 10px", fontWeight: "bold" }}>
                  All Users
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {users
                    .filter((u) => u !== username) // hide logged-in user
                    .map((u, index) => (
                      <li
                        key={index}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "6px 8px",
                          borderBottom: "1px solid #eee"
                        }}
                      >
                        <span>{u}</span>
                        <button
                          onClick={() => handleConnect(u)}
                          style={{
                            padding: "4px 8px",
                            backgroundColor: "#007bff",
                            color: "#fff",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px"
                          }}
                        >
                          Connect
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            style={{
              padding: "8px 16px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Content */}
      <p style={{ color: "#555" }}>
        Welcome to your dashboard! You successfully logged in.
      </p>
    </div>
  );
}
