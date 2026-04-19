import React, { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase/config';
import Service from '../Service/Service';
import './Services.css';

function Services() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchServices = async () => {
            try {
                setLoading(true);
                const servicesQuery = query(
                    collection(db, 'services'), 
                    orderBy('createdAt', 'desc')
                );
                const querySnapshot = await getDocs(servicesQuery);
                const servicesData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setServices(servicesData);
            } catch (error) {
                console.error("Error fetching services:", error);
                setError('Failed to load services');
            } finally {
                setLoading(false);
            }
        };

        fetchServices();
    }, []);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading services...</p>
            </div>
        );
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="services-container">
            <h2 className="services-title">Our Eye Care Services</h2>
            <div className="services-grid">
                {services.map(service => (
                    <Service key={service.id} service={service} />
                ))}
            </div>
            {services.length === 0 && (
                <div className="no-services">
                    <p>No services available at the moment.</p>
                </div>
            )}
        </div>
    );
}

export default Services;