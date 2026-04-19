// DoctorDashboard.js - Complete Fixed Version
import React, { useState, useEffect } from 'react';
import { useAuth } from '../Context/AuthContext';
import { appointmentService } from '../Services/appointmentService';
import { videoCallService } from '../VideoConference/videoCallService';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  getDocs,
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import VideoCall from '../VideoConference/VideoCall';
import './DoctorDashboard.css';

function DoctorDashboard() {
  const { currentUser, userData, logout } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [filter, setFilter] = useState('all');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [videoCallStatus, setVideoCallStatus] = useState({});
  const [actionLoading, setActionLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [showChatHistory, setShowChatHistory] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    let unsubscribe = null;

    const loadVideoCallStatus = async (appointmentsData) => {
      const statusMap = {};
      
      // Use Promise.all to wait for all video call status checks
      const statusPromises = appointmentsData.map(async (appointment) => {
        try {
          const room = await videoCallService.getMeetingRoomOnce(appointment.id);
          statusMap[appointment.id] = room?.status || 'none';
        } catch (error) {
          console.error(`Error loading video status for appointment ${appointment.id}:`, error);
          statusMap[appointment.id] = 'none';
        }
      });
      
      await Promise.all(statusPromises);
      setVideoCallStatus(statusMap);
    };

    const setupAppointmentsListener = () => {
      try {
        console.log('Setting up appointments listener for doctor:', currentUser.uid);
        
        const q = query(
          collection(db, 'appointments'), 
          where('doctorId', '==', currentUser.uid)
        );
        
        unsubscribe = onSnapshot(q, async (querySnapshot) => {
          const appointmentsData = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            appointmentsData.push({
              id: doc.id,
              ...data,
              appointmentDate: data.appointmentDate?.toDate 
                ? data.appointmentDate.toDate() 
                : new Date(data.appointmentDate)
            });
          });
          
          // Sort client-side in JavaScript instead of Firestore
          appointmentsData.sort((a, b) => {
            const dateA = new Date(a.appointmentDate);
            const dateB = new Date(b.appointmentDate);
            return dateA - dateB;  // Ascending order
          });
          
          console.log('Appointments loaded and sorted:', appointmentsData.length);
          setAppointments(appointmentsData);
          setLoading(false);
          
          // Load video call status for all appointments
          await loadVideoCallStatus(appointmentsData);
        }, (error) => {
          console.error('Error in appointments listener:', error);
          setLoading(false);
        });
      } catch (error) {
        console.error('Error setting up appointments listener:', error);
        setLoading(false);
      }
    };

    setupAppointmentsListener();

    // Set up interval to check for video call status updates
    const videoCallInterval = setInterval(() => {
      if (appointments.length > 0) {
        loadVideoCallStatus(appointments);
      }
    }, 30000); // Check every 30 seconds

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      clearInterval(videoCallInterval);
    };
  }, [currentUser]);

  const handleAppointmentAction = async (action) => {
    if (!selectedAppointment) return;

    try {
      setActionLoading(true);
      
      if (action === 'confirm') {
        await appointmentService.updateAppointmentStatus(
          selectedAppointment.id, 
          'confirmed', 
          doctorNotes
        );
        setFilter('confirmed');
      } else if (action === 'cancel') {
        await appointmentService.updateAppointmentStatus(
          selectedAppointment.id, 
          'cancelled', 
          doctorNotes
        );
        setFilter('cancelled');
      } else if (action === 'complete') {
        await appointmentService.updateAppointmentStatus(
          selectedAppointment.id, 
          'completed', 
          doctorNotes
        );
        setFilter('completed');
      }
      
      setSelectedAppointment(null);
      setDoctorNotes('');
      setActionLoading(false);
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert('Failed to update appointment. Please try again.');
      setActionLoading(false);
    }
  };

  const approveVideoCall = async (appointmentId) => {
    try {
      await videoCallService.approveVideoCall(appointmentId);
      
      // Update the appointment to enable video call
      const appointmentRef = doc(db, 'appointments', appointmentId);
      await updateDoc(appointmentRef, {
        videoCallEnabled: true,
        videoCallApprovedAt: new Date()
      });
      
      alert('Video call approved! Patient can now join the call.');
      
      // Update local state
      setVideoCallStatus(prev => ({
        ...prev,
        [appointmentId]: 'approved'
      }));
      
      if (selectedAppointment && selectedAppointment.id === appointmentId) {
        setSelectedAppointment(prev => ({
          ...prev,
          videoCallEnabled: true
        }));
      }
    } catch (error) {
      console.error('Error approving video call:', error);
      alert('Error approving video call');
    }
  };

  const startVideoCall = async (appointment) => {
    try {
      const room = await videoCallService.getMeetingRoomOnce(appointment.id);
      
      if (!room) {
        alert('No video call room found for this appointment.');
        return;
      }

      if (room.status === 'pending') {
        alert('Please approve the video call request first.');
        return;
      }

      if (room.status === 'approved' || room.status === 'active') {
        setSelectedAppointment(appointment);
        setShowVideoCall(true);
      } else if (room.status === 'ended') {
        alert('This video call has already ended.');
      }
    } catch (error) {
      console.error('Error checking video call status:', error);
      alert('Error checking video call status. Please try again.');
    }
  };

  const getVideoCallButton = (appointment) => {
    const status = videoCallStatus[appointment.id];
    
    if (!status || status === 'none') {
      return null;
    }

    if (status === 'pending') {
      return (
        <button 
          className="approve-video-btn"
          onClick={() => approveVideoCall(appointment.id)}
        >
          Approve Video Call
        </button>
      );
    }

    if (status === 'approved' || status === 'active') {
      return (
        <button 
          className="join-video-btn"
          onClick={() => startVideoCall(appointment)}
        >
          Join Video Call
        </button>
      );
    }

    if (status === 'ended') {
      return (
        <button className="ended-video-btn" disabled>
          Call Ended
        </button>
      );
    }

    return null;
  };

  const handleViewChatHistory = async (appointment) => {
    try {
      const chatHistoryData = await videoCallService.getChatHistory(appointment.id);
      setChatHistory(chatHistoryData);
      setShowChatHistory(true);
      setSelectedAppointment(appointment);
    } catch (error) {
      console.error('Error loading chat history:', error);
      alert('Error loading chat history. Please try again.');
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    if (filter === 'all') return true;
    return appointment.status === filter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ff9800';
      case 'confirmed': return '#4caf50';
      case 'cancelled': return '#f44336';
      case 'completed': return '#2196f3';
      default: return '#9e9e9e';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'confirmed': return 'Confirmed';
      case 'cancelled': return 'Cancelled';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return dateObj.toLocaleDateString('en-IN', {
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

  const getAppointmentStats = () => {
    const stats = {
      pending: appointments.filter(a => a.status === 'pending').length,
      confirmed: appointments.filter(a => a.status === 'confirmed').length,
      completed: appointments.filter(a => a.status === 'completed').length,
      total: appointments.length,
      videoRequests: appointments.filter(a => 
        videoCallStatus[a.id] === 'pending'
      ).length
    };
    return stats;
  };

  const ChatHistoryModal = () => (
    <div className="chat-history-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h4>Chat History - {selectedAppointment?.patientName}</h4>
          <button className="close-btn" onClick={() => setShowChatHistory(false)}>✕</button>
        </div>
        <div className="messages-container">
          {chatHistory.length === 0 ? (
            <div className="no-messages">
              <p>No chat messages found</p>
            </div>
          ) : (
            chatHistory.map((message) => (
              <div
                key={message.id}
                className={`message ${message.senderRole === 'doctor' ? 'own-message' : 'other-message'}`}
              >
                <div className="message-header">
                  <span className="sender-name">{message.senderName}</span>
                  <span className="message-time">{message.displayTime}</span>
                </div>
                <div className="message-content">
                  {message.type === "text" ? (
                    message.content
                  ) : (
                    <div className="file-message">
                      <div className="file-icon">📎</div>
                      <div className="file-info">
                        <div className="file-name">{message.fileName}</div>
                        <div className="file-details">
                          <span>{message.fileType}</span>
                          <span>{message.fileSize} bytes</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="modal-actions">
          <button className="close-modal-btn" onClick={() => setShowChatHistory(false)}>
            Close
          </button>
        </div>
      </div>
    </div>
  );

  if (!currentUser || userData?.role !== 'doctor') {
    return (
      <div className="dashboard-container">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>This page is only accessible to doctors.</p>
          <p>Please log in with a doctor account to access the dashboard.</p>
        </div>
      </div>
    );
  }

  const stats = getAppointmentStats();

  return (
    <div className="dashboard-container">
      {showVideoCall && selectedAppointment && (
        <VideoCall
          appointment={selectedAppointment}
          userRole="doctor"
          onClose={() => setShowVideoCall(false)}
        />
      )}

      {showChatHistory && <ChatHistoryModal />}

      <div className="dashboard-header">
        <div className="header-left">
          <div className="title-block">
            <h1>👨‍⚕️ Doctor Dashboard</h1>
            <p>Welcome, Dr. {userData?.firstName} {userData?.lastName}</p>
          </div>
          <div className="stats">
            <div className="stat-item">
              <span className="stat-number">{stats.pending}</span>
              <span className="stat-label">Pending</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.confirmed}</span>
              <span className="stat-label">Confirmed</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.completed}</span>
              <span className="stat-label">Completed</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.videoRequests}</span>
              <span className="stat-label">Video Requests</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.total}</span>
              <span className="stat-label">Total</span>
            </div>
          </div>
        </div>
        <button className="logout-btn" onClick={logout} disabled={actionLoading}>
          {actionLoading ? 'Processing...' : 'Logout'}
        </button>
      </div>

      <div className="dashboard-content">
        {/* Appointments Sidebar */}
        <div className="appointments-sidebar">
          <div className="sidebar-header">
            <h3>Appointments</h3>
            <div className="filter-tabs">
              <button 
                className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
                onClick={() => setFilter('pending')}
              >
                Pending ({stats.pending})
              </button>
              <button 
                className={`filter-tab ${filter === 'confirmed' ? 'active' : ''}`}
                onClick={() => setFilter('confirmed')}
              >
                Confirmed ({stats.confirmed})
              </button>
              <button 
                className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All ({stats.total})
              </button>
            </div>
          </div>

          <div className="appointments-list">
            {loading ? (
              <div className="loading">
                <div className="loading-spinner"></div>
                <p>Loading appointments...</p>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="no-appointments">
                <p>📭 No {filter !== 'all' ? filter : ''} appointments found</p>
                <small>When patients book appointments with you, they will appear here.</small>
              </div>
            ) : (
              filteredAppointments.map(appointment => (
                <div 
                  key={appointment.id}
                  className={`appointment-item ${selectedAppointment?.id === appointment.id ? 'selected' : ''}`}
                  onClick={() => setSelectedAppointment(appointment)}
                >
                  <div className="appointment-header">
                    <h4>{appointment.patientName || 'Unknown Patient'}</h4>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(appointment.status), marginTop: 0, marginLeft: 10 }}
                    >
                      {getStatusText(appointment.status)}
                    </span>
                  </div>
                  <p className="appointment-service">
                    {appointment.serviceName || 'General Consultation'}
                  </p>
                  <p className="appointment-date">
                    {formatDate(appointment.appointmentDate)}
                  </p>
                  <p className="appointment-reason">
                    {appointment.reason || 'No reason provided'}
                  </p>
                  
                  {/* Video Call Status */}
                  {videoCallStatus[appointment.id] && videoCallStatus[appointment.id] !== 'none' && (
                    <div className="video-call-indicator">
                      <span className={`video-status ${videoCallStatus[appointment.id]}`}>
                        {videoCallStatus[appointment.id] === 'pending' && 'Requested'}
                        {videoCallStatus[appointment.id] === 'approved' && 'Approved'}
                        {videoCallStatus[appointment.id] === 'active' && 'Live'}
                        {videoCallStatus[appointment.id] === 'ended' && 'Ended'}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Appointment Details */}
        <div className="appointment-details">
          {selectedAppointment ? (
            <div className="details-card">
              <h3>Appointment Details</h3>
              
              <div className="detail-section">
                <h4>Patient Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Name:</label>
                    <span>{selectedAppointment.patientName}</span>
                  </div>
                  <div className="detail-item">
                    <label>Email:</label>
                    <span>{selectedAppointment.patientEmail}</span>
                  </div>
                  <div className="detail-item">
                    <label>Phone:</label>
                    <span>{selectedAppointment.patientPhone || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>Appointment Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Service:</label>
                    <span>{selectedAppointment.serviceName}</span>
                  </div>
                  <div className="detail-item">
                    <label>Date & Time:</label>
                    <span>{formatDate(selectedAppointment.appointmentDate)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Reason:</label>
                    <span>{selectedAppointment.reason}</span>
                  </div>
                  <div className="detail-item">
                    <label>Symptoms:</label>
                    <span>{selectedAppointment.symptoms || 'Not provided'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Status:</label>
                    <span className="status-badge" style={{ backgroundColor: getStatusColor(selectedAppointment.status), textAlign: 'center' }}>
                      {getStatusText(selectedAppointment.status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Video Call Section */}
              <div className="detail-section">
                <h4>Video Consultation</h4>
                <div className="video-call-actions">
                  {getVideoCallButton(selectedAppointment) || (
                    <p className="video-call-info">
                      No video call requested by patient.
                    </p>
                  )}
                  
                  {/* Video Call History */}
                  {(videoCallStatus[selectedAppointment.id] === 'ended' || selectedAppointment.videoCallEnabled) && (
                    <div className="video-call-history">
                      <h5>Video Call History</h5>
                      <button 
                        className="view-messages-btn"
                        onClick={() => handleViewChatHistory(selectedAppointment)}
                      >
                        View Chat History
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {(selectedAppointment.status === 'pending' || selectedAppointment.status === 'confirmed') && (
                <div className="action-section">
                  <h4>Appointment Actions</h4>
                  <textarea
                    className="notes-input"
                    placeholder={
                      selectedAppointment.status === 'pending' 
                        ? "Add notes or reason for action (optional)..." 
                        : "Add consultation notes..."
                    }
                    value={doctorNotes}
                    onChange={(e) => setDoctorNotes(e.target.value)}
                    disabled={actionLoading}
                  />
                  <div className="action-buttons">
                    {selectedAppointment.status === 'pending' && (
                      <>
                        <button 
                          className="confirm-btn"
                          onClick={() => handleAppointmentAction('confirm')}
                          disabled={actionLoading}
                        >
                          {actionLoading ? 'Processing...' : 'Confirm Appointment'}
                        </button>
                        <button 
                          className="cancel-btn"
                          onClick={() => handleAppointmentAction('cancel')}
                          disabled={actionLoading}
                        >
                          {actionLoading ? 'Processing...' : 'Cancel Appointment'}
                        </button>
                      </>
                    )}
                    {selectedAppointment.status === 'confirmed' && (
                      <button 
                        className="complete-btn"
                        onClick={() => handleAppointmentAction('complete')}
                        disabled={actionLoading}
                      >
                        {actionLoading ? 'Processing...' : 'Mark as Completed'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {selectedAppointment.doctorNotes && (
                <div className="detail-section">
                  <h4>Doctor Notes</h4>
                  <p className="doctor-notes">{selectedAppointment.doctorNotes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="no-selection">
              <div className="no-selection-icon">👆</div>
              <h3>Select an Appointment</h3>
              <p>Click on any appointment from the list to view details and take actions.</p>
              <p><small>You can confirm, cancel appointments, or manage video calls.</small></p>
              
              <div className="quick-stats">
                <h4>Today's Overview</h4>
                <div className="stats-grid">
                  <div className="quick-stat">
                    <span className="stat-value">{stats.pending}</span>
                    <span className="stat-label">Pending</span>
                  </div>
                  <div className="quick-stat">
                    <span className="stat-value">{stats.confirmed}</span>
                    <span className="stat-label">Confirmed</span>
                  </div>
                  <div className="quick-stat">
                    <span className="stat-value">{stats.videoRequests}</span>
                    <span className="stat-label">Video Requests</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DoctorDashboard;