import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { listenToTop100Albums } from '../services/albumService';
import AlbumCard from '../components/AlbumCard';
import UserCard from '../components/UserCard';
import StaticBackground from '../components/StaticBackground';

const Home = () => {
  const [topAlbums, setTopAlbums] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const unsubscribe = loadTopAlbums();
    loadUsers();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const loadTopAlbums = () => {
    const unsubscribe = listenToTop100Albums((albums) => {
      setTopAlbums(albums.slice(0, 20));
    });
    return unsubscribe;
  };

  const loadUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const allUsers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        data: doc.data()
      }));
      
      const shuffledUsers = allUsers.sort(() => 0.5 - Math.random()).slice(0, 20);
      setUsers(shuffledUsers);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  return (
    <main className="pt-32 min-h-screen">
      <StaticBackground />
      
      {/* Welcome Section */}
      <section className="welcome-section py-16 px-8 max-w-6xl mx-auto my-8 bg-white bg-opacity-95 rounded-2xl shadow-2xl text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl text-gray-800 mb-8 font-pacifico leading-tight">
            Discover, rate, and share your favorite music albums with the community
          </h2>
          <Link 
            to="/search" 
            className="inline-block px-12 py-4 bg-blue-500 text-white no-underline rounded-full text-xl font-semibold transition-all duration-300 border-2 border-transparent hover:bg-blue-600 hover:-translate-y-1 hover:shadow-2xl"
          >
            Start Exploring
          </Link>
        </div>
      </section>

      {/* Top Albums Section */}
      <section className="py-12 px-6 max-w-7xl mx-auto my-12 bg-white bg-opacity-90 rounded-2xl shadow-2xl">
        <h2 className="text-4xl text-gray-800 text-center mb-12 font-pacifico">
          Top Rated Albums
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
          {topAlbums.map(album => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>
      </section>

      {/* Community Section */}
      <section className="py-12 px-6 max-w-7xl mx-auto my-12 bg-white bg-opacity-90 rounded-2xl shadow-2xl">
        <h2 className="text-4xl text-gray-800 text-center mb-12 font-pacifico">
          Community Members
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
          {users.map(user => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      </section>
    </main>
  );
};

export default Home;