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


    const handleOneToOneChat = () => {
      navigate("/onetoone");
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
        {/* 🔹 One-to-One Chat Button */}
        <button
          onClick={handleOneToOneChat}
          style={{
            padding: "8px 15px",
            borderRadius: "8px",
            border: "none",
            background: "#f59e0b",
            color: "white",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          One-to-One Chat
        </button>

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