import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';


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

export const addFavoriteArtist = async (userId, artistData) => {
  const favoritesRef = collection(db, 'users', userId, 'favoriteArtists');
  
  // Check if already favorited
  const q = query(favoritesRef, where('artistId', '==', artistData.artistId));
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    throw new Error('Artist already in favorites');
  }

  // Check limit (max 10)
  const allFavorites = await getDocs(favoritesRef);
  if (allFavorites.size >= 10) {
    throw new Error('You can only have 10 favorite artists');
  }

  await addDoc(favoritesRef, {
    ...artistData,
    addedAt: serverTimestamp()
  });
};

export const removeFavoriteArtist = async (userId, artistId) => {
  const favoritesRef = collection(db, 'users', userId, 'favoriteArtists');
  const q = query(favoritesRef, where('artistId', '==', artistId));
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    await deleteDoc(doc(favoritesRef, snapshot.docs[0].id));
  }
};

export const getFavoriteArtists = async (userId) => {
  const favoritesRef = collection(db, 'users', userId, 'favoriteArtists');
  const snapshot = await getDocs(favoritesRef);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const isArtistFavorited = async (userId, artistId) => {
  const favoritesRef = collection(db, 'users', userId, 'favoriteArtists');
  const q = query(favoritesRef, where('artistId', '==', artistId));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};