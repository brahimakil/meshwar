import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDDFulaaIA-AF7IaLzDsNqFL9Q6Tq4Hyfw",
  authDomain: "meshwar-ac389.firebaseapp.com",
  projectId: "meshwar-ac389",
  storageBucket: "meshwar-ac389.appspot.com",
  messagingSenderId: "685691562595",
  appId: "1:685691562595:web:7f0d60853743ec68f8a656",
  measurementId: "G-KD8XL19TPE"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage }; 