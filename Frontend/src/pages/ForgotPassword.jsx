import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Loader from "../components/Loader";
import Logo from "../components/Logo";
import "../styles/auth.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/forgot-password`,
        { email }
      );
      navigate(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err) {
      alert(
        err?.response?.data?.message || "Failed to send reset instructions"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-slate-50 to-blue-50 px-2">
      {isLoading && <Loader />}
      <div className="w-full max-w-md mx-auto">
        <div className="flex justify-center mb-8">
          <Logo size={120} />
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">
            Forgot Password
          </h2>
          <p className="text-center text-slate-600 mb-6 text-base">
            Enter your email address and we'll send you an OTP to reset your
            password.
          </p>
          <form onSubmit={handleSubmit} className="space-y-5">
            <input
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 bg-slate-50"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button
              className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Sending…" : "Verify Email"}
            </button>
          </form>
          <p className="text-center text-sm text-slate-600 mt-6">
            Remember your password?{" "}
            <Link
              className="text-blue-600 hover:underline font-semibold"
              to="/login"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
