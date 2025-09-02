import { useNavigate } from "react-router-dom";
import "./PhoneAuth.css";

const VerifyEmail = () => {
  const navigate = useNavigate();

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Check Your Email</h2>
        <p className="auth-subtitle">
          We've sent a verification email to your Gmail.
          <br />
          Please open it and verify before logging in.
        </p>

        <button className="btn btn-primary" onClick={() => navigate("/account")}>
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default VerifyEmail;
