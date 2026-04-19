import React, { useState, useEffect } from 'react';
import { useAuth } from '../Context/AuthContext';
import TwoFactorSetup from '../TwoFactorAuth/TwoFactorSetup';
import PatientAppointments from '../PatientAppointments/PatientAppointments';
import { Link } from 'react-router-dom';
import './Profile.css';

function Profile() {
  const { currentUser, userData, fetchUserData, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (!currentUser) {
    return (
      <div className="profile-container">
        <div className="login-required">
          <h2>Please Log In</h2>
          <p>You need to be logged in to view your profile.</p>
          <Link to="/login" className="login-btn">Login Now</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="header-content">
          <div className="user-avatar">
            {userData?.role === 'doctor' ? '👨‍⚕️' : '👤'}
          </div>
          <div className="user-info">
            <h1>Welcome, {userData?.firstName} {userData?.lastName}</h1>
            <p>Manage your account settings and preferences</p>
            <div className="user-role-badge">
              {userData?.role === 'doctor' ? 'Doctor Account' : 'Patient Account'}
            </div>
          </div>
        </div>
      </div>

      <div className="profile-layout">
        {/* Sidebar Navigation */}
        <div className="profile-sidebar">
          <nav className="sidebar-nav">
            <button 
              className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <span className="nav-icon">👤</span>
              <span className="nav-text">Personal Info</span>
            </button>
            
            <button 
              className={`nav-item ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <span className="nav-text">Security</span>
            </button>
            
            <button 
              className={`nav-item ${activeTab === 'appointments' ? 'active' : ''}`}
              onClick={() => setActiveTab('appointments')}
            >
              <span className="nav-text">
                {userData?.role === 'doctor' ? 'Dashboard' : 'My Appointments'}
              </span>
            </button>
            
            <div className="nav-divider"></div>
            
            <button className="nav-item logout-btn" onClick={logout}>
              <span className="nav-text">Logout</span>
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="profile-content">
          <div className="content-wrapper">
            {activeTab === 'profile' && <ProfileInfo userData={userData} />}
            {activeTab === 'security' && <SecuritySettings userData={userData} />}
            {activeTab === 'appointments' && <AppointmentHistory userData={userData} />}
          </div>
        </div>
      </div>
    </div>
  );
}

// Profile Information Component
const ProfileInfo = ({ userData }) => {
  return (
    <div className="profile-section">
      <div className="section-header">
        <h2>Personal Information</h2>
        <p>Your account details and personal information</p>
      </div>
      
      <div className="info-grid">
        <div className="info-card">
          <div className="info-icon">👤</div>
          <div className="info-content">
            <label>Full Name</label>
            <div className="info-value">
              {userData?.firstName} {userData?.lastName}
              {userData?.role === 'doctor' && <span className="doctor-badge">MD</span>}
            </div>
          </div>
        </div>

        <div className="info-card">
          <div className="info-icon">📧</div>
          <div className="info-content">
            <label>Email Address</label>
            <div className="info-value">{userData?.email}</div>
          </div>
        </div>

        <div className="info-card">
          <div className="info-icon">📱</div>
          <div className="info-content">
            <label>Phone Number</label>
            <div className="info-value">{userData?.phone || 'Not provided'}</div>
          </div>
        </div>

        <div className="info-card">
          <div className="info-icon">🎂</div>
          <div className="info-content">
            <label>Date of Birth</label>
            <div className="info-value">{userData?.dateOfBirth || 'Not provided'}</div>
          </div>
        </div>

        <div className="info-card">
          <div className="info-icon">⚧️</div>
          <div className="info-content">
            <label>Gender</label>
            <div className="info-value">{userData?.gender || 'Not provided'}</div>
          </div>
        </div>

        <div className="info-card">
          <div className="info-icon">🎯</div>
          <div className="info-content">
            <label>Account Type</label>
            <div className="info-value role-badge">
              {userData?.role === 'doctor' ? '👨‍⚕️ Doctor' : '👤 Patient'}
            </div>
          </div>
        </div>
        
        {/* Doctor Specific Information */}
        {userData?.role === 'doctor' && (
          <>
            <div className="info-card">
              <div className="info-icon">🎓</div>
              <div className="info-content">
                <label>Specialization</label>
                <div className="info-value">{userData?.specialization || 'Not specified'}</div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">📅</div>
              <div className="info-content">
                <label>Experience</label>
                <div className="info-value">{userData?.experience ? `${userData.experience} years` : 'Not specified'}</div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">📜</div>
              <div className="info-content">
                <label>Qualification</label>
                <div className="info-value">{userData?.qualification || 'Not specified'}</div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">🔖</div>
              <div className="info-content">
                <label>License Number</label>
                <div className="info-value">{userData?.licenseNumber || 'Not specified'}</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Security Settings Component with 2FA
const SecuritySettings = ({ userData }) => {
  const { enable2FA, disable2FA, is2FAEnabled } = useAuth();
  const [show2FASetup, setShow2FASetup] = useState(false);

  return (
    <div className="profile-section">
      <div className="section-header">
        <h2>Security Settings</h2>
        <p>Manage your account security and privacy</p>
      </div>
      
      {/* 2FA Status Card */}
      <div className="security-card">
        <div className="security-header">
          <div className="security-icon">🔒</div>
          <div className="security-info">
            <h3>Two-Factor Authentication</h3>
            <p>Add an extra layer of security to your account with 2FA</p>
          </div>
          <div className="security-status">
            <span className={`status-badge ${is2FAEnabled() ? 'enabled' : 'disabled'}`}>
              {is2FAEnabled() ? '🟢 Enabled' : '🔴 Disabled'}
            </span>
          </div>
        </div>

        <div className="security-description">
          <p>
            Two-factor authentication adds an additional layer of security to your account 
            by requiring more than just a password to sign in.
          </p>
        </div>

        <div className="security-actions">
          {!is2FAEnabled() ? (
            <button 
              className="setup-btn"
              onClick={() => setShow2FASetup(true)}
            >
              Complete Setup
            </button>
          ) : (
            <button 
              className="btn btn-secondary disable-2fa-btn"
              onClick={disable2FA}
            >
              <span className="btn-icon">❌</span>
              Disable 2FA
            </button>
          )}
        </div>

        {show2FASetup && (
          <div className="2fa-setup-container">
            <TwoFactorSetup onClose={() => setShow2FASetup(false)} />
          </div>
        )}
      </div>

      {/* Security Tips */}
      <div className="security-tips">
        <h4>Security Best Practices</h4>
        <div className="tips-grid">
          <div className="tip-item">
            <span className="tip-icon">✅</span>
            <div className="tip-content">
              <strong>Strong Password</strong>
              <p>Use a unique, complex password</p>
            </div>
          </div>
          <div className="tip-item">
            <span className="tip-icon">✅</span>
            <div className="tip-content">
              <strong>2FA Enabled</strong>
              <p>Add an extra security layer</p>
            </div>
          </div>
          <div className="tip-item">
            <span className="tip-icon">✅</span>
            <div className="tip-content">
              <strong>Secure Recovery</strong>
              <p>Keep backup codes safe</p>
            </div>
          </div>
          <div className="tip-item">
            <span className="tip-icon">✅</span>
            <div className="tip-content">
              <strong>Regular Updates</strong>
              <p>Change password periodically</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Appointment History Component with Role-Based Access
const AppointmentHistory = ({ userData }) => {
  const { currentUser } = useAuth();

  // If user is a doctor, show doctor dashboard info
  if (userData?.role === 'doctor') {
    return (
      <div className="profile-section">
        <div className="section-header">
          <h2>Doctor Dashboard</h2>
          <p>Manage your professional activities and patient appointments</p>
        </div>
        
        <div className="doctor-dashboard-info">
          <div className="dashboard-welcome">
            <div className="welcome-content">
              <h3>Welcome, Dr. {userData?.firstName} {userData?.lastName}</h3>
              <p>Access comprehensive tools to manage your practice and provide the best care for your patients.</p>
            </div>
            <div className="welcome-illustration">👨‍⚕️</div>
          </div>
          
          <div className="dashboard-features">
            <div className="feature-card">
              <div className="feature-icon">📅</div>
              <div className="feature-content">
                <h4>Appointment Management</h4>
                <p>View, confirm, and manage all your patient appointments with an intuitive calendar interface.</p>
              </div>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <div className="feature-content">
                <h4>Patient Consultations</h4>
                <p>Access detailed patient profiles, medical history, and consultation notes for informed care.</p>
              </div>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <div className="feature-content">
                <h4>Schedule Overview</h4>
                <p>Get a complete view of your daily, weekly, and monthly appointment schedules at a glance.</p>
              </div>
            </div>
          </div>

          <div className="dashboard-actions">
            <Link to="/doctor-dashboard" className="btn btn-primary dashboard-link">
              <span className="btn-icon"></span>
              Go to Doctor Dashboard
            </Link>
            <div className="action-note">
              <p><strong>Professional Tip:</strong> Use the dashboard to efficiently manage your appointments and provide timely care to patients.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If user is a patient, show their appointment history
  return (
    <div className="profile-section">
      <div className="section-header">
        <h2>My Appointments</h2>
        <p>View and manage your scheduled appointments</p>
      </div>
      <PatientAppointments />
    </div>
  );
};

export default Profile;