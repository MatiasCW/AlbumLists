import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFavoriteArtists, removeFavoriteArtist } from '../services/userService';
import { useAuth } from '../context/AuthContext';

const FavoriteArtistsHorizontal = ({ userId }) => {
  const [favoriteArtists, setFavoriteArtists] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (userId) {
      loadFavoriteArtists();
    }
  }, [userId]);

  const loadFavoriteArtists = async () => {
    try {
      const artists = await getFavoriteArtists(userId);
      setFavoriteArtists(artists);
    } catch (error) {
      console.error('Error loading favorite artists:', error);
    }
  };

  const handleArtistClick = (artistId) => {
    navigate(`/albums?artistId=${artistId}`);
  };

  const handleRemoveArtist = async (artistId, e) => {
    e.stopPropagation(); // Prevent navigating to artist page
    if (!user || user.uid !== userId) return;

    try {
      await removeFavoriteArtist(user.uid, artistId);
      setFavoriteArtists(prev => prev.filter(artist => artist.artistId !== artistId));
    } catch (error) {
      console.error('Error removing favorite artist:', error);
      alert('Failed to remove artist from favorites');
    }
  };

  const isOwner = user?.uid === userId;

  return (
    <div className="favorite-artists-horizontal bg-white bg-opacity-90 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white border-opacity-30 w-full max-w-4xl mx-auto">
      <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Favorite Artists {favoriteArtists.length > 0 && `(${favoriteArtists.length}/10)`}
      </h3>
      
      {favoriteArtists.length === 0 ? (
        <p className="text-gray-500 text-center py-8 text-lg">
          {isOwner ? 'No favorite artists yet. Add some from artist pages!' : 'No favorite artists yet.'}
        </p>
      ) : (
        <div className="horizontal-scroll-container overflow-x-auto pb-2">
          <div className="flex space-x-6 min-w-min px-4">
            {favoriteArtists.map(artist => (
              <div 
                key={artist.id} 
                className="artist-item flex-shrink-0 w-28 text-center cursor-pointer transform hover:scale-105 transition-transform duration-200 relative group"
                onClick={() => handleArtistClick(artist.artistId)}
              >
                <div className="relative">
                  <img
                    src={artist.image}
                    alt={artist.name}
                    className="w-24 h-24 rounded-full object-cover border-2 border-blue-500 mx-auto shadow-md"
                  />
                  {isOwner && (
                    <button
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                      onClick={(e) => handleRemoveArtist(artist.artistId, e)}
                    >
                      ×
                    </button>
                  )}
                </div>
                <p className="mt-3 text-sm font-medium text-gray-800 truncate px-1">
                  {artist.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FavoriteArtistsHorizontal;