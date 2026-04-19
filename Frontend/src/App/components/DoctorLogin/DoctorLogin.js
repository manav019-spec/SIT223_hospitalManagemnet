// DoctorLogin.js
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from '../Context/AuthContext';
import './DoctorLogin.css';

function DoctorLogin() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  
  const navigate = useNavigate();
  const { login, resetPassword } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(formData.email, formData.password);
      navigate('/doctor-dashboard');
    } catch (error) {
      if (error.message === '2FA_REQUIRED') {
        navigate('/doctor-dashboard');
      } else {
        setError('Failed to log in: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await resetPassword(resetEmail);
      setResetMessage('Password reset email sent! Check your inbox.');
      setShowForgotPassword(false);
    } catch (error) {
      setError('Failed to reset password: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="doctor-login-container">
      <div className="doctor-login-card">
        <form onSubmit={handleLogin} className="doctor-login-form">
          <h1 className="form-title">Welcome Doctor</h1>
          
          {error && <div className="error-message">{error}</div>}
          {resetMessage && <div className="success-message">{resetMessage}</div>}

          {!showForgotPassword ? (
            <>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  onChange={handleChange}
                  className="form-input"
                  id="email"
                  type="email"
                  name="email"
                  placeholder="doctor@example.com"
                  required
                  value={formData.email}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  onChange={handleChange}
                  className="form-input"
                  id="password"
                  name="password"
                  placeholder="********"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                />
              </div>

              <div className="checkbox-group">
                <input
                  onChange={() => setShowPassword(!showPassword)}
                  className="checkbox"
                  id="showPassword"
                  type="checkbox"
                />
                <label htmlFor="showPassword">Show Password</label>
              </div>

              <button
                type="submit"
                className="login-button"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Log In'}
              </button>

              <div className="login-links">
                <button 
                  type="button"
                  className="link-button"
                  onClick={() => setShowForgotPassword(true)}
                >
                  Forgot Password?
                </button>
                <Link to="/" className="link-button">Back to Home</Link>
              </div>
            </>
          ) : (
            <div className="forgot-password-section">
              <h3>Reset Password</h3>
              <p>Enter your email address and we'll send you a password reset link.</p>
              
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  className="form-input"
                />
              </div>
              
              <div className="forgot-password-actions">
                <button
                  type="button"
                  className="reset-button"
                  onClick={handlePasswordReset}
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
                <button
                  type="button"
                  className="back-button"
                  onClick={() => setShowForgotPassword(false)}
                >
                  Back to Login
                </button>
              </div>
            </div>
          )}
        </form>

        <div className="login-image-section">
          <img
            className="login-image"
            src="https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=500&h=500&fit=crop" 
            alt="Doctor Illustration"
          />
        </div>
      </div>
    </div>
  );
}

export default DoctorLogin;