import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listenToTop100Albums } from '../services/albumService';

const Rankings = () => {
  const [topAlbums, setTopAlbums] = useState([]);
  const [topSpanishAlbums, setTopSpanishAlbums] = useState([]);
  const [activeTab, setActiveTab] = useState('albums'); // 'albums' or 'spanish'
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = listenToTop100Albums((albums) => {
      // Separate albums into two exclusive lists
      const { englishAlbums, spanishAlbums } = separateAlbumsByLanguage(albums);
      setTopAlbums(englishAlbums);
      setTopSpanishAlbums(spanishAlbums);
    });

    return unsubscribe;
  }, []);

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

  // Improved Spanish album detection
  const isSpanishAlbum = (album) => {
    if (!album) return false;

    // Extract artist names properly - handle the actual data structure from Firestore
    let artistNames = '';
    if (Array.isArray(album.artists)) {
      artistNames = album.artists.map(artist => {
        if (typeof artist === 'string') {
          return artist.toLowerCase();
        } else if (artist && typeof artist === 'object') {
          return artist.name?.toLowerCase() || '';
        }
        return '';
      }).join(' ');
    } else {
      artistNames = (album.artists?.toLowerCase() || '');
    }

    // Enhanced known Spanish artists list
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

    // Enhanced Spanish genres
    const spanishGenres = [
      'latin', 'reggaeton', 'bachata', 'salsa', 'merengue', 'flamenco', 
      'ranchera', 'cumbia', 'tango', 'mexican', 'tejano', 'latin pop', 
      'latin urban', 'urbano', 'corrido', 'banda', 'norteño', 'mariachi',
      'vallenato', 'bolero', 'rumba', 'guaracha', 'mambo', 'son cubano',
      'latin rock', 'latin alternative', 'latin jazz', 'trap latino', 'urbano latino'
    ];

    // Check 1: Is the artist a known Spanish artist?
    const isKnownSpanishArtist = knownSpanishArtists.some(artist => 
      artistNames.includes(artist)
    );

    // Check 2: Does the album have Spanish genres?
    const albumGenres = Array.isArray(album.genres) ? album.genres : [];
    const hasSpanishGenre = albumGenres.some(genre => {
      const genreLower = genre.toLowerCase();
      return spanishGenres.some(spanishGenre => 
        genreLower.includes(spanishGenre)
      );
    });

    // Check 3: Spanish language patterns in album name
    const albumName = album.name?.toLowerCase() || '';
    const spanishPatterns = [
      'feat.', 'con ', ' y ', ' del ', ' los ', ' las ', ' el ', ' la ',
      ' mi ', ' tu ', ' su ', ' más ', ' por ', ' para ', ' qué ', ' cómo ',
      ' cuando ', ' dónde ', ' quién ', ' porque ', ' si ', ' no ', ' todo ',
      ' nada ', ' muy ', ' bien ', ' mal ', ' grande ', ' pequeño ', ' amor ',
      ' vida ', ' corazón ', ' mundo ', ' noche ', ' día ', ' tiempo ', ' mujer ',
      ' hombre ', ' casa ', ' calle ', ' ciudad ', ' país ', ' gente ', ' familia '
    ];

    const hasSpanishPatterns = spanishPatterns.some(pattern => 
      albumName.includes(pattern)
    );

    // QUALIFY as Spanish if ANY of these conditions are true
    return isKnownSpanishArtist || hasSpanishGenre || hasSpanishPatterns;
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
                        {album.genres && album.genres.length > 0 && (
                          <div className="text-sm text-amber-600 mt-1">
                            Genres: {Array.isArray(album.genres) ? album.genres.join(', ') : album.genres}
                          </div>
                        )}
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
                        {album.genres && album.genres.length > 0 && (
                          <div className="text-sm text-blue-600 mt-1">
                            Genres: {Array.isArray(album.genres) ? album.genres.join(', ') : album.genres}
                          </div>
                        )}
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