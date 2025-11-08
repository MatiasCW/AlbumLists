import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchArtistDetails, fetchArtistAlbums } from '../services/spotify';

const Albums = () => {
  const [searchParams] = useSearchParams();
  const [artist, setArtist] = useState(null);
  const [albums, setAlbums] = useState([]);
  const artistId = searchParams.get('artistId');

  useEffect(() => {
    if (artistId) {
      loadArtistData(artistId);
    }
  }, [artistId]);

  const loadArtistData = async (id) => {
    try {
      const artistData = await fetchArtistDetails(id);
      const artistAlbums = await fetchArtistAlbums(id);
      setArtist(artistData);
      setAlbums(artistAlbums);
    } catch (error) {
      console.error('Error loading artist data:', error);
    }
  };

  if (!artist) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading artist...</div>
      </div>
    );
  }

  return (
    <div className="pt-32 min-h-screen bg-gray-50 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Artist Jumbotron */}
        <div className="artist-jumbotron bg-black bg-opacity-70 rounded-2xl p-6 mb-8 flex justify-between items-center">
          <div className="artist-info flex items-center space-x-6 flex-1">
            <img 
              src={artist.images?.[0]?.url || '/media/default.jpg'} 
              alt={artist.name} 
              className="w-20 h-20 rounded-full object-cover border-2 border-white border-opacity-20 flex-shrink-0"
            />
            <h2 className="text-3xl font-bold text-white truncate">{artist.name}</h2>
          </div>
          <button className="favorite-btn bg-yellow-400 text-black py-2 px-6 rounded font-semibold hover:bg-yellow-300 transition-colors duration-200 flex-shrink-0">
            ☆ Add to Favorites
          </button>
        </div>

        {/* Albums Grid */}
        <div className="album-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {albums.map(album => (
            <div key={album.id} className="album bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <img 
                src={album.images[0]?.url} 
                alt={album.name} 
                className="w-full h-48 object-cover rounded-lg mb-4 shadow-md"
              />
              <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">{album.name}</h3>
              <p className="text-gray-600 mb-4">
                <strong>Release Date:</strong> {album.release_date}
              </p>
              <button className="add-btn">
                +
              </button>
            </div>
          ))}
        </div>

        {albums.length === 0 && (
          <div className="text-center py-12 text-gray-500 text-xl">
            No albums found for this artist.
          </div>
        )}
      </div>
    </div>
  );
};

export default Albums;