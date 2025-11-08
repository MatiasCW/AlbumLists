import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, getDoc, runTransaction } from 'firebase/firestore';

const List = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [albums, setAlbums] = useState([]);
  const [sortOrder, setSortOrder] = useState('default');
  const uid = searchParams.get('uid') || user?.uid;

  useEffect(() => {
    if (uid) {
      fetchAlbums(uid);
    }
  }, [uid, sortOrder]);

  const fetchAlbums = async (userId) => {
    try {
      const albumsRef = collection(db, 'users', userId, 'albums');
      const querySnapshot = await getDocs(albumsRef);
      
      let albumsList = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));

      // Apply sorting
      if (sortOrder === 'desc') {
        albumsList.sort((a, b) => (b.score || 0) - (a.score || 0));
      } else if (sortOrder === 'asc') {
        albumsList.sort((a, b) => (a.score || 0) - (b.score || 0));
      }

      setAlbums(albumsList);
    } catch (error) {
      console.error("Error fetching albums:", error);
    }
  };

  const handleScoreChange = async (albumId, newScore) => {
    // Implementation from your list.js
    console.log('Score changed:', albumId, newScore);
  };

  const handleRemoveAlbum = async (albumId) => {
    // Implementation from your list.js
    console.log('Remove album:', albumId);
  };

  const isOwner = !searchParams.get('uid') || user?.uid === searchParams.get('uid');

  return (
    <main>
      <button id="changeColorBtn">Style</button>
      
      <table className="album-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th></th>
            <th>Name of Album</th>
            <th onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}>
              Score {sortOrder === 'desc' ? '↓' : sortOrder === 'asc' ? '↑' : ''}
            </th>
            <th>Release Date</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {albums.map((album, index) => (
            <tr key={album.id}>
              <td>{index + 1}</td>
              <td><img src={album.image} alt={album.name} width="100" /></td>
              <td>{album.name}</td>
              <td>
                {isOwner ? (
                  <select 
                    className="score-dropdown" 
                    value={album.score || '-'}
                    onChange={(e) => handleScoreChange(album.id, e.target.value)}
                  >
                    {["-", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1"].map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  album.score !== null ? album.score : '-'
                )}
              </td>
              <td>{album.release_date}</td>
              <td>
                {isOwner && (
                  <button 
                    className="remove-btn" 
                    onClick={() => handleRemoveAlbum(album.id)}
                  >
                    -
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
};

export default List;