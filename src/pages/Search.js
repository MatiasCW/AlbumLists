// Update your Search.js file
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import { searchArtist, searchAlbums } from '../services/spotify';
import BackgroundSlideshow from '../components/BackgroundSlideshow';
import AlbumSearchResult from '../components/AlbumSearchResult';

const Search = () => {
  const navigate = useNavigate();
  const [searchType, setSearchType] = useState('artists'); // 'artists' or 'albums'
  const [albumResults, setAlbumResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleArtistSearch = async (artistName) => {
    try {
      const artist = await searchArtist(artistName);
      if (artist) {
        navigate(`/albums?artistId=${artist.id}`);
      } else {
        alert('Artist not found');
      }
    } catch (error) {
      console.error('Error searching artist:', error);
      alert('Error searching for artist');
    }
  };

  const handleAlbumSearch = async (albumName) => {
    try {
      setSearching(true);
      const albums = await searchAlbums(albumName);
      setAlbumResults(albums);
    } catch (error) {
      console.error('Error searching albums:', error);
      alert('Error searching for albums');
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = (query) => {
    if (searchType === 'artists') {
      handleArtistSearch(query);
    } else {
      handleAlbumSearch(query);
    }
  };

  return (
    <div className="min-h-screen">
      <BackgroundSlideshow />
      <div className="pt-40 px-4 pb-8">
        <div className="max-w-4xl mx-auto">
          {/* Search Type Toggle */}
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-full p-1 shadow-lg">
              <button
                className={`px-6 py-2 rounded-full transition-colors ${
                  searchType === 'artists' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setSearchType('artists')}
              >
                Search Artists
              </button>
              <button
                className={`px-6 py-2 rounded-full transition-colors ${
                  searchType === 'albums' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setSearchType('albums')}
              >
                Search Albums
              </button>
            </div>
          </div>

          <SearchBar 
            onSearch={handleSearch}
            placeholder={searchType === 'artists' 
              ? "Type an artist name and press Enter..." 
              : "Type an album name and press Enter..."}
          />

          {/* Album Search Results */}
          {searchType === 'albums' && (
            <div className="mt-8 space-y-4">
              {searching && (
                <div className="text-center text-white text-lg">Searching...</div>
              )}
              
              {!searching && albumResults.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-white text-center mb-4">
                    Album Results ({albumResults.length})
                  </h2>
                  {albumResults.map(album => (
                    <AlbumSearchResult key={album.id} album={album} />
                  ))}
                </div>
              )}
              
              {!searching && albumResults.length === 0 && null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;