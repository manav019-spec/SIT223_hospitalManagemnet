import React from "react";
import { Card, Col, Badge, Button } from "react-bootstrap";
import { useAuth } from '../Context/AuthContext';
import { useNavigate } from 'react-router-dom';

function Doctor({ doctor }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Safe data extraction with fallbacks
  const fullName = doctor?.fullName || `Dr. ${doctor?.firstName || ''} ${doctor?.lastName || ''}`.trim() || 'Doctor Name Not Available';
  const specialty = doctor?.specialty || doctor?.specialization || 'Specialization Not Available';
  const experience = doctor?.experience ?? 'Experience not specified';
  const education = doctor?.education || doctor?.qualification || 'Education not specified';
  const consultationFee = doctor?.consultationFee ?? 'Fee not specified';
  const rating = doctor?.rating ?? 0;
  const reviews = doctor?.reviews ?? 0;
  const available = doctor?.available ?? true;
  const image = doctor?.image || "https://via.placeholder.com/300x200?text=Doctor+Image";

  const handleBookAppointment = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    navigate('/appointment', { state: { selectedDoctor: doctor } });
  };

  return (
    <Col>
      <Card className="h-100 shadow-sm">
        <Card.Img 
          variant="top" 
          src={image}
          style={{ height: '250px', objectFit: 'cover' }}
          alt={fullName}
          onError={(e) => {
            e.target.src = "https://via.placeholder.com/300x200?text=Doctor+Image";
          }}
        />
        <Card.Body className="d-flex flex-column">
          <Card.Title className="fw-bold text-primary">
            {fullName}
          </Card.Title>
          
          <div className="mb-2">
            <strong>Specialty:</strong> {specialty}
          </div>
          <div className="mb-2">
            <strong>Experience:</strong> {experience} {typeof experience === 'number' ? 'years' : ''}
          </div>
          <div className="mb-2">
            <strong>Education:</strong> {education}
          </div>
          <div className="mb-2">
            <strong>Consultation Fee:</strong> {typeof consultationFee === 'number' ? `₹${consultationFee}` : consultationFee}
          </div>
          <div className="mb-3">
            <Badge bg="success" className="me-2">
              ⭐ {rating}/5 ({reviews} reviews)
            </Badge>
            {available && (
              <Badge bg="success">Available</Badge>
            )}
            {!available && (
              <Badge bg="secondary">Not Available</Badge>
            )}
          </div>
          
          <div className="mt-auto">
            <Button 
              variant="primary" 
              onClick={handleBookAppointment}
              disabled={!available}
              className="w-100"
            >
              {available ? 'Book Appointment' : 'Not Available'}
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Col>
  );
}

export default Doctor;