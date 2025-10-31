import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// TODO: Replace with your Firebase project configuration
// Get these values from Firebase Console > Project Settings > Your apps > Firebase SDK snippet
const firebaseConfig = {
  apiKey: "AIzaSyBCvz-TUVm2q9H5hIX_8QK_lrE2OUNtIqU",
  authDomain: "compliancesutra.firebaseapp.com",
  projectId: "compliancesutra",
  storageBucket: "compliancesutra.firebasestorage.app",
  messagingSenderId: "788555626683",
  appId: "1:788555626683:web:64478df8c18130ee34919e",
  measurementId: "G-NSCC4CGY9S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

export default app;
