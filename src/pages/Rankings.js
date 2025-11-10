import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listenToTop100Albums } from '../services/albumService';
import { fetchArtistDetails } from '../services/spotify';

const Rankings = () => {
  const [topAlbums, setTopAlbums] = useState([]);
  const [topSpanishAlbums, setTopSpanishAlbums] = useState([]);
  const [activeTab, setActiveTab] = useState('albums'); 
  const [artistGenresMap, setArtistGenresMap] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = listenToTop100Albums((albums) => {
      // Separate albums into two exclusive lists
      const { englishAlbums, spanishAlbums } = separateAlbumsByLanguage(albums);
      setTopAlbums(englishAlbums);
      setTopSpanishAlbums(spanishAlbums);
      
      // Load artist genres for all albums
      loadArtistGenres(albums);
    });

    return unsubscribe;
  }, []);

  // Load artist genres for better language detection
  const loadArtistGenres = async (albums) => {
    try {
      const genresMap = {};
      const artistPromises = [];

      // Get unique artist IDs from all albums
      albums.forEach(album => {
        if (album.artists && album.artists.length > 0) {
          // Handle both string and object artist formats
          const mainArtist = Array.isArray(album.artists) 
            ? (typeof album.artists[0] === 'string' ? { name: album.artists[0] } : album.artists[0])
            : { name: album.artists };
          
          // We'll use the artist name as key since we don't always have ID
          const artistKey = mainArtist.name;
          if (artistKey && !genresMap[artistKey]) {
            // For now, we'll use a known artists approach since we can't always fetch from Spotify
            genresMap[artistKey] = getGenresForKnownArtist(mainArtist.name);
          }
        }
      });

      setArtistGenresMap(genresMap);
    } catch (error) {
      console.error('Error loading artist genres:', error);
    }
  };

  // Enhanced known Spanish/Latin artists detection
  const getGenresForKnownArtist = (artistName) => {
    if (!artistName) return [];
    
    const lowerName = artistName.toLowerCase();
    
    // Comprehensive list of Spanish/Latin artists
    const spanishArtists = {
      'bad bunny': ['reggaeton', 'trap latino', 'urbano latino', 'latin'],
      'anuel aa': ['reggaeton', 'trap latino', 'latin urban'],
      'j balvin': ['reggaeton', 'latin pop'],
      'ozuna': ['reggaeton', 'latin urban'],
      'daddy yankee': ['reggaeton', 'latin'],
      'shakira': ['latin pop', 'pop rock'],
      'enrique iglesias': ['latin pop', 'pop'],
      'ricky martin': ['latin pop', 'pop'],
      'maluma': ['reggaeton', 'latin pop'],
      'karol g': ['reggaeton', 'latin pop'],
      'rosalía': ['flamenco', 'r&b', 'latin pop'],
      'becky g': ['reggaeton', 'latin pop'],
      'nicky jam': ['reggaeton', 'latin'],
      'wisin': ['reggaeton', 'latin'],
      'yandel': ['reggaeton', 'latin'],
      'don omar': ['reggaeton', 'latin'],
      'pitbull': ['reggaeton', 'hip hop', 'pop'],
      'marc anthony': ['salsa', 'latin pop'],
      'romeo santos': ['bachata', 'latin pop'],
      'prince royce': ['bachata', 'latin pop'],
      'juanes': ['latin rock', 'pop rock'],
      'maná': ['latin rock', 'pop rock'],
      'chayanne': ['latin pop', 'pop'],
      'luis fonsi': ['latin pop', 'pop'],
      'thalia': ['latin pop', 'pop'],
      'paulina rubio': ['latin pop', 'pop'],
      'alejandro fernandez': ['ranchera', 'latin pop'],
      'vicente fernandez': ['ranchera', 'mariachi'],
      'carlos vives': ['vallenato', 'latin pop'],
      'fonseca': ['vallenato', 'latin pop'],
      'jesse & joy': ['latin pop', 'pop'],
      'reik': ['latin pop', 'pop'],
      'camila': ['latin pop', 'pop rock'],
      'sin bandera': ['latin pop', 'pop'],
      'la arrolladora': ['norteño', 'regional mexican'],
      'calibre 50': ['norteño', 'regional mexican'],
      'gerardo ortiz': ['norteño', 'regional mexican'],
      'christian nodal': ['mariachi', 'regional mexican'],
      'grupo firme': ['norteño', 'regional mexican'],
      'myke towers': ['reggaeton', 'trap latino'],
      'arcángel': ['reggaeton', 'latin urban'],
      'farruko': ['reggaeton', 'latin urban'],
      'zion & lennox': ['reggaeton', 'latin urban'],
      'tito el bambino': ['reggaeton', 'latin urban'],
      'plan b': ['reggaeton', 'latin urban'],
      'tego calderon': ['reggaeton', 'latin urban'],
      'hector el father': ['reggaeton', 'latin urban'],
      'sech': ['reggaeton', 'latin urban'],
      'rauw alejandro': ['reggaeton', 'latin urban'],
      'c. tangana': ['flamenco', 'latin pop'],
      'aitana': ['latin pop', 'pop'],
      'dani martín': ['latin pop', 'pop'],
      'pablo alborán': ['latin pop', 'pop'],
      'alejandro sanz': ['latin pop', 'flamenco'],
      'emmanuel': ['latin pop', 'balada'],
      'feid': ['reggaeton', 'latin urban'],
      'manuel turizo': ['reggaeton', 'latin pop'],
      'camilo': ['latin pop', 'pop'],
      'natti natasha': ['reggaeton', 'latin pop'],
      'lunay': ['reggaeton', 'latin urban'],
      'lenny tavárez': ['reggaeton', 'latin urban'],
      'dalex': ['reggaeton', 'latin urban'],
      'justin quiles': ['reggaeton', 'latin urban'],
      'mau y ricky': ['latin pop', 'pop']
    };

    // Find matching artist
    for (const [artist, genres] of Object.entries(spanishArtists)) {
      if (lowerName.includes(artist)) {
        return genres;
      }
    }

    return [];
  };

  // Function to separate albums into exclusive English and Spanish lists
  const separateAlbumsByLanguage = (albums) => {
    const spanishAlbums = [];
    const englishAlbums = [];
    
    // First pass: identify all Spanish albums
    const spanishAlbumIds = new Set();
    
    albums.forEach(album => {
      if (isSpanishAlbum(album)) {
        spanishAlbums.push(album);
        spanishAlbumIds.add(album.id);
      }
    });
    
    // Second pass: add only non-Spanish albums to English list
    albums.forEach(album => {
      if (!spanishAlbumIds.has(album.id)) {
        englishAlbums.push(album);
      }
    });
    
    // Take top 100 for each category
    return {
      englishAlbums: englishAlbums.slice(0, 100),
      spanishAlbums: spanishAlbums.slice(0, 100)
    };
  };

  // Improved Spanish album detection based on ARTIST genres
  const isSpanishAlbum = (album) => {
    if (!album) return false;

    // Get main artist name
    let mainArtistName = '';
    if (album.artists) {
      if (Array.isArray(album.artists)) {
        mainArtistName = typeof album.artists[0] === 'string' 
          ? album.artists[0] 
          : album.artists[0]?.name || '';
      } else {
        mainArtistName = album.artists;
      }
    }

    // Check if we have genres for this artist
    const artistGenres = artistGenresMap[mainArtistName] || [];
    
    // Spanish/Latin music genres
    const spanishGenres = [
      'latin', 'reggaeton', 'trap latino', 'urbano latino', 'latin urban', 
      'bachata', 'salsa', 'merengue', 'flamenco', 'ranchera', 'cumbia', 
      'tango', 'mexican', 'tejano', 'latin pop', 'urbano', 'corrido', 
      'banda', 'norteño', 'mariachi', 'vallenato', 'bolero', 'rumba', 
      'guaracha', 'mambo', 'son cubano', 'latin rock', 'latin alternative', 
      'latin jazz', 'trap latino', 'urbano latino'
    ];

    // Check if any of the artist's genres match Spanish genres
    const hasSpanishGenre = artistGenres.some(genre => 
      spanishGenres.some(spanishGenre => 
        genre.toLowerCase().includes(spanishGenre)
      )
    );

    // Enhanced known Spanish artists list for fallback
    const knownSpanishArtists = [
      'bad bunny', 'anuel', 'anuel aa', 'j balvin', 'ozuna', 'daddy yankee', 
      'shakira', 'enrique iglesias', 'ricky martin', 'maluma', 'karol g', 
      'rosalía', 'becky g', 'nicky jam', 'wisin', 'yandel', 'don omar', 
      'pitbull', 'marc anthony', 'romeo santos', 'prince royce', 'juanes', 
      'maná', 'chayanne', 'luis fonsi', 'thalia', 'paulina rubio', 
      'alejandro fernandez', 'vicente fernandez', 'carlos vives', 'fonseca', 
      'jesse & joy', 'reik', 'camila', 'sin bandera', 'la arrolladora',
      'calibre 50', 'gerardo ortiz', 'christian nodal', 'grupo firme',
      'myke towers', 'arcángel', 'farruko', 'zion & lennox', 'tito el bambino',
      'plan b', 'tego calderon', 'hector el father', 'sech', 'rauw alejandro',
      'c. tangana', 'aitana', 'dani martín', 'pablo alborán', 'alejandro sanz',
      'emmanuel', 'feid', 'manuel turizo', 'camilo', 'natti natasha',
      'lunay', 'lenny tavárez', 'dalex', 'justin quiles', 'mau y ricky'
    ];

    // Check if artist is a known Spanish artist
    const isKnownSpanishArtist = knownSpanishArtists.some(artist => 
      mainArtistName.toLowerCase().includes(artist)
    );

    // QUALIFY as Spanish if artist has Spanish genres OR is a known Spanish artist
    return hasSpanishGenre || isKnownSpanishArtist;
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
                        {/* Show detected language indicators */}
                        <div className="text-sm text-amber-600 mt-1">
                          Language: English/International
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
                        {/* Show detected Spanish indicators */}
                        <div className="text-sm text-blue-600 mt-1">
                          Language: Spanish/Latin
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
