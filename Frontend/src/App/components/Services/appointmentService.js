import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp,
  getDoc,
  setDoc,
  onSnapshot,
  deleteField
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { videoCallService } from '../VideoConference/videoCallService';

export const appointmentService = {
  // Book a new appointment
  bookAppointment: async (appointmentData) => {
    try {
      const appointmentsRef = collection(db, 'appointments');
      const appointmentDoc = await addDoc(appointmentsRef, {
        ...appointmentData,
        status: 'pending', // pending, confirmed, cancelled, completed
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        videoCallEnabled: false,
        messages: [],
        doctorNotes: ''
      });
      
      // Store in localStorage for demo persistence
      const localAppointments = JSON.parse(localStorage.getItem('appointments') || '{}');
      localAppointments[appointmentDoc.id] = {
        ...appointmentData,
        id: appointmentDoc.id,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        videoCallEnabled: false
      };
      localStorage.setItem('appointments', JSON.stringify(localAppointments));
      
      return appointmentDoc.id;
    } catch (error) {
      console.error('Error booking appointment:', error);
      throw error;
    }
  },

  // Get appointments for a patient
  getPatientAppointments: async (patientId) => {
    try {
      // First try Firebase
      const appointmentsRef = collection(db, 'appointments');
      const q = query(
        appointmentsRef, 
        where('patientId', '==', patientId),
        orderBy('appointmentDate', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      let appointments = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Also check localStorage for demo persistence
      const localAppointments = JSON.parse(localStorage.getItem('appointments') || '{}');
      const localPatientAppointments = Object.values(localAppointments)
        .filter(apt => apt.patientId === patientId)
        .map(apt => ({
          ...apt,
          appointmentDate: apt.appointmentDate?.toDate ? apt.appointmentDate.toDate() : new Date(apt.appointmentDate)
        }));

      // Merge and remove duplicates
      const allAppointments = [...appointments, ...localPatientAppointments];
      const uniqueAppointments = allAppointments.filter((apt, index, self) =>
        index === self.findIndex(a => a.id === apt.id)
      );

      return uniqueAppointments;
    } catch (error) {
      console.error('Error fetching patient appointments:', error);
      
      // Fallback to localStorage
      const localAppointments = JSON.parse(localStorage.getItem('appointments') || '{}');
      return Object.values(localAppointments)
        .filter(apt => apt.patientId === patientId)
        .map(apt => ({
          ...apt,
          appointmentDate: new Date(apt.appointmentDate)
        }));
    }
  },

  // Cancel appointment
  cancelAppointment: async (appointmentId, reason = '') => {
    try {
      const appointmentRef = doc(db, 'appointments', appointmentId);
      
      const updateData = {
        status: 'cancelled',
        cancellationReason: reason || 'Cancelled by patient',
        updatedAt: Timestamp.now(),
        videoCallEnabled: false // Disable video call when cancelled
      };

      await updateDoc(appointmentRef, updateData);

      // Also update localStorage
      const localAppointments = JSON.parse(localStorage.getItem('appointments') || '{}');
      if (localAppointments[appointmentId]) {
        localAppointments[appointmentId].status = 'cancelled';
        localAppointments[appointmentId].cancellationReason = reason || 'Cancelled by patient';
        localAppointments[appointmentId].updatedAt = new Date().toISOString();
        localAppointments[appointmentId].videoCallEnabled = false;
        localStorage.setItem('appointments', JSON.stringify(localAppointments));
      }

      console.log('Appointment cancelled successfully');
      return true;
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      throw error;
    }
  },

  // Update appointment status and enable video call when confirmed
  updateAppointmentStatus: async (appointmentId, status, doctorNotes = '') => {
    try {
      const appointmentRef = doc(db, 'appointments', appointmentId);
      const updateData = {
        status,
        doctorNotes,
        updatedAt: Timestamp.now()
      };

      // If status is confirmed, enable video call
      if (status === 'confirmed') {
        updateData.videoCallEnabled = true;
        
        // Create video call room
        const appointmentDoc = await getDoc(appointmentRef);
        if (appointmentDoc.exists()) {
          const appointmentData = appointmentDoc.data();
          await videoCallService.createMeetingRoom(
            appointmentId,
            appointmentData.doctorName,
            appointmentData.patientName
          );
        }
      }

      await updateDoc(appointmentRef, updateData);

      // Also update localStorage
      const localAppointments = JSON.parse(localStorage.getItem('appointments') || '{}');
      if (localAppointments[appointmentId]) {
        localAppointments[appointmentId].status = status;
        localAppointments[appointmentId].doctorNotes = doctorNotes;
        localAppointments[appointmentId].updatedAt = new Date().toISOString();
        if (status === 'confirmed') {
          localAppointments[appointmentId].videoCallEnabled = true;
        }
        localStorage.setItem('appointments', JSON.stringify(localAppointments));
      }

    } catch (error) {
      console.error('Error updating appointment status:', error);
      throw error;
    }
  },

  // Get appointment by ID
  getAppointmentById: async (appointmentId) => {
    try {
      const appointmentRef = doc(db, 'appointments', appointmentId);
      const appointmentDoc = await getDoc(appointmentRef);
      
      if (appointmentDoc.exists()) {
        return {
          id: appointmentDoc.id,
          ...appointmentDoc.data()
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching appointment:', error);
      throw error;
    }
  },

  // Get video call room for appointment
  getVideoCallRoom: async (appointmentId) => {
    try {
      return videoCallService.getMeetingRoom(appointmentId);
    } catch (error) {
      console.error('Error getting video call room:', error);
      return null;
    }
  },

  // Real-time listener for appointments
  subscribeToAppointments: (patientId, callback) => {
    const appointmentsRef = collection(db, 'appointments');
    const q = query(
      appointmentsRef, 
      where('patientId', '==', patientId),
      orderBy('appointmentDate', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const appointments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(appointments);
    });
  }
};