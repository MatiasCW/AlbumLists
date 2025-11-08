import React, { useState, useEffect } from 'react';
import { getFavoriteArtists } from '../services/userService';

const FavoriteArtistsGrid = ({ userId }) => {
  const [favoriteArtists, setFavoriteArtists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavoriteArtists();
  }, [userId]);

  const loadFavoriteArtists = async () => {
    try {
      const artists = await getFavoriteArtists(userId);
      setFavoriteArtists(artists);
    } catch (error) {
      console.error('Error loading favorite artists:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4 text-gray-600">Loading favorite artists...</div>;
  }

  if (favoriteArtists.length === 0) {
    return <div className="text-center py-4 text-gray-600">No favorite artists yet</div>;
  }

  return (
    <div className="favorite-artists-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {favoriteArtists.map(artist => (
        <div key={artist.id} className="artist-card bg-white bg-opacity-80 rounded-lg p-3 text-center shadow-md">
          <img 
            src={artist.image} 
            alt={artist.name}
            className="w-16 h-16 rounded-full object-cover mx-auto mb-2 border-2 border-blue-400"
            onError={(e) => { e.target.src = './media/default.jpg'; }}
          />
          <p className="text-sm font-medium text-gray-800 line-clamp-2">{artist.name}</p>
        </div>
      ))}
    </div>
  );
};

export default FavoriteArtistsGrid;