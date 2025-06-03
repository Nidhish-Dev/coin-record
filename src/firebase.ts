import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCzEmzsRwSRt2LKpwkhPMRWRI4RMvla-jM",
  authDomain: "coin-record.firebaseapp.com",
  projectId: "coin-record",
  storageBucket: "coin-record.firebasestorage.app",
  messagingSenderId: "783808659494",
  appId: "1:783808659494:web:60b5046c209a531d1526e7",
  measurementId: "G-052Z0M22M0"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);