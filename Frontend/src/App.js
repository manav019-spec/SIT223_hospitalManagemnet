import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
// Import Context Providers
import { AuthProvider, useAuth } from "./App/components/Context/AuthContext";

// Import Component Pages for Routing
import Home from "./App/components/LandingPage/Home/Home";
import Header from "./App/components/Shared/Header/Header";
import Footer from "./App/components/Shared/Footer/Footer";
import Services from "./App/components/Services/Services";
import ServiceDetails from "./App/components/ServiceDetails/ServiceDetails";
import About from './App/components/About/About';
import Appointment from "./App/components/Appointment/Appointment";
import PatientAppointments from "./App/components/PatientAppointments/PatientAppointments";
// import Doctor from "./App/components/Doctor/Doctor";
import Doctors from "./App/components/Doctors/Doctors";
import DoctorDashboard from "./App/components/DoctorDashboard/DoctorDashboard";
import DoctorLogin from "./App/components/DoctorLogin/DoctorLogin";
import Profile from "./App/components/Profile/Profile";
import Register from "./App/components/Register/Register";
import Login from "./App/components/Login/Login";

import TwoFactorSetup from "./App/components/TwoFactorAuth/TwoFactorSetup";
import TwoFactorVerify from "./App/components/TwoFactorAuth/TwoFactorVerify";
import VideoCall from "./App/components/VideoConference/VideoCall";
import { Alert } from "react-bootstrap";

// Protected route wrappers for role-based access
function PrivateRoute({ children, role }) {
  const { currentUser, userData } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (role && userData?.role !== role) {
    // Add alert for unauthorized access attempt
    alert('WARNING: You do not have permission to access this page.');
    return <Navigate to="/" />; // Redirect if role mismatch
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <Header/>
      <div className="main-content" style={{ minHeight: 'calc(100vh - 130px)' }}>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* Services routes */}
        <Route path="/services" element={<Services />} />
        <Route path="/services/:name" element={<ServiceDetails />} />
        <Route path="/appointment" element={
          <PrivateRoute role="patient">
            <Appointment />
          </PrivateRoute>
        } />
        <Route path="/my-appointments" element={
          <PrivateRoute role="patient">
            <PatientAppointments />
          </PrivateRoute>
        } />
        <Route path="/doctor-dashboard" element={
          <PrivateRoute role="doctor">
            <DoctorDashboard />
          </PrivateRoute>
        } />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/profile" element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        } />
        <Route path="/login" element={<Login />} />
        <Route path="/about" element={<About />} />
        <Route path="/register" element={<Register />} />
        <Route path="/doctor_login" element={<DoctorLogin />} />
        {/* <Route path="/doctor" element={<Doctor />} /> */}
        
        <Route path="/doctor-login" element={<DoctorLogin />} />
        <Route path="/2fa-setup" element={
          <PrivateRoute>
            <TwoFactorSetup />
          </PrivateRoute>
        } />
        <Route path="/2fa-verify" element={<TwoFactorVerify />} />
        <Route path="/video-call/:appointmentId" element={
          <PrivateRoute>
            <VideoCall />
          </PrivateRoute>
        } />
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      </div>
      <Footer />
    </AuthProvider>
  );
}

export default App;
