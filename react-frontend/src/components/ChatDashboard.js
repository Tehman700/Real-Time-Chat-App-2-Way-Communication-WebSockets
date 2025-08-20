import { useAuth } from "../App";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
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
  const [email, setEmail] = useState("");


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

  // Get logged-in username
  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
      // Load user profile from localStorage or set defaults
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

  useEffect(() => {
    const fetchEmail = async () => {
      try {
        const token = localStorage.getItem("token"); // JWT from login
        const response = await axios.get("http://127.0.0.1:8000/api/email_fetcher/", {
          headers: {
            Authorization: `Bearer ${token}`, // send JWT for authentication
          },
        });

        setEmail(response.data.data.email);
      } catch (error) {
        console.error("Error fetching email:", error);
      }
    };

    fetchEmail();
  }, []); // runs once when component mounts



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

  // Profile picture handling
  const handleProfilePicClick = () => {
    fileInputRef.current.click();
  };

  const handleProfilePicChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
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
    logout();
    localStorage.removeItem("username");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const JoinRoom = async () => {
    navigate("/rooms-dashboard")
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