// src/services/videoCallService.js - FIXED VERSION
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase/config";

export const videoCallService = {
  // Create meeting room with Jitsi
  async createMeetingRoom(appointmentId, doctorName, patientName) {
    try {
      // Generate Jitsi room name
      const roomName = `appointment_${appointmentId}_${Date.now()}`;
      const roomUrl = `https://meet.jit.si/${roomName}`;
      
      const roomRef = doc(db, "videoRooms", appointmentId);

      await setDoc(roomRef, {
        appointmentId,
        doctorName,
        patientName,
        roomName,
        roomUrl,
        status: "pending",
        createdAt: serverTimestamp(),
        jitsiRoomName: roomName
      });

      return { id: appointmentId, roomUrl, roomName };
    } catch (error) {
      console.error("Error creating meeting room:", error);
      throw error;
    }
  },

  // Get meeting room with real-time updates
  getMeetingRoom(appointmentId, onUpdate) {
    try {
      if (!appointmentId) {
        console.error('Appointment ID is required');
        return () => {};
      }
      
      if (typeof onUpdate !== 'function') {
        console.error('onUpdate callback must be a function');
        return () => {};
      }

      const roomRef = doc(db, "videoRooms", appointmentId);
      
      const unsubscribe = onSnapshot(roomRef, 
        (snapshot) => {
          try {
            if (snapshot.exists()) {
              onUpdate(snapshot.data());
            } else {
              onUpdate(null);
            }
          } catch (callbackError) {
            console.error('Error in onUpdate callback:', callbackError);
          }
        },
        (error) => {
          console.error("Error in room listener:", error);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error("Error setting up room listener:", error);
      return () => {};
    }
  },

  // Get meeting room once (for checking status)
  async getMeetingRoomOnce(appointmentId) {
    try {
      if (!appointmentId) {
        console.error('Appointment ID is required');
        return null;
      }

      const roomRef = doc(db, "videoRooms", appointmentId);
      const snapshot = await getDoc(roomRef);
      return snapshot.exists() ? snapshot.data() : null;
    } catch (error) {
      console.error("Error getting meeting room:", error);
      return null;
    }
  },

  async approveVideoCall(appointmentId) {
    try {
      if (!appointmentId) {
        throw new Error('Appointment ID is required');
      }

      const roomRef = doc(db, "videoRooms", appointmentId);
      await updateDoc(roomRef, { 
        status: "approved",
        approvedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error approving video call:", error);
      throw error;
    }
  },

  async startVideoCall(appointmentId) {
    try {
      if (!appointmentId) {
        throw new Error('Appointment ID is required');
      }

      const roomRef = doc(db, "videoRooms", appointmentId);
      await updateDoc(roomRef, { 
        status: "active",
        startedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error starting video call:", error);
      throw error;
    }
  },

  async endVideoCall(appointmentId) {
    try {
      if (!appointmentId) {
        throw new Error('Appointment ID is required');
      }

      const roomRef = doc(db, "videoRooms", appointmentId);
      await updateDoc(roomRef, { 
        status: "ended",
        endedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error ending video call:", error);
      throw error;
    }
  },

  // Enhanced Jitsi Meet Integration with Better Error Handling
  initializeJitsiMeet(container, roomName, userDisplayName, mediaPermissions = { video: true, audio: true }) {
    // Check if container exists
    if (!container || !roomName) {
      console.error("Container and room name are required");
      return null;
    }

    // Clear container first
    container.innerHTML = '';

    try {
      // Check if Jitsi API is available
      if (!window.JitsiMeetExternalAPI) {
        console.warn("Jitsi Meet External API not loaded, showing fallback");
        return this.showFallbackVideoInterface(container, roomName, userDisplayName);
      }

      console.log('Initializing Jitsi with room:', roomName);

      // Simple configuration for better compatibility
      const options = {
        roomName: roomName,
        width: '100%',
        height: '100%',
        parentNode: container,
        userInfo: {
          displayName: userDisplayName || 'User'
        },
        configOverwrite: {
          startWithAudioMuted: !mediaPermissions.audio,
          startWithVideoMuted: !mediaPermissions.video,
          prejoinPageEnabled: false,
          enableWelcomePage: false,
          disableModeratorIndicator: true,
          enableNoAudioDetection: true,
          enableNoisyMicDetection: true,
          resolution: 720,
          constraints: {
            video: {
              height: { ideal: 720 },
              width: { ideal: 1280 }
            }
          }
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'profile', 'chat', 'settings',
            'videoquality', 'filmstrip', 'feedback', 'stats'
          ],
          SETTINGS_SECTIONS: ['devices', 'language'],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
        }
      };

      const api = new window.JitsiMeetExternalAPI('meet.jit.si', options);
      
      // Set iframe permissions
      if (api._iframe) {
        api._iframe.setAttribute('allow', 'camera; microphone; display-capture; autoplay; fullscreen');
        api._iframe.style.border = 'none';
        api._iframe.style.borderRadius = '8px';
      }
      
      console.log('Jitsi Meet initialized successfully');
      return api;
      
    } catch (error) {
      console.error('Error initializing Jitsi Meet:', error);
      // Fallback to external link
      return this.showFallbackVideoInterface(container, roomName, userDisplayName);
    }
  },

  // Show fallback interface when Jitsi fails
  showFallbackVideoInterface(container, roomName, userDisplayName) {
    try {
      if (!container) {
        console.error('Container not available for fallback interface');
        return null;
      }

      // Create a fallback interface with connection instructions
      const fallbackHTML = `
        <div style="padding: 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center;">
          <div style="font-size: 4rem; margin-bottom: 20px;">📹</div>
          <h3 style="margin: 0 0 15px 0; font-size: 1.5rem; text-align: center;">Video Call Setup Required</h3>
          <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px; margin: 20px 0; width: 90%; max-width: 400px;">
            <p style="margin: 10px 0; word-break: break-all;"><strong>Room:</strong> ${roomName}</p>
            <p style="margin: 10px 0;"><strong>Your Name:</strong> ${userDisplayName}</p>
          </div>
          <div style="text-align: center; margin: 20px 0;">
            <h4 style="margin-bottom: 15px;">To join the video call:</h4>
            <ol style="text-align: left; margin: 0 auto; padding-left: 20px; display: inline-block;">
              <li style="margin-bottom: 10px;">Click the button below to open Jitsi Meet</li>
              <li style="margin-bottom: 10px;">Enter your name: <strong>${userDisplayName}</strong></li>
              <li style="margin-bottom: 10px;">Allow camera and microphone access</li>
              <li style="margin-bottom: 10px;">Click "Join Meeting"</li>
            </ol>
          </div>
          <div style="margin-top: 25px;">
            <button onclick="window.open('https://meet.jit.si/${roomName}', '_blank', 'width=1200,height=800')" 
                    style="background: #ffd700; color: #000; border: none; padding: 12px 30px; border-radius: 25px; font-weight: bold; cursor: pointer; font-size: 1rem;">
              🚀 Open Video Call in New Window
            </button>
          </div>
          <div style="margin-top: 20px; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 8px; width: 90%; max-width: 400px;">
            <p style="margin: 0; font-size: 0.9rem; opacity: 0.9;">
              <strong>Share this link:</strong><br>
              <code style="background: rgba(0,0,0,0.3); padding: 5px 10px; border-radius: 4px; word-break: break-all; font-size: 0.8rem;">
                https://meet.jit.si/${roomName}
              </code>
            </p>
          </div>
        </div>
      `;
      
      container.innerHTML = fallbackHTML;
      console.log('Fallback interface created successfully');
      
      return {
        isFallback: true,
        roomName: roomName,
        roomUrl: `https://meet.jit.si/${roomName}`
      };
      
    } catch (error) {
      console.error('Error creating fallback interface:', error);
      if (container) {
        container.innerHTML = `
          <div style="padding: 40px; text-align: center; color: #666;">
            <h3>Video Call Setup</h3>
            <p>Please visit:</p>
            <p><strong>https://meet.jit.si/${roomName}</strong></p>
            <button onclick="window.open('https://meet.jit.si/${roomName}', '_blank')" 
                    style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-top: 20px;">
              Open Video Call
            </button>
          </div>
        `;
      }
      return null;
    }
  },

  // Load Jitsi API dynamically with better error handling
  loadJitsiAPI() {
    return new Promise((resolve, reject) => {
      if (window.JitsiMeetExternalAPI) {
        console.log('Jitsi Meet External API already loaded');
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = () => {
        console.log('Jitsi Meet External API loaded successfully');
        resolve();
      };
      script.onerror = (error) => {
        console.warn('Failed to load Jitsi Meet External API, using fallback mode');
        // Don't reject, just resolve so the app continues
        resolve();
      };
      
      // Add to document
      document.head.appendChild(script);
      
      // Timeout fallback
      setTimeout(() => {
        if (!window.JitsiMeetExternalAPI) {
          console.warn('Jitsi API load timeout, continuing with fallback');
          resolve();
        }
      }, 5000);
    });
  },

  destroyJitsiMeet(api) {
    if (!api) return;
    
    try {
      if (typeof api.dispose === 'function') {
        api.dispose();
        console.log('Jitsi Meet destroyed successfully');
      }
    } catch (error) {
      console.warn('Error destroying Jitsi Meet:', error);
    }
  },

  // 💬 Messaging System
  async sendTextMessage(appointmentId, senderName, senderRole, content) {
    try {
      if (!appointmentId || !content) {
        throw new Error('Appointment ID and content are required');
      }

      const messagesRef = collection(db, "videoRooms", appointmentId, "messages");
      await addDoc(messagesRef, {
        senderName: senderName || 'Unknown User',
        senderRole: senderRole || 'user',
        content: content.trim(),
        type: "text",
        timestamp: serverTimestamp(),
      });

      console.log('Text message sent successfully');
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  },

  async sendFileMessage(appointmentId, senderName, senderRole, fileContent, fileName, fileType, fileSize) {
    try {
      if (!appointmentId || !fileContent) {
        throw new Error('Appointment ID and file content are required');
      }

      const messagesRef = collection(db, "videoRooms", appointmentId, "messages");
      await addDoc(messagesRef, {
        senderName: senderName || 'Unknown User',
        senderRole: senderRole || 'user',
        type: "file",
        fileUrl: fileContent,
        fileName: fileName || 'Unknown File',
        fileType: fileType || 'application/octet-stream',
        fileSize: fileSize || 0,
        timestamp: serverTimestamp(),
      });

      console.log('File message sent successfully');
    } catch (error) {
      console.error("Error sending file message:", error);
      throw error;
    }
  },

  getMessages(appointmentId, onUpdate) {
    try {
      if (!appointmentId) {
        console.error('Appointment ID is required');
        return () => {};
      }
      
      if (typeof onUpdate !== 'function') {
        console.error('onUpdate callback must be a function');
        return () => {};
      }

      const messagesRef = collection(db, "videoRooms", appointmentId, "messages");
      const q = query(messagesRef, orderBy("timestamp", "asc"));
      
      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          try {
            const msgs = snapshot.docs.map((doc) => ({ 
              id: doc.id, 
              ...doc.data(),
              displayTime: doc.data().timestamp?.toDate ? 
                doc.data().timestamp.toDate().toLocaleTimeString() : 
                new Date().toLocaleTimeString()
            }));
            onUpdate(msgs);
          } catch (callbackError) {
            console.error('Error in onUpdate callback:', callbackError);
          }
        },
        (error) => {
          console.error("Error in messages listener:", error);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error("Error setting up messages listener:", error);
      return () => {};
    }
  },

  // Get chat history with enhanced error handling
  async getChatHistory(appointmentId) {
    try {
      if (!appointmentId) {
        console.warn('No appointment ID provided for chat history');
        return [];
      }

      const messagesRef = collection(db, "videoRooms", appointmentId, "messages");
      const q = query(messagesRef, orderBy("timestamp", "asc"));
      const snapshot = await getDocs(q);
      
      const chatHistory = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fullDate: doc.data().timestamp?.toDate ? 
          doc.data().timestamp.toDate().toLocaleString() : 
          new Date().toLocaleString(),
        displayTime: doc.data().timestamp?.toDate ? 
          doc.data().timestamp.toDate().toLocaleTimeString() : 
          new Date().toLocaleTimeString()
      }));

      console.log(`Retrieved ${chatHistory.length} messages for appointment ${appointmentId}`);
      return chatHistory;
    } catch (error) {
      console.error("Error getting chat history:", error);
      return [];
    }
  },

  // 🩺 Doctor Notes - Store in appointments collection
  async saveDoctorNotes(appointmentId, notes) {
    try {
      if (!appointmentId) {
        throw new Error('Appointment ID is required');
      }

      const appointmentRef = doc(db, "appointments", appointmentId);
      await updateDoc(appointmentRef, { 
        doctorNotes: notes || '',
        notesUpdatedAt: serverTimestamp()
      });

      console.log('Doctor notes saved successfully');
    } catch (error) {
      console.error("Error saving doctor notes:", error);
      throw error;
    }
  },

  async getDoctorNotes(appointmentId) {
    try {
      if (!appointmentId) {
        return "";
      }

      const appointmentRef = doc(db, "appointments", appointmentId);
      const snap = await getDoc(appointmentRef);
      const notes = snap.exists() ? snap.data().doctorNotes || "" : "";
      
      console.log('Retrieved doctor notes:', notes ? `${notes.length} characters` : 'empty');
      return notes;
    } catch (error) {
      console.error("Error getting doctor notes:", error);
      return "";
    }
  }
};

// Preload Jitsi API when the service is imported (non-blocking)
if (typeof window !== 'undefined') {
  setTimeout(() => {
    videoCallService.loadJitsiAPI().catch(() => {
      console.log('Jitsi API preload completed (fallback mode available)');
    });
  }, 1000);
}