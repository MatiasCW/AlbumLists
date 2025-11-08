import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

const List = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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
    if (!user) return;
    
    const selectedScore = newScore === '-' ? null : Number(newScore);
    const userAlbumRef = doc(db, 'users', user.uid, 'albums', albumId);
    
    try {
      await updateDoc(userAlbumRef, { score: selectedScore });
      fetchAlbums(user.uid);
    } catch (error) {
      console.error("Error updating score:", error);
    }
  };

  const handleRemoveAlbum = async (albumId) => {
    if (!user) return;
    
    if (window.confirm("Are you sure you want to remove this album?")) {
      try {
        const userAlbumRef = doc(db, 'users', user.uid, 'albums', albumId);
        await deleteDoc(userAlbumRef);
        fetchAlbums(user.uid);
      } catch (error) {
        console.error("Error removing album:", error);
      }
    }
  };

  const isOwner = !searchParams.get('uid') || user?.uid === searchParams.get('uid');

  return (
    <main className="pt-32 min-h-screen bg-gray-50 px-4">
      <div className="max-w-6xl mx-auto">
        {isOwner && (
          <button className="bg-gray-500 text-white px-6 py-3 rounded-lg mb-6 hover:bg-gray-600 transition-colors">
            Style
          </button>
        )}
        
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <table className="album-table w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">Rank</th>
                <th className="px-6 py-4 text-left font-semibold">Cover</th>
                <th className="px-6 py-4 text-left font-semibold">Album Name</th>
                <th 
                  className="px-6 py-4 text-left font-semibold cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                >
                  Score {sortOrder === 'desc' ? '↓' : sortOrder === 'asc' ? '↑' : ''}
                </th>
                <th className="px-6 py-4 text-left font-semibold">Release Date</th>
                {isOwner && <th className="px-6 py-4 text-left font-semibold">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {albums.map((album, index) => (
                <tr key={album.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium">{index + 1}</td>
                  <td className="px-6 py-4">
                    <img src={album.image} alt={album.name} className="w-20 h-20 rounded-lg object-cover shadow-md" />
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-800">{album.name}</td>
                  <td className="px-6 py-4">
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
                  <td className="px-6 py-4 text-gray-600">{album.release_date}</td>
                  <td className="px-6 py-4">
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
          
          {albums.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No albums saved yet.
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default List;