import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listenToTop100Albums } from '../services/albumService';

const Rankings = () => {
  const [topAlbums, setTopAlbums] = useState([]);
  const [topSpanishAlbums, setTopSpanishAlbums] = useState([]);
  const [activeTab, setActiveTab] = useState('albums');
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = listenToTop100Albums((albums) => {
      // Use SIMPLE artist-based detection - no API calls
      const { englishAlbums, spanishAlbums } = separateAlbumsByArtist(albums);
      setTopAlbums(englishAlbums);
      setTopSpanishAlbums(spanishAlbums);
    });

    return unsubscribe;
  }, []);

  // SIMPLE and RELIABLE: Separate by known Spanish artists only
  const separateAlbumsByArtist = (albums) => {
    const spanishAlbums = [];
    const englishAlbums = [];
    
    // Comprehensive list of Spanish/Latin artists
    const spanishArtists = new Set([
      'bad bunny', 'anuel aa', 'j balvin', 'ozuna', 'daddy yankee', 
      'shakira', 'enrique iglesias', 'ricky martin', 'maluma', 'karol g', 
      'rosalía', 'becky g', 'nicky jam', 'wisin', 'yandel', 'don omar', 
      'pitbull', 'marc anthony', 'romeo santos', 'prince royce', 'juanes', 
      'maná', 'chayanne', 'luis fonsi', 'thalia', 'paulina rubio', 
      'alejandro fernandez', 'vicente fernandez', 'carlos vives', 'fonseca', 
      'jesse & joy', 'reik', 'camila', 'sin bandera', 'la arrolladora',
      'calibre 50', 'gerardo ortiz', 'christian nodal', 'grupo firme',
      'myke towers', 'arcángel', 'farruko', 'zion', 'lennox', 'tito el bambino',
      'plan b', 'tego calderon', 'hector el father', 'sech', 'rauw alejandro',
      'c. tangana', 'aitana', 'dani martín', 'pablo alborán', 'alejandro sanz',
      'emmanuel', 'feid', 'manuel turizo', 'camilo', 'natti natasha',
      'lunay', 'lenny tavárez', 'dalex', 'justin quiles', 'mau y ricky',
      'jhayco', 'jhay cortez', 'myke towers', 'alex rose', 'casper magico',
      'nengo flow', 'de la ghetto', 'zion & lennox'
    ]);

    albums.forEach(album => {
      let artistNames = '';
      
      // Extract artist names from album data
      if (album.artists) {
        if (Array.isArray(album.artists)) {
          artistNames = album.artists.map(artist => 
            typeof artist === 'string' ? artist.toLowerCase() : artist.name?.toLowerCase() || ''
          ).join(' ');
        } else {
          artistNames = album.artists.toLowerCase();
        }
      }
      
      // Also check mainArtistName if available
      if (album.mainArtistName) {
        artistNames += ' ' + album.mainArtistName.toLowerCase();
      }

      // Check if any Spanish artist is in the artist names
      let isSpanish = false;
      for (const spanishArtist of spanishArtists) {
        if (artistNames.includes(spanishArtist)) {
          isSpanish = true;
          break;
        }
      }

      if (isSpanish) {
        spanishAlbums.push(album);
      } else {
        englishAlbums.push(album);
      }
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

  // Function to manually fix album classification (for testing)
  const manuallyClassifyAlbum = (album) => {
    const artistNames = album.artists ? 
      (Array.isArray(album.artists) ? 
        album.artists.map(a => typeof a === 'string' ? a : a.name).join(', ') : 
        album.artists) 
      : 'Unknown';
    
    const hasSpanishGenres = album.genres && Array.isArray(album.genres) && 
      album.genres.some(g => g.toLowerCase().includes('latin') || g.toLowerCase().includes('reggaeton'));
    
    return {
      artistNames,
      hasSpanishGenres,
      genres: album.genres || 'No genres'
    };
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
                {topAlbums.map((album, index) => {
                  const classification = manuallyClassifyAlbum(album);
                  return (
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
                          <div className="text-md text-gray-500 mt-1">
                            by {classification.artistNames}
                          </div>
                          {album.genres && album.genres.length > 0 && (
                            <div className="text-sm text-amber-600 mt-1">
                              Genres: {Array.isArray(album.genres) ? album.genres.join(', ') : album.genres}
                            </div>
                          )}
                          <div className="text-xs text-gray-400 mt-1">
                            Classification: {classification.hasSpanishGenres ? 'SPANISH (but in English list)' : 'ENGLISH'}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )
          ) : (
            topSpanishAlbums.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-xl">
                {topAlbums.length === 0 ? 'Loading...' : 'No Spanish albums found in the top rankings.'}
              </div>
            ) : (
              <ul className="space-y-4">
                {topSpanishAlbums.map((album, index) => {
                  const classification = manuallyClassifyAlbum(album);
                  return (
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
                          <div className="text-md text-gray-500 mt-1">
                            by {classification.artistNames}
                          </div>
                          {album.genres && album.genres.length > 0 && (
                            <div className="text-sm text-blue-600 mt-1">
                              Genres: {Array.isArray(album.genres) ? album.genres.join(', ') : album.genres}
                            </div>
                          )}
                          <div className="text-xs text-gray-400 mt-1">
                            Classification: SPANISH ({classification.hasSpanishGenres ? 'by genres' : 'by artist name'})
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )
          )}
        </div>
      </div>
    </main>
  );
};

export default Rankings;