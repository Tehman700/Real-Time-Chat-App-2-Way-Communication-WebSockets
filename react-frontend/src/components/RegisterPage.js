import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mobile_number, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();


    // First check either email exists or not
      if (username && password && email && mobile_number){
          const already = await axios.post("http://localhost:8000/api/alreadyexists/",
              {
                  username,
                  email,
                  mobile_number
              }
          );

          if (already.data.status === -1){
              alert("Username already exists")
              navigate("/register")
          }
          else if (already.data.status === -2){
              alert("Email already exists")
              navigate("/register")
          }

          else if(already.data.status === -3){
              alert("Mobile Number already Exists")
              navigate("/register")
          }
          else if(already.data.status === -4){
                    try {
        // Send OTP first
        const responsiveness = await axios.post(
          "http://localhost:8000/api/otpMech/",
          { email }
        );

        if (responsiveness.data.status === 1) {
          // Go to OTP verification page with user details
            sessionStorage.setItem("registrationInProgress", "true");
          navigate("/verification", {
            state: { email, username, password, mobile_number },
          });
        } else if (responsiveness.data.status === -2) {
          alert("OTP sending failed in backend");
          navigate("/register")

        }
      } catch (err) {
        console.error(err);
        alert("An error occurred while sending OTP");
        navigate("/register")
      }
          }

      }

    else {
      alert("Please fill all fields!");
    }

  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
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
        maxWidth: '450px',
        transition: 'transform 0.3s ease',
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0px)'}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            backgroundColor: '#11998e',
            borderRadius: '50%',
            margin: '0 auto 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 25px rgba(17, 153, 142, 0.3)'
          }}>
            <div style={{
              color: 'white',
              fontSize: '32px',
              fontWeight: 'bold'
            }}>
              ✨
            </div>
          </div>
          <h2 style={{
            margin: '0',
            color: '#333',
            fontSize: '28px',
            fontWeight: '600',
            letterSpacing: '-0.5px'
          }}>Create Account</h2>
          <p style={{
            margin: '5px 0 0 0',
            color: '#666',
            fontSize: '14px'
          }}>Join us and start your journey</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '15px 20px',
                border: '2px solid #e1e5e9',
                borderRadius: '12px',
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.3s ease',
                backgroundColor: '#f8f9fa',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#11998e';
                e.target.style.backgroundColor = '#fff';
                e.target.style.boxShadow = '0 0 0 3px rgba(17, 153, 142, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e1e5e9';
                e.target.style.backgroundColor = '#f8f9fa';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '15px 20px',
                border: '2px solid #e1e5e9',
                borderRadius: '12px',
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.3s ease',
                backgroundColor: '#f8f9fa',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#11998e';
                e.target.style.backgroundColor = '#fff';
                e.target.style.boxShadow = '0 0 0 3px rgba(17, 153, 142, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e1e5e9';
                e.target.style.backgroundColor = '#f8f9fa';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '15px 20px',
                border: '2px solid #e1e5e9',
                borderRadius: '12px',
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.3s ease',
                backgroundColor: '#f8f9fa',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#11998e';
                e.target.style.backgroundColor = '#fff';
                e.target.style.boxShadow = '0 0 0 3px rgba(17, 153, 142, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e1e5e9';
                e.target.style.backgroundColor = '#f8f9fa';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div style={{ marginBottom: '30px' }}>
            <input
              type="number"
              placeholder="Mobile Number"
              value={mobile_number}
              onChange={(e) => setMobileNumber(e.target.value)}
              style={{
                width: '100%',
                padding: '15px 20px',
                border: '2px solid #e1e5e9',
                borderRadius: '12px',
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.3s ease',
                backgroundColor: '#f8f9fa',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#11998e';
                e.target.style.backgroundColor = '#fff';
                e.target.style.boxShadow = '0 0 0 3px rgba(17, 153, 142, 0.1)';
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
              backgroundColor: '#11998e',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(17, 153, 142, 0.3)',
              marginBottom: '20px'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#0f8b81';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 25px rgba(17, 153, 142, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#11998e';
              e.target.style.transform = 'translateY(0px)';
              e.target.style.boxShadow = '0 4px 15px rgba(17, 153, 142, 0.3)';
            }}
          >
            Send OTP to Email
          </button>
        </form>

        {/* Footer */}
        <div style={{ textAlign: 'center' }}>
          <p style={{
            margin: '0',
            color: '#666',
            fontSize: '14px'
          }}>
            Already have an account?{' '}
            <Link
              to="/login"
              style={{
                color: '#11998e',
                textDecoration: 'none',
                fontWeight: '600',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = '#0f8b81'}
              onMouseLeave={(e) => e.target.style.color = '#11998e'}
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}