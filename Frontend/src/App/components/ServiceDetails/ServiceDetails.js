// ServiceDetails.js - Fixed Version
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../Context/AuthContext';
import './ServiceDetails.css';
import cataractSurgery from '../LandingPage/images/services/Cataract-Surgery.png';
import lasikSurgery from '../LandingPage/images/services/Lasik-Surgery.png';
import contactLens from '../LandingPage/images/services/Contact-Lens.png';
import lowVision from '../LandingPage/images/services/Low-vision.png';
import comprehensiveExam from '../LandingPage/images/services/Comprehensive-Exam.png';
import pediatricExam from '../LandingPage/images/services/Pediastric-Exam.png';

const serviceImages = {
  'contact-lens': contactLens,
  'lasik-surgery': lasikSurgery,
  'pediatric-exam': pediatricExam,
  'low-vision': lowVision,
  'comprehensive-exam': comprehensiveExam,
  'cataract-surgery': cataractSurgery,
};


function ServiceDetails() {
  const { name } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchService = async () => {
      try {
        setLoading(true);
        const servicesRef = collection(db, 'services');
        const q = query(servicesRef, where('id', '==', name));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const serviceData = querySnapshot.docs[0].data();
          setService({
            id: querySnapshot.docs[0].id,
            ...serviceData
          });
        } else {
          setError('Service not found');
        }
      } catch (error) {
        console.error('Error fetching service:', error);
        setError('Failed to load service details');
      } finally {
        setLoading(false);
      }
    };

    if (name) {
      fetchService();
    }
  }, [name]);

  const handleBookAppointment = () => {
    if (!currentUser) {
      navigate('/login', { state: { returnTo: `/services/${name}` } });
      return;
    }
    navigate('/appointment', { state: { selectedService: service } });
  };

  if (loading) {
    return (
      <div className="service-details-container">
        <div className="loading">Loading service details...</div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="service-details-container">
        <div className="error-message">
          <h2>Service Not Found</h2>
          <p>The service you're looking for doesn't exist.</p>
          <Link to="/services" className="back-button secondary">
            Back to Services
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="service-details-container">
      <div className="service-details-header">

        <h1>{service.name}</h1>
      </div>

      <div className="service-details-content">
        <div className="service-image-section">
          <img
            src={serviceImages[service.id] || `https://via.placeholder.com/600x400/4A90E2/FFFFFF?text=${encodeURIComponent(service.name)}`}
            alt={service.name}
            className="service-detail-image"
          />
        </div>

        <div className="service-info-section">
          <div className="service-meta">
            <div className="meta-item">
              <strong>Cost:</strong> ₹{service.cost}
            </div>
            <div className="meta-item">
              <strong>Duration:</strong> {service.duration}
            </div>
            <div className="meta-item">
              <strong>Category:</strong> {service.category}
            </div>
            {service.suggestedDoctor && (
              <div className="meta-item">
                <strong>Suggested Doctor:</strong> {service.suggestedDoctor}
              </div>
            )}
          </div>

          <div className="service-description">
            <h3>About this Service</h3>
            <p>{service.description}</p>
          </div>

          <div className="service-actions">
            <button 
              onClick={handleBookAppointment}
              className="book-appointment-btn"
            >
              Book Appointment
            </button>
            <Link to="/doctors" className="find-doctors-btn">
              Find Doctors
            </Link>
          </div>
        <Link to="/services" className="back-button secondary">
        Back to Services
        </Link>
        </div>
      </div>
    </div>
  );
}

export default ServiceDetails;