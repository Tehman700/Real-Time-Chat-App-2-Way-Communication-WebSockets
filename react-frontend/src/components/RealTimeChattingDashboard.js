import { useEffect, useState } from "react";

export default function RealTimeChattingDashboard() {
  const [group, setGroup] = useState("");
  const [ws, setWs] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showUsersDropdown, setShowUsersDropdown] = useState(false);

  // This is for the Name of group to display on top
  useEffect(() => {
    const storedGroup = sessionStorage.getItem("group");
    if (storedGroup) setGroup(storedGroup);
  }, []);

  // This is for the Username of current user logged in
  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) setUsername(storedUsername);
  }, []);

  // Fetch existing messages when component mounts or group changes
  useEffect(() => {
    if (!group) return;

    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`http://127.0.0.1:8000/api/save-message/?group_name=${group}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
         // data will be dict, we have to pick specific message
          const formattedMessages = data.map(msg => ({
            text: msg.body,
            sender: msg.author
          }));
          setMessages(formattedMessages);
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };

    fetchMessages();
  }, [group]);

  // WebSocket connection for real-time chatting
  useEffect(() => {
    if (!group) return;

    const token = localStorage.getItem("token"); // JWT token
    const socket = new WebSocket(`ws://127.0.0.1:8000/ws/chat/${group}/?token=${token}`);

    socket.onopen = () => console.log("Connected to room", group);
    socket.onclose = () => console.log("Disconnected from room", group);
    socket.onerror = (err) => console.error("WebSocket error:", err);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "chat") {
        setMessages((prev) => [...prev, { text: data.message, sender: data.sender }]);
      } else if (data.type === "users") {
        setOnlineUsers(data.users);
      }
    };
    setWs(socket);

    return () => socket.close();
  }, [group]);

  const sendMessage = () => {
    if (ws && message.trim() !== "") {
      ws.send(JSON.stringify({ message }));

      try {
        const token = localStorage.getItem("token");
        fetch("http://127.0.0.1:8000/api/save-message/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            group_name: group,
            body: message,
          }),
        });
      } catch (err) {
        console.error("Error sending message", err);
      }

      setMessage("");
    }
  };

  return (
    <div style={{ maxWidth: "700px", margin: "auto", padding: "20px" }}>
      {/* 🔹 Navbar */}
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 20px",
          backgroundColor: "#1e3a8a",
          color: "white",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <h2>Room: {group}</h2>

        <div style={{ position: "relative" }}>
          <div
            style={{
              cursor: "pointer",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: "#3b82f6",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: "18px",
              fontWeight: "bold",
            }}
            onClick={() => setShowUsersDropdown((prev) => !prev)}
          >
            👤
          </div>

          {showUsersDropdown && (
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
              <h4 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px", color: "#333" }}>
                Online Users
              </h4>
              {onlineUsers.length === 0 ? (
                <p style={{ fontSize: "13px", color: "#666" }}>No users online</p>
              ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {onlineUsers.map((user, idx) => (
                    <li key={idx} style={{ display: "flex", alignItems: "center", padding: "4px 0", fontSize: "14px" }}>
                      <span
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: "limegreen", // dot color
                          display: "inline-block",
                          marginRight: "8px",
                        }}
                      ></span>
                      <span style={{ color: user === username ? "#007bff" : "#555" }}>
                        {user === username ? "You" : user}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Chat Messages */}
      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: "8px",
          padding: "10px",
          height: "300px",
          overflowY: "auto",
          marginBottom: "10px",
          backgroundColor: "#f9f9f9",
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              textAlign: msg.sender === username ? "right" : "left",
              margin: "5px 0",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                fontWeight: "bold",
                color: msg.sender === username ? "#007bff" : "#333",
                marginBottom: "2px",
              }}
            >
              {msg.sender === username ? "You" : msg.sender}
            </div>
            <span
              style={{
                display: "inline-block",
                padding: "8px 12px",
                borderRadius: "16px",
                backgroundColor: msg.sender === username ? "#007bff" : "#e5e5ea",
                color: msg.sender === username ? "white" : "black",
              }}
            >
              {msg.text}
            </span>
          </div>
        ))}
      </div>

      {/* Input & Send */}
      <div style={{ display: "flex", gap: "10px" }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #ccc",
          }}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#007bff",
            color: "white",
            cursor: "pointer",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}