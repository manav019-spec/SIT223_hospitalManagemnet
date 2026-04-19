import React, { useEffect, useState } from 'react'
import { Row, Spinner, Alert } from 'react-bootstrap';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import Doctor from '../Doctor/Doctor';

function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const doctorsQuery = query(
          collection(db, 'doctors'), 
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(doctorsQuery);
        const doctorsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setDoctors(doctorsData);
      } catch (error) {
        console.error('Error fetching doctors:', error);
        setError('Failed to load doctors');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading doctors...</p>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger" className="m-4">{error}</Alert>;
  }

  return (
    <div className="container mt-4">
      <h2 className="my-3 text-success fw-bold fs-1 text-center">
        Meet Our Expert Doctors
      </h2>
      <Row xs={1} md={2} lg={3} className="g-4">
        {doctors.map(doctor => (
          <Doctor key={doctor.id} doctor={doctor} />
        ))}
      </Row>
      {doctors.length === 0 && (
        <div className="text-center mt-5">
          <p>No doctors available at the moment.</p>
        </div>
      )}
    </div>
  );
}

export default Doctors;