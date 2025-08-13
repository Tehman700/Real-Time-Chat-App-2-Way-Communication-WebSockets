import { useAuth } from "../App";
import { useNavigate } from "react-router-dom";

export default function ChatDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); // This will clear the session state and token
    navigate("/login");
  };

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1>Dashboard</h1>
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
      <p>Welcome to your dashboard! You successfully logged in.</p>
    </div>
  );
}