import { useState} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

function PasswordResetting() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const email = sessionStorage.getItem("PasswordResetEmail"); // retrieve saved email
    const navigate = useNavigate();


  const handleSubmit = async (e) => {
      e.preventDefault();
      if (password !== confirmPassword) {
          alert("Passwords do not match!");
          return;
      }
      console.log("New Password:", password);
      console.log("Email is: ", email);

      const altering = await axios.post("http://localhost:8000/api/changepwd/", {
          email: email,
          password : password
      });

      if(altering.data.status === 1){
          alert("Password Changed Successfully")
          navigate("/login")
      }

  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #ff7eb3 0%, #ff758c 100%)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        width: '100%',
        maxWidth: '420px',
        transition: 'transform 0.3s ease',
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0px)'}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            backgroundColor: '#ff758c',
            borderRadius: '50%',
            margin: '0 auto 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 25px rgba(255, 117, 140, 0.3)'
          }}>
            <div style={{
              color: 'white',
              fontSize: '32px',
              fontWeight: 'bold'
            }}>
              🔒
            </div>
          </div>
          <h2 style={{
            margin: '0 0 10px 0',
            color: '#333',
            fontSize: '28px',
            fontWeight: '600',
            letterSpacing: '-0.5px'
          }}>Reset Your Password</h2>
          <p style={{
            margin: '0',
            color: '#888',
            fontSize: '13px'
          }}>Enter your new password below</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <input
              type="password"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '15px',
                border: '2px solid #e1e5e9',
                borderRadius: '12px',
                fontSize: '16px',
                outline: 'none',
                backgroundColor: '#f8f9fa',
                transition: '0.3s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#ff758c';
                e.target.style.backgroundColor = '#fff';
                e.target.style.boxShadow = '0 0 0 3px rgba(255, 117, 140, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e1e5e9';
                e.target.style.backgroundColor = '#f8f9fa';
                e.target.style.boxShadow = 'none';
              }}
              required
            />
          </div>
          <div style={{ marginBottom: '30px' }}>
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '15px',
                border: '2px solid #e1e5e9',
                borderRadius: '12px',
                fontSize: '16px',
                outline: 'none',
                backgroundColor: '#f8f9fa',
                transition: '0.3s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#ff758c';
                e.target.style.backgroundColor = '#fff';
                e.target.style.boxShadow = '0 0 0 3px rgba(255, 117, 140, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e1e5e9';
                e.target.style.backgroundColor = '#f8f9fa';
                e.target.style.boxShadow = 'none';
              }}
              required
            />
          </div>
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '15px',
              backgroundColor: '#ff758c',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(255, 117, 140, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#e94b6b';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 25px rgba(233, 75, 107, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#ff758c';
              e.target.style.transform = 'translateY(0px)';
              e.target.style.boxShadow = '0 4px 15px rgba(255, 117, 140, 0.3)';
            }}
          >
            Save New Password
          </button>
        </form>
      </div>
    </div>
  );
}

export default PasswordResetting;
