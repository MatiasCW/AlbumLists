import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import { searchArtist } from '../services/spotify';
import BackgroundSlideshow from '../components/BackgroundSlideshow';

const Search = () => {
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen">
      <BackgroundSlideshow />
      <div className="pt-40 px-4">
        <div className="max-w-4xl mx-auto">
          <SearchBar 
            onSearch={handleArtistSearch}
            placeholder="Type an artist name and press Enter..."
          />
        </div>
      </div>
    </div>
  );
};

export default Search;