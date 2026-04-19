// Service.js - Fixed Version
import React from 'react';
import { Link } from 'react-router-dom';
import cataractSurgery from '../LandingPage/images/services/Cataract-Surgery.png';
import lasikSurgery from '../LandingPage/images/services/Lasik-Surgery.png';
import contactLens from '../LandingPage/images/services/Contact-Lens.png';
import lowVision from '../LandingPage/images/services/Low-vision.png';
import comprehensiveExam from '../LandingPage/images/services/Comprehensive-Exam.png';
import pediatricExam from '../LandingPage/images/services/Pediastric-Exam.png';
import './Service.css';

const imageMap = {
  'contact-lens': contactLens,
  'lasik-surgery': lasikSurgery,
  'pediatric-exam': pediatricExam,
  'low-vision': lowVision,
  'comprehensive-exam': comprehensiveExam,
  'cataract-surgery': cataractSurgery,
};

function Service({ service }) {
  const { name, id, cost, duration } = service;

  // Use mapped image or fallback placeholder
  const imageSrc = imageMap[id] || `https://via.placeholder.com/300x200/4A90E2/FFFFFF?text=${encodeURIComponent(name)}`;

  return (
    <div className="service-card">
      <img
        className="service-image"
        src={imageSrc}
        alt={name}
        loading="lazy"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = `https://via.placeholder.com/300x200/4A90E2/FFFFFF?text=${encodeURIComponent(name)}`;
        }}
      />
      <div className="service-content">
        <h3 className="service-name" title={name}>{name}</h3>
        <div className="service-details">
          <div className="service-cost">
            <strong>Cost:</strong> {cost ? `₹${cost}` : 'Not specified'}
          </div>
          <div className="service-duration">
            <strong>Duration:</strong> {duration || 'Not specified'}
          </div>
        </div>
        <Link to={`/services/${id}`} className="service-button">
          View Details & Book
        </Link>
      </div>
    </div>
  );
}

export default Service;