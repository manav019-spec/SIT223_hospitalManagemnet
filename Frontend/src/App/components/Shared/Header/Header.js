import React, { useState } from 'react';
import { Container, Nav, Navbar, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import './Header.css';

function Header() {
  const { currentUser, userData, logout } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  // Add an alert for navigation/log-out errors everywhere
  const handleLogout = async () => {
    setError('');
    try {
      await logout();
      navigate('/');
    } catch {
      setError('Failed to log out!');
      alert('Logout failed!');
    }
  };

  // Add navigation actions everywhere needed, both patient and doctor
  const handleNav = (to) => {
    navigate(to);
  }

  return (
    <>
      <Navbar collapseOnSelect expand="lg" bg="dark" variant="dark" className="py-3">
        <Container fluid className="align-items-center">
          <Navbar.Brand as={Link} to="/" className="head-icon text-white fw-bold me-5" style={{ letterSpacing: '1px' }}>
            MAHAVIR MEDISCOPE EYE CENTRE
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="responsive-navbar-nav" />
          <Navbar.Collapse id="responsive-navbar-nav" className="justify-content-between">
            <Nav className="mx-auto gap-3 text-center">
              <Nav.Link as={Link} to="/">Home</Nav.Link>
              <Nav.Link as={Link} to="/doctors">Doctors Corner</Nav.Link>
              <Nav.Link as={Link} to="/services">Services</Nav.Link>
              <Nav.Link as={Link} to="/appointment">Book Appointment</Nav.Link>
              <Nav.Link as={Link} to="/about">About us</Nav.Link>
              {/* Links available for both user/doctor */}
              <Nav.Link onClick={() => handleNav('/my-appointments')}>My Appointments</Nav.Link>
              {userData?.role === 'doctor' && (
                <Nav.Link onClick={() => handleNav('/doctor-dashboard')}>Doctor Dashboard</Nav.Link>
              )}
            </Nav>
            <Nav className="gap-2">
              {currentUser ? (
                <>
                  <NavDropdown
                    title={`Welcome, ${userData?.firstName || 'User'}`}
                    align="end"
                    id="collasible-nav-dropdown"
                  >
                    <NavDropdown.Item as={Link} to="/profile">
                      Profile
                    </NavDropdown.Item>
                    <NavDropdown.Item onClick={handleLogout}>
                      Log out
                    </NavDropdown.Item>
                  </NavDropdown>
                  <span className="fw-bold text-secondary ms-2 text-uppercase">{userData?.role}</span>
                </>
              ) : (
                <Nav.Link as={Link} to="/login">Login</Nav.Link>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      {error && <div className="alert alert-danger text-center">{error}</div>}
    </>
  );
}

export default Header;