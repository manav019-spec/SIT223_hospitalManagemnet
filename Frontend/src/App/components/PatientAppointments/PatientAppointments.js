import React, { useState, useEffect } from 'react';
import { useAuth } from '../Context/AuthContext';
import { appointmentService } from '../Services/appointmentService';
import VideoCall from '../VideoConference/VideoCall';
import { videoCallService } from '../VideoConference/videoCallService';
import './PatientAppointments.css';

function PatientAppointments() {
  const { currentUser, userData } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showVideoCall, setShowVideoCall] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    fetchAppointments();

    // Set up real-time listener
    const unsubscribe = appointmentService.subscribeToAppointments(
      currentUser.uid,
      (appointmentsData) => {
        setAppointments(appointmentsData);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [currentUser]);

  const fetchAppointments = async () => {
    try {
      const appointmentsData = await appointmentService.getPatientAppointments(currentUser.uid);
      setAppointments(appointmentsData);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      await appointmentService.cancelAppointment(appointmentId, 'Cancelled by patient');
      // Real-time listener will update the list
      alert('Appointment cancelled successfully.');
      // Optionally, you can refetch appointments here
      await fetchAppointments();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      alert('Failed to cancel appointment. Please try again.');
    }
  };

// In PatientAppointments.js - Fix the startVideoCall function
const startVideoCall = async (appointment) => {
  if (appointment.status !== 'confirmed') {
    alert('Video call is only available for confirmed appointments.');
    return;
  }

  try {
    // Check if video call already exists using the new method
    const existingRoom = await videoCallService.getMeetingRoomOnce(appointment.id);
    
    if (existingRoom) {
      if (existingRoom.status === 'pending') {
        alert('Video call request is pending doctor approval.');
        return;
      } else if (existingRoom.status === 'approved' || existingRoom.status === 'active') {
        setSelectedAppointment(appointment);
        setShowVideoCall(true);
        return;
      }
    }

    // Create new video call request
    await videoCallService.createMeetingRoom(
      appointment.id,
      appointment.doctorName,
      appointment.patientName || `${userData?.firstName} ${userData?.lastName}`
    );
    
    alert('Video call request sent to doctor. You will be notified when approved.');
    
  } catch (error) {
    console.error('Error starting video call:', error);
    alert('Failed to initiate video call. Please try again.');
  }
};

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ffc107';
      case 'confirmed': return '#28a745';
      case 'cancelled': return '#dc3545';
      case 'completed': return '#007bff';
      default: return '#6c757d';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-IN', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  if (!currentUser) {
    return (
      <div className="patient-appointments-container">
        <div className="access-denied">
          <h2>Please Login</h2>
          <p>You need to be logged in to view your appointments.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-appointments-container">
      {showVideoCall && selectedAppointment && (
        <VideoCall
          appointment={selectedAppointment}
          userRole="patient"
          onClose={() => setShowVideoCall(false)}
        />
      )}

      <div className="appointments-header">
        <h1>My Appointments</h1>
        <p>View and manage your appointments</p>
      </div>

      <div className="appointments-content">
        {loading ? (
          <div className="loading">Loading your appointments...</div>
        ) : appointments.length === 0 ? (
          <div className="no-appointments">
            <div className="no-appointments-icon">📅</div>
            <h3>No Appointments Found</h3>
            <p>You haven't booked any appointments yet.</p>
            <a href="/appointment" className="book-appointment-btn">
              Book Your First Appointment
            </a>
          </div>
        ) : (
          <div className="appointments-list">
            {appointments.map(appointment => (
              <div key={appointment.id} className="appointment-card">
                <div className="appointment-header">
                  <div className="appointment-info">
                    <h4>{appointment.serviceName}</h4>
                    <p className="doctor-name">With {appointment.doctorName}</p>
                    <p className="appointment-date">{formatDate(appointment.appointmentDate)}</p>
                    <p className="appointment-reason">{appointment.reason}</p>
                  </div>
                  <div className="appointment-actions">
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(appointment.status) }}
                    >
                      {appointment.status}
                    </span>
                    
                    {appointment.status === 'pending' && (
                      <button 
                        className="cancel-btn"
                        onClick={() => cancelAppointment(appointment.id)}
                      >
                        Cancel
                      </button>
                    )}
                    
                    {appointment.status === 'confirmed' && appointment.videoCallEnabled && (
                      <button 
                        className="video-call-btn"
                        onClick={() => startVideoCall(appointment)}
                      >
                        📹 Video Call
                      </button>
                    )}
                  </div>
                </div>
                
                {appointment.doctorNotes && (
                  <div className="doctor-notes">
                    <strong>Doctor's Notes:</strong> {appointment.doctorNotes}
                  </div>
                )}
                
                {appointment.status === 'confirmed' && !appointment.videoCallEnabled && (
                  <div className="video-call-info">
                    <small>Video call will be available once the doctor confirms the appointment.</small>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PatientAppointments;