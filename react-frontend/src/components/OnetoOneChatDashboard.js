import { useEffect, useState } from "react";

export default function OnetoOneChatDashboard() {
  const [ws, setWs] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState("");
  const [chatWith, setChatWith] = useState(""); // The user you are chatting with

  // Get username from localStorage
  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) setUsername(storedUsername);
  }, []);

  // Get the username to chat with
  useEffect(() => {
    const otherUser = sessionStorage.getItem("chatWith"); // set this before entering chat
    if (otherUser) setChatWith(otherUser);
  }, []);

  // WebSocket connection
  useEffect(() => {
    if (!username || !chatWith) return;

    const token = localStorage.getItem("token");
    const socket = new WebSocket(`ws://127.0.0.1:8000/ws/onetoonechatting/?token=${token}&to=${chatWith}`);

    socket.onopen = () => console.log("Connected to chat with", chatWith);
    socket.onclose = () => console.log("Disconnected from chat with", chatWith);
    socket.onerror = (err) => console.error("WebSocket error:", err);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [...prev, { text: data.message, sender: data.sender }]);
    };

    setWs(socket);
    return () => socket.close();
  }, [username, chatWith]);

  const sendMessage = () => {
    if (ws && message.trim() !== "") {
      ws.send(JSON.stringify({ message })); // just send the message, server knows sender & recipient
      setMessages((prev) => [...prev, { text: message, sender: username }]);
      setMessage("");
    }
  };

  return (
    <div style={{ maxWidth: "700px", margin: "auto", padding: "20px" }}>
      {/* Navbar */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px", backgroundColor: "#1e3a8a", color: "white", borderRadius: "8px", marginBottom: "20px" }}>
        <h2>Chat with: {chatWith}</h2>
      </nav>

      {/* Chat Messages */}
      <div style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "10px", height: "300px", overflowY: "auto", marginBottom: "10px", backgroundColor: "#f9f9f9" }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ textAlign: msg.sender === username ? "right" : "left", margin: "5px 0" }}>
            <div style={{ fontSize: "12px", fontWeight: "bold", color: msg.sender === username ? "#007bff" : "#333", marginBottom: "2px" }}>
              {msg.sender === username ? "You" : msg.sender}
            </div>
            <span style={{ display: "inline-block", padding: "8px 12px", borderRadius: "16px", backgroundColor: msg.sender === username ? "#007bff" : "#e5e5ea", color: msg.sender === username ? "white" : "black" }}>
              {msg.text}
            </span>
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: "10px" }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage} style={{ padding: "10px 20px", borderRadius: "8px", border: "none", backgroundColor: "#007bff", color: "white", cursor: "pointer" }}>
          Send
        </button>
      </div>
    </div>
  );
}
