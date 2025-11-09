import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchArtistDetails, fetchArtistAlbums } from '../services/spotify';
import { addFavoriteArtist, removeFavoriteArtist, isArtistFavorited } from '../services/userService';
import AlbumCard from '../components/AlbumCard';
import { getAlbumRanking } from '../services/albumService';

const Albums = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [artist, setArtist] = useState(null);
  const [albums, setAlbums] = useState([]);
  const [isFavorited, setIsFavorited] = useState(false);
  const [albumRatings, setAlbumRatings] = useState({});
  const artistId = searchParams.get('artistId');

  useEffect(() => {
    if (artistId) {
      loadArtistData(artistId);
      checkIfFavorited(artistId);
    }
  }, [artistId]);

  const loadArtistData = async (id) => {
    try {
      const artistData = await fetchArtistDetails(id);
      const artistAlbums = await fetchArtistAlbums(id);
      setArtist(artistData);
      setAlbums(artistAlbums);

      // Load ratings for all albums
      loadAlbumRatings(artistAlbums);
    } catch (error) {
      console.error('Error loading artist data:', error);
    }
  };

  const loadAlbumRatings = async (albumsList) => {
    try {
      const ratings = {};
      for (const album of albumsList) {
        const ranking = await getAlbumRanking(album.id);
        ratings[album.id] = ranking;
      }
      setAlbumRatings(ratings);
    } catch (error) {
      console.error('Error loading album ratings:', error);
    }
  };

  const checkIfFavorited = async (id) => {
    if (!user) return;
    try {
      const favorited = await isArtistFavorited(user.uid, id);
      setIsFavorited(favorited);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const handleFavoriteToggle = async () => {
    if (!user) {
      alert('Please login to save favorite artists');
      return;
    }

    try {
      if (isFavorited) {
        await removeFavoriteArtist(user.uid, artistId);
        setIsFavorited(false);
      } else {
        await addFavoriteArtist(user.uid, {
          artistId: artistId,
          name: artist.name,
          image: artist.images?.[0]?.url || './media/default.jpg'
        });
        setIsFavorited(true);
      }
    } catch (error) {
      alert(error.message);
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
              src={artist.images?.[0]?.url || './media/default.jpg'}
              alt={artist.name}
              className="w-20 h-20 rounded-full object-cover border-2 border-white border-opacity-20 flex-shrink-0"
            />
            <h2 className="text-3xl font-bold text-white truncate">{artist.name}</h2>
          </div>
          <button
            className={`favorite-btn py-2 px-6 rounded font-semibold transition-colors duration-200 flex-shrink-0 ${isFavorited
                ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                : 'bg-gray-600 text-white hover:bg-gray-500'
              }`}
            onClick={handleFavoriteToggle}
          >
            {isFavorited ? '★ Remove Favorite' : '☆ Add to Favorites'}
          </button>
        </div>

        {/* Albums Grid */}
        <div className="album-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {albums.map(album => {
            const rating = albumRatings[album.id];
            const hasRating = rating && !rating.needsMoreRatings;

            return (
              <div key={album.id} className="relative">
                <AlbumCard 
                  album={{
                    ...album,
                    // Pass the averageScore to AlbumCard so it displays the star rating
                    averageScore: hasRating ? rating.averageScore : 0
                  }} 
                />

                {/* Rating Display */}
                <div className="absolute top-3 right-3 bg-black bg-opacity-70 rounded-lg p-2 backdrop-blur-sm">
                  <div className="text-white font-bold text-sm text-center">
                    {hasRating ? rating.averageScore?.toFixed(1) : 'N/A'}
                  </div>
                  {rating && (
                    <div className="text-xs text-gray-300 text-center mt-1">
                      {rating.numberOfRatings || 0} rating{rating.numberOfRatings !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>

                {/* Global Rank Badge */}
                {hasRating && rating.rank && (
                  <div className="absolute top-3 left-3 bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold shadow-lg">
                    #{rating.rank}
                  </div>
                )}
              </div>
            );
          })}
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