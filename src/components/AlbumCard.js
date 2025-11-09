import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { doc, setDoc } from 'firebase/firestore';

const AlbumCard = ({ album }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleAlbumClick = () => {
    navigate(`/album?albumId=${album.id}`);
  };

  const handleAddToList = async (e) => {
    e.stopPropagation(); // Prevent navigating to album detail
    
    if (!user) {
      alert('Please login to add albums to your list');
      return;
    }

    try {
      const userAlbumRef = doc(db, 'users', user.uid, 'albums', album.id);
      
      await setDoc(userAlbumRef, {
        spotifyId: album.id,
        name: album.name,
        image: album.images?.[0]?.url || './media/default-album.jpg',
        release_date: album.release_date,
        artists: album.artists?.map(artist => artist.name) || [],
        genres: album.genres || [], // CRITICAL: Include genres
        addedAt: new Date()
      });

      alert('Album added to your list!');
    } catch (error) {
      console.error('Error adding album to list:', error);
      alert('Error adding album to your list');
    }
  };

  return (
    <div 
      className="text-center bg-white p-6 rounded-xl shadow-md transition-all duration-300 cursor-pointer hover:-translate-y-2 hover:shadow-xl border border-gray-100"
      onClick={handleAlbumClick}
    >
      <div className="flex justify-center mb-4">
        <img 
          src={album.images?.[0]?.url || album.image || './media/default-album.jpg'} 
          alt={album.name} 
          className="w-32 h-32 rounded-lg object-cover border-4 border-blue-500 shadow-md"
          onError={(e) => { e.target.src = './media/default-album.jpg'; }} 
        />
      </div>
      <div className="font-bold text-lg text-gray-800 mb-2 line-clamp-2 h-14 flex items-center justify-center">
        {album.name}
      </div>
      <div className="text-yellow-500 text-base font-bold flex items-center justify-center space-x-1 mb-2">
        <span>⭐</span>
        <span>{album.averageScore?.toFixed(1) || '0.0'}</span>
      </div>
      
      {/* ADD THIS BUTTON */}
      {user && (
        <button 
          onClick={handleAddToList}
          className="bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors"
        >
          Add to List
        </button>
      )}
    </div>
  );
};

export default AlbumCard;