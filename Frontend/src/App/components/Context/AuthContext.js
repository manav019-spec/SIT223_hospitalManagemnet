// AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { seedService } from '../Services/seedService';
import { twoFactorService } from '../Services/twoFactorService';
import { faker } from '@faker-js/faker';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pending2FAUser, setPending2FAUser] = useState(null);

  // Seed initial data on app start
  useEffect(() => {
    const seedInitialData = async () => {
      await seedService.seedServices();
      await seedService.seedDoctors();
    };
    seedInitialData();
  }, []);

  // Check if 2FA is required for a user
  const check2FARequired = async (userId) => {
    try {
      return await twoFactorService.is2FAEnabled(userId);
    } catch (error) {
      console.error('Error checking 2FA requirement:', error);
      return false;
    }
  };

  // Sign up with email/password - PATIENT
  const signup = async (email, password, userData) => {
    try {
      console.log('Attempting signup with:', { email, userData });
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;
      
      console.log('User created, ID:', userId);
      
      // Create user profile in Firestore
      const userProfile = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: email,
        phone: userData.phone || '',
        dateOfBirth: userData.dateOfBirth || '',
        gender: userData.gender || '',
        role: 'patient',
        is2FAEnabled: false,
        createdAt: new Date(),
        lastLogin: new Date()
      };

      await setDoc(doc(db, 'users', userId), userProfile);
      console.log('User profile created in Firestore');

      // Create detailed patient profile
      try {
        await seedService.createPatientProfile(userId, userData);
        console.log('Patient profile created');
      } catch (profileError) {
        console.warn('Could not create patient profile:', profileError);
        // Continue even if patient profile fails
      }

      // Update Firebase auth profile
      try {
        await updateProfile(userCredential.user, {
          displayName: `${userData.firstName} ${userData.lastName}`
        });
        console.log('Auth profile updated');
      } catch (profileError) {
        console.warn('Could not update auth profile:', profileError);
      }

      return userCredential;
    } catch (error) {
      console.error('Signup error in AuthContext:', error);
      throw error;
    }
  };

  // Doctor registration
