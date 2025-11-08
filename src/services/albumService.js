import { db } from './firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';

export const listenToTop100Albums = (callback) => {
  try {
    const albumsRef = collection(db, "albums");
    const q = query(
      albumsRef,
      where("numberOfRatings", ">=", 3),
      orderBy("averageScore", "desc"), 
      limit(100)
    );

    return onSnapshot(q, (snapshot) => {
      const albums = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(albums);
    });
  } catch (error) {
    console.error("Error setting up listener:", error);
    return () => {};
  }
};