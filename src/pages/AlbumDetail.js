import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { fetchAlbumDetails, fetchAlbumTracks } from '../services/spotify';
import { getAlbumRanking } from '../services/albumService';
import { useAuth } from '../context/AuthContext';
import { addFavoriteAlbum, removeFavoriteAlbum, isAlbumFavorited } from '../services/userService';

const AlbumDetail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [album, setAlbum] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalRanking, setGlobalRanking] = useState(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const albumId = searchParams.get('albumId');

  useEffect(() => {
    if (albumId) {
      loadAlbumData(albumId);
      loadAlbumRanking(albumId);
      checkIfFavorited(albumId);
    }
  }, [albumId]);

  const loadAlbumData = async (id) => {
    try {
      setLoading(true);
      const albumData = await fetchAlbumDetails(id);
      const tracksData = await fetchAlbumTracks(id);
      setAlbum(albumData);
      setTracks(tracksData.items || []);
    } catch (error) {
      console.error('Error loading album data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAlbumRanking = async (albumId) => {
    try {
      const ranking = await getAlbumRanking(albumId);
      setGlobalRanking(ranking);
    } catch (error) {
      console.error('Error loading album ranking:', error);
    }
  };

  const checkIfFavorited = async (id) => {
    if (!user) return;
    try {
      const favorited = await isAlbumFavorited(user.uid, id);
      setIsFavorited(favorited);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const handleFavoriteToggle = async () => {
    if (!user) {
      alert('Please login to save favorite albums');
      return;
    }

    try {
      if (isFavorited) {
        await removeFavoriteAlbum(user.uid, albumId);
        setIsFavorited(false);
      } else {
        await addFavoriteAlbum(user.uid, {
          albumId: albumId,
          name: album.name,
          artist: album.artists[0]?.name || 'Unknown Artist',
          image: album.images?.[0]?.url || './media/default-album.jpg',
          releaseDate: album.release_date,
          totalTracks: album.total_tracks
        });
        setIsFavorited(true);
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const handleArtistClick = (artistId) => {
    navigate(`/albums?artistId=${artistId}`);
  };

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const formatReleaseDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading album...</div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Album not found</div>
      </div>
    );
  }

  return (
    <div className="pt-32 min-h-screen bg-gray-50 px-4 pb-8">
      <div className="max-w-6xl mx-auto">
        {/* Album Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Album Cover */}
            <div className="flex-shrink-0 flex justify-center">
              <img
                src={album.images?.[0]?.url || './media/default-album.jpg'}
                alt={album.name}
                className="w-80 h-80 rounded-2xl shadow-2xl object-cover"
              />
            </div>

            {/* Album Info */}
            <div className="flex-1">
              <div className="flex justify-between items-start mb-4">
                <h1 className="text-4xl font-bold text-gray-800">{album.name}</h1>
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
              
              <div className="flex items-center space-x-2 mb-6">
                {album.artists.map((artist, index) => (
                  <React.Fragment key={artist.id}>
                    <span 
                      className="text-xl text-blue-600 hover:text-blue-800 cursor-pointer font-medium"
                      onClick={() => handleArtistClick(artist.id)}
                    >
                      {artist.name}
                    </span>
                    {index < album.artists.length - 1 && <span className="text-gray-400">•</span>}
                  </React.Fragment>
                ))}
              </div>

              {/* Album Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                <div className="text-center bg-blue-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {globalRanking?.averageScore?.toFixed(1) || '0.0'}
                  </div>
                  <div className="text-sm text-blue-800 font-medium">
                    Average Rating
                  </div>
                </div>
                <div className="text-center bg-green-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">{album.total_tracks}</div>
                  <div className="text-sm text-green-800 font-medium">Tracks</div>
                </div>
                <div className="text-center bg-purple-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600">
                    {globalRanking?.numberOfRatings || '0'}
                  </div>
                  <div className="text-sm text-purple-800 font-medium">
                    Total Ratings
                  </div>
                </div>
                <div className="text-center bg-orange-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-orange-600">
                    {globalRanking?.needsMoreRatings ? 'N/R' : globalRanking?.rank ? `#${globalRanking.rank}` : 'N/A'}
                  </div>
                  <div className="text-sm text-orange-800 font-medium">
                    Global Ranking
                    {globalRanking?.needsMoreRatings && globalRanking.numberOfRatings < 3 && (
                      <div className="text-xs mt-1">
                        Needs {3 - globalRanking.numberOfRatings} more
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="space-y-3 text-gray-700">
                <div className="flex items-center">
                  <strong className="w-32">Release Date:</strong>
                  <span>{formatReleaseDate(album.release_date)}</span>
                </div>
                <div className="flex items-center">
                  <strong className="w-32">Label:</strong>
                  <span>{album.label || 'Unknown'}</span>
                </div>
                <div className="flex items-center">
                  <strong className="w-32">Album Type:</strong>
                  <span className="capitalize">{album.album_type}</span>
                </div>
                {album.genres && album.genres.length > 0 && (
                  <div className="flex items-start">
                    <strong className="w-32">Genres:</strong>
                    <span>{album.genres.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Track List */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Track List ({tracks.length} songs)</h2>
          <div className="space-y-1">
            {tracks.map((track, index) => (
              <div key={track.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex items-center space-x-4 flex-1">
                  <span className="text-gray-500 w-8 text-center font-medium">{index + 1}</span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{track.name}</div>
                    <div className="text-sm text-gray-600">
                      {track.artists.map(artist => artist.name).join(', ')}
                    </div>
                  </div>
                </div>
                <div className="text-gray-500 font-medium">
                  {formatDuration(track.duration_ms)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlbumDetail;