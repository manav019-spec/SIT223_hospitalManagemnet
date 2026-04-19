// Appointment.js
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { appointmentService } from '../Services/appointmentService';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import './Appointment.css';

const Appointment = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [slotLoading, setSlotLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    service: "",
    doctor: "",
    appointmentDate: "",
    appointmentTime: "",
    reason: "",
    symptoms: ""
  });

  // Generate time slots (9 AM to 5 PM, 30-minute intervals)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const allTimeSlots = generateTimeSlots();

  useEffect(() => {
    // Pre-fill doctor if coming from doctor page
    if (location.state?.selectedDoctor) {
      const doctor = location.state.selectedDoctor;
      setFormData(prev => ({
        ...prev,
        doctor: doctor.id,
        fullName: userData?.firstName ? `${userData.firstName} ${userData.lastName}` : "",
        email: currentUser?.email || ""
      }));
    }

    if (currentUser && userData) {
      setFormData(prev => ({
        ...prev,
        fullName: `${userData.firstName} ${userData.lastName}`,
        email: currentUser.email,
        phone: userData.phone || ""
      }));
    }

    fetchDoctorsAndServices();
  }, [currentUser, userData, location]);

  const fetchDoctorsAndServices = async () => {
    try {
      setLoading(true);
      // Fetch doctors
      const doctorsQuery = await getDocs(collection(db, 'doctors'));
      const doctorsData = doctorsQuery.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDoctors(doctorsData);

      // Fetch services
      const servicesQuery = await getDocs(collection(db, 'services'));
      const servicesData = servicesQuery.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setServices(servicesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load doctors and services');
    } finally {
      setLoading(false);
    }
  };

  const getDoctorSchedule = async (doctorId) => {
    try {
      const doctorDoc = await getDoc(doc(db, 'doctors', doctorId));
      if (doctorDoc.exists()) {
        const doctorData = doctorDoc.data();
        return doctorData.schedule || {
          monday: { available: true, slots: allTimeSlots },
          tuesday: { available: true, slots: allTimeSlots },
          wednesday: { available: true, slots: allTimeSlots },
          thursday: { available: true, slots: allTimeSlots },
          friday: { available: true, slots: allTimeSlots },
          saturday: { available: false, slots: [] },
          sunday: { available: false, slots: [] }
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching doctor schedule:', error);
      return null;
    }
  };

  // Update the getBookedSlots function in Appointment.js
  const getBookedSlots = async (doctorId, date) => {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Use timestamp comparison instead of date objects
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('doctorId', '==', doctorId),
        where('appointmentDate', '>=', startOfDay),
        where('appointmentDate', '<=', endOfDay),
        where('status', 'in', ['pending', 'confirmed', 'approved'])
      );
      
      const querySnapshot = await getDocs(appointmentsQuery);
      const bookedSlots = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const appointmentDate = data.appointmentDate?.toDate ? 
          data.appointmentDate.toDate() : new Date(data.appointmentDate);
        return appointmentDate.toTimeString().slice(0, 5); // Get HH:MM format
      });
      
      return bookedSlots;
    } catch (error) {
      console.error('Error fetching booked slots:', error);
      return [];
    }
  };

  // Add real-time slot validation before booking
  const validateSlotAvailability = async (doctorId, date, time) => {
    try {
      const bookedSlots = await getBookedSlots(doctorId, date);
      return !bookedSlots.includes(time);
    } catch (error) {
      console.error('Error validating slot:', error);
      return false;
    }
  };

  const fetchAvailableSlots = async () => {
    if (!formData.doctor || !formData.appointmentDate) {
      setAvailableSlots([]);
      return;
    }

    try {
      setSlotLoading(true);
      
      const doctorSchedule = await getDoctorSchedule(formData.doctor);
      const bookedSlots = await getBookedSlots(formData.doctor, formData.appointmentDate);
      
      if (!doctorSchedule) {
        setAvailableSlots([]);
        return;
      }

      const dayName = getDayName(formData.appointmentDate);
      const daySchedule = doctorSchedule[dayName];

      if (!daySchedule || !daySchedule.available) {
        setAvailableSlots([]);
        return;
      }

      // Filter available slots (doctor's slots minus booked slots)
      const availableSlotsList = daySchedule.slots.filter(slot => 
        !bookedSlots.includes(slot)
      );
      
      setAvailableSlots(availableSlotsList);
    } catch (error) {
      console.error('Error fetching available slots:', error);
      setError('Failed to load available time slots');
      setAvailableSlots([]);
    } finally {
      setSlotLoading(false);
    }
  };

  const getDayName = (dateString) => {
    const date = new Date(dateString);
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  };

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Reset time when doctor or date changes
    if (name === 'doctor' || name === 'appointmentDate') {
      setFormData(prev => ({
        ...prev,
        appointmentTime: ""
      }));
    }

    // Fetch available slots when both doctor and date are selected
    if ((name === 'doctor' && formData.appointmentDate) || 
        (name === 'appointmentDate' && formData.doctor)) {
      await fetchAvailableSlots();
    }
  };

  // Update handleSubmit function
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError('Please login to book an appointment');
      navigate('/login');
      return;
    }

    if (!formData.appointmentTime) {
      setError('Please select a time slot');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Validate slot availability one more time before booking
      const isSlotAvailable = await validateSlotAvailability(
        formData.doctor, 
        formData.appointmentDate, 
        formData.appointmentTime
      );

      if (!isSlotAvailable) {
        setError('This time slot was just booked by another patient. Please select a different time.');
        await fetchAvailableSlots(); // Refresh available slots
        setLoading(false);
        return;
      }

      // Rest of your existing booking logic...
      const selectedDoctor = doctors.find(d => d.id === formData.doctor);
      const selectedService = services.find(s => s.id === formData.service);

      // Combine date and time
      const appointmentDateTime = new Date(`${formData.appointmentDate}T${formData.appointmentTime}`);

      const appointmentData = {
        patientId: currentUser.uid,
        patientName: formData.fullName,
        patientEmail: formData.email,
        patientPhone: formData.phone,
        doctorId: formData.doctor,
        doctorName: selectedDoctor?.fullName || `${selectedDoctor?.firstName || ''} ${selectedDoctor?.lastName || ''}`.trim() || 'Unknown Doctor',
        serviceId: formData.service,
        serviceName: selectedService?.name || 'Unknown Service',
        appointmentDate: appointmentDateTime,
        reason: formData.reason,
        symptoms: formData.symptoms,
        status: 'pending',
        createdAt: new Date()
      };

      const appointmentId = await appointmentService.bookAppointment(appointmentData);
      
      setSuccess(`Appointment request submitted successfully! Your request ID is: ${appointmentId}`);
      
      // Reset form
      setFormData({
        fullName: `${userData?.firstName} ${userData?.lastName}` || "",
        email: currentUser?.email || "",
        phone: userData?.phone || "",
        service: "",
        doctor: "",
        appointmentDate: "",
        appointmentTime: "",
        reason: "",
        symptoms: ""
      });
      setAvailableSlots([]);

      // Redirect to appointments page after 2 seconds
      setTimeout(() => {
        navigate('/my-appointments');
      }, 3000);

    } catch (error) {
      console.error('Error booking appointment:', error);
      setError('Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1); // Can only book from tomorrow
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30); // Can book up to 30 days in advance
    return maxDate.toISOString().split('T')[0];
  };

  if (!currentUser) {
    return (
      <div className="appointment-container">
        <div className="login-required">
          <h2>Please Login to Book Appointment</h2>
          <p>You need to be logged in to book an appointment.</p>
          <button 
            className="login-button"
            onClick={() => navigate('/login')}
          >
            Login Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="appointment-container">
      <div className="appointment-header">
        <h1>Book Your Appointment</h1>
      </div>
      <div className="appointment-info-section">
        <p>Please fill out the form below to request an appointment with our medical professionals. Ensure all required fields are completed accurately.</p>
      </div>

      {error && <div className="error-alert">{error}</div>}
      {success && <div className="success-alert">{success}</div>}

      <div className="appointment-content">
        <div className="appointment-form-section">
          <form onSubmit={handleSubmit} className="appointment-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Service Required *</label>
                <select
                  name="service"
                  value={formData.service}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Service</option>
                  {services.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.name} - ₹{service.cost}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Select Doctor *</label>
                <select
                  name="doctor"
                  value={formData.doctor}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Choose Doctor</option>
                  {doctors.map(doctor => (
                    <option key={doctor.id} value={doctor.id}>
                      Dr. {doctor.firstName} {doctor.lastName} - {doctor.specialty}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Appointment Date *</label>
                <input
                  type="date"
                  name="appointmentDate"
                  value={formData.appointmentDate}
                  onChange={handleInputChange}
                  required
                  min={getMinDate()}
                  max={getMaxDate()}
                />
                <small>Select a date between tomorrow and 30 days from now</small>
              </div>

              <div className="form-group">
                <label>Time Slot *</label>
                <select
                  name="appointmentTime"
                  value={formData.appointmentTime}
                  onChange={handleInputChange}
                  required
                  disabled={!formData.doctor || !formData.appointmentDate || slotLoading}
                >
                  <option value="">Select Time</option>
                  {slotLoading ? (
                    <option disabled>Loading available slots...</option>
                  ) : availableSlots.length > 0 ? (
                    availableSlots.map(slot => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))
                  ) : (
                    formData.doctor && formData.appointmentDate ? (
                      <option disabled>No slots available for selected date</option>
                    ) : (
                      <option disabled>Select doctor and date first</option>
                    )
                  )}
                </select>
                {formData.doctor && formData.appointmentDate && !slotLoading && (
                  <div className="slots-info">
                    {availableSlots.length} slot(s) available on {new Date(formData.appointmentDate).toLocaleDateString()}
                  </div>
                )}
              </div>

              <div className="form-group full-width">
                <label>Reason for Visit *</label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  rows="2"
                  required
                  placeholder="Please describe the reason for your visit..."
                />
              </div>

              <div className="form-group full-width">
                <label>Symptoms (Optional)</label>
                <textarea
                  name="symptoms"
                  value={formData.symptoms}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Describe any symptoms you're experiencing..."
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="submit-button"
                disabled={loading}
              >
                {loading ? 'Booking Appointment...' : 'Request Appointment'}
              </button>
            </div>
          </form>
        </div>

        <div className="appointment-info-section">
          <div className="info-card">
            <h3>Appointment Info</h3>
            <ul>
              <li>• Please arrive 15 minutes before your scheduled time</li>
              <li>• Bring your ID and any previous medical records</li>
              <li>• Cancel at least 24 hours in advance if needed</li>
              <li>• Emergency? Call: +91 11 1234 5678</li>
            </ul>
          </div>

          <div className="time-slots-info">
            <h4>Available Time Slots</h4>
            <p>We offer appointments from <strong>9:00 AM to 5:00 PM</strong></p>
            <p>Each slot is <strong>30 minutes</strong> long</p>
            <p>Available slots update in real-time</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Appointment;