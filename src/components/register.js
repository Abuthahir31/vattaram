import React, { useState } from "react";
import { auth } from "../firebase"; 

import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut
} from "firebase/auth"; 
import { useNavigate } from "react-router-dom";
import "./PhoneAuth.css";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!name || !email || !password) return alert("Fill all fields");
    if (!email.endsWith("@gmail.com")) return alert("Only Gmail allowed");

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;
      await sendEmailVerification(user);
      await signOut(auth);

      alert("Verification email sent. Please check your Gmail inbox.");
      navigate("/verify-email");
    } catch (err) {
      alert("Registration failed: " + err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Create Account</h2>
        <p className="auth-subtitle">Join us today with your Gmail account</p>

        <div className="form-group">
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <input
            type="email"
            placeholder="Gmail address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <input
            type="password"
            placeholder="Password (minimum 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
            minLength="6"
          />
        </div>

        <button onClick={handleRegister} className="btn btn-primary">
          Create Account
        </button>

        <div className="divider">
          <span>or</span>
        </div>

        <button onClick={() => navigate("/")} className="btn btn-secondary">
          Sign In Instead
        </button>

        <div className="auth-footer">
          Already have an account?{" "}
          <button onClick={() => navigate("/")} className="btn-link">
            Sign in here
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;
