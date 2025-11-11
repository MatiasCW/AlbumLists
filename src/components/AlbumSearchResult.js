import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { doc, getDoc, setDoc, deleteDoc, runTransaction } from 'firebase/firestore';

const AlbumSearchResult = ({ album }) => {
  const { user } = useAuth();
  const [isInList, setIsInList] = useState(false);
  const [userScore, setUserScore] = useState(null);

  useEffect(() => {
    checkIfInList();
  }, [album.id, user]);

  const checkIfInList = async () => {
    if (!user) return;
    
    try {
      const userAlbumRef = doc(db, 'users', user.uid, 'albums', album.id);
      const userAlbumSnap = await getDoc(userAlbumRef);
      
      if (userAlbumSnap.exists()) {
        setIsInList(true);
        setUserScore(userAlbumSnap.data().score || null);
      } else {
        setIsInList(false);
        setUserScore(null);
      }
    } catch (error) {
      console.error('Error checking if album is in list:', error);
    }
  };

  const handleAddAlbum = async () => {
    if (!user) {
      alert('Please login to add albums to your list');
      return;
    }

    try {
      const userAlbumRef = doc(db, 'users', user.uid, 'albums', album.id);
      
      const artists = album.artists.map(artist => ({
        id: artist.id,
        name: artist.name
      }));

      await setDoc(userAlbumRef, {
        spotifyId: album.id,
        name: album.name,
        image: album.images?.[0]?.url || './media/default-album.jpg',
        release_date: album.release_date,
        artists: artists,
        addedAt: new Date()
      });

      setIsInList(true);
    } catch (error) {
      console.error('Error adding album:', error);
      alert('Error adding album to your list');
    }
  };

  const handleRemoveAlbum = async () => {
    if (!user) return;

    try {
      const userAlbumRef = doc(db, 'users', user.uid, 'albums', album.id);
      const userAlbumSnap = await getDoc(userAlbumRef);
      
      if (!userAlbumSnap.exists()) return;

      const spotifyId = album.id;
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
      setIsInList(false);
      setUserScore(null);
    } catch (error) {
      console.error('Error removing album:', error);
      alert('Error removing album from your list');
    }
  };

  const handleScoreChange = async (newScore) => {
    if (!user) return;
    
    const selectedScore = newScore === '-' ? null : Number(newScore);
    const userAlbumRef = doc(db, 'users', user.uid, 'albums', album.id);
    
    try {
      const userAlbumSnap = await getDoc(userAlbumRef);
      if (!userAlbumSnap.exists()) return;

      const spotifyId = album.id;
      
      await setDoc(userAlbumRef, { 
        score: selectedScore 
      }, { merge: true });

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
          name: album.name,
          image: album.images?.[0]?.url || './media/default-album.jpg'
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

      setUserScore(selectedScore);
    } catch (error) {
      console.error("Error updating score:", error);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 flex items-center justify-between hover:shadow-lg transition-shadow">
      <div className="flex items-center space-x-4 flex-1">
        <img 
          src={album.images?.[0]?.url || './media/default-album.jpg'} 
          alt={album.name}
          className="w-16 h-16 rounded-lg object-cover"
        />
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-800">{album.name}</h3>
          <p className="text-gray-600">
            {album.artists.map(artist => artist.name).join(', ')}
          </p>
          <p className="text-sm text-gray-500">{album.release_date.split('-')[0]}</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        {isInList ? (
          <>
            <select 
              value={userScore || '-'}
              onChange={(e) => handleScoreChange(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {["-", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1"].map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <button
              onClick={handleRemoveAlbum}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              Remove
            </button>
          </>
        ) : (
          <button
            onClick={handleAddAlbum}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
          >
            Add to List
          </button>
        )}
      </div>
    </div>
  );
};

export default AlbumSearchResult;