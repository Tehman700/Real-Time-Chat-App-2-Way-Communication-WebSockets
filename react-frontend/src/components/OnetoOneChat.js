import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

function OnetoOneChat() {
    const [connectedFriends, setConnectedFriends] = useState([]);
    const [friendStatuses, setFriendStatuses] = useState({});
    const [onlineStatus, setOnlineStatus] = useState({});
    const navigate = useNavigate();
    const socketRef = useRef(null);



    const safeSend = (data) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify(data));
        } else {
            console.warn("⚠️ Tried to send but socket not ready:", data);
        }
    };

    // Load saved statuses once
    useEffect(() => {
        const savedStatuses = localStorage.getItem("friendStatuses");
        if (savedStatuses) {
            const statuses = JSON.parse(savedStatuses);
            setFriendStatuses(statuses);

            const connected = Object.entries(statuses)
                .filter(([username, status]) => status === "connected")
                .map(([username]) => username);

            setConnectedFriends(connected);
        }
    }, []);

    // WebSocket setup
    useEffect(() => {
        const token = localStorage.getItem("token");
        const username = localStorage.getItem("username");

        if (!token || !username) return;

        const ws = new WebSocket(
            `ws://127.0.0.1:8000/ws/online-status/?token=${token}`
        );
        socketRef.current = ws;

        ws.onopen = () => {
            console.log("✅ Online Status WebSocket connected");
            safeSend({
                type: "user_online",
                username: username,
            });
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log("📡 Online status update:", data);

            if (data.type === "status_update") {
                setOnlineStatus((prev) => ({
                    ...prev,
                    [data.username]: data.status,
                }));
            } else if (data.type === "bulk_status") {
                setOnlineStatus(data.users || {}); // server sends { users: {...} }
            }
        };

        ws.onerror = (error) => {
            console.error("❌ Online Status WebSocket error:", error);
        };

        ws.onclose = () => {
            console.log("🔌 Online Status WebSocket disconnected");
        };

        // Cleanup
        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                safeSend({
                    type: "user_offline",
                    username: username,
                });
            }
            ws.close();
        };
    }, []);

    const getOnlineStatus = (username) =>
        onlineStatus[username] === "online";

    return (
        <div>
            <h1>One to One Chat</h1>

            <div style={{ marginTop: "20px" }}>
                <h3>Your Connected Friends ({connectedFriends.length}):</h3>

                {connectedFriends.length > 0 ? (
                    <ul style={{ listStyle: "none", padding: 0 }}>
                        {connectedFriends.map((friend, index) => {
                            const isOnline = getOnlineStatus(friend);
                            return (
                                <li
                                    key={index}
                                    style={{
                                        padding: "15px",
                                        margin: "8px 0",
                                        backgroundColor: "#f8f9fa",
                                        borderRadius: "8px",
                                        cursor: "pointer",
                                        border: "1px solid #e9ecef",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: "12px",
                                                height: "12px",
                                                borderRadius: "50%",
                                                backgroundColor: isOnline
                                                    ? "#28a745"
                                                    : "#dc3545",
                                                marginRight: "12px",
                                                border: "2px solid white",
                                                boxShadow: "0 0 0 1px #ccc",
                                            }}
                                            title={isOnline ? "Online" : "Offline"}
                                        ></div>

                                        <div>
                                            <strong style={{ fontSize: "16px" }}>
                                                {friend}
                                            </strong>
                                    <div
                                        style={{
                                            fontSize: "12px",
                                            color: isOnline ? "#28a745" : "#6c757d",
                                            fontWeight: "500",
                                        }}
                                    >
                                        {isOnline ? "🟢 Online" : "🔴 Offline"}
                                    </div>
                                    </div>
                                    </div>

                                    <button
                                        style={{
                                            padding: "8px 16px",
                                            backgroundColor: "#007bff",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "5px",
                                            cursor: "pointer",
                                            fontWeight: "500",
                                        }}
                                        onClick={() => {
                                            sessionStorage.setItem("chatWith", friend);
                                            navigate("/oneonechatting")
                                        }}
                                    >
                                        Chat Now
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p>No connected friends found. Add some friends first!</p>
                )}
            </div>

            <div
                style={{
                    marginTop: "20px",
                    padding: "15px",
                    backgroundColor: "#e8f5e8",
                    borderRadius: "8px",
                    border: "1px solid #c3e6cb",
                }}
            >
                <h4 style={{ margin: "0 0 10px 0", color: "#155724" }}>
                    Live Status Summary
                </h4>
                <div style={{ display: "flex", gap: "20px" }}>
                    <span
                        style={{ color: "#28a745", fontWeight: "bold" }}
                    >
                        🟢 Online:{" "}
                        {connectedFriends.filter((f) => getOnlineStatus(f)).length}
                    </span>
                    <span
                        style={{ color: "#dc3545", fontWeight: "bold" }}
                    >
                        🔴 Offline:{" "}
                        {connectedFriends.filter((f) => !getOnlineStatus(f)).length}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default OnetoOneChat;
