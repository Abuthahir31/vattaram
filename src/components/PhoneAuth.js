import React, { useState, useEffect } from "react";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { useNavigate } from "react-router-dom";
import "./PhoneAuth.css";

const PhoneAuth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const setupRecaptcha = async () => {
    if (window.recaptchaVerifier) {
      console.log("Clearing existing reCAPTCHA instance");
      try {
        window.recaptchaVerifier.clear();
      } catch (error) {
        console.error("Error clearing reCAPTCHA:", error);
      }
      window.recaptchaVerifier = null;
      const container = document.getElementById("recaptcha-container");
      if (container) {
        container.innerHTML = "";
      }
    }

    const container = document.getElementById("recaptcha-container");
    if (!container) {
      throw new Error("recaptcha-container element not found in DOM");
    }

    console.log("Initializing reCAPTCHA");
    try {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: (response) => {
          console.log("reCAPTCHA solved:", response);
        },
        "expired-callback": () => {
          console.log("reCAPTCHA expired");
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
          const container = document.getElementById("recaptcha-container");
          if (container) {
            container.innerHTML = "";
          }
        },
      });
      await window.recaptchaVerifier.render();
      console.log("reCAPTCHA rendered successfully");
      return window.recaptchaVerifier;
    } catch (error) {
      console.error("reCAPTCHA initialization failed:", error);
      throw error;
    }
  };

  const isValidPhone = (phone) => /^[6-9]\d{9}$/.test(phone);

  const sendOTP = async () => {
    const phoneNumber = "+91" + phone.trim();
    if (!isValidPhone(phone)) {
      alert("Enter a valid 10-digit Indian phone number starting with 6-9");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      console.log("Sending OTP to:", phoneNumber);
      const appVerifier = await setupRecaptcha();
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(confirmation);
      setOtp("");
      alert("OTP Sent!");
    } catch (error) {
      console.error("Send OTP error:", error.code, error.message, error);
      alert("Failed to send OTP: " + error.message);
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
        const container = document.getElementById("recaptcha-container");
        if (container) {
          container.innerHTML = "";
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp || !confirmationResult) {
      alert("Please enter OTP");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await confirmationResult.confirm(otp);
      const user = result.user;
      setOtp("");
      setConfirmationResult(null);
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
        const container = document.getElementById("recaptcha-container");
        if (container) {
          container.innerHTML = "";
        }
      }
      navigate("/home", {
        state: { uid: user.uid, phone: user.phoneNumber },
      });
    } catch (error) {
      alert("Invalid OTP. Please try again.");
      setOtp("");
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
        const container = document.getElementById("recaptcha-container");
        if (container) {
          container.innerHTML = "";
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      navigate("/home", {
        state: {
          uid: user.uid,
          email: user.email || null,
          name: user.displayName || null,
        },
      });
    } catch (err) {
      alert("Google Sign-In Failed: " + err.message);
    }
  };

  const handleLogin = async () => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;
      if (!user.emailVerified) {
        alert("Email not verified. Please check your Gmail inbox.");
        return;
      }
      navigate("/home", {
        state: { uid: user.uid, email: user.email, name: user.displayName || "User" },
      });
    } catch (err) {
      alert("Login Failed: " + err.message);
    }
  };

  useEffect(() => {
    setConfirmationResult(null);
    setOtp("");
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
      const container = document.getElementById("recaptcha-container");
      if (container) {
        container.innerHTML = "";
      }
    }
  }, [mode]);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Welcome Back</h2>
        {mode === "login" && (
          <>
            <div className="form-group">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
              />
            </div>
            <button onClick={handleLogin} className="btn btn-primary">
              Sign In
            </button>
            <button onClick={signInWithGoogle} className="btn btn-google">
              Continue with Google
            </button>
            <div className="divider">
              <span>or</span>
            </div>
            <button onClick={() => setMode("phone")} className="btn btn-secondary">
              Sign In with Phone
            </button>
            <div className="auth-footer">
              Don't have an account?{" "}
              <button onClick={() => navigate("/register")} className="btn-link">
                Create account
              </button>
            </div>
          </>
        )}
        {mode === "phone" && (
          <>
            <h3 className="auth-subtitle">Phone Authentication</h3>
            <div className="form-group">
              <input
                type="text"
                placeholder="Phone number (10 digits)"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
                maxLength="10"
                className="form-input"
                disabled={loading}
              />
            </div>
            <button onClick={sendOTP} className="btn btn-primary" disabled={loading}>
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
            {confirmationResult && (
              <>
                <div className="success-message">OTP sent successfully!</div>
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength="6"
                    className="form-input"
                    disabled={loading}
                  />
                </div>
                <button onClick={verifyOTP} className="btn btn-primary" disabled={loading}>
                  {loading ? "Verifying OTP..." : "Verify OTP"}
                </button>
              </>
            )}
            <div className="auth-footer">
              <button onClick={() => setMode("login")} className="btn-link">
                ← Back to Login
              </button>
            </div>
            <div id="recaptcha-container" style={{ display: "none" }}></div>
          </>
        )}
      </div>
    </div>
  );
};

export default PhoneAuth;