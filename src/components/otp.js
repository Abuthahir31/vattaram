import React, { useState } from 'react';
import axios from 'axios';

const OTPLogin = () => {
  const [phone, setPhone] = useState('');
  const [otp, setOTP] = useState('');
  const [step, setStep] = useState(1);  // 1: Enter phone, 2: Enter OTP
  const [message, setMessage] = useState('');

  const handleSendOTP = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/send-otp', { phone });
      setMessage(res.data.message);
      setStep(2);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error sending OTP');
    }
  };

  const handleVerifyOTP = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/verify-otp', { phone, otp });
      setMessage(res.data.message);
      // Redirect to dashboard or login success
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error verifying OTP');
    }
  };

  return (
    <div>
      <h2>OTP Login</h2>
      {step === 1 ? (
        <>
          <input
            type="text"
            placeholder="Enter Phone (e.g., 9876543210)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button onClick={handleSendOTP}>Send OTP</button>
        </>
      ) : (
        <>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOTP(e.target.value)}
          />
          <button onClick={handleVerifyOTP}>Verify OTP</button>
        </>
      )}
      <p>{message}</p>
    </div>
  );
};

export default OTPLogin;