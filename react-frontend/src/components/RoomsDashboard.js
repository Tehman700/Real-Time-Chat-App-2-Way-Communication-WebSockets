import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function RoomsDashboard() {
  const [groups, setGroups] = useState([]);
  const [status, setStatus] = useState(null);
  const navigate = useNavigate();
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [username, setUsername] = useState("");

  const [showDropdown, setShowDropdown] = useState(false);
  const [userProfile, setUserProfile] = useState({
    username: "",
    profilePic: null
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const socket = new WebSocket(`ws://localhost:8000/ws/presence/?token=${token}`);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "users") {
        setOnlineUsers(data.users);
      }
    };

    return () => socket.close();
  }, []);

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);

      const savedProfile = localStorage.getItem(`userProfile_${storedUsername}`);
      if (savedProfile) {
        setUserProfile(JSON.parse(savedProfile));
      } else {
        setUserProfile({
          username: storedUsername,
          profilePic: null,
        });
      }
    }
  }, []);




  useEffect(() => {
    const token = localStorage.getItem("token");

    axios
      .get("http://127.0.0.1:8000/api/groups/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        if (!response.data.groups || response.data.groups.length === 0) {
          setStatus(1);
        } else {
          setGroups(response.data.groups);
          setStatus(0);
        }
      })
      .catch((error) => {
        console.error("Error fetching groups:", error);
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem("token");
          navigate("/login");
        } else {
          setStatus(1);
        }
      });
  }, [navigate]);

  const createRoom = async () => {
    const groupName = prompt("Enter group name:");
    if (!groupName) return;

    const token = localStorage.getItem("token");

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/create-group/",
        { group_name: groupName },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert("Group created: " + response.data.group.group_name);

      // Add new group name to local state to reflect instantly
      setGroups((prevGroups) => [...prevGroups, response.data.group.group_name]);
      setStatus(0); // Ensure status is 0 (groups exist)
    } catch (error) {
      console.error("Error creating group:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        alert(
          error.response?.data?.error || "Failed to create group. See console."
        );
      }
    }
  };

  const joinSpecificRoom = (groupName) => {
    sessionStorage.setItem("group", groupName);
    navigate("/real-time-chat");

    // Here will be the all logic for the chatting in websockets
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f4f6f9" }}>
      {/* 🔹 Navbar */}
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "15px 30px",
          background: "#1e3a8a",
          color: "white",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        }}
      >
        <h1 style={{ fontSize: "20px", fontWeight: "bold" }}>Chat Dashboard</h1>

        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {/* 🔹 Current User Info */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <img
              src={userProfile.profilePic || "/default-avatar.png"}
              alt="Profile"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid white",
              }}
            />
            <span style={{ fontWeight: "600", fontSize: "16px" }}>
              {username || "User"}
            </span>
          </div>

          {/* 🔹 Online Users Dropdown */}
          <div style={{ position: "relative" }}>
            <div
              style={{
                cursor: "pointer",
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "#3b82f6",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: "18px",
                fontWeight: "bold",
              }}
              onClick={() => setShowDropdown((prev) => !prev)}
            >
              👤
            </div>

            {showDropdown && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  marginTop: "10px",
                  width: "220px",
                  background: "white",
                  borderRadius: "10px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  padding: "10px",
                  zIndex: 10,
                }}
              >
                <h3
                  style={{
                    fontSize: "14px",
                    marginBottom: "10px",
                    fontWeight: "600",
                    color: "#333",
                  }}
                >
                  Online Users
                </h3>
                {onlineUsers.length === 0 ? (
                  <p style={{ fontSize: "13px", color: "#666" }}>No users online</p>
                ) : (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {onlineUsers.map((user, idx) => (
                      <li
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: "5px 0",
                          fontSize: "14px",
                          color: "#444",
                        }}
                      >
                        <span
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: "green",
                            display: "inline-block",
                            marginRight: "8px",
                          }}
                        ></span>
                        {user}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* 🔹 Main Section */}
      <div style={{ padding: "20px" }}>
        <h2>Rooms Dashboard</h2>

        {status === null && <p>Loading...</p>}
        {status === 1 && <p>No Groups Found</p>}
        {status === 2 && <p>Not authenticated. Please log in.</p>}

        {status === 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "15px" }}>
            {groups.map((group, index) => (
              <div
                key={`${group}-${index}`}
                style={{
                  border: "1px solid #ccc",
                  borderRadius: "10px",
                  padding: "15px",
                  width: "200px",
                  textAlign: "center",
                  background: "white",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                }}
              >
                <h3>{group}</h3>
                <button
                  onClick={() => joinSpecificRoom(group)}
                  style={{
                    marginTop: "10px",
                    padding: "5px 10px",
                    borderRadius: "5px",
                    border: "none",
                    background: "#2563eb",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  Join Room
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={createRoom}
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            borderRadius: "5px",
            border: "none",
            background: "green",
            color: "white",
            cursor: "pointer",
          }}
        >
          Create Room
        </button>
      </div>
    </div>
  );

}