// In AuthContext.js - Update the registerDoctor function
const registerDoctor = async (email, password, doctorData) => {
  try {
    console.log('Attempting doctor registration with:', { email, doctorData });
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;
    
    console.log('Doctor user created, ID:', userId);

    // Create complete doctor profile with all required fields
    const doctorProfile = {
      // Basic information
      firstName: doctorData.firstName,
      lastName: doctorData.lastName,
      fullName: `Dr. ${doctorData.firstName} ${doctorData.lastName}`,
      email: email,
      
      // Professional information
      specialty: doctorData.specialization,
      experience: parseInt(doctorData.experience) || 0,
      qualification: doctorData.qualification,
      licenseNumber: doctorData.licenseNumber,
      bio: doctorData.bio || `Dr. ${doctorData.firstName} ${doctorData.lastName} is a ${doctorData.specialization} with ${doctorData.experience} years of experience.`,
      
      // Personal information
      phone: doctorData.phone,
      age: doctorData.dateOfBirth ? 
        new Date().getFullYear() - new Date(doctorData.dateOfBirth).getFullYear() : 
        Math.floor(Math.random() * 23) + 32, // Random age between 32-55
      gender: doctorData.gender,
      
      // Professional metrics (randomized for new doctors)
      consultationFee: Math.floor(Math.random() * 4000) + 1000, // 1000-5000
      rating: parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)), // 3.5-5.0
      reviews: Math.floor(Math.random() * 150) + 50, // 50-200 reviews
      
      // Image/faker
      image: faker.image.avatar(),
      
      // Schedule
      schedule: {
        monday: { available: true, slots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'] },
        tuesday: { available: true, slots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'] },
        wednesday: { available: true, slots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'] },
        thursday: { available: true, slots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'] },
        friday: { available: true, slots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'] },
        saturday: { available: false, slots: [] },
        sunday: { available: false, slots: [] }
      },
      
      // Status
      available: true,
      
      // Timestamps
      createdAt: new Date(),
      updatedAt: new Date(),
      doctorId: userId
    };

    console.log('Creating doctor profile:', doctorProfile);

    // Create user profile in Firestore
    const userProfile = {
      firstName: doctorData.firstName,
      lastName: doctorData.lastName,
      email: email,
      phone: doctorData.phone,
      dateOfBirth: doctorData.dateOfBirth || '',
      gender: doctorData.gender || '',
      role: 'doctor',
      is2FAEnabled: false,
      createdAt: new Date(),
      lastLogin: new Date(),
      specialization: doctorData.specialization,
      experience: doctorData.experience,
      qualification: doctorData.qualification,
      licenseNumber: doctorData.licenseNumber
    };

    // Save to users collection
    await setDoc(doc(db, 'users', userId), userProfile);
    console.log('User profile created in Firestore');

    // Save to doctors collection with complete profile
    const doctorRef = doc(db, 'doctors', userId);
    await setDoc(doctorRef, doctorProfile);
    console.log('Doctor profile created in doctors collection');

    // Update Firebase auth profile
    try {
      await updateProfile(userCredential.user, {
        displayName: doctorProfile.fullName
      });
      console.log('Auth profile updated');
    } catch (profileError) {
      console.warn('Could not update auth profile:', profileError);
    }

    return userCredential;
  } catch (error) {
    console.error('Doctor registration error in AuthContext:', error);
    throw error;
  }
};
  // Login with email/password
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;
      
      // Check if 2FA is required
      const requires2FA = await check2FARequired(userId);
      
      if (requires2FA) {
        // Store temporary auth state for 2FA verification
        setPending2FAUser(userId);
        sessionStorage.setItem('pending2FAUser', userId);
        throw new Error('2FA_REQUIRED');
      }
      
      // Update last login for non-2FA users
      await updateDoc(doc(db, 'users', userId), {
        lastLogin: new Date()
      });

      return userCredential;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Complete 2FA login
  const complete2FALogin = async (userId) => {
    try {
      // Clear pending state
      setPending2FAUser(null);
      sessionStorage.removeItem('pending2FAUser');
      
      // Update last login
      await updateDoc(doc(db, 'users', userId), {
        lastLogin: new Date()
      });

      // Refresh user data
      await fetchUserData(userId);
    } catch (error) {
      console.error('Error completing 2FA login:', error);
      throw error;
    }
  };

  // Google Sign In
  const googleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userId = result.user.uid;
      
      // Check if user exists in Firestore, if not create patient profile
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        const userData = {
          firstName: result.user.displayName?.split(' ')[0] || '',
          lastName: result.user.displayName?.split(' ')[1] || '',
          email: result.user.email,
          role: 'patient',
          createdAt: new Date(),
          is2FAEnabled: false,
          lastLogin: new Date()
        };

        await setDoc(doc(db, 'users', userId), userData);
        
        // Create detailed patient profile
        await seedService.createPatientProfile(userId, userData);
      } else {
        // Update last login for existing user
        if (userDoc.exists() && !userDoc.data().is2FAEnabled) {
          await updateDoc(doc(db, 'users', userId), {
            lastLogin: new Date()
          });
        }
      }

      return result;
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  // Logout
  const logout = () => {
    setPending2FAUser(null);
    sessionStorage.removeItem('pending2FAUser');
    return signOut(auth);
  };

  // Reset Password
  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  // Fetch user data from Firestore
  const fetchUserData = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        setUserRole(data.role);
        return data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  // Enable 2FA for current user
  const enable2FA = async (secret, token) => {
    try {
      if (!currentUser) throw new Error('No user logged in');
      
      const verified = await twoFactorService.verifyToken(currentUser.uid, token);
      if (verified) {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          is2FAEnabled: true
        });
        await fetchUserData(currentUser.uid);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      throw error;
    }
  };

  // Disable 2FA for current user
  const disable2FA = async () => {
    try {
      if (!currentUser) throw new Error('No user logged in');
      
      await twoFactorService.disable2FA(currentUser.uid);
      await fetchUserData(currentUser.uid);
      return true;
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      throw error;
    }
  };

  // Verify 2FA token
  const verify2FAToken = async (userId, token) => {
    try {
      return await twoFactorService.validateToken(userId, token);
    } catch (error) {
      console.error('Error verifying 2FA token:', error);
      throw error;
    }
  };

  // Verify backup code
  const verifyBackupCode = async (userId, code) => {
    try {
      return await twoFactorService.verifyBackupCode(userId, code);
    } catch (error) {
      console.error('Error verifying backup code:', error);
      throw error;
    }
  };

  // Generate 2FA secret
  const generate2FASecret = async () => {
    try {
      if (!currentUser) throw new Error('No user logged in');
      
      return await twoFactorService.generateSecret(currentUser.uid, currentUser.email);
    } catch (error) {
      console.error('Error generating 2FA secret:', error);
      throw error;
    }
  };

  // Generate backup codes
  const generateBackupCodes = async () => {
    try {
      if (!currentUser) throw new Error('No user logged in');
      
      return await twoFactorService.generateBackupCodes(currentUser.uid);
    } catch (error) {
      console.error('Error generating backup codes:', error);
      throw error;
    }
  };

  // Check if current user has 2FA enabled
  const is2FAEnabled = () => {
    return userData?.is2FAEnabled || false;
  };

  // Check if there's a pending 2FA login
  const hasPending2FA = () => {
    return !!pending2FAUser || !!sessionStorage.getItem('pending2FAUser');
  };

  // Get pending 2FA user ID
  const getPending2FAUserId = () => {
    return pending2FAUser || sessionStorage.getItem('pending2FAUser');
  };

  // Clear pending 2FA state
  const clearPending2FA = () => {
    setPending2FAUser(null);
    sessionStorage.removeItem('pending2FAUser');
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserData(user.uid);
        
        // Check for pending 2FA state
        const storedPendingUser = sessionStorage.getItem('pending2FAUser');
        if (storedPendingUser && storedPendingUser === user.uid) {
          setPending2FAUser(storedPendingUser);
        }
      } else {
        setUserData(null);
        setUserRole(null);
        setPending2FAUser(null);
        sessionStorage.removeItem('pending2FAUser');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    // User state
    currentUser,
    userData,
    userRole,
    loading,
    
    // 2FA state
    pending2FAUser,
    
    // Authentication methods
    signup,
    registerDoctor,
    login,
    googleSignIn,
    logout,
    resetPassword,
    
    // User data methods
    fetchUserData,
    
    // 2FA methods
    check2FARequired,
    complete2FALogin,
    enable2FA,
    disable2FA,
    verify2FAToken,
    verifyBackupCode,
    generate2FASecret,
    generateBackupCodes,
    is2FAEnabled,
    hasPending2FA,
    getPending2FAUserId,
    clearPending2FA
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}