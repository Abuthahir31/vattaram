import React, { useState } from 'react';
import axios from 'axios';
import { Form, Button, Alert } from 'react-bootstrap';

const PhoneVerification = ({ onSuccess }) => {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const sendOTP = async () => {
    if (!phone.match(/^\+\d{10,15}$/)) {
      setError('Please enter a valid phone number (e.g., +919876543210)');
      return;
    }
    try {
      const response = await axios.post('http://localhost:5000/api/send-otp', { phone });
      console.log('OTP Send Response:', response.data);
      setError('');
      setSuccess('OTP sent successfully!');
      setStep(2);
    } catch (error) {
      console.error('Error sending OTP:', error.response?.data || error.message);
      setError(error.response?.data?.error || 'Failed to send OTP');
    }
  };

  const verifyOTP = async () => {
    if (!code) {
      setError('Please enter the OTP');
      return;
    }
    try {
      const response = await axios.post('http://localhost:5000/api/verify-otp', { phone, code });
      if (response.data.message === 'OTP verified') {
        localStorage.setItem('token', response.data.token); // Store JWT
        setError('');
        setSuccess('Phone verified successfully!');
        onSuccess(response.data.phone); // Pass phone number to parent
      }
    } catch (error) {
      console.error('Error verifying OTP:', error.response?.data || error.message);
      setError(error.response?.data?.error || 'Invalid OTP');
    }
  };

  return (
    <div className="p-3">
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      {step === 1 ? (
        <Form.Group className="mb-3">
          <Form.Label>Phone Number</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter phone with country code (e.g., +919876543210)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Button className="mt-3 w-100" onClick={sendOTP}>
            Send OTP
          </Button>
        </Form.Group>
      ) : (
        <Form.Group className="mb-3">
          <Form.Label>Enter OTP</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter OTP"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <Button className="mt-3 w-100" onClick={verifyOTP}>
            Verify
          </Button>
        </Form.Group>
      )}
    </div>
  );
};

export default PhoneVerification;