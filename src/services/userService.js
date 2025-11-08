import { db } from './firebase';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, runTransaction } from 'firebase/firestore';

export const getUserByUsername = async (username) => {
  const q = query(
    collection(db, 'usernames'),
    where('username', '==', username)
  );
  
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  
  return querySnapshot.docs[0].data().userId;
};

export const getUserData = async (userId) => {
  const userDoc = await getDoc(doc(db, 'users', userId));
  return userDoc.exists() ? userDoc.data() : null;
};

export const updateUserProfile = async (userId, updates) => {
  await updateDoc(doc(db, 'users', userId), updates);
};