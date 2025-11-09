import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { addAlbumToCollection, removeAlbumFromCollection, isAlbumInCollection } from '../services/userService';

const AlbumCard = ({ album }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isInCollection, setIsInCollection] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && album.id) {
      checkIfInCollection(album.id);
    }
  }, [user, album.id]);

  const checkIfInCollection = async (albumId) => {
    try {
      const inCollection = await isAlbumInCollection(user.uid, albumId);
      setIsInCollection(inCollection);
    } catch (error) {
      console.error('Error checking collection status:', error);
    }
  };

  const handleAlbumClick = () => {
    navigate(`/album?albumId=${album.id}`);
  };

  const handleCollectionToggle = async (e) => {
    e.stopPropagation();
    setLoading(true);

    if (!user) {
      alert('Please login to manage your collection');
      setLoading(false);
      return;
    }

    try {
      if (isInCollection) {
        await removeAlbumFromCollection(user.uid, album.id);
        setIsInCollection(false);
        console.log('Removed from collection:', album.name);
      } else {
        // Format the album data correctly for Firestore
        const albumData = {
          albumId: album.id,
          name: album.name,
          artist: album.artists?.[0]?.name || 'Unknown Artist',
          image: album.images?.[0]?.url || './media/default-album.jpg',
          releaseDate: album.release_date,
          totalTracks: album.total_tracks
        };
        
        await addAlbumToCollection(user.uid, albumData);
        setIsInCollection(true);
        console.log('Added to collection:', album.name);
      }
    } catch (error) {
      console.error('Collection error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
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
      
      <button 
        onClick={handleCollectionToggle}
        disabled={loading}
        className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors duration-200 ${
          isInCollection 
            ? 'bg-red-500 text-white hover:bg-red-600' 
            : 'bg-green-500 text-white hover:bg-green-600'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {loading ? '...' : isInCollection ? 'Remove from Collection' : 'Add to Collection'}
      </button>
    </div>
  );
};

export default AlbumCard;