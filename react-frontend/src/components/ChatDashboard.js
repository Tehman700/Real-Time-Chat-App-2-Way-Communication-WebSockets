import { useAuth } from "../App";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";

export default function ChatDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [username, setUsername] = useState("");
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [friendStatuses, setFriendStatuses] = useState({});

  // Get logged-in username
  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  // Fetch all users from backend
  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get("http://127.0.0.1:8000/api/listusername/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setUsers(response.data.data || []);
      })
      .catch((error) => {
        console.error("Error fetching users:", error);
      });
  }, []);

    useEffect(() => {
      const savedStatuses = localStorage.getItem('friendStatuses');
      if (savedStatuses) {
        setFriendStatuses(JSON.parse(savedStatuses));
      }
    }, []);

    // Save friend statuses to localStorage whenever they change
    useEffect(() => {
      if (Object.keys(friendStatuses).length > 0) {
        localStorage.setItem('friendStatuses', JSON.stringify(friendStatuses));
      }
    }, [friendStatuses]);

  // Fetch friend statuses
    useEffect(() => {
      const savedNotifications = localStorage.getItem('notifications');
      if (savedNotifications) {
        setNotifications(JSON.parse(savedNotifications));
      }
    }, []);
        useEffect(() => {
      localStorage.setItem('notifications', JSON.stringify(notifications));
    }, [notifications]);

    // Add this useEffect to refresh data from server periodically
    useEffect(() => {
      if (username) {
        // Refresh friend statuses from server
        const token = localStorage.getItem("token");
        axios
          .get("http://127.0.0.1:8000/api/friend-status/", {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((response) => {
            setFriendStatuses(response.data || {});
          })
          .catch((error) => {
            console.error("Error syncing friend statuses:", error);
          });
      }
    }, [username]);

  useEffect(() => {
    if (users.length > 0) {
      const token = localStorage.getItem("token");
      axios
        .get("http://127.0.0.1:8000/api/friend-status/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((response) => {
          setFriendStatuses(response.data || {});
        })
        .catch((error) => {
          console.error("Error fetching friend statuses:", error);
        });
    }
  }, [users]);

  // WebSocket for notifications
  useEffect(() => {
    if (!username) return;

    const token = localStorage.getItem("token");
    const socket = new WebSocket(`ws://127.0.0.1:8000/ws/notifications/?token=${token}`);

    socket.onopen = () => {
      console.log("✅ WebSocket connected");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("📩 Notification received:", data);

      const notification = {
        ...data,
        id: data.request_id || Date.now(),
        timestamp: new Date().toISOString(),
      };

      setNotifications((prev) => [notification, ...prev]);

      // Update friend status when receiving friend request
      if (data.type === "friend_request" && data.from) {
        setFriendStatuses(prev => ({
          ...prev,
          [data.from]: "pending_received"
        }));
      }

      // Update friend status when receiving response
      if (data.type === "friend_response" && data.from) {
        setFriendStatuses(prev => ({
          ...prev,
          [data.from]: data.status === "accepted" ? "connected" : "none"
        }));
      }
    };


    socket.onerror = (error) => {
      alert("Websocket Error", error);
    };

    return () => socket.close();
  }, [username]);

  // Send friend request
  const handleConnect = (userId, friendUsername) => {
    const token = localStorage.getItem("token");
    axios
      .post(
        `http://127.0.0.1:8000/api/friend-request/${userId}/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then(() => {
        alert(`Friend request sent to ${friendUsername}!`);
        setFriendStatuses(prev => ({
          ...prev,
          [friendUsername]: "pending_sent"
        }));
      })
      .catch((err) => {
        console.error("Error sending request:", err);
        if (err.response?.status === 400) {
          alert("Friend request already sent or error occurred");
        } else {
          alert("Error sending friend request");
        }
      });
  };

  // Accept/Reject request
  const handleRespond = (reqId, action, fromUsername) => {
    const token = localStorage.getItem("token");
    axios
      .post(
        `http://127.0.0.1:8000/api/friend-request/respond/${reqId}/`,
        { action },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then(() => {
        alert(`Friend request ${action}ed`);
        setNotifications((prev) => prev.filter((n) => n.id !== reqId));
        setFriendStatuses(prev => ({
          ...prev,
          [fromUsername]: action === "accept" ? "connected" : "none"
        }));
      })
      .catch((err) => {
        console.error("Error responding:", err);
        alert("Error responding to friend request");
      });
  };

  // Get button text and style based on friendship status
  const getButtonConfig = (userUsername) => {
    const status = friendStatuses[userUsername] || "none";

    switch (status) {
      case "connected":
        return {
          text: "Connected",
          disabled: true,
          style: {
            backgroundColor: "#28a745",
            color: "white",
            cursor: "not-allowed"
          }
        };
      case "pending_sent":
        return {
          text: "Request Sent",
          disabled: true,
          style: {
            backgroundColor: "#ffc107",
            color: "#212529",
            cursor: "not-allowed"
          }
        };
      case "pending_received":
        return {
          text: "Respond to Request",
          disabled: true,
          style: {
            backgroundColor: "#17a2b8",
            color: "white",
            cursor: "not-allowed"
          }
        };
      default:
        return {
          text: "Connect",
          disabled: false,
          style: {
            backgroundColor: "#007bff",
            color: "white",
            cursor: "pointer"
          }
        };
    }
  };

  const handleLogout = () => {
    logout();
    localStorage.removeItem("username");
    localStorage.removeItem("token");
    navigate("/login");
  };
  const JoinRoom = async () => {
    navigate("/rooms-dashboard")
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
          boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ margin: 0, color: "#333" }}>
          Welcome, {username || "User"}
        </h2>

        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          {/* Notifications Bell Icon */}
          <div
            style={{ position: "relative", cursor: "pointer", fontSize: "20px" }}
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUsers(false); // Close users dropdown
            }}
          >
            🔔
            {notifications.length > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-5px",
                  right: "-8px",
                  background: "red",
                  color: "white",
                  fontSize: "12px",
                  borderRadius: "50%",
                  padding: "2px 6px",
                }}
              >
                {notifications.length}
              </span>
            )}

            {showNotifications && (
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
                  minWidth: "250px",
                  zIndex: 10,
                  maxHeight: "250px",
                  overflowY: "auto",
                }}
              >
                <p style={{ margin: "0 0 10px", fontWeight: "bold" }}>
                  Notifications
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {notifications.length === 0 && (
                    <li style={{ color: "#777" }}>No new notifications</li>
                  )}
                  {notifications.map((n) => (
                    <li
                      key={n.id}
                      style={{
                        marginBottom: "8px",
                        borderBottom: "1px solid #eee",
                        paddingBottom: "6px",
                      }}
                    >
                      <p style={{ margin: "4px 0", fontSize: "14px" }}>
                        {n.message}
                      </p>

                      {n.from && (
                        <p style={{ margin: "2px 0", fontSize: "12px", color: "#666" }}>
                          From: {n.from}
                        </p>
                      )}

                      {n.type === "friend_request" && (
                        <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                          <button
                            onClick={() => handleRespond(n.id, "accept", n.from)}
                            style={{
                              padding: "4px 8px",
                              backgroundColor: "#28a745",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "12px",
                            }}
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRespond(n.id, "reject", n.from)}
                            style={{
                              padding: "4px 8px",
                              backgroundColor: "#dc3545",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "12px",
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      )}

                      {n.type === "friend_response" && (
                        <div style={{
                          padding: "4px 8px",
                          backgroundColor: n.status === "accepted" ? "#d4edda" : "#f8d7da",
                          borderRadius: "4px",
                          marginTop: "4px",
                          fontSize: "12px",
                        }}>
                          Status: {n.status}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Users Button */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => {
                setShowUsers(!showUsers);
                setShowNotifications(false); // Close notifications dropdown
              }}
              style={{
                padding: "8px 16px",
                backgroundColor: "#17a2b8",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              👥 Users
            </button>

            {showUsers && (
              <div
                style={{
                  position: "absolute",
                  top: "40px",
                  right: 0,
                  background: "#fff",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                  padding: "10px",
                  minWidth: "300px",
                  zIndex: 10,
                  maxHeight: "400px",
                  overflowY: "auto",
                }}
              >
                <p style={{ margin: "0 0 10px", fontWeight: "bold" }}>
                  All Users
                </p>
                {users.length === 0 ? (
                  <p style={{ color: "#666", fontStyle: "italic" }}>Loading users...</p>
                ) : (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {users
                    .filter((user) => {
                        const userUsername = typeof user === 'string' ? user : user.username;
                        const adminUsernames = ['admin', 'administrator', 'root', 'superuser']; // Add more admin usernames as needed
                        return userUsername !== username && !adminUsernames.includes(userUsername.toLowerCase());
                      })
                      .map((user, index) => {
                        const userUsername = typeof user === 'string' ? user : user.username;
                        const userId = typeof user === 'string' ? null : user.id;
                        const buttonConfig = getButtonConfig(userUsername);

                        return (
                          <li
                            key={index}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "8px",
                              borderBottom: "1px solid #eee",
                              marginBottom: "5px",
                            }}
                          >
                            <div>
                              <span style={{ fontWeight: "500", fontSize: "14px" }}>
                                {userUsername}
                              </span>
                              {friendStatuses[userUsername] === "connected" && (
                                <span style={{
                                  marginLeft: "8px",
                                  fontSize: "10px",
                                  color: "#28a745",
                                  fontWeight: "bold"
                                }}>
                                  ✓ Friends
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => !buttonConfig.disabled && handleConnect(userId || userUsername, userUsername)}
                              disabled={buttonConfig.disabled || (!userId && typeof user === 'string')}
                              style={{
                                padding: "4px 8px",
                                border: "none",
                                borderRadius: "4px",
                                fontSize: "12px",
                                ...buttonConfig.style
                              }}
                            >
                              {buttonConfig.text}
                            </button>
                          </li>
                        );
                      })}
                  </ul>
                )}
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
              cursor: "pointer",
            }}
          >
            Logout
          </button>

          <button onClick={JoinRoom}
           style={{
              padding: "8px 16px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}>Join Room</button>

        </div>
      </div>

    {/* Content */}
         <div style={{ textAlign: "center", marginTop: "50px" }}>
           <h1 style={{ color: "#333" }}>Welcome to your Chat Dashboard!</h1>
         </div>
       </div>
     );
    }