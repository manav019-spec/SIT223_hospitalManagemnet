import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { Container, TextField, Button, Box, Typography, Alert } from '@mui/material';
import { Google } from '@mui/icons-material';
import TwoFactorVerify from '../TwoFactorAuth/TwoFactorVerify';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, googleSignIn } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

// Login.js - Add this after the login function
const [show2FA, setShow2FA] = useState(false);
const [pendingUserId, setPendingUserId] = useState(null);

// Update the handleSubmit function
const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    setError('');
    setLoading(true);
    await login(formData.email, formData.password);
    navigate('/profile');
  } catch (error) {
    if (error.message === '2FA_REQUIRED') {
      const userId = sessionStorage.getItem('pending2FAUser');
      setPendingUserId(userId);
      setShow2FA(true);
    } else {
      setError('Failed to log in: ' + error.message);
    }
  }
  
  setLoading(false);
};

const handle2FASuccess = () => {
  sessionStorage.removeItem('pending2FAUser');
  setShow2FA(false);
  navigate('/profile');
};

// Add this to your return statement
if (show2FA && pendingUserId) {
  return (
    <TwoFactorVerify 
      userId={pendingUserId}
      onVerify={handle2FASuccess}
      onBackupCode={handle2FASuccess}
    />
  );
}

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      await googleSignIn();
      navigate('/profile');
    } catch (error) {
      setError('Failed to sign in with Google: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, p: 4, boxShadow: 3 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Sign In
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            margin="normal"
            required
          />
          
          <TextField
            fullWidth
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            margin="normal"
            required
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            Sign In
          </Button>
        </form>
        
        <Button
          fullWidth
          variant="outlined"
          startIcon={<Google />}
          onClick={handleGoogleSignIn}
          disabled={loading}
          sx={{ mb: 2 }}
        >
          Sign in with Google
        </Button>
        
        <Box textAlign="center">
          <Link to="/register" style={{ textDecoration: 'none' }}>
            <Button variant="text">
              Don't have an account? Sign up
            </Button>
          </Link>
        </Box>
      </Box>
    </Container>
  );
}

export default Login;