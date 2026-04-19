// src/components/VideoCall.js - COMPLETE FIXED VERSION
import React, { useState, useEffect, useRef } from "react";
import { videoCallService } from "./videoCallService";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import "./VideoCall.css";

const VideoCall = ({ appointment, userRole, onClose }) => {
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [notes, setNotes] = useState("");
  const [callStatus, setCallStatus] = useState("joining");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [cameraError, setCameraError] = useState(false);
  const [mediaPermissions, setMediaPermissions] = useState({ video: false, audio: false });
  
  const callContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const jitsiApiRef = useRef(null);
  const fileInputRef = useRef(null);
  const storage = getStorage();

  const appointmentId = appointment?.id;
  const doctorName = appointment?.doctorName;
  const patientName = appointment?.patientName;
  const userDisplayName = userRole === "doctor" ? doctorName : patientName;

  // Check media permissions before initializing call
  useEffect(() => {
    checkMediaPermissions();
  }, []);

  const checkMediaPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      // Check if we actually got video tracks
      const videoTracks = stream.getVideoTracks();
      const audioTracks = stream.getAudioTracks();
      
      setMediaPermissions({
        video: videoTracks.length > 0,
        audio: audioTracks.length > 0
      });

      // Stop all tracks after checking
      stream.getTracks().forEach(track => track.stop());
      
      console.log('Media permissions:', {
        video: videoTracks.length > 0,
        audio: audioTracks.length > 0
      });
    } catch (error) {
      console.warn('Media permissions error:', error);
      setMediaPermissions({ video: false, audio: false });
      setCameraError(true);
    }
  };

  // Fetch room and messages
  useEffect(() => {
    if (!appointmentId) return;

    let unsubscribeRoom = null;
    let unsubscribeMessages = null;

    const setupListeners = async () => {
      try {
        // Room listener with proper error handling
        unsubscribeRoom = videoCallService.getMeetingRoom(appointmentId, (roomData) => {
          console.log('Room update:', roomData);
          setRoom(roomData);
          if (roomData?.status === "active") {
            setCallStatus("connected");
          } else if (roomData?.status === "ended") {
            setCallStatus("ended");
          }
        });

        // Messages listener with proper error handling
        unsubscribeMessages = videoCallService.getMessages(appointmentId, (messagesData) => {
          console.log('Messages update:', messagesData);
          setMessages(messagesData);
        });

        // Load existing doctor notes
        if (userRole === "doctor") {
          const existingNotes = await videoCallService.getDoctorNotes(appointmentId);
          setNotes(existingNotes || "");
        }
      } catch (error) {
        console.error("Error setting up listeners:", error);
        setCallStatus("error");
      }
    };

    setupListeners();

    return () => {
      console.log('Cleaning up listeners');
      if (unsubscribeRoom && typeof unsubscribeRoom === 'function') {
        unsubscribeRoom();
      }
      if (unsubscribeMessages && typeof unsubscribeMessages === 'function') {
        unsubscribeMessages();
      }
    };
  }, [appointmentId, userRole]);

  // Initialize Jitsi when room is approved/active
  useEffect(() => {
    if (room && (room.status === "approved" || room.status === "active") && callContainerRef.current && callStatus == "joining") {
      initializeJitsiCall();
    }
  }, [room, callStatus]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

useEffect(() => {
  return () => {
    console.log('Cleaning up video call component...');
    
    // Use a timeout to ensure cleanup happens after React finishes unmounting
    setTimeout(() => {
      if (jitsiApiRef.current) {
        try {
          // Only dispose if it's a real Jitsi API instance with dispose method
          if (typeof jitsiApiRef.current.dispose === 'function') {
            console.log('Disposing Jitsi Meet API...');
            jitsiApiRef.current.dispose();
          } else if (jitsiApiRef.current.isFallback) {
            console.log('Cleaning up fallback interface...');
            // For fallback, just clear the container if it exists
            if (callContainerRef.current) {
              callContainerRef.current.innerHTML = '';
            }
          }
        } catch (error) {
          console.warn('Error during Jitsi cleanup:', error);
        } finally {
          jitsiApiRef.current = null;
        }
      }
    }, 0); // Short timeout to let React finish first
  };
}, []);

  const initializeJitsiCall = async () => {
    if (!room?.jitsiRoomName || !callContainerRef.current) return;

    try {
      // Check if component is still mounted
      if (!callContainerRef.current) return;
      
      // Start video call in Firestore
      await videoCallService.startVideoCall(appointmentId);
      
      // Initialize Jitsi with enhanced configuration
      jitsiApiRef.current = videoCallService.initializeJitsiMeet(
        callContainerRef.current,
        room.jitsiRoomName,
        userDisplayName,
        mediaPermissions
      );

      if (!jitsiApiRef.current) {
        throw new Error('Failed to initialize video call');
      }

      // Check if it's a real Jitsi API instance or fallback
      if (jitsiApiRef.current.isFallback) {
        console.log('Using fallback video interface');
        setCallStatus("connected");
        return;
      }

      // Only add event listeners for real Jitsi API
      if (jitsiApiRef.current.addEventListener) {
        jitsiApiRef.current.addEventListener('videoConferenceJoined', () => {
          console.log('Successfully joined the conference');
          setCallStatus("connected");
          setCameraError(false);
          
          // Try to enable video if permissions allow
          if (mediaPermissions.video) {
            setTimeout(() => {
              if (jitsiApiRef.current && jitsiApiRef.current.executeCommand) {
                jitsiApiRef.current.executeCommand('toggleVideo');
              }
            }, 1000);
          }
        });

        jitsiApiRef.current.addEventListener('cameraError', (error) => {
          console.warn('Camera error detected:', error);
          setCameraError(true);
        });

        jitsiApiRef.current.addEventListener('participantJoined', (participant) => {
          console.log('Participant joined:', participant.displayName);
        });

        jitsiApiRef.current.addEventListener('participantLeft', (participant) => {
          console.log('Participant left:', participant.displayName);
        });

        jitsiApiRef.current.addEventListener('videoConferenceLeft', () => {
          console.log('Left the video conference');
          // Don't call handleEndCall here to avoid cleanup conflicts
          setCallStatus("ended");
        });
      }

      setCallStatus("connected");
    } catch (error) {
      console.error("Error initializing Jitsi call:", error);
      setCallStatus("error");
    }
  };

  const handleApproveCall = async () => {
    try {
      await videoCallService.approveVideoCall(appointmentId);
    } catch (error) {
      console.error("Error approving call:", error);
      alert("Error approving video call");
    }
  };

  const handleSendMessage = async () => {
    if (messageText.trim() === "") return;
    
    try {
      await videoCallService.sendTextMessage(
        appointmentId,
        userDisplayName,
        userRole,
        messageText.trim()
      );
      setMessageText("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Error sending message");
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert("File too large. Max 10MB allowed.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result;

      try {
        await videoCallService.sendFileMessage(
          appointmentId,
          userDisplayName,
          userRole,
          base64Data,
          file.name,
          file.type,
          file.size
        );
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        console.error("Error sending file:", error);
        alert("Failed to send file");
      }
    };

    reader.readAsDataURL(file);
    setSelectedFile(file);
  };

  const handleSaveNotes = async () => {
    if (!notes.trim()) {
      alert("Please enter some notes before saving.");
      return;
    }

    try {
      await videoCallService.saveDoctorNotes(appointmentId, notes);
      alert("Notes saved successfully to appointment record!");
    } catch (error) {
      console.error("Error saving notes:", error);
      alert("Error saving notes. Please try again.");
    }
  };

const handleEndCall = async () => {
  try {
    // Set status to prevent re-initialization
    setCallStatus("ending");
    
    // End the call in Firestore
    await videoCallService.endVideoCall(appointmentId);
    
    // Clean up Jitsi
    if (jitsiApiRef.current) {
      try {
        if (typeof jitsiApiRef.current.dispose === 'function') {
          jitsiApiRef.current.dispose();
        } else if (jitsiApiRef.current.isFallback && callContainerRef.current) {
          callContainerRef.current.innerHTML = '';
        }
      } catch (error) {
        console.warn('Error during Jitsi cleanup:', error);
      }
      jitsiApiRef.current = null;
    }
    
    // Set final status
    setCallStatus("ended");
    
    // Auto-close after 2 seconds
    setTimeout(() => {
      if (onClose) onClose();
    }, 2000);
    
  } catch (error) {
    console.error("Error ending call:", error);
    setCallStatus("error");
  }
};

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleViewChatHistory = async () => {
    try {
      const history = await videoCallService.getChatHistory(appointmentId);
      setChatHistory(history);
      setShowChatHistory(true);
    } catch (error) {
      console.error("Error loading chat history:", error);
      alert("Error loading chat history");
    }
  };

  const retryCamera = async () => {
    setCameraError(false);
    await checkMediaPermissions();
    
    if (jitsiApiRef.current && jitsiApiRef.current.executeCommand && mediaPermissions.video) {
      try {
        jitsiApiRef.current.executeCommand('toggleVideo');
      } catch (error) {
        console.error('Error enabling video:', error);
      }
    }
  };

  const handleClose = () => {
  // Just close without complex cleanup - let browser handle it
  if (jitsiApiRef.current && typeof jitsiApiRef.current.dispose === 'function') {
    try {
      jitsiApiRef.current.dispose();
    } catch (error) {
      console.warn('Jitsi dispose error (safe to ignore):', error);
    }
  }
  onClose();
};

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const ChatHistoryModal = () => (
    <div className="chat-history-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h4>Chat History</h4>
          <button className="close-btn" onClick={() => setShowChatHistory(false)}>✕</button>
        </div>
        <div className="messages-container">
          {chatHistory.length === 0 ? (
            <div className="no-messages">
              <p>No chat history found</p>
            </div>
          ) : (
            chatHistory.map((message) => (
              <div
                key={message.id}
                className={`message ${
                  message.senderRole === userRole ? "own-message" : "other-message"
                }`}
              >
                <div className="message-header">
                  <span className="sender-name">{message.senderName}</span>
                  <span className="message-time">{message.fullDate}</span>
                </div>
                <div className="message-content">
                  {message.type === "text" ? (
                    message.content
                  ) : (
                    <div className="file-message" onClick={() => window.open(message.fileUrl, '_blank')}>
                      <div className="file-icon">📎</div>
                      <div className="file-info">
                        <div className="file-name">{message.fileName}</div>
                        <div className="file-details">
                          <span>{message.fileType}</span>
                          <span>{formatFileSize(message.fileSize)}</span>
                        </div>
                        <div className="download-hint">Click to download</div>
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

  if (!appointment) {
    return (
      <div className="video-call-container">
        <div className="call-error-message">
          <h4>No Appointment Selected</h4>
          <p>Please select an appointment to start a video call.</p>
          <button className="retry-btn" onClick={handleClose}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="video-call-container">
      {showChatHistory && <ChatHistoryModal />}
      
      {/* Camera Error Banner */}
      {cameraError && (
        <div className="camera-warning-banner">
          <div className="warning-icon">⚠️</div>
          <div className="warning-content">
            <h5>Camera Access Required</h5>
            <p>Please allow camera access to see {userRole === 'doctor' ? 'your patient' : 'your doctor'}. 
               Check your browser permissions and ensure no other app is using your camera.</p>
          </div>
          <div className="warning-actions">
            <button className="retry-camera-btn" onClick={retryCamera}>
              Retry Camera
            </button>
            <button 
              className="dismiss-warning-btn"
              onClick={() => setCameraError(false)}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="video-call-header">
        <h3>Video Consultation</h3>
        <div className="call-info">
          <span>Appointment: {appointmentId}</span>
          <span className={`call-status ${callStatus}`}>
            {callStatus.toUpperCase()}
          </span>
          <span className="media-status">
            {mediaPermissions.video ? '📹' : '❌'} Camera
            {mediaPermissions.audio ? '🎤' : '❌'} Mic
          </span>
        </div>
        <button className="close-btn" onClick={handleClose}>✕</button>
      </div>

      {/* Main Content */}
      <div className="video-call-content">
        {/* Video Section */}
        <div className="video-section">
          <div className="call-frame-container" ref={callContainerRef}>
            {(!room || room.status === "pending") && (
              <div className="call-pending-approval">
                <div className="placeholder-icon">📹</div>
                <h4>Video Call Pending Approval</h4>
                <p>Waiting for doctor to approve the video call request.</p>
                {userRole === "doctor" && (
                  <button className="approve-call-btn" onClick={handleApproveCall}>
                    Approve Video Call
                  </button>
                )}
              </div>
            )}
            
            {callStatus === "error" && (
              <div className="call-error-message">
                <h4>Connection Error</h4>
                <p>Failed to connect to video call. Please try again.</p>
                <button className="retry-btn" onClick={initializeJitsiCall}>
                  Retry Connection
                </button>
              </div>
            )}

            {callStatus === "ended" && (
              <div className="call-ended-message">
                <h4>Call Ended</h4>
                <p>The video consultation has ended.</p>
                    <p style={{fontSize: '0.9rem', color: '#666', marginTop: '10px'}}>
      Returning to profile...
    </p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Section */}
        <div className="chat-section">
          <div className="chat-header">
            <h4>Chat</h4>
            <span className="message-count">{messages.length} messages</span>
          </div>
          
          <div className="messages-container">
            {messages.length === 0 ? (
              <div className="no-messages">
                <p>No messages yet</p>
                <small>Start the conversation</small>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`message ${
                    message.senderRole === userRole ? "own-message" : "other-message"
                  }`}
                >
                  <div className="message-header">
                    <span className="sender-name">{message.senderName}</span>
                    <span className="message-time">{message.displayTime}</span>
                  </div>
                  
                  <div className="message-content">
                    {message.type === "text" ? (
                      message.content
                    ) : (
                      <div className="file-message" onClick={() => window.open(message.fileUrl, '_blank')}>
                        <div className="file-icon">📎</div>
                        <div className="file-info">
                          <div className="file-name">{message.fileName}</div>
                          <div className="file-details">
                            <span>{message.fileType}</span>
                            <span>{formatFileSize(message.fileSize)}</span>
                          </div>
                          <div className="download-hint">Click to download</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-section">
            <div className="message-input">
              <input
                type="text"
                placeholder="Type a message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={callStatus === "ended"}
              />
              <button 
                className="send-btn" 
                onClick={handleSendMessage}
                disabled={!messageText.trim() || callStatus === "ended"}
              >
                Send
              </button>
            </div>
            
            <div className="file-upload">
              <input
                type="file"
                id="file-upload"
                ref={fileInputRef}
                onChange={handleFileUpload}
                disabled={uploading || callStatus === "ended"}
                style={{ display: 'none' }}
                accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt"
              />
              <label 
                htmlFor="file-upload" 
                className={`file-upload-btn ${uploading ? 'uploading' : ''}`}
              >
                {uploading ? '📤 Uploading...' : '📎 Attach File (Images, PDF, Docs)'}
              </label>
              {selectedFile && (
                <span className="selected-file">
                  {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              )}
            </div>

            {/* Video Call History Section */}
            {(room?.status === "ended" || callStatus === "ended") && (
              <div className="video-call-history">
                <button 
                  className="view-messages-btn"
                  onClick={handleViewChatHistory}
                >
                  📨 View Chat History
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Doctor Notes Section */}
        {userRole === "doctor" && (
          <div className="notes-section">
            <div className="notes-header">
              <h4>Doctor Notes</h4>
              <span className="notes-hint">
                Notes are saved to the appointment record and visible to patients
              </span>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter consultation notes, diagnosis, prescription, or follow-up instructions..."
              rows="6"
              disabled={callStatus === "ended"}
            />
            <div className="notes-actions">
              <button 
                className="save-notes-btn"
                onClick={handleSaveNotes}
                disabled={!notes.trim() || callStatus === "ended"}
              >
                💾 Save Notes to Appointment
              </button>
              <span className="notes-length">{notes.length}/2000 characters</span>
            </div>
          </div>
        )}
      </div>

      {/* Call Actions */}
      <div className="call-actions">
        <button 
          className="end-call-btn"
          onClick={handleEndCall}
          disabled={callStatus === "ended" || callStatus === "ending"}
        >
          {callStatus === "ended" ? "Call Ended" : callStatus === "ending" ? "Ending Call..." : "End Call"}
        </button>
      </div>
    </div>
  );
};

export default VideoCall;