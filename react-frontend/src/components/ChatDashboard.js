import { useAuth } from "../App";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import axios from "axios";

export default function ChatDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);
  const [username, setUsername] = useState("");
  const [users, setUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [friendStatuses, setFriendStatuses] = useState({});
  const [email, setEmail] = useState("");

  // WebSocket refs
  const onlineUsersWs = useRef(null);
  const notificationsWs = useRef(null);

  // Profile state
  const [userProfile, setUserProfile] = useState({
    username: "",
    email: "",
    description: "",
    profilePic: null
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempProfile, setTempProfile] = useState({});
  const fileInputRef = useRef(null);

  // Initialize WebSocket connections
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Online Users WebSocket
    onlineUsersWs.current = new WebSocket(`ws://127.0.0.1:8000/ws/online-users/?token=${token}`);

    onlineUsersWs.current.onopen = () => {
      console.log("✅ Online Users WebSocket connected");
    };

    onlineUsersWs.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("📡 Online users update:", data);

      if (data.data) {
        setOnlineUsers(data.data);
      }
    };

    onlineUsersWs.current.onclose = () => {
      console.log("❌ Online Users WebSocket disconnected");
    };

    onlineUsersWs.current.onerror = (error) => {
      console.error("❌ Online Users WebSocket error:", error);
    };

    // Notifications WebSocket
    notificationsWs.current = new WebSocket(`ws://127.0.0.1:8000/ws/notifications/?token=${token}`);

    notificationsWs.current.onopen = () => {
      console.log("✅ Notifications WebSocket connected");
    };

    notificationsWs.current.onmessage = (event) => {
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

    notificationsWs.current.onerror = (error) => {
      console.error("❌ Notifications WebSocket error:", error);
    };

    // Cleanup WebSockets on component unmount
    return () => {
      if (onlineUsersWs.current && onlineUsersWs.current.readyState === WebSocket.OPEN) {
        onlineUsersWs.current.close();
      }
      if (notificationsWs.current && notificationsWs.current.readyState === WebSocket.OPEN) {
        notificationsWs.current.close();
      }
    };
  }, []);

  // Get logged-in username
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
          email: "",
          description: "No description added yet.",
          profilePic: null
        });
      }
    }
  }, []);

  // Save profile to localStorage whenever it changes
  useEffect(() => {
    if (username && userProfile.username) {
      localStorage.setItem(`userProfile_${username}`, JSON.stringify(userProfile));
    }
  }, [userProfile, username]);

  // Fetch email
  useEffect(() => {
    const fetchEmail = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://127.0.0.1:8000/api/email_fetcher/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setEmail(response.data.data.email);
      } catch (error) {
        console.error("Error fetching email:", error);
      }
    };

    fetchEmail();
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

  // Load and save friend statuses
  useEffect(() => {
    const savedStatuses = localStorage.getItem('friendStatuses');
    if (savedStatuses) {
      setFriendStatuses(JSON.parse(savedStatuses));
    }
  }, []);

  useEffect(() => {
    if (Object.keys(friendStatuses).length > 0) {
      localStorage.setItem('friendStatuses', JSON.stringify(friendStatuses));
    }
  }, [friendStatuses]);

  // Load and save notifications
  useEffect(() => {
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Sync friend statuses with server
  useEffect(() => {
    if (username) {
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

  // Profile picture handling
  const handleProfilePicClick = () => {
    fileInputRef.current.click();
  };

  const handleProfilePicChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size should be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        if (isEditingProfile) {
          setTempProfile(prev => ({
            ...prev,
            profilePic: e.target.result
          }));
        } else {
          setUserProfile(prev => ({
            ...prev,
            profilePic: e.target.result
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Profile editing functions
  const handleEditProfile = () => {
    setTempProfile({ ...userProfile });
    setIsEditingProfile(true);
  };

  const handleSaveProfile = () => {
    setUserProfile(tempProfile);
    setIsEditingProfile(false);
    alert("Profile updated successfully!");
  };

  const handleCancelEdit = () => {
    setTempProfile({});
    setIsEditingProfile(false);
  };

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
    // Close WebSocket connections before logout
    if (onlineUsersWs.current && onlineUsersWs.current.readyState === WebSocket.OPEN) {
      onlineUsersWs.current.close();
    }
    if (notificationsWs.current && notificationsWs.current.readyState === WebSocket.OPEN) {
      notificationsWs.current.close();
    }

    logout();
    localStorage.removeItem("username");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const JoinRoom = () => {
    navigate("/rooms-dashboard");
  };

  const toggleDropdown = (dropdown) => {
    switch (dropdown) {
      case 'notifications':
        setShowNotifications(!showNotifications);
        setShowUsers(false);
        setShowOnlineUsers(false);
        break;
      case 'users':
        setShowUsers(!showUsers);
        setShowNotifications(false);
        setShowOnlineUsers(false);
        break;
      case 'onlineUsers':
        setShowOnlineUsers(!showOnlineUsers);
        setShowUsers(false);
        setShowNotifications(false);
        break;
      default:
        break;
    }
  };

  const currentProfile = isEditingProfile ? tempProfile : userProfile;

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      {/* Hidden file input for profile picture */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleProfilePicChange}
        accept="image/*"
        style={{ display: "none" }}
      />

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
          {/* Online Users Button */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => toggleDropdown('onlineUsers')}
              style={{
                padding: "8px 16px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "5px"
              }}
            >
              🟢 Online ({onlineUsers.length})
            </button>

            {showOnlineUsers && (
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
                  🟢 Online Users ({onlineUsers.length})
                </p>
                {onlineUsers.length === 0 ? (
                  <div style={{
                    textAlign: "center",
                    padding: "20px",
                    color: "#666",
                    fontStyle: "italic"
                  }}>
                    No users currently online
                  </div>
                ) : (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {onlineUsers.map((user, index) => (
                      <li
                        key={index}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "10px",
                          borderBottom: "1px solid #eee",
                          marginBottom: "5px",
                          backgroundColor: user === username ? "#e7f3ff" : "#f9f9f9",
                          borderRadius: "4px"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div
                            style={{
                              width: "8px",
                              height: "8px",
                              backgroundColor: "#28a745",
                              borderRadius: "50%",
                              animation: "pulse 2s infinite"
                            }}
                          />
                          <span style={{ fontWeight: "500", fontSize: "14px" }}>
                            {user} {user === username && "(You)"}
                          </span>
                        </div>
                        {user !== username && (
                          <button
                            onClick={() => {
                              // Add chat functionality here
                              alert(`Starting chat with ${user}`);
                            }}
                            style={{
                              padding: "4px 8px",
                              backgroundColor: "#007bff",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              fontSize: "12px",
                              cursor: "pointer"
                            }}
                          >
                            💬 Chat
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Notifications Bell Icon */}
          <div
            style={{ position: "relative", cursor: "pointer", fontSize: "20px" }}
            onClick={() => toggleDropdown('notifications')}
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

          {/* All Users Button */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => toggleDropdown('users')}
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
              All Users ({users.length})
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
                        const adminUsernames = ['admin', 'administrator', 'root', 'superuser'];
                        return userUsername !== username && !adminUsernames.includes(userUsername.toLowerCase());
                      })
                      .map((user, index) => {
                        const userUsername = typeof user === 'string' ? user : user.username;
                        const userId = typeof user === 'string' ? null : user.id;
                        const buttonConfig = getButtonConfig(userUsername);
                        const isOnline = onlineUsers.includes(userUsername);

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
                              backgroundColor: isOnline ? "#f0fff4" : "#fff"
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              {isOnline && (
                                <div
                                  style={{
                                    width: "8px",
                                    height: "8px",
                                    backgroundColor: "#28a745",
                                    borderRadius: "50%"
                                  }}
                                />
                              )}
                              <span style={{ fontWeight: "500", fontSize: "14px" }}>
                                {userUsername}
                                {isOnline && (
                                  <span style={{
                                    marginLeft: "5px",
                                    fontSize: "10px",
                                    color: "#28a745",
                                    fontWeight: "bold"
                                  }}>
                                    • Online
                                  </span>
                                )}
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

          {/* Join Room Button */}
          <button
            onClick={JoinRoom}
            style={{
              padding: "8px 16px",
              backgroundColor: "#6f42c1",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px"
            }}
          >
            Join Room
          </button>

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
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "20px",
        marginBottom: "30px"
      }}>
        <div style={{
          backgroundColor: "#fff",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
          textAlign: "center"
        }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#17a2b8" }}>Total Users</h3>
          <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>{users.length}</p>
        </div>

        <div style={{
          backgroundColor: "#fff",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
          textAlign: "center"
        }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#28a745" }}>Online Now</h3>
          <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>{onlineUsers.length}</p>
        </div>

        <div style={{
          backgroundColor: "#fff",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
          textAlign: "center"
        }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#ffc107" }}>Notifications</h3>
          <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>{notifications.length}</p>
        </div>

        <div style={{
          backgroundColor: "#fff",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
          textAlign: "center"
        }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#007bff" }}>Friends</h3>
          <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>
            {Object.values(friendStatuses).filter(status => status === 'connected').length}
          </p>
        </div>
      </div>

      {/* User Profile Card */}
      <div style={{
        backgroundColor: "#fff",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        padding: "25px",
        marginBottom: "30px",
        maxWidth: "600px",
        margin: "0 auto 30px auto"
      }}>
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "20px",
          flexWrap: "wrap"
        }}>
          {/* Profile Picture */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            minWidth: "120px"
          }}>
            <div
              onClick={isEditingProfile ? handleProfilePicClick : undefined}
              style={{
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                backgroundColor: "#f0f0f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: isEditingProfile ? "pointer" : "default",
                overflow: "hidden",
                border: "3px solid #007bff",
                transition: "transform 0.2s ease",
                ...(isEditingProfile && {
                  ":hover": { transform: "scale(1.05)" }
                })
              }}
            >
              {currentProfile.profilePic ? (
                <img
                  src={currentProfile.profilePic}
                  alt="Profile"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover"
                  }}
                />
              ) : (
                <div style={{
                  fontSize: "40px",
                  color: "#007bff"
                }}>
                  👤
                </div>
              )}
            </div>
            {isEditingProfile && (
              <p style={{
                fontSize: "12px",
                color: "#666",
                textAlign: "center",
                marginTop: "8px",
                maxWidth: "120px"
              }}>
                Click to change profile picture
              </p>
            )}
          </div>

{/* Profile Info */}
<div style={{ flex: 1, minWidth: "300px" }}>
  {/* Username (read-only) */}
  <div style={{ marginBottom: "15px" }}>
    <label style={{
      display: "block",
      fontSize: "14px",
      fontWeight: "bold",
      color: "#333",
      marginBottom: "5px"
    }}>
      Username
    </label>
    <input
      type="text"
      value={currentProfile.username || "GuestUser"}
      disabled
      style={{
        width: "100%",
        padding: "8px 12px",
        border: "2px solid #e0e0e0",
        borderRadius: "6px",
        fontSize: "16px",
        backgroundColor: "#f1f1f1",
        color: "#555",
      }}
    />
  </div>

  {/* Email (read-only) */}
  <div style={{ marginBottom: "15px" }}>
    <label style={{
      display: "block",
      fontSize: "14px",
      fontWeight: "bold",
      color: "#333",
      marginBottom: "5px"
    }}>
      Email Address
    </label>
    <input
      type="email"
      value={email || "user@example.com"}
      disabled
      style={{
        width: "100%",
        padding: "8px 12px",
        border: "2px solid #e0e0e0",
        borderRadius: "6px",
        fontSize: "16px",
        backgroundColor: "#f1f1f1",
        color: "#555",
      }}
    />
  </div>

  {/* Editable Description */}
  <div style={{ marginBottom: "20px" }}>
    <label style={{
      display: "block",
      fontSize: "14px",
      fontWeight: "bold",
      color: "#333",
      marginBottom: "5px"
    }}>
      Description
    </label>
    <textarea
      value={isEditingProfile ? tempProfile.description : currentProfile.description || ""}
      onChange={(e) =>
        isEditingProfile &&
        setTempProfile((prev) => ({
          ...prev,
          description: e.target.value,
        }))
      }
      disabled={!isEditingProfile}
      placeholder="Tell us about yourself..."
      rows={3}
      style={{
        width: "100%",
        padding: "8px 12px",
        border: isEditingProfile ? "2px solid #007bff" : "2px solid #e0e0e0",
        borderRadius: "6px",
        fontSize: "16px",
        backgroundColor: isEditingProfile ? "#fff" : "#f9f9f9",
        color: "#333",
        resize: "vertical",
        fontFamily: "Arial, sans-serif",
      }}
    />
  </div>

  {/* Action Buttons */}
  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
    {!isEditingProfile ? (
      <button
        onClick={handleEditProfile}
        style={{
          padding: "10px 20px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "500",
        }}
      >
        ✏️ Edit Profile
      </button>
    ) : (
      <>
        <button
          onClick={handleSaveProfile}
          style={{
            padding: "10px 20px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          ✅ Save Changes
        </button>
        <button
          onClick={handleCancelEdit}
          style={{
            padding: "10px 20px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          ❌ Cancel
        </button>
      </>
    )}
  </div>
</div>

        </div>
      </div>

      {/* Welcome Content */}
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <h1 style={{ color: "#333" }}>Welcome to your Chat Dashboard!</h1>
      </div>
    </div>
  );
}