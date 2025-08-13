import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

export default function OTPPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState("");

  const { email, username, password, mobile_number } = location.state || {};
  useEffect(() => {
    const regFlag = sessionStorage.getItem("registrationInProgress");
    if (regFlag !== "true") {
      navigate("/register");
    }
  }, [navigate]);
  const handleVerify = async (e) => {
    e.preventDefault();

    if (!otp) {
      alert("Please enter the OTP");
      return;
    }

    try {
      // First verify OTP
      const otpResponse = await axios.post("http://localhost:8000/api/otpVerifyMech/", {
        code: otp,
      });

      if (otpResponse.data.status === 0) {
        // If OTP correct, register the user
        const registerResponse = await axios.post("http://localhost:8000/api/register/", {
          username,
          password,
          email,
          mobile_number,
        });

        if (registerResponse.data.code === 0) {
          alert("✅ Registration successful! You can now log in.");
          sessionStorage.removeItem("registrationInProgress");

          navigate("/login");
        } else {
          const errors = registerResponse.data.errors || {};
          const messages = Object.entries(errors)
            .map(([field, msg]) => `${field}: ${msg}`)
            .join(", ");
          alert(`❌ Registration failed: ${messages || registerResponse.data.message || "Unknown error"}`);
          sessionStorage.removeItem("registrationInProgress");

        }
      } else {
        alert("Incorrect OTP. Please Register again. Only one time its verified");
        sessionStorage.removeItem("registrationInProgress");

        navigate("/register")
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during verification/registration");
      sessionStorage.removeItem("registrationInProgress");

    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
            backgroundColor: '#667eea',
            borderRadius: '50%',
            margin: '0 auto 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 25px rgba(102, 126, 234, 0.3)'
          }}>
            <div style={{
              color: 'white',
              fontSize: '32px',
              fontWeight: 'bold'
            }}>
              🔐
            </div>
          </div>
          <h2 style={{
            margin: '0 0 10px 0',
            color: '#333',
            fontSize: '28px',
            fontWeight: '600',
            letterSpacing: '-0.5px'
          }}>Verify Your Email</h2>

          <div style={{
            backgroundColor: '#f8f9ff',
            padding: '15px',
            borderRadius: '12px',
            border: '2px solid #e6e9ff',
            marginBottom: '10px'
          }}>
            <p style={{
              margin: '0',
              color: '#666',
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              We've sent a verification code to:
            </p>
            <p style={{
              margin: '5px 0 0 0',
              color: '#667eea',
              fontSize: '16px',
              fontWeight: '600',
              wordBreak: 'break-all'
            }}>
              {email || 'your email'}
            </p>
          </div>

          <p style={{
            margin: '0',
            color: '#888',
            fontSize: '13px'
          }}>Enter the 6-digit code to complete registration</p>
        </div>

        {/* Form */}
        <form onSubmit={handleVerify}>
          <div style={{ marginBottom: '30px' }}>
            <input
              type="text"
              placeholder="Enter OTP Code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength="6"
              style={{
                width: '100%',
                padding: '20px',
                border: '2px solid #e1e5e9',
                borderRadius: '12px',
                fontSize: '24px',
                textAlign: 'center',
                letterSpacing: '4px',
                outline: 'none',
                transition: 'all 0.3s ease',
                backgroundColor: '#f8f9fa',
                boxSizing: 'border-box',
                fontWeight: '600'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.backgroundColor = '#fff';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e1e5e9';
                e.target.style.backgroundColor = '#f8f9fa';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '15px',
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
              marginBottom: '20px'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#5a67d8';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#667eea';
              e.target.style.transform = 'translateY(0px)';
              e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
            }}
          >
            Verify & Complete Registration
          </button>
        </form>

        {/* Footer Info */}
        <div style={{
          textAlign: 'center',
          padding: '15px',
          backgroundColor: '#f8f9ff',
          borderRadius: '12px',
          border: '1px solid #e6e9ff'
        }}>
          <p style={{
            margin: '0',
            color: '#666',
            fontSize: '13px',
            lineHeight: '1.4'
          }}>
            💡 <strong>Note</strong> This OTP Expires in 1 minute<br/>
          </p>
        </div>
      </div>
    </div>
  );
}