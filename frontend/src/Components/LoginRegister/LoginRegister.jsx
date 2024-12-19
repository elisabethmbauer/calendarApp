import React, { useState } from "react";
import "./LoginRegister.css";

import user_icon from "../Assets/person.png";
import email_icon from "../Assets/email.png";
import password_icon from "../Assets/password.png";

const LoginRegister = ({onLogin}) => {
  const [action, setAction] = useState("Register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    console.log("Submitting registration form...");

    try {
      const response = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      console.log("Backend response status:", response.status);

      const data = await response.json();
      console.log("Backend response data:", data);

      if (response.ok) {
        alert("Registration successful");
        setAction("Login"); // Switch to login after successful registration
      } else {
        alert(`Registration failed: ${data}`);
      }
    } catch (error) {
      console.error("Error during registration:", error);
    }
  };

  const handleLogin = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
  
      // Parse JSON response
      const data = await response.json();
  
      if (response.ok) {
        alert(data.message); // Display the success message from the backend
        onLogin(); // Trigger the onLogin function to switch to the calendar
      } else {
        alert(`Login failed: ${data.error}`); // Display the error message from the backend
      }
    } catch (error) {
      console.error("Error during login:", error);
    }
  };
  

  return (
    <div className="container">
      <div className="header">
        <div className="text">{action}</div>
        <div className="underline"></div>
        <div className="inputs">
          {action === "Login" ? null : (
            <div className="input">
              <img src={user_icon} alt="" />
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div className="input">
            <img src={email_icon} alt="" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="input">
            <img src={password_icon} alt="" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        
        <div className="submit-container">
          {/* Submit Button for Register */}
          {action === "Register" && (
            <div className="submit" onClick={handleRegister}>
              Submit Registration
            </div>
          )}

          {/* Submit Button for Login */}
          {action === "Login" && (
            <div className="submit" onClick={handleLogin}>
              Submit Login
            </div>
          )}

          {/* Toggle Buttons */}
          <div
            className="toggle-button"
            onClick={() => setAction(action === "Register" ? "Login" : "Register")}
          >
            Switch to {action === "Register" ? "Login" : "Register"}
          </div>
      
        </div>
      </div>
    </div>
  );
};

export default LoginRegister;
