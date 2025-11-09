import { 
  db, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  limit,
  serverTimestamp 
} from './firebase';

export const listenToTop100Albums = (callback) => {
  const albumsRef = collection(db, 'albums');
  const q = query(albumsRef, orderBy('averageScore', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const albums = snapshot.docs
      .map(doc => {
        const data = doc.data();
        // Debug logging for album data
        console.log(`🔥 Album from Firestore: ${data.name}`, {
          artists: data.artists,
          genres: data.genres,
          hasGenres: !!data.genres && data.genres.length > 0,
          artistCount: Array.isArray(data.artists) ? data.artists.length : 'unknown'
        });
        return {
          id: doc.id,
          ...data
        };
      })
      .filter(album => album.numberOfRatings >= 3) // Only albums with 3+ ratings
      .slice(0, 100); // Take top 100 after filtering
    
    callback(albums);
  });
};

export const getAlbumRanking = async (albumId) => {
  try {
    // Get all albums sorted by average score
    const albumsRef = collection(db, 'albums');
    const q = query(albumsRef, orderBy('averageScore', 'desc'));
    const querySnapshot = await getDocs(q);
    
    // Filter albums to only include those with at least 3 ratings
    const qualifiedAlbums = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(album => album.numberOfRatings >= 3); // Minimum 3 ratings required
    
    // Find the current album's data
    const albumDoc = await getDoc(doc(db, 'albums', albumId));
    const albumData = albumDoc.exists() ? { id: albumDoc.id, ...albumDoc.data() } : null;
    
    if (!albumData) {
      return {
        rank: null,
        totalAlbums: qualifiedAlbums.length,
        averageScore: 0,
        numberOfRatings: 0,
        needsMoreRatings: true
      };
    }
    
    // Find the current album's rank among qualified albums
    const currentAlbumIndex = qualifiedAlbums.findIndex(album => album.id === albumId);
    
    if (currentAlbumIndex === -1) {
      // Album doesn't have enough ratings yet
      return {
        rank: null,
        totalAlbums: qualifiedAlbums.length,
        averageScore: albumData.averageScore || 0,
        numberOfRatings: albumData.numberOfRatings || 0,
        needsMoreRatings: true
      };
    }
    
    const rank = currentAlbumIndex + 1; // +1 because array is 0-indexed
    
    return {
      rank: rank,
      totalAlbums: qualifiedAlbums.length,
      averageScore: qualifiedAlbums[currentAlbumIndex]?.averageScore || 0,
      numberOfRatings: qualifiedAlbums[currentAlbumIndex]?.numberOfRatings || 0,
      needsMoreRatings: false
    };
  } catch (error) {
    console.error('Error getting album ranking:', error);
    return null;
  }
};