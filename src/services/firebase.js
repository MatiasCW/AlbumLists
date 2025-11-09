import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBx8UEWD05g3kiPROxWegNmD67LnV1wOuA",
  authDomain: "thealbumlists.firebaseapp.com",
  projectId: "thealbumlists",
  storageBucket: "thealbumlists.firebasestorage.app",
  messagingSenderId: "534900243533",
  appId: "1:534900243533:web:9c1142a4ac0ae0d6f33004",
  measurementId: "G-FVH6R53D5R"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  runTransaction
};