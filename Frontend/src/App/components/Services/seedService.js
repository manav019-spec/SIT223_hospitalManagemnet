import { faker } from '@faker-js/faker';
import { collection, addDoc, doc, setDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export const seedService = {
  seedServices: async () => {
    try {
      const servicesRef = collection(db, 'services');
      const snapshot = await getDocs(servicesRef);

      console.log(`Found ${snapshot.size} existing services in database`);

      // Only seed if no services exist
      if (snapshot.empty) {
        const services = [
          {
            id: 'contact-lens',
            name: "Contact Lenses",
            description: "If you are tired of wearing glasses, contact lenses may be right for you. Contact lenses are the no-surgery way to correct your vision and ditch your glasses! Contact lenses are great for those with active lifestyles.",
            cost: 10000,
            suggestedDoctor: "Dr. Dan Mochere",
            category: "contact-lenses",
            duration: "30 minutes",
            createdAt: new Date()
          },
          {
            id: 'lasik-surgery',
            name: "LASIK Surgery",
            description: "LASIK surgery is one of the most common and popular refractive surgeries today. Are you tired of wearing glasses or contact lenses? LASIK may be the answer.",
            cost: 25000,
            suggestedDoctor: "Dr. Farhana Jaman",
            category: "surgery",
            duration: "1 hour",
            createdAt: new Date()
          },
          {
            id: 'pediatric-exam',
            name: "Pediatric Eye Exams",
            description: "According to experts, 80% of learning is visual, which means that if your child is having difficulty seeing clearly, his or her learning can be affected.",
            cost: 5000,
            suggestedDoctor: "Dr. Ahsan Raza",
            category: "pediatric-exam",
            duration: "1 hour",
            createdAt: new Date()
          },
          {
            id: 'low-vision',
            name: "Low Vision Rehabilitation",
            description: "Low vision rehabilitation is a process that helps people with significant vision loss make the most of their remaining vision.",
            cost: 15000,
            suggestedDoctor: "Dr. Sarah Khan",
            category: "low-vision",
            duration: "1 hour",
            createdAt: new Date()
          },
          {
            id: 'comprehensive-exam',
            name: "Comprehensive Eye Exam",
            description: "A comprehensive eye exam is a series of tests performed by an eye care professional to evaluate your vision and check for eye diseases.",
            cost: 8000,
            suggestedDoctor: "Dr. Michael Lee",
            category: "comprehensive-exam",
            duration: "45 minutes",
            createdAt: new Date()
          },
          {
            id: 'cataract-surgery',
            name: "Cataract Surgery",
            description: "Cataract surgery is a procedure to remove the lens of your eye and, in most cases, replace it with an artificial lens.",
            cost: 30000,
            suggestedDoctor: "Dr. Rajesh Kumar",
            category: "surgery",
            duration: "2 hours",
            createdAt: new Date()
          }
        ];

        for (const service of services) {
          await addDoc(servicesRef, service);
        }
        console.log('Services seeded successfully');
      }
    } catch (error) {
      console.error('Error seeding services:', error);
    }
  },

  // ... rest of the functions remain the same
  seedDoctors: async () => {
    try {
      const doctorsRef = collection(db, 'doctors');
      const snapshot = await getDocs(doctorsRef);
      
      if (snapshot.empty) {
        const specialties = [
          "Ophthalmology", "Retina Specialist", "Cornea Specialist", 
          "Pediatric Ophthalmology", "Glaucoma Specialist", "Cataract Specialist",
          "Neuro-ophthalmology"
        ];

        const doctors = [];

        for (let i = 0; i < 8; i++) {
          const firstName = faker.person.firstName();
          const lastName = faker.person.lastName();
          
          doctors.push({
            firstName,
            lastName,
            fullName: `Dr. ${firstName} ${lastName}`,
            email: faker.internet.email({ firstName, lastName }).toLowerCase(),
            specialty: faker.helpers.arrayElement(specialties),
            experience: faker.number.int({ min: 5, max: 20 }),
            age: faker.number.int({ min: 32, max: 55 }),
            phone: faker.phone.number(),
            education: `${faker.helpers.arrayElement(['MD', 'MBBS', 'DO'])} - ${faker.helpers.arrayElement(['Harvard Medical School', 'Johns Hopkins University', 'Stanford University', 'Mayo Medical School'])}`,
            image: faker.image.avatar(), // You can add doctor avatars too
            bio: faker.lorem.paragraphs(2),
            schedule: {
              monday: { available: true, slots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'] },
              tuesday: { available: true, slots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'] },
              wednesday: { available: true, slots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'] },
              thursday: { available: true, slots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'] },
              friday: { available: true, slots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'] },
              saturday: { available: false, slots: [] },
              sunday: { available: false, slots: [] }
            },
            consultationFee: faker.number.int({ min: 1000, max: 5000 }),
            rating: faker.number.float({ min: 3.5, max: 5, fractionDigits: 1 }),
            reviews: faker.number.int({ min: 50, max: 200 }),
            createdAt: new Date()
          });
        }

        for (const doctor of doctors) {
          await addDoc(doctorsRef, doctor);
        }
        console.log('Doctors seeded successfully');
      }
    } catch (error) {
      console.error('Error seeding doctors:', error);
    }
  },

  createPatientProfile: async (userId, userData) => {
    try {
      const patientRef = doc(db, 'patients', userId);
      
      const patientProfile = {
        ...userData,
        patientId: userId,
        medicalHistory: {
          allergies: [],
          medications: [],
          conditions: [],
          surgeries: []
        },
        insurance: {
          provider: '',
          policyNumber: '',
          groupNumber: ''
        },
        emergencyContact: {
          name: '',
          relationship: '',
          phone: ''
        },
        appointments: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await setDoc(patientRef, patientProfile);
      console.log('Patient profile created successfully');
      return patientProfile;
    } catch (error) {
      console.error('Error creating patient profile:', error);
      throw error;
    }
  },

// In seedService.js - Update the createDoctorProfile function
createDoctorProfile: async (userId, doctorData) => {
  try {
    const doctorRef = doc(db, 'doctors', userId);
    
    const doctorProfile = {
      // Basic information
      firstName: doctorData.firstName,
      lastName: doctorData.lastName,
      fullName: `Dr. ${doctorData.firstName} ${doctorData.lastName}`,
      email: doctorData.email,
      
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
        Math.floor(Math.random() * 23) + 32,
      gender: doctorData.gender,
      
      // Professional metrics
      consultationFee: Math.floor(Math.random() * 4000) + 1000,
      rating: parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)),
      reviews: Math.floor(Math.random() * 150) + 50,
      
      // Image
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
      doctorId: userId,
      appointments: [],
      ratings: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await setDoc(doctorRef, doctorProfile);
    console.log('Doctor profile created successfully via seedService');
    return doctorProfile;
  } catch (error) {
    console.error('Error creating doctor profile:', error);
    throw error;
  }
}
};