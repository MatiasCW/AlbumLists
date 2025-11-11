import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { fetchAlbumDetails, fetchAlbumTracks, fetchArtistDetails } from '../services/spotify';
import { getAlbumRanking } from '../services/albumService';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { doc, getDoc, setDoc, deleteDoc, runTransaction } from 'firebase/firestore';

const AlbumDetail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [album, setAlbum] = useState(null);
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalRanking, setGlobalRanking] = useState(null);
    const [isInList, setIsInList] = useState(false);
    const [userScore, setUserScore] = useState(null);
    const [artistGenres, setArtistGenres] = useState([]);
    const albumId = searchParams.get('albumId');

    useEffect(() => {
        if (albumId) {
            loadAlbumData(albumId);
            loadAlbumRanking(albumId);
            checkIfInList(albumId);
        }
    }, [albumId, user]);

    const loadAlbumData = async (id) => {
        try {
            setLoading(true);
            const albumData = await fetchAlbumDetails(id);
            const tracksData = await fetchAlbumTracks(id);
            setAlbum(albumData);
            setTracks(tracksData.items || []);

            // Load artist genres from the main artist
            if (albumData.artists && albumData.artists.length > 0) {
                const mainArtistData = await fetchArtistDetails(albumData.artists[0].id);
                const genres = mainArtistData.genres || [];
                setArtistGenres(genres);

                // Update Firestore with genres
                await updateFirestoreWithGenres(id, albumData, genres);
            }
        } catch (error) {
            console.error('Error loading album data:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateFirestoreWithGenres = async (albumId, albumData, genres) => {
        try {
            const globalAlbumRef = doc(db, 'albums', albumId);
            const globalAlbumSnap = await getDoc(globalAlbumRef);

            const artists = albumData.artists.map(artist => ({
                id: artist.id,
                name: artist.name
            }));

            const albumUpdateData = {
                name: albumData.name,
                image: albumData.images?.[0]?.url || './media/default-album.jpg',
                artists: artists,
                genres: genres,
                release_date: albumData.release_date,
                lastGenreUpdate: new Date()
            };

            if (globalAlbumSnap.exists()) {
                await setDoc(globalAlbumRef, albumUpdateData, { merge: true });
            } else {
                await setDoc(globalAlbumRef, {
                    ...albumUpdateData,
                    totalScore: 0,
                    numberOfRatings: 0,
                    averageScore: 0,
                    createdAt: new Date()
                });
            }
        } catch (error) {
            console.error('Error updating Firestore with genres:', error);
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

    const checkIfInList = async (id) => {
        if (!user) return;

        try {
            const userAlbumRef = doc(db, 'users', user.uid, 'albums', id);
            const userAlbumSnap = await getDoc(userAlbumRef);

            if (userAlbumSnap.exists()) {
                setIsInList(true);
                setUserScore(userAlbumSnap.data().score || null);
            } else {
                setIsInList(false);
                setUserScore(null);
            }
        } catch (error) {
            console.error('Error checking if album is in list:', error);
        }
    };

    const handleAddRemoveAlbum = async () => {
        if (!user) {
            alert('Please login to manage your album list');
            return;
        }

        try {
            if (isInList) {
                await removeAlbumFromList();
            } else {
                await addAlbumToList();
            }
        } catch (error) {
            console.error('Error managing album:', error);
            alert('Error managing album in your list');
        }
    };

    const addAlbumToList = async () => {
        const userAlbumRef = doc(db, 'users', user.uid, 'albums', albumId);

        const artists = album.artists.map(artist => ({
            id: artist.id,
            name: artist.name
        }));

        await setDoc(userAlbumRef, {
            spotifyId: albumId,
            name: album.name,
            image: album.images?.[0]?.url || './media/default-album.jpg',
            release_date: album.release_date,
            artists: artists,
            genres: artistGenres,
            addedAt: new Date(),
            score: null
        });

        setIsInList(true);
    };

    const removeAlbumFromList = async () => {
        const userAlbumRef = doc(db, 'users', user.uid, 'albums', albumId);
        const userAlbumSnap = await getDoc(userAlbumRef);

        if (!userAlbumSnap.exists()) return;

        const globalAlbumRef = doc(db, 'albums', albumId);
        const userRatingRef = doc(globalAlbumRef, 'ratings', user.uid);

        const userRatingSnap = await getDoc(userRatingRef);
        const oldRating = userRatingSnap.exists() ? userRatingSnap.data().rating : null;

        await runTransaction(db, async (transaction) => {
            const albumSnap = await transaction.get(globalAlbumRef);
            if (albumSnap.exists()) {
                const albumData = albumSnap.data();
                let totalScore = Number(albumData.totalScore) || 0;
                let numberOfRatings = Number(albumData.numberOfRatings) || 0;

                if (oldRating !== null) {
                    totalScore -= Number(oldRating) || 0;
                    numberOfRatings = Math.max(numberOfRatings - 1, 0);
                }

                const averageScore = numberOfRatings > 0 ? totalScore / numberOfRatings : 0;

                transaction.set(globalAlbumRef, {
                    ...albumData,
                    totalScore,
                    numberOfRatings,
                    averageScore
                }, { merge: true });
            }

            transaction.delete(userRatingRef);
        });

        await deleteDoc(userAlbumRef);
        setIsInList(false);
        setUserScore(null);
    };

    const handleScoreChange = async (newScore) => {
        if (!user) return;

        const selectedScore = newScore === '-' ? null : Number(newScore);
        const userAlbumRef = doc(db, 'users', user.uid, 'albums', albumId);

        try {
            const userAlbumSnap = await getDoc(userAlbumRef);
            if (!userAlbumSnap.exists()) return;

            await setDoc(userAlbumRef, {
                score: selectedScore
            }, { merge: true });

            const globalAlbumRef = doc(db, 'albums', albumId);
            const userRatingRef = doc(globalAlbumRef, 'ratings', user.uid);

            const userRatingSnap = await getDoc(userRatingRef);
            const oldRating = userRatingSnap.exists() ? userRatingSnap.data().rating : null;

            await runTransaction(db, async (transaction) => {
                const albumSnap = await transaction.get(globalAlbumRef);

                const artists = album.artists.map(artist => ({
                    id: artist.id,
                    name: artist.name
                }));

                const albumData = albumSnap.exists() ? {
                    ...albumSnap.data(),
                    artists: artists,
                    genres: artistGenres,
                    name: album.name,
                    image: album.images?.[0]?.url || './media/default-album.jpg',
                    release_date: album.release_date,
                    lastGenreUpdate: new Date()
                } : {
                    totalScore: 0,
                    numberOfRatings: 0,
                    averageScore: 0,
                    name: album.name,
                    image: album.images?.[0]?.url || './media/default-album.jpg',
                    artists: artists,
                    genres: artistGenres,
                    release_date: album.release_date,
                    createdAt: new Date(),
                    lastGenreUpdate: new Date()
                };

                let totalScore = Number(albumData.totalScore) || 0;
                let numberOfRatings = Number(albumData.numberOfRatings) || 0;

                if (oldRating !== null) {
                    totalScore -= Number(oldRating) || 0;
                }

                if (selectedScore !== null) {
                    const newRating = Number(selectedScore) || 0;
                    totalScore += newRating;
                    if (oldRating === null) numberOfRatings += 1;
                } else {
                    numberOfRatings = Math.max(numberOfRatings - 1, 0);
                }

                totalScore = Math.max(totalScore, 0);
                numberOfRatings = Math.max(numberOfRatings, 0);

                const averageScore = numberOfRatings > 0 ? totalScore / numberOfRatings : 0;

                transaction.set(globalAlbumRef, {
                    ...albumData,
                    totalScore,
                    numberOfRatings,
                    averageScore
                }, { merge: true });

                if (selectedScore !== null) {
                    transaction.set(userRatingRef, { rating: Number(selectedScore) || 0 });
                } else {
                    transaction.delete(userRatingRef);
                }
            });

            setUserScore(selectedScore);
            loadAlbumRanking(albumId);
        } catch (error) {
            console.error("Error updating score:", error);
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
                            <h1 className="text-4xl font-bold text-gray-800 mb-4">{album.name}</h1>

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

                            {/* Add/Remove Button and Score Selection */}
                            <div className="flex items-center space-x-4 mb-8">
                                <button
                                    onClick={handleAddRemoveAlbum}
                                    className={`px-6 py-3 rounded-lg font-semibold transition-colors ${isInList
                                        ? 'bg-red-500 text-white hover:bg-red-600'
                                        : 'bg-green-500 text-white hover:bg-green-600'
                                        }`}
                                >
                                    {isInList ? 'Remove from List' : 'Add to My List'}
                                </button>

                                {isInList && (
                                    <div className="flex items-center space-x-2">
                                        <span className="text-gray-700 font-medium">Your Rating:</span>
                                        <select
                                            value={userScore || '-'}
                                            onChange={(e) => handleScoreChange(e.target.value)}
                                            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {["-", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1"].map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
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
                                {artistGenres.length > 0 && (
                                    <div className="flex items-start">
                                        <strong className="w-32">Genres:</strong>
                                        <span className="capitalize">{artistGenres.join(', ')}</span>
                                    </div>
                                )}
                                {album.popularity !== undefined && (
                                    <div className="flex items-center">
                                        <strong className="w-32">Album Popularity:</strong>
                                        <div className="flex items-center space-x-2">
                                            <span>{album.popularity}%</span>
                                            <div className="w-32 bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-blue-500 h-2 rounded-full"
                                                    style={{ width: `${album.popularity}%` }}
                                                ></div>
                                            </div>
                                        </div>
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