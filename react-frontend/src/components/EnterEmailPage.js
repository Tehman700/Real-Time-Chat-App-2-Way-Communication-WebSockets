import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";


export default function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");


  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const otpsending = await axios.post(
          "http://localhost:8000/api/forgotpwdemail/",
          {email}
      );

      if (otpsending.data.status === 0) {
        alert("User is not Registered with this Email")
        navigate("/login")
      } else if (otpsending.data.status === 1) {
        alert("OTP Sent for Password Reset")
        sessionStorage.setItem("PasswordResetInProgress", "true");
        navigate("/verificationpwd", {
          state: {email},
        });
      }else if (otpsending.data.status === -2) {
          alert("OTP sending failed in backend");
          navigate("/login")
        }
    }catch (err) {
        console.error(err);
        alert("An error occurred while sending OTP");
        navigate("/login")
      }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <button type="submit">Register</button>
    </form>
  );
}
