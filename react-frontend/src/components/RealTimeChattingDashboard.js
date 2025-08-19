import { useEffect, useState } from "react";

export default function RealTimeChattingDashboard() {
  const [group, setGroup] = useState("");
  const [ws, setWs] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState("");

  useEffect(() => {
    const storedGroup = sessionStorage.getItem("group");
    if (storedGroup) {
      setGroup(storedGroup);
    }
  }, []);




   useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);



  useEffect(() => {
    if (!group) return;

    const socket = new WebSocket(`ws://127.0.0.1:8000/ws/chat/${group}/`);

    socket.onopen = () => console.log("Connected to room", group);
    socket.onclose = () => console.log("Disconnected from room", group);
    socket.onerror = (err) => console.error("WebSocket error:", err);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.message) {
        setMessages((prev) => [...prev, { text: data.message, sender: "other" }]);
      }
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [group]);

  const sendMessage = () => {
    if (ws && message.trim() !== "") {
      ws.send(JSON.stringify({ message }));
      setMessages((prev) => [...prev, { text: message, sender: "me" }]);
      setMessage(""); // clear input
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "auto", padding: "20px" }}>
      <h2>Real-Time Chat Dashboard</h2>
      {group ? (
        <>
          <p>
            You're in room: <strong>{group}, {username}</strong>
          </p>

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
                  textAlign: msg.sender === "me" ? "right" : "left",
                  margin: "5px 0",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    padding: "8px 12px",
                    borderRadius: "16px",
                    backgroundColor: msg.sender === "me" ? "#007bff" : "#e5e5ea",
                    color: msg.sender === "me" ? "white" : "black",
                  }}
                >
                  {username, msg.text}
                </span>
              </div>
            ))}
          </div>

          {/* Input & Button */}
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }}
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
        </>
      ) : (
        <p>No room selected.</p>
      )}
    </div>
  );
}
