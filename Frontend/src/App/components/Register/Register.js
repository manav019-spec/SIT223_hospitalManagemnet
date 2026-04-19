// Register.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import './Register.css';

function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    userType: 'patient', // 'patient' or 'doctor'
    // Doctor specific fields
    specialization: '',
    experience: '',
    qualification: '',
    licenseNumber: '',
    bio: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  
  const { signup, registerDoctor } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    // Common validations
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (formData.phone.length < 10) {
      errors.phone = 'Phone number must be at least 10 digits';
    }
    if (!formData.gender) {
      errors.gender = 'Gender is required';
    }
    if (!formData.dateOfBirth) {
      errors.dateOfBirth = 'Date of birth is required';
    }

    // Doctor specific validations
    if (formData.userType === 'doctor') {
      if (!formData.specialization.trim()) {
        errors.specialization = 'Specialization is required';
      }
      if (!formData.experience) {
        errors.experience = 'Experience is required';
      } else if (formData.experience < 0) {
        errors.experience = 'Experience cannot be negative';
      }
      if (!formData.qualification.trim()) {
        errors.qualification = 'Qualification is required';
      }
      if (!formData.licenseNumber.trim()) {
        errors.licenseNumber = 'License number is required';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setError('');
      setLoading(true);
      
      const userData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        role: formData.userType,
        createdAt: new Date().toISOString()
      };

      // Add doctor-specific data if user is a doctor
      if (formData.userType === 'doctor') {
        userData.specialization = formData.specialization.trim();
        userData.experience = parseInt(formData.experience);
        userData.qualification = formData.qualification.trim();
        userData.licenseNumber = formData.licenseNumber.trim();
        userData.bio = formData.bio.trim();
        
        await registerDoctor(formData.email.trim(), formData.password, userData);
      } else {
        await signup(formData.email.trim(), formData.password, userData);
      }
      
      navigate(formData.userType === 'doctor' ? '/doctor-dashboard' : '/appointment');
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please use a different email or login.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address. Please check your email format.');
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak. Please use a stronger password.');
      } else if (error.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection.');
      } else {
        setError('Failed to create account: ' + error.message);
      }
    }
    
    setLoading(false);
  };

  const isFieldInvalid = (fieldName) => {
    return fieldErrors[fieldName] && fieldErrors[fieldName] !== '';
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h1>Create Account</h1>
          <p>Join Mahavir Mediscope Eye Centre</p>
        </div>
        
        {error && <div className="error-alert">{error}</div>}
        
        <form onSubmit={handleSubmit} className="register-form">
          {/* User Type Selection */}
          <div className="user-type-selection">
            <label className="section-label">I am a:</label>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="userType"
                  value="patient"
                  checked={formData.userType === 'patient'}
                  onChange={handleChange}
                />
                <span className="radio-custom"></span>
                Patient
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="userType"
                  value="doctor"
                  checked={formData.userType === 'doctor'}
                  onChange={handleChange}
                />
                <span className="radio-custom"></span>
                Doctor
              </label>
            </div>
          </div>

          <div className="form-grid">
            {/* Personal Information */}
            <div className="form-section">
              <h3>Personal Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name *</label>
                  <input
                    id="firstName"
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={isFieldInvalid('firstName') ? 'error' : ''}
                  />
                  {isFieldInvalid('firstName') && (
                    <span className="field-error">{fieldErrors.firstName}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="lastName">Last Name *</label>
                  <input
                    id="lastName"
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={isFieldInvalid('lastName') ? 'error' : ''}
                  />
                  {isFieldInvalid('lastName') && (
                    <span className="field-error">{fieldErrors.lastName}</span>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={isFieldInvalid('email') ? 'error' : ''}
                  />
                  {isFieldInvalid('email') && (
                    <span className="field-error">{fieldErrors.email}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone Number *</label>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={isFieldInvalid('phone') ? 'error' : ''}
                    placeholder="+91 1234567890"
                  />
                  {isFieldInvalid('phone') && (
                    <span className="field-error">{fieldErrors.phone}</span>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="dateOfBirth">Date of Birth *</label>
                  <input
                    id="dateOfBirth"
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className={isFieldInvalid('dateOfBirth') ? 'error' : ''}
                  />
                  {isFieldInvalid('dateOfBirth') && (
                    <span className="field-error">{fieldErrors.dateOfBirth}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="gender">Gender *</label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={isFieldInvalid('gender') ? 'error' : ''}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                  {isFieldInvalid('gender') && (
                    <span className="field-error">{fieldErrors.gender}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Doctor Specific Fields */}
            {formData.userType === 'doctor' && (
              <div className="form-section">
                <h3>Professional Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="specialization">Specialization *</label>
                    <select
                      id="specialization"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      className={isFieldInvalid('specialization') ? 'error' : ''}
                    >
                      <option value="">Select Specialization</option>
                      <option value="Ophthalmology">Ophthalmology</option>
                      <option value="Retina Specialist">Retina Specialist</option>
                      <option value="Cornea Specialist">Cornea Specialist</option>
                      <option value="Pediatric Ophthalmology">Pediatric Ophthalmology</option>
                      <option value="Glaucoma Specialist">Glaucoma Specialist</option>
                      <option value="Cataract Specialist">Cataract Specialist</option>
                      <option value="Neuro-ophthalmology">Neuro-ophthalmology</option>
                    </select>
                    {isFieldInvalid('specialization') && (
                      <span className="field-error">{fieldErrors.specialization}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="experience">Experience (Years) *</label>
                    <input
                      id="experience"
                      type="number"
                      name="experience"
                      value={formData.experience}
                      onChange={handleChange}
                      min="0"
                      max="50"
                      className={isFieldInvalid('experience') ? 'error' : ''}
                    />
                    {isFieldInvalid('experience') && (
                      <span className="field-error">{fieldErrors.experience}</span>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="qualification">Qualification *</label>
                    <select
                      id="qualification"
                      name="qualification"
                      value={formData.qualification}
                      onChange={handleChange}
                      className={isFieldInvalid('qualification') ? 'error' : ''}
                    >
                      <option value="">Select Qualification</option>
                      <option value="MBBS">MBBS</option>
                      <option value="MD">MD</option>
                      <option value="MS">MS</option>
                      <option value="DOMS">DOMS</option>
                      <option value="DNB">DNB</option>
                      <option value="FRCS">FRCS</option>
                    </select>
                    {isFieldInvalid('qualification') && (
                      <span className="field-error">{fieldErrors.qualification}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="licenseNumber">License Number *</label>
                    <input
                      id="licenseNumber"
                      type="text"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      className={isFieldInvalid('licenseNumber') ? 'error' : ''}
                      placeholder="e.g., MCI12345"
                    />
                    {isFieldInvalid('licenseNumber') && (
                      <span className="field-error">{fieldErrors.licenseNumber}</span>
                    )}
                  </div>
                </div>

                <div className="form-group full-width">
                  <label htmlFor="bio">Professional Bio</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Brief about your professional background and expertise..."
                  />
                </div>
                {/* For default schedule information just to be shown only */}
                <div className="form-group full-width">
                  <label>Default Schedule:</label>
                  <p>Your account will be created with the following default schedule:</p>
                  <ul>
                    <li><strong>Monday - Friday:</strong> 9:00 AM - 5:00 PM</li>
                    <li><strong>Slot Duration:</strong> 30 minutes</li>
                    <li><strong>Weekend:</strong> Not available</li>
                  </ul>
                  <p>You can customize your schedule after registration in your profile settings.</p>
                </div>
              </div>
            )}

            {/* Security Information */}
            <div className="form-section">
              <h3>Security Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="password">Password *</label>
                  <input
                    id="password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={isFieldInvalid('password') ? 'error' : ''}
                  />
                  {isFieldInvalid('password') && (
                    <span className="field-error">{fieldErrors.password}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password *</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={isFieldInvalid('confirmPassword') ? 'error' : ''}
                  />
                  {isFieldInvalid('confirmPassword') && (
                    <span className="field-error">{fieldErrors.confirmPassword}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="register-button"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : `Create ${formData.userType === 'doctor' ? 'Doctor' : 'Patient'} Account`}
            </button>
          </div>
        </form>

        <div className="register-footer">
          <p>Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}

export default Register;