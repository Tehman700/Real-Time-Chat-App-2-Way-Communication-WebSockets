import { useEffect, useState } from "react";

export default function Fucking() {
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token"); // JWT token saved at login
    if (!token) {
      console.error("No JWT token found. Please login first.");
      return;
    }

    // Pass token in query params
    const ws = new WebSocket(`ws://localhost:8000/ws/online-users/?token=${token}`);

    ws.onopen = () => console.log("Connected to websocket");
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setOnlineUsers(data.online_users);
    };
    ws.onclose = () => console.log("Disconnected");

    return () => ws.close();
  }, []);

  return (
    <div>
      <h2>Online Users:</h2>
      <ul>
        {onlineUsers.map(user => <li key={user}>{user}</li>)}
      </ul>
    </div>
  );
}
