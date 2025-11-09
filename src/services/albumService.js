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

export const getAlbumRanking = async (albumId) => {
  try {
    // Get all albums sorted by average score
    const albumsRef = collection(db, 'albums');
    const q = query(albumsRef, orderBy('averageScore', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const albums = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Find the current album's rank
    const currentAlbumIndex = albums.findIndex(album => album.id === albumId);
    const rank = currentAlbumIndex + 1; // +1 because array is 0-indexed
    
    return {
      rank: rank,
      totalAlbums: albums.length,
      averageScore: albums[currentAlbumIndex]?.averageScore || 0
    };
  } catch (error) {
    console.error('Error getting album ranking:', error);
    return null;
  }
};