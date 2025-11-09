import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listenToTop100Albums } from '../services/albumService';

const Rankings = () => {
  const [topAlbums, setTopAlbums] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = listenToTop100Albums((albums) => {
      console.log('Top albums loaded:', albums); // DEBUG
      setTopAlbums(albums);
    });

    return unsubscribe;
  }, []);

  const handleAlbumClick = (album) => {
    console.log('Album clicked:', album); // DEBUG
    console.log('Album ID:', album.id); // DEBUG
    console.log('Album Spotify ID:', album.spotifyId); // DEBUG
    
    // Try different ID fields
    const albumId = album.spotifyId || album.id;
    
    if (albumId) {
      console.log('Navigating to album:', albumId); // DEBUG
      navigate(`/album?albumId=${albumId}`);
    } else {
      console.log('No valid album ID found'); // DEBUG
    }
  };

  return (
    <main className="pt-32 min-h-screen bg-gray-50 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-4xl font-bold text-gray-800 mb-8 text-center font-pacifico">
            Top 100 Albums
          </h2>
          
          {topAlbums.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-xl">
              Loading albums...
            </div>
          ) : (
            <ul className="space-y-4">
              {topAlbums.map((album, index) => (
                <li 
                  key={album.id} 
                  className="bg-amber-100 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow cursor-pointer hover:bg-amber-200"
                  onClick={() => handleAlbumClick(album)}
                >
                  <div className="album-item flex items-center space-x-6">
                    <img 
                      src={album.image} 
                      alt={album.name} 
                      className="w-24 h-24 rounded-lg object-cover shadow-md flex-shrink-0"
                    />
                    <div className="album-details flex-grow">
                      <strong className="text-2xl text-gray-800 block mb-2">
                        {index + 1}. {album.name}
                      </strong>
                      <span className="text-lg text-gray-600 font-semibold">
                        Average Score: {album.averageScore?.toFixed(1) || '0.0'}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
};

export default Rankings;