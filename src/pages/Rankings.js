import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listenToTop100Albums } from '../services/albumService';
import { fetchArtistDetails } from '../services/spotify';
import { db } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const Rankings = () => {
  const [topAlbums, setTopAlbums] = useState([]);
  const [topSpanishAlbums, setTopSpanishAlbums] = useState([]);
  const [activeTab, setActiveTab] = useState('albums');
  const [isUpdatingGenres, setIsUpdatingGenres] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = listenToTop100Albums(async (albums) => {
      // Update albums missing genres with rate limiting
      const updatedAlbums = await updateMissingGenresWithDelay(albums);
      
      // BINARY CLASSIFICATION: Spanish or Not Spanish
      const { englishAlbums, spanishAlbums } = separateAlbumsBinary(updatedAlbums);
      setTopAlbums(englishAlbums);
      setTopSpanishAlbums(spanishAlbums);
    });

    return unsubscribe;
  }, []);

  // NEW: Update genres with delays to avoid rate limiting
  const updateMissingGenresWithDelay = async (albums) => {
    setIsUpdatingGenres(true);
    const updatedAlbums = [...albums];
    let updatedCount = 0;
    
    for (let i = 0; i < updatedAlbums.length; i++) {
      const album = updatedAlbums[i];
      
      // Check if album is missing genres
      const hasGenres = album.genres && album.genres.length > 0;
      const hasSpotifyGenres = album.spotifyGenres && album.spotifyGenres.length > 0;
      
      if (!hasGenres && !hasSpotifyGenres && album.mainArtistId) {
        console.log(`🔄 [${i+1}/${albums.length}] Updating genres for:`, album.name);
        
        try {
          // Add delay between requests to avoid rate limiting
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
          }
          
          // Fetch artist genres from Spotify
          const artistData = await fetchArtistDetails(album.mainArtistId);
          const genres = artistData.genres || [];
          
          if (genres.length > 0) {
            // Update Firestore
            const globalAlbumRef = doc(db, 'albums', album.id);
            await setDoc(globalAlbumRef, {
              genres: genres,
              spotifyGenres: genres,
              lastGenreUpdate: new Date()
            }, { merge: true });
            
            // Update local album data
            updatedAlbums[i] = {
              ...album,
              genres: genres,
              spotifyGenres: genres
            };
            
            updatedCount++;
            console.log('✅ Updated genres for', album.name, ':', genres);
          } else {
            console.log('⚠️ No genres found for', album.name);
          }
        } catch (error) {
          console.error('❌ Error updating genres for', album.name, ':', error);
          
          // If it's a rate limit error, wait longer
          if (error.message.includes('429') || error.message.includes('rate limit')) {
            console.log('⏳ Rate limit hit, waiting 2 seconds...');
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
    }
    
    console.log(`🎯 Genre update complete: ${updatedCount} albums updated`);
    setIsUpdatingGenres(false);
    return updatedAlbums;
  };

  // SIMPLE BINARY CLASSIFICATION: Has Spanish genres = Spanish, Else = English
  const separateAlbumsBinary = (albums) => {
    const spanishAlbums = [];
    const englishAlbums = [];
    
    // DEFINITIVE Spanish/Latin genres
    const spanishGenres = [
      'latin', 'reggaeton', 'trap latino', 'urbano latino', 'latin urban', 
      'bachata', 'salsa', 'merengue', 'flamenco', 'ranchera', 'cumbia', 
      'tango', 'mexican', 'tejano', 'latin pop', 'urbano', 'corrido', 
      'banda', 'norteño', 'mariachi', 'vallenato', 'bolero', 'rumba', 
      'guaracha', 'mambo', 'son cubano', 'latin rock', 'latin alternative', 
      'latin jazz'
    ];

    albums.forEach(album => {
      // Check if album has any Spanish genres
      const albumGenres = album.genres || album.spotifyGenres || [];
      
      let hasSpanishGenre = false;
      
      if (Array.isArray(albumGenres) && albumGenres.length > 0) {
        // Check if any genre matches Spanish genres
        hasSpanishGenre = albumGenres.some(genre => 
          spanishGenres.some(spanishGenre => 
            genre.toLowerCase().includes(spanishGenre)
          )
        );
      }
      
      // BINARY DECISION: Has Spanish genre = Spanish, Else = English
      if (hasSpanishGenre) {
        spanishAlbums.push(album);
      } else {
        englishAlbums.push(album);
      }
    });

    console.log('🎯 Classification Results:');
    console.log('Spanish albums found:', spanishAlbums.length);
    console.log('English albums found:', englishAlbums.length);
    
    // Log classification details
    spanishAlbums.forEach(album => {
      console.log('🇪🇸 SPANISH:', album.name, '- Genres:', album.genres || album.spotifyGenres);
    });
    
    englishAlbums.forEach(album => {
      console.log('🇺🇸 ENGLISH:', album.name, '- Genres:', album.genres || album.spotifyGenres || 'No genres');
    });

    return {
      englishAlbums: englishAlbums.slice(0, 100),
      spanishAlbums: spanishAlbums.slice(0, 100)
    };
  };

  const handleAlbumClick = (album) => {
    if (album.id) {
      navigate(`/album?albumId=${album.id}`);
    }
  };

  return (
    <main className="pt-32 min-h-screen bg-gray-50 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 mb-8">
            <button
              className={`py-3 px-6 font-semibold text-lg border-b-2 transition-colors ${
                activeTab === 'albums'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('albums')}
            >
              Top 100 Albums
            </button>
            <button
              className={`py-3 px-6 font-semibold text-lg border-b-2 transition-colors ${
                activeTab === 'spanish'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('spanish')}
            >
              Top 100 Spanish Albums
            </button>
          </div>

          {isUpdatingGenres && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-4">
              <p className="text-sm">🔄 Updating genre information for albums... This may take a moment.</p>
            </div>
          )}

          <h2 className="text-4xl font-bold text-gray-800 mb-8 text-center font-pacifico">
            {activeTab === 'albums' ? 'Top 100 Albums' : 'Top 100 Spanish Albums'}
          </h2>
          
          {activeTab === 'albums' ? (
            topAlbums.length === 0 ? (
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
                        {album.artists && (
                          <div className="text-md text-gray-500 mt-1">
                            by {Array.isArray(album.artists) ? 
                              album.artists.map(a => typeof a === 'string' ? a : a.name).join(', ') : 
                              album.artists}
                          </div>
                        )}
                        {album.genres && album.genres.length > 0 && (
                          <div className="text-sm text-amber-600 mt-1">
                            Genres: {Array.isArray(album.genres) ? album.genres.join(', ') : album.genres}
                          </div>
                        )}
                        {(!album.genres || album.genres.length === 0) && (
                          <div className="text-sm text-gray-400 mt-1">
                            No genre data available
                          </div>
                        )}
                        <div className="text-xs text-green-600 mt-1 font-semibold">
                          ✓ CLASSIFIED AS: ENGLISH/INTERNATIONAL
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )
          ) : (
            topSpanishAlbums.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-xl">
                {topAlbums.length === 0 ? 'Loading...' : 'No Spanish albums found in the top rankings.'}
              </div>
            ) : (
              <ul className="space-y-4">
                {topSpanishAlbums.map((album, index) => (
                  <li 
                    key={album.id} 
                    className="bg-blue-100 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow cursor-pointer hover:bg-blue-200"
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
                        {album.artists && (
                          <div className="text-md text-gray-500 mt-1">
                            by {Array.isArray(album.artists) ? 
                              album.artists.map(a => typeof a === 'string' ? a : a.name).join(', ') : 
                              album.artists}
                          </div>
                        )}
                        {album.genres && album.genres.length > 0 && (
                          <div className="text-sm text-blue-600 mt-1">
                            Genres: {Array.isArray(album.genres) ? album.genres.join(', ') : album.genres}
                          </div>
                        )}
                        <div className="text-xs text-green-600 mt-1 font-semibold">
                          ✓ CLASSIFIED AS: SPANISH/LATIN
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )
          )}
        </div>
      </div>
    </main>
  );
};

export default Rankings;