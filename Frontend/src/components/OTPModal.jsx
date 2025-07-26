import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Loader from "./Loader";

const OTPModal = ({ open, email, onClose }) => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const verifyHandler = async () => {
    setLoading(true);
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/verify-otp`, {
        email,
        otp,
      });
      navigate("/dashboard");
    } catch (err) {
      alert(
        err?.response?.data?.message || err.message || "OTP verification failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <Loader />}
      <div className="otp-overlay">
        <div className="otp-card">
          <h3 style={{ marginBottom: "0.75rem", fontSize: "1.25rem" }}>
            Verify Email
          </h3>
          <p style={{ marginBottom: "1rem", fontSize: "0.9rem" }}>
            Enter the 6-digit OTP sent to <strong>{email}</strong>
          </p>

          <input
            className="otp-input"
            type="text"
            maxLength="6"
            placeholder="123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />

          <button
            className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors mt-2"
            onClick={verifyHandler}
          >
            Verify
          </button>

          <button className="otp-cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </>
  );
};

export default OTPModal;
