import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, getDoc, runTransaction } from 'firebase/firestore';

const List = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const [albums, setAlbums] = useState([]);
  const [sortOrder, setSortOrder] = useState('default');
  const [showColorModal, setShowColorModal] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [fontColor, setFontColor] = useState('#000000');
  const uid = searchParams.get('uid') || user?.uid;

  useEffect(() => {
    if (uid) {
      fetchAlbums(uid);
      if (user?.uid === uid) {
        loadUserColors(uid);
      }
    }
  }, [uid, sortOrder, user]);

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

  const loadUserColors = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const bgColor = userData.backgroundColor || '#ffffff';
        const fColor = userData.fontColor || '#000000';
        
        setBackgroundColor(bgColor);
        setFontColor(fColor);
        applyColors(bgColor, fColor);
      }
    } catch (error) {
      console.error("Error loading user colors:", error);
    }
  };

  const applyColors = (bgColor, fColor) => {
    if (bgColor) {
      document.body.style.backgroundColor = bgColor;
    }
    if (fColor) {
      const allElements = document.querySelectorAll('body, body *:not(.modal *):not(button):not(input):not(select)');
      allElements.forEach(element => {
        if (!element.closest('.modal')) {
          element.style.color = fColor;
        }
      });
    }
  };

  const handleColorChange = async (type, color) => {
    if (type === 'background') {
      setBackgroundColor(color);
      document.body.style.backgroundColor = color;
    } else {
      setFontColor(color);
      const allElements = document.querySelectorAll('body, body *:not(.modal *):not(button):not(input):not(select)');
      allElements.forEach(element => {
        if (!element.closest('.modal')) {
          element.style.color = color;
        }
      });
    }

    if (user && user.uid === uid) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          [type === 'background' ? 'backgroundColor' : 'fontColor']: color
        });
      } catch (error) {
        console.error("Error saving colors:", error);
      }
    }
  };

  // NEW: Handle album click to navigate to album detail page
  const handleAlbumClick = (album) => {
    if (album.spotifyId) {
      navigate(`/album?albumId=${album.spotifyId}`);
    }
  };

  const handleScoreChange = async (albumId, newScore) => {
    if (!user) return;
    
    const selectedScore = newScore === '-' ? null : Number(newScore);
    const userAlbumRef = doc(db, 'users', user.uid, 'albums', albumId);
    
    try {
      // Get the album data first
      const userAlbumSnap = await getDoc(userAlbumRef);
      if (!userAlbumSnap.exists()) return;

      const spotifyId = userAlbumSnap.data().spotifyId;
      
      // Update user's album score
      await updateDoc(userAlbumRef, { score: selectedScore });

      // Update global album stats
      const globalAlbumRef = doc(db, 'albums', spotifyId);
      const userRatingRef = doc(globalAlbumRef, 'ratings', user.uid);

      const userRatingSnap = await getDoc(userRatingRef);
      const oldRating = userRatingSnap.exists() ? userRatingSnap.data().rating : null;

      await runTransaction(db, async (transaction) => {
        const albumSnap = await transaction.get(globalAlbumRef);
        const albumData = albumSnap.exists() ? albumSnap.data() : {
          totalScore: 0,
          numberOfRatings: 0,
          averageScore: 0,
          name: userAlbumSnap.data().name,
          image: userAlbumSnap.data().image
        };

        let totalScore = Number(albumData.totalScore) || 0;
        let numberOfRatings = Number(albumData.numberOfRatings) || 0;

        if (oldRating !== null) {
          totalScore -= Number(oldRating) || 0;
        }

        if (selectedScore !== null) {
          const newRating = Number(selectedScore) || 0;
          totalScore += newRating;
          if (oldRating === null) numberOfRatings += 1;
        } else {
          numberOfRatings = Math.max(numberOfRatings - 1, 0);
        }

        totalScore = Math.max(totalScore, 0);
        numberOfRatings = Math.max(numberOfRatings, 0);

        const averageScore = numberOfRatings > 0 ? totalScore / numberOfRatings : 0;

        transaction.set(globalAlbumRef, {
          ...albumData,
          totalScore,
          numberOfRatings,
          averageScore
        }, { merge: true });

        if (selectedScore !== null) {
          transaction.set(userRatingRef, { rating: Number(selectedScore) || 0 });
        } else {
          transaction.delete(userRatingRef);
        }
      });

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
        const userAlbumSnap = await getDoc(userAlbumRef);
        
        if (!userAlbumSnap.exists()) return;

        const spotifyId = userAlbumSnap.data().spotifyId;
        const globalAlbumRef = doc(db, 'albums', spotifyId);
        const userRatingRef = doc(globalAlbumRef, 'ratings', user.uid);

        const userRatingSnap = await getDoc(userRatingRef);
        const oldRating = userRatingSnap.exists() ? userRatingSnap.data().rating : null;

        await runTransaction(db, async (transaction) => {
          const albumSnap = await transaction.get(globalAlbumRef);
          if (albumSnap.exists()) {
            const albumData = albumSnap.data();
            let totalScore = Number(albumData.totalScore) || 0;
            let numberOfRatings = Number(albumData.numberOfRatings) || 0;

            if (oldRating !== null) {
              totalScore -= Number(oldRating) || 0;
              numberOfRatings = Math.max(numberOfRatings - 1, 0);
            }

            const averageScore = numberOfRatings > 0 ? totalScore / numberOfRatings : 0;

            transaction.set(globalAlbumRef, {
              ...albumData,
              totalScore,
              numberOfRatings,
              averageScore
            }, { merge: true });
          }

          transaction.delete(userRatingRef);
        });

        await deleteDoc(userAlbumRef);
        fetchAlbums(user.uid);
      } catch (error) {
        console.error("Error removing album:", error);
      }
    }
  };

  const isOwner = !searchParams.get('uid') || user?.uid === searchParams.get('uid');

  return (
    <main className="pt-32 min-h-screen px-4">
      <div className="max-w-6xl mx-auto">
        {isOwner && (
          <button 
            className="bg-gray-500 text-white px-6 py-3 rounded-lg mb-6 hover:bg-gray-600 transition-colors"
            onClick={() => setShowColorModal(true)}
          >
            Style
          </button>
        )}
        
        {/* Color Modal */}
        {showColorModal && (
          <div className="modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="modal-content bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Choose Colors</h2>
                <button 
                  className="close text-2xl hover:text-gray-700"
                  onClick={() => setShowColorModal(false)}
                >
                  &times;
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="backgroundColorPicker" className="block mb-2 font-medium">
                    Background Color:
                  </label>
                  <input
                    type="color"
                    id="backgroundColorPicker"
                    value={backgroundColor}
                    onChange={(e) => handleColorChange('background', e.target.value)}
                    className="w-full h-10 cursor-pointer"
                  />
                </div>
                
                <div>
                  <label htmlFor="fontColorPicker" className="block mb-2 font-medium">
                    Font Color:
                  </label>
                  <input
                    type="color"
                    id="fontColorPicker"
                    value={fontColor}
                    onChange={(e) => handleColorChange('font', e.target.value)}
                    className="w-full h-10 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
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
                  onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : sortOrder === 'asc' ? 'default' : 'desc')}
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
                    <img 
                      src={album.image} 
                      alt={album.name} 
                      className="w-20 h-20 rounded-lg object-cover shadow-md cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => handleAlbumClick(album)}
                    />
                  </td>
                  <td 
                    className="px-6 py-4 font-semibold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => handleAlbumClick(album)}
                  >
                    {album.name}
                  </td>
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