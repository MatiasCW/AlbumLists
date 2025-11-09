import React, { useState } from 'react';
import SearchBar from '../components/SearchBar';
import { searchAlbums } from '../services/spotify';
import BackgroundSlideshow from '../components/BackgroundSlideshow';
import AlbumSearchResult from '../components/AlbumSearchResult';

const Search = () => {
  const [albumResults, setAlbumResults] = useState([]);
  const [searching, setSearching] = useState(false);

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

  return (
    <div className="min-h-screen">
      <BackgroundSlideshow />
      <div className="pt-40 px-4 pb-8">
        <div className="max-w-4xl mx-auto">
          <SearchBar 
            onSearch={handleAlbumSearch}
            placeholder="Type an album name and press Enter..."
          />

          {/* Album Search Results */}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Search